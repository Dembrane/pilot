from datetime import datetime
import os
import time
from typing import List
from uuid import uuid4
from logging import getLogger

from fastapi import Depends, FastAPI, UploadFile, HTTPException
from pydantic import BaseModel
from server.models import DocumentModel, SessionModel, db
from fastapi import Request, Response

from server.config import UPLOADS_DIR
from server.process import (
    ProcessDocumentTaskQueueItem,
    seed_process_document_queue,
    process_document_queue,
)
from server.chains import ask_document

logger = getLogger("server")

# init stuff
seed_process_document_queue()

app = FastAPI()


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response


InvalidSessionException = HTTPException(status_code=401, detail="Invalid session")


async def require_session(request: Request):
    session_id = request.cookies.get("sid")
    if not session_id:
        raise InvalidSessionException

    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise InvalidSessionException

    return session


@app.get("/initiate")
async def initiate_session(
    request: Request, response: Response, session_id: str = None
):
    if session_id:
        session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
    else:
        session = SessionModel()
        db.add(session)
        db.commit()

    response.set_cookie(key="sid", value=session.id, httponly=True)

    return {"message": "Session initiated successfully"}


class DocumentSchema(BaseModel):
    id: str
    created_at: datetime
    title: str | None
    description: str | None
    context: str | None
    is_processed: bool
    processing_error: str | None


@app.post("/upload-document", response_model=List[DocumentSchema])
async def upload_document(
    files: List[UploadFile], session: SessionModel = Depends(require_session)
):
    documents = []

    for file in files:
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

            document = DocumentModel(id=uuid, path=file_path, session_id=session.id)
            db.add(document)
            documents.append(document)

        except Exception as e:
            logger.error(f"Failed to save the file: {e}")
            raise HTTPException(status_code=500, detail="Failed to save the file")

        process_document_queue.add_task(ProcessDocumentTaskQueueItem(document))

    db.commit()
    return documents


@app.get("/document", response_model=List[DocumentSchema])
async def get_documents(session: SessionModel = Depends(require_session)):
    documents = (
        db.query(DocumentModel).filter(DocumentModel.session_id == session.id).all()
    )
    return documents


@app.get("/document/{document_id}", response_model=DocumentSchema)
async def get_document(
    document_id: str, session: SessionModel = Depends(require_session)
):
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


@app.put("/document/{document_id}", response_model=DocumentSchema)
async def put_document(
    document_id: str,
    request: PutDocumentRequest,
    session: SessionModel = Depends(require_session),
):
    document = (
        db.query(DocumentModel)
        .filter(DocumentModel.id == document_id, DocumentModel.session_id == session.id)
        .first()
    )
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    document.context = request.context

    db.add(document)
    db.commit()
    return document


class DocumentMessageSchema(BaseModel):
    id: str
    document_id: str
    created_at: datetime
    text: str
    from_user: bool


class PostDocumentMessageRequest(BaseModel):
    message: str


@app.post("/document/{document_id}/chat", response_model=DocumentMessageSchema)
async def chat_with_document(
    document_id: str,
    body: PostDocumentMessageRequest,
    session: SessionModel = Depends(require_session),
):
    document = (
        db.query(DocumentModel)
        .filter(DocumentModel.id == document_id, DocumentModel.session_id == session.id)
        .first()
    )
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    ai_response = ask_document(document, body.message)

    return ai_response


@app.get("/document/{document_id}/chat", response_model=List[DocumentMessageSchema])
async def get_chat_with_document(
    document_id: str, session: SessionModel = Depends(require_session)
):
    document = (
        db.query(DocumentModel)
        .filter(DocumentModel.id == document_id, DocumentModel.session_id == session.id)
        .first()
    )
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    messages = document.messages
    messages.sort(key=lambda m: m.created_at, reverse=True)

    return messages
