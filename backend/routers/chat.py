from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas, database
from langchain_community.llms import Ollama
from langchain.prompts import PromptTemplate

router = APIRouter(prefix="/chat", tags=["chat"])

# Initialize Ollama LLM
# Note: Ensure Ollama is running locally (e.g. `ollama serve` and `ollama run llama3`)
llm = Ollama(model="llama3")

template = """You are a helpful and intelligent AI assistant for the Check-In QR App. 
You act as a virtual HR assistant. Answer the user's query intelligently.
If you do not know the answer, just say you don't know. Do not make up information.

User: {user_input}
AI:"""

prompt = PromptTemplate(template=template, input_variables=["user_input"])
chain = prompt | llm

@router.post("/", response_model=schemas.ChatResponse)
def send_message(chat: schemas.ChatMessage, db: Session = Depends(database.get_db)):
    # Save user message
    user_log = models.ChatLog(
        session_id=chat.session_id,
        user_email=chat.user_email,
        message=chat.message,
        is_bot=0
    )
    db.add(user_log)
    db.commit()

    # Generate response
    try:
        response_text = chain.invoke({"user_input": chat.message})
    except Exception as e:
        response_text = "I'm having trouble connecting to my AI brain. Make sure Ollama is running locally!"

    # Save bot response
    bot_log = models.ChatLog(
        session_id=chat.session_id,
        user_email=chat.user_email,
        message=response_text,
        is_bot=1
    )
    db.add(bot_log)
    db.commit()

    return schemas.ChatResponse(response=response_text)
