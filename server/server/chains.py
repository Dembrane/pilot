import asyncio
from datetime import datetime, timezone
from logging import getLogger
from typing import List
from uuid import uuid4
from langchain_core.runnables import Runnable
from langchain_core.prompts import ChatPromptTemplate, PromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser
from langchain.chains import load_summarize_chain as lc_load_summarize_chain
from langchain_core.messages import HumanMessage, SystemMessage, BaseMessage
from langchain.memory import ConversationSummaryBufferMemory

from server.models import (
    DocumentMessageModel,
    DocumentModel,
    SessionMessageModel,
    SessionModel,
    db,
)
from server.vectorstore import vectorstore

logger = getLogger("chains")

chat_llm_small = ChatOpenAI(
    temperature=0.5, model_name="gpt-3.5-turbo-1106", max_retries=6
)  # type: ignore

# For global question answering
chat_llm_large = ChatOpenAI(
    temperature=0.2, model_name="gpt-4-0125-preview", max_retries=6
)  # type: ignore


def load_title_chain(language: str) -> Runnable:
    if language == "nl":
        prompt = ChatPromptTemplate.from_template(
            "Gegeven de volgende tekst, genereer een Nederlandse titel die kort is (maximaal 6 woorden), de meest relevante trefwoorden bevat, en geen aanhalingstekens of andere leestekens gebruikt. Alleen titel weergeven aub. \nTekst:{text}\nTitel:"
        )
    elif language == "en":
        prompt = ChatPromptTemplate.from_template(
            "Given the following text, generate a title that is short (max 6 words), contains the most relevant keywords, and does not use quotes or other punctuation. Only display the title please.\nText:{text}\nTitle:"
        )
    else:
        raise ValueError(f"Language {language} not supported")

    return prompt | chat_llm_small | StrOutputParser()


def load_summary_chain(language: str) -> Runnable:
    if language == "nl":
        prompt_template = """Jij bent een deskundige scrijver en een behulpzame onderzoeksassistent. Scrijf een onverzichtelijke, beknopte samenvatting van de volgende tekst:\n{text}\nSAMENVATTING:"""
        prompt = PromptTemplate.from_template(prompt_template)
        refine_template = (
            "Jou taak is om een globale, concluderende samenvatting te schrijven. Zorg ervoor dat de samenvatting binnen de 80-100 woorden valt\n"
            "We hebben een bestaande samenvatting gegeven tot op een bepaald punt: {existing_answer}\n"
            "We hebben de mogelijkheid om de bestaande samenvatting te verfijnen"
            "(alleen indien nodig) met hieronder wat meer context.\n"
            "------------\n"
            "{text}\n"
            "------------\n"
            "De oorspronkelijke samenvatting in het Nederlands verfijnen met het oog op de nieuwe context"
            "Als de context niet bruikbaar is, retourneer dan de oorspronkelijke samenvatting en vermeld niet dat er niets te verfijnen was"
        )
        refine_prompt = PromptTemplate.from_template(refine_template)
    elif language == "en":
        prompt_template = """You are a helpful and analytical research assistant. Write a concise, informative summary of the following text:\n{text}\nSUMMARY:"""
        prompt = PromptTemplate.from_template(prompt_template)
        refine_template = (
            "Your task is to write a global, concluding summary. Ensure the summary is within 80-100 words\n"
            "We have given an existing summary up to a certain point: {existing_answer}\n"
            "We have the ability to refine the existing summary"
            "(if necessary) with the additional context below.\n"
            "------------\n"
            "{text}\n"
            "------------\n"
            "Refine the original summary in English in light of the new context"
            "If the context is not useful, return the original summary and do not mention that there was nothing to refine"
        )
        refine_prompt = PromptTemplate.from_template(refine_template)
    else:
        raise ValueError(f"Language {language} not supported")

    chain = lc_load_summarize_chain(
        llm=chat_llm_small,
        chain_type="refine",
        question_prompt=prompt,
        refine_prompt=refine_prompt,
        return_intermediate_steps=True,
        input_key="documents",
        output_key="output_text",
    )
    return chain


def transform_question_for_global_analysis(
    document: DocumentModel, question: str
) -> str:
    title = document.title
    description = document.description
    context = document.context
    session_context = document.session.context
    language = document.session.language

    if language == "nl":
        prompt = ChatPromptTemplate.from_template(
            "Een onderzoeker heeft een onderzoek vraag gesteld die relevant is voor een set van bronnen"
            f"\nGlobale context: {session_context}"
            "\nJij bent een zorgvuldige onderzoeker en een deskundige schrijver. Jou taak is om een sub-onderzoeksvraag te formuleren waarvan de antwoord op de vraag alle context geeft om de globale onderzoek vraag doorgronding te beantwoorden als deze vraag aan alle bronnen wordt gevraagd. Hier is de relevante bron:"
            f"\nBron titel: {title}"
            f"\Bron omschrijving: {description}"
            f"\nBron extra context: {context}"
            f"\nDit is de vraag die de onderzoeker heeft gesteld die zij aan de hand van alle bronnen willen beantwoorden: {question}"
            "\nAls voorbeeld - een onderzoeker vraagt wat de bronnen gemeen hebben, en waar ze verschillen - dan is het belangrijk dat de geherformuleerde sub-onderzoeksvraag per bron een overzicht maakt van wat de bron probeert te communiceren en hoe, alle sleutel thema's benoemt en omschrijft, de perspectief van de bron vermeld (voor wie, door wie, voor wat). In het kort: Vraag de vraag waarvan de antwoord kan worden gebruikt om de globale onderzoek vraag doorgronding te beantwoorden."
            f"\nGeherformuleerde onderzoeksvraag voor dit specifieke bron:"
        )
    elif language == "en":
        prompt = ChatPromptTemplate.from_template(
            "A researcher has asked a global research question that is relevant to a set of documents they uploaded."
            f"\nGlobal context: {session_context}"
            "\nYou are a careful researcher and an expert writer. Your task is to transform the question to be relevant to the current document below"
            f"\nDocument title: {title}"
            f"\nDocument description: {description}"
            f"\nDocument context: {context}"
            f"\nHere is the question that you need to transform: {question}"
            f"\nTransformed question:"
        )
    else:
        raise ValueError(f"Language {language} not supported")

    chain = prompt | chat_llm_small | StrOutputParser()

    transformed_question = chain.invoke({})

    return transformed_question


# Q+A for a document
async def ask_document(
    document: DocumentModel,
    question: str,
    is_global: bool = False,
    use_transform_question: bool = False,
    use_chat_history: bool = True,
) -> DocumentMessageModel:
    original_question = question
    language = document.session.language

    if is_global and use_transform_question:
        question = transform_question_for_global_analysis(document, question)

    logger.info(
        f"Processing document question, document: {document.id}, question: {question}"
    )

    user_question = (
        original_question
        # if not is_global
        # else original_question + f"\n\n(in de context van deze bron: {question})"
    )

    user_message = DocumentMessageModel(
        id=str(uuid4()),
        text=user_question,
        from_user=True,
        is_global=is_global,
        document_id=document.id,
        created_at=datetime.now(tz=timezone.utc),
    )

    message_history = document.messages
    message_history.sort(key=lambda x: x.created_at)
    logger.info(f"Loaded {len(message_history)} messages from document {document.id}")

    # if needed summarise the memory to stay within context
    memory = ConversationSummaryBufferMemory(llm=chat_llm_small, return_messages=True)

    for message in message_history:
        memory.chat_memory.add_message(message.get_lc_message())

    # generate summary if needed
    memory.prune()

    summary_message = SystemMessage(content=memory.moving_summary_buffer)

    # Only retrieve documents that are relevant to the document in question
    # A single pdf is split into multiple langchain documents here, doc.id refers to the PDF, but k=2 says slice the 2 most relevant chunks from the PDF.
    #  Play around with number of chunks (in process.py) and chunk length to get the best results TODO
    retriever = vectorstore.as_retriever(
        search_kwargs={"filter": {"document_id": document.id}}
    )

    retrieved_documents = retriever.get_relevant_documents(question)
    logger.info(f"Retrieved {len(retrieved_documents)} documents")
    logger.info(f"Retrieved documents: {retrieved_documents}")

    context = [d.page_content for d in retrieved_documents]

    prompt: List[BaseMessage]
    if language == "nl":
        prompt = [
            SystemMessage(
                content=(
                    "Jij bent een zorgvuldige onderzoeker en een deskundige schrijver. Gegeven de volgende tekst, reageer op de vraag van de gebruiker."
                    f"\nOver deze bron: {document.title}"
                    f"\Bron samenvatting: {document.description}"
                    f"\n{document.context if document.context else ''}"
                    f"\nExtra context: {' '.join(context)}"
                )
            )
        ]

    elif language == "en":
        prompt = [
            SystemMessage(
                content=(
                    "You are a helpful assistant. Given the following text, respond to the user's queries."
                    f"\nAbout the document: {document.title}"
                    f"\nDocument summary: {document.description}"
                    f"\n{document.context if document.context else ''}"
                    f"\nAdditional Context: {' '.join(context)}"
                )
            )
        ]

    else:
        raise ValueError(f"Language {language} not supported")

    chat_history = memory.load_memory_variables({})

    if summary_message.content != "":
        logger.info(f"Generated messages summary: {summary_message.content}")
        prompt.append(summary_message)

    if len(chat_history) > 0 and use_chat_history:
        prompt.extend(chat_history["history"])

    prompt.append(HumanMessage(content=question))

    logger.info(f"Generated prompt: {prompt}")

    prediction = chat_llm_small.invoke([*prompt])

    ai_response = DocumentMessageModel(
        id=str(uuid4()),
        text=prediction.content,
        from_user=False,
        is_global=is_global,
        document_id=document.id,
        created_at=datetime.now(tz=timezone.utc),
    )

    db.add(user_message)
    db.add(ai_response)
    db.commit()

    return ai_response


async def ask_global(session: SessionModel, question: str) -> DocumentMessageModel:
    logger.info(f"Processing global question, question: {question}")
    try:
        language = session.language
        documents = session.documents

        logger.info(f"Loaded {len(documents)} documents from session {session.id}")

        if len(documents) == 0:
            raise ValueError("No documents available")

        session.processing_since = datetime.now(tz=timezone.utc)

        user_message = SessionMessageModel(
            id=str(uuid4()),
            session_id=session.id,
            text=question,
            from_user=True,
            documents_used=set(documents),
        )

        db.add(session)
        db.add(user_message)
        db.commit()

        ai_response_futures = []

        for document in documents:
            ai_response_futures.append(
                ask_document(
                    document=document,
                    question=question,
                    is_global=True,
                    use_transform_question=False,
                    use_chat_history=False,
                )
            )

        ai_responses: List[DocumentMessageModel] = await asyncio.gather(
            *ai_response_futures
        )

        # ai_responses are already added to db, so we can continue

        # message_history = session.messages
        # message_history.sort(key=lambda x: x.created_at)
        # logger.info(f"Loaded {len(message_history)} messages from session {session.id}")

        # memory = ConversationSummaryBufferMemory(
        #     llm=chat_llm_small, return_messages=True
        # )

        # for message in message_history:
        #     memory.chat_memory.add_message(message.get_lc_message())

        # generate summary if needed
        # memory.prune()

        # summary_message = SystemMessage(content=memory.moving_summary_buffer)

        # No vectorstore for global questions because each individual doc is allready vector store queried. We are just summarising.

        # No filter on this
        retriever = vectorstore.as_retriever(
            search_kwargs={"filter": {"session_id": session.id}}
        )

        retrieved_documents = retriever.get_relevant_documents(question)

        logger.info(f"Retrieved {len(retrieved_documents)} documents")
        logger.info(f"Retrieved documents: {retrieved_documents}")

        global_retrieved_context = [d.page_content for d in retrieved_documents]

        prompt_per_document = []

        for ai_response in ai_responses:
            prompt_per_document.extend(
                [
                    "{}: {}\nContext van deze bron: {}\n{}".format(
                        ai_response.document.title,
                        ai_response.text,
                        ai_response.document.context,
                        ai_response.document.description,
                    )
                ]
            )

        prompt: List[BaseMessage]
        if language == "nl":
            prompt = [
                SystemMessage(
                    content=(
                        "Jij bent een zorgvuldige onderzoeker en een deskundige schrijver. Gegeven de volgende tekst, reageer op de vraag van de gebruiker."
                        + f"\n\nAditionele context: {session.context}"
                        + "\nDe gebruiker heeft een vraag gesteld die relevant is voor de volgende bronnen, en het volgende is gevonden"
                        + "\n\nEnkele geselecteerde bronnen:"
                        + "\n".join(global_retrieved_context)
                        + "\n\nAntwoorden per bron:"
                        + "\n".join(prompt_per_document)
                        + "\n\nConsolideer deze bevindingen en geef een diepgaand en gedetailleerd antwoord aan de gebruiker in markdown formaat waarin alle vragen systematisch worden beantwoord."
                    )
                )
            ]
        elif language == "en":
            prompt = [
                SystemMessage(
                    content=(
                        "You are a helpful and analytical research assistant. Given the following text, respond to the user's research question."
                        + f"\n\nAdditional Context: {session.context}"
                        + "\nThe user has asked a question that is relevant to the following documents, and the following was found"
                        + "\n\nSome select source documents:"
                        + "\n".join(global_retrieved_context)
                        + "\n\nResponses per document:"
                        + "\n".join(prompt_per_document)
                        + "\n\nPlease consolidate these findings and provide an in-depth and detailed response to the user answering all of their questions systematically."
                    )
                )
            ]
        else:
            raise ValueError(f"Language {language} not supported")

        # chat_history = memory.load_memory_variables({})

        # if summary_message.content != "":
        #     logger.info(f"Generated messages summary: {summary_message.content}")
        #     prompt.append(summary_message)

        # if len(chat_history) > 0:
        #     prompt.extend(chat_history["history"])

        prompt.append(HumanMessage(content=question))

        logger.info(f"Generated prompt: {prompt}")

        prediction = chat_llm_large.invoke([*prompt])

        # concatenate all the per doc responses
        global_response_return = (
            "\n\n".join([f"#### {r.document.title}\n\n{r.text}" for r in ai_responses])
            + "\n\n"
            + "#### Summary\n\n"
            + str(prediction.content)
        )

        global_response = SessionMessageModel(
            id=str(uuid4()),
            session_id=session.id,
            text=global_response_return,
            from_user=False,
            documents_used=set(documents),
        )

        session.processing_since = None

        db.add(session)
        db.add(global_response)
        db.commit()

        return global_response
    except Exception as e:
        logger.error(f"Error while processing global question: {e}")
        session.processing_since = None
        db.commit()
        raise e


if __name__ == "__main__":
    pass
