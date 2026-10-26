from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="employee")   # "super_admin" | "admin" | "employee"
    branch = Column(String, nullable=True)      # assigned branch name

class Location(Base):
    __tablename__ = "locations"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    branch_id = Column(String, unique=True, index=True)

class CheckInLog(Base):
    __tablename__ = "checkin_logs"

    id = Column(Integer, primary_key=True, index=True)
    employee_email = Column(String, index=True)
    arrival_time = Column(DateTime(timezone=True), server_default=func.now())
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

class ChatLog(Base):
    __tablename__ = "chat_logs"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True)
    user_email = Column(String, index=True, nullable=True)
    message = Column(String)
    is_bot = Column(Integer, default=0)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
