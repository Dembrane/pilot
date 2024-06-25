# mypy: disable-error-code="no-untyped-def"
from math import floor
from typing import Any, List, Optional

from celery import Celery, chain, chord, group  # type: ignore
from sentry_sdk import capture_exception
from celery.utils.log import get_task_logger  # type: ignore

import dembrane.tasks_config
from dembrane.utils import generate_uuid
from dembrane.config import REDIS_URL, RABBITMQ_URL
from dembrane.database import (
    AspectModel,
    InsightModel,
    DatabaseSession,
    ConversationModel,
    ConversationChunkModel,
    ProjectAnalysisRunModel,
)
from dembrane.transcribe import transcribe_conversation_chunk
from dembrane.audio_utils import split_audio_chunk
from dembrane.quote_utils import (
    assign_aspect_centroid,
    cluster_quotes_using_aspect_centroids,
    generate_quotes,
    initialize_view,
    initialize_insights,
    generate_view_extras,
    generate_aspect_extras,
    generate_insight_extras,
)

logger = get_task_logger("celery_tasks")

assert RABBITMQ_URL, "RABBITMQ_URL environment variable is not set"
assert REDIS_URL, "REDIS_URL environment variable is not set"

celery_app = Celery("tasks", broker=RABBITMQ_URL, result_backend=REDIS_URL + "/0")

celery_app.config_from_object(dembrane.tasks_config)


class BaseTask(celery_app.Task):
    """Abstract base class for all tasks in my app."""

    abstract = True

    def on_retry(self, exc, task_id, args, kwargs, einfo):
        """Log the exceptions to sentry at retry."""
        capture_exception(exc)
        super(BaseTask, self).on_retry(exc, task_id, args, kwargs, einfo)

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """Log the exceptions to sentry."""
        capture_exception(exc)
        super(BaseTask, self).on_failure(exc, task_id, args, kwargs, einfo)


@celery_app.task(
    bind=True,
    retry_backoff=True,
    ignore_result=True,
    base=BaseTask,
)
def log_error(_self, exc: Exception):
    logger.error(f"Error: {exc}")
    raise exc


# def update_progress(
#     self_object: Any,
#     current: int,
#     total: int,
#     message: Optional[str] = None,
# ):
#     """
#     Update the progress of a task.

#     Args:
#         self_object: The task object
#         currentStep: The current step
#         totalStep: The total number of steps
#         message: Optional message to display
#     """
#     self_object.update_state(
#         state="PROGRESS",
#         meta={
#             "current": current,
#             "total": total,
#             "percent": floor((current / total) * 100),
#             "message": message,
#         },
#     )


@celery_app.task(
    bind=True,
    retry_backoff=True,
    ignore_result=True,
    base=BaseTask,
)
def task_transcribe_conversation_chunk(self, conversation_chunk_id: str):
    try:
        transcribe_conversation_chunk(conversation_chunk_id)
    except (ValueError, FileNotFoundError) as e:
        raise e
    except Exception as e:
        raise self.retry(exc=e) from e


@celery_app.task(
    bind=True,
    retry_backoff=True,
    ignore_result=True,
    base=BaseTask,
)
def task_transcribe_conversation_chunks(self, conversation_chunk_id: List[str]):
    try:
        task_signatures = [
            task_transcribe_conversation_chunk.si(chunk_id).on_error(log_error.s())
            for chunk_id in conversation_chunk_id
        ]

        g = group(*task_signatures)

        result = g.apply_async()

        return result
    except (ValueError, FileNotFoundError) as e:
        raise e
    except Exception as e:
        raise self.retry(exc=e) from e


@celery_app.task(
    bind=True,
    retry_backoff=True,
    ignore_result=False,
    base=BaseTask,
)
def task_split_audio_chunk(self, chunk_id: str) -> List[str]:
    """
    Split audio chunk into smaller chunks. Returns the list of split chunks.
    """
    with DatabaseSession() as db:
        try:
            chunks = split_audio_chunk(db, chunk_id)
            return [chunk.id for chunk in chunks]
        except Exception as exc:
            logger.error(f"Error: {exc}")
            db.rollback()
            raise self.retry(exc=exc) from exc


@celery_app.task(
    bind=True,
    retry_backoff=True,
    ignore_result=True,
    base=BaseTask,
)
def task_process_conversation_chunk(self, chunk_id: str):
    with DatabaseSession() as db:
        try:
            chunk = db.get(ConversationChunkModel, chunk_id)

            if chunk is None:
                logger.info(f"Chunk not found: {chunk_id}")
                return None

            chunk.task_id = self.request.id
            db.commit()

            c = chain(
                task_split_audio_chunk.s(chunk_id),
                task_transcribe_conversation_chunks.s(),
            )

            result = c.apply_async()

            return result
        except Exception as exc:
            logger.error(f"Error: {exc}")
            db.rollback()
            raise self.retry(exc=exc) from exc


@celery_app.task(
    bind=True,
    retry_backoff=True,
    retry_kwargs={"max_retries": 2},
    ignore_result=False,
    base=BaseTask,
)
def task_generate_quotes(
    self,
    project_analysis_run_id: str,
    conversation_id: str,
):
    with DatabaseSession() as db:
        try:
            generate_quotes(db, project_analysis_run_id, conversation_id)
        # FIXME - Add specific exceptions
        except Exception as exc:
            logger.error(f"Error: {exc}")
            db.rollback()
            raise self.retry(exc=exc) from exc


@celery_app.task(
    bind=True,
    retry_backoff=True,
    retry_kwargs={"max_retries": 3},
    ignore_result=False,
    base=BaseTask,
)
def task_generate_insight_extras(self, insight_id: str):
    with DatabaseSession() as db:
        try:
            generate_insight_extras(db, insight_id)
        except Exception as exc:
            logger.error(f"Error: {exc}")
            db.rollback()
            raise self.retry(exc=exc) from exc


@celery_app.task(
    bind=True,
    retry_backoff=True,
    retry_kwargs={"max_retries": 3},
    ignore_result=True,
    base=BaseTask,
)
def task_generate_insight_extras_multiple(self, insight_ids: List[str]):
    with DatabaseSession() as db:
        try:
            task_signatures = [
                task_generate_insight_extras.si(insight_id).on_error(log_error.s())
                for insight_id in insight_ids
            ]

            result = group(*task_signatures).apply_async()

            return result
        except Exception as exc:
            logger.error(f"Error: {exc}")
            db.rollback()
            raise self.retry(exc=exc) from exc


# task_initialize_insights


@celery_app.task(
    bind=True,
    retry_backoff=True,
    retry_kwargs={"max_retries": 3},
    ignore_result=False,
    base=BaseTask,
)
def task_initialize_insights(self, project_analysis_run_id: str) -> List[str]:
    with DatabaseSession() as db:
        try:
            return initialize_insights(db, project_analysis_run_id)
        except Exception as exc:
            logger.error(f"Error: {exc}")
            db.rollback()
            raise self.retry(exc=exc) from exc


@celery_app.task(
    bind=True,
    retry_backoff=True,
    retry_kwargs={"max_retries": 3},
    ignore_result=False,
    base=BaseTask,
)
def task_generate_insights(self, project_analysis_run_id: str):
    with DatabaseSession() as db:
        try:
            job = chain(
                task_initialize_insights.si(project_analysis_run_id),
                task_generate_insight_extras_multiple.s(),
            )

            result = job.apply_async()

            return result

        except Exception as exc:
            logger.error(f"Error: {exc}")
            db.rollback()
            raise self.retry(exc=exc) from exc


# @celery_app.task(
#     bind=True,
#     retry_backoff=True,
#     retry_kwargs={"max_retries": 2},
#     ignore_result=False,
#     base=BaseTask,
# )
# def task_assign_aspect_centroids_and_cluster_quotes(self, project_analysis_run_id: str, view_id: str):
#     with DatabaseSession() as db:
#         try:
#             assign_aspect_centroids_and_cluster_quotes(db, project_analysis_run_id, view_id)
#         except Exception as exc:
#             logger.error(f"Error: {exc}")
#             db.rollback()
#             raise self.retry(exc=exc) from exc


@celery_app.task(
    bind=True,
    retry_backoff=True,
    retry_kwargs={"max_retries": 3},
    ignore_result=False,
    base=BaseTask,
)
def task_generate_aspect_extras(self, aspect_id: str):
    with DatabaseSession() as db:
        try:
            generate_aspect_extras(db, aspect_id)
        except Exception as exc:
            logger.error(f"Error: {exc}")
            db.rollback()
            raise self.retry(exc=exc) from exc


@celery_app.task(
    bind=True,
    retry_backoff=True,
    retry_kwargs={"max_retries": 3},
    ignore_result=False,
    base=BaseTask,
)
def task_generate_view_extras(self, view_id: str):
    with DatabaseSession() as db:
        try:
            generate_view_extras(db, view_id)
        except Exception as exc:
            logger.error(f"Error: {exc}")
            db.rollback()
            raise self.retry(exc=exc) from exc


@celery_app.task(
    bind=True,
    retry_backoff=True,
    retry_kwargs={"max_retries": 3},
    ignore_result=False,
    base=BaseTask,
)
def task_assign_aspect_centroid(self, aspect_id: str):
    with DatabaseSession() as db:
        try:
            assign_aspect_centroid(db, aspect_id)
        except Exception as exc:
            logger.error(f"Error: {exc}")
            db.rollback()
            raise self.retry(exc=exc) from exc


@celery_app.task(
    bind=True,
    retry_backoff=True,
    retry_kwargs={"max_retries": 3},
    ignore_result=False,
    base=BaseTask,
)
def task_cluster_quotes_using_aspect_centroids(self, view_id: str):
    with DatabaseSession() as db:
        try:
            cluster_quotes_using_aspect_centroids(db, view_id)
        except Exception as exc:
            logger.error(f"Error: {exc}")
            db.rollback()
            raise self.retry(exc=exc) from exc


@celery_app.task(
    bind=True,
    retry_backoff=True,
    retry_kwargs={"max_retries": 3},
    ignore_result=False,
    base=BaseTask,
)
def task_create_view(self, project_analysis_run_id: str, user_query: str, user_query_context: str):
    with DatabaseSession() as db:
        try:
            project_analysis_run = db.get(ProjectAnalysisRunModel, project_analysis_run_id)

            if project_analysis_run is None:
                logger.info(f"Project analysis run not found: {project_analysis_run_id}")
                return None

            # FIXME: update_progress(self, 1, 4, message="Creating view")
            # TODO: convert to task
            view = initialize_view(db, project_analysis_run_id, user_query, user_query_context)
            view.task_id = self.request.id
            db.commit()

            # update_progress(self, 2, 4, message="Clustering quotes")

            aspect_ids = [aspect.id for aspect in view.aspects]
            aspect_jobs = [task_assign_aspect_centroid.si(aspect_id) for aspect_id in aspect_ids]

            # update_progress(self, 3, 4, message="Clustering quotes")

            aspects = db.query(AspectModel).filter(AspectModel.view_id == view.id).all()
            aspect_extra_jobs = [task_generate_aspect_extras.si(aspect.id) for aspect in aspects]

            result = chord(
                chord(group(*aspect_jobs), task_cluster_quotes_using_aspect_centroids.si(view.id)),
                chord(group(*aspect_extra_jobs), task_generate_view_extras.si(view.id)),
            ).apply_async()

            logger.debug(result)

            # update_progress(self, 4, 4, message="Analysing results")

            return result

        except Exception as e:
            logger.error(f"Error: {e}")
            db.rollback()
            raise


@celery_app.task(
    bind=True,
    retry_backoff=True,
    ignore_result=False,
    base=BaseTask,
)
def task_generate_insights_and_initial_views(self, project_analysis_run_id: str):
    insight_task = task_generate_insights.si(project_analysis_run_id)

    sentiment_view = task_create_view.si(project_analysis_run_id, "Sentiment", "Use only 3")

    theme_view = task_create_view.si(
        project_analysis_run_id,
        "Recurring Themes",
        "I will use these to make a detailed report. Give me around 15-20 aspects.",
    )

    job = group(
        insight_task,
        sentiment_view,
        theme_view,
    )

    result = job.apply_async()

    return result


@celery_app.task(bind=True, retry_backoff=True, ignore_result=False, base=BaseTask)
def task_create_project_library(self, project_id: str):
    with DatabaseSession() as db:
        try:
            project_analysis_run = ProjectAnalysisRunModel(
                id=generate_uuid(),
                project_id=project_id,
            )

            db.add(project_analysis_run)
            db.commit()

            conversations = (
                db.query(ConversationModel).filter(ConversationModel.project_id == project_id).all()
            )

            quote_s_list = []

            for conversation in conversations:
                quote_s_list.append(
                    task_generate_quotes.si(project_analysis_run.id, conversation.id)
                )

            g = group(*quote_s_list)

            if not quote_s_list:
                logger.info(f"No conversations to process for project: {project_id}")
                return

            callback = task_generate_insights_and_initial_views.si(project_analysis_run.id)

            result = chord(g)(callback.on_error(log_error.s()))

            return result

        except Exception as e:
            logger.error(f"Error: {e}")
            db.rollback()
            raise
