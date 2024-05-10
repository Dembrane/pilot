from fastapi import APIRouter
from server.database import (
    ConversationChunkModel,
    DependencyInjectDatabase,
)
from server.schemas import (
    ConversationChunkSchema,
)

from server.api.session import DependencyRequireSession

ConversationChunkRouter = APIRouter()


@ConversationChunkRouter.delete("/{chunk_id}", response_model=ConversationChunkSchema)
async def delete_conversation_chunk(
    chunk_id: str,
    session: DependencyRequireSession,
    db: DependencyInjectDatabase,
) -> ConversationChunkModel:
    chunk = db.get(ConversationChunkModel, chunk_id)
    db.delete(chunk)
    db.commit()
    return chunk
