import logging
from typing import Any, Dict, List, Literal, Optional, Generator

from fastapi import Query, APIRouter, HTTPException
from pydantic import BaseModel
from fastapi.responses import StreamingResponse

from dembrane.utils import generate_uuid, get_utc_timestamp
from dembrane.database import (
    DatabaseSession,
    ProjectChatModel,
    ConversationModel,
    ProjectChatMessageModel,
    DependencyInjectDatabase,
)
from dembrane.anthropic import stream_anthropic_chat_response
from dembrane.chat_utils import (
    MAX_CHAT_CONTEXT_LENGTH,
    get_project_chat_history,
    create_system_messages_for_chat,
)
from dembrane.quote_utils import count_tokens
from dembrane.api.conversation import get_conversation_token_count

ChatRouter = APIRouter(tags=["chat"])

logger = logging.getLogger("dembrane.chat")


class ChatContextConversationSchema(BaseModel):
    conversation_id: str
    conversation_participant_name: str
    locked: bool
    token_usage: float  # between 0 and 1


class ChatContextMessageSchema(BaseModel):
    role: Literal["user", "assistant"]
    token_usage: float  # between 0 and 1


class ChatContextSchema(BaseModel):
    conversations: List[ChatContextConversationSchema]
    messages: List[ChatContextMessageSchema]
    conversation_id_list: List[str]
    locked_conversation_id_list: List[str]


@ChatRouter.get("/{chat_id}/context", response_model=ChatContextSchema)
async def get_chat_context(chat_id: str, db: DependencyInjectDatabase) -> ChatContextSchema:
    chat = db.get(ProjectChatModel, chat_id)

    if chat is None:
        raise HTTPException(status_code=404, detail="Chat not found")

    messages = (
        db.query(ProjectChatMessageModel)
        .filter(ProjectChatMessageModel.project_chat_id == chat_id)
        .all()
    )

    # conversation is locked when any chat message is using a conversation
    locked_conversations = set()
    for message in messages:
        for conversation in message.used_conversations:
            locked_conversations.add(conversation.id)

    user_message_token_count = 0
    assistant_message_token_count = 0

    for message in messages:
        if message.message_from in ["user", "assistant"]:
            # if tokens_count is not set, set it
            if message.tokens_count is None:
                message.tokens_count = count_tokens(message.text)
                db.commit()

            if message.message_from == "user":
                user_message_token_count += message.tokens_count
            elif message.message_from == "assistant":
                assistant_message_token_count += message.tokens_count

    used_conversations = chat.used_conversations

    # initialize response
    context = ChatContextSchema(
        conversations=[],
        conversation_id_list=[],
        locked_conversation_id_list=[],
        messages=[
            ChatContextMessageSchema(
                role="user",
                token_usage=user_message_token_count / MAX_CHAT_CONTEXT_LENGTH,
            ),
            ChatContextMessageSchema(
                role="assistant",
                token_usage=assistant_message_token_count / MAX_CHAT_CONTEXT_LENGTH,
            ),
        ],
    )

    for conversation in used_conversations:
        is_conversation_locked = conversation.id in locked_conversations
        chat_context_resource = ChatContextConversationSchema(
            conversation_id=conversation.id,
            conversation_participant_name=conversation.participant_name,
            locked=is_conversation_locked,
            # TODO: if quotes for this convo are present then just use RAG
            token_usage=(
                await get_conversation_token_count(conversation.id, db) / MAX_CHAT_CONTEXT_LENGTH
            ),
        )
        context.conversations.append(chat_context_resource)
        context.conversation_id_list.append(conversation.id)
        if is_conversation_locked:
            context.locked_conversation_id_list.append(conversation.id)

    return context


class ChatAddContextSchema(BaseModel):
    conversation_id: Optional[str] = None


@ChatRouter.post("/{chat_id}/add-context")
async def add_chat_context(
    chat_id: str, body: ChatAddContextSchema, db: DependencyInjectDatabase
) -> None:
    if body.conversation_id is None:
        raise HTTPException(status_code=400, detail="conversation_id is required")

    chat = db.get(ProjectChatModel, chat_id)

    if chat is None or body.conversation_id is None:
        raise HTTPException(status_code=404, detail="Chat not found")

    conversation = db.get(ConversationModel, body.conversation_id)

    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # check if the conversation is already in the chat
    for i_conversation in chat.used_conversations:
        if i_conversation.id == conversation.id:
            raise HTTPException(status_code=400, detail="Conversation already in the chat")

    # check if the conversation is too long
    if await get_conversation_token_count(conversation.id, db) > MAX_CHAT_CONTEXT_LENGTH:
        raise HTTPException(status_code=400, detail="Conversation is too long")

    # sum of all other conversations
    chat_context = await get_chat_context(chat_id, db)
    chat_context_token_usage = sum(
        conversation.token_usage for conversation in chat_context.conversations
    )

    conversation_to_add_token_usage = (
        await get_conversation_token_count(conversation.id, db) / MAX_CHAT_CONTEXT_LENGTH
    )

    if chat_context_token_usage + conversation_to_add_token_usage > 1:
        raise HTTPException(
            status_code=400,
            detail="Chat context is too long. Remove other conversations to proceed.",
        )

    chat.used_conversations.append(conversation)
    db.commit()

    return


class ChatDeleteContextSchema(BaseModel):
    conversation_id: str


@ChatRouter.post("/{chat_id}/delete-context")
async def delete_chat_context(
    chat_id: str, body: ChatDeleteContextSchema, db: DependencyInjectDatabase
) -> None:
    chat = db.get(ProjectChatModel, chat_id)

    if chat is None:
        raise HTTPException(status_code=404, detail="Chat not found")

    conversation = db.get(ConversationModel, body.conversation_id)

    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")

    chat_context = await get_chat_context(chat_id, db)

    # check if conversation exists in chat_context
    for project_chat_conversation in chat_context.conversations:
        if project_chat_conversation.conversation_id == conversation.id:
            if project_chat_conversation.locked:
                raise HTTPException(status_code=400, detail="Conversation is locked")
            else:
                chat.used_conversations.remove(conversation)
                db.commit()
                return

    raise HTTPException(status_code=404, detail="Conversation not found in the chat")


@ChatRouter.post("/{chat_id}/lock-conversations", response_model=None)
async def lock_conversations(chat_id: str, db: DependencyInjectDatabase) -> List[ConversationModel]:
    db_messages = (
        db.query(ProjectChatMessageModel)
        .filter(ProjectChatMessageModel.project_chat_id == chat_id)
        .order_by(ProjectChatMessageModel.date_created.desc())
        .all()
    )

    set_conversations_already_in_chat = set()

    for message in db_messages:
        if message.used_conversations:
            for conversation in message.used_conversations:
                set_conversations_already_in_chat.add(conversation.id)

    current_context = await get_chat_context(chat_id, db)

    set_all_conversations = set(current_context.conversation_id_list)
    set_conversations_to_add = set_all_conversations - set_conversations_already_in_chat

    if len(set_conversations_to_add) > 0:
        # Fetch ConversationModel objects for added_conversations
        added_conversations = (
            db.query(ConversationModel)
            .filter(ConversationModel.id.in_(set_conversations_to_add))
            .all()
        )

        dembrane_message = ProjectChatMessageModel(
            id=generate_uuid(),
            date_created=get_utc_timestamp(),
            message_from="dembrane",
            text=f"You added {len(set_conversations_to_add)} conversations as context to the chat.",
            project_chat_id=chat_id,
            used_conversations=added_conversations,
            added_conversations=added_conversations,
        )
        db.add(dembrane_message)
        db.commit()

    # Fetch ConversationModel objects for used_conversations
    used_conversations = (
        db.query(ConversationModel)
        .filter(ConversationModel.id.in_(current_context.conversation_id_list))
        .all()
    )

    return used_conversations



class ChatBodyMessageSchema(BaseModel):
    role: Literal["user", "assistant", "dembrane"]
    content: str


class ChatBodySchema(BaseModel):
    messages: List[ChatBodyMessageSchema]


@ChatRouter.post("/{chat_id}")
async def post_chat(
    chat_id: str,
    body: ChatBodySchema,
    db: DependencyInjectDatabase,
    protocol: str = Query("data"),
    language: str = Query("en"),
) -> StreamingResponse:
    chat = db.get(ProjectChatModel, chat_id)

    if chat is None:
        raise HTTPException(status_code=404, detail="Chat not found")

    """
    Put longform data at the top: 
    Place your long documents and inputs (~20K+ tokens) near the top of your prompt, above your query, instructions, and examples. 
    This can significantly improve performance across all models.
    """

    user_message = ProjectChatMessageModel(
        id=generate_uuid(),
        date_created=get_utc_timestamp(),
        message_from="user",
        text=body.messages[-1].content,
        project_chat_id=chat.id,
    )
    db.add(user_message)
    db.commit()

    messages = get_project_chat_history(chat_id, db)

    if len(messages) == 0:
        logger.debug("initializing chat")

    chat_context = await get_chat_context(chat_id, db)
    locked_conversation_id_list = chat_context.locked_conversation_id_list

    system_messages = await create_system_messages_for_chat(locked_conversation_id_list, db, language)

    def stream_response() -> Generator[str, None, None]:
        with DatabaseSession() as db:
            filtered_messages: List[Dict[str, Any]] = []

            for message in messages:
                if message["role"] in ["user", "assistant"]:
                    filtered_messages.append(message)

            # if the last 2 message are user messages, and have the same content, remove the last one
            # from filtered_messages
            # when ui does reload
            if (
                len(filtered_messages) >= 2
                and filtered_messages[-2]["role"] == "user"
                and filtered_messages[-1]["role"] == "user"
                and filtered_messages[-2]["content"] == filtered_messages[-1]["content"]
            ):
                filtered_messages = filtered_messages[:-1]

            try:
                for chunk in stream_anthropic_chat_response(
                    system=system_messages,
                    messages=filtered_messages,
                    protocol=protocol,
                ):
                    yield chunk
            except Exception as e:
                logger.error(f"Error in stream_anthropic_chat_response: {str(e)}")

                # delete user message
                db.delete(user_message)
                db.commit()

                if protocol == "data":
                    yield '3:"An error occurred while processing the chat response."\n'
                else:
                    yield "Error: An error occurred while processing the chat response."

        return

    headers = {"Content-Type": "text/event-stream"}
    if protocol == "data":
        headers["x-vercel-ai-data-stream"] = "v1"

    response = StreamingResponse(stream_response(), headers=headers)

    return response
