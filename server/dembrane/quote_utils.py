import re
import logging
from typing import List, Optional

import numpy as np
import pandas as pd
from openai import OpenAI
from sqlalchemy.orm import Session
from sklearn.cluster import KMeans  # type: ignore
from langchain_openai import OpenAIEmbeddings
from langchain_experimental.text_splitter import SemanticChunker

from dembrane.ner import anonymize_sentence
from dembrane.utils import generate_uuid, get_utc_timestamp
from dembrane.database import QuoteModel, InsightModel, ConversationChunkModel, ProjectAnalysisRunModel
from dembrane.embedding import embed_text

logger = logging.getLogger("quote_utils")
logger.setLevel(logging.DEBUG)

lc_embedder = OpenAIEmbeddings(model="text-embedding-3-small")
semantic_chunker = SemanticChunker(lc_embedder)

SENTENCE_ENDING_PUNCTUATION = {".", "!", "?"}
SENTENCE_ENDING_PUNTUATION_REGEX = r"(?<=[.!?]) +"


def ends_with_punctuation(s: str) -> bool:
    if not s:
        return False
    return s.strip()[-1] in SENTENCE_ENDING_PUNCTUATION


def clean_ellipsis(text: str) -> str:
    return text.replace("...", "").replace("…", "")


def join_transcript_chunks(string_list: List[str]) -> str:
    cleaned_chunks = [clean_ellipsis(chunk).strip() for chunk in string_list]
    joined_string = cleaned_chunks[0]

    if len(cleaned_chunks) == 1:
        return joined_string

    for chunk in cleaned_chunks[1:]:
        if chunk == "":
            continue
        if ends_with_punctuation(joined_string):
            joined_string += " " + chunk
        else:
            joined_string += ". " + chunk

    return joined_string


def llm_split_text(text: str) -> List[str]:
    logger = logging.getLogger("llm_split_text")
    logger.debug(f"splitting text: {text}")
    messages = [
        {
            "role": "user",
            "content": 'Split the following text into 2 meaningful sentences. Retain the exact wording. Response format: <Sentence1>\\n<Sentence2>. Do not enclose your response in quotes or other special characters. Only output text.\n\n"""'
            + text
            + '\n"""',
        }
    ]

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=messages,  # type: ignore
        temperature=0,
        max_tokens=64,
        top_p=1,
        frequency_penalty=0,
        presence_penalty=0,
    )
    logger.debug(response)

    split_text = response.choices[0].message.content
    logger.debug(split_text)

    return split_text.split("\n")


MERGE_SENTENCE_LOWER_WORD_LIMIT = 8
MERGE_SENTENCE_UPPER_WORD_LIMIT = 45
BACKWARD_MERGE_UPPER_WORD_LIMIT = 35
LONG_SENTENCE_LIMIT = 75


def generate_quotes(db: Session, project_analysis_run_id: Optional[str], conversation_id: str) -> List[QuoteModel]:
    """Generate quotes"""
    logger = logging.getLogger("generate_quotes")

    chunks = (
        db.query(ConversationChunkModel)
        .filter(
            ConversationChunkModel.conversation_id == conversation_id,
            ConversationChunkModel.transcript.is_not(None),
        )
        .order_by(ConversationChunkModel.created_at.asc())
        .all()
    )

    logger.debug(f"chunks found: {len(chunks)}")

    if len(chunks) == 0:
        logger.debug(f"no conversation_chunks found for conversation {conversation_id}")
        return []

    conversation_transcript = join_transcript_chunks([anonymize_sentence(chunk.transcript) for chunk in chunks])

    split_conversation_transcript = re.split(SENTENCE_ENDING_PUNTUATION_REGEX, conversation_transcript)

    logger.debug(f"after joining chunks and splitting into sentences: {len(split_conversation_transcript)} sentences")

    quote_strs = []
    buffer = []

    # forward pass
    for sentence in split_conversation_transcript:
        if len(sentence.split()) < MERGE_SENTENCE_LOWER_WORD_LIMIT and buffer:
            buffer[-1] += " " + sentence
        else:
            buffer.append(sentence)

        current_quote = " ".join(buffer).strip()
        if len(current_quote.split()) > MERGE_SENTENCE_UPPER_WORD_LIMIT:
            if len(current_quote.split()) > LONG_SENTENCE_LIMIT:
                quote_strs.extend(llm_split_text(current_quote))
            else:
                quote_strs.append(current_quote)
            buffer = []

    if buffer:
        quote_strs.append(" ".join(buffer).strip())

    # backward pass
    final_quotes = []
    i = len(quote_strs) - 1

    while i >= 0:
        if i > 0 and len(quote_strs[i].split()) + len(quote_strs[i - 1].split()) <= BACKWARD_MERGE_UPPER_WORD_LIMIT:
            merged_quote = quote_strs[i - 1] + " " + quote_strs[i]
            if len(merged_quote.split()) <= LONG_SENTENCE_LIMIT:
                final_quotes.append(merged_quote)
                i -= 2
            else:
                final_quotes.append(quote_strs[i])
                i -= 1
        else:
            final_quotes.append(quote_strs[i])
            i -= 1

    final_quotes.reverse()

    quotes = []

    for quote_str in final_quotes:
        try:
            quote = QuoteModel(
                id=generate_uuid(),
                created_at=get_utc_timestamp(),
                project_analysis_run_id=project_analysis_run_id if project_analysis_run_id else None,
                conversation_id=conversation_id,
                text=quote_str,
                embedding=embed_text(quote_str),
            )
        except Exception as e:
            logger.error(f"Error embedding text {quote_str}: {str(e)}")
            continue

        quotes.append(quote)

    db.add_all(quotes)
    db.commit()

    return quotes


def generate_aspects(user_input: str, initial_aspects: Optional[List[str]] = None) -> List[dict]:
    # Generate aspects based on user input and initial aspects
    aspects = [
        {"name": "positive", "description": "this aspect captures all quotes with a positive sentiment"},
        {"name": "neutral", "description": "this aspect captures all quotes with a neutral sentiment"},
        {"name": "negative", "description": "this aspect captures all quotes with a negative sentiment"}
    ]
    return aspects

def generate_quotes(conversation_id: str, db: Session, project_analysis_run_id: Optional[str] = None) -> List[QuoteModel]:
    # Generate quotes from conversation data
    # Implement your logic here
    pass

def cluster_quotes(quotes: List[QuoteModel], num_clusters: int = 5) -> List[List[QuoteModel]]:
    # Cluster quotes into aspects
    embeddings = [quote.embedding for quote in quotes]
    kmeans = KMeans(n_clusters=num_clusters).fit(embeddings)
    clusters = [[] for _ in range(num_clusters)]
    for quote, label in zip(quotes, kmeans.labels_):
        clusters[label].append(quote)
    return clusters

def analyze_aspects(aspects: List[dict], quotes: List[QuoteModel]) -> List[Aspect]:
    # Analyze and populate aspects with quotes and metadata
    clustered_quotes = cluster_quotes(quotes, len(aspects))
    for aspect, cluster in zip(aspects, clustered_quotes):
        aspect_obj = Aspect(name=aspect['name'], description=aspect['description'], quotes=cluster)
        # Add further analysis here
    return aspects

def summarize_aspects(aspects: List[Aspect]) -> None:
    # Generate summaries for each aspect
    for aspect in aspects:
        # Example: generate short and long summaries
        aspect.short_summary = "Short summary of the aspect."
        aspect.long_summary = "Long summary of the aspect."

def create_view(view_name: str, user_input: str, initial_aspects: Optional[List[str]] = None, db: Session, project_analysis_run_id: Optional[str] = None) -> dict:
    aspects = generate_aspects(user_input, initial_aspects)
    quotes = generate_quotes(view_name, db, project_analysis_run_id)
    analyzed_aspects = analyze_aspects(aspects, quotes)
    summarize_aspects(analyzed_aspects)
    
    view = {
        "view_name": view_name,
        "aspects": [aspect.__dict__ for aspect in analyzed_aspects]
    }
    return view




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

    matrix = np.vstack(df.embedding.values)  # type: ignore
    logger.debug(f"matrix shape {matrix.shape}")

    n_clusters = len(quotes) // 3
    # logger.debug("n_clusters", n_clusters)
    logger.debug(f"n_clusters, {n_clusters}")
    # logger.debug("quotes", len(quotes))
    logger.debug(f"quotes, {len(quotes)}")

    kmeans = KMeans(n_clusters=n_clusters, init="k-means++")
    kmeans.fit(matrix)
    labels = kmeans.labels_
    df["Cluster"] = labels
    logger.debug(df.head())

    df.groupby("Cluster")

    # TODO: run concurrently
    for i in range(n_clusters):
        logger.debug(f"Cluster {i} Theme:")

        quote_text_joined = "\n".join(df[df.Cluster == i].text.values)

        messages = [
            {
                "role": "user",
                "content": f'What do the following text have in common? Generate a short theme based on the given text. Do not enclose your response in quotes or other special characters. Only output text.\n\nText:\n"""\n{quote_text_joined}\n"""\n\nTheme:',
            }
        ]

        title_response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,  # type: ignore
            temperature=0,
            max_tokens=64,
            top_p=1,
            frequency_penalty=0,
            presence_penalty=0,
        )

        title = title_response.choices[0].message.content

        logger.debug(title)

        messages = [
            {
                "role": "user",
                "content": f'What do the following text have in common? Generate a brief(4-5 sentences) summary and explanation of the theme based on the given texts. Use aspects like sentiment, simlarities and dissimilarities between the texts to form your summary. Do not enclose your response in quotes or other special characters. Only output text.\n\nTexts:\n"""\n{quote_text_joined}\n"""\n\nTheme: {title}\n\nSummary:',
            }
        ]

        summary_response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,  # type: ignore
            temperature=0,
            max_tokens=256,
            top_p=1,
            frequency_penalty=0,
            presence_penalty=0,
        )

        summary = summary_response.choices[0].message.content

        logger.debug(summary)

        insight = InsightModel(
            id=generate_uuid(),
            project_analysis_run_id=project_analysis_run_id,
            title=title,
            summary=summary,
        )

        quote_ids = df[df.Cluster == i].id.values

        quotes_list = db.query(QuoteModel).filter(QuoteModel.id.in_(quote_ids)).all()
        insight.quotes.extend(quotes_list)

        db.add(insight)
        db.commit()


if __name__ == "__main__":
    from dembrane.database import get_db

    db = next(get_db())

    project_analysis_run = ProjectAnalysisRunModel(
        id=generate_uuid(), project_id="38f84a2f-8edf-42fe-8358-e71d561127c8", processing_status="DONE"
    )

    db.add(project_analysis_run)
    db.commit()

    quotes = generate_quotes(db, project_analysis_run.id, "387a8819-fb6b-43f8-89a9-bfb4a445d90b")

    generate_insights(db, project_analysis_run.id)

    # generate_insights(db, "project_analysis_run_id")
