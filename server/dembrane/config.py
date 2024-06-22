import os
import logging

import dotenv

logger = logging.getLogger("config")
logging.basicConfig(level=logging.INFO)

BASE_DIR = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))
dotenv_path = os.path.join(BASE_DIR, ".env")

if os.path.exists(dotenv_path):
    logger.info(f"loading environment variables from {dotenv_path}")
    dotenv.load_dotenv(dotenv_path, verbose=True)

DEBUG_MODE = os.environ.get("DEBUG_MODE", "false").lower() in ["true", "1"]
logger.info(f"DEBUG_MODE: {DEBUG_MODE}")
if DEBUG_MODE:
    logging.basicConfig(level=logging.DEBUG)
    logger.setLevel(logging.DEBUG)


UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
if not os.path.exists(UPLOADS_DIR):
    os.makedirs(UPLOADS_DIR)
logger.debug(f"UPLOADS_DIR: {UPLOADS_DIR}")

RESOURCE_UPLOADS_DIR = os.path.join(UPLOADS_DIR, "resources")
if not os.path.exists(RESOURCE_UPLOADS_DIR):
    os.makedirs(RESOURCE_UPLOADS_DIR)
logger.debug(f"RESOURCE_UPLOADS_DIR: {RESOURCE_UPLOADS_DIR}")

AUDIO_CHUNKS_DIR = os.path.join(UPLOADS_DIR, "audio_chunks")
if not os.path.exists(AUDIO_CHUNKS_DIR):
    os.makedirs(AUDIO_CHUNKS_DIR)
logger.debug(f"AUDIO_CHUNKS_DIR: {AUDIO_CHUNKS_DIR}")

EMBEDDINGS_CACHE_DIR = os.path.join(BASE_DIR, "embeddings_cache")
logger.debug(f"EMBEDDINGS_CACHE_DIR: {EMBEDDINGS_CACHE_DIR}")

DATABASE_URL = os.environ.get("DATABASE_URL")
assert DATABASE_URL, "DATABASE_URL environment variable is not set"

RABBITMQ_URL = os.environ.get("RABBITMQ_URL")
assert RABBITMQ_URL, "RABBITMQ_URL environment variable is not set"

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
assert OPENAI_API_KEY, "OPENAI_API_KEY environment variable is not set"

SERVE_API_DOCS = os.environ.get("SERVE_API_DOCS", "false").lower() in ["true", "1"]
logging.debug(f"SERVE_API_DOCS: {SERVE_API_DOCS}")

DISABLE_SENTRY = os.environ.get("DISABLE_SENTRY", "false").lower() in ["true", "1"]
logging.debug(f"DISABLE_SENTRY: {DISABLE_SENTRY}")

BUILD_VERSION = os.environ.get("BUILD_VERSION", "dev")
logging.debug(f"BUILD_VERSION: {BUILD_VERSION}")

ADMIN_BASE_URL = os.environ.get("ADMIN_BASE_URL", "http://localhost:3000")
PARTICIPANT_BASE_URL = os.environ.get("PARTICIPANT_BASE_URL", "http://localhost:3001")
