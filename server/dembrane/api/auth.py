from typing import Annotated
from logging import getLogger

from jose import jwt
from fastapi import Depends, Request

from dembrane.config import DIRECTUS_SECRET
from dembrane.api.exceptions import SessionInvalidException

logger = getLogger("api.session")

DIRECTUS_COOKIE_KEY = "directus_session_token"


async def require_directus_uid(request: Request) -> str:
    """
    Returns user id if user is authenticated, otherwise raises an exception
    """
    directus_cookie = request.cookies.get(DIRECTUS_COOKIE_KEY)

    if not directus_cookie:
        raise SessionInvalidException

    try:
        assert DIRECTUS_SECRET, "DIRECTUS_SECRET is not set"
        decoded = jwt.decode(directus_cookie, DIRECTUS_SECRET)
    except Exception as exc:
        logger.error(exc)
        raise SessionInvalidException from exc

    user_id = decoded.get("id")

    return str(user_id)


DependencyDirectusUid = Annotated[str, Depends(require_directus_uid)]
