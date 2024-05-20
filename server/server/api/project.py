import asyncio
from http import HTTPStatus
from logging import getLogger
import os
import zipfile
from typing import Generator, List, Optional
from fastapi import APIRouter, BackgroundTasks, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from server.database import (
    ConversationModel,
    InsightModel,
    ProjectAnalysisRunModel,
    ProjectModel,
    ResourceModel,
    DependencyInjectDatabase,
    ProjectTagModel,
)
from server.schemas import (
    ConversationSchema,
    InsightSchema,
    ProjectSchema,
    ProjectTagSchema,
    ResourceSchema,
    TaskSchema,
)
from server.api.exceptions import (
    ConversationInvalidPinException,
    ConversationNotOpenForParticipationException,
    ProjectLanguageNotSupportedException,
    ProjectNotFoundException,
    ProjectTagNotFoundException,
    ResourceFailedToSaveFileException,
    ResourceInvalidFileFormatException,
    InternalServerException,
)
from server.config import AUDIO_CHUNKS_DIR, RESOURCE_UPLOADS_DIR

# from server.process_resource import (
#     ProcessResourceTaskQueueItem,
#     process_resource_queue,
# )
from server.api.session import DependencyRequireSession
from server.api.conversation import get_conversation, get_conversation_chunks
from server.tasks import process_project
from server.utils import generate_4_digit_pin, generate_6_digit_pin, generate_uuid
from sqlalchemy.orm import Session, joinedload


logger = getLogger("api.project")

ProjectRouter = APIRouter(tags=["project"])


@ProjectRouter.get("", response_model=List[ProjectSchema])
async def get_all_projects(
    session: DependencyRequireSession, db: DependencyInjectDatabase
) -> List[ProjectModel]:
    projects = (
        db.query(ProjectModel)
        .options(joinedload(ProjectModel.tags))
        .filter(ProjectModel.session_id == session.id)
        .all()
    )

    return projects


PROJECT_ALLOWED_LANGUAGES = ["en", "nl", "multi"]


class PostProjectRequestSchema(BaseModel):
    name: Optional[str] = None
    context: Optional[str] = None
    language: Optional[str] = None
    is_conversation_allowed: Optional[bool] = None
    default_conversation_title: Optional[str] = None
    default_conversation_description: Optional[str] = None
    default_conversation_context: Optional[str] = None
    default_conversation_finish_text: Optional[str] = None


@ProjectRouter.post("", response_model=ProjectSchema)
async def create_project(
    body: PostProjectRequestSchema,
    session: DependencyRequireSession,
    db: DependencyInjectDatabase,
) -> ProjectModel:
    if body.language is not None and body.language not in PROJECT_ALLOWED_LANGUAGES:
        raise ProjectLanguageNotSupportedException
    name = body.name or "New Project"
    context = body.context or None
    language = body.language or "en"

    # unique pin generation
    pin = None
    retry_left = 3
    while retry_left > 0:
        pin = generate_4_digit_pin()
        if not db.query(ProjectModel).filter(ProjectModel.pin == pin).first():
            break
        logger.info(f"Pin {pin} already exists. Generating a new pin")
        retry_left -= 1

    if not pin:
        retry_left = 5
        while retry_left > 0:
            pin = generate_6_digit_pin()
            if not db.query(ProjectModel).filter(ProjectModel.pin == pin).first():
                break
            logger.info(f"Pin {pin} already exists. Generating a new 6 digit pin")
            retry_left -= 1

    if not pin:
        logger.error("Failed to generate a unique pin")
        raise InternalServerException

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
    return project


async def generate_transcript_file(conversation_id: str, db: Session) -> Optional[str]:
    logger.info(f"generating transcript for conversation {conversation_id}")
    chunks = await get_conversation_chunks(conversation_id, db)

    if not chunks:
        return None

    conversation = await get_conversation(conversation_id, db)
    email = conversation.participant_email
    name = conversation.participant_name

    name_for_file = ""
    if name:
        name_for_file += name.replace(" ", "_")
    if email:
        name_for_file += f"_{email}"

    conversation_dir = os.path.join(AUDIO_CHUNKS_DIR, conversation_id)

    os.makedirs(conversation_dir, exist_ok=True)
    file_path = os.path.join(conversation_dir, name_for_file + "-transcript.md")

    with open(file_path, "w") as file:
        for chunk in chunks:
            try:
                if chunk.transcript is not None:
                    file.write(str(chunk.transcript) + "\n")
            except Exception as e:
                logger.error(f"Failed to write transcript for chunk {chunk.id}: {e}")

    return file_path


async def cleanup_files(zip_file_name: str, filenames: List[str]) -> None:
    os.remove(zip_file_name)
    for filename in filenames:
        os.remove(filename)


@ProjectRouter.get("/{project_id}/transcripts")
async def get_project_transcripts(
    project_id: str,
    session: DependencyRequireSession,
    db: DependencyInjectDatabase,
    background_tasks: BackgroundTasks,
) -> StreamingResponse:
    project = await get_project(project_id, db)

    conversations = await get_all_conversations_for_project(project_id, session, db)

    if not conversations:
        raise HTTPException(
            status_code=404, detail="No conversations found for this project"
        )

    conversations = [
        c
        for c in conversations
        if c.chunks and any(ch.transcript is not None for ch in c.chunks)
    ]

    filename_futures = [
        generate_transcript_file(conversation.id, db) for conversation in conversations
    ]
    filenames = await asyncio.gather(*filename_futures)

    filenames = [filename for filename in filenames if filename]
    if not filenames:
        raise HTTPException(
            status_code=404, detail="No transcripts available for this project"
        )

    zip_file_name = f"{project.name}_transcripts.zip"
    with zipfile.ZipFile(zip_file_name, "w", zipfile.ZIP_DEFLATED) as zipf:
        for filename in filenames:
            arcname = os.path.basename(filename)
            zipf.write(filename, arcname)

    def iterfile() -> Generator[bytes, None, None]:
        with open(zip_file_name, "rb") as file:
            yield from file

    response = StreamingResponse(iterfile(), media_type="application/zip")
    response.headers["Content-Disposition"] = f"attachment; filename={zip_file_name}"
    # Schedule cleanup task to run after the response has been sent
    background_tasks.add_task(
        cleanup_files,
        response.headers["Content-Disposition"].split("=")[1],
        [os.path.join(AUDIO_CHUNKS_DIR, project_id, "transcript.md")],
    )
    return response


@ProjectRouter.put("/{project_id}", response_model=ProjectSchema)
async def update_project(
    project_id: str,
    body: PostProjectRequestSchema,
    session: DependencyRequireSession,
    db: DependencyInjectDatabase,
) -> ProjectModel:
    project = await get_project(project_id, db)

    for field, value in body.model_dump(exclude_unset=True, exclude_none=False).items():
        if field == "language" and value not in PROJECT_ALLOWED_LANGUAGES:
            raise HTTPException(status_code=400, detail="Unsupported language")
        logger.info(f"Setting {field} to {value}")
        setattr(project, field, value)

    db.commit()
    return project


@ProjectRouter.delete("/{project_id}", response_model=ProjectSchema)
async def delete_project(
    project_id: str, session: DependencyRequireSession, db: DependencyInjectDatabase
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
    project_id: str, session: DependencyRequireSession, db: DependencyInjectDatabase
) -> List[ConversationModel]:
    if not ProjectModel.belongs_to_session(project_id, session.id):
        raise ProjectNotFoundException

    return (
        db.query(ConversationModel)
        .options(
            joinedload(ConversationModel.tags), joinedload(ConversationModel.chunks)
        )
        .filter(ConversationModel.project_id == project_id)
        .all()
    )


class InitiateConversationRequestBodySchema(BaseModel):
    name: str
    pin: str
    conversation_id: Optional[str] = None
    email: Optional[str] = None
    user_agent: Optional[str] = None
    tag_id_list: Optional[List[str]] = []


@ProjectRouter.post(
    "/{project_id}/conversations/initiate",
    response_model=ConversationSchema,
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
                tags = (
                    db.query(ProjectTagModel)
                    .filter(ProjectTagModel.id.in_(body.tag_id_list))
                    .all()
                )
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
        tags = (
            db.query(ProjectTagModel)
            .filter(ProjectTagModel.id.in_(body.tag_id_list))
            .all()
        )
        new_conversation.tags = tags

    db.add(new_conversation)
    db.commit()

    return new_conversation


@ProjectRouter.get(
    "/{project_id}/resources", response_model=List[ResourceSchema], tags=["resource"]
)
async def get_all_resources_for_project(
    project_id: str, session: DependencyRequireSession, db: DependencyInjectDatabase
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
    files: List[UploadFile],
    project_id: str,
    session: DependencyRequireSession,
    db: DependencyInjectDatabase,
) -> List[ResourceModel]:
    resources = []

    for file in files:
        if not file.filename:
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

                # process_resource_queue.add_task(
                #     ProcessResourceTaskQueueItem(resource=resource)
                # )

            except Exception as e:
                logger.error(f"Failed to save the file: {e}")
                raise ResourceFailedToSaveFileException

    db.commit()
    return resources


@ProjectRouter.get("/{project_id}/tag", response_model=List[ProjectTagSchema])
async def get_project_tags(
    project_id: str, db: DependencyInjectDatabase
) -> List[ProjectTagModel]:
    tags = (
        db.query(ProjectTagModel).filter(ProjectTagModel.project_id == project_id).all()
    )

    return tags


class CreateProjectTagRequestBodySchema(BaseModel):
    text: str


@ProjectRouter.post("/{project_id}/tag", response_model=ProjectTagSchema)
async def create_project_tag(
    body: CreateProjectTagRequestBodySchema,
    project_id: str,
    session: DependencyRequireSession,
    db: DependencyInjectDatabase,
) -> ProjectTagModel:
    if not ProjectModel.belongs_to_session(project_id, session.id):
        raise ProjectNotFoundException

    tag = ProjectTagModel(id=generate_uuid(), project_id=project_id, text=body.text)

    db.add(tag)
    db.commit()

    return tag


@ProjectRouter.put("/{project_id}/tag/{tag_id}", response_model=ProjectTagSchema)
async def update_project_tag(
    project_id: str,
    tag_id: str,
    body: CreateProjectTagRequestBodySchema,
    session: DependencyRequireSession,
    db: DependencyInjectDatabase,
) -> ProjectTagModel:
    if not ProjectModel.belongs_to_session(project_id, session.id):
        raise ProjectNotFoundException

    tag = (
        db.query(ProjectTagModel)
        .filter(ProjectTagModel.project_id == project_id, ProjectTagModel.id == tag_id)
        .first()
    )

    if not tag:
        raise ProjectTagNotFoundException

    tag.text = body.text

    db.commit()

    return tag


@ProjectRouter.delete("/{project_id}/tag/{tag_id}", response_model=ProjectTagSchema)
async def delete_project_tag(
    project_id: str,
    tag_id: str,
    session: DependencyRequireSession,
    db: DependencyInjectDatabase,
) -> ProjectTagModel:
    if not ProjectModel.belongs_to_session(project_id, session.id):
        raise ProjectNotFoundException

    tag = (
        db.query(ProjectTagModel)
        .filter(ProjectTagModel.project_id == project_id, ProjectTagModel.id == tag_id)
        .first()
    )

    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    db.delete(tag)
    db.commit()

    return tag


@ProjectRouter.post(
    "/{project_id}/request-analysis",
    response_model=TaskSchema,
    status_code=HTTPStatus.ACCEPTED,
)
async def request_project_analysis(
    project_id: str,
    session: DependencyRequireSession,
    db: DependencyInjectDatabase,
):
    project = await get_project(
        db=db,
        project_id=project_id,
    )

    task = process_project.si(project.id).delay()

    logger.info(f"Task {task.id} created for project {project.id}")

    # TODO: add a result backend and task ID checks
    return TaskSchema(
        id=task.id,
        status="PENDING",
    )


def get_latest_project_analysis_run(db: DependencyInjectDatabase, project_id: str):
    return (
        db.query(ProjectAnalysisRunModel)
        .filter(ProjectAnalysisRunModel.project_id == project_id)
        .order_by(ProjectAnalysisRunModel.created_at.desc())
        .first()
    )


@ProjectRouter.get("/{project_id}/insights", response_model=List[InsightSchema])
async def get_project_insights(
    project_id: str,
    db: DependencyInjectDatabase,
    session: DependencyRequireSession,
) -> List[InsightModel]:
    project = await get_project(project_id, db)

    latest_project_analysis = get_latest_project_analysis_run(db, project.id)

    if not latest_project_analysis:
        return []

    insights = (
        db.query(InsightModel)
        .options(joinedload(InsightModel.quotes))
        .filter(InsightModel.project_analysis_run_id == latest_project_analysis.id)
        .all()
    )

    return insights
