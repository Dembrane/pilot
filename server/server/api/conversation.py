from datetime import datetime
from logging import getLogger
import os
from typing import Annotated, Any, List, Optional
from fastapi import APIRouter, UploadFile, Form
from pydantic import BaseModel
from server.database import ConversationModel, db, ConversationChunkModel
from server.schemas import ConversationChunkSchema, ConversationSchema
from server.api.session import DependencyRequireSession
from server.api.exceptions import (
    ConversationNotFoundException,
)
from server.config import AUDIO_CHUNKS_DIR
from server.util import generate_uuid
from server.process_conversation_chunk import (
    ProcessConversationChunkTaskQueueItem,
    process_conversation_chunk_queue,
)


logger = getLogger("api.conversation")
ConversationRouter = APIRouter(tags=["conversation"])


@ConversationRouter.get("/{conversation_id}", response_model=ConversationSchema)
async def get_conversation(conversation_id: str) -> ConversationModel:
    conversation = (
        db.query(ConversationModel)
        .filter(
            ConversationModel.id == conversation_id,
        )
        .first()
    )
    if not conversation:
        raise ConversationNotFoundException
    return conversation


@ConversationRouter.get(
    "/{conversation_id}/chunks", response_model=List[ConversationChunkSchema]
)
async def get_conversation_chunks(conversation_id: str) -> List[ConversationChunkModel]:
    conversation = await get_conversation(conversation_id)

    chunks = (
        db.query(ConversationChunkModel)
        .filter(
            ConversationChunkModel.conversation_id == conversation.id,
        )
        .order_by(ConversationChunkModel.timestamp)
        .all()
    )

    return chunks


# @ConversationRouter.get("/{conversation_id}/content", response_model=ConversationSchema)
# async def get_conversation_content(
#     conversation_id: str, session: DependencyRequireSession
# ) -> StreamingResponse:
#     conversation = (
#         db.query(ConversationModel)
#         .filter(
#             ConversationModel.id == conversation_id,
#         )
#         .first()
#     )

#     if not conversation:
#         raise ConversationNotFoundException

#     if not os.path.exists(conversation.path):
#         logger.error(
#             f"Conversation file not found: {conversation.path} but it exists in the database"
#         )
#         raise ConversationContentNotFoundException

#     if conversation.type != "PDF":
#         logger.error(f"Invalid file format: {conversation.type}")
#         raise ConversationInvalidFileFormatException

#     return StreamingResponse(
#         iter_file_content(conversation.path), media_type="application/pdf"
#     )


class PutConversationRequestBodySchema(BaseModel):
    title: Optional[str]
    description: Optional[str]
    context: Optional[str]


@ConversationRouter.put("/{conversation_id}", response_model=ConversationSchema)
async def update_conversation(
    conversation_id: str,
    body: PutConversationRequestBodySchema,
    session: DependencyRequireSession,
) -> ConversationModel:
    conversation = await get_conversation(conversation_id)

    conversation.title = body.title or conversation.title
    conversation.description = body.description or conversation.description
    conversation.context = body.context or conversation.context

    db.commit()
    return conversation


@ConversationRouter.delete("/{conversation_id}", response_model=ConversationSchema)
async def delete_conversation(
    conversation_id: str,
    session: DependencyRequireSession,
) -> ConversationModel:
    conversation = await get_conversation(conversation_id)
    db.delete(conversation)
    db.commit()
    return conversation


class PostConversationRequestBodySchema(BaseModel):
    timestamp: datetime


@ConversationRouter.post(
    "/{conversation_id}/upload-chunk", response_model=ConversationChunkSchema
)
async def upload_conversation_chunk(
    conversation_id: str, chunk: UploadFile, timestamp: Annotated[datetime, Form()]
) -> Any:
    conversation = await get_conversation(conversation_id)

    if not os.path.exists(os.path.join(AUDIO_CHUNKS_DIR, conversation.id)):
        os.makedirs(os.path.join(AUDIO_CHUNKS_DIR, conversation.id))

    id = generate_uuid()
    file_path = os.path.join(
        AUDIO_CHUNKS_DIR, conversation.id, f"{id}-{chunk.filename}"
    )

    file_path = file_path.split(";")[0]

    with open(file_path, "wb") as f:
        f.write(chunk.file.read())

    chunk = ConversationChunkModel(
        id=id,
        conversation_id=conversation_id,
        timestamp=timestamp,
        path=file_path,
    )

    db.add(chunk)
    db.commit()

    process_conversation_chunk_queue.add_task(
        ProcessConversationChunkTaskQueueItem(chunk=chunk)
    )

    logger.info(f"Saving the file to {file_path}")

    return chunk


# async def upload_resources(
#     , project_id: str, session: DependencyRequireSession
# ) -> List[ResourceModel]:
#     resources = []

#     for file in files:
#         if not file.filename is None:
#             original_filename = file.filename

#             if not file.filename.endswith(".pdf"):
#                 raise ResourceInvalidFileFormatException

#             file_name = file.filename.replace(" ", "_")
#             type = "PDF"
#             file_path = os.path.join(RESOURCE_UPLOADS_DIR, file_name)
#             uuid = generate_uuid()

#             if os.path.exists(file_path):
#                 logger.info(f"{file_path} already exists. Generating a unique filename")
#                 unique_filename = uuid + "_" + file_name
#                 file_path = os.path.join(RESOURCE_UPLOADS_DIR, unique_filename)

#             file_content = await file.read()

#             try:
#                 with open(file_path, "wb") as f:
#                     logger.info(f"Saving the file to {file_path}")
#                     f.write(file_content)

#                 resource = ResourceModel(
#                     id=uuid,
#                     project_id=project_id,
#                     # initialize title with original filename
#                     # doc will be summarized and title would be updated later
#                     original_filename=original_filename,
#                     type=type,
#                     path=file_path,
#                     title=original_filename,
#                 )
#                 db.add(resource)
#                 db.commit()
#                 resources.append(resource)

#                 process_resource_queue.add_task(
#                     ProcessResourceTaskQueueItem(resource=resource)
#                 )

#             except Exception as e:
#                 logger.error(f"Failed to save the file: {e}")
#                 raise ResourceFailedToSaveFileException

#     db.commit()
#     return resources
