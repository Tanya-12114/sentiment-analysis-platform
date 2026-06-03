# ABSA Dashboard — Aspect-Based Sentiment Analysis for E-Commerce

Full-stack NLP application that extracts product aspects from reviews and classifies sentiment per aspect.

## Architecture

```
absa-project/
├── backend/                  # FastAPI + HuggingFace + spaCy
│   └── app/
│       ├── main.py           # FastAPI app entry point
│       ├── api/              # Route handlers
│       ├── core/             # Config, settings, security
│       ├── db/               # SQLAlchemy models + session
│       ├── models/           # Pydantic schemas
│       ├── pipelines/        # NLP pipeline (spaCy + transformers)
│       └── services/         # Business logic layer
├── frontend/                 # Next.js + Tailwind + Recharts
│   ├── components/
│   │   ├── charts/           # Recharts chart components
│   │   ├── dashboard/        # Dashboard layout + cards
│   │   ├── pipeline/         # Pipeline visualizer
│   │   ├── reviews/          # Review list + filters
│   │   └── analyze/          # Live ABSA text analyzer
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # API client, utils
│   ├── pages/                # Next.js pages + API routes
│   ├── styles/               # Tailwind config + globals
│   └── types/                # TypeScript interfaces
└── database/
    ├── migrations/           # Alembic migrations
    └── seeds/                # Seed data scripts
```

## Tech Stack

| Layer       | Technology                                      |
|-------------|------------------------------------------------|
| API         | FastAPI, Uvicorn, Python 3.11                   |
| NLP         | HuggingFace Transformers, spaCy en_core_web_trf |
| Data        | Pandas, NumPy, SQLAlchemy                       |
| Database    | PostgreSQL + Redis (caching)                    |
| Frontend    | Next.js 14, React 18, TypeScript, Tailwind CSS  |
| Charts      | Recharts, Chart.js                              |
| Auth        | JWT via python-jose                             |

## Quick Start

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python -m spacy download en_core_web_trf
alembic upgrade head
python -m app.db.seed
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

### Database (Docker)
```bash
docker-compose up -d postgres redis
```
