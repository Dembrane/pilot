import os
import math
import logging
import subprocess

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

def pre_process_audio(db: Session, chunk: ConversationChunkModel):
    MAX_CHUNK_SIZE = 25 * 1024 * 1024  # 25MB

    if chunk.path is None:
        logger.error("File path not found")
        return

    try:
        file_mime_type = get_mime_type_from_file_path(chunk.path)
        if file_mime_type != "audio/mp3":
            chunk_file_format = chunk.path.split(".")[-1]
            updated_chunk_path = chunk.path.replace(chunk_file_format, "mp3")
            (
                ffmpeg
                .input(chunk.path)
                .output(updated_chunk_path, f='mp3')
                .run()
            )
            chunk.path = updated_chunk_path
            db.commit()
    except Exception as e:
        logger.error(f"File type is not supported: {e}")
        db.rollback()
        raise e

    file_size = os.path.getsize(chunk.path)
    number_chunks = math.ceil(file_size / MAX_CHUNK_SIZE)

    if number_chunks == 1:
        logger.info("File is already save to DB. No splitting required.")
        return
    
    try:
        probe = ffmpeg.probe(chunk.path)
        if 'format' in probe and 'duration' in probe['format']:
            duration = float(probe['format']['duration'])
            chunk_duration = duration / number_chunks
            for i in range(number_chunks):
                start_time = i * chunk_duration
                chunk_id = generate_uuid()
                chunk_path = os.path.join(AUDIO_CHUNKS_DIR, chunk.conversation_id, f"{chunk_id}-{chunk.filename}")
                
                (
                    ffmpeg
                    .input(chunk.path, ss=start_time, t=chunk_duration)
                    .output(chunk_path, f='mp3')
                    .run()
                )
                
    except ffmpeg.Error as e:
        logger.error(f"ffmpeg error: {e.stderr.decode()}")
        raise e
    except Exception as e:
        logger.error("File spitting failed")
        raise e