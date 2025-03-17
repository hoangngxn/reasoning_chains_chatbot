from pydantic import BaseModel, Field
from datetime import datetime
import uuid
from typing import Optional

class Conversation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ChatMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    conversation_id: str
    role: str  
    message: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ConversationCreate(BaseModel):
    title: str = "New Conversation"

class MessageRequest(BaseModel):
    conversation_id: Optional[str] = None
    message: str
    model: str = "gemini-2.0-flash"
