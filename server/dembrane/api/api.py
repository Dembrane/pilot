from logging import getLogger

from fastapi import (
    APIRouter,
)

from dembrane.api.fn import FnRouter
from dembrane.api.tag import TagRouter
from dembrane.api.chat import ChatRouter
from dembrane.api.static import StaticRouter
from dembrane.api.project import ProjectRouter
from dembrane.api.resource import ResourceRouter
from dembrane.api.participant import ParticipantRouter
from dembrane.api.conversation import ConversationRouter
from dembrane.api.conversation_chunk import ConversationChunkRouter

logger = getLogger("api")

api = APIRouter()


@api.get("/health")
async def health() -> dict:
    return {"status": "ok"}


api.include_router(FnRouter, prefix="/fn")
api.include_router(TagRouter, prefix="/tag")
api.include_router(ChatRouter, prefix="/chats")
api.include_router(StaticRouter, prefix="/static")
api.include_router(ProjectRouter, prefix="/projects")
api.include_router(ResourceRouter, prefix="/resources")
api.include_router(ParticipantRouter, prefix="/participant")
api.include_router(ConversationRouter, prefix="/conversations")
api.include_router(ConversationChunkRouter, prefix="/conversation-chunks")
