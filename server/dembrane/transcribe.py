import os
import logging
from typing import Optional

from openai import OpenAI

from dembrane.database import DatabaseSession, ConversationModel, ConversationChunkModel

openai_client = OpenAI()

logger = logging.getLogger("transcribe")


class TranscriptionError(Exception):
    pass


def transcribe_audio(audio_file_path: str, language: Optional[str], whisper_prompt: Optional[str]) -> str:
    try:
        f = open(audio_file_path, "rb")
    except FileNotFoundError as exc:
        logger.error(f"File not found: {audio_file_path}")
        raise FileNotFoundError from exc
    except Exception as exc:
        raise TranscriptionError(f"Failed to open audio file: {exc}") from exc

    with f:
        options = {
            "model": "whisper-1",
            "file": f,
            "response_format": "text",
            "language": language if language not in [None, "multi", ""] else None,
            "prompt": whisper_prompt if whisper_prompt else None,
        }

        try:
            transcription = openai_client.audio.transcriptions.create(**options)  # type: ignore
        except Exception as exc:
            logger.error(f"Failed to transcribe audio: {exc}")
            raise TranscriptionError(f"Failed to transcribe audio: {exc}") from exc

        if transcription is None or transcription == "":
            # TODO: track if the transcription is empty
            logger.info("Transcription is empty!")

    return str(transcription)


DEFAULT_WHISPER_PROMPTS = {
    "en": "Hi, lets get started. First we'll have a round of introductions and then we can get into the topic for today.",
    "nl": "Hallo, laten we beginnen. Eerst even een introductieronde en dan kunnen we aan de slag met de thema van vandaag.",
}


def transcribe_conversation_chunk(conversation_chunk_id: str):
    """Process conversation chunk for transcription"""
    with DatabaseSession() as db:
        try:
            chunk = db.get(ConversationChunkModel, conversation_chunk_id)

            if chunk is None:
                return None

            if not chunk.path:
                logger.info(f"Chunk {conversation_chunk_id} has no path")
                return None

            if not os.path.exists(chunk.path):
                raise FileNotFoundError(f"File not found: {chunk.path}")

            # fetch conversation details
            conversation = db.query(ConversationModel).filter(ConversationModel.id == chunk.conversation_id).first()
            if conversation is None:
                raise ValueError("Conversation not found")

            project = conversation.project
            language = project.language or "en"
            default_prompt = DEFAULT_WHISPER_PROMPTS.get(language, "")
            whisper_prompt = default_prompt + " " + (conversation.context if conversation.context else "")

            transcription = transcribe_audio(chunk.path, language=language, whisper_prompt=whisper_prompt)

            chunk.transcript = transcription
            db.commit()

            logger.debug(f"Processed chunk: {conversation_chunk_id}")
            return conversation_chunk_id

        except Exception as exc:
            logger.error(f"Unexpected error: {exc}")
            db.rollback()
            raise exc
