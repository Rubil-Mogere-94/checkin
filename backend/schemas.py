from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str
    role: Optional[str] = "employee"

class UserUpdate(BaseModel):
    """Partial update for a user — all fields optional."""
    role: Optional[str] = None
    branch: Optional[str] = None

class UserResponse(UserBase):
    id: int
    role: str
    branch: Optional[str] = None
    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    email: str

class LogoutResponse(BaseModel):
    message: str

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
        orm_mode = True

class StatsResponse(BaseModel):
    total: int
    today: int
    flagged: int
    employees: int
    locations: int

class LocationCreate(BaseModel):
    name: str
    branch_id: str

class LocationUpdate(BaseModel):
    """Partial update for a location — all fields optional."""
    name: Optional[str] = None
    branch_id: Optional[str] = None

class LocationResponse(LocationCreate):
    id: int
    class Config:
        orm_mode = True

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

class HealthResponse(BaseModel):
    status: str
    database: str
    version: str


class QRTokenResponse(BaseModel):
    token: str
    qr_url: str
    expires_at: datetime


class QRValidateResponse(BaseModel):
    email: str
    latitude: float | None = None
    longitude: float | None = None
    exp: int | None = None

