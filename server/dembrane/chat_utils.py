import json
from typing import Dict, List, Optional

from pydantic import BaseModel
from anthropic import Anthropic
from sqlalchemy.orm import Session

from dembrane.config import ANTHROPIC_API_KEY
from dembrane.database import ProjectChatMessageModel

MAX_CHAT_CONTEXT_LENGTH = 120000


class ClientAttachment(BaseModel):
    name: str
    contentType: str
    url: str


class ToolInvocation(BaseModel):
    toolCallId: str
    toolName: str
    args: dict
    result: dict


class ClientMessage(BaseModel):
    role: str
    content: str
    experimental_attachments: Optional[List[ClientAttachment]] = None
    toolInvocations: Optional[List[ToolInvocation]] = None


def convert_to_openai_messages(messages: List[ClientMessage]):
    openai_messages = []

    for message in messages:
        parts = []

        parts.append({"type": "text", "text": message.content})

        if message.experimental_attachments:
            for attachment in message.experimental_attachments:
                if attachment.contentType.startswith("image"):
                    parts.append({"type": "image_url", "image_url": {"url": attachment.url}})

                elif attachment.contentType.startswith("text"):
                    parts.append({"type": "text", "text": attachment.url})

        if message.toolInvocations:
            tool_calls = [
                {
                    "id": tool_invocation.toolCallId,
                    "type": "function",
                    "function": {
                        "name": tool_invocation.toolName,
                        "arguments": json.dumps(tool_invocation.args),
                    },
                }
                for tool_invocation in message.toolInvocations
            ]

            openai_messages.append({"role": "assistant", "tool_calls": tool_calls})

            tool_results = [
                {
                    "role": "tool",
                    "content": json.dumps(tool_invocation.result),
                    "tool_call_id": tool_invocation.toolCallId,
                }
                for tool_invocation in message.toolInvocations
            ]

            openai_messages.extend(tool_results)

            continue

        openai_messages.append({"role": message.role, "content": parts})

    return openai_messages


def get_project_chat_history(chat_id: str, db: Session) -> List[Dict[str, str]]:
    db_messages = (
        db.query(ProjectChatMessageModel)
        .filter(ProjectChatMessageModel.project_chat_id == chat_id)
        .order_by(ProjectChatMessageModel.date_created.asc())
        .all()
    )

    messages = []
    for i in db_messages:
        messages.append(
            {
                "role": i.message_from,
                "content": i.text,
            }
        )

    return messages


anthropic_client = Anthropic(
    api_key=ANTHROPIC_API_KEY,
)


def stream_anthropic_chat_response(messages: List[Dict[str, str]], protocol: str = "data"):
    stream = anthropic_client.messages.create(
        model="claude-3-sonnet-20240229", messages=messages, max_tokens=1000, stream=True
    )

    finish_reason = "unknown"
    usage = {"promptTokens": 0, "completionTokens": 0}
    tool_call_content_blocks = {}
    # provider_metadata = None

    for chunk in stream:
        if chunk.type == "ping":
            continue

        elif chunk.type == "content_block_start":
            if chunk.content_block.type == "text":
                continue
            elif chunk.content_block.type == "tool_use":
                tool_call_content_blocks[chunk.index] = {
                    "tool_call_id": chunk.content_block.id,
                    "tool_name": chunk.content_block.name,
                    "json_text": "",
                }
                if protocol == "data":
                    yield f"b:{json.dumps({'toolCallId': chunk.content_block.id, 'toolName': chunk.content_block.name})}\n"

        elif chunk.type == "content_block_stop":
            if chunk.index in tool_call_content_blocks:
                content_block = tool_call_content_blocks[chunk.index]
                if protocol == "data":
                    yield f"9:{json.dumps({'toolCallId': content_block['tool_call_id'], 'toolName': content_block['tool_name'], 'args': json.loads(content_block['json_text'])})}\n"
                del tool_call_content_blocks[chunk.index]

        elif chunk.type == "content_block_delta":
            if chunk.delta.type == "text_delta":
                if protocol == "text":
                    yield chunk.delta.text
                elif protocol == "data":
                    yield f"0:{json.dumps(chunk.delta.text)}\n"
            elif chunk.delta.type == "input_json_delta":
                content_block = tool_call_content_blocks[chunk.index]
                if protocol == "data":
                    yield f"c:{json.dumps({'toolCallId': content_block['tool_call_id'], 'argsTextDelta': chunk.delta.partial_json})}\n"
                content_block["json_text"] += chunk.delta.partial_json

        elif chunk.type == "message_start":
            usage["promptTokens"] = chunk.message.usage.input_tokens
            usage["completionTokens"] = chunk.message.usage.output_tokens
            if protocol == "data":
                yield f"2:{json.dumps([{'id': chunk.message.id, 'modelId': chunk.message.model}])}\n"

        elif chunk.type == "message_delta":
            usage["completionTokens"] = chunk.usage.output_tokens
            finish_reason = map_anthropic_stop_reason(chunk.delta.stop_reason)

        elif chunk.type == "message_stop":
            if protocol == "data":
                yield f"d:{json.dumps({'finishReason': finish_reason, 'usage': usage})}\n"

        elif chunk.type == "error":
            if protocol == "data":
                yield f"3:{json.dumps(chunk.error)}\n"
            else:
                yield f"Error: {chunk.error}"


def map_anthropic_stop_reason(finish_reason: Optional[str]) -> str:
    if finish_reason in ["end_turn", "stop_sequence"]:
        return "stop"
    elif finish_reason == "tool_use":
        return "tool-calls"
    elif finish_reason == "max_tokens":
        return "length"
    else:
        return "unknown"
