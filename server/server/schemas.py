from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from server.database import ProcessingStatusEnum


class SessionSchema(BaseModel):
    id: int
    created_at: datetime
    updated_at: datetime


class ProjectTagSchema(BaseModel):
    id: str
    created_at: datetime
    updated_at: datetime
    project_id: str

    text: str


class ProjectSchema(BaseModel):
    id: str
    created_at: datetime
    updated_at: datetime
    language: str
    pin: str
    name: Optional[str] = None
    context: Optional[str] = None

    tags: Optional[List[ProjectTagSchema]] = []

    is_conversation_allowed: bool
    default_conversation_title: Optional[str] = None
    default_conversation_description: Optional[str] = None
    default_conversation_context: Optional[str] = None


class ResourceSchema(BaseModel):
    id: str
    created_at: datetime
    updated_at: datetime
    project_id: str
    original_filename: str
    type: str  # ResourceTypeEnum

    title: str
    description: Optional[str] = None
    context: Optional[str] = None

    is_processed: bool
    processing_error: Optional[str] = None


class ConversationSchema(BaseModel):
    id: str
    created_at: datetime
    updated_at: datetime
    project_id: str

    title: Optional[str] = None
    description: Optional[str] = None
    context: Optional[str] = None

    participant_email: Optional[str] = None
    participant_name: Optional[str] = None

    tags: Optional[List[ProjectTagSchema]] = []


class ConversationChunkSchema(BaseModel):
    id: str
    created_at: datetime
    updated_at: datetime
    conversation_id: str

    processing_status: ProcessingStatusEnum
    processing_error: Optional[str] = None
    processing_started_at: Optional[datetime] = None
    processing_completed_at: Optional[datetime] = None

    transcript: Optional[str] = None
    timestamp: datetime


class ChatMessageSchema(BaseModel):
    id: str
    created_at: datetime
    updated_at: datetime
    chat_id: str

    text: str
    role: str  # ChatMessageRoleEnum


class ChatSchema(BaseModel):
    id: str
    created_at: datetime
    updated_at: datetime
    project_id: Optional[str] = None

    resources: Optional[list[ResourceSchema]] = []
    conversations: Optional[list[ConversationSchema]] = []
    messages: Optional[list[ChatMessageSchema]] = []


class QuoteSchema(BaseModel):
    id: str
    created_at: datetime
    updated_at: datetime

    project_analysis_run_id: str
    conversation_id: str

    conversation_chunks: Optional[List[ConversationChunkSchema]] = []

    text: str


class InsightSchema(BaseModel):
    id: str
    created_at: datetime
    updated_at: datetime

    project_analysis_run_id: str

    title: str
    summary: Optional[str] = None

    quotes: Optional[List[QuoteSchema]] = []


class ProjectAnalysisRunSchema(BaseModel):
    id: str
    created_at: datetime
    updated_at: datetime

    project_id: str

    quotes: Optional[List[QuoteSchema]] = []

    processing_status: ProcessingStatusEnum
    processing_error: Optional[str] = None
    processing_started_at: Optional[datetime] = None
    processing_completed_at: Optional[datetime] = None


class TaskSchema(BaseModel):
    id: str
    status: str
