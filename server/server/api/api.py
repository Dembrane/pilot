from logging import getLogger
from fastapi import (
    APIRouter,
)

from server.api.session import SessionRouter
from server.api.project import ProjectRouter
from server.api.resource import ResourceRouter
from server.api.conversation import ConversationRouter

logger = getLogger("api")

api = APIRouter()


@api.get("/health")
async def health() -> dict:
    return {"status": "ok"}


api.include_router(SessionRouter, prefix="/session")
api.include_router(ProjectRouter, prefix="/projects")
api.include_router(ResourceRouter, prefix="/resources")
api.include_router(ConversationRouter, prefix="/conversations")

## the code below is from the pdf-pilot - chat usecase
## ignore for now

# class DocumentSchema(BaseModel):
#     id: str
#     created_at: datetime
#     title: str | None
#     description: str | None
#     context: str | None
#     is_processed: bool
#     processing_error: str | None
#     original_filename: str


# @api.post("/document/upload", response_model=List[DocumentSchema], tags=["document"])
# async def upload_document(
#     files: List[UploadFile], session: ProjectModel = Depends(require_session)
# ) -> List[DocumentModel]:
#     documents = []

#     for file in files:
#         if not file.filename is None:
#             original_filename = file.filename

#             if not file.filename.endswith(".pdf"):
#                 raise HTTPException(
#                     status_code=400,
#                     detail=f"Invalid file format ({file.filename}). Only .pdf files are supported.",
#                 )

#             file_name = file.filename.replace(" ", "_")
#             file_path = os.path.join(UPLOADS_DIR, file_name)
#             uuid = str(uuid4())

#             if os.path.exists(file_path):
#                 logger.info(
#                     f"File {file_name} already exists. Generating a unique filename"
#                 )
#                 unique_filename = str(uuid) + "_" + file_name
#                 file_path = os.path.join(UPLOADS_DIR, unique_filename)

#             file_content = await file.read()

#             try:
#                 with open(file_path, "wb") as f:
#                     logger.info(f"Saving the file to {file_path}")
#                     f.write(file_content)

#                 document = DocumentModel(
#                     id=uuid,
#                     session_id=session.id,
#                     # initialize title with original filename
#                     # doc will be summarized and title would be updated later
#                     title=original_filename,
#                     path=file_path,
#                     original_filename=original_filename,
#                 )
#                 db.add(document)
#                 db.commit()
#                 documents.append(document)

#             except Exception as e:
#                 logger.error(f"Failed to save the file: {e}")
#                 raise HTTPException(status_code=500, detail="Failed to save the file")

#             process_document_queue.add_task(
#                 ProcessDocumentTaskQueueItem(document=document)
#             )

#     db.commit()
#     return documents


# @api.get("/document", response_model=List[DocumentSchema], tags=["document"])
# async def get_all_documents(
#     session: ProjectModel = Depends(require_session),
# ) -> List[DocumentModel]:
#     documents = (
#         db.query(DocumentModel).filter(DocumentModel.session_id == session.id).all()
#     )
#     return documents


# @api.get("/document/{document_id}", response_model=DocumentSchema, tags=["document"])
# async def get_document_by_id(
#     document_id: str, session: ProjectModel = Depends(require_session)
# ) -> DocumentModel:
#     document = (
#         db.query(DocumentModel)
#         .filter(DocumentModel.id == document_id, DocumentModel.session_id == session.id)
#         .first()
#     )
#     if not document:
#         raise HTTPException(status_code=404, detail="Document not found")

#     return document


# class PutDocumentRequest(BaseModel):
#     context: str | None


# @api.put("/document/{document_id}", response_model=DocumentSchema, tags=["document"])
# async def update_document_by_id(
#     document_id: str,
#     request: PutDocumentRequest,
#     session: ProjectModel = Depends(require_session),
# ) -> DocumentModel:
#     document = (
#         db.query(DocumentModel)
#         .filter(DocumentModel.id == document_id, DocumentModel.session_id == session.id)
#         .first()
#     )
#     if not document:
#         raise HTTPException(status_code=404, detail="Document not found")

#     if request.context:
#         document.context = request.context

#     db.add(document)
#     db.commit()
#     return document


# @api.delete("/document/{document_id}", tags=["document"])
# async def delete_document_by_id(
#     document_id: str,
#     session: ProjectModel = Depends(require_session),
# ) -> dict:
#     document = (
#         db.query(DocumentModel)
#         .filter(DocumentModel.id == document_id, DocumentModel.session_id == session.id)
#         .first()
#     )
#     if not document:
#         raise HTTPException(status_code=404, detail="Document not found")

#     db.delete(document)
#     db.commit()
#     return {"message": "Document deleted successfully"}


# class DocumentMessageSchema(BaseModel):
#     id: str
#     document_id: str
#     created_at: datetime
#     text: str
#     from_user: bool
#     is_global: bool


# @api.get(
#     "/document/{document_id}/chat",
#     response_model=List[DocumentMessageSchema],
#     tags=["document"],
# )
# async def get_chat_history_with_document_by_id(
#     document_id: str, session: ProjectModel = Depends(require_session)
# ) -> List[DocumentMessageModel]:
#     document = (
#         db.query(DocumentModel)
#         .filter(DocumentModel.id == document_id, DocumentModel.session_id == session.id)
#         .order_by(DocumentModel.created_at.desc())
#         .first()
#     )
#     if not document:
#         raise HTTPException(status_code=404, detail="Document not found")

#     messages = document.messages

#     return messages


# class PostDocumentMessageRequest(BaseModel):
#     message: str


# @api.post(
#     "/document/{document_id}/chat",
#     response_model=DocumentMessageSchema,
#     tags=["document"],
# )
# async def chat_with_document_by_id(
#     document_id: str,
#     body: PostDocumentMessageRequest,
#     session: ProjectModel = Depends(require_session),
# ) -> DocumentMessageModel:
#     document = (
#         db.query(DocumentModel)
#         .filter(DocumentModel.id == document_id, DocumentModel.session_id == session.id)
#         .first()
#     )
#     if not document:
#         raise HTTPException(status_code=404, detail="Document not found")

#     ai_response = await ask_document(document=document, question=body.message)

#     return ai_response


# class SessionMessageSchema(BaseModel):
#     id: str
#     created_at: datetime
#     text: str
#     from_user: bool
#     documents_used: List[str]


# @api.get("/session/chat", response_model=List[SessionMessageSchema], tags=["session"])
# async def get_global_chat_history_with_current_session(
#     session: ProjectModel = Depends(require_session),
# ) -> List[SessionMessageSchema]:
#     messages = session.messages
#     messages.sort(key=lambda x: x.created_at)

#     response = []

#     for message in messages:
#         response.append(
#             SessionMessageSchema(
#                 id=message.id,
#                 created_at=message.created_at,
#                 text=message.text,
#                 from_user=message.from_user,
#                 documents_used=[str(doc.id) for doc in message.documents_used],
#             )
#         )

#     return response


# class PostSessionMessageRequest(BaseModel):
#     message: str


# @api.post("/session/chat", response_model=SessionMessageSchema, tags=["session"])
# async def global_chat_with_current_session(
#     body: PostSessionMessageRequest,
#     session: ProjectModel = Depends(require_session),
# ) -> SessionMessageSchema:
#     message = await ask_global(session=session, question=body.message)

#     return SessionMessageSchema(
#         id=message.id,
#         created_at=message.created_at,
#         text=message.text,
#         from_user=message.from_user,
#         documents_used=[str(doc.id) for doc in message.documents_used],
#     )
