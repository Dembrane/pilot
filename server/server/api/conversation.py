import os
from datetime import datetime
from logging import getLogger
from typing import Annotated, Any, AsyncGenerator, List, Optional
from fastapi import APIRouter, Request, UploadFile, Form
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from server.database import (
    ConversationModel,
    ConversationChunkModel,
    DependencyInjectDatabase,
)
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
async def get_conversation(
    conversation_id: str, db: DependencyInjectDatabase
) -> ConversationModel:
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
async def get_conversation_chunks(
    conversation_id: str, db: DependencyInjectDatabase
) -> List[ConversationChunkModel]:
    conversation = await get_conversation(conversation_id, db)

    chunks = (
        db.query(ConversationChunkModel)
        .filter(
            ConversationChunkModel.conversation_id == conversation.id,
        )
        .order_by(ConversationChunkModel.timestamp)
        .all()
    )

    return chunks


async def stream_audio(
    file_paths: List[str], start: int = 0, end: Optional[int] = None
) -> AsyncGenerator[bytes, None]:
    current_position = 0

    for file_path in file_paths:
        if end is not None and current_position >= end:
            break  # End of the requested range

        with open(file_path, "rb") as f:
            file_size = os.path.getsize(file_path)

            # Calculate the start and end positions within this file
            file_start = max(0, start - current_position)
            file_end = (
                min(file_size, end - current_position + 1)
                if end is not None
                else file_size
            )

            if file_start < file_size:
                f.seek(file_start)
                while file_start < file_end:
                    chunk_size = min(
                        1024 * 1024, file_end - file_start
                    )  # Read in chunks
                    chunk = f.read(chunk_size)
                    if not chunk:
                        break
                    yield chunk
                    file_start += len(chunk)

            current_position += file_size


@ConversationRouter.get("/{conversation_id}/content")
async def get_conversation_content(
    request: Request, conversation_id: str, db: DependencyInjectDatabase
) -> StreamingResponse:
    # Example function to get file paths for a conversation
    # Replace this with your actual function to fetch file paths
    chunks = await get_conversation_chunks(conversation_id, db)
    file_paths = [chunk.path for chunk in chunks]  # Adjust based on actual structure

    range_header = request.headers.get("Range")
    if range_header:
        start_str, end_str = range_header.replace("bytes=", "").split("-")
        start = int(start_str)
        end = int(end_str) if end_str else None

        file_size = sum(os.path.getsize(path) for path in file_paths)
        if end is None:
            end = file_size - 1

        return StreamingResponse(
            stream_audio(file_paths, start, end),
            media_type="audio/webm",
            headers={
                "Content-Range": f"bytes {start}-{end}/{file_size}",
                "Accept-Ranges": "bytes",
                "Content-Length": str(end - start + 1),
            },
            status_code=206,
        )

    return StreamingResponse(stream_audio(file_paths), media_type="audio/webm")


@ConversationRouter.get("/{conversation_id}/chunks/{chunk_id}/content")
async def get_conversation_chunk_content(
    request: Request, conversation_id: str, chunk_id: str, db: DependencyInjectDatabase
) -> StreamingResponse:
    # Example function to get file paths for a conversation
    # Replace this with your actual function to fetch file paths
    conversation = await get_conversation(conversation_id, db)

    chunk = (
        db.query(ConversationChunkModel)
        .filter(
            ConversationChunkModel.conversation_id == conversation.id,
            ConversationChunkModel.id == chunk_id,
        )
        .first()
    )

    if not chunk:
        raise ConversationNotFoundException

    file_paths = [chunk.path]

    range_header = request.headers.get("Range")
    if range_header:
        start_str, end_str = range_header.replace("bytes=", "").split("-")
        start = int(start_str)
        end = int(end_str) if end_str else None

        file_size = sum(os.path.getsize(path) for path in file_paths)
        if end is None:
            end = file_size - 1

        return StreamingResponse(
            stream_audio(file_paths, start, end),
            media_type="audio/webm",
            headers={
                "Content-Range": f"bytes {start}-{end}/{file_size}",
                "Accept-Ranges": "bytes",
                "Content-Length": str(end - start + 1),
            },
            status_code=206,
        )

    return StreamingResponse(stream_audio(file_paths), media_type="audio/webm")


# async def get_duration(file_path: str) -> float:
#     # This command gets the duration using ffprobe, which is part of ffmpeg
#     cmd = [
#         "ffprobe",
#         "-v",
#         "error",
#         "-show_entries",
#         "format=duration",
#         "-of",
#         "default=noprint_wrappers=1:nokey=1",
#         file_path,
#     ]

#     try:
#         # Run the command asynchronously
#         proc = await asyncio.create_subprocess_exec(*cmd, stdout=PIPE, stderr=PIPE)
#         stdout, stderr = await proc.communicate()

#         logger.debug(f"Duration for {file_path}: {stdout.decode().strip()}")

#         if proc.returncode != 0:
#             # Handle non-zero exit codes (errors during execution of ffprobe)
#             raise Exception(f"ffprobe error for {file_path}: {stderr.decode().strip()}")

#         # Convert the duration to float and return
#         return float(stdout.decode().strip())
#     except Exception as e:
#         # Log the error, return 0 or re-raise the exception depending on how you want to handle it
#         print(f"Error getting duration for {file_path}: {e}")
#         return 0.0  # Return zero if you want to continue processing other files, or you could re-raise the exception


# async def get_audio_total_duration(file_paths: List[str]) -> float:
#     total_duration = 0.0

#     # Gather the durations of all files asynchronously, with error handling for each file
#     durations = await asyncio.gather(
#         *(get_duration(fp) for fp in file_paths), return_exceptions=True
#     )

#     # Filter out exceptions and sum the durations to get the total duration
#     total_duration = sum(d for d in durations if isinstance(d, float))

#     return total_duration


# @ConversationRouter.get("/{conversation_id}/duration")
# async def get_conversation_duration(conversation_id: str) -> float:
#     chunks = await get_conversation_chunks(conversation_id)
#     file_paths = [chunk.path for chunk in chunks]

#     total_duration = await get_audio_total_duration(file_paths)

#     return total_duration


class PutConversationRequestBodySchema(BaseModel):
    title: Optional[str]
    description: Optional[str]
    context: Optional[str]


@ConversationRouter.put("/{conversation_id}", response_model=ConversationSchema)
async def update_conversation(
    conversation_id: str,
    body: PutConversationRequestBodySchema,
    session: DependencyRequireSession,
    db: DependencyInjectDatabase,
) -> ConversationModel:
    conversation = await get_conversation(conversation_id, db)

    conversation.title = body.title
    conversation.description = body.description
    conversation.context = body.context

    db.commit()
    return conversation


@ConversationRouter.delete("/{conversation_id}", response_model=ConversationSchema)
async def delete_conversation(
    conversation_id: str,
    session: DependencyRequireSession,
    db: DependencyInjectDatabase,
) -> ConversationModel:
    conversation = await get_conversation(conversation_id, db)
    db.delete(conversation)
    db.commit()
    return conversation


class PostConversationRequestBodySchema(BaseModel):
    timestamp: datetime


@ConversationRouter.post(
    "/{conversation_id}/upload-chunk", response_model=ConversationChunkSchema
)
async def upload_conversation_chunk(
    conversation_id: str,
    chunk: UploadFile,
    timestamp: Annotated[datetime, Form()],
    db: DependencyInjectDatabase,
) -> Any:
    conversation = await get_conversation(conversation_id, db)

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
