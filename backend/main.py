from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine
from . import models, schemas
from .routers import auth, checkin, users, locations, chat

# Create all tables on startup (adds new columns automatically via alter if using migrations)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CheckIn QR API",
    version="2.0.0",
    description="Backend for CheckIn — QR-based attendance system with role-based access control.",
)

# CORS — allow local dev and production front-end
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://checkin.vercel.app",  # update with actual production URL
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
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
    return {"message": "CheckIn QR API is running", "version": "2.0.0"}


@app.get("/api/health", response_model=schemas.HealthResponse, tags=["health"])
def health_check():
    """Liveness probe — returns service status, DB engine, and API version.
    The frontend Configuration panel uses this to show 'Connected / Disconnected'.
    """
    try:
        # Quick DB connectivity test
        from .database import SessionLocal
        db = SessionLocal()
        db.execute(__import__("sqlalchemy").text("SELECT 1"))
        db.close()
        db_status = "connected"
    except Exception:
        db_status = "error"

    return schemas.HealthResponse(
        status="ok",
        database=db_status,
        version="2.0.0",
    )
