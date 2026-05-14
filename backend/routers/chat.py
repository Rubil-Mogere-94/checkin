import json
import os
import pandas as pd
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import asyncio
from .. import models, schemas, database

router = APIRouter(prefix="/chat", tags=["chat"])

# Basic RAG / Assistant System using TF-IDF on a customized CSV
csv_path = os.path.join(os.path.dirname(__file__), "..", "faq.csv")
df = pd.read_csv(csv_path)

vectorizer = TfidfVectorizer()
tfidf_matrix = vectorizer.fit_transform(df['question'])

def get_answer(query: str) -> str:
    query_vec = vectorizer.transform([query])
    similarities = cosine_similarity(query_vec, tfidf_matrix).flatten()
    best_idx = similarities.argmax()
    if similarities[best_idx] > 0.15: # Lower threshold to allow for more flexibility
        return df.iloc[best_idx]['answer']
    else:
        return "I'm not sure about that. Please ask about the QR check-in process, location tracking, or your dashboard!"

@router.post("/stream")
async def stream_message(chat: schemas.ChatMessage, db: Session = Depends(database.get_db)):
    """SSE endpoint — streams answer from the basic RAG AI."""
    
    # Persist user message
    db.add(models.ChatLog(
        session_id=chat.session_id,
        user_email=chat.user_email,
        message=chat.message,
        is_bot=0,
    ))
    db.commit()

    bot_response = get_answer(chat.message)

    async def generate():
        # Simulate streaming token by token
        words = bot_response.split(" ")
        for word in words:
            token = word + " "
            yield f"data: {json.dumps({'token': token})}\n\n"
            await asyncio.sleep(0.05)
        yield "data: [DONE]\n\n"

        # Persist bot response
        try:
            db.add(models.ChatLog(
                session_id=chat.session_id,
                user_email=chat.user_email,
                message=bot_response,
                is_bot=1,
            ))
            db.commit()
        except Exception:
            pass

    return StreamingResponse(generate(), media_type="text/event-stream")

@router.post("/", response_model=schemas.ChatResponse)
def send_message(chat: schemas.ChatMessage, db: Session = Depends(database.get_db)):
    db.add(models.ChatLog(
        session_id=chat.session_id,
        user_email=chat.user_email,
        message=chat.message,
        is_bot=0,
    ))
    db.commit()

    bot_response = get_answer(chat.message)

    db.add(models.ChatLog(
        session_id=chat.session_id,
        user_email=chat.user_email,
        message=bot_response,
        is_bot=1,
    ))
    db.commit()

    return schemas.ChatResponse(response=bot_response)
