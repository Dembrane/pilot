import os
import faiss
from langchain_community.vectorstores.faiss import FAISS
from langchain_community.docstore.in_memory import InMemoryDocstore
from logging import getLogger

from langchain_openai import OpenAIEmbeddings
from langchain.storage import LocalFileStore
from langchain.embeddings import CacheBackedEmbeddings

from server.config import EMBEDDINGS_CACHE_DIR, FAISS_INDEX_PATH

logger = getLogger("vectorstore")

underlying_embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

store = LocalFileStore(EMBEDDINGS_CACHE_DIR)

cached_embedder = CacheBackedEmbeddings.from_bytes_store(
    underlying_embeddings, store, namespace=underlying_embeddings.model
)

logger.info(f"CacheBackedEmbeddings length: {len(list(store.yield_keys()))}")

if os.path.exists(FAISS_INDEX_PATH):
    logger.info(f"Loading FAISS index from {FAISS_INDEX_PATH}")
    vectorstore = FAISS.load_local(FAISS_INDEX_PATH, cached_embedder)

_index = faiss.IndexFlatL2(1536)
vectorstore = FAISS(cached_embedder, _index, InMemoryDocstore(), {})
