import os
import asyncio
import zipfile
from http import HTTPStatus
from typing import List, Optional, Generator
from logging import getLogger

from fastapi import APIRouter, UploadFile, HTTPException, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.orm import Session
from fastapi.responses import StreamingResponse

from dembrane.tasks import task_create_view, task_create_project_library
from dembrane.utils import (
    generate_uuid,
    get_safe_filename,
    generate_4_digit_pin,
)
from dembrane.config import AUDIO_CHUNKS_DIR, RESOURCE_UPLOADS_DIR
from dembrane.schemas import (
    TaskSchema,
    ProjectSchema,
    ResourceSchema,
)
from dembrane.api.auth import DependencyDirectusUid
from dembrane.database import (
    ProjectModel,
    SessionModel,
    ResourceModel,
    ConversationModel,
    ProcessingStatusEnum,
    ProjectAnalysisRunModel,
    DependencyInjectDatabase,
)

# from dembrane.process_resource import (
#     ProcessResourceTaskQueueItem,
#     process_resource_queue,
# )
from dembrane.api.session import DependencyRequireSession
from dembrane.api.exceptions import (
    ProjectNotFoundException,
    ResourceFailedToSaveFileException,
    ResourceInvalidFileFormatException,
    ProjectLanguageNotSupportedException,
)
from dembrane.api.conversation import get_conversation, get_conversation_chunks

logger = getLogger("api.project")

ProjectRouter = APIRouter(tags=["project"])


# @ProjectRouter.get("", response_model=List[ProjectSchema])
# async def get_all_projects(
#     session: DependencyRequireSession, db: DependencyInjectDatabase
# ) -> List[ProjectModel]:
#     projects = (
#         db.query(ProjectModel)
#         .options(selectinload(ProjectModel.tags))
#         .filter(ProjectModel.session_id == session.id)
#         .all()
#     )

#     return projects


PROJECT_ALLOWED_LANGUAGES = ["en", "nl", "multi"]


class CreateProjectRequestSchema(BaseModel):
    session_id: int
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
    body: CreateProjectRequestSchema,
    db: DependencyInjectDatabase,
    uid: DependencyDirectusUid,
) -> ProjectModel:
    if body.language is not None and body.language not in PROJECT_ALLOWED_LANGUAGES:
        raise ProjectLanguageNotSupportedException
    name = body.name or "New Project"
    context = body.context or None
    language = body.language or "en"

    # pin generation
    pin = generate_4_digit_pin()

    session = db.get(SessionModel, body.session_id)

    if session.user_id != uid:
        logger.error(f"User {uid} does not have access to session {session.id}")
        raise HTTPException(status_code=403, detail="User does not have access to this session")

    project = ProjectModel(
        id=generate_uuid(),
        session_id=body.session_id,
        pin=pin,
        name=name,
        context=context,
        language=language,
    )
    db.add(project)
    db.commit()

    return project


# @ProjectRouter.get("/{project_id}", response_model=ProjectSchema)
# async def get_project(
#     project_id: str,
#     db: DependencyInjectDatabase,
# ) -> ProjectModel:
#     project = (
#         db.query(ProjectModel)
#         .options(selectinload(ProjectModel.tags))
#         .filter(
#             ProjectModel.id == project_id,
#         )
#         .first()
#     )
#     if not project:
#         raise ProjectNotFoundException
#     return project


async def generate_transcript_file(conversation_id: str, db: Session) -> Optional[str]:
    logger.info(f"generating transcript for conversation {conversation_id}")
    chunks = await get_conversation_chunks(conversation_id, db)

    if not chunks:
        return None

    conversation = await get_conversation(conversation_id, db, load_chunks=False)
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
    project = db.get(ProjectModel, project_id)

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    conversations = (
        db.query(ConversationModel).filter(ConversationModel.project_id == project_id).all()
    )

    if not conversations:
        raise HTTPException(status_code=404, detail="No conversations found for this project")

    conversations = [
        c for c in conversations if c.chunks and any(ch.transcript is not None for ch in c.chunks)
    ]

    filename_futures = [
        generate_transcript_file(conversation.id, db) for conversation in conversations
    ]
    filenames = await asyncio.gather(*filename_futures)

    filenames = [filename for filename in filenames if filename]
    if not filenames:
        raise HTTPException(status_code=404, detail="No transcripts available for this project")

    project_name_or_id = project.name if project.name is not None else project.id
    safe_project_name = get_safe_filename(project_name_or_id)
    zip_file_name = f"{safe_project_name}_transcripts.zip"

    with zipfile.ZipFile(zip_file_name, "w", zipfile.ZIP_DEFLATED) as zipf:
        for filename in filenames:
            if not filename:
                continue
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


# @ProjectRouter.put("/{project_id}", response_model=ProjectSchema)
# async def update_project(
#     project_id: str,
#     body: PostProjectRequestSchema,
#     _session: DependencyRequireSession,
#     db: DependencyInjectDatabase,
# ) -> ProjectModel:
#     project = await get_project(project_id, db)

#     for field, value in body.model_dump(exclude_unset=True, exclude_none=False).items():
#         if field == "language" and value not in PROJECT_ALLOWED_LANGUAGES:
#             raise HTTPException(status_code=400, detail="Unsupported language")
#         logger.info(f"Setting {field} to {value}")
#         setattr(project, field, value)

#     db.commit()
#     return project


# @ProjectRouter.delete("/{project_id}", response_model=ProjectSchema)
# async def delete_project(
#     project_id: str, session: DependencyRequireSession, db: DependencyInjectDatabase
# ) -> ProjectModel:
#     project = (
#         db.query(ProjectModel)
#         .filter(ProjectModel.id == project_id, ProjectModel.session_id == session.id)
#         .first()
#     )
#     if not project:
#         raise ProjectNotFoundException
#     db.delete(project)
#     db.commit()
#     return project


# @ProjectRouter.get(
#     "/{project_id}/conversations",
#     response_model=List[ConversationSchema],
#     tags=["conversation"],
# )
# async def get_all_conversations_for_project(
#     project_id: str, session: DependencyRequireSession, db: DependencyInjectDatabase
# ) -> List[ConversationModel]:
#     if not ProjectModel.belongs_to_session(project_id, session.id):
#         raise ProjectNotFoundException

#     return (
#         db.query(ConversationModel)
#         .options(selectinload(ConversationModel.tags), selectinload(ConversationModel.chunks))
#         .filter(ConversationModel.project_id == project_id)
#         .all()
#     )


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
    _session: DependencyRequireSession,
    db: DependencyInjectDatabase,
) -> List[ResourceModel]:
    resources = []

    for file in files:
        if not file.filename:
            original_filename = file.filename

            if not file.filename:
                raise ResourceInvalidFileFormatException

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
                raise ResourceFailedToSaveFileException from e

    db.commit()
    return resources


# @ProjectRouter.get("/{project_id}/tag", response_model=List[ProjectTagSchema])
# async def get_project_tags(project_id: str, db: DependencyInjectDatabase) -> List[ProjectTagModel]:
#     tags = db.query(ProjectTagModel).filter(ProjectTagModel.project_id == project_id).all()

# return tags


# class CreateProjectTagRequestBodySchema(BaseModel):
# text: str


# @ProjectRouter.post("/{project_id}/tag", response_model=ProjectTagSchema)
# async def create_project_tag(
#     body: CreateProjectTagRequestBodySchema,
#     project_id: str,
#     session: DependencyRequireSession,
#     db: DependencyInjectDatabase,
# ) -> ProjectTagModel:
#     if not ProjectModel.belongs_to_session(project_id, session.id):
#         raise ProjectNotFoundException

#     tag = ProjectTagModel(id=generate_uuid(), project_id=project_id, text=body.text)

#     db.add(tag)
#     db.commit()

#     return tag


# @ProjectRouter.put("/{project_id}/tag/{tag_id}", response_model=ProjectTagSchema)
# async def update_project_tag(
#     project_id: str,
#     tag_id: str,
#     body: CreateProjectTagRequestBodySchema,
#     session: DependencyRequireSession,
#     db: DependencyInjectDatabase,
# ) -> ProjectTagModel:
#     if not ProjectModel.belongs_to_session(project_id, session.id):
#         raise ProjectNotFoundException

#     tag = (
#         db.query(ProjectTagModel)
#         .filter(ProjectTagModel.project_id == project_id, ProjectTagModel.id == tag_id)
#         .first()
#     )

#     if not tag:
#         raise ProjectTagNotFoundException

#     tag.text = body.text

#     db.commit()

#     return tag


# @ProjectRouter.delete("/{project_id}/tag/{tag_id}", response_model=ProjectTagSchema)
# async def delete_project_tag(
#     project_id: str,
#     tag_id: str,
#     session: DependencyRequireSession,
#     db: DependencyInjectDatabase,
# ) -> ProjectTagModel:
#     if not ProjectModel.belongs_to_session(project_id, session.id):
#         raise ProjectNotFoundException

#     tag = (
#         db.query(ProjectTagModel)
#         .filter(ProjectTagModel.project_id == project_id, ProjectTagModel.id == tag_id)
#         .first()
#     )

#     if not tag:
#         raise HTTPException(status_code=404, detail="Tag not found")

#     db.delete(tag)
#     db.commit()

#     return tag


def get_latest_project_analysis_run(
    db: DependencyInjectDatabase, project_id: str
) -> Optional[ProjectAnalysisRunModel]:
    return (
        db.query(ProjectAnalysisRunModel)
        .filter(ProjectAnalysisRunModel.project_id == project_id)
        .order_by(ProjectAnalysisRunModel.created_at.desc())
        .first()
    )


@ProjectRouter.post(
    "/{project_id}/create-library",
    status_code=HTTPStatus.ACCEPTED,
)
async def post_create_project_library(
    db: DependencyInjectDatabase,
    project_id: str,
    user_id: DependencyDirectusUid,
) -> None:
    project = db.get(ProjectModel, project_id)

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project.session.user_id != user_id:
        raise HTTPException(status_code=403, detail="User does not have access to this project")

    analysis_run = get_latest_project_analysis_run(db, project.id)

    if analysis_run and analysis_run.processing_status in [
        ProcessingStatusEnum.PENDING,
        ProcessingStatusEnum.PROCESSING,
    ]:
        raise HTTPException(
            status_code=409,
            detail="Analysis is already in progress",
        )

    result = task_create_project_library.si(project_id).apply_async()

    logger.info(f"Task {result.id} created for project {project.id}")

    return None


class CreateViewRequestBodySchema(BaseModel):
    query: str
    additional_context: Optional[str] = ""


@ProjectRouter.post(
    "/{project_id}/create-view", response_model=TaskSchema, status_code=HTTPStatus.ACCEPTED
)
async def post_create_view(
    project_id: str,
    body: CreateViewRequestBodySchema,
    db: DependencyInjectDatabase,
    _session: DependencyRequireSession,
) -> None:
    project_analysis_run = get_latest_project_analysis_run(db, project_id)

    if not project_analysis_run:
        raise HTTPException(status_code=404, detail="No analysis found for this project")

    result = task_create_view.si(
        project_analysis_run.id, body.query, body.additional_context
    ).apply_async()

    logger.info(f"Task {result.id} created for project {project_id}")

    return None


# @ProjectRouter.get("/{project_id}/insights", response_model=List[InsightSchema])
# async def get_project_insights(
#     project_id: str,
#     db: DependencyInjectDatabase,
#     _session: DependencyRequireSession,
# ) -> List[InsightModel]:
#     project = await get_project(project_id, db)

#     latest_project_analysis = get_latest_project_analysis_run(db, project.id)

#     if not latest_project_analysis:
#         return []

#     insights = (
#         db.query(InsightModel)
#         .options(selectinload(InsightModel.quotes))
#         .filter(InsightModel.project_analysis_run_id == latest_project_analysis.id)
#         .all()
#     )

#     return insights


# @ProjectRouter.get("/{project_id}/views", response_model=List[ViewSchema])
# async def get_project_views(
#     project_id: str,
#     db: DependencyInjectDatabase,
#     _session: DependencyRequireSession,
# ) -> List[ViewModel]:
#     project = await get_project(project_id, db)

#     latest_project_analysis = get_latest_project_analysis_run(db, project.id)

#     if not latest_project_analysis:
#         return []

#     views = (
#         db.query(ViewModel)
#         .options(selectinload(ViewModel.aspects))
#         .filter(ViewModel.project_analysis_run_id == latest_project_analysis.id)
#         .all()
#     )

#     return views


# @ProjectRouter.get("/{project_id}/views/{view_id}", response_model=ViewSchema)
# async def get_project_view_aspects(
#     project_id: str,
#     view_id: str,
#     db: DependencyInjectDatabase,
#     _session: DependencyRequireSession,
# ) -> ViewModel:
#     project = await get_project(project_id, db)

#     latest_project_analysis = get_latest_project_analysis_run(db, project.id)

#     if not latest_project_analysis:
#         raise HTTPException(status_code=404, detail="No analysis found for this project")

#     view = (
#         db.query(ViewModel)
#         .options(selectinload(ViewModel.aspects).selectinload(AspectModel.quotes))
#         .filter(
#             ViewModel.project_analysis_run_id == latest_project_analysis.id, ViewModel.id == view_id
#         )
#         .first()
#     )

#     if not view:
#         raise HTTPException(status_code=404, detail="View not found")

#     return view
