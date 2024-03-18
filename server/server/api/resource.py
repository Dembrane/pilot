from logging import getLogger
import os
from typing import List, Optional
from fastapi import APIRouter, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from server.api.session import DependencyRequireSession
from server.database import ProjectModel, ResourceModel, db
from server.schemas import ResourceSchema
from server.api.exceptions import (
    ProjectNotFoundException,
    ResourceContentNotFoundException,
    ResourceFailedToSaveFileException,
    ResourceInvalidFileFormatException,
    ResourceNotFoundException,
)
from server.config import RESOURCE_UPLOADS_DIR
from server.process_resource import (
    ProcessResourceTaskQueueItem,
    process_resource_queue,
)
from server.util import generate_uuid, iter_file_content

logger = getLogger("api.resource")

# this is included in the ProjectRouter
ResourceRouter = APIRouter(tags=["resource"])


@ResourceRouter.get("/{resource_id}", response_model=ResourceSchema)
async def get_resource(
    resource_id: str, session: DependencyRequireSession
) -> ResourceModel:
    resource = (
        db.query(ResourceModel)
        .filter(
            ResourceModel.id == resource_id,
        )
        .first()
    )
    if not resource:
        raise ResourceNotFoundException
    return resource


@ResourceRouter.get("/{resource_id}/content", response_model=ResourceSchema)
async def get_resource_content(
    resource_id: str, session: DependencyRequireSession
) -> StreamingResponse:
    resource = (
        db.query(ResourceModel)
        .filter(
            ResourceModel.id == resource_id,
        )
        .first()
    )

    if not resource:
        raise ResourceNotFoundException

    if not os.path.exists(resource.path):
        logger.error(
            f"Resource file not found: {resource.path} but it exists in the database"
        )
        raise ResourceContentNotFoundException

    if resource.type != "PDF":
        logger.error(f"Invalid file format: {resource.type}")
        raise ResourceInvalidFileFormatException

    return StreamingResponse(
        iter_file_content(resource.path), media_type="application/pdf"
    )


class PutResourceRequestBodySchema(BaseModel):
    title: Optional[str]
    description: Optional[str]
    context: Optional[str]


@ResourceRouter.put("/{resource_id}", response_model=ResourceSchema)
async def update_resource(
    resource_id: str,
    body: PutResourceRequestBodySchema,
    session: DependencyRequireSession,
) -> ResourceModel:
    resource = await get_resource(resource_id, session)

    resource.title = body.title or resource.title
    resource.description = body.description or resource.description
    resource.context = body.context or resource.context

    db.commit()
    return resource


@ResourceRouter.delete("/{resource_id}", response_model=ResourceSchema)
async def delete_resource(
    resource_id: str,
    session: DependencyRequireSession,
) -> ResourceModel:
    resource = await get_resource(resource_id, session)
    db.delete(resource)
    db.commit()
    return resource
