import json
import os
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import asyncio
import threading
from .. import models, schemas, database

router = APIRouter(prefix="/chat", tags=["chat"])

# Thread-safe Hot Reloading RAG / Assistant System
csv_path = os.path.join(os.path.dirname(__file__), "..", "faq.csv")
faq_lock = threading.Lock()
df = None
vectorizer = None
tfidf_matrix = None

def load_faq_data():
    global df, vectorizer, tfidf_matrix
    with faq_lock:
        try:
            if not os.path.exists(csv_path):
                # Create default empty FAQ CSV
                empty_df = pd.DataFrame(columns=['question', 'answer'])
                empty_df.to_csv(csv_path, index=False)
            df = pd.read_csv(csv_path)
            # Ensure columns and data types
            if 'question' not in df.columns:
                df['question'] = ""
            if 'answer' not in df.columns:
                df['answer'] = ""
            df['question'] = df['question'].fillna('').astype(str).str.strip()
            df['answer'] = df['answer'].fillna('').astype(str).str.strip()
            
            # Clean up empty rows
            df = df[df['question'] != '']
            
            vectorizer = TfidfVectorizer()
            if len(df) > 0:
                tfidf_matrix = vectorizer.fit_transform(df['question'])
            else:
                tfidf_matrix = None
        except Exception as e:
            print(f"Error loading FAQ: {e}")

# Initial load on startup
load_faq_data()

def get_answer(query: str) -> str:
    global df, vectorizer, tfidf_matrix
    with faq_lock:
        if df is None or len(df) == 0 or tfidf_matrix is None:
            return "I'm not sure about that. Please ask about the QR check-in process, location tracking, or your dashboard!"
        
        query_vec = vectorizer.transform([query])
        similarities = cosine_similarity(query_vec, tfidf_matrix).flatten()
        best_idx = similarities.argmax()
        if similarities[best_idx] > 0.15: # Lower threshold to allow for more flexibility
            return df.iloc[best_idx]['answer']
        else:
            return "I'm not sure about that. Please ask about the QR check-in process, location tracking, or your dashboard!"

@router.get("/faq", response_model=list[schemas.FAQItem])
def get_faqs():
    global df
    with faq_lock:
        if df is None or len(df) == 0:
            return []
        items = []
        for idx, row in df.iterrows():
            items.append(schemas.FAQItem(id=idx, question=row['question'], answer=row['answer']))
        return items

@router.post("/faq", response_model=list[schemas.FAQItem])
def create_faq(item: schemas.FAQItem):
    global df
    with faq_lock:
        new_row = pd.DataFrame([{'question': item.question.strip(), 'answer': item.answer.strip()}])
        if df is None or len(df) == 0:
            df = new_row
        else:
            df = pd.concat([df, new_row], ignore_index=True)
        df.to_csv(csv_path, index=False)
    load_faq_data()
    return get_faqs()

@router.put("/faq/{idx}", response_model=list[schemas.FAQItem])
def update_faq(idx: int, item: schemas.FAQItem):
    global df
    with faq_lock:
        if df is None or idx < 0 or idx >= len(df):
            raise HTTPException(status_code=404, detail="FAQ item not found")
        df.at[idx, 'question'] = item.question.strip()
        df.at[idx, 'answer'] = item.answer.strip()
        df.to_csv(csv_path, index=False)
    load_faq_data()
    return get_faqs()

@router.delete("/faq/{idx}", response_model=list[schemas.FAQItem])
def delete_faq(idx: int):
    global df
    with faq_lock:
        if df is None or idx < 0 or idx >= len(df):
            raise HTTPException(status_code=404, detail="FAQ item not found")
        df = df.drop(idx).reset_index(drop=True)
        df.to_csv(csv_path, index=False)
    load_faq_data()
    return get_faqs()

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
