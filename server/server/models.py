from datetime import datetime
from typing import List
from sqlalchemy import ForeignKey, create_engine, String, Text, Integer, DateTime, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, mapped_column, Mapped, relationship
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from server.config import DATABASE_URL


# Create the engine and connect to the SQLite database file
engine = create_engine(DATABASE_URL)

# Create a session factory
Session = sessionmaker(bind=engine)

# Define your models as subclasses of the base class
Base = declarative_base()


class SessionModel(Base):
    __tablename__ = "session"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    name: Mapped[str] = mapped_column(String, nullable=True)
    documents: Mapped[List["DocumentModel"]] = relationship(
        "DocumentModel", back_populates="session"
    )


class DocumentModel(Base):
    __tablename__ = "document"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    session_id: Mapped[int] = mapped_column(Integer, ForeignKey("session.id"))
    session: Mapped["SessionModel"] = relationship(
        "SessionModel", back_populates="documents"
    )
    path: Mapped[str] = mapped_column(String)
    title: Mapped[str] = mapped_column(String, nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    context: Mapped[str] = mapped_column(Text, nullable=True)
    is_processed: Mapped[bool] = mapped_column(Integer, nullable=True, default=False)
    processing_error: Mapped[str] = mapped_column(Text, nullable=True)
    messages: Mapped[List["DocumentMessageModel"]] = relationship(
        "DocumentMessageModel", back_populates="document"
    )


class DocumentMessageModel(Base):
    __tablename__ = "document_message"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    text: Mapped[str] = mapped_column(Text)
    from_user: Mapped[bool] = mapped_column(Integer, default=False)
    document_id: Mapped[str] = mapped_column(String, ForeignKey("document.id"))
    document: Mapped["DocumentModel"] = relationship(
        "DocumentModel", back_populates="messages"
    )

    def get_lc_message(self):
        if self.from_user:
            return HumanMessage(content=self.text)
        else:
            return SystemMessage(content=self.text)


# Create the database tables
Base.metadata.create_all(engine)

# Create a new session
db = Session()
