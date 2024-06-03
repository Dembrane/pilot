import os
import math
from typing import List, Optional, Annotated, AsyncGenerator
from logging import getLogger
from datetime import datetime

import ffmpeg  # type: ignore
from fastapi import Form, Request, APIRouter, UploadFile, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import joinedload
from fastapi.responses import StreamingResponse

from dembrane.tasks import process_conversation_chunk
from dembrane.utils import generate_uuid
from dembrane.config import AUDIO_CHUNKS_DIR
from dembrane.schemas import (
    QuoteSchema,
    ConversationSchema,
    ConversationChunkSchema,
)
from dembrane.database import (
    QuoteModel,
    ConversationModel,
    ConversationChunkModel,
    ProjectAnalysisRunModel,
    DependencyInjectDatabase,
)
from dembrane.api.session import DependencyRequireSession
from dembrane.audio_utils import get_mime_type_from_file_path
from dembrane.api.exceptions import (
    NoContentFoundException,
    ConversationNotFoundException,
)

logger = getLogger("api.conversation")
ConversationRouter = APIRouter(tags=["conversation"])


@ConversationRouter.get("/{conversation_id}", response_model=ConversationSchema)
async def get_conversation(conversation_id: str, db: DependencyInjectDatabase) -> ConversationModel:
    conversation = (
        db.query(ConversationModel)
        .options(
            joinedload(ConversationModel.tags),
            joinedload(ConversationModel.chunks),
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
async def get_conversation_chunks(conversation_id: str, db: DependencyInjectDatabase) -> List[ConversationChunkModel]:
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


async def stream_audio(file_paths: List[str], start: int = 0, end: Optional[int] = None) -> AsyncGenerator[bytes, None]:
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


class PutConversationRequestBodySchema(BaseModel):
    title: Optional[str]
    description: Optional[str]
    context: Optional[str]


@ConversationRouter.put("/{conversation_id}", response_model=ConversationSchema)
async def update_conversation(
    conversation_id: str,
    body: PutConversationRequestBodySchema,
    _session: DependencyRequireSession,
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
    _session: DependencyRequireSession,
    db: DependencyInjectDatabase,
) -> ConversationModel:
    conversation = await get_conversation(conversation_id, db)
    db.delete(conversation)
    db.commit()
    return conversation


class UploadConversationBodySchema(BaseModel):
    timestamp: datetime
    content: str


@ConversationRouter.post("/{conversation_id}/upload-text", response_model=ConversationChunkSchema)
async def upload_conversation_text(
    conversation_id: str,
    body: UploadConversationBodySchema,
    db: DependencyInjectDatabase,
) -> ConversationChunkModel:
    conversation = await get_conversation(conversation_id, db)

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

@ConversationRouter.post("/{conversation_id}/upload-chunk", response_model=List[ConversationChunkSchema])
async def upload_conversation_chunk(
    conversation_id: str,
    chunk: UploadFile,
    timestamp: Annotated[datetime, Form()],
    db: DependencyInjectDatabase,
) -> List[ConversationChunkModel]:
    conversation = await get_conversation(conversation_id, db)

    if not os.path.exists(os.path.join(AUDIO_CHUNKS_DIR, conversation.id)):
        os.makedirs(os.path.join(AUDIO_CHUNKS_DIR, conversation.id))

    MAX_CHUNK_SIZE = 25 * 1024 * 1024  # 25MB  
    chunks = []
    
    # Save the uploaded chunk to a temporary file
    temp_audio_path = os.path.join(AUDIO_CHUNKS_DIR, conversation.id, f"temp-{chunk.filename}")
    with open(temp_audio_path, "wb") as temp_audio_file:
        chunk_data = await chunk.read()
        temp_audio_file.write(chunk_data)

    converted_audio_path = temp_audio_path.replace('webm', 'mp3')

    (
        ffmpeg
        .input(temp_audio_path)
        .output(converted_audio_path, f='mp3')
        .run()
    )
    
    try:
        # Get the audio metadata
        probe = ffmpeg.probe(converted_audio_path)
        
        # Calculate the duration of the audio file
        if 'format' in probe and 'duration' in probe['format']:
            duration = float(probe['format']['duration'])
        else:
            # Estimate the duration if 'duration' is missing
            stream = probe['streams'][0]
            bitrate = int(stream['bit_rate']) if 'bit_rate' in stream else 64000  # default to 64kbps if missing
            size = int(probe['format']['size'])
            duration = size / (bitrate / 8)  # size in bytes / (bitrate in bits per second / 8 bits per byte)
            logger.info(f"Estimated duration: {duration}")

    except ffmpeg.Error as error:
        logger.error(f"ffmpeg error: {error.stderr.decode()}")
        raise HTTPException(status_code=500, detail="Error processing audio file.") from error
    
    logger.info("duration")
    logger.info(duration)

    file_size = os.path.getsize(converted_audio_path)

    # Calculate the number of chunks needed
    num_chunks = math.ceil(file_size / MAX_CHUNK_SIZE)
    chunk_duration = duration / num_chunks

    logger.info("MAX_CHUNK_SIZE")
    logger.info(MAX_CHUNK_SIZE)
    logger.info("file_size")
    logger.info(file_size)
    logger.info("num_chunks")
    logger.info(num_chunks)

    for i in range(num_chunks):
        start_time = i * chunk_duration
        if start_time < 0:
            start_time = 0
        start_time = round(start_time, 2)
        chunk_id = generate_uuid()
        chunk_path = os.path.join(AUDIO_CHUNKS_DIR, conversation.id, f"{chunk_id}-{chunk.filename}")
        logger.info("chunk_path")
        logger.info(chunk_path)
        logger.info("start_time")
        logger.info(start_time)
        logger.info("chunk_duration")
        logger.info(chunk_duration)
        
        try:
            (
                ffmpeg
                .input(converted_audio_path, ss=start_time, t=chunk_duration)
                .output(chunk_path, f='mp3')
                .run()
            )
        except ffmpeg.Error as error:
            logger.error(f"ffmpeg error: {error.stderr.decode()}")
            raise HTTPException(status_code=500, detail="Error processing audio file.") from error
        
        logger.info(f"Saving the file chunk to {chunk_path}")

        chunk_model = ConversationChunkModel(
            id=chunk_id,
            conversation_id=conversation_id,
            timestamp=timestamp,
            path=chunk_path,
        )
        chunks.append(chunk_model)
        db.add(chunk_model)
    
    db.commit()

    # Clean up temporary file
    os.remove(temp_audio_path)
    os.remove(converted_audio_path)

    for chunk in chunks:
        logger.info("chunk id:")
        logger.info(chunk.id)
        logger.info(f"Add to processing queue: ConversationChunk@{chunk.id}")
        process_conversation_chunk.delay(chunk.id)

    return chunks

    # id = generate_uuid()
    # file_path = os.path.join(AUDIO_CHUNKS_DIR, conversation.id, f"{id}-{chunk.filename}")

    # file_path = file_path.split(";")[0]

    # with open(file_path, "wb") as f:
    #     logger.info(f"Saving the file to {file_path}")
    #     f.write(chunk.file.read())

    # chunk = ConversationChunkModel(
    #     id=id,
    #     conversation_id=conversation_id,
    #     timestamp=timestamp,
    #     path=file_path,
    # )

    # db.add(chunk)
    # db.commit()

    # logger.info(f"Add to processing queue: ConversationChunk@{chunk.id}")
    # process_conversation_chunk.delay(chunk.id)

    # return chunk

@ConversationRouter.get("/{conversation_id}/quotes", response_model=List[QuoteSchema])
async def get_conversation_quotes(
    conversation_id: str,
    db: DependencyInjectDatabase,
    _session: DependencyRequireSession,
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
        key=lambda quote: quote.conversation_chunks[0].timestamp if quote.conversation_chunks else quote.created_at
    )

    return quotes
