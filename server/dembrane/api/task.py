import logging

from fastapi import APIRouter

TaskRouter = APIRouter()

logger = logging.getLogger("task")


# @TaskRouter.get("/{task_id}", response_model=TaskSchema)
# async def get_task_status(task_id: str) -> TaskSchema:
#     logger.debug("Getting task %s", task_id)

#     if not task_id:
#         raise HTTPException(status_code=404, detail="Task not found")

#     result = celery_app.AsyncResult(task_id)

#     if not result:
#         raise HTTPException(status_code=404, detail="Task not found")

#     return TaskSchema(id=task_id, state=TaskStateEnum(result.state), meta=result.info)
