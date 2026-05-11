from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine
from . import models
from .routers import auth, checkin, users, locations, chat

# Create all tables on startup
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Check-In QR API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(checkin.router)
app.include_router(users.router)
app.include_router(locations.router)
app.include_router(chat.router)
@app.get("/")
def root():
    return {"message": "Check-In QR API is running"}
