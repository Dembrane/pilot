from typing import List
from sqlalchemy import ForeignKey, create_engine, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, mapped_column, Mapped

from server.config import DATABASE_URL
from sqlalchemy import Text
from sqlalchemy import Integer
from sqlalchemy.orm import relationship

# Create the engine and connect to the SQLite database file
engine = create_engine(DATABASE_URL)

# Create a session factory
Session = sessionmaker(bind=engine)

# Define your models as subclasses of the base class
Base = declarative_base()

class SessionModel(Base):
    __tablename__ = 'session'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=True)
    documents: Mapped[List["DocumentModel"]] = relationship("DocumentModel", back_populates="session")


class DocumentModel(Base):
    __tablename__ = 'document'

    id: Mapped[str] = mapped_column(String, primary_key=True)
    session_id: Mapped[int] = mapped_column(Integer, ForeignKey('session.id'))
    session: Mapped["SessionModel"] = relationship("SessionModel", back_populates='documents')
    path: Mapped[str] = mapped_column(String)
    title: Mapped[str] = mapped_column(String, nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    context: Mapped[str] = mapped_column(Text, nullable=True)
    is_processed: Mapped[bool] = mapped_column(Integer, nullable=True, default=False)
    processing_error: Mapped[str] = mapped_column(Text, nullable=True)

# Create the database tables
Base.metadata.create_all(engine)

# Create a new session
db = Session()