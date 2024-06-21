from logging import getLogger

from fastapi import (
    APIRouter,
)

from dembrane.api.tag import TagRouter
from dembrane.api.static import StaticRouter
from dembrane.api.project import ProjectRouter
from dembrane.api.session import SessionRouter
from dembrane.api.resource import ResourceRouter
from dembrane.api.conversation import ConversationRouter
from dembrane.api.conversation_chunk import ConversationChunkRouter

logger = getLogger("api")

api = APIRouter()


@api.get("/health")
async def health() -> dict:
    return {"status": "ok"}


api.include_router(SessionRouter, prefix="/session")
api.include_router(ProjectRouter, prefix="/projects")
api.include_router(ResourceRouter, prefix="/resources")
api.include_router(ConversationRouter, prefix="/conversations")
api.include_router(ConversationChunkRouter, prefix="/conversation-chunks")
api.include_router(TagRouter, prefix="/tag")
api.include_router(StaticRouter, prefix="/static")
