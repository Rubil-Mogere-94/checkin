#!/bin/bash
# Starts both the FastAPI backend and the React frontend in parallel

echo "Starting FastAPI backend on http://127.0.0.1:8000 ..."
cd "$(dirname "$0")/backend"
source venv/bin/activate
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!
cd ..

echo "Starting React frontend on http://localhost:3000 ..."
npm start &
FRONTEND_PID=$!

echo ""
echo "Both servers running. Press Ctrl+C to stop."
trap "kill $BACKEND_PID $FRONTEND_PID" INT
wait
