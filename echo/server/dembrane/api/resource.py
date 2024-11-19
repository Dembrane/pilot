import os
from typing import Optional
from logging import getLogger

from fastapi import APIRouter
from pydantic import BaseModel
from fastapi.responses import StreamingResponse

from dembrane.utils import iter_file_content
from dembrane.schemas import ResourceSchema
from dembrane.database import ResourceModel, DependencyInjectDatabase
from dembrane.api.exceptions import (
    ResourceNotFoundException,
    ResourceContentNotFoundException,
    ResourceInvalidFileFormatException,
)

logger = getLogger("api.resource")

# this is included in the ProjectRouter
ResourceRouter = APIRouter(tags=["resource"])


@ResourceRouter.get("/{resource_id}", response_model=ResourceSchema)
async def get_resource(resource_id: str, db: DependencyInjectDatabase) -> ResourceModel:
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
async def get_resource_content(resource_id: str, db: DependencyInjectDatabase) -> StreamingResponse:
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
        logger.error(f"Resource file not found: {resource.path} but it exists in the database")
        raise ResourceContentNotFoundException

    if resource.type != "PDF":
        logger.error(f"Invalid file format: {resource.type}")
        raise ResourceInvalidFileFormatException

    return StreamingResponse(iter_file_content(resource.path), media_type="application/pdf")


class PutResourceRequestBodySchema(BaseModel):
    title: Optional[str]
    description: Optional[str]
    context: Optional[str]


@ResourceRouter.put("/{resource_id}", response_model=ResourceSchema)
async def update_resource(
    resource_id: str,
    body: PutResourceRequestBodySchema,
    db: DependencyInjectDatabase,
) -> ResourceModel:
    resource = await get_resource(resource_id, db)

    resource.title = body.title or resource.title
    resource.description = body.description or resource.description
    resource.context = body.context or resource.context

    db.commit()
    return resource


@ResourceRouter.delete("/{resource_id}", response_model=ResourceSchema)
async def delete_resource(resource_id: str, db: DependencyInjectDatabase) -> ResourceModel:
    resource = await get_resource(resource_id, db)
    db.delete(resource)
    db.commit()
    return resource
