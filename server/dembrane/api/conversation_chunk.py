from fastapi import APIRouter

from dembrane.schemas import (
    ConversationChunkSchema,
)
from dembrane.database import (
    ConversationChunkModel,
    DependencyInjectDatabase,
)
from dembrane.api.session import DependencyRequireSession
from dembrane.api.exceptions import ConversationNotFoundException

ConversationChunkRouter = APIRouter()


@ConversationChunkRouter.delete("/{chunk_id}", response_model=ConversationChunkSchema)
async def delete_conversation_chunk(
    chunk_id: str,
    _session: DependencyRequireSession,
    db: DependencyInjectDatabase,
) -> ConversationChunkModel:
    chunk = db.get(ConversationChunkModel, chunk_id)
    if not chunk:
        raise ConversationNotFoundException
    db.delete(chunk)
    db.commit()
    return chunk
