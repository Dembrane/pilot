import os
from typing import List, Optional, Annotated, AsyncGenerator
from logging import getLogger
from datetime import datetime

from fastapi import Form, Request, APIRouter, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import noload, selectinload
from fastapi.responses import StreamingResponse

from dembrane.tasks import task_process_conversation_chunk
from dembrane.utils import CacheWithExpiration, generate_uuid
from dembrane.config import AUDIO_CHUNKS_DIR
from dembrane.schemas import (
    ConversationSchema,
    ConversationChunkSchema,
)
from dembrane.database import (
    ConversationModel,
    ConversationChunkModel,
    DependencyInjectDatabase,
)
from dembrane.audio_utils import get_mime_type_from_file_path
from dembrane.quote_utils import count_tokens
from dembrane.api.exceptions import (
    NoContentFoundException,
    ConversationNotFoundException,
)

logger = getLogger("api.conversation")
ConversationRouter = APIRouter(tags=["conversation"])


@ConversationRouter.get("/{conversation_id}", response_model=ConversationSchema)
async def get_conversation(
    conversation_id: str, db: DependencyInjectDatabase, load_chunks: Optional[bool] = True
) -> ConversationModel:
    if load_chunks:
        conversation = (
            db.query(ConversationModel)
            .options(
                selectinload(ConversationModel.tags),
                selectinload(ConversationModel.chunks),
            )
            .filter(
                ConversationModel.id == conversation_id,
            )
            .first()
        )
    else:
        conversation = (
            db.query(ConversationModel)
            .options(
                noload(ConversationModel.chunks),
                selectinload(ConversationModel.tags),
            )
            .filter(
                ConversationModel.id == conversation_id,
            )
            .first()
        )

    if not conversation:
        raise ConversationNotFoundException

    return conversation


@ConversationRouter.get("/{conversation_id}/chunks", response_model=List[ConversationChunkSchema])
async def get_conversation_chunks(
    conversation_id: str, db: DependencyInjectDatabase
) -> List[ConversationChunkModel]:
    conversation = await get_conversation(conversation_id, db, load_chunks=False)

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
            file_end = min(file_size, end - current_position + 1) if end is not None else file_size

            if file_start < file_size:
                f.seek(file_start)
                while file_start < file_end:
                    chunk_size = min(1024 * 1024, file_end - file_start)  # Read in chunks
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
    # ordered by timestamp
    chunks = await get_conversation_chunks(conversation_id, db)
    file_paths = [chunk.path for chunk in chunks if chunk.path]

    # how does this work when there are multiple files with different types?
    mime_type = get_mime_type_from_file_path(file_paths[0])

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
            media_type=mime_type,
            headers={
                "Content-Range": f"bytes {start}-{end}/{file_size}",
                "Accept-Ranges": "bytes",
                "Content-Length": str(end - start + 1),
            },
            status_code=206,
        )

    return StreamingResponse(stream_audio(file_paths), media_type=mime_type)


@ConversationRouter.get("/{conversation_id}/chunks/{chunk_id}/content")
async def get_conversation_chunk_content(
    request: Request, conversation_id: str, chunk_id: str, db: DependencyInjectDatabase
) -> StreamingResponse:
    conversation = await get_conversation(conversation_id, db, load_chunks=False)

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

    if not chunk.path:
        raise NoContentFoundException

    file_paths = [chunk.path]
    mime_type = get_mime_type_from_file_path(file_paths[0])

    range_header = request.headers.get("Range")
    if range_header:
        start_str, end_str = range_header.replace("bytes=", "").split("-")
        start = int(start_str)
        end = int(end_str) if end_str else None

        file_size = sum(os.path.getsize(path) for path in file_paths)
        if end is None:
            end = file_size - 1

        logger.debug(f"mime_type: {mime_type}")

        return StreamingResponse(
            stream_audio(file_paths, start, end),
            media_type=mime_type,
            headers={
                "Content-Range": f"bytes {start}-{end}/{file_size}",
                "Accept-Ranges": "bytes",
                "Content-Length": str(end - start + 1),
            },
            status_code=206,
        )

    logger.debug(f"mime_type: {mime_type}")
    return StreamingResponse(stream_audio(file_paths), media_type=mime_type)


@ConversationRouter.get("/{conversation_id}/transcript")
async def get_conversation_transcript(conversation_id: str, db: DependencyInjectDatabase) -> str:
    conversation_chunks = await get_conversation_chunks(conversation_id, db)
    transcript = []

    for chunk in conversation_chunks:
        if chunk.transcript:
            transcript.append(chunk.transcript)

    return "\n".join(transcript)


# Initialize the cache
token_count_cache = CacheWithExpiration(ttl=500)


@ConversationRouter.get("/{conversation_id}/token-count")
async def get_conversation_token_count(
    conversation_id: str,
    db: DependencyInjectDatabase,
) -> int:
    # Try to get the token count from the cache
    cached_count = await token_count_cache.get(conversation_id)
    if cached_count is not None:
        return cached_count

    # If not in cache, calculate the token count
    transcript = await get_conversation_transcript(conversation_id, db)
    token_count = count_tokens(transcript)

    # Store the result in the cache
    await token_count_cache.set(conversation_id, token_count)

    return token_count


class UploadConversationBodySchema(BaseModel):
    timestamp: datetime
    content: str


@ConversationRouter.post("/{conversation_id}/upload-text", response_model=ConversationChunkSchema)
async def upload_conversation_text(
    conversation_id: str,
    body: UploadConversationBodySchema,
    db: DependencyInjectDatabase,
) -> ConversationChunkModel:
    conversation = await get_conversation(conversation_id, db, load_chunks=False)

    chunk = ConversationChunkModel(
        id=generate_uuid(),
        conversation_id=conversation.id,
        timestamp=body.timestamp,
        transcript=body.content,
        path=None,
    )

    db.add(chunk)
    db.commit()

    return chunk


@ConversationRouter.post(
    "/{conversation_id}/upload-chunk", response_model=List[ConversationChunkSchema]
)
async def upload_conversation_chunk(
    conversation_id: str,
    chunk: UploadFile,
    timestamp: Annotated[datetime, Form()],
    db: DependencyInjectDatabase,
) -> List[ConversationChunkModel]:
    conversation = await get_conversation(conversation_id, db, load_chunks=False)

    id = generate_uuid()
    file_path = os.path.join(AUDIO_CHUNKS_DIR, conversation.id, f"{id}-{chunk.filename}")

    # ensure the directory exists
    os.makedirs(os.path.dirname(file_path), exist_ok=True)

    # remove unnecessary information from the file_path
    file_path = file_path.split(";")[0]

    with open(file_path, "wb") as f:
        logger.info(f"Saving the file to {file_path}")
        f.write(chunk.file.read())

    chunk = ConversationChunkModel(
        id=id,
        conversation_id=conversation_id,
        timestamp=timestamp,
        path=file_path,
    )

    db.add(chunk)
    db.commit()

    logger.info(f"Add to processing queue: ConversationChunk@{chunk.id}")
    task_process_conversation_chunk.delay(chunk.id)

    return [chunk]
