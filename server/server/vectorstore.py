import os
from langchain_community.vectorstores.faiss import FAISS
from logging import getLogger

from langchain_openai import OpenAIEmbeddings
from langchain.storage import LocalFileStore
from langchain.embeddings import CacheBackedEmbeddings

from server.config import EMBEDDINGS_CACHE_DIR, FAISS_INDEX_PATH

logger = getLogger("vectorstore")

underlying_embeddings = OpenAIEmbeddings()

store = LocalFileStore(EMBEDDINGS_CACHE_DIR)

cached_embedder = CacheBackedEmbeddings.from_bytes_store(
    underlying_embeddings, store, namespace=underlying_embeddings.model
)

logger.info(f"CacheBackedEmbeddings length: {len(list(store.yield_keys()))}")

if os.path.exists(FAISS_INDEX_PATH):
    logger.info(f"Loading FAISS index from {FAISS_INDEX_PATH}")
    vectorstore = FAISS.load_local(FAISS_INDEX_PATH, cached_embedder)

vectorstore = FAISS.from_texts(
    [""], cached_embedder
)