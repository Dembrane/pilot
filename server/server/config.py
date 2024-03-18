import dotenv
import os
import logging

logging.basicConfig(level=logging.INFO)

BASE_DIR = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))

dotenv_path = os.path.join(BASE_DIR, ".env")

dotenv.load_dotenv(dotenv_path, verbose=True)

UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
if not os.path.exists(UPLOADS_DIR):
    os.makedirs(UPLOADS_DIR)

RESOURCE_UPLOADS_DIR = os.path.join(UPLOADS_DIR, "resources")
if not os.path.exists(RESOURCE_UPLOADS_DIR):
    os.makedirs(RESOURCE_UPLOADS_DIR)

AUDIO_CHUNKS_DIR = os.path.join(UPLOADS_DIR, "audio_chunks")
if not os.path.exists(AUDIO_CHUNKS_DIR):
    os.makedirs(AUDIO_CHUNKS_DIR)

EMBEDDINGS_CACHE_DIR = os.path.join(BASE_DIR, "embeddings_cache")
FAISS_INDEX_PATH = os.path.join(BASE_DIR, "faiss_index")

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///db.sqlite3")

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
assert OPENAI_API_KEY, "OPENAI_API_KEY environment variable is not set"

FRONTEND_DIST_DIR = os.path.join(BASE_DIR, "frontend_dist")
