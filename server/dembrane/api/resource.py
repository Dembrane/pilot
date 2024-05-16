from logging import getLogger
import os
from typing import Optional
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dembrane.api.session import DependencyRequireSession
from dembrane.database import ResourceModel, DependencyInjectDatabase
from dembrane.schemas import ResourceSchema
from dembrane.api.exceptions import (
    ResourceContentNotFoundException,
    ResourceInvalidFileFormatException,
    ResourceNotFoundException,
)
from dembrane.utils import iter_file_content

logger = getLogger("api.resource")

# this is included in the ProjectRouter
ResourceRouter = APIRouter(tags=["resource"])


@ResourceRouter.get("/{resource_id}", response_model=ResourceSchema)
async def get_resource(
    resource_id: str, session: DependencyRequireSession, db: DependencyInjectDatabase
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
    resource_id: str, session: DependencyRequireSession, db: DependencyInjectDatabase
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
    db: DependencyInjectDatabase,
) -> ResourceModel:
    resource = await get_resource(resource_id, session, db)

    resource.title = body.title or resource.title
    resource.description = body.description or resource.description
    resource.context = body.context or resource.context

    db.commit()
    return resource


@ResourceRouter.delete("/{resource_id}", response_model=ResourceSchema)
async def delete_resource(
    resource_id: str, session: DependencyRequireSession, db: DependencyInjectDatabase
) -> ResourceModel:
    resource = await get_resource(resource_id, session, db)
    db.delete(resource)
    db.commit()
    return resource
