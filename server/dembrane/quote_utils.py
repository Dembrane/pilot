import re
import json
import random
import logging
from typing import List, Optional

import numpy as np
import pandas as pd
import tiktoken
from openai import OpenAI
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from sklearn.cluster import KMeans  # type: ignore
from langchain_openai import OpenAIEmbeddings
from langchain_experimental.text_splitter import SemanticChunker

from dembrane.ner import anonymize_sentence
from dembrane.utils import generate_uuid, get_utc_timestamp, download_image_and_get_public_url
from dembrane.openai import client
from dembrane.database import (
    ViewModel,
    QuoteModel,
    AspectModel,
    InsightModel,
    ConversationModel,
    ProcessingStatusEnum,
    ConversationChunkModel,
    ProjectAnalysisRunModel,
)
from dembrane.embedding import EMBEDDING_DIM, embed_text
from dembrane.image_utils import brilliant_image_generator_3000

logger = logging.getLogger("quote_utils")
logger.setLevel(logging.DEBUG)


np.random.seed(0)


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

    assert split_text is not None

    return split_text.split("\n")


MERGE_SENTENCE_LOWER_WORD_LIMIT = 8
MERGE_SENTENCE_UPPER_WORD_LIMIT = 45
BACKWARD_MERGE_UPPER_WORD_LIMIT = 35
LONG_SENTENCE_LIMIT = 75


# TODO: for a quote we should know which conversation_chunk it belongs to
def generate_quotes(
    db: Session, project_analysis_run_id: Optional[str], conversation_id: str
) -> List[QuoteModel]:
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

    chunk_id_text = dict()
    for chunk in chunks:
        chunk_id_text[chunk.id] = chunk.transcript

    logger.debug(f"chunks found: {len(chunks)}")

    if len(chunks) == 0:
        logger.debug(f"no conversation_chunks found for conversation {conversation_id}")
        return []

    conversation_transcript = join_transcript_chunks(
        [anonymize_sentence(chunk.transcript) for chunk in chunks]
    )

    split_conversation_transcript = re.split(
        SENTENCE_ENDING_PUNTUATION_REGEX, conversation_transcript
    )

    logger.debug(
        f"after joining chunks and splitting into sentences: {len(split_conversation_transcript)} sentences"
    )

    quote_strs = []
    buffer: List[str] = []
    timestamp = 0

    # forward pass
    for sentence in split_conversation_transcript:
        if len(sentence.split()) < MERGE_SENTENCE_LOWER_WORD_LIMIT and buffer:
            buffer[-1] += " " + sentence
        else:
            buffer.append(sentence)

        current_quote = " ".join(buffer).strip()
        if len(current_quote.split()) > MERGE_SENTENCE_UPPER_WORD_LIMIT:
            if len(current_quote.split()) > LONG_SENTENCE_LIMIT:
                split_quotes = llm_split_text(current_quote)
                for split_quote in split_quotes:
                    quote_strs.append((split_quote, timestamp))
                    timestamp += 1
            else:
                quote_strs.append((current_quote, timestamp))
                timestamp += 1
            buffer = []

    if buffer:
        quote_strs.append((" ".join(buffer).strip(), timestamp))
        timestamp += 1

    # backward pass
    final_quotes = []
    i = len(quote_strs) - 1

    while i >= 0:
        if (
            i > 0
            and len(quote_strs[i][0].split()) + len(quote_strs[i - 1][0].split())
            <= BACKWARD_MERGE_UPPER_WORD_LIMIT
        ):
            merged_quote = quote_strs[i - 1][0] + " " + quote_strs[i][0]
            if len(merged_quote.split()) <= LONG_SENTENCE_LIMIT:
                final_quotes.append((merged_quote, quote_strs[i - 1][1]))
                i -= 2
            else:
                final_quotes.append(quote_strs[i])
                i -= 1
        else:
            final_quotes.append(quote_strs[i])
            i -= 1

    final_quotes.reverse()

    quotes = []

    for quote_str, quote_timestamp in final_quotes:
        try:
            closest_chunk_id = None

            for chunk_id, chunk_text in chunk_id_text.items():
                if quote_str in chunk_text:
                    closest_chunk_id = chunk_id
                    break

            closest_chunk = db.query(ConversationChunkModel).filter_by(id=closest_chunk_id).first()
            logger.debug(f"closest_chunk: {closest_chunk}")

            quote = QuoteModel(
                id=generate_uuid(),
                created_at=get_utc_timestamp(),
                project_analysis_run_id=project_analysis_run_id
                if project_analysis_run_id
                else None,
                conversation_id=conversation_id,
                text=quote_str,
                embedding=embed_text(quote_str),
                timestamp=closest_chunk.timestamp if closest_chunk else None,
                order=quote_timestamp,
            )

            quotes.append(quote)

        except Exception as e:
            logger.error(f"Error creating quote for text {quote_str}: {str(e)}")
            continue

    # Bulk insert all quotes at once
    db.bulk_save_objects(quotes)
    db.commit()

    return quotes


encoding = tiktoken.encoding_for_model("gpt-4o")


def count_tokens(text: str) -> int:
    return len(encoding.encode(text))


def get_random_sample_quotes(
    db: Session, project_analysis_run_id: str, context_limit: int = 100000, batch_size: int = 1000
) -> List[QuoteModel]:
    """
    Generate a random sample of quotes for a given project and project analysis run, avoiding frequency bias.

    Args:
    - session: SQLAlchemy session for database access.
    - project_analysis_run_id: The ID of the project analysis run.
    - context_limit: The token limit for the context (default is 120000).
    - batch_size: The size of batches to fetch quotes in (default is 1000).

    Returns:
    - A list of randomly selected QuoteModel objects.
    """

    # Step 1: Select quotes ensuring at least one quote per conversation
    conversation_ids = db.scalars(
        select(QuoteModel.conversation_id)
        .filter_by(project_analysis_run_id=project_analysis_run_id)
        .distinct()
    ).all()

    selected_quotes = []
    for conv_id in conversation_ids:
        conv_quote = db.scalars(
            select(QuoteModel)
            .filter_by(conversation_id=conv_id, project_analysis_run_id=project_analysis_run_id)
            .order_by(func.random())
            .limit(1)
        ).first()
        if conv_quote:
            selected_quotes.append(conv_quote)

    # Step 2: Fetch quotes in batches to avoid loading all quotes into memory
    offset = 0
    all_quotes: List[QuoteModel] = []
    while True:
        batch_quotes = db.scalars(
            select(QuoteModel)
            .filter_by(project_analysis_run_id=project_analysis_run_id)
            .offset(offset)
            .limit(batch_size)
        ).all()
        if not batch_quotes:
            break
        all_quotes.extend(batch_quotes)
        offset += batch_size

    # Step 3: Calculate the number of random vectors needed
    avg_quote_length_tokens = 60  # Average length of a quote in tokens
    num_random_vectors = context_limit // avg_quote_length_tokens
    num_random_vectors = min(
        num_random_vectors, len(all_quotes)
    )  # Ensure we don't exceed the number of available quotes
    random_vectors = np.random.randn(num_random_vectors, EMBEDDING_DIM)

    for vector in random_vectors:
        closest_quote = db.scalars(
            select(QuoteModel)
            .filter(QuoteModel.project_analysis_run_id == project_analysis_run_id)
            .order_by(QuoteModel.embedding.l2_distance(vector))
            .limit(1)
        ).first()
        if closest_quote and closest_quote not in selected_quotes:
            selected_quotes.append(closest_quote)

    # Step 4: Ensure the context limit is not exceeded

    # Shuffle the list to ensure randomness
    random.shuffle(all_quotes)

    # Initialize variables
    selected_quotes = []
    current_context_length = 0

    # Iterate over the shuffled quotes
    for quote in all_quotes:
        additional_length = count_tokens(quote.text)
        if current_context_length + additional_length <= context_limit:
            selected_quotes.append(quote)
            current_context_length += additional_length
        if current_context_length >= context_limit:
            break

    return selected_quotes


def initialize_view(
    db: Session,
    project_analysis_run_id: str,
    user_input: str,
    initial_aspects: Optional[str] = None,
) -> ViewModel:
    """
    Generate a list of draft aspects based on user input.

    Args:
    - user_input: The user's input about the analysis (e.g., "Sentiment")
    - initial_aspects: Optional initial aspects provided by the user

    Returns:
    - A list of draft aspects as dictionaries
    """
    logger = logging.getLogger("generate_draft_aspects")

    view = ViewModel(
        id=generate_uuid(),
        project_analysis_run_id=project_analysis_run_id,
        name=user_input,
        processing_status=ProcessingStatusEnum.PROCESSING,
        processing_message="Generating aspects",
        processing_started_at=get_utc_timestamp(),
    )
    db.add(view)
    db.commit()

    random_sample = get_random_sample_quotes(db, project_analysis_run_id)

    random_sample_quotes = "\n".join(['"' + quote.text + '"' for quote in random_sample])
    logger.debug(f"Random sample quotes: {len(random_sample_quotes)}")

    prompt_a = """\
A user is requesting a list of aspects for a particular query they have about a large dataset. 
Given the user's query, the dataset, and, optionally, a list of initial aspects provided by the user, build a final list of aspects formatted as JSON.
Ensure the aspects stick to the user's query and are relevant.
If there is overlap try to group similar aspects together.
If the user mentions anything about the size of the list, try to fulfill the user's request, aligned with common sense given the data.
Example user input: "What are the main sentiment groupings?" would produce a list of no more than 5 aspects. 
Whereas "give me an exhaustive list of themes in the data" would require a list of up to 10-20 aspects.
Feel free to extrapolate and include aspects that the user has not considered, if they are relevant to the query.
Never output any other text content except the JSON response in the provided format. The response should be a list of dictionaries, where each dictionary represents an aspect with a name and description.
Ensure the output is formatted as a valid JSON array. Never output any enclosing ```json``` tags.

<example>
User Input: "Sentiment"

Initial, user provided aspects: << this would be a list of draft aspects provided by the user, if any>>

Contextual data to analyze: 
<context>
<< this would be a random sample of the data (at least one quote from each conversation) to provide the context to make the analysis >>
</context>"""

    prompt_b = """\
Output:[{"name":"Positive","description":"this aspect captures all quotes with a positive sentiment."},{"name":"Neutral","description":"This aspect captures all quotes with a neutral sentiment."},{"name":"Negative","description":"This aspect captures all quotes with a negative sentiment."}]
</example>"""

    prompt_c = f"""\
Now find an list of aspects appropriate to the user's query.

User query: {user_input}

Initial, user provided aspects: {initial_aspects if initial_aspects else ""}

Contextual data to analyze:
<context>
{random_sample_quotes}
</context>

Output:"""

    prompt = prompt_a + prompt_b + prompt_c

    messages = [{"role": "user", "content": prompt}]

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=messages,  # type: ignore
        # response_format={"type": "json_object"},
    )

    draft_aspects = response.choices[0].message.content.strip()  # type: ignore
    logger.debug(f"Draft aspects: {draft_aspects}")

    try:
        aspects_list = json.loads(draft_aspects)
        # Optionally, validate the structure of each aspect here
    except json.JSONDecodeError as e:
        raise ValueError("Failed to parse the response as JSON.") from e

    for aspect in aspects_list:
        if "name" not in aspect or "description" not in aspect:
            logger.debug(f"Aspect missing name or description: {aspect}")
        else:
            aspect = AspectModel(
                id=generate_uuid(),
                view_id=view.id,
                name=aspect["name"],
                description=aspect["description"],
            )
            db.add(aspect)
            db.commit()

    return view


def calculate_centroid(embeddings: List[List[float]]) -> List[float]:
    """
    Calculate the centroid of a list of embeddings.

    Args:
    - embeddings: A list of embedding vectors.

    Returns:
    - The centroid vector.
    """
    return np.mean(embeddings, axis=0).tolist()


def format_json_string_to_list(json_string: str) -> List[str]:
    # Handle the input JSON string
    sample_quotes_json_string = json_string if json_string else "[]"
    sample_quotes_json_string = sample_quotes_json_string.strip()

    # Log the last character for debugging purposes
    # logger.debug("Last character: {sample_quotes_json_string[-1] if sample_quotes_json_string else "Empty String"})

    # Ensure the string starts with '[' and ends with ']'
    if not sample_quotes_json_string.startswith("["):
        sample_quotes_json_string = "[" + sample_quotes_json_string

    if not sample_quotes_json_string.endswith("]"):
        if sample_quotes_json_string[-1] in [","]:
            sample_quotes_json_string = sample_quotes_json_string[:-1] + "]"
        elif sample_quotes_json_string[-1] in ['"', " ", "}"]:
            sample_quotes_json_string = sample_quotes_json_string + "]"
        else:
            sample_quotes_json_string = sample_quotes_json_string + '"]'

    # Attempt to parse the JSON string
    try:
        formatted_sample_quotes = json.loads(sample_quotes_json_string)
    except json.JSONDecodeError as e:
        logger.debug(f"Failed to parse the response as JSON: {e}")
        try:
            # split till the last ","
            sample_quotes_json_string = sample_quotes_json_string.rsplit(",", 1)[0] + "]"
            formatted_sample_quotes = json.loads(sample_quotes_json_string)
            logger.debug(f"Attempted to fix the JSON string: {formatted_sample_quotes}")
        except Exception as e:
            logger.debug(f"Failed to fix the JSON string: {e}")
            formatted_sample_quotes = []

    return formatted_sample_quotes


def assign_aspect_centroid(db: Session, aspect_id: str) -> None:
    aspect = db.get(AspectModel, aspect_id)

    if not aspect:
        logger.error(f"Aspect with ID {aspect_id} not found")
        return

    view = aspect.view

    if not view:
        logger.error(f"View not found for aspect {aspect_id}")
        return

    project_analysis_run_id = view.project_analysis_run_id

    if not project_analysis_run_id:
        logger.error(f"Project analysis run ID not found for view {view.id}")
        return

    sample_quotes = get_random_sample_quotes(db, project_analysis_run_id, context_limit=100000)

    sample_quotes_texts = [quote.text for quote in sample_quotes]

    logger.debug(f"trying for aspect:  {aspect.name}")

    aspect_name = aspect.name
    aspect_description = aspect.description

    view = aspect.view

    if not view:
        logger.error(f"View not found for aspect {aspect_id}")
        return

    aspects = view.aspects

    if not aspects:
        logger.error(f"No aspects found for view {view.id}")
        return

    random_sample_quotes = "\n".join([f'"{quote}"' for quote in sample_quotes_texts])

    prompt = f"""\
This is a part of an analysis of a dataset for a user's query about "{view.name}".
A user is requesting sample quotes for the aspect: {aspect_name}. 
Given the aspect description: {aspect_description}, provide a list of all the quotes that match the aspect.
Use common sense to ensure the list is representative of the aspect.
Never output any other text content except the JSON response in the provided format.
Ensure the JSON string is formatted as a valid JSON array.
If there are no quotes that match the aspect, output an empty array.
Never output any enclosing ```json``` tags.

<example>
Aspect: Positive

Other Aspects in the analysis: ["Negative", "Neutral"]

Description: This aspect captures all quotes with a positive sentiment.

Contextual data to analyze: 
<context>
<< this would be a random sample of the data (at least one quote from each conversation) to provide the context to make the analysis >>
</context>

Output:["Sample quote 1","Sample quote 2","Sample quote 3",...]
</example>

Now, find sample quotes for:

Aspect: {aspect_name}

Other Aspects in the analysis: {", ".join([a.name for a in aspects if a.id != aspect.id])}

Description: {aspect_description}

Contextual data to analyze:
<context>
{random_sample_quotes}
</context>

Output:"""

    messages = [{"role": "user", "content": prompt}]

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=messages,  # type: ignore
        # max_tokens=4096,
    )

    sample_quotes_json_string = response.choices[0].message.content
    formatted_sample_quotes = format_json_string_to_list(
        sample_quotes_json_string if sample_quotes_json_string else "[]"
    )

    # gather representative quotes:
    representative_quote_ids = []
    for quote in sample_quotes:
        if any(
            re.search(re.escape(quote_text), quote.text, re.IGNORECASE)
            for quote_text in formatted_sample_quotes
        ):
            representative_quote_ids.append(quote.id)

    representative_quotes = (
        db.query(QuoteModel).filter(QuoteModel.id.in_(representative_quote_ids)).all()
    )

    logger.debug(f"Representative quotes for aspect {aspect_name}: {len(representative_quotes)}")

    aspect.representative_quotes = representative_quotes
    db.commit()

    # Calculate centroid using the returned sample quotes
    selected_quotes = [quote for quote in sample_quotes if quote.text in formatted_sample_quotes]

    # TODO: we should also store these "representative quotes"

    logger.debug(f"Selected quotes for aspect {aspect_name}: {len(selected_quotes)}")

    if not selected_quotes:
        selected_quotes = [
            quote
            for quote in sample_quotes
            if any(
                re.search(re.escape(quote_text), quote.text, re.IGNORECASE)
                for quote_text in formatted_sample_quotes
            )
        ]

    embeddings_list = [
        embed_text(aspect.name + ". " + (aspect_description if aspect_description else ""))
    ]

    if selected_quotes:
        logger.debug(f"Quotes found for aspect {aspect_name}: {len(selected_quotes)}")
        embeddings_list.extend([quote.embedding for quote in selected_quotes])
    else:
        logger.debug(f"No quotes found for aspect {aspect_name}")

    centroid = calculate_centroid(embeddings_list)
    logger.debug(f"Setting centroid for aspect {aspect_name}")
    aspect.centroid_embedding = centroid
    db.commit()


def cluster_quotes_using_aspect_centroids(db: Session, view_id: str) -> None:
    view = db.get(ViewModel, view_id)

    if not view:
        logger.error(f"View with ID {view_id} not found")
        return

    aspects = view.aspects

    if not aspects:
        logger.error(f"No aspects found for view {view_id}")
        return

    quotes = (
        db.query(QuoteModel).filter_by(project_analysis_run_id=view.project_analysis_run_id).all()
    )

    # Assign each quote to the closest centroid
    aspect_centroids = {aspect.id: aspect.centroid_embedding for aspect in aspects}

    # Collect keys with None values in a separate list
    keys_to_delete = [k for k, v in aspect_centroids.items() if v is None]

    # Delete the collected keys after iteration
    for k in keys_to_delete:
        a = db.query(AspectModel).filter_by(id=k).first()
        if a:
            logger.debug(f"Removing aspect {a.name} from aspect_centroids because of None value")
        del aspect_centroids[k]

    for quote in quotes:
        # find the closest aspect ID by calculating the Euclidean distance between the quote embedding
        # and the centroids of different aspects using the min() function and the np.linalg.norm() function
        closest_aspect_id = min(
            aspect_centroids.keys(),
            key=lambda aspect_id: np.linalg.norm(
                np.array(quote.embedding) - np.array(aspect_centroids[aspect_id])
            ),
        )

        closest_aspect = (
            db.query(AspectModel)
            .filter_by(
                id=closest_aspect_id,
                view_id=view_id,
            )
            .first()
        )

        if closest_aspect:
            logger.debug(f"Closest aspect: {closest_aspect.name}")
            closest_aspect.quotes.append(quote)
            db.commit()
        else:
            logger.debug(f"No closest aspect found for quote {quote.id}")


def generate_aspect_summary(db: Session, aspect_id: str) -> None:
    aspect = db.query(AspectModel).filter_by(id=aspect_id).first()

    if not aspect:
        raise ValueError(f"Aspect with ID {aspect_id} not found")

    quotes = aspect.quotes
    representative_quotes = aspect.representative_quotes

    dedupe_quotes = list(set(representative_quotes + quotes))

    formatted_quotes = "\n".join([f'"{quote.text}"' for quote in dedupe_quotes])

    view_name = aspect.view.name if aspect.view else ""

    prompt = f"""\
You will be provided with some context and a list of quotes related to that context.
Your task is to write a concise text of the key points from the quotes and how they relate to the given context.
Here is the context. Never repeat information in the context in your final output.

<context>
User's Query: {view_name}
Aspect we are looking at: {aspect.name} ({aspect.description})
</context>`

And here are the quotes:
<quotes>
{formatted_quotes}
</quotes>`

Please read the context and quotes carefully. 
Then, think about how you could capture the main points from the quotes in a way that relates them to the context.
The generated text should be information-dense and avoid redundancy with the context, since this context will also be shown to the reader.
Don't mention any "quotes" or "context" in your text.
Focus on highlighting the key takeaways from the quotes and how they build upon or relate to the context.
Please write a very short version within 1 sentence only.
Remember, do not repeat things already stated in the context, as that will also be shown. 

Text:"""

    messages = [{"role": "user", "content": prompt}]

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=messages,  # type: ignore
    )

    summary = response.choices[0].message.content
    aspect.short_summary = summary
    db.commit()

    prompt = f"""
You will be given context and a list of quotes related to that context.
Your task is to write a concise text of the key points from the quotes and their relation to the given context.
Here is the context. Do not repeat the information in the context in your text.

<context>
User's Query: {view_name}
Aspect under consideration: {aspect.name} ({aspect.description})
Additional context: {aspect.short_summary}
</context>

Here are the quotes:
<quotes>
{formatted_quotes}
</quotes>

Carefully read the context and quotes.
Capture the main points from the quotes in a way that ties them to the context.
The text should be information-dense and avoid redundancy with the context, which will be shown to the reader.
Emphasize the key takeaways from the quotes and how they build upon or relate to the context.
The text should be concise yet ensure everyone quoted feels heard and represented.
Capture all key points while keeping it brief.
You may use markdown to format your response. Keep your response within 70-100 words.

Text:
"""

    messages = [{"role": "user", "content": prompt}]

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=messages,  # type: ignore
    )

    summary = response.choices[0].message.content
    aspect.long_summary = summary
    db.commit()

    return


def generate_aspect_image(db: Session, aspect_id: str) -> AspectModel:
    logger.debug(f"generating image for aspect: {aspect_id}")
    aspect = db.query(AspectModel).filter_by(id=aspect_id).first()

    if not aspect:
        raise ValueError(f"Aspect with ID {aspect_id} not found")

    response = None

    try:
        use_model = "MODEST"

        view = aspect.view
        if not view:
            raise ValueError("View not found")

        project_analysis_run = view.project_analysis_run
        if not project_analysis_run:
            raise ValueError("Project analysis run not found")

        project = project_analysis_run.project
        if not project:
            raise ValueError("Project not found")

        use_model = project.image_generation_model or "MODEST"

        logger.debug(f"using image generation model: {use_model}")

    except Exception as e:
        logger.error(f"Error getting image generation model: {e}")
        use_model = "MODEST"

    if use_model == "MODEST":
        try:
            prompt = f"""\
in a impressionism style painting, represent the theme of the following context and summary.
use shades of neon turquoise, light blue and light pink. always capture the essence of the text from a larger perspective.
NEVER INCLUDE text in the image. I REPEAT, don't include any text in the image.
what the image should be about: "{aspect.name}"
summary of ideas: "{aspect.description}\""""

            response = client.images.generate(
                model="dall-e-3",
                prompt=prompt,
                size="1024x1024",
                quality="standard",
                n=1,
            )
        except Exception as e:
            logger.debug(f"Error generating image: {e}")
            additional_info = (
                "edit the prompt so that it is in compliance with security guidelines."
            )
            try:
                response = client.images.generate(
                    model="dall-e-3",
                    prompt=prompt + additional_info,
                    size="1024x1024",
                    quality="standard",
                    n=1,
                )
            except Exception as e:
                logger.debug(f"Error generating image even after update prompt: {e}")

        try:
            if response:
                image_url = response.data[0].url
                if image_url:
                    logger.debug("saving the image and getting the public url")
                    image_url = download_image_and_get_public_url(image_url)
            else:
                image_url = None
        except Exception as e:
            logger.error(f"Error downloading image: {e}")
    elif use_model == "EXTRAVAGANT":
        image_url = brilliant_image_generator_3000(f"{aspect.name}\n{aspect.short_summary}")
    elif use_model == "PLACEHOLDER":
        image_url = None
    else:
        logger.info(f"Image generation model not found: {use_model}")
        image_url = None

    logger.debug(f"setting image URL to aspect: {image_url}")
    aspect.image_url = image_url

    db.commit()

    return aspect


def generate_aspect_extras(db: Session, aspect_id: str) -> AspectModel | None:
    """aspect summary, aspect image"""
    aspect = db.query(AspectModel).filter_by(id=aspect_id).first()

    if not aspect:
        logger.error(f"Aspect with ID {aspect_id} not found")
        return None

    generate_aspect_summary(db, aspect.id)
    generate_aspect_image(db, aspect.id)

    return aspect


def generate_view_extras(db: Session, view_id: str) -> ViewModel:
    """view summary, aspect summary (long and short), aspect image"""
    view = db.query(ViewModel).filter_by(id=view_id).first()

    if not view:
        raise ValueError(f"View with ID {view_id} not found")

    formatted_aspects = "\n\n".join(
        [
            f"""\
<aspect>
Aspect: {aspect.name}
Description: {aspect.description}
Summary: {aspect.long_summary}
</aspect>"""
            for aspect in view.aspects
        ]
    )

    prompt = f"""\
You will be provided with list of aspects and context that are used to answer a user's query.
Your task is to write a concise text of the key takeaways from the aspects and how they relate to the user's query.
Here is the context. Never repeat information in the context in your final output.

<context>
User's Query: {view.name}

And here are the aspects:
{formatted_aspects}

</context>

Please read the aspects carefully. 
Then, think about how you could present the main points from the aspects in a way that relates them to the context.
The summary should be information-dense and avoid redundancy with the context, since this context will also be shown to the reader.
Remember, do not repeat things already stated in the context, as that will also be shown. 
Focus on highlighting the key takeaways from the quotes and how they build upon or relate to the context.

Text:"""

    messages = [{"role": "user", "content": prompt}]

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=messages,  # type: ignore
    )

    summary = response.choices[0].message.content

    view.summary = summary

    db.commit()

    return view


def generate_insight_extras(db: Session, insight_id: str) -> None:
    """Generate insight extras for a given cluster."""
    insight = db.query(InsightModel).filter_by(id=insight_id).first()

    if not insight:
        logger.error(f"Insight with ID {insight_id} not found")
        return

    quotes = insight.quotes

    quote_text_joined = "\n".join([f'"{quote.text}"' for quote in quotes])

    messages = [
        {
            "role": "user",
            "content": f'What do the following text have in common? Generate a short title (4-5 words) based on the theme of the given text. Do not enclose your response in quotes or other special characters. Only output text.\n\nText:\n"""\n{quote_text_joined}\n"""\n\nTitle:',
        }
    ]

    title_response = client.chat.completions.create(
        model="gpt-4o",
        messages=messages,  # type: ignore
    )

    title = title_response.choices[0].message.content

    messages = [
        {
            "role": "user",
            "content": f'What do the following text have in common? Generate a brief (3-3 sentences) text and explanation of the theme based on the given texts. Use aspects like sentiment, similarities-dissimilarities, theme and critically analyse perspectives, assumptions, biases found in the texts to form your text. Do not enclose your response in quotes or other special characters. Only output text.\n\nTexts:\n"""\n{quote_text_joined}\n"""\n\nTheme: {title}\n\nText:',
        }
    ]

    summary_response = client.chat.completions.create(
        model="gpt-4o",
        messages=messages,  # type: ignore
    )

    summary = summary_response.choices[0].message.content

    insight.title = title
    insight.summary = summary
    db.commit()

    return


def generate_conversation_summary(db: Session, conversation_id: str) -> None:
    conversation = db.query(ConversationModel).filter_by(id=conversation_id).first()

    if not conversation:
        logger.error(f"Conversation with ID {conversation_id} not found")
        return

    quotes = (
        db.query(QuoteModel)
        .filter_by(conversation_id=conversation_id)
        .order_by(QuoteModel.timestamp)
        .all()
    )

    if not quotes:
        logger.error(f"No quotes found for conversation {conversation_id}")
        return

    quote_text_joined = "\n".join([f'"{quote.text}"' for quote in quotes])

    messages = [
        {
            "role": "user",
            "content": f'Generate a text using the given quotes. The text should be a summary of the conversation. Do not enclose your response in quotes or other special characters. Only output text. Keep the output within 3-4 short and easy to read sentences. Do not use filler words like "Overall", "In conclusion". The text should be easy to skim through. \n\nQuotes:\n"""\n{quote_text_joined}\n"""\n\nText:',
        }
    ]

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,  # type: ignore
    )

    summary = response.choices[0].message.content

    conversation.summary = summary

    db.commit()

    return


def initialize_insights(db: Session, project_analysis_run_id: str) -> List[str]:
    """Generate insights"""

    quotes = (
        db.query(QuoteModel)
        .with_entities(QuoteModel.id, QuoteModel.embedding)
        .filter(QuoteModel.project_analysis_run_id == project_analysis_run_id)
        .all()
    )

    if not quotes:
        logger.error(f"No quotes found for project analysis run {project_analysis_run_id}")
        return []

    df = pd.DataFrame(
        [
            {
                "id": quote.id,
                "embedding": quote.embedding,
            }
            for quote in quotes
        ]
    )

    df["embedding"] = df.get("embedding").apply(lambda x: np.array(x))  # type: ignore
    matrix = np.vstack(df["embedding"].values)  # type: ignore

    logger.debug(f"matrix shape {matrix.shape}")

    n_clusters = len(quotes) // 4
    logger.debug(f"n_clusters, {n_clusters}")
    logger.debug(f"quotes, {len(quotes)}")

    kmeans = KMeans(n_clusters=n_clusters, init="k-means++")
    kmeans.fit(matrix)
    labels = kmeans.labels_
    df["Cluster"] = labels

    insight_ids = []

    for cluster_index in range(n_clusters):
        insight = InsightModel(
            id=generate_uuid(),
            project_analysis_run_id=project_analysis_run_id,
        )

        quote_ids = df[df.Cluster == cluster_index].id.values

        quotes_list = db.query(QuoteModel).filter(QuoteModel.id.in_(quote_ids)).all()
        insight.quotes.extend(quotes_list)

        insight_ids.append(insight.id)
        db.add(insight)
        db.commit()

    return insight_ids


if __name__ == "__main__":
    from dembrane.database import get_db

    db = next(get_db())

    project_id = "f98d4ef2-1bc9-40f1-b360-3d784e2b22a0"

    # analysis_id = "460ef51a-c698-4c0a-bd24-824785b2f982"

    project_analysis_run = ProjectAnalysisRunModel(
        id=generate_uuid(), project_id=project_id, processing_status="DONE"
    )

    db.add(project_analysis_run)
    db.commit()

    logger.debug(f"project_analysis_run_id: {project_analysis_run.id}")

    analysis_id = project_analysis_run.id

    generate_quotes(db, project_analysis_run.id, "a615ced7-fce1-4434-a88e-5041f30c2a15")

    # conversations = db.query(ConversationModel).filter(ConversationModel.project_id == project_id).all()

    # for conversation in conversations:
    #     logger.debug(f"conversation_id: {conversation.id}")
    #     quotes = generate_quotes(db, project_analysis_run.id, conversation.id)
    #     logger.debug(f"quotes generated: {len(quotes)}")

    # generate_aspect_image(db, "d9d4eb70-2965-4f68-911f-de7606ed0cf7")

    # logger.debug("quotes are generated")

    # view = generate_view(db, analysis_id, "Make a plan to restructure the TUE Governance", "Make it a detailed plan")
    # assign_aspect_centroids_and_cluster_quotes(db, analysis_id, view.id)
    # generate_view_extras(db, view.id)
    # logger.debug(view.id)

    # view = initialize_view(db, analysis_id, "Sentiment", "Use only 3")
    # assign_aspect_centroids_and_cluster_quotes(db, analysis_id, view.id)

    # aspects = view.aspects
    # for aspect in aspects:
    #     generate_aspect_extras(db, aspect.id)

    # generate_view_extras(db, view.id)

    # logger.debug(view.id)

    # generate_insights(db, id)
