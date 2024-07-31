from typing import Annotated
from logging import getLogger

from fastapi import Depends, Request, APIRouter

from dembrane.database import SessionModel, DependencyInjectDatabase
from dembrane.api.exceptions import SessionInvalidException

SESSION_ID_COOKIE_KEY = "sid"


async def require_session(request: Request, db: DependencyInjectDatabase) -> SessionModel:
    session_id_str = request.cookies.get(SESSION_ID_COOKIE_KEY)

    if not session_id_str or not session_id_str.isdigit():
        raise SessionInvalidException

    session_id = int(session_id_str)

    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()

    if not session:
        raise SessionInvalidException

    return session


DependencyRequireSession = Annotated[SessionModel, Depends(require_session)]

logger = getLogger("api.session")

SessionRouter = APIRouter(tags=["session"])


# @SessionRouter.get("/initiate")
# async def initiate_session(
#     _request: Request,
#     response: Response,
#     db: DependencyInjectDatabase,
#     session_id: str = "",
# ) -> dict:
#     logger.info(f"session_id {session_id}")
#     session: Optional[SessionModel]
#     if session_id == "" or session_id == "new":
#         logger.info("user requested new session")
#         session = SessionModel()
#         db.add(session)
#         db.commit()
#     else:
#         try:
#             session_id_int = int(session_id.strip())
#         except (TypeError, ValueError) as exc:
#             raise SessionNotFoundException from exc

#         session = db.query(SessionModel).filter(SessionModel.id == session_id_int).first()
#         if not session:
#             raise SessionNotFoundException

#     response.set_cookie(
#         key=SESSION_ID_COOKIE_KEY,
#         value=str(session.id),
#         httponly=True,
#         # never expire
#         expires=int(time.time() + 10 * 365 * 24 * 60 * 60),
#     )

#     return {"message": "Session initiated successfully"}


# @SessionRouter.get("/current", response_model=SessionSchema)
# async def get_current_session(
#     session: DependencyRequireSession,
# ) -> SessionModel:
#     return session


# @SessionRouter.get("/all", response_model=List[SessionSchema])
# async def get_all_sessions(db: DependencyInjectDatabase) -> List[SessionModel]:
#     return db.query(SessionModel).all()
