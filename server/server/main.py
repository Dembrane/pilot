import os
import time
from uuid import uuid4
from logging import getLogger

from fastapi import Depends, FastAPI, UploadFile, HTTPException
from server.models import DocumentModel, SessionModel, db
from fastapi import Request, Response

from server.config import UPLOADS_DIR
from server.process import ProcessDocumentTaskQueueItem, seed_process_document_queue, process_document_queue

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
async def initiate_session(request: Request, response: Response, session_id: str = None):
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



@app.post("/upload-document")
async def upload_document(file: UploadFile, session: SessionModel = Depends(require_session)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Invalid file format. Only .pdf files are supported.")

    file_name = file.filename.replace(" ", "_")
    file_path = os.path.join(UPLOADS_DIR, file_name)
    uuid = str(uuid4())
    
    if os.path.exists(file_path):
        logger.info(f"File {file_name} already exists. Generating a unique filename")
        unique_filename = str(uuid) + "_" + file_name
        file_path = os.path.join(UPLOADS_DIR, unique_filename)
    
    file_content = await file.read()

    try:
        with open(file_path, "wb") as f:
            logger.info(f"Saving the file to {file_path}")
            f.write(file_content)

        document = DocumentModel(id=uuid, path=file_path, session_id=session.id)        
        db.add(document)
        db.commit()

    except Exception as e:
        logger.error(f"Failed to save the file: {e}")
        raise HTTPException(status_code=500, detail="Failed to save the file")
    
    process_document_queue.add_task(ProcessDocumentTaskQueueItem(document))
    
    return {"message": "Document uploaded successfully", "document_id": document.id}

@app.get("/document")
async def get_documents(session: SessionModel = Depends(require_session)):
    documents = db.query(DocumentModel).filter(DocumentModel.session_id == session.id).all()
    return documents

@app.get("/document/{document_id}")
async def get_document(document_id: int, session: SessionModel = Depends(require_session)):
    document = db.query(DocumentModel).filter(DocumentModel.id == document_id, DocumentModel.session_id == session.id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return document