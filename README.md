# VivoQuest Healthcare at Home - Production Web Platform

Enterprise-grade healthcare-at-home platform connecting patients, families, clinicians, and certified caregivers with intelligent dispatch, real-time tracking, offline-first PWA resilience, and end-to-end clinical workflow automation.

---

## Project Structure Overview

```
VivoQuest Web App/
├── icons/                  # Centralized, categorized SVG icons, banners, brand assets
│   ├── banners/            # Hero banners and promotional imagery
│   ├── brand-logos/        # Official logos, verification badges, favicons
│   ├── home-diagnostics/   # Diagnostic equipment and test icons
│   ├── home-visit/         # Home medical visit and clinical procedure icons
│   ├── landing-page/       # Main landing page visual assets & transparent cutout
│   ├── long-term-care/     # ICU, elderly care, and nurse-at-home icons
│   └── rehab-services/     # Cardiac, neuro, oncology, ortho rehabilitation icons
│
├── frontend/               # Dynamic React/Vite PWA Frontend with Offline-first sync
│   ├── public/             # Static public assets and legacy single-file HTML app
│   └── src/
│       ├── assets/         # Imported assets & optimized SVG symbols
│       ├── components/     # Atomic reusable UI components (Hero, ServiceCard, Auth)
│       ├── context/        # Global React Contexts (Auth, Booking, OfflineSync)
│       ├── pages/          # Modular views (Landing, HomeVisit, Diagnostics, LTC, Rehab)
│       ├── services/       # Axios API client and WebSocket connections
│       ├── styles/         # Healthcare design system, CSS variables & typography
│       └── utils/          # Data formatters, validation schemas, offline storage
│
├── backend/                # High-throughput Node.js / Express REST & WebSocket API
│   ├── src/
│   │   ├── config/         # Environment variables, database pools, JWT & logger
│   │   ├── controllers/    # Request orchestrators (Auth, Booking, Caregiver, Services)
│   │   ├── middlewares/    # Auth, RBAC, input sanitization, rate limiting
│   │   ├── models/         # Data access objects & schemas (PostgreSQL / MongoDB)
│   │   ├── routes/         # Express endpoint definitions
│   │   ├── services/       # Business logic (Payment, Email/SMS, Dispatch)
│   │   └── utils/          # Standardized API response formatters & error classes
│   └── tests/              # Unit & integration test suites
│
├── database/               # Relational & NoSQL database schemas, seeds, and migrations
│   ├── schemas/            # Production DDL schemas (Caregivers, Bookings, Vitals)
│   ├── migrations/         # Version-controlled schema migrations
│   ├── seeds/              # Initial catalog data (Services, Tiers, Pricing)
│   └── docs/               # Entity-Relationship Diagrams (ERD) & Data Dictionaries
│
├── aiml/                   # Intelligent Caregiver Dispatch & Clinical Triage Engine
│   ├── caregiver-matching/ # Distance + skill + affinity matching algorithms
│   ├── symptom-triage/     # Decision trees for urgent escalation vs home procedure
│   ├── scheduling-opt/     # Traveling clinician route optimization
│   └── api/                # FastAPI microservice serving real-time model inference
│
└── docs/                   # Architectural blueprints, API specs, and runbooks
```

---

## Key Modules & Technologies

- **Frontend**: React 18 / Vite 5, TailwindCSS / Custom Healthcare Design System, ServiceWorker PWA, Axios, Lucide/Custom SVGs.
- **Backend**: Node.js 20+, Express.js, JWT Authentication, WebSockets (real-time visit updates), Winston Logger, Helmet.
- **Database**: PostgreSQL 16 (Relational clinical & booking data) + Redis 7 (Caching, session store, real-time caregiver geo-tracking).
- **AI/ML Engine**: Python 3.11, FastAPI, Scikit-learn, NetworkX, Haversine routing algorithms.

---

## Quick Start Guide

### 1. Run Everything via Docker Compose
```bash
docker-compose up --build
```

### 2. Manual Development Setup
```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend
cd ../backend
npm install
npm run dev

# AI/ML Microservice
cd ../aiml
pip install -r requirements.txt
uvicorn api.main:app --reload --port 8000
```
