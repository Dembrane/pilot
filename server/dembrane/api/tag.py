from typing import List

from fastapi import APIRouter
from pydantic import BaseModel

from dembrane.schemas import ProjectTagSchema
from dembrane.database import ProjectTagModel, DependencyInjectDatabase
from dembrane.api.session import DependencyRequireSession
from dembrane.api.exceptions import ProjectTagNotFoundException

TagRouter = APIRouter(tags=["project"])


@TagRouter.get("/{tag_id}", response_model=List[ProjectTagSchema])
async def get_tag_by_id(
    tag_id: str, _session: DependencyRequireSession, db: DependencyInjectDatabase
) -> ProjectTagModel:
    tag = db.query(ProjectTagModel).filter(ProjectTagModel.id == tag_id).first()
    if not tag:
        raise ProjectTagNotFoundException
    return tag


class CreateProjectTagRequestBodySchema(BaseModel):
    text: str


@TagRouter.put("/{tag_id}", response_model=ProjectTagSchema)
async def update_tag_by_id(
    tag_id: str,
    body: CreateProjectTagRequestBodySchema,
    session: DependencyRequireSession,
    db: DependencyInjectDatabase,
) -> ProjectTagModel:
    tag = await get_tag_by_id(tag_id, session, db)

    tag.text = body.text
    db.commit()

    return tag


@TagRouter.delete("/{tag_id}", response_model=ProjectTagSchema)
async def delete_tag_by_id(
    tag_id: str,
    session: DependencyRequireSession,
    db: DependencyInjectDatabase,
) -> ProjectTagModel:
    tag = await get_tag_by_id(tag_id, session, db)

    db.delete(tag)
    db.commit()

    return tag
