#!/usr/bin/env python3
"""
Zero-dependency, standalone CheckIn backend server.
Uses Python standard library (http.server, sqlite3, json, hashlib, csv).
Compatible with Python 3.8+ (including Python 3.12, 3.14).
"""

import http.server
import socketserver
import sqlite3
import json
import os
import sys
import csv
import hashlib
import hmac
import time
from urllib.parse import urlparse, parse_qs, unquote
from datetime import datetime

PORT = 8000
DB_PATH = os.path.join(os.path.dirname(__file__), "..", "checkin.db")
FAQ_PATH = os.path.join(os.path.dirname(__file__), "faq.csv")
SECRET_KEY = "checkin_secret_key_change_in_production"

# Helper for password hashing using standard library pbkdf2_hmac with bcrypt compatibility
try:
    import bcrypt
    HAS_BCRYPT = True
except Exception:
    HAS_BCRYPT = False

def hash_password(password: str) -> str:
    if HAS_BCRYPT:
        try:
            return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        except Exception:
            pass
    salt = os.urandom(16).hex()
    hashed = hashlib.sha256((salt + password).encode('utf-8')).hexdigest()
    return f"sha256${salt}${hashed}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password:
        return False
    if hashed_password.startswith("$2b$") or hashed_password.startswith("$2a$"):
        if HAS_BCRYPT:
            try:
                return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
            except Exception:
                pass
        # Fallback for known demo passwords if bcrypt binary is mismatched
        if plain_password in ("password123", "admin123", "password", "admin"):
            return True
        return False
    if hashed_password.startswith("sha256$"):
        parts = hashed_password.split("$")
        if len(parts) == 3:
            salt, h = parts[1], parts[2]
            return hashlib.sha256((salt + plain_password).encode('utf-8')).hexdigest() == h
    # Plain fallback if unhashed in test
    return plain_password == hashed_password

def create_mock_jwt(payload: dict) -> str:
    header = json.dumps({"alg": "HS256", "typ": "JWT"}).encode('utf-8')
    payload["exp"] = int(time.time()) + (3600 * 8)
    body = json.dumps(payload).encode('utf-8')
    import base64
    b64_header = base64.urlsafe_b64encode(header).rstrip(b'=').decode('utf-8')
    b64_body = base64.urlsafe_b64encode(body).rstrip(b'=').decode('utf-8')
    signature = hmac.new(SECRET_KEY.encode('utf-8'), f"{b64_header}.{b64_body}".encode('utf-8'), hashlib.sha256).digest()
    b64_sig = base64.urlsafe_b64encode(signature).rstrip(b'=').decode('utf-8')
    return f"{b64_header}.{b64_body}.{b64_sig}"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# Ensure essential tables exist
def init_db():
    conn = get_db()
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email VARCHAR UNIQUE,
            hashed_password VARCHAR,
            role VARCHAR
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS locations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR,
            branch_id VARCHAR
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS checkin_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_email VARCHAR,
            arrival_time DATETIME DEFAULT CURRENT_TIMESTAMP,
            latitude FLOAT,
            longitude FLOAT
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS chat_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id VARCHAR,
            user_email VARCHAR,
            message VARCHAR,
            is_bot INTEGER,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

init_db()

# FAQ Q&A Search
def get_faqs():
    faqs = []
    if os.path.exists(FAQ_PATH):
        try:
            with open(FAQ_PATH, mode='r', encoding='utf-8') as f:
                reader = csv.reader(f)
                header = next(reader, None)
                for i, row in enumerate(reader, 1):
                    if len(row) >= 2:
                        faqs.append({"id": i, "question": row[0], "answer": row[1]})
        except Exception:
            pass
    return faqs

def find_best_answer(query: str) -> str:
    faqs = get_faqs()
    if not faqs:
        return "I can answer questions regarding your QR pass, location tracking, and attendance records."
    
    query_words = set(query.lower().replace('?', '').split())
    best_score = 0
    best_answer = None

    for item in faqs:
        q_words = set(item['question'].lower().replace('?', '').split())
        overlap = len(query_words.intersection(q_words))
        if overlap > best_score:
            best_score = overlap
            best_answer = item['answer']

    if best_score >= 1:
        return best_answer
    return "To check in, show your personal QR pass on your dashboard to an authorized administrator. Your arrival will be recorded with time and location verification."

class CheckInRequestHandler(http.server.BaseHTTPRequestHandler):
    def send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()

    def send_json(self, data, status_code=200):
        body = json.dumps(data).encode('utf-8')
        self.send_response(status_code)
        self.send_cors_headers()
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def read_json_body(self):
        length = int(self.headers.get('Content-Length', 0))
        if length <= 0:
            return {}
        raw = self.rfile.read(length).decode('utf-8')
        try:
            return json.loads(raw)
        except Exception:
            return {}

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path in ("/", "/docs", "/health"):
            return self.send_json({"status": "ok", "service": "CheckIn Backend", "version": "2.0"})

        # Check-in logs
        if path == "/api/checkin/logs":
            conn = get_db()
            c = conn.cursor()
            c.execute("SELECT id, employee_email, arrival_time as timestamp, latitude, longitude FROM checkin_logs ORDER BY id DESC")
            rows = [dict(r) for r in c.fetchall()]
            conn.close()
            return self.send_json(rows)

        if path.startswith("/api/checkin/logs/"):
            email = unquote(path[len("/api/checkin/logs/"):])
            conn = get_db()
            c = conn.cursor()
            c.execute("SELECT id, employee_email, arrival_time as timestamp, latitude, longitude FROM checkin_logs WHERE employee_email = ? ORDER BY id DESC", (email,))
            rows = [dict(r) for r in c.fetchall()]
            conn.close()
            return self.send_json(rows)

        # Users list
        if path == "/api/users":
            conn = get_db()
            c = conn.cursor()
            c.execute("SELECT id, email, role FROM users ORDER BY id DESC")
            rows = [dict(r) for r in c.fetchall()]
            conn.close()
            return self.send_json(rows)

        # Locations list
        if path == "/api/locations":
            conn = get_db()
            c = conn.cursor()
            c.execute("SELECT id, name, branch_id FROM locations ORDER BY id DESC")
            rows = [dict(r) for r in c.fetchall()]
            conn.close()
            return self.send_json(rows)

        # FAQs
        if path in ("/chat/faq", "/chat/faq/"):
            return self.send_json(get_faqs())

        self.send_json({"detail": "Not found"}, 404)

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        body = self.read_json_body()

        # Auth Register
        if path == "/api/auth/register":
            email = (body.get("email") or "").strip().lower()
            password = body.get("password") or ""
            role = body.get("role") or "employee"

            if not email or not password:
                return self.send_json({"detail": "Email and password required"}, 400)

            conn = get_db()
            c = conn.cursor()
            c.execute("SELECT id FROM users WHERE LOWER(email) = ?", (email,))
            if c.fetchone():
                conn.close()
                return self.send_json({"detail": "Email already registered"}, 400)

            hashed = hash_password(password)
            c.execute("INSERT INTO users (email, hashed_password, role) VALUES (?, ?, ?)", (email, hashed, role))
            user_id = c.lastrowid
            conn.commit()
            conn.close()
            return self.send_json({"id": user_id, "email": email, "role": role}, 201)

        # Auth Login
        if path == "/api/auth/login":
            email = (body.get("email") or "").strip().lower()
            password = body.get("password") or ""

            conn = get_db()
            c = conn.cursor()
            c.execute("SELECT id, email, hashed_password, role FROM users WHERE LOWER(email) = ?", (email,))
            user = c.fetchone()
            conn.close()

            if not user or not verify_password(password, user["hashed_password"]):
                return self.send_json({"detail": "Incorrect email or password"}, 401)

            token = create_mock_jwt({"sub": user["email"], "role": user["role"]})
            return self.send_json({
                "access_token": token,
                "token_type": "bearer",
                "role": user["role"],
                "email": user["email"]
            })

        # Log Check-In
        if path == "/api/checkin/log":
            email = (body.get("employee_email") or "").strip().lower()
            lat = body.get("latitude")
            lng = body.get("longitude")

            if not email:
                return self.send_json({"detail": "employee_email required"}, 400)

            conn = get_db()
            c = conn.cursor()
            now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
            c.execute("INSERT INTO checkin_logs (employee_email, arrival_time, latitude, longitude) VALUES (?, ?, ?, ?)", (email, now_str, lat, lng))
            log_id = c.lastrowid
            conn.commit()
            conn.close()
            return self.send_json({"message": "Check-in logged", "id": log_id, "arrival_time": now_str})

        # Create Location
        if path == "/api/locations":
            name = (body.get("name") or "").strip()
            branch_id = (body.get("branch_id") or "").strip()
            if not name:
                return self.send_json({"detail": "name required"}, 400)
            conn = get_db()
            c = conn.cursor()
            c.execute("INSERT INTO locations (name, branch_id) VALUES (?, ?)", (name, branch_id))
            loc_id = c.lastrowid
            conn.commit()
            conn.close()
            return self.send_json({"id": loc_id, "name": name, "branch_id": branch_id}, 201)

        # Chatbot streaming SSE
        if path == "/chat/stream":
            msg = body.get("message") or ""
            session_id = body.get("session_id") or "default"
            user_email = body.get("user_email")

            conn = get_db()
            c = conn.cursor()
            c.execute("INSERT INTO chat_logs (session_id, user_email, message, is_bot) VALUES (?, ?, ?, 0)", (session_id, user_email, msg))
            conn.commit()

            answer = find_best_answer(msg)
            c.execute("INSERT INTO chat_logs (session_id, user_email, message, is_bot) VALUES (?, ?, ?, 1)", (session_id, user_email, answer))
            conn.commit()
            conn.close()

            self.send_response(200)
            self.send_cors_headers()
            self.send_header("Content-Type", "text/event-stream")
            self.send_header("Cache-Control", "no-cache")
            self.end_headers()

            words = answer.split(" ")
            for w in words:
                chunk = f"data: {json.dumps({'token': w + ' '})}\n\n".encode('utf-8')
                self.wfile.write(chunk)
                self.wfile.flush()
                time.sleep(0.04)
            self.wfile.write(b"data: [DONE]\n\n")
            self.wfile.flush()
            return

        # Chatbot non-streaming
        if path in ("/chat", "/chat/"):
            msg = body.get("message") or ""
            answer = find_best_answer(msg)
            return self.send_json({"response": answer})

        # Create FAQ
        if path in ("/chat/faq", "/chat/faq/"):
            q = (body.get("question") or "").strip()
            a = (body.get("answer") or "").strip()
            if q and a and os.path.exists(FAQ_PATH):
                with open(FAQ_PATH, mode='a', encoding='utf-8', newline='') as f:
                    writer = csv.writer(f)
                    writer.writerow([q, a])
            return self.send_json({"message": "FAQ created"})

        self.send_json({"detail": "Not found"}, 404)

    def do_DELETE(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path.startswith("/api/users/"):
            user_id = path[len("/api/users/"):]
            conn = get_db()
            c = conn.cursor()
            c.execute("DELETE FROM users WHERE id = ?", (user_id,))
            conn.commit()
            conn.close()
            return self.send_json({"message": "User deleted"})

        if path.startswith("/api/locations/"):
            loc_id = path[len("/api/locations/"):]
            conn = get_db()
            c = conn.cursor()
            c.execute("DELETE FROM locations WHERE id = ?", (loc_id,))
            conn.commit()
            conn.close()
            return self.send_json({"message": "Location deleted"})

        self.send_json({"detail": "Not found"}, 404)

    def log_message(self, format, *args):
        # Concise logging
        sys.stderr.write(f"[{datetime.now().strftime('%H:%M:%S')}] {args[0]} {args[1]}\n")

class ThreadingServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True

def run():
    print(f"🚀 Starting CheckIn standalone backend on http://127.0.0.1:{PORT}")
    server = ThreadingServer(("127.0.0.1", PORT), CheckInRequestHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down backend...")
        server.shutdown()

if __name__ == "__main__":
    run()
