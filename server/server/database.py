from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional, Any
from sqlalchemy import (
    Column,
    ForeignKey,
    Table,
    TypeDecorator,
    create_engine,
    String,
    Text,
    Integer,
    Boolean,
    DateTime as _DateTime,
    func,
)
from sqlalchemy.orm import (
    sessionmaker,
    mapped_column,
    Mapped,
    relationship,
    declarative_base,
)
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from server.config import DATABASE_URL


# Create the engine and connect to the SQLite database file
engine = create_engine(DATABASE_URL)

# Create a session factory
Session = sessionmaker(bind=engine)

# Define your models as subclasses of the base class
Base: Any = declarative_base()

chat_resource_association_table = Table(
    "chat_resource_association",
    Base.metadata,
    Column("chat_id", ForeignKey("chat.id"), primary_key=True),
    Column("resource_id", ForeignKey("document.id"), primary_key=True),
)

chat_conversation_association_table = Table(
    "chat_conversation_association",
    Base.metadata,
    Column("chat_id", ForeignKey("chat.id"), primary_key=True),
    Column("conversation_id", ForeignKey("conversation.id"), primary_key=True),
)


class DateTime(TypeDecorator[_DateTime]):
    """Custom type to store UTC datetime in the database. Allows to only use
    timezone aware datetime objects as parameters and return timezone aware
    datetime objects as results."""

    impl = _DateTime
    cache_ok = True

    def process_bind_param(self, value, dialect):  # type: ignore
        if isinstance(value, datetime) and value.tzinfo is None:
            raise ValueError("Naive datetime is not supported")

        return value.astimezone(timezone.utc) if value else None

    def process_result_value(self, value, dialect):  # type: ignore
        if isinstance(value, datetime) and value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)

        return value.astimezone(timezone.utc) if value else None


class SessionModel(Base):
    __tablename__ = "session"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    projects: Mapped[List["ProjectModel"]] = relationship(
        "ProjectModel", back_populates="session", cascade="all, delete-orphan"
    )


class ProjectModel(Base):
    __tablename__ = "project"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    session_id: Mapped[int] = mapped_column(Integer, ForeignKey("session.id"))
    session: Mapped["SessionModel"] = relationship(
        "SessionModel", back_populates="projects"
    )

    pin: Mapped[str] = mapped_column(String, unique=True)

    language: Mapped[str] = mapped_column(String, default="en")

    name: Mapped[str] = mapped_column(String, nullable=True)
    context: Mapped[str] = mapped_column(Text, nullable=True)

    resources: Mapped[List["ResourceModel"]] = relationship(
        "ResourceModel", back_populates="project", cascade="all, delete-orphan"
    )
    conversations: Mapped[List["ConversationModel"]] = relationship(
        "ConversationModel", back_populates="project", cascade="all, delete-orphan"
    )

    is_conversation_allowed: Mapped[bool] = mapped_column(Boolean, default=True)
    default_conversation_title: Mapped[str] = mapped_column(String, nullable=True)
    default_conversation_description: Mapped[str] = mapped_column(Text, nullable=True)
    default_conversation_context: Mapped[str] = mapped_column(Text, nullable=True)

    chats: Mapped[List["ChatModel"]] = relationship(
        "ChatModel", back_populates="project", cascade="all, delete-orphan"
    )

    @staticmethod
    def belongs_to_session(project_id: str, session_id: int) -> bool:
        return (
            db.query(ProjectModel)
            .filter(
                ProjectModel.id == project_id, ProjectModel.session_id == session_id
            )
            .first()
            is not None
        )


class ChatModel(Base):
    __tablename__ = "chat"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    project_id: Mapped[Optional[str]] = mapped_column(
        String, ForeignKey("project.id"), nullable=True
    )
    project: Mapped[Optional["ProjectModel"]] = relationship(
        "ProjectModel", back_populates="chats"
    )

    resources = relationship(
        "ResourceModel",
        secondary=chat_resource_association_table,
        back_populates="chats",
    )
    conversations = relationship(
        "ConversationModel",
        secondary=chat_conversation_association_table,
        back_populates="chats",
    )

    messages: Mapped[List["ChatMessageModel"]] = relationship(
        "ChatMessageModel", back_populates="chat"
    )

    def get_lc_messages(self) -> List[AIMessage | HumanMessage | SystemMessage]:
        return [message.get_lc_message() for message in self.messages]


class ChatMessageRoleEnum(Enum):
    USER = "user"
    ASSISTANT = "assistant"


class ChatMessageModel(Base):
    __tablename__ = "chat_message"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    text: Mapped[str] = mapped_column(Text)
    role: Mapped[ChatMessageRoleEnum] = mapped_column(String)

    chat_id: Mapped[str] = mapped_column(String, ForeignKey("chat.id"))
    chat: Mapped["ChatModel"] = relationship("ChatModel", back_populates="messages")

    def get_lc_message(self) -> AIMessage | HumanMessage | SystemMessage:
        if self.role == ChatMessageRoleEnum.USER:
            return HumanMessage(content=self.text)
        elif self.role == ChatMessageRoleEnum.ASSISTANT:
            return AIMessage(content=self.text)
        else:
            raise ValueError(f"Invalid role: {self.role}")


class ResourceTypeEnum(Enum):
    PDF = "PDF"


class ResourceModel(Base):
    __tablename__ = "document"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    project_id: Mapped[str] = mapped_column(String, ForeignKey("project.id"))
    project: Mapped["ProjectModel"] = relationship(
        "ProjectModel", back_populates="resources"
    )

    original_filename: Mapped[str] = mapped_column(String, default="")
    type: Mapped[ResourceTypeEnum] = mapped_column(String, default=ResourceTypeEnum.PDF)
    path: Mapped[str] = mapped_column(String)

    title: Mapped[str] = mapped_column(String)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    context: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    is_processed: Mapped[bool] = mapped_column(Boolean, default=False)
    processing_error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    chats = relationship(
        "ChatModel",
        secondary=chat_resource_association_table,
        back_populates="resources",
    )


class ConversationModel(Base):
    __tablename__ = "conversation"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    project_id: Mapped[str] = mapped_column(String, ForeignKey("project.id"))
    project: Mapped["ProjectModel"] = relationship(
        "ProjectModel", back_populates="conversations"
    )

    participant_email = mapped_column(String)

    title: Mapped[str] = mapped_column(String, nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    context: Mapped[str] = mapped_column(Text, nullable=True)

    chats = relationship(
        "ChatModel",
        secondary=chat_conversation_association_table,
        back_populates="conversations",
    )

    chunks: Mapped[List["ConversationChunkModel"]] = relationship(
        "ConversationChunkModel",
        back_populates="conversation",
        cascade="all, delete-orphan",
    )


class ConversationChunkModel(Base):
    __tablename__ = "conversation_chunk"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    conversation_id: Mapped[str] = mapped_column(String, ForeignKey("conversation.id"))
    conversation: Mapped["ConversationModel"] = relationship(
        "ConversationModel", back_populates="chunks"
    )

    path: Mapped[str] = mapped_column(String)
    is_processed: Mapped[bool] = mapped_column(Boolean, default=False)
    processing_error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    transcript: Mapped[str] = mapped_column(Text, nullable=True)


db = Session()
