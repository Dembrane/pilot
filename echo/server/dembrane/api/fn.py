# from typing import Optional

from fastapi import APIRouter  # , HTTPException

# from pydantic import BaseModel

# from dembrane.database import ConversationModel, DependencyInjectDatabase
# from dembrane.quote_utils import count_tokens

FnRouter = APIRouter(tags=["functions"])


# class CountTokensBodySchema(BaseModel):
#     text: Optional[str] = None
#     conversation_id: Optional[str] = None
#     model: Optional[str] = "openai"


# @FnRouter.post("/count-tokens")
# async def post_count_tokens(body: CountTokensBodySchema, db: DependencyInjectDatabase) -> int:
#     if body.model == "openai":
#         if body.text is not None:
#             return count_tokens(body.text)

#         if body.conversation_id is not None:
#             conversation = db.get(ConversationModel, body.conversation_id)

#             if not conversation:
#                 raise HTTPException(status_code=404, detail="Conversation not found")

#             return count_tokens(conversation.transcript)

#     else:
#         raise HTTPException(status_code=400, detail="Model not supported")
