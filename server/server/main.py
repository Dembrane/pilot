from contextlib import asynccontextmanager
import time
from logging import getLogger
from starlette.middleware.cors import CORSMiddleware
from typing import Any, AsyncGenerator
from fastapi import (
    FastAPI,
    HTTPException,
    Request,
)
from fastapi.staticfiles import StaticFiles
from fastapi.openapi.utils import get_openapi
from starlette.exceptions import HTTPException as StarletteHTTPException

from server.config import (
    FAISS_INDEX_PATH,
    FRONTEND_DIST_DIR,
    SERVE_FRONTEND,
    SERVE_SWAGGER_UI,
)
from server.api.api import api
from server.vectorstore import vectorstore
from server.process_conversation_chunk import seed_process_conversation_chunk_queue
from server.process_resource import (
    seed_process_resource_queue,
)

logger = getLogger("server")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    # startup
    logger.info("starting server")
    seed_process_resource_queue()
    seed_process_conversation_chunk_queue()
    yield
    # shutdown
    logger.info("shutting down server")
    vectorstore.save_local(FAISS_INDEX_PATH)


docs_url = "/docs" if SERVE_SWAGGER_UI else None

app = FastAPI(lifespan=lifespan, docs_url=docs_url, redoc_url=None)


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):  # type: ignore
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response


logger.info("mounting api on /api")
app.include_router(api, prefix="/api")


class SPAStaticFiles(StaticFiles):
    async def get_response(self, path: str, scope):  # type: ignore
        try:
            return await super().get_response(path, scope)
        except (HTTPException, StarletteHTTPException) as ex:
            if ex.status_code == 404:
                return await super().get_response("index.html", scope)
            else:
                raise ex


if SERVE_FRONTEND:
    logger.info("mounting frontend on /")

    app.mount(
        "/",
        SPAStaticFiles(directory=FRONTEND_DIST_DIR, html=True),
        name="spa-static-files",
    )


def custom_openapi() -> Any:
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title="dembrane/pilot API",
        version="0.2.0",
        routes=app.routes,
    )
    openapi_schema["info"]["x-logo"] = {"url": "/dembrane-logo.png"}
    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi  # type: ignore

# need to be added at the end
origins = [
    "https://admin.findcommonground.app",
    "https://participant.findcommonground.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS", "PUT", "DELETE"],
    allow_headers=["*"],
)
