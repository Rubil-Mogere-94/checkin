import json
import requests
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from .. import models, schemas, database

router = APIRouter(prefix="/chat", tags=["chat"])

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "tinyllama"

# Keep this short — every token here costs CPU prefill time
SYSTEM_PROMPT = (
    "You are ChatterMax, a witty and helpful AI assistant for an employee QR check-in app. "
    "Answer concisely and directly. Never refuse reasonable questions."
)

# Ollama generation options — tuned for CPU speed
OLLAMA_OPTIONS = {
    "num_thread": 4,      # use more CPU cores
    "num_predict": 250,   # cap output to avoid multi-minute responses
    "temperature": 0.7,
    "top_p": 0.9,
    "repeat_penalty": 1.1,
}


def build_prompt(user_input: str) -> str:
    return f"{SYSTEM_PROMPT}\n\nUser: {user_input}\nAI:"


# ── Streaming endpoint ────────────────────────────────────────────────────────

@router.post("/stream")
def stream_message(chat: schemas.ChatMessage, db: Session = Depends(database.get_db)):
    """SSE endpoint — yields tokens from Ollama as they are generated."""

    # Persist user message immediately
    db.add(models.ChatLog(
        session_id=chat.session_id,
        user_email=chat.user_email,
        message=chat.message,
        is_bot=0,
    ))
    db.commit()

    def generate():
        collected: list[str] = []
        try:
            with requests.post(
                OLLAMA_URL,
                json={
                    "model": OLLAMA_MODEL,
                    "prompt": build_prompt(chat.message),
                    "stream": True,
                    "options": OLLAMA_OPTIONS,
                },
                stream=True,
                timeout=300,
            ) as r:
                r.raise_for_status()
                for raw_line in r.iter_lines():
                    if not raw_line:
                        continue
                    try:
                        data = json.loads(raw_line)
                    except json.JSONDecodeError:
                        continue
                    token = data.get("response", "")
                    if token:
                        collected.append(token)
                        yield f"data: {json.dumps({'token': token})}\n\n"
                    if data.get("done"):
                        break
        except Exception as exc:
            err_token = f"\n\n[Error: {exc}]"
            collected.append(err_token)
            yield f"data: {json.dumps({'token': err_token})}\n\n"

        # Persist bot response
        full_text = "".join(collected)
        try:
            db.add(models.ChatLog(
                session_id=chat.session_id,
                user_email=chat.user_email,
                message=full_text,
                is_bot=1,
            ))
            db.commit()
        except Exception:
            pass

        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


# ── Non-streaming fallback (kept for compatibility) ───────────────────────────

@router.post("/", response_model=schemas.ChatResponse)
def send_message(chat: schemas.ChatMessage, db: Session = Depends(database.get_db)):
    db.add(models.ChatLog(
        session_id=chat.session_id,
        user_email=chat.user_email,
        message=chat.message,
        is_bot=0,
    ))
    db.commit()

    try:
        r = requests.post(
            OLLAMA_URL,
            json={
                "model": OLLAMA_MODEL,
                "prompt": build_prompt(chat.message),
                "stream": False,
                "options": OLLAMA_OPTIONS,
            },
            timeout=300,
        )
        r.raise_for_status()
        response_text = r.json().get("response", "").strip()
    except requests.exceptions.ConnectionError:
        response_text = "I'm offline — make sure Ollama is running."
    except Exception as exc:
        response_text = f"Something went wrong: {exc}"

    db.add(models.ChatLog(
        session_id=chat.session_id,
        user_email=chat.user_email,
        message=response_text,
        is_bot=1,
    ))
    db.commit()

    return schemas.ChatResponse(response=response_text)
