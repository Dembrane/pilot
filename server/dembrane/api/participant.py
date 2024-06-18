import os
from typing import List, Optional, Annotated
from logging import getLogger
from datetime import datetime

from fastapi import Form, APIRouter, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import joinedload
from sqlalchemy.inspection import inspect

from dembrane.tasks import process_conversation_chunk
from dembrane.utils import generate_uuid
from dembrane.config import AUDIO_CHUNKS_DIR
from dembrane.schemas import (
    PublicProjectSchema,
    PublicConversationSchema,
    PublicConversationChunkSchema,
)
from dembrane.database import (
    ProjectModel,
    ProjectTagModel,
    ConversationModel,
    ConversationChunkModel,
    DependencyInjectDatabase,
)
from dembrane.api.exceptions import (
    ProjectNotFoundException,
    ConversationNotFoundException,
    ConversationInvalidPinException,
    ConversationNotOpenForParticipationException,
)

logger = getLogger("api.participant")

ParticipantRouter = APIRouter(tags=["participant"])

def clean_response(model, remove_keys=None):
    if remove_keys is None:
        remove_keys = []
    # Convert the SQLAlchemy model to a dictionary
    data = {c.key: getattr(model, c.key) for c in inspect(model).mapper.column_attrs}
    # Remove the specified keys
    for key in remove_keys:
        if key in data:
            del data[key]
    return data

class InitiateConversationRequestBodySchema(BaseModel):
    name: str
    pin: str
    conversation_id: Optional[str] = None
    email: Optional[str] = None
    user_agent: Optional[str] = None
    tag_id_list: Optional[List[str]] = []


@ParticipantRouter.post(
    "/projects/{project_id}/conversations/initiate",
    response_model=PublicConversationSchema,
    tags=["conversation"],
)
async def initiate_conversation(
    body: InitiateConversationRequestBodySchema,
    project_id: str,
    db: DependencyInjectDatabase,
) -> ConversationModel:
    project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()

    if not project or project.pin != body.pin:
        raise ConversationInvalidPinException

    if project.is_conversation_allowed is False:
        raise ConversationNotOpenForParticipationException

    if body.conversation_id:
        conversation = (
            db.query(ConversationModel)
            .filter(
                ConversationModel.project_id == project.id,
                ConversationModel.id == body.conversation_id,
            )
            .first()
        )

        # Rejoin a conversation
        if conversation:
            logger.info(f"Conversation already exists: {conversation.id}")

            conversation.participant_name = body.name
            if body.user_agent:
                conversation.participant_user_agent = body.user_agent
            if body.email:
                conversation.participant_email = body.email

            if body.tag_id_list is not None and len(body.tag_id_list) > 0:
                tags = db.query(ProjectTagModel).filter(ProjectTagModel.id.in_(body.tag_id_list)).all()
                conversation.tags = tags

            db.commit()
            return conversation

    # Create a new conversation
    new_conversation = ConversationModel(
        id=generate_uuid(),
        project_id=project.id,
        participant_name=body.name,
        participant_email=body.email if body.email else None,
        participant_user_agent=body.user_agent if body.user_agent else None,
        title=project.default_conversation_title,
        description=project.default_conversation_description,
        context=project.default_conversation_context,
    )

    if body.tag_id_list is not None and len(body.tag_id_list) > 0:
        tags = db.query(ProjectTagModel).filter(ProjectTagModel.id.in_(body.tag_id_list)).all()
        new_conversation.tags = tags

    db.add(new_conversation)
    db.commit()
    
    cleaned_response = clean_response(new_conversation, ['created_at', 'updated_at'])

    return cleaned_response

@ParticipantRouter.get("/projects/{project_id}", response_model=PublicProjectSchema)
async def get_project(
    project_id: str,
    db: DependencyInjectDatabase,
) -> ProjectModel:
    project = (
        db.query(ProjectModel)
        .options(joinedload(ProjectModel.tags))
        .filter(
            ProjectModel.id == project_id,
        )
        .first()
    )
    if not project:
        raise ProjectNotFoundException
    
    cleaned_response = clean_response(project, ['id', 'created_at', 'updated_at'])

    return cleaned_response

async def get_conversation(conversation_id: str, db: DependencyInjectDatabase) -> ConversationModel:
    conversation = (
        db.query(ConversationModel)
        .options(
            joinedload(ConversationModel.tags),
            joinedload(ConversationModel.chunks),
        )
        .filter(
            ConversationModel.id == conversation_id,
        )
        .first()
    )
    if not conversation:
        raise ConversationNotFoundException
    return conversation

class UploadConversationBodySchema(BaseModel):
    timestamp: datetime
    content: str

@ParticipantRouter.post("/conversations/{conversation_id}/upload-text", response_model=PublicConversationChunkSchema)
async def upload_conversation_text(
    conversation_id: str,
    body: UploadConversationBodySchema,
    db: DependencyInjectDatabase,
) -> ConversationChunkModel:
    conversation = await get_conversation(conversation_id, db)

    chunk = ConversationChunkModel(
        id=generate_uuid(),
        conversation_id=conversation.id,
        timestamp=body.timestamp,
        transcript=body.content,
        path=None,
    )

    db.add(chunk)
    db.commit()

    cleaned_response = clean_response(chunk, ['id', 'created_at', 'updated_at', 'conversation_id', 'transcript'])

    return cleaned_response

@ParticipantRouter.post("/conversations/{conversation_id}/upload-chunk", response_model=List[PublicConversationChunkSchema])
async def upload_conversation_chunk(
    conversation_id: str,
    chunk: UploadFile,
    timestamp: Annotated[datetime, Form()],
    db: DependencyInjectDatabase,
) -> List[ConversationChunkModel]:
    conversation = await get_conversation(conversation_id, db)

    id = generate_uuid()
    file_path = os.path.join(AUDIO_CHUNKS_DIR, conversation.id, f"{id}-{chunk.filename}")

    # ensure the directory exists
    os.makedirs(os.path.dirname(file_path), exist_ok=True)

    # remove unnecessary information from the file_path
    file_path = file_path.split(";")[0]

    with open(file_path, "wb") as f:
        logger.info(f"Saving the file to {file_path}")
        f.write(chunk.file.read())

    chunk = ConversationChunkModel(
        id=id,
        conversation_id=conversation_id,
        timestamp=timestamp,
        path=file_path,
    )

    db.add(chunk)
    db.commit()

    logger.info(f"Add to processing queue: ConversationChunk@{chunk.id}")
    process_conversation_chunk.delay(chunk.id)

    cleaned_response = clean_response(chunk, ['id', 'created_at', 'updated_at', 'conversation_id', 'transcript'])

    return [cleaned_response]