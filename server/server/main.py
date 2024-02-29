import time
from logging import getLogger
from typing import Any
from fastapi import (
    FastAPI,
    HTTPException,
    Request,
    Response,
)
from fastapi.staticfiles import StaticFiles
from fastapi.openapi.utils import get_openapi
from starlette.exceptions import HTTPException as StarletteHTTPException

from server.config import FRONTEND_DIST_DIR
from server.api import api
from server.process import (
    seed_process_document_queue,
)

logger = getLogger("server")

# init stuff
seed_process_document_queue()


app = FastAPI()


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
        version="0.1.0",
        routes=app.routes,
    )
    openapi_schema["info"]["x-logo"] = {"url": "/dembrane-logo.png"}
    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi  # type: ignore
