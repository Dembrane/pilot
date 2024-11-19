import logging
from os import path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from dembrane.config import IMAGES_DIR

StaticRouter = APIRouter()

logger = logging.getLogger("static")


@StaticRouter.get("/image/{image_path}")
async def get_image(image_path: str) -> FileResponse:
    logger.info("Getting image %s", image_path)
    if ".." in image_path:
        raise HTTPException(
            status_code=400,
            detail="Invalid image path",
        )

    if not path.exists(path.join(IMAGES_DIR, image_path)):
        raise HTTPException(
            status_code=404,
            detail="Image not found",
        )

    return FileResponse(path.join(IMAGES_DIR, image_path))
