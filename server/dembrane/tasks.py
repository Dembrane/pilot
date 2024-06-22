# mypy: disable-error-code="no-untyped-def"
from math import floor
from typing import Any, Tuple, Union, Optional

from celery import Celery, chain, group  # type: ignore
from sqlalchemy.orm import Session
from celery.utils.log import get_task_logger  # type: ignore

import dembrane.tasks_config
from dembrane.utils import generate_uuid, get_utc_timestamp
from dembrane.config import DATABASE_URL, RABBITMQ_URL
from dembrane.database import (
    DatabaseSession,
    ConversationModel,
    ProcessingStatusEnum,
    ConversationChunkModel,
    ProjectAnalysisRunModel,
)
from dembrane.transcribe import transcribe_conversation_chunk
from dembrane.audio_utils import split_audio_chunk
from dembrane.quote_utils import generate_quotes, generate_insights

logger = get_task_logger("celery_tasks")

assert DATABASE_URL is not None

result_backend_url = "db+" + DATABASE_URL


celery_app = Celery(
    "tasks",
    broker=RABBITMQ_URL,
    result_backend=result_backend_url,
)

celery_app.config_from_object(dembrane.tasks_config)


def update_progress(
    self_object: Any,
    current: int,
    total: int,
    message: Optional[str] = None,
):
    """
    Update the progress of a task.

    Args:
        self_object: The task object
        currentStep: The current step
        totalStep: The total number of steps
        message: Optional message to display
    """
    self_object.update_state(
        state="PROGRESS",
        meta={
            "current": current,
            "total": total,
            "percent": floor((current / total) * 100),
            "message": message,
        },
    )


@celery_app.task(
    bind=True,
    retry_backoff=True,
    retry_kwargs={"max_retries": 3},
    ignore_result=True,
)
def task_transcribe_conversation_chunk(self, conversation_chunk_id: str):
    try:
        transcribe_conversation_chunk(conversation_chunk_id)
    except Exception as e:
        raise self.retry(exc=e) from e


@celery_app.task(
    bind=True,
    retry_backoff=True,
    retry_kwargs={"max_retries": 3},
    ignore_result=True,
)
def task_process_conversation_chunk(self, chunk_id: str):
    with DatabaseSession() as db:
        try:
            chunk = db.get(ConversationChunkModel, chunk_id)

            chunk.task_id = self.request.id
            db.commit()

            if chunk is None:
                logger.info(f"Chunk not found: {chunk_id}")
                return None

            split_chunks = split_audio_chunk(db, chunk_id)

            if not split_chunks:
                logger.info(f"No split chunks found for: {chunk_id}")
                return None

            task_signatures = []

            for split_chunk in split_chunks:
                task_signatures.append(task_transcribe_conversation_chunk.si(split_chunk.id))

            result = group(*task_signatures).apply_async()

            chunk.task_id = result.id
            db.commit()

            return result
        except Exception as exc:
            logger.error(f"Error: {exc}")
            db.rollback()
            raise self.retry(exc=exc) from exc


@celery_app.task(
    bind=True,
    retry_backoff=True,
    retry_kwargs={"max_retries": 2},
    ignore_result=True,
)
def task_generate_quotes(
    self,
    project_analysis_run_id: str,
    conversation_id: str,
):
    with DatabaseSession() as db:
        try:
            generate_quotes(db, project_analysis_run_id, conversation_id)
        except Exception as exc:
            logger.error(f"Error: {exc}")
            db.rollback()
            raise self.retry(exc=exc) from exc


@celery_app.task(
    bind=True,
    retry_backoff=True,
    retry_kwargs={"max_retries": 2},
    ignore_result=True,
)
def task_generate_insights(self, project_analysis_run_id: str):
    with DatabaseSession() as db:
        try:
            generate_insights(db, project_analysis_run_id)
        except Exception as exc:
            logger.error(f"Error: {exc}")
            db.rollback()
            raise self.retry(exc=exc) from exc


@celery_app.task(
    bind=True,
    retry_backoff=True,
    retry_kwargs={"max_retries": 5},
)
def task_create_project_library(_self, project_id: str):
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
