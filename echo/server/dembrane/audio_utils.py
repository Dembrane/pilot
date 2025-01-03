import os
import math
import base64
import shutil
import logging
import tempfile
import subprocess
from typing import List, Tuple, Optional
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


MAX_CHUNK_SIZE = 18 * 1024 * 1024  # 18MB


def split_audio_chunk(db: Session, original_chunk_id: str) -> List[ConversationChunkModel]:
    logger = logging.getLogger("audio_utils.pre_process_audio")

    original_chunk = db.get(ConversationChunkModel, original_chunk_id)

    if original_chunk is None:
        logger.error(f"Chunk not found: {original_chunk_id}")
        raise ValueError(f"Chunk not found: {original_chunk_id}")

    logger.debug(f"Splitting audio chunk: {original_chunk.id}")
    if original_chunk.path is None:
        raise FileNotFoundError("File path is not found")

    try:
        file_mime_type = get_mime_type_from_file_path(original_chunk.path)

        # convert all to mp3
        logger.debug("Converting audio to mp3")
        if file_mime_type != "audio/mp3":
            # save the original path to delete later
            path_to_delete_later = original_chunk.path

            chunk_file_format = original_chunk.path.split(".")[-1]
            logger.debug(f"Converting {chunk_file_format} to mp3")
            updated_chunk_path = original_chunk.path.replace(chunk_file_format, "mp3")

            (ffmpeg.input(original_chunk.path).output(updated_chunk_path, f="mp3").run())

            original_chunk.path = updated_chunk_path
            db.commit()

            # delete the original file (if anything fails above, the original file will be kept)
            os.remove(path_to_delete_later)
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

def _safe_replace(src: str, dst: str) -> None:
    """
    Safely replace/move a file from src to dst, handling cross-device errors.
    """
    try:
        os.replace(src, dst)
    except OSError as e:
        # errno 18 = EXDEV (Invalid cross-device link)
        if e.errno == 18:
            shutil.move(src, dst)  # will copy+delete if needed
        else:
            raise


def concat_audio_files_wav(
    audio_file_path_list: List[str],
    output_file_path: str,
    start_time: Optional[float] = None
) -> Tuple[str, float]:
    """
    Concatenate multiple audio files into a single WAV (PCM S16LE, 16kHz, stereo).

    Workflow:
    1) Each file is converted to WAV (16bit PCM, 16kHz, stereo).  
       Invalid/corrupt/very-small files are skipped.  
    2) If only one WAV remains, skip concat + rename it to final output path.  
    3) If multiple remain, produce a concat list and let ffmpeg combine them.  
    4) Optionally, trim the result from start_time to the end.  
    5) Cleanup temporary files.  

    Returns:
        (final_file_path, duration_in_seconds)

    Raises:
        ValueError: If no valid audio files remain after conversion.
        RuntimeError: If the final output is missing or empty.
    """

    def convert_to_temp_wav(in_file: str) -> Optional[str]:
        """
        Convert an incoming audio file of any format to a standard WAV (16-bit PCM, 16kHz, stereo).
        Returns the path to the temporary WAV if successful, else None.
        """
        try:
            if not os.path.exists(in_file) or os.path.getsize(in_file) < 1000:
                logger.warning(f"Skipping invalid or very small file: {in_file}")
                return None

            temp_fd, temp_path = tempfile.mkstemp(suffix=".wav")
            os.close(temp_fd)

            (
                ffmpeg
                .input(in_file, threads=1)
                .output(
                    temp_path,
                    format="wav",
                    acodec="pcm_s16le",
                    ac=2,      # stereo
                    ar=16000,  # 16 kHz
                    loglevel="error"
                )
                .overwrite_output()
                .run(capture_stdout=True, capture_stderr=True)
            )

            if not os.path.exists(temp_path) or os.path.getsize(temp_path) < 1000:
                logger.warning(f"File {in_file} did not convert properly (too small).")
                os.remove(temp_path)
                return None

            return temp_path

        except ffmpeg.Error as e:
            err_str = e.stderr.decode("utf-8", errors="ignore") if e.stderr else str(e)
            logger.error(f"FFmpeg error converting file '{in_file}':\n{err_str}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error converting file '{in_file}': {e}")
            return None

    # 1) Convert all input audio files to WAV
    wav_files: List[str] = []
    for original_path in audio_file_path_list:
        converted_path = convert_to_temp_wav(original_path)
        if converted_path:
            wav_files.append(converted_path)

    if not wav_files:
        raise ValueError("No valid audio files to concatenate after conversion.")

    # If only one file remains, just rename it
    if len(wav_files) == 1:
        single_file = wav_files[0]
        try:
            _safe_replace(single_file, output_file_path)
            file_duration = -1.0
            try:
                file_duration = float(ffmpeg.probe(output_file_path)["format"]["duration"])
            except Exception as e:
                logger.error(f"Cannot probe duration of single WAV: {e}")

            # Optional trim
            if start_time is not None and file_duration > start_time:
                temp_trim_fd, temp_trim_path = tempfile.mkstemp(suffix=".wav")
                os.close(temp_trim_fd)

                (
                    ffmpeg
                    .input(output_file_path, ss=start_time)
                    .output(
                        temp_trim_path,
                        acodec="pcm_s16le",
                        ar=16000,
                        ac=2,
                        loglevel="error"
                    )
                    .overwrite_output()
                    .run(capture_stdout=True, capture_stderr=True)
                )
                _safe_replace(temp_trim_path, output_file_path)

                try:
                    file_duration = float(ffmpeg.probe(output_file_path)["format"]["duration"])
                except Exception as e:
                    logger.error(f"Cannot probe duration after trimming: {e}")

            if not os.path.exists(output_file_path) or os.path.getsize(output_file_path) == 0:
                raise RuntimeError("Output file is empty after single-file rename/trim.")

            return output_file_path, file_duration

        finally:
            # Clean up
            for path_to_del in wav_files:
                if os.path.exists(path_to_del):
                    try:
                        os.remove(path_to_del)
                    except:
                        pass

    # 2) Multiple files: build a concat script
    concat_list_path = ""
    try:
        with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False) as f:
            for wfile in wav_files:
                # Use escaped absolute paths to avoid issues with special characters
                abs_path = os.path.abspath(wfile)
                escaped_path = abs_path.replace("'", "'\\''")
                f.write(f"file '{escaped_path}'\n")
            concat_list_path = f.name

        # 3) Concatenate them into output_file_path
        (
            ffmpeg
            .input(concat_list_path, f="concat", safe=0)
            .output(
                output_file_path,
                acodec="pcm_s16le",  # 16-bit PCM
                ar=16000,            # 16 kHz
                ac=2,                # stereo
                loglevel="error",
                format="wav"         # Explicitly specify output format
            )
            .overwrite_output()
            .run(capture_stdout=True, capture_stderr=True)
        )

        file_duration = -1.0
        try:
            file_duration = float(ffmpeg.probe(output_file_path)["format"]["duration"])
            logger.debug(f"Concatenated file duration: {file_duration}")
        except Exception as e:
            logger.error(f"Cannot probe duration of concatenated file: {e}")

        # 4) If start_time is provided and valid, trim final file
        if start_time is not None and file_duration > start_time:
            temp_trim_fd, temp_trim_path = tempfile.mkstemp(suffix=".wav")
            os.close(temp_trim_fd)

            (
                ffmpeg
                .input(output_file_path, ss=start_time)
                .output(
                    temp_trim_path,
                    acodec="pcm_s16le",
                    ar=16000,
                    ac=2,
                    loglevel="error"
                )
                .overwrite_output()
                .run(capture_stdout=True, capture_stderr=True)
            )
            _safe_replace(temp_trim_path, output_file_path)

            try:
                file_duration = float(ffmpeg.probe(output_file_path)["format"]["duration"])
            except Exception as e:
                logger.error(f"Cannot probe duration of final trimmed file: {e}")

        # 5) Final check
        if not os.path.exists(output_file_path) or os.path.getsize(output_file_path) == 0:
            raise RuntimeError("Final output is empty or does not exist")

        return output_file_path, file_duration

    except ffmpeg.Error as e:
        err_str = e.stderr.decode("utf-8", errors="ignore") if e.stderr else str(e)
        logger.error(f"FFmpeg concat error:\n{err_str}")
        raise RuntimeError(f"Failed to join audio files: {err_str}") from e
    except Exception as e:
        logger.error(f"Unexpected error during concat: {e}")
        raise RuntimeError(f"Failed to join audio files: {e}") from e
    finally:
        # Cleanup
        if concat_list_path and os.path.exists(concat_list_path):
            try:
                os.remove(concat_list_path)
            except:
                pass
        for wfile in wav_files:
            if os.path.exists(wfile):
                try:
                    os.remove(wfile)
                except:
                    pass

def wav_to_str(wav_file_path: str) -> str:
    with open(wav_file_path, "rb") as file:
        return base64.b64encode(file.read()).decode("utf-8")