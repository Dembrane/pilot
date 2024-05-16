import logging
from typing import Optional
from openai import OpenAI
import backoff

openai_client = OpenAI()

logger = logging.getLogger("transcribe")


class TranscriptionError(Exception):
    pass


@backoff.on_exception(backoff.expo, (Exception), max_tries=5)
def transcribe_audio(
    audio_file_path: str, language: Optional[str], whisper_prompt: Optional[str]
) -> str:
    try:
        f = open(audio_file_path, "rb")
    except FileNotFoundError:
        logger.error(f"File not found: {audio_file_path}")
        raise FileNotFoundError
    except Exception as exc:
        raise TranscriptionError(f"Failed to open audio file: {exc}")
    finally:
        with f:
            options = {
                "model": "whisper-1",
                "file": f,
                "response_format": "text",
                "language": language if language not in [None, "multi", ""] else None,
                "prompt": whisper_prompt if whisper_prompt else None,
            }

            try:
                transcription = openai_client.audio.transcriptions.create(**options)
            except Exception as exc:
                logger.error(f"Failed to transcribe audio: {exc}")
                raise TranscriptionError(f"Failed to transcribe audio: {exc}")

            if transcription is None or transcription == "":
                # TODO: track if the transcription is empty
                logger.info("Transcription is empty!")

            return str(transcription)
