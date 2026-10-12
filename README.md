# 💎 FinWise AI — Personal Finance Advisor & Expense Analytics Platform

[![Python](https://img.shields.io/badge/Python-3.12-blue.svg?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.0-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

FinWise AI is a complete, production-grade personal finance management and expense analytics platform. It combines deterministic relational cash-flow calculations, time-series linear trend spending forecasting, hybrid machine learning categorization (TF-IDF + Naive Bayes), and an interactive natural-language financial QA advisor.

---

## 🌐 Public Deployment & Live Links

- **Public GitHub Repository**: [https://github.com/Anil-192005/finwise-ai](https://github.com/Anil-192005/finwise-ai)
- **Live Public Access Tunnel (HTTPS)**: [https://some-carrots-retire.loca.lt](https://some-carrots-retire.loca.lt)
  > *(If prompted with the Localtunnel friendly reminder, enter Endpoint IP: `122.172.83.23` and click "Click to Submit")*
- **Live Demo Credentials**:
  - Email: `demo@finwise.ai`
  - Password: `DemoPass123!`
  - Currency: `INR (₹)` (switchable anytime to `USD`, `EUR`, `GBP`)

### 🚀 1-Click Cloud Deployment Guides

#### Option A: Render (Full-Stack Blueprint)
The repository contains a battle-tested [`render.yaml`](render.yaml) blueprint configuring:
1. **Managed PostgreSQL Database** (persistent financial records).
2. **FastAPI Web Service** (Uvicorn production ASGI server).
3. **React + Vite Static Site** (with SPA rewrite and zero CORS issues).

**Steps to deploy**:
1. Go to [Render Blueprints](https://dashboard.render.com/blueprints/new).
2. Connect your GitHub account and select repository: `Anil-192005/finwise-ai`.
3. Render automatically reads `render.yaml`, provisions the database, sets `DATABASE_URL` and `SECRET_KEY`, and deploys both backend and frontend.

#### Option B: Vercel (Frontend) + Render/Railway (Backend)
1. **Backend**:
   - Push repository to Render or Railway.
   - Root directory: `backend`
   - Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Set environment variables: `DATABASE_URL` (PostgreSQL), `SECRET_KEY`, `CORS_ORIGINS=*`.
2. **Frontend on Vercel**:
   - Import `Anil-192005/finwise-ai` on [Vercel](https://vercel.com/new).
   - Set Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Environment Variable: `VITE_API_BASE_URL` = `https://<YOUR-BACKEND-SERVICE>.onrender.com`
   - Client-side routing is automatically handled via [`frontend/vercel.json`](frontend/vercel.json).

---

## 🚀 Key Features

- **📊 Comprehensive Financial Overview**: Real-time calculated KPIs (Total Income, Total Expenses, Net Cash Flow, Total Savings, Budget Utilization, and Savings Rate) for any selected statement period.
- **📈 Cash Flow & Category Analytics**: Interactive Recharts bar and donut charts depicting income vs expense trajectories (monthly and yearly views) and category distributions.
- **🏷️ Automated Hybrid Categorization**: High-precision merchant keyword matching with Scikit-learn TF-IDF Naive Bayes classification for arbitrary expense descriptions with live confidence scoring.
- **🎯 Dynamic Monthly Budgets**: Category envelopes with visual progress indicators and configurable three-tier warning alerts (`Within Budget`, `Nearing Limit` ≥ 75%, and `Budget Exceeded` ≥ 100%).
- **🏦 Savings Goals & Velocity Projection**: Dedicated milestone envelopes (Emergency Fund, Tech Hardware, Travel) with contribution history and pace estimation.
- **🔮 Time-Series Expense Forecasting**: Hybrid rolling-average and linear trend regression projecting upcoming monthly outflow with 80% confidence interval bands and budget risk classification.
- **💬 Deterministic AI Financial QA Advisor**: Ask natural language questions like *"How much did I spend on food this month?"* or *"Am I within budget?"* and receive deterministic, verifiable answers from actual database records.
- **🔁 Recurring Schedules**: Templates for rent, subscriptions, utility bills, and salary with one-click processing and next scheduled date advancement.
- **📄 Audit-Grade Reports & Formula-Protected CSV**: Monthly and yearly comparative statements with CWE-1236 spreadsheet injection escaping.
- **🔒 Enterprise Security**: Argon2 password hashing, JWT authentication, multi-currency support (`INR (₹)`, `USD ($)`, `EUR (€)`, `GBP (£)`), and strict multi-tenant user isolation.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Recharts, React Router v7, React Hook Form, Lucide React |
| **Backend** | Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2.0, Alembic, Scikit-learn, Pandas, NumPy, Argon2-CFFI |
| **Database** | SQLite (development / zero-config local run), PostgreSQL (production-ready) |
| **Testing** | Pytest, HTTPX, Vitest, React Testing Library, JSDOM |
| **DevOps** | Docker, Docker Compose, Nginx |

---

## ⚡ Quick Start (Local Development)

### 1. Prerequisites
- **Python**: 3.10+ (Python 3.12 recommended)
- **Node.js**: v18+ (Node.js 22/24 recommended)
- **npm**: 9+

---

### 2. Backend Setup

1. Open a terminal and navigate to `backend/`:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment (optional, but recommended):
   ```bash
   python -m venv venv
   # Windows PowerShell:
   .\venv\Scripts\Activate.ps1
   # macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI development server:
   ```bash
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   > **Note**: On initial startup, the database tables, default system categories, and a realistic demo account (`demo@finwise.ai`) will be seeded automatically.

- **API Base URL**: `http://localhost:8000/api/v1`
- **Interactive Swagger Documentation**: `http://localhost:8000/docs`
- **ReDoc Documentation**: `http://localhost:8000/redoc`

---

### 3. Frontend Setup

1. Open a second terminal and navigate to `frontend/`:
   ```bash
   cd frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

---

## 🔑 Pre-Loaded Demo Account Credentials

For instant demonstration and portfolio review, FinWise AI includes pre-populated data across three months:

| Field | Value |
|---|---|
| **Email** | `demo@finwise.ai` |
| **Password** | `DemoPass123!` |
| **Currency** | `INR (₹)` |

> Alternatively, you can click **"Launch Live Demo"** or **"Auto Fill"** directly on the Login page for one-click access.

---

## 🧪 Running Automated Tests

### Backend Test Suite (Pytest)
Tests cover registration, login, duplicate detection, user isolation, transaction validation, budget warning calculations, savings goal contributions, auto-categorization, and forecasting with insufficient history:
```bash
cd backend
python -m pytest tests/ -v
```

### Frontend Test Suite (Vitest + React Testing Library)
Tests verify landing page branding, navigation flows, and UI component behavior:
```bash
cd frontend
npm test
```

### Production Build Verification
Verify TypeScript types and Vite bundle creation:
```bash
cd frontend
npm run build
```

---

## 🐳 Docker Compose (Full-Stack Deployment)

To run the complete production stack (PostgreSQL + FastAPI + Nginx React Frontend):

```bash
docker-compose up --build
```

- Web Application: `http://localhost`
- Backend API: `http://localhost:8000`
- PostgreSQL: `localhost:5432`

---

## 📁 Repository Structure

```
.
├── backend/
│   ├── alembic/              # Database migration scripts
│   ├── app/
│   │   ├── analytics/        # Forecasting & rule-based insight engines
│   │   ├── api/v1/           # Versioned REST endpoints (auth, dashboard, tx, etc.)
│   │   ├── core/             # Configuration, Argon2 security, JWT tokens
│   │   ├── db/               # SQLAlchemy session, engine, initial seed scripts
│   │   ├── ml/               # TF-IDF Naive Bayes categorizer
│   │   ├── models/           # SQLAlchemy 2.0 ORM database models
│   │   ├── schemas/          # Pydantic v2 validation models
│   │   └── main.py           # FastAPI entrypoint and lifespan management
│   ├── tests/                # Automated pytest test suite
│   ├── requirements.txt      # Python dependencies
│   └── Dockerfile            # Production backend Docker image
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable UI cards, charts, modals, layout
│   │   ├── context/          # AuthContext (currency & JWT) & ToastContext
│   │   ├── pages/            # Dashboard, Transactions, Budgets, Savings, Insights, Forecast, Reports, Settings
│   │   ├── services/         # API client abstraction
│   │   ├── test/             # Vitest & RTL test suites
│   │   ├── types/            # TypeScript data contracts
│   │   └── App.tsx           # React router and route protections
│   ├── package.json          # Node dependencies and scripts
│   ├── vite.config.ts        # Vite configuration & proxy
│   └── Dockerfile            # Multi-stage production Nginx image
├── docs/
│   ├── architecture.md       # Full architectural design & Mermaid diagrams
│   ├── database-schema.md    # Normalized schema specifications & ER diagrams
│   └── api-documentation.md  # Detailed REST endpoint reference
├── docker-compose.yml        # Docker orchestrator
├── .env.example              # Environment variables template
├── .gitignore                # Git exclusions
└── README.md                 # Project portfolio guide
```

---

## 📜 Assumptions & Engineering Disclaimers

1. **Cash Flow Accounting vs. Bank Balance**: Net Cash Flow represents total income minus total expenses recorded in the period. It is distinguished from account balances.
2. **Deterministic Integrity**: AI features never fabricate financial totals. All metrics derive from deterministic SQL queries.
3. **Privacy**: Personal financial records are protected by strict user isolation (`current_user.id` foreign keys). Bank credentials are never collected.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
