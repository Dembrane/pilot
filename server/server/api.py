import os
from datetime import datetime
from logging import getLogger
from typing import List, Optional
from uuid import uuid4
from fastapi import (
    Depends,
    UploadFile,
    HTTPException,
    Request,
    Response,
    APIRouter,
)
from pydantic import BaseModel

from server.models import (
    DocumentMessageModel,
    DocumentModel,
    SessionModel,
    db,
)
from server.chains import ask_document, ask_global
from server.config import UPLOADS_DIR
from server.process import (
    ProcessDocumentTaskQueueItem,
    process_document_queue,
)

logger = getLogger("api")

api = APIRouter()

InvalidSessionException = HTTPException(status_code=401, detail="Invalid session")


async def require_session(request: Request) -> SessionModel:
    session_id = request.cookies.get("sid")
    if not session_id:
        raise InvalidSessionException

    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise InvalidSessionException

    return session


@api.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@api.get("/initiate", tags=["session"])
async def initiate_session(
    request: Request, response: Response, session_id: str = "", language: str = "en"
) -> dict:
    logger.info(f"session_id {session_id}")
    session: Optional[SessionModel]
    if session_id == "" or session_id == "new":
        logger.info(f"user requested new session with language {language}")
        session = SessionModel(
            language=language,
        )
        db.add(session)
        db.commit()
    else:
        session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

    response.set_cookie(key="sid", value=str(session.id), httponly=True)

    return {"message": "Session initiated successfully"}


class SessionSchema(BaseModel):
    id: int
    created_at: datetime
    updated_at: datetime
    name: str | None
    context: str | None
    processing_since: datetime | None
    documents_count: int
    language: str


@api.get("/session", response_model=SessionSchema, tags=["session"])
async def get_current_session(
    session: SessionModel = Depends(require_session),
) -> SessionModel:
    documents_count = (
        db.query(DocumentModel).filter(DocumentModel.session_id == session.id).count()
    )

    session.documents_count = documents_count

    return session


@api.get("/all-sessions", response_model=List[SessionSchema], tags=["session"])
async def get_all_sessions() -> List[SessionModel]:
    sessions = db.query(SessionModel).all()

    for session in sessions:
        documents_count = (
            db.query(DocumentModel)
            .filter(DocumentModel.session_id == session.id)
            .count()
        )
        session.documents_count = documents_count

    return sessions


class PutSessionRequest(BaseModel):
    context: str | None = None
    language: str | None = None


@api.put("/session", response_model=SessionSchema, tags=["session"])
async def update_session(
    request: PutSessionRequest, session: SessionModel = Depends(require_session)
) -> SessionModel:
    if request.context:
        session.context = request.context

    if request.language:
        session.language = request.language

    db.add(session)
    db.commit()

    documents_count = documents_count = (
        db.query(DocumentModel).filter(DocumentModel.session_id == session.id).count()
    )

    session.documents_count = documents_count

    return session


class DocumentSchema(BaseModel):
    id: str
    created_at: datetime
    title: str | None
    description: str | None
    context: str | None
    is_processed: bool
    processing_error: str | None
    original_filename: str


@api.post("/upload-documents", response_model=List[DocumentSchema], tags=["document"])
@api.post("/document/upload", response_model=List[DocumentSchema], tags=["document"])
async def upload_document(
    files: List[UploadFile], session: SessionModel = Depends(require_session)
) -> List[DocumentModel]:
    documents = []

    for file in files:
        if not file.filename is None:
            original_filename = file.filename

            if not file.filename.endswith(".pdf"):
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid file format ({file.filename}). Only .pdf files are supported.",
                )

            file_name = file.filename.replace(" ", "_")
            file_path = os.path.join(UPLOADS_DIR, file_name)
            uuid = str(uuid4())

            if os.path.exists(file_path):
                logger.info(
                    f"File {file_name} already exists. Generating a unique filename"
                )
                unique_filename = str(uuid) + "_" + file_name
                file_path = os.path.join(UPLOADS_DIR, unique_filename)

            file_content = await file.read()

            try:
                with open(file_path, "wb") as f:
                    logger.info(f"Saving the file to {file_path}")
                    f.write(file_content)

                document = DocumentModel(
                    id=uuid,
                    session_id=session.id,
                    # initialize title with original filename
                    # doc will be summarized and title would be updated later
                    title=original_filename,
                    path=file_path,
                    original_filename=original_filename,
                )
                db.add(document)
                documents.append(document)

            except Exception as e:
                logger.error(f"Failed to save the file: {e}")
                raise HTTPException(status_code=500, detail="Failed to save the file")

            process_document_queue.add_task(
                ProcessDocumentTaskQueueItem(
                    document=document, language=session.language
                )
            )

    db.commit()
    return documents


@api.get("/document", response_model=List[DocumentSchema], tags=["document"])
async def get_all_documents(
    session: SessionModel = Depends(require_session),
) -> List[DocumentModel]:
    documents = (
        db.query(DocumentModel).filter(DocumentModel.session_id == session.id).all()
    )
    return documents


@api.get("/document/{document_id}", response_model=DocumentSchema, tags=["document"])
async def get_document_by_id(
    document_id: str, session: SessionModel = Depends(require_session)
) -> DocumentModel:
    document = (
        db.query(DocumentModel)
        .filter(DocumentModel.id == document_id, DocumentModel.session_id == session.id)
        .first()
    )
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    return document


class PutDocumentRequest(BaseModel):
    context: str | None


@api.put("/document/{document_id}", response_model=DocumentSchema, tags=["document"])
async def update_document_by_id(
    document_id: str,
    request: PutDocumentRequest,
    session: SessionModel = Depends(require_session),
) -> DocumentModel:
    document = (
        db.query(DocumentModel)
        .filter(DocumentModel.id == document_id, DocumentModel.session_id == session.id)
        .first()
    )
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    if request.context:
        document.context = request.context

    db.add(document)
    db.commit()
    return document


@api.delete("/document/{document_id}", tags=["document"])
async def delete_document_by_id(
    document_id: str,
    session: SessionModel = Depends(require_session),
) -> dict:
    document = (
        db.query(DocumentModel)
        .filter(DocumentModel.id == document_id, DocumentModel.session_id == session.id)
        .first()
    )
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    db.delete(document)
    db.commit()
    return {"message": "Document deleted successfully"}


class DocumentMessageSchema(BaseModel):
    id: str
    document_id: str
    created_at: datetime
    text: str
    from_user: bool
    is_global: bool


@api.get(
    "/document/{document_id}/chat",
    response_model=List[DocumentMessageSchema],
    tags=["document"],
)
async def get_chat_history_with_document_by_id(
    document_id: str, session: SessionModel = Depends(require_session)
) -> List[DocumentMessageModel]:
    document = (
        db.query(DocumentModel)
        .filter(DocumentModel.id == document_id, DocumentModel.session_id == session.id)
        .order_by(DocumentModel.created_at.desc())
        .first()
    )
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    messages = document.messages

    return messages


class PostDocumentMessageRequest(BaseModel):
    message: str


@api.post(
    "/document/{document_id}/chat",
    response_model=DocumentMessageSchema,
    tags=["document"],
)
async def chat_with_document_by_id(
    document_id: str,
    body: PostDocumentMessageRequest,
    session: SessionModel = Depends(require_session),
) -> DocumentMessageModel:
    document = (
        db.query(DocumentModel)
        .filter(DocumentModel.id == document_id, DocumentModel.session_id == session.id)
        .first()
    )
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    ai_response = await ask_document(
        language=session.language, document=document, question=body.message
    )

    # time.sleep(4)
    # ai_response = DocumentMessageModel(
    #     id=str(uuid4()),
    #     document_id=document.id,
    #     created_at=datetime.now(),
    #     text="echo" + body.message,
    #     from_user=False,
    #     is_global=False,
    # )

    # db.add(ai_response)
    # db.commit()

    return ai_response


class SessionMessageSchema(BaseModel):
    id: str
    created_at: datetime
    text: str
    from_user: bool
    documents_used: List[str]


@api.get("/session/chat", response_model=List[SessionMessageSchema], tags=["session"])
async def get_global_chat_history_with_current_session(
    session: SessionModel = Depends(require_session),
) -> List[SessionMessageSchema]:
    messages = session.messages
    messages.sort(key=lambda x: x.created_at)

    response = []

    for message in messages:
        response.append(
            SessionMessageSchema(
                id=message.id,
                created_at=message.created_at,
                text=message.text,
                from_user=message.from_user,
                documents_used=[str(doc.id) for doc in message.documents_used],
            )
        )

    return response


class PostSessionMessageRequest(BaseModel):
    message: str


@api.post("/session/chat", response_model=SessionMessageSchema, tags=["session"])
async def global_chat_with_current_session(
    body: PostSessionMessageRequest,
    session: SessionModel = Depends(require_session),
) -> SessionMessageSchema:
    message = await ask_global(session=session, question=body.message)

    return SessionMessageSchema(
        id=message.id,
        created_at=message.created_at,
        text=message.text,
        from_user=message.from_user,
        documents_used=[str(doc.id) for doc in message.documents_used],
    )
