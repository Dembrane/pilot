import json
from typing import Any, Dict, List, Optional, Generator

from anthropic import Anthropic, AsyncAnthropic

from dembrane.config import ANTHROPIC_API_KEY

anthropic_client = Anthropic(
    api_key=ANTHROPIC_API_KEY,
)

async_anthropic_client = AsyncAnthropic(
    api_key=ANTHROPIC_API_KEY,
)

def stream_anthropic_chat_response(
        system: List[Dict[str, Any]],
        messages: List[Dict[str, Any]],
        protocol: str = "data"
) -> Generator[str, None, None]:
    stream = anthropic_client.beta.prompt_caching.messages.create( # type: ignore
        model="claude-3-5-sonnet-20241022",
        system=system,  
        messages=messages,  
        max_tokens=2048,
        stream=True,
    )

    finish_reason = "unknown"
    usage = {"promptTokens": 0, "completionTokens": 0}
    tool_call_content_blocks = {}

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
            if chunk.delta.stop_reason:  
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
