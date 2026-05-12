# Check-In with QR Code Application

## Author
- [@Rubil-Mogere-94](https://github.com/Rubil-Mogere-94)

---

## Description
A full-stack employee check-in system combining a modern React UI with a FastAPI Python backend and SQLite database. Employees generate personalized QR codes embedding their **email, GPS coordinates, and timestamp**. Administrators scan these codes to instantly log arrival times into the database, viewing a real-time dashboard of all check-in records.

---

## Architecture

```
checkin/
├── src/                    # React frontend (Create React App)
│   ├── Pages/
│   │   ├── Layout.js       # Sidebar + AppBar (React Router v6 layout)
│   │   ├── LoginAdmin.js   # Admin sign in / register
│   │   ├── LoginEmployee.js # Employee sign in / register
│   │   ├── AdminAccount.js # Admin dashboard + check-in log table
│   │   ├── EmployeeAccount.js # QR code generator + arrival history
│   │   └── Context.js      # Global React context (local state + setters)
│   └── api.js              # Centralized fetch functions → FastAPI
│
└── backend/                # FastAPI Python backend
    ├── main.py             # App entrypoint + CORS
    ├── database.py         # SQLAlchemy engine + session
    ├── models.py           # User, Location, CheckInLog tables
    ├── schemas.py          # Pydantic validation schemas
    └── routers/
        ├── auth.py         # POST /api/auth/register, /api/auth/login (JWT)
        ├── checkin.py      # POST /api/checkin/log, GET /api/checkin/logs
        └── chat.py         # POST /chat (AI Assistant via Ollama)
```

---

## Features

### Employee
- ✅ Secure sign in / register with bcrypt hashed passwords + JWT tokens
- ✅ Automatic GPS geolocation capture on login
- ✅ QR code embedding `{ email, latitude, longitude, timestamp }` as URL payload
- ✅ Personal arrival history table (fetched from backend)

### Administrator
- ✅ Secure admin sign in / register (role-separated from employees)
- ✅ Manage employees (add / delete)
- ✅ Manage office branches (add / delete)
- ✅ Assign employees to branches
- ✅ **Auto check-in logging** — visiting the QR URL automatically POSTs the arrival to the database
- ✅ Live check-in log table with employee email, arrival time, and GPS coordinates

### AI Assistant (ChatterMax)
- ✅ Local-first intelligent HR Assistant powered by **Ollama** and **LangChain**
- ✅ Persistent memory — conversation logs are stored in SQLite
- ✅ Floating chat widget on all screens with glassmorphism UI

---

## Technologies
| Layer | Stack |
|---|---|
| Frontend | React 18, Material UI v5, React Router v6 |
| Backend | FastAPI, SQLAlchemy, SQLite, Pydantic v2 |
| AI | **Ollama** (Llama 3), **LangChain** |
| Auth | JWT (PyJWT), bcrypt (passlib) |
| State | React Context + LocalStorage |
| QR Code | qrcode.react |
| Geolocation | Browser Geolocation API |

---

## Setup

### Prerequisites
- Python 3.10+
- Node.js 18+

### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install fastapi "uvicorn[standard]" sqlalchemy "passlib[bcrypt]" pydantic pyjwt python-multipart langchain langchain-community httpx
```

### Frontend
```bash
npm install --legacy-peer-deps
```




## Running

### Single Command (Recommended)
This script starts the **Ollama AI server**, pulls the required model, starts the **FastAPI backend**, and launches the **React frontend** all at once.

```bash
chmod +x start.sh
./start.sh
```
npm run dev
---

## AI Assistant (ChatterMax)
The AI assistant is powered by **Ollama** running the `tinyllama` model locally. 
- **Auto-startup:** Managed by `start.sh`.
- **Model:** Default is `tinyllama` for speed, but can be configured in `backend/routers/chat.py`.
- **Persistence:** Conversation logs are saved in the SQLite database (`checkin.db`).

---

## API Endpoints

1. **Employee logs in** → GPS location captured automatically
2. **QR code generated** encoding: `{ email, lat, lng, ts }` as a URL-safe JSON payload
3. **Admin scans QR** → browser opens `/Pages/AdminAccount/<payload>`
4. **On page load**, `AdminAccount.js` decodes the payload and **POSTs to `/api/checkin/log`** with email + coordinates
5. **Arrival time** is recorded server-side and displayed in the live dashboard table

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register user (email, password, role) |
| POST | `/api/auth/login` | Login → JWT token |
| POST | `/api/checkin/log` | Log employee check-in with coords |
| GET | `/api/checkin/logs` | Get all check-in logs |
| GET | `/api/checkin/logs/{email}` | Get check-ins for specific employee |
| POST | `/chat` | Send message to local AI HR Assistant |

