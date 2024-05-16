import logging
import subprocess

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
        raise ConversionError

    if result.returncode != 0:
        logger.info(f"Conversion failed with return code {result.returncode}.")
        raise ConversionError

    return True
