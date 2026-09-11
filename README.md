# 🤖 JobMatch AI — AI-Powered Recruitment & Applicant Tracking Platform

[![CI/CD Tests](https://github.com/PushpendarSingh23/JobMatch-AI/actions/workflows/test.yml/badge.svg)](https://github.com/PushpendarSingh23/JobMatch-AI/actions/workflows/test.yml)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node Version](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-10.6.1-orange.svg)](https://pnpm.io/)

**JobMatch AI** is an enterprise-grade, full-stack recruitment platform that seamlessly integrates applicant tracking (ATS), AI-powered resume analysis, and automated candidate-to-job matching into a modern hiring workflow.

[Repository](https://github.com/PushpendarSingh23/JobMatch-AI) • [Live Demo Placeholder](https://jobmatch-ai.vercel.app) • [API Documentation](#-api-overview)

---

## 🌟 Overview & Problem Solved

Traditional recruitment processes suffer from manual resume screening bottlenecks, inconsistent candidate evaluations, and fragmented tracking systems. **JobMatch AI** solves this by leveraging Google Gemini models to asynchronously parse candidate resumes, extract structured skills, experience, and certifications, and evaluate candidate fit against job descriptions with a deterministic **0–100 match score** accompanied by AI qualitative summaries.

---

## ✨ Features

### 🤖 AI Resume-to-Job Matching
- **Automated Resume Parsing**: Extracts skills, technologies, certifications, total experience, and seniority level from PDF resumes.
- **Job Requirement Alignment**: Normalizes job requirements and calculates a weighted score across:
  - **Skills Match (55 pts)**: Explicit & implied technical skill overlap.
  - **Experience Match (25 pts)**: Required vs. actual candidate experience.
  - **Seniority Level (15 pts)**: Candidate level (Intern, Entry, Junior, Mid, Senior, Lead) alignment.
  - **Certifications (5 pts)**: Professional credential validation.
- **AI Recruiter Summaries**: Generates executive candidate summaries, candidate strengths, skill gaps, and hiring recommendations.
- **Document Classification**: Detects and rejects invalid non-resume PDFs (e.g. lab sheets, course materials, invoices).

### 👥 Applicant Tracking & Recruitment Workflow
- **Role-Based Access Control (RBAC)**: Supports `super_admin`, `hiring_manager`, and `interviewer` roles.
- **Job Management**: Create, publish, update, and manage job openings and custom pipeline stages.
- **Candidate Pipeline**: Visual stage transitions, search, filtering, and pagination.
- **Interview Scheduling & Feedback**: Slot booking, email invites, and structured interviewer feedback.
- **Offer Management**: Draft, send, track, and manage job offer letters.

### ⚡ Real-Time & Background Infrastructure
- **Socket.IO Real-Time Chat & Activity**: Live recruitment updates and hiring team communication.
- **BullMQ + Redis Task Queue**: Offloads AI processing and email dispatching asynchronously.
- **Transactional Emails**: Automated email notifications via Resend for invitations and updates.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Next.js 16 (App Router & Turbopack), Tailwind CSS v4, TanStack Query v5, Shadcn UI |
| **Backend** | Node.js (>=22), Express.js, TypeScript 5, Drizzle ORM, Zod Validation |
| **Database** | PostgreSQL 17 (Relational DB & Migrations via `drizzle-kit`) |
| **Caching & Queues**| Redis 7, BullMQ, ioredis |
| **AI Integration** | Google Gemini API (`@google/genai` SDK - Gemini 2.5 Flash) |
| **Real-Time** | Socket.IO |
| **Auth & Security** | JWT / Asgardeo (WSO2) JWKS, Helmet, Rate Limiting, CORS |
| **Storage & Mail** | Cloudflare R2 / S3 Object Storage, Resend API |
| **Testing** | Vitest, Testing Library, Playwright (E2E) |
| **DevOps & Container**| Docker, Docker Compose, GitHub Actions CI/CD, pnpm Workspaces |

---

## 🏗️ Architecture & System Data Flow

```text
                                  +-----------------------+
                                  |    Next.js Frontend   |
                                  |  (React 19 / Vercel)  |
                                  +-----------+-----------+
                                              |
                                              | HTTPS / WebSockets
                                              v
                                  +-----------------------+
                                  | Express.js API Server |
                                  |   (Render / Railway)  |
                                  +----+-------------+----+
                                       |             |
                     +-----------------+             +-------------------+
                     |                                                   |
                     v                                                   v
           +-------------------+                               +-------------------+
           |    PostgreSQL     |                               |   Redis Cache &   |
           |  (Managed DB)     |                               |  BullMQ Queues    |
           +-------------------+                               +---------+---------+
                                                                         |
                                                                         v
                                                               +-------------------+
                                                               | BullMQ Worker     |
                                                               | (CV Analysis)     |
                                                               +---------+---------+
                                                                         |
                                                                         v
                                                               +-------------------+
                                                               | Google Gemini API |
                                                               |  (Resume Parser)  |
                                                               +-------------------+
```

---

## 🚀 Environment Variables

### Root / Backend Environment Variables (`backend/.env`)

```env
DATABASE_URL=postgresql://jobmatch:jobmatch@localhost:5432/jobmatch
REDIS_URL=redis://localhost:6379

PORT=8080
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8080

# Security & Auth
JWT_SECRET=your_jwt_secret_key_here_min_32_characters
ENCRYPTION_KEY=32_character_random_string_for_encryption
ASGARDEO_JWKS_URL=https://api.asgardeo.io/t/yourorg/oauth2/jwks
ASGARDEO_ISSUER=https://api.asgardeo.io/t/yourorg/oauth2/token

# AI Integration
GEMINI_API_KEY=your_google_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash

# Email & Storage
RESEND_API_KEY=re_your_resend_api_key
RESEND_FROM_EMAIL=onboarding@resend.dev

R2_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=jobmatch-resumes
R2_PUBLIC_URL=https://pub-<hash>.r2.dev
```

### Frontend Environment Variables (`frontend/.env.local`)

```env
JOBMATCH_API_URL=http://localhost:8080
NEXT_PUBLIC_API_URL=http://localhost:8080
```

---

## 💻 Local Development Setup

### Prerequisites
- Node.js >= 22.0.0
- pnpm >= 10.0.0 (`corepack enable`)
- PostgreSQL 16+ or Docker Compose

### Step 1: Clone Repository & Install Dependencies
```bash
git clone https://github.com/PushpendarSingh23/JobMatch-AI.git
cd JobMatch-AI

# Install monorepo dependencies
pnpm install
```

### Step 2: Configure Environment Variables
Copy the example files and configure your local settings:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

### Step 3: Start Local Database & Run Migrations
```bash
# If using Docker:
docker compose up -d postgres redis

# Apply database migrations
pnpm db:migrate

# Seed realistic development/demo data
pnpm db:seed
```

#### 🌟 Realistic Demo Data Included in Seed
Running `pnpm db:seed` populates a realistic, fully interactive recruiting environment:
- **🏢 Company**: `TechFlow Innovations` (AI-first workflow & developer tooling company)
- **🗂️ Departments (7)**: Engineering, Product Management, Design & UX, Data & AI Research, Sales & BD, Marketing & Growth, People & Culture
- **👥 Users (5)**: Demo user (`demo@jobmatch-ai.dev`), Hiring Managers, and Interviewers
- **💼 Jobs (20)**: Comprehensive roles with salary ranges, required skills, locations (Remote, Hybrid, On-site), and hiring teams
- **👨‍💼 Candidates (35)**: Applications distributed across pipeline stages (Screening, Technical Assessment, Interviews, Offer Extended, Hired, Rejected)
- **🧠 AI CV Analysis**: Realistic 0–100 match scores, skill overlap breakdowns, missing skills, and hiring recommendations
- **📅 Interviews & Feedback**: Google Meet sessions, ratings, and interviewer notes
- **📄 Offers & Activities**: Extended and accepted job offers with salary breakdown and timeline audit logs

### Step 4: Start Backend & Frontend Dev Servers
```bash
# Run both frontend and backend concurrently
pnpm dev
```
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Public Careers Page**: [http://localhost:3000/careers](http://localhost:3000/careers)
- **Backend API**: [http://localhost:8080](http://localhost:8080)
- **Swagger API Docs**: [http://localhost:8080/api-docs](http://localhost:8080/api-docs)
- **Health Check**: [http://localhost:8080/health](http://localhost:8080/health)

---

## 🧪 Testing & Quality Assurance

```bash
# Run unit & integration tests across monorepo
pnpm test

# Build production artifacts
pnpm build

# Lint codebase
pnpm lint
```

---

## 🌐 Production Deployment Guide

### 1. Frontend → Vercel
1. Import the `PushpendarSingh23/JobMatch-AI` repository into Vercel.
2. Set Root Directory to `frontend`.
3. Set Build Command: `pnpm build`
4. Configure Environment Variables:
   - `NEXT_PUBLIC_API_URL`: Your deployed backend URL (e.g. `https://jobmatch-backend.onrender.com`).
   - `JOBMATCH_API_URL`: Your deployed backend URL.

### 2. Backend → Render or Railway
1. Create a new **Web Service** on Render or Railway connecting `PushpendarSingh23/JobMatch-AI`.
2. Set Root Directory to `backend` or use the root Dockerfile (`backend/Dockerfile`).
3. Build Command: `pnpm --filter ./backend build`
4. Start Command: `node dist/src/server.js` (or run worker `node dist/src/worker.js`).
5. Configure Environment Variables (`DATABASE_URL`, `REDIS_URL`, `GEMINI_API_KEY`, `FRONTEND_URL`, etc.).

### 3. Managed PostgreSQL & Redis
- **PostgreSQL**: Neon, Supabase, AWS RDS, or Render Managed PostgreSQL.
- **Redis**: Upstash Redis, AWS ElastiCache, or Render Redis.

---

## 📖 API Overview

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/health` | Server health check (DB & Redis status) | Public |
| `POST` | `/public/jobs` | Browse public job listings | Public |
| `POST` | `/api/candidates/upload` | Upload resume & trigger AI matching | Candidate / Recruiter |
| `GET` | `/api/jobs` | List recruiter jobs | Authenticated |
| `POST` | `/api/jobs` | Create new job opening | Hiring Manager / Super Admin |
| `GET` | `/api/candidates` | Filter candidate applications | Authenticated |
| `GET` | `/api/chat` | Socket.IO real-time chat endpoints | Authenticated |

---

## 🖼️ Screenshots Placeholder

| Recruiter Dashboard | AI Match Score |
|---|---|
| *(Screenshot Placeholder: Recruiter Pipeline)* | *(Screenshot Placeholder: AI Resume Match & Strengths)* |

---

## 🔮 Future Improvements

- [ ] Automated video interview AI evaluation & transcript sentiment analysis.
- [ ] Integration with LinkedIn Jobs & Greenhouse / Lever ATS import.
- [ ] Multilingual resume parsing & job description translation.
- [ ] Advanced analytics dashboard for time-to-hire metrics.

---

## 📝 License

Distributed under the [ISC License](LICENSE).
