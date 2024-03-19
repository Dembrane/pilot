from logging import getLogger
import os
from typing import List, Optional
from fastapi import APIRouter, UploadFile
from pydantic import BaseModel
from server.database import ConversationModel, ProjectModel, ResourceModel, db
from server.schemas import ConversationSchema, ProjectSchema, ResourceSchema
from server.api.exceptions import (
    ConversationInvalidPinException,
    ConversationNotOpenForParticipationException,
    ProjectLanguageNotSupportedException,
    ProjectNotFoundException,
    ResourceFailedToSaveFileException,
    ResourceInvalidFileFormatException,
)
from server.config import RESOURCE_UPLOADS_DIR
from server.process_resource import (
    ProcessResourceTaskQueueItem,
    process_resource_queue,
)
from server.api.session import DependencyRequireSession
from server.util import generate_4_digit_pin, generate_uuid

logger = getLogger("api.project")

ProjectRouter = APIRouter(tags=["project"])


@ProjectRouter.get("", response_model=List[ProjectSchema])
async def get_all_projects(
    session: DependencyRequireSession,
) -> List[ProjectModel]:
    return db.query(ProjectModel).filter(ProjectModel.session_id == session.id).all()


PROJECT_ALLOWED_LANGUAGES = ["en", "nl"]


class PostProjectRequestSchema(BaseModel):
    name: Optional[str] = None
    context: Optional[str] = None
    language: Optional[str] = None
    is_conversation_allowed: Optional[bool] = None
    default_conversation_title: Optional[str] = None
    default_conversation_description: Optional[str] = None
    default_conversation_context: Optional[str] = None


@ProjectRouter.post("", response_model=ProjectSchema)
async def create_project(
    body: PostProjectRequestSchema, session: DependencyRequireSession
) -> ProjectModel:
    if body.language is not None and body.language not in PROJECT_ALLOWED_LANGUAGES:
        raise ProjectLanguageNotSupportedException
    name = body.name or "New Project"
    context = body.context or None
    language = body.language or "en"

    # unique pin generation
    retry_left = 5
    while retry_left > 0:
        pin = generate_4_digit_pin()
        if not db.query(ProjectModel).filter(ProjectModel.pin == pin).first():
            break
        logger.info(f"Pin {pin} already exists. Generating a new pin")
        retry_left -= 1

    project = ProjectModel(
        id=generate_uuid(),
        session_id=session.id,
        pin=pin,
        name=name,
        context=context,
        language=language,
    )
    db.add(project)
    db.commit()
    return project


@ProjectRouter.get("/{project_id}", response_model=ProjectSchema)
async def get_project(
    project_id: str, session: DependencyRequireSession
) -> ProjectModel:
    project = (
        db.query(ProjectModel)
        .filter(ProjectModel.id == project_id, ProjectModel.session_id == session.id)
        .first()
    )
    if not project:
        raise ProjectNotFoundException
    return project


@ProjectRouter.put("/{project_id}", response_model=ProjectSchema)
async def update_project(
    project_id: str,
    body: PostProjectRequestSchema,
    session: DependencyRequireSession,
) -> ProjectModel:
    project = await get_project(project_id, session)

    if body.language is not None and body.language not in PROJECT_ALLOWED_LANGUAGES:
        raise ProjectLanguageNotSupportedException

    project.name = body.name or project.name
    project.context = body.context or project.context
    project.language = body.language or project.language

    if body.is_conversation_allowed is not None:
        project.is_conversation_allowed = body.is_conversation_allowed

    project.default_conversation_title = (
        body.default_conversation_title or project.default_conversation_title
    )
    project.default_conversation_description = (
        body.default_conversation_description
        or project.default_conversation_description
    )
    project.default_conversation_context = (
        body.default_conversation_context or project.default_conversation_context
    )

    db.commit()
    return project


@ProjectRouter.delete("/{project_id}", response_model=ProjectSchema)
async def delete_project(
    project_id: str, session: DependencyRequireSession
) -> ProjectModel:
    project = (
        db.query(ProjectModel)
        .filter(ProjectModel.id == project_id, ProjectModel.session_id == session.id)
        .first()
    )
    if not project:
        raise ProjectNotFoundException
    db.delete(project)
    db.commit()
    return project


@ProjectRouter.get(
    "/{project_id}/conversations",
    response_model=List[ConversationSchema],
    tags=["conversation"],
)
async def get_all_conversations_for_project(
    project_id: str, session: DependencyRequireSession
) -> List[ConversationModel]:
    if not ProjectModel.belongs_to_session(project_id, session.id):
        raise ProjectNotFoundException

    return (
        db.query(ConversationModel)
        .filter(ConversationModel.project_id == project_id)
        .all()
    )


class InitiateConversationRequestBodySchema(BaseModel):
    email: str
    pin: str


@ProjectRouter.post(
    "/{project_id}/conversations/initiate",
    response_model=ConversationSchema,
    tags=["conversation"],
)
async def initiate_conversation(
    body: InitiateConversationRequestBodySchema,
    project_id: str,
) -> ConversationModel:
    project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()

    if not project or project.pin != body.pin:
        raise ConversationInvalidPinException

    if project.is_conversation_allowed is False:
        raise ConversationNotOpenForParticipationException

    conversation = (
        db.query(ConversationModel)
        .filter(
            ConversationModel.project_id == project.id,
            ConversationModel.participant_email == body.email,
        )
        .first()
    )

    if conversation:
        return conversation

    new_conversation = ConversationModel(
        id=generate_uuid(),
        project_id=project.id,
        participant_email=body.email,
        title=project.default_conversation_title,
        description=project.default_conversation_description,
        context=project.default_conversation_context,
    )

    db.add(new_conversation)
    db.commit()

    return new_conversation


@ProjectRouter.get(
    "/{project_id}/resources", response_model=List[ResourceSchema], tags=["resource"]
)
async def get_all_resources_for_project(
    project_id: str,
    session: DependencyRequireSession,
) -> List[ResourceModel]:
    if not ProjectModel.belongs_to_session(project_id, session.id):
        raise ProjectNotFoundException

    return db.query(ResourceModel).filter(ResourceModel.project_id == project_id).all()


@ProjectRouter.post(
    "/{project_id}/resources/upload",
    response_model=List[ResourceSchema],
    tags=["resource"],
)
async def upload_resources(
    files: List[UploadFile], project_id: str, session: DependencyRequireSession
) -> List[ResourceModel]:
    resources = []

    for file in files:
        if not file.filename is None:
            original_filename = file.filename

            if not file.filename.endswith(".pdf"):
                raise ResourceInvalidFileFormatException

            file_name = file.filename.replace(" ", "_")
            type = "PDF"
            file_path = os.path.join(RESOURCE_UPLOADS_DIR, file_name)
            uuid = generate_uuid()

            if os.path.exists(file_path):
                logger.info(f"{file_path} already exists. Generating a unique filename")
                unique_filename = uuid + "_" + file_name
                file_path = os.path.join(RESOURCE_UPLOADS_DIR, unique_filename)

            file_content = await file.read()

            try:
                with open(file_path, "wb") as f:
                    logger.info(f"Saving the file to {file_path}")
                    f.write(file_content)

                resource = ResourceModel(
                    id=uuid,
                    project_id=project_id,
                    # initialize title with original filename
                    # doc will be summarized and title would be updated later
                    original_filename=original_filename,
                    type=type,
                    path=file_path,
                    title=original_filename,
                )
                db.add(resource)
                db.commit()
                resources.append(resource)

                process_resource_queue.add_task(
                    ProcessResourceTaskQueueItem(resource=resource)
                )

            except Exception as e:
                logger.error(f"Failed to save the file: {e}")
                raise ResourceFailedToSaveFileException

    db.commit()
    return resources
