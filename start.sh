#!/bin/bash
# Starts Ollama, FastAPI backend, and React frontend

# Function to kill background processes on exit
cleanup() {
    echo ""
    echo "Stopping all services..."
    [ -n "$BACKEND_PID" ] && kill $BACKEND_PID 2>/dev/null
    [ -n "$FRONTEND_PID" ] && kill $FRONTEND_PID 2>/dev/null
    [ -n "$OLLAMA_PID" ] && kill $OLLAMA_PID 2>/dev/null
    exit
}

trap cleanup INT

# 1. Start Ollama if not running
if ! curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "Starting Ollama server..."
    ./ollama serve &
    OLLAMA_PID=$!
    # Wait for Ollama to be ready
    echo "Waiting for Ollama to initialize..."
    until curl -s http://localhost:11434/api/tags > /dev/null; do
        sleep 2
    done
else
    echo "Ollama is already running."
fi

# 2. Ensure model is pulled
MODEL="tinyllama"
echo "Ensuring AI model '$MODEL' is available..."
./ollama pull $MODEL

# 3. Start FastAPI backend
echo "Starting FastAPI backend on http://127.0.0.1:8000 ..."
# We run from root to avoid ModuleNotFoundError for 'backend'
source backend/venv/bin/activate
uvicorn backend.main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

# 4. Start React frontend
echo "Starting React frontend on http://localhost:3000 ..."
npm start &
FRONTEND_PID=$!

echo ""
echo "===================================================="
echo "🚀 Full stack running: Ollama ($MODEL) + Backend + Frontend"
echo "Frontend: http://localhost:3000"
echo "Backend:  http://127.0.0.1:8000"
echo "Press Ctrl+C to stop all services."
echo "===================================================="

wait
