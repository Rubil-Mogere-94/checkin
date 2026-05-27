from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str
    role: Optional[str] = "employee"

class UserResponse(UserBase):
    id: int
    role: str
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    email: str

class CheckInCreate(BaseModel):
    employee_email: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class CheckInResponse(BaseModel):
    id: int
    employee_email: str
    arrival_time: datetime
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    class Config:
        from_attributes = True

class LocationCreate(BaseModel):
    name: str
    branch_id: str

class LocationResponse(LocationCreate):
    id: int
    class Config:
        from_attributes = True

class ChatMessage(BaseModel):
    message: str
    session_id: str
    user_email: Optional[str] = None

class ChatResponse(BaseModel):
    response: str

class FAQItem(BaseModel):
    id: Optional[int] = None
    question: str
    answer: str

