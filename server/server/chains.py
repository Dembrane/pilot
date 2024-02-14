from datetime import datetime, timezone
from logging import getLogger
from typing import List
from uuid import uuid4
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser
from langchain.chains import load_summarize_chain as lc_load_summarize_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain.memory import ConversationSummaryBufferMemory

from server.models import DocumentMessageModel, DocumentModel, db
from server.vectorstore import vectorstore

logger = getLogger("chains")

llm = ChatOpenAI(temperature=0.5, model_name="gpt-3.5-turbo-1106", max_retries=6)


def load_title_chain():
    prompt = ChatPromptTemplate.from_template(
        "Generate a title for the given text. Do not enclose the title in quotes. Only output the title.\nText:{text}\nTitle:"
    )
    return prompt | llm | StrOutputParser()


def load_summary_chain():
    return lc_load_summarize_chain(
        llm, chain_type="map_reduce", input_key="documents", output_key="output_text"
    )


def ask_document(document: DocumentModel, question: str):
    user_message = DocumentMessageModel(
        id=str(uuid4()),
        text=question,
        from_user=True,
        document_id=document.id,
        created_at=datetime.now(tz=timezone.utc),
    )

    message_history = document.messages
    message_history.sort(key=lambda x: x.created_at)
    logger.info(f"Loaded {len(message_history)} messages from document {document.id}")

    memory = ConversationSummaryBufferMemory(llm=llm, return_messages=True)

    for message in message_history:
        memory.chat_memory.add_message(message.get_lc_message())

    # generate summary if needed
    memory.prune()

    summary_message = SystemMessage(content=memory.moving_summary_buffer)
    logger.info(f"Generated messages summary: {summary_message.content}")

    retriever = vectorstore.as_retriever(
        search_kwargs={"k": 2, "filter": {"document_id": document.id}}
    )

    retrieved_documents = retriever.get_relevant_documents(question)
    logger.info(f"Retrieved {len(retrieved_documents)} documents")
    logger.info(f"Retrieved documents: {retrieved_documents}")

    context = [d.page_content for d in retrieved_documents]
    logger.info(f"Generated context: {context}")

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

    chat_history = memory.load_memory_variables({})

    if summary_message.content != "":
        prompt.append(summary_message)

    if len(chat_history) > 0:
        prompt.extend(chat_history["history"])

    prompt.append(HumanMessage(content=question))

    logger.info(f"Generated prompt: {prompt}")

    prediction = llm.invoke([*prompt])

    ai_response = DocumentMessageModel(
        id=str(uuid4()),
        text=prediction.content,
        from_user=False,
        document_id=document.id,
        created_at=datetime.now(tz=timezone.utc),
    )

    db.add(user_message)
    db.add(ai_response)
    db.commit()

    return ai_response


if __name__ == "__main__":
    document = db.query(DocumentModel).first()
    # question = "what was my last question about?"
    # response = ask_document(document, question)
    # print("Done")

    print(vectorstore.similarity_search("XYZ Shareholder"))
