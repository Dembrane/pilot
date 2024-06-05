import os
import math
import logging
import subprocess
from typing import List
from datetime import timedelta

import ffmpeg  # type: ignore
from sqlalchemy.orm import Session

from dembrane.utils import generate_uuid
from dembrane.config import AUDIO_CHUNKS_DIR
from dembrane.database import ConversationChunkModel

logger = logging.getLogger("audio_utils")


def get_mime_type_from_file_path(file_path: str) -> str:
    if file_path.endswith(".wav"):
        return "audio/wav"
    elif file_path.endswith(".mp3"):
        return "audio/mp3"
    elif file_path.endswith(".ogg"):
        return "audio/ogg"
    elif file_path.endswith(".flac"):
        return "audio/flac"
    elif file_path.endswith(".webm"):
        return "audio/webm"
    elif file_path.endswith(".opus"):
        return "audio/opus"
    elif file_path.endswith(".m4a"):
        return "audio/m4a"
    elif file_path.endswith(".mp4"):
        return "video/mp4"
    elif file_path.endswith(".mpeg"):
        return "video/mpeg"
    else:
        raise ValueError(f"Unsupported file type: {file_path}")


class ConversionError(Exception):
    pass


def convert_mp4_to_mp3(input_file_path: str, output_file_path: str) -> bool:
    """
    Convert an MP4 file to an MP3 file using FFmpeg.

    Args:
        input_file_path: The path to the input MP4 file.
        output_file_path: The path to the output MP3 file.

    Returns:
        True if the conversion was successful

    Raises:
        ConversionError: If the conversion failed for ANY reason
    """
    command = [
        "ffmpeg",
        "-i",
        input_file_path,
        "-vn",
        "-ab",
        "128k",
        "-ar",
        "44100",
        "-y",
        output_file_path,
    ]

    try:
        result = subprocess.run(command, check=True)
    except FileNotFoundError as exc:
        logger.error("FFmpeg is not installed or not found in the system path.")
        raise exc
    except Exception as e:
        logger.error(f"Error converting file: {e}")
        raise ConversionError from e

    if result.returncode != 0:
        logger.info(f"Conversion failed with return code {result.returncode}.")
        raise ConversionError

    return True


MAX_CHUNK_SIZE = 10 * 1024 * 1024  # 20MB


def split_audio_chunk(db: Session, original_chunk: ConversationChunkModel) -> List[ConversationChunkModel]:
    logger = logging.getLogger("audio_utils.pre_process_audio")

    logger.debug(f"Splitting audio chunk: {original_chunk.id}")
    if original_chunk.path is None:
        raise FileNotFoundError("File path is not found")

    try:
        file_mime_type = get_mime_type_from_file_path(original_chunk.path)

        # convert all to mp3
        logger.debug("Converting audio to mp3")
        if file_mime_type != "audio/mp3":
            chunk_file_format = original_chunk.path.split(".")[-1]
            logger.debug(f"Converting {chunk_file_format} to mp3")
            updated_chunk_path = original_chunk.path.replace(chunk_file_format, "mp3")
            (ffmpeg.input(original_chunk.path).output(updated_chunk_path, f="mp3").run())
            original_chunk.path = updated_chunk_path
            db.commit()
        else:
            logger.info("File is already in mp3 format")

    except Exception as e:
        logger.error(f"Error occured while trying to convert audio to mp3: {e}")
        db.rollback()
        raise e

    file_size = os.path.getsize(original_chunk.path)
    number_chunks = math.ceil(file_size / MAX_CHUNK_SIZE)
    logger.debug(f"Number of chunks: {number_chunks}, File size: {file_size}")

    if number_chunks == 1:
        logger.info("File is already save to DB. No splitting required.")
        return [original_chunk]

    try:
        split_chunks = []
        probe = ffmpeg.probe(original_chunk.path)
        if "format" in probe and "duration" in probe["format"]:
            duration = float(probe["format"]["duration"])
            chunk_duration = duration / number_chunks
            logger.debug(f"Duration: {duration}, Chunk duration: {chunk_duration}")
            for i in range(number_chunks):
                start_time = i * chunk_duration
                chunk_id = generate_uuid()
                chunk_path = os.path.join(
                    AUDIO_CHUNKS_DIR, original_chunk.conversation_id, f"{chunk_id}_{i}-of-{number_chunks}.mp3"
                )

                (ffmpeg.input(original_chunk.path, ss=start_time, t=chunk_duration).output(chunk_path, f="mp3").run())

                chunk = ConversationChunkModel(
                    id=chunk_id,
                    conversation_id=original_chunk.conversation_id,
                    # do this to avoid the same timestamp for all chunks
                    created_at=original_chunk.created_at + timedelta(seconds=start_time),
                    updated_at=original_chunk.updated_at + timedelta(seconds=start_time),
                    timestamp=original_chunk.timestamp + timedelta(seconds=start_time),
                    path=chunk_path,
                )
                split_chunks.append(chunk)
                db.commit()

            db.add_all(split_chunks)
            db.delete(original_chunk)
            db.commit()

            logger.debug(f"File split into {number_chunks} chunks")
            return split_chunks
        else:
            raise ValueError("Duration not found in ffmpeg probe")

    except ffmpeg.Error as e:
        logger.error(f"ffmpeg error: {e.stderr.decode()}")
        db.rollback()
        raise e
    except Exception as e:
        logger.error("File spitting failed")
        db.rollback()
        raise e
