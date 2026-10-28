import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Depends, HTTPException
from .database import engine, get_db
from . import models, schemas
from .routers import auth, checkin, users, locations, chat

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CheckIn QR API",
    version="2.0.0",
    description="Backend for CheckIn — QR-based attendance system with role-based access control.",
)

SECRET_KEY = os.environ.get("SECRET_KEY", "checkin_secret_key_change_in_production")

raw_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,https://checkin.vercel.app")
ALLOWED_ORIGINS = [o.strip() for o in raw_origins.split(",") if o.strip()]

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
    try:
        db = next(get_db())
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


@app.post("/api/qr/token", response_model=schemas.QRTokenResponse, tags=["qr"])
def generate_qr_token(
    email: str,
    latitude: float | None = None,
    longitude: float | None = None,
    db=Depends(get_db),
):
    """Generate an opaque, signed, expiring QR token for an employee check-in pass.
    The payload is never personal data — it is a JWT validated server-side.
    """
    import jwt
    from datetime import datetime, timedelta, timezone

    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=5)

    payload = {
        "sub": email,
        "iat": now,
        "exp": expire,
        "lat": latitude,
        "lng": longitude,
        "ver": 2,
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")

    base_url = os.environ.get("QR_BASE_URL", "https://checkin.vercel.app")
    qr_url = f"{base_url}/admin/dashboard/{token}"

    return schemas.QRTokenResponse(
        token=token,
        qr_url=qr_url,
        expires_at=expire,
    )


@app.post("/api/qr/validate", response_model=schemas.QRValidateResponse, tags=["qr"])
def validate_qr_token(token: str, db=Depends(get_db)):
    """Validate an opaque QR token and return the embedded employee email,
    coordinates, and expiry. Used by admin scanner to log check-ins."""
    import jwt
    from datetime import datetime, timezone

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="QR token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid QR token")

    email = payload.get("sub")
    if not email:
        raise HTTPException(status_code=401, detail="QR token missing employee identity")

    return schemas.QRValidateResponse(
        email=email,
        latitude=payload.get("lat"),
        longitude=payload.get("lng"),
        exp=payload.get("exp"),
    )
