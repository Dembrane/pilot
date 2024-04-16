from typing import List
from server.database import ConversationModel, QuoteModel
from langchain_experimental.text_splitter import SemanticChunker
from langchain_core.documents import Document
from server.vectorstore import cached_embedder


semantic_chunker = SemanticChunker(cached_embedder)


def process_conversation(conversation: ConversationModel):
    conversation_chunks = conversation.chunks

    lc_documents = semantic_chunker.create_documents(
        [conversation_chunks],
        metadatas=[
            {
                "conversation_id": conversation.id,
                "conversation_chunk_id": chunk.id,
            }
            for chunk in conversation_chunks
        ],
    )

    for doc in lc_documents:
        print(doc.page_content + "\n\n")


def save_quotes(conversation: ConversationModel, documents: List[Document]):
    for doc in documents:
        for quote in doc.quotes:
            db_quote = QuoteModel(
                conversation_id=conversation.id,
                conversation_chunk_id=quote.metadata["conversation_chunk_id"],
                text=quote.text,
            )
            db.add(db_quote)
    db.commit()


if __name__ == "__main__":
    from server.database import db

    conversation = (
        db.query(ConversationModel).filter(ConversationModel.id == "").first()
    )

    if conversation:
        process_conversation(conversation)
