import os
from datetime import datetime
from logging import getLogger
from typing import Annotated, Any, AsyncGenerator, List, Optional
from fastapi import APIRouter, Request, UploadFile, Form
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import joinedload
from server.database import (
    ConversationModel,
    ConversationChunkModel,
    DependencyInjectDatabase,
    ProjectAnalysisRunModel,
    QuoteModel,
)
from server.schemas import (
    ConversationChunkSchema,
    ConversationSchema,
    QuoteSchema,
)

from server.api.session import DependencyRequireSession
from server.api.exceptions import (
    ConversationNotFoundException,
)
from server.config import AUDIO_CHUNKS_DIR
from server.audio_utils import get_mime_type_from_file_path
from server.tasks import process_conversation_chunk
from server.utils import generate_uuid

logger = getLogger("api.conversation")
ConversationRouter = APIRouter(tags=["conversation"])


@ConversationRouter.get("/{conversation_id}", response_model=ConversationSchema)
async def get_conversation(
    conversation_id: str, db: DependencyInjectDatabase
) -> ConversationModel:
    conversation = (
        db.query(ConversationModel)
        .options(
            joinedload(ConversationModel.tags),
        )
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
    # ordered by timestamp
    chunks = await get_conversation_chunks(conversation_id, db)
    file_paths = [chunk.path for chunk in chunks]

    range_header = request.headers.get("Range")
    if range_header:
        start_str, end_str = range_header.replace("bytes=", "").split("-")
        start = int(start_str)
        end = int(end_str) if end_str else None

        file_size = sum(os.path.getsize(path) for path in file_paths)
        if end is None:
            end = file_size - 1

        # how does this work when there are multiple files with different sizes?
        mime_type = get_mime_type_from_file_path(file_paths[0])

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

        mime_type = get_mime_type_from_file_path(file_paths[0])
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
    process_conversation_chunk.delay(chunk.id)

    return chunk


@ConversationRouter.get("/{conversation_id}/quotes", response_model=List[QuoteSchema])
async def get_conversation_quotes(
    conversation_id: str,
    db: DependencyInjectDatabase,
    session: DependencyRequireSession,
) -> List[QuoteModel]:
    conversation = await get_conversation(conversation_id, db)

    project_id = conversation.project_id

    latest_project_analysis = (
        db.query(ProjectAnalysisRunModel)
        .filter(ProjectAnalysisRunModel.project_id == project_id)
        .order_by(ProjectAnalysisRunModel.created_at.desc())
        .first()
    )

    if not latest_project_analysis:
        return []

    quotes = (
        db.query(QuoteModel)
        .options(joinedload(QuoteModel.conversation_chunks))
        .filter(
            QuoteModel.conversation_id == conversation_id,
            QuoteModel.project_analysis_run_id == latest_project_analysis.id,
        )
        .order_by(QuoteModel.created_at.asc())
        .all()
    )

    quotes.sort(
        key=lambda quote: quote.conversation_chunks[0].timestamp
        if quote.conversation_chunks
        else quote.created_at()
    )

    return quotes
