import os
import json
from typing import Any, List, Optional, Annotated, AsyncGenerator
from logging import getLogger
from datetime import datetime

from google import genai  # type: ignore
from fastapi import Form, Request, APIRouter, UploadFile
from pydantic import BaseModel

from google.genai import types  # type: ignore
from sqlalchemy.orm import noload, selectinload
from fastapi.responses import StreamingResponse

from dembrane.tasks import task_process_conversation_chunk
from dembrane.utils import CacheWithExpiration, generate_uuid
from dembrane.config import GEMINI_API_KEY, AUDIO_CHUNKS_DIR
from dembrane.openai import client
from dembrane.prompts import render_prompt
from dembrane.schemas import (
    ConversationSchema,
    ConversationChunkSchema,
)
from dembrane.database import (
    ConversationModel,
    ConversationChunkModel,
    DependencyInjectDatabase,
)
from dembrane.directus import directus
from dembrane.audio_utils import wav_to_str, concat_audio_files_wav, get_mime_type_from_file_path
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



from exa_py import Exa
import numpy as np
import pandas as pd
exa = Exa(api_key="9b790001-4c02-4bc1-89e9-7fe7c6ecc96f")

@ConversationRouter.post("/{object_id}/get-relevant-objects")
async def get_relevant_objects(object_id: str, db: DependencyInjectDatabase) -> List[str]:
    MAX_RESULTS = 5  # Configurable maximum
    
    try:
        # Get the source object
        obj = directus.get_item("spike_object", object_id, {
            "fields": ["id", "embedding", "title", "description", "context"],
        })
        
        if not obj or not obj.get("embedding"):
            logger.error(f"No object or embedding found for id: {object_id}")
            return []

        # Parse embedding string - handle both comma and bracket formats
        embedding_str = obj["embedding"].strip('[]')
        try:
            origin_embedding = np.array([
                float(x.strip()) for x in embedding_str.split(',') if x.strip()
            ], dtype=np.float32)
            
            if len(origin_embedding) == 0:
                logger.error("Empty embedding array for source object")
                return []
                
        except (ValueError, TypeError) as e:
            logger.error(f"Failed to parse source embedding: {e}")
            return []

        # Get public objects
        public_objects = directus.get_items("spike_object", {
            "fields": ["id", "embedding", "ratings.*"],
            "query": {
                "filter": {
                    "is_public": {"_eq": True},
                    "id": {"_neq": object_id},  # Exclude the source object
                }
            }
        })

        if not public_objects:
            logger.info("No public objects found for comparison")
            return []

        # Create DataFrame with explicit columns
        expected_columns = ['id', 'embedding', 'ratings']
        df_public_objects = pd.DataFrame(public_objects, columns=expected_columns).set_index('id', drop=False)
        
        # Verify required columns exist
        missing_columns = [col for col in expected_columns if col not in df_public_objects.columns]
        if missing_columns:
            logger.error(f"Missing required columns: {missing_columns}")
            return []

        # Safe embedding parsing function
        def parse_embedding(emb_str):
            try:
                if not emb_str:
                    return None
                emb_str = emb_str.strip('[]')
                return np.array([float(x.strip()) for x in emb_str.split(',') if x.strip()], dtype=np.float32)
            except (ValueError, AttributeError) as e:
                logger.error(f"Error parsing embedding: {e}")
                return None

        # Calculate similarities safely
        def calculate_similarity(row):
            try:
                emb = parse_embedding(row["embedding"])
                if emb is None:
                    return 0.0
                if len(emb) != len(origin_embedding):
                    logger.warning(f"Embedding dimension mismatch: {len(emb)} != {len(origin_embedding)}")
                    return 0.0
                return float(np.dot(origin_embedding, emb))
            except Exception as e:
                logger.error(f"Error calculating similarity: {e}")
                return 0.0

        df_public_objects["similarity"] = df_public_objects.apply(calculate_similarity, axis=1)

        # Calculate average ratings safely
        def calculate_avg_rating(ratings):
            try:
                if not ratings:
                    return 0.0
                values = [r.get("value", 0) for r in ratings if isinstance(r, dict)]
                return np.mean(values) if values else 0.0
            except Exception as e:
                logger.error(f"Error calculating average rating: {e}")
                return 0.0

        df_public_objects["avg_rating"] = df_public_objects["ratings"].apply(calculate_avg_rating)
        df_public_objects["num_ratings"] = df_public_objects["ratings"].apply(lambda x: len(x) if x else 0)

        # Safe normalization function
        def normalize_column(series):
            try:
                min_val = series.min()
                max_val = series.max()
                if pd.isna(min_val) or pd.isna(max_val) or max_val == min_val:
                    return pd.Series([0.5] * len(series))
                return (series - min_val) / (max_val - min_val)
            except Exception as e:
                logger.error(f"Error normalizing column: {e}")
                return pd.Series([0.5] * len(series))

        # Normalize scores
        df_public_objects["norm_similarity"] = normalize_column(df_public_objects["similarity"])
        df_public_objects["norm_rating"] = normalize_column(df_public_objects["avg_rating"])
        df_public_objects["rating_confidence"] = 1 - (1 / (df_public_objects["num_ratings"] + 1))

        # Calculate final score
        weights = {
            "similarity": 0.6,
            "rating": 0.3,
            "confidence": 0.1
        }

        df_public_objects["score"] = (
            weights["similarity"] * df_public_objects["norm_similarity"] +
            weights["rating"] * df_public_objects["norm_rating"] * df_public_objects["rating_confidence"] +
            weights["confidence"] * df_public_objects["rating_confidence"]
        )

        # Get top objects - ensure IDs are strings
        df_public_objects = df_public_objects.sort_values("score", ascending=False)
        top_object_ids = [str(id_) for id_ in df_public_objects["id"].tolist()[:3]]

        # Exa query integration
        try:
            query_text = f"{obj.get('title', '')} {obj.get('description', '')} {obj.get('context', '')}"
            if query_text.strip():
                exa_results = exa.search_and_contents(
                    f"Find relevant stories/organizations/spaces/people/committees/etc related to the following object: {query_text}",
                    type="auto",
                    highlights={"highlights_per_url": 1},
                    summary={"query": "explain how relevant it is to the object in the query focus on community and social proof"},
                    num_results=3
                )

                logger.info(f"exa_results: {exa_results}")

                exa_results_added = 0
                for result in exa_results.results:
                    logger.info(f"result: {result}")
                    try:
                        # Safely get attributes with defaults
                        title = getattr(result, 'title', '')
                        summary = getattr(result, 'summary', '')
                        highlights = getattr(result, 'highlights', '')
                        
                        if not any([title, summary, highlights]):
                            logger.warning("Skipping Exa result with no content")
                            continue

                        embedding = client.embeddings.create(
                            model="text-embedding-3-large",
                            input=f"{title} {summary} {highlights}".strip(),
                        )

                        new_exa_obj = directus.create_item("spike_object", item_data={
                            "title": title,
                            "description": summary,
                            "context": highlights,
                            "embedding": str(list(embedding.data[0].embedding)),
                            "is_public": False,
                            "exa_query_origin_object_id": obj["id"],
                        })["data"]

                        if new_exa_obj and "id" in new_exa_obj:
                            if len(top_object_ids) < MAX_RESULTS:
                                top_object_ids.append(str(new_exa_obj["id"]))
                                exa_results_added += 1
                                if exa_results_added >= (MAX_RESULTS - 3):
                                    break
                        else:
                            logger.warning("Created Exa object missing ID")
                            
                    except AttributeError as e:
                        logger.error(f"Missing attribute in Exa result: {e}")
                    except Exception as e:
                        logger.error(f"Error processing Exa result: {e}")

        except Exception as e:
            logger.error(f"Exa query failed: {e}")

        return top_object_ids

    except Exception as e:
        logger.error(f"Error in get_relevant_objects: {e}")
        return []



gemini_client = genai.Client(api_key=GEMINI_API_KEY)
gemini_model = "gemini-2.0-flash-exp"

@ConversationRouter.post("/{conversation_id}/get-reply")
async def get_conversation_reply(conversation_id: str, db: DependencyInjectDatabase) -> Any:
    chunks = await get_conversation_chunks(conversation_id, db)
    audio_files = [chunk.path for chunk in chunks if chunk.path]
    
    if not audio_files:
        raise ValueError("No audio files to process")
    
    ### START creating the spike chat
    spike_chats = directus.get_items("spike_chat", {
        "query": {
            "filter": {
                "conversation_id": {
                    "_eq": conversation_id,
                },
            }
        }
    })

    logger.info(f"spike_chats: {spike_chats}")

    spike_chat: Any  = None
    if len(spike_chats) == 0:
        # create a spike chat and keep adding to it
        spike_chat = directus.create_item("spike_chat", item_data={
            "conversation_id": conversation_id,
        })["data"]
    else:
        spike_chat = spike_chats[0]

    logger.info(f"spike_chat found: {spike_chat}")
    ### END creating the spike chat

	### START joining the audio files
    output_dir = os.path.join(AUDIO_CHUNKS_DIR, conversation_id)
    joined_audio_path = os.path.join(output_dir, f"joined-{conversation_id}-{generate_uuid()}.mp3")

    try:
        joined_audio_path, duration = concat_audio_files_wav(audio_files, joined_audio_path)
    except Exception as e:
        logger.error(f"Failed to join audio files: {str(e)}")
        raise RuntimeError(f"Failed to join audio files: {str(e)}") from e
    ### END joining the audio files

	### OPENAI specific
    encoded_wav = wav_to_str(joined_audio_path)
    file_uri = joined_audio_path
    file_mime_type = "audio/wav"

    ### GEMINI specific
    ## START checking if the file already exists 
    # chat_messages = directus.get_items("spike_chat_message", {
    #     "query": {
    #         "filter": {
    #             "spike_chat_id": {
    #                 "_eq": spike_chat["id"],
    #             },
    #             "type": {
    #                 "_eq": "user_audio",
    #             }
    #         },
    #         "sort": "-date_created",
    #         "limit": 1,
    #     }
    # })

    # file_uri = ""
    # file_mime_type = ""

    # try:
    #     logger.info("found chat message with user audio")
    #     if len(chat_messages) > 0 and int(float(chat_messages[0]["content_user_audio_duration"])) == int(duration):
    #         logger.info(f"using existing user audio because duration similar: {chat_messages[0]['content_user_audio_duration']} == {duration}")
    #         file_uri = chat_messages[0]["content_user_audio_uri"]
    #         file_mime_type = chat_messages[0]["content_user_audio_mime_type"]
    #     else:
    #         logger.info("no existing user audio found with similar duration")
            
    # except Exception as e:
    #     logger.error(f"Failed to get existing user audio: {str(e)}")
        
    # if file_uri == "":
    #     logger.info(f"uploading audio file {joined_audio_path}")
    #     file = gemini_client.files.upload(path=joined_audio_path)
    #     file_uri = file.uri
    #     file_mime_type = file.mime_type
    #     logger.info(f"uploaded to gemini file uri: {file_uri}")
    #     logger.info(f"uploaded to gemini file mime type: {file_mime_type}")
    ### END uploading the audio file


    directus.create_item("spike_chat_message", item_data={
        "spike_chat_id": spike_chat["id"],
        "type": "user_audio",
        "content_user_audio_uri": file_uri,
        "content_user_audio_mime_type": file_mime_type,
        "content_user_audio_duration": duration,
    })

    logger.info(f"spike_chat_message created for user audio {file_uri}")

    previous_messages = directus.get_items("spike_chat_message", {
        "query": {
            "filter": {
                "spike_chat_id": {
                    "_eq": spike_chat["id"],
                },
            },
            "sort": "date_created",
        }
    })

    previous_messages_str = ""
    for message in previous_messages:
        if message["type"] == "text":
            previous_messages_str += f"<response><type>text</type><content>{message['content_text']}</content><context_progress>{message['content_context_in_progress']}</context_progress></response>\n"
        elif message["type"] == "object":
            previous_messages_str += f"<response><type>object</type><content><title>{message['content_title']}</title><description>{message['content_description']}</description><context>{message['content_context']}</context></content></response>\n"
        elif message["type"] == "user_rating":
            previous_messages_str += f"<response><type>user_rating</type><content>{message['content_text']}</content><rating_value>{message['content_rating_value']}</rating_value><rating_id>{message['content_rating_id']}</rating_id></response>\n"
        else:
            continue

    prompt = render_prompt("spike_audio", "en", {
        "previous_messages": previous_messages_str,
    })

    logger.info(f"prompt: {prompt}")

	# main issue with "part"
    # generation = gemini_client.models.generate_content(
    #     model=gemini_model,
    #     config=types.GenerateContentConfig(
    #         system_instruction=prompt,
    #     ),
    #     contents=[
    #         types.Content(
    #             role="user",
    #             parts=[
    #                 types.Part(text="Please analyze the attached audio file."),
    #                 types.Part().from_uri(file_uri, mime_type=file_mime_type)
    #             ],

    #         ),
    #     ]
    # )

    # op = generation.text


    generation = client.chat.completions.create(
        model="gpt-4o-audio-preview",
        messages=[
            {
                "role": "system",
                "content": [
                    {
                        "type": "text",
                        "text": prompt,
                    }
                ]
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "input_audio",
                        "input_audio": {
                            "data": encoded_wav,
                            "format": "wav"
                        }
                    }
                ]
            }
        ],
    )

    op = generation.choices[0].message.content

    parsing_prompt = render_prompt("spike_audio_parse", "en", {})

    logger.info(f"input to the parser: {op}")

    class SpikeAudioContent(BaseModel):
        title: str
        description: str
        context: str

    class SpikeAudioResponse(BaseModel):
        type: str
        content: SpikeAudioContent | str
        context_in_progress: str


    parsing_op = client.beta.chat.completions.parse(
        model="gpt-4o",
        response_format=SpikeAudioResponse,
        messages=[
            {
                "role": "system",
                "content": parsing_prompt,
            },
            { "role": "user","content": op} # type: ignore
        ], 
    )
    

    parsing_op_response = parsing_op.choices[0].message

    logger.info(f"parsing_op_response: {parsing_op_response}")

    if parsing_op_response.parsed is None:
        raise ValueError("no response parsed")
    elif parsing_op_response.refusal:
        raise ValueError(f"refused from openai: {parsing_op_response.refusal}")
    else:
        logger.info("attempt to view parsed response")
    
    parsed_op = parsing_op_response.parsed

    if parsed_op.type == "text":
        directus.create_item("spike_chat_message", item_data={
            "spike_chat_id": spike_chat["id"],
            "type": "text",
            "content_text": parsed_op.content,
            "content_context_in_progress": parsed_op.context_in_progress,
        })
    elif parsed_op.type == "object":
        concat_str = str(parsed_op.content.title) + str(parsed_op.content.description) + str(parsed_op.content.context)  # type: ignore
        embedding = client.embeddings.create(
            model="text-embedding-3-large",
            input=concat_str
        )
        new_object = directus.create_item("spike_object", item_data={
            "origin_spike_chat_id": spike_chat["id"],
            "title": parsed_op.content.title,
            "description": parsed_op.content.description, # type: ignore
            "context": parsed_op.content.context, # type: ignore
            "embedding": str(embedding.data[0].embedding),
            "is_public": False
        })["data"]
        directus.create_item("spike_chat_message", item_data={
            "spike_chat_id": spike_chat["id"],
            "type": "object",
            "content_object_id": new_object["id"],
            "content_title": parsed_op.content.title,
            "content_description": parsed_op.content.description, # type: ignore
            "content_context": parsed_op.content.context, # type: ignore
            "content_context_in_progress": parsed_op.context_in_progress,
        })
    else:
        raise ValueError(f"URGH. Unknown output type: {parsed_op.type}")


    return op