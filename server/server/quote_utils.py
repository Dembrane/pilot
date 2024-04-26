import logging

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from openai import OpenAI
from langchain_experimental.text_splitter import SemanticChunker
from sqlalchemy.orm import Session
from langchain_openai import OpenAIEmbeddings

from server.database import ConversationChunkModel, InsightModel, QuoteModel
from server.embedding import embed_text
from server.utils import generate_uuid


logger = logging.getLogger("quote_utils")
logger.setLevel(logging.DEBUG)

lc_embedder = OpenAIEmbeddings(model="text-embedding-3-small")
semantic_chunker = SemanticChunker(lc_embedder)


def generate_quotes(
    db: Session, project_analysis_run_id: str, conversation_id: str
) -> None:
    """Generate quotes"""

    chunks = (
        db.query(ConversationChunkModel)
        .filter(ConversationChunkModel.conversation_id == conversation_id)
        .order_by(ConversationChunkModel.created_at.asc())
        .all()
    )

    all_chunks_count = (
        db.query(ConversationChunkModel)
        .filter(ConversationChunkModel.conversation_id == conversation_id)
        .count()
    )

    if all_chunks_count > len(chunks):
        logger.warning(
            f"Conversation has more chunks than query 'limit'. {len(chunks)}/{all_chunks_count}"
        )

    # Before chunking
    # TODO: quote transformations
    # - add context of session
    # - add context for references. eg. "him (Sameer)"

    lc_docs = semantic_chunker.create_documents(
        [chunk.transcript for chunk in chunks],
        metadatas=[
            {
                "conversation_id": chunk.conversation_id,
                "conversation_chunk_id": chunk.id,
            }
            for chunk in chunks
        ],
    )
    logger.debug(
        f"generated {len(lc_docs)} documents from {len(chunks)} conversation_chunks"
    )

    quotes = []

    for doc in lc_docs:
        if not doc.page_content or doc.page_content.strip() == "":
            logger.debug(f"skipping empty doc {doc.metadata}")
            continue

        try:
            quote = QuoteModel(
                id=generate_uuid(),
                conversation_id=doc.metadata["conversation_id"],
                text=doc.page_content,
                embedding=embed_text(doc.page_content),
                project_analysis_run_id=project_analysis_run_id
                if project_analysis_run_id
                else None,
            )
        except Exception as e:
            logger.error(f"Error embedding text {doc.page_content}: {str(e)}")
            continue

        chunk = db.get(ConversationChunkModel, doc.metadata["conversation_chunk_id"])
        quote.conversation_chunks.append(chunk)

        quotes.append(quote)

    logger.debug(f"adding {len(quotes)} quotes to database")
    db.add_all(quotes)
    db.commit()


client = OpenAI()

np.random.seed(0)


def generate_insights(db: Session, project_analysis_run_id: str) -> None:
    """Generate insights"""

    quotes = (
        db.query(QuoteModel)
        .with_entities(QuoteModel.id, QuoteModel.text, QuoteModel.embedding)
        .filter(QuoteModel.project_analysis_run_id == project_analysis_run_id)
        .all()
    )

    df = pd.DataFrame(
        [
            {
                "id": quote.id,
                "text": quote.text,
                "embedding": quote.embedding,
            }
            for quote in quotes
        ]
    )

    df["embedding"] = df.embedding.apply(np.array)

    matrix = np.vstack(df.embedding.values)
    print("matrix shape", matrix.shape)

    n_clusters = len(quotes) // 3
    print("n_clusters", n_clusters)
    print("quotes", len(quotes))

    kmeans = KMeans(n_clusters=n_clusters, init="k-means++")
    kmeans.fit(matrix)
    labels = kmeans.labels_
    df["Cluster"] = labels
    print(df.head())

    df.groupby("Cluster")

    # TODO: run concurrently
    for i in range(n_clusters):
        print(f"Cluster {i} Theme:", end=" ")

        quote_text_joined = "\n".join(df[df.Cluster == i].text.values)

        messages = [
            {
                "role": "user",
                "content": f'What do the following text have in common? Generate a short theme based on the given text. Do not enclose your response in quotes or other special characters. Only output text.\n\nText:\n"""\n{quote_text_joined}\n"""\n\nTheme:',
            }
        ]

        title_response = client.chat.completions.create(
            model="gpt-4",
            messages=messages,
            temperature=0,
            max_tokens=64,
            top_p=1,
            frequency_penalty=0,
            presence_penalty=0,
        )

        title = title_response.choices[0].message.content

        print(title)

        messages = [
            {
                "role": "user",
                "content": f'What do the following text have in common? Generate a brief(4-5 sentences) summary and explanation of the theme based on the given texts. Use aspects like sentiment, simlarities and dissimilarities between the texts to form your summary. Do not enclose your response in quotes or other special characters. Only output text.\n\nTexts:\n"""\n{quote_text_joined}\n"""\n\nTheme: {title}\n\nSummary:',
            }
        ]

        summary_response = client.chat.completions.create(
            model="gpt-4",
            messages=messages,
            temperature=0,
            max_tokens=256,
            top_p=1,
            frequency_penalty=0,
            presence_penalty=0,
        )

        summary = summary_response.choices[0].message.content

        print(summary)

        insight = InsightModel(
            id=generate_uuid(),
            project_analysis_run_id=project_analysis_run_id,
            title=title,
            summary=summary,
        )

        quote_ids = df[df.Cluster == i].id.values

        quotes = db.query(QuoteModel).filter(QuoteModel.id.in_(quote_ids)).all()

        insight.quotes.extend(quotes)

        db.add(insight)
        db.commit()
