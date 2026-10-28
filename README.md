# Check-In with QR Code Application

## Author
- [@Rubil-Mogere-94](https://github.com/Rubil-Mogere-94)

---

## Description
A modern, full-stack employee check-in and attendance management system featuring the **CheckIn v2 Research-led UI Redesign** backed by a FastAPI Python backend and SQLite database. 

Employees access a personal workspace with dynamic QR passes embedding their **email, GPS coordinates, and real-time timestamps**. Administrators operate a comprehensive operations console featuring live arrival trends, branch performance metrics, attendance audits, employee management, and an interactive AI assistant (**ChatterMax**).

---

## Architecture

```
checkin/
├── src/                         # React frontend (React 18)
│   ├── Components/
│   │   ├── ChatterMax.js        # Floating RAG AI assistant with SSE streaming
│   │   └── Icons.js             # SVG icon library for CheckIn v2 design system
│   ├── Pages/
│   │   ├── Layout.js            # Clean responsive layout outlet
│   │   ├── LoginAdmin.js        # Admin authentication & registration
│   │   ├── LoginEmployee.js     # Employee authentication & registration
│   │   ├── AdminAccount.js      # Operations console (Overview, Activity, People, Branches, Roles, Settings)
│   │   ├── EmployeeAccount.js   # Employee workspace (Live QR Pass, History, Profile, Support)
│   │   └── Context.js           # Global authentication context & state
│   ├── api.js                   # Centralized API client (Auth, CheckIn, Users, Locations, FAQs)
│   └── index.css                # CheckIn v2 design tokens (Forest & Lime palette, responsive breakpoints)
│
├── backend/                     # FastAPI Python backend
│   ├── main.py                  # App entrypoint + CORS middleware
│   ├── database.py              # SQLAlchemy engine & session manager
│   ├── models.py                # Database models (User, Location, CheckInLog, ChatLog, FAQ)
│   ├── schemas.py               # Pydantic validation schemas
│   ├── faq.csv                  # Knowledge base for ChatterMax RAG
│   └── routers/
│       ├── auth.py              # POST /api/auth/register, /api/auth/login (JWT)
│       ├── checkin.py           # POST /api/checkin/log, GET /api/checkin/logs
│       └── chat.py              # POST /chat/stream (SSE streaming) & CRUD /chat/faq
│
└── CheckIn_Designs_V2/          # Standalone prototypes & UX research documentation
    ├── admin-dashboard.html     # Operations console design prototype
    ├── employee-portal.html     # Employee workspace design prototype
    └── README.md                # Design rationale & permission matrix proposal
```

---

## Key Features

### 🏢 Employee Workspace (`/employee/dashboard`)
- **Dynamic QR Check-In Pass**: Live SVG QR code (`qrcode.react`) embedding employee credentials, coordinates, and a dynamic 5-second refreshed timestamp.
- **Pass Actions**: Download QR pass as `.svg` or copy direct check-in URL.
- **Geolocation Verification**: Real-time browser GPS acquisition with location precision tags.
- **Attendance History**: Searchable and filterable history table with location coordinates, record status, and one-click **CSV export**.
- **Personal Profile**: Account verification details, assigned branch info, and privacy-by-design guarantees.
- **Help & Support**: Interactive usage guides and FAQ accordion.

### 🛡️ Admin Operations Console (`/admin/dashboard`)
- **Executive Overview**:
  - Live KPI cards: Total arrivals today, registered workforce count, active locations, and flagged review records.
  * **Arrival Activity Chart**: Hourly volume distribution with peak-hour highlight and range filtering (*Today*, *7 Days*, *30 Days*).
  * **Branch Performance**: Worksite arrival breakdown with comparative progress bars.
  * **Flagged Logs Review Strip**: Immediate detection and review of check-ins lacking GPS coordinates.
  * **Latest Arrivals Table**: Real-time stream with fast inspection modals.
- **Check-In Activity**: Full attendance audit log with multi-criteria search (name, email, date) and branch/status filters with **CSV export**.
- **Employee Directory**: Manage workforce accounts with role indicators, branch assignments, deletion capability, and "Add Employee" modal.
- **Branch Management**: Register and manage physical branches with assigned staff KPIs, coordinates, and deletion controls.
- **Access & Roles (RBAC)**: Comprehensive permission matrix outlining capabilities across Super Admin, Administrator, Branch Manager, and Employee tiers.
- **Configuration & FAQ Editor**: Infrastructure readiness checklist and interactive CRUD manager for ChatterMax's knowledge base.
- **QR Scanner Modal**: Instant arrival logging via camera, URL decoding, or manual input.

### 🤖 ChatterMax AI Assistant
- Local-first RAG assistant powered by TF-IDF vector similarity and LLM integration.
- Real-time token streaming via Server-Sent Events (`/chat/stream`).
- Pre-built quick questions and persistent chat history in SQLite (`ChatLog`).
- Knowledge base manageable directly from the Admin Configuration panel.

---

## Design System (CheckIn v2)

The application adopts the research-led v2 design system:
- **Palette**: Forest green (`#14251f`), Vibrant Lime (`#d8ef72`), Deep Lime (`#b9d746`), Crisp Paper (`#ffffff`), Canvas (`#f4f6f1`).
- **Typography**: Inter / System UI with high-contrast hierarchical weights.
- **Responsive Design**: Fluid breakpoints tailored for desktop (1660px+), laptop (1250px), tablet (980px), and mobile (620px).

---

## Technologies

| Layer | Stack |
|---|---|
| **Frontend** | React 18, React Router v6, Material UI v5 tokens, qrcode.react |
| **Styling** | Custom CSS3 with CSS variables & responsive layout grids |
| **Backend** | FastAPI, SQLAlchemy ORM, SQLite, Pydantic v2 |
| **AI / NLP** | Scikit-learn (TF-IDF vectorizer + Cosine Similarity), Ollama / TinyLlama |
| **Authentication** | JWT (PyJWT), bcrypt password hashing (Passlib) |
| **Hardware APIs** | W3C Browser Geolocation API |

---

## Setup & Installation

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt # or install fastapi "uvicorn[standard]" sqlalchemy "passlib[bcrypt]" pydantic pyjwt python-multipart pandas scikit-learn
```

### 2. Frontend Setup
```bash
# In the root repository directory
npm install --legacy-peer-deps
```

---

## Running the Application

### Single Command (Full Stack)
Start the backend server and React frontend simultaneously using the launch script:
```bash
chmod +x start.sh
./start.sh
```

### Manual Launch

**Backend:**
```bash
source backend/venv/bin/activate
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

**Frontend:**
```bash
npm start
```

Access the frontend at: `http://localhost:3000`  
Access the backend API docs at: `http://127.0.0.1:8000/docs`

---

## REST API Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user (`email`, `password`, `role`) | No |
| `POST` | `/api/auth/login` | Authenticate user & return JWT access token | No |
| `POST` | `/api/checkin/log` | Register employee arrival (`employee_email`, `latitude`, `longitude`) | Yes (Bearer JWT) |
| `GET` | `/api/checkin/logs` | Retrieve complete check-in history | Yes (Bearer JWT) |
| `GET` | `/api/checkin/logs/{email}` | Retrieve personal logs for a specific employee | Yes (Bearer JWT) |
| `GET` | `/api/users` | List all registered users | Yes (Bearer JWT) |
| `DELETE`| `/api/users/{id}` | Delete a user account | Yes (Bearer JWT) |
| `GET` | `/api/locations` | List all registered office branches | Yes (Bearer JWT) |
| `POST` | `/api/locations` | Register a new office location (`name`, `branch_id`) | Yes (Bearer JWT) |
| `DELETE`| `/api/locations/{id}` | Remove a branch location | Yes (Bearer JWT) |
| `POST` | `/chat/stream` | Server-Sent Events stream from ChatterMax AI | No |
| `GET` | `/chat/faq` | Fetch all FAQ knowledge items | Yes (Bearer JWT) |
| `POST` | `/chat/faq` | Create a new FAQ entry (`question`, `answer`) | Yes (Bearer JWT) |
| `PUT` | `/chat/faq/{id}` | Update an existing FAQ entry | Yes (Bearer JWT) |
| `DELETE`| `/chat/faq/{id}` | Delete an FAQ entry | Yes (Bearer JWT) |

---

## License
Distributed under the MIT License. See `LICENSE.md` for details.

---

## Deployment

### Frontend — Vercel

The React frontend is configured for Vercel via `vercel.json`. Deploy by connecting this repository to Vercel:

1. Push this repo to GitHub
2. Import the project in Vercel (framework preset: Create React App)
3. Add the environment variables below in Vercel Project Settings → Environment Variables
4. Deploy

Required frontend environment variables:

| Variable | Description | Example |
|---|---|---|
| `REACT_APP_API_URL` | Backend API base URL (Render deployment) | `https://checkin-backend.onrender.com` |
| `REACT_APP_QR_BASE_URL` | Base URL for QR check-in links | `https://checkin.vercel.app` |

The app includes an embedded local-storage fallback, so it works even when the backend is unreachable (e.g. static-only Vercel deployment without a backend).

### Backend — Render

The FastAPI backend is configured for Render via `render.yaml`. Deploy by connecting this repository to Render:

1. Push this repo to GitHub
2. In Render, create a new "Web Service" from this repository
3. Render will auto-detect `render.yaml` and provision:
   - A free PostgreSQL database (`checkin-db`)
   - A Python web service running `uvicorn backend.main:app`
4. Add environment variables in Render Dashboard:

Required backend environment variables:

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | Database connection string | `sqlite:////var/tmp/checkin.db` |
| `SECRET_KEY` | JWT signing secret (auto-generated on Render) | auto-generated |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins | `https://checkin.vercel.app` |
| `PORT` | Port to bind | `8000` |

### Dual-Host Architecture

| Component | Platform | Entry |
|---|---|---|
| Frontend (React SPA) | Vercel | `vercel.json` |
| Backend (FastAPI) | Render | `render.yaml` |

CORS on the backend is driven by `ALLOWED_ORIGINS`, so the frontend URL can be changed without code changes.

---

