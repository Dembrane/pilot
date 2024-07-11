from fastapi import APIRouter

ConversationChunkRouter = APIRouter()


# @ConversationChunkRouter.delete("/{chunk_id}", response_model=ConversationChunkSchema)
# async def delete_conversation_chunk(
#     chunk_id: str,
#     db: DependencyInjectDatabase,
# ) -> ConversationChunkModel:
#     chunk = db.get(ConversationChunkModel, chunk_id)
#     if not chunk:
#         raise ConversationNotFoundException
#     db.delete(chunk)
#     db.commit()
#     return chunk
