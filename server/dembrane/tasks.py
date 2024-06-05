# mypy: disable-error-code="no-untyped-def"
import os
from typing import Any, Tuple, Union, Optional

from celery import Celery, chain, group  # type: ignore
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from celery.utils.log import get_task_logger  # type: ignore

from dembrane.utils import generate_uuid, get_utc_timestamp
from dembrane.config import DATABASE_URL, RABBITMQ_URL
from dembrane.database import (
    DatabaseSession,
    ConversationModel,
    ProcessingStatusEnum,
    ConversationChunkModel,
    ProjectAnalysisRunModel,
)
from dembrane.transcribe import TranscriptionError, transcribe_audio
from dembrane.audio_utils import ConversionError, split_audio_chunk
from dembrane.quote_utils import generate_quotes, generate_insights

logger = get_task_logger("celery_tasks")

assert DATABASE_URL is not None
result_backend_url = "db+" + DATABASE_URL
celery_app = Celery("tasks", broker=RABBITMQ_URL, result_backend=result_backend_url)

DEFAULT_WHISPER_PROMPTS = {
    "en": "Hi, lets get started. First we’ll have a round of introductions and then we can get into the topic for today.",
    "nl": "Hallo, laten we beginnen. Eerst even een introductieronde en dan kunnen we aan de slag met de thema van vandaag.",
}


def set_processing_status(
    db: Session,
    model: Union[type[ConversationChunkModel], type[ConversationModel], type[ProjectAnalysisRunModel]],
    id: str,
    status: ProcessingStatusEnum,
    error_message: Optional[str] = None,
) -> None:
    """
    Generalized function to set the processing status for a conversation or conversation chunk.

    :param db: SQLAlchemy Session instance
    :param model: SQLAlchemy model class
    :param status: Processing status enum value (e.g., PROCESSING, DONE, ERROR)
    :param id: ID of the conversation or conversation chunk
    :param error_message: Error message string, default is None
    """
    instance: Any = db.get(model, id)
    instance.processing_status = status
    instance.processing_error = error_message
    if status == ProcessingStatusEnum.PROCESSING:
        instance.processing_started_at = get_utc_timestamp()
        instance.processing_completed_at = None
    else:
        instance.processing_completed_at = get_utc_timestamp()
    db.commit()


def is_conversation_fully_processed(db: Session, conversation_id: str) -> Tuple[bool, str]:
    """
    Check if a conversation is fully processed.

    Args:
        db (Session): SQLAlchemy session
        conversation_id (str): Conversation ID

    Returns:
        Tuple[bool, str]: (is_ready, reason)

    Raises:
        ValueError: Conversation not found
    """
    conversation = db.query(ConversationModel).filter(ConversationModel.id == conversation_id).first()

    if conversation is None:
        raise ValueError("Conversation not found")

    latest_chunk = (
        db.query(ConversationChunkModel)
        .filter(ConversationChunkModel.conversation_id == conversation_id)
        .order_by(ConversationChunkModel.created_at.desc())
        .first()
    )

    if latest_chunk is None:
        return False, "No chunks found"

    if (
        conversation.processing_status == ProcessingStatusEnum.DONE
        and latest_chunk.processing_status == ProcessingStatusEnum.DONE
        and latest_chunk.created < conversation.processing_completed_at
    ):
        return True, "Fully processed"
    else:
        return False, "Not fully processed"


@celery_app.task(
    bind=True,
    retry_backoff=True,
    retry_kwargs={"max_retries": 3},
)
def transcribe_conversation_chunk(self, conversation_chunk_id: str):
    """Process conversation chunk for transcription"""
    with DatabaseSession() as db:
        try:
            chunk = db.get(ConversationChunkModel, conversation_chunk_id)

            if chunk is None:
                return conversation_chunk_id

            if chunk.processing_status == ProcessingStatusEnum.DONE:
                return conversation_chunk_id  # skip already processed chunks for idempotency

            set_processing_status(
                db,
                ConversationChunkModel,
                conversation_chunk_id,
                ProcessingStatusEnum.PROCESSING,
            )

            if not chunk.path:
                return conversation_chunk_id

            if not os.path.exists(chunk.path):
                raise FileNotFoundError(f"File not found: {chunk.path}")

            # fetch conversation details
            conversation = db.query(ConversationModel).filter(ConversationModel.id == chunk.conversation_id).first()
            if conversation is None:
                raise ValueError("Conversation not found")

            project = conversation.project
            language = project.language or "en"
            default_prompt = DEFAULT_WHISPER_PROMPTS.get(language, "")
            whisper_prompt = default_prompt + " " + (conversation.context if conversation.context else "")

            transcription = transcribe_audio(chunk.path, language=language, whisper_prompt=whisper_prompt)

            chunk.transcript = transcription

            set_processing_status(
                db,
                ConversationChunkModel,
                conversation_chunk_id,
                ProcessingStatusEnum.DONE,
            )

            logger.debug(f"Processed chunk: {conversation_chunk_id}")
            return conversation_chunk_id

        except FileNotFoundError as exc:
            logger.error(f"File not found: {exc}")
            db.rollback()
            set_processing_status(
                db,
                ConversationChunkModel,
                conversation_chunk_id,
                ProcessingStatusEnum.ERROR,
                "File not found",
            )
            raise exc

        except (
            ValueError,
            ConversionError,
            TranscriptionError,
        ) as exc:
            logger.error(f"Processing error: {exc}")
            db.rollback()
            set_processing_status(
                db,
                ConversationChunkModel,
                conversation_chunk_id,
                ProcessingStatusEnum.ERROR,
                str(exc),
            )
            raise self.retry(exc=exc) from exc

        except SQLAlchemyError as exc:
            logger.error(f"Database error: {exc}")
            db.rollback()
            set_processing_status(
                db,
                ConversationChunkModel,
                conversation_chunk_id,
                ProcessingStatusEnum.ERROR,
                "Database error during processing",
            )
            raise self.retry(exc=exc) from exc

        except Exception as exc:
            logger.error(f"Unexpected error: {exc}")
            db.rollback()
            set_processing_status(
                db,
                ConversationChunkModel,
                conversation_chunk_id,
                ProcessingStatusEnum.ERROR,
                "Unexpected error",
            )
            raise self.retry(exc=exc) from exc


@celery_app.task(
    bind=True,
    retry_backoff=True,
    retry_kwargs={"max_retries": 5},
)
def process_conversation_chunk(self, chunk_id: str):
    with DatabaseSession() as db:
        try:
            chunk = db.get(ConversationChunkModel, chunk_id)

            if chunk is None:
                return chunk_id

            if chunk.processing_status == ProcessingStatusEnum.DONE:
                return chunk_id

            split_chunks = split_audio_chunk(db, chunk)

            if not split_chunks:
                return chunk_id

            task_signatures = []

            for split_chunk in split_chunks:
                task_signatures.append(transcribe_conversation_chunk.si(split_chunk.id))

            result = group(*task_signatures).apply_async()

            return result
        except Exception as exc:
            logger.error(f"Error: {exc}")
            db.rollback()
            raise self.retry(exc=exc) from exc


@celery_app.task(
    bind=True,
    retry_backoff=True,
    retry_kwargs={"max_retries": 5},
)
def process_conversation(
    self,
    project_analysis_run_id: str,
    conversation_id: str,
):
    with DatabaseSession() as db:
        try:
            # ready, reason = is_conversation_ready(db, conversation_id)
            if not True:
                logger.info(
                    # f"Conversation not ready: {conversation_id}, reason: {reason}"
                )
                set_processing_status(
                    db,
                    ConversationModel,
                    conversation_id,
                    ProcessingStatusEnum.ERROR,
                    # f"Conversation not ready: {reason}",
                )
                # raise ValueError(f"Conversation not ready: {reason}")

            is_processed, reason = is_conversation_fully_processed(db, conversation_id)

            if is_processed:
                logger.info(f"Conversation already processed: {conversation_id}, {reason}")
                return conversation_id

            set_processing_status(
                db,
                ConversationModel,
                conversation_id,
                ProcessingStatusEnum.PROCESSING,
            )

            generate_quotes(db, project_analysis_run_id, conversation_id)

            set_processing_status(
                db,
                ConversationModel,
                conversation_id,
                ProcessingStatusEnum.DONE,
            )

        except Exception as exc:
            logger.error(f"Error: {exc}")

            set_processing_status(
                db,
                ConversationModel,
                conversation_id,
                ProcessingStatusEnum.ERROR,
                str(exc),
            )

            db.rollback()
            raise self.retry(exc=exc) from exc


@celery_app.task(
    bind=True,
    retry_backoff=True,
    retry_kwargs={"max_retries": 5},
)
def finalize_project_analysis_run_processing(self, project_analysis_run_id):
    with DatabaseSession() as db:
        try:
            generate_insights(db, project_analysis_run_id)

            set_processing_status(
                db,
                ProjectAnalysisRunModel,
                project_analysis_run_id,
                ProcessingStatusEnum.DONE,
            )

            logger.info(f"Project processing finalized: {project_analysis_run_id}")
        except Exception as exc:
            logger.error(f"Error: {exc}")
            db.rollback()
            raise self.retry(exc=exc) from exc


@celery_app.task(
    bind=True,
    retry_backoff=True,
    retry_kwargs={"max_retries": 5},
)
def process_project(_self, project_id: str):
    with DatabaseSession() as db:
        try:
            project_analysis_run = ProjectAnalysisRunModel(
                id=generate_uuid(),
                project_id=project_id,
                processing_status=ProcessingStatusEnum.PROCESSING,
            )

            db.add(project_analysis_run)
            db.commit()

            conversations = db.query(ConversationModel).filter(ConversationModel.project_id == project_id).all()

            set_processing_status(
                db,
                ProjectAnalysisRunModel,
                project_analysis_run.id,
                ProcessingStatusEnum.PROCESSING,
            )

            task_signatures = []

            for conversation in conversations:
                already_fully_processed, reason = is_conversation_fully_processed(db, conversation.id)
                logger.info(f"Conversation: {conversation.id}, reason: {reason}")

                if already_fully_processed:
                    continue
                else:
                    task_signatures.append(process_conversation.si(project_analysis_run.id, conversation.id))

            if not task_signatures:
                logger.info(f"No conversations to process for project: {project_id}")
                return project_id

            task_chain = chain(
                group(*task_signatures),
                finalize_project_analysis_run_processing.si(project_analysis_run.id),
            )

            result = task_chain.apply_async()

            return result

        except Exception as e:
            logger.error(f"Error: {e}")
            db.rollback()
            raise
