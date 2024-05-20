from fastapi import APIRouter

from dembrane.schemas import (
    ConversationChunkSchema,
)
from dembrane.database import (
    ConversationChunkModel,
    DependencyInjectDatabase,
)

ConversationChunkRouter = APIRouter()


@ConversationChunkRouter.delete("/{chunk_id}", response_model=ConversationChunkSchema)
async def delete_conversation_chunk(
    chunk_id: str,
    db: DependencyInjectDatabase,
) -> ConversationChunkModel:
    chunk = db.get(ConversationChunkModel, chunk_id)
    db.delete(chunk)
    db.commit()
    return chunk
