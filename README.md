# JobMatch AI

**AI-powered recruitment and applicant tracking platform** for managing jobs, candidates, applications, interviews, and AI-assisted resume-to-job matching.

JobMatch AI combines a recruiter-facing hiring workflow with asynchronous AI resume analysis. Uploaded CVs are processed in a background worker, matched against job requirements, and returned with a match score, matched/missing skills, experience and level breakdowns, and an AI-generated candidate summary.

## Features

### AI Resume-to-Job Matching
- Upload candidate resumes as part of job applications.
- Parse CVs with Gemini AI.
- Extract skills, project technologies, experience, certifications, and job level.
- Parse job descriptions and required skills.
- Calculate a 0–100 candidate/job match score.
- Show matched and missing skills.
- Generate AI-assisted candidate summaries, strengths, gaps, hiring signals, and fit verdicts.
- Reject non-resume documents instead of treating them as candidate CVs.

### Recruitment & Applicant Tracking
- Create and manage job openings.
- Define job requirements and skills.
- Track candidates through configurable hiring pipeline stages.
- Search and filter candidates.
- Paginate candidate and job lists.
- Manage applications, offers, interviews, feedback, and hiring activities.

### Collaboration & Real-Time Updates
- Socket.IO-powered real-time candidate and recruitment updates.
- Hiring-team collaboration.
- Candidate activity history.
- Interview scheduling and notifications.
- Email notifications through Resend.

### Background Processing
AI CV analysis runs through **BullMQ + Redis** rather than blocking the main API request.

```text
Candidate applies
      |
      v
Resume uploaded to object storage
      |
      v
BullMQ job -> Redis
      |
      v
AI CV Analysis Worker
      |
      +--> Gemini resume parsing
      +--> Gemini job-description parsing
      +--> Skill matching
      +--> Experience / level / certification scoring
      +--> AI candidate summary
      |
      v
PostgreSQL
      |
      v
Recruiter dashboard + real-time updates
```

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Backend | Node.js, Express 5, TypeScript |
| Database | PostgreSQL |
| ORM | Drizzle ORM |
| AI | Google Gemini API |
| Background Jobs | BullMQ |
| Cache / Queue | Redis |
| Real-time | Socket.IO |
| Authentication | WSO2 Asgardeo + JWT/JWKS |
| File Storage | Cloudflare R2 / S3-compatible storage |
| Email | Resend |
| Testing | Vitest, Playwright |
| CI/CD | GitHub Actions |
| Package Manager | pnpm |
| Infrastructure | Docker Compose for PostgreSQL and Redis |

## AI Matching Logic

The matching pipeline evaluates four dimensions:

- **Skills — 55 points**
- **Experience — 25 points**
- **Job level — 15 points**
- **Certifications — 5 points**

The final score is normalized to **0–100** and stored with matched skills, missing skills, and the scoring breakdown.

This makes the platform useful for recruiter workflows where candidates need to be filtered and reviewed against the actual requirements of a job.

## Architecture

```text
                         JobMatch AI
                              |
             +----------------+----------------+
             |                                 |
             v                                 v
       Next.js Frontend                   Express API
             |                                 |
             |                         +-------+-------+
             |                         |               |
             |                         v               v
             |                    PostgreSQL        Redis
             |                    + Drizzle        + BullMQ
             |                                         |
             |                                         v
             |                                  AI CV Worker
             |                                         |
             |                                      Gemini
             |
             +-------------- Socket.IO <-------------+
```

## Project Structure

```text
JobMatch-AI/
├── frontend/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   └── tests/
│
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   ├── queues/
│   │   ├── db/
│   │   ├── shared/
│   │   └── middlewares/
│   ├── drizzle/
│   └── tests/
│
├── e2e/
├── docs-draft/
├── docker-compose.yml
└── .github/
    └── workflows/
```

## Quick Start

### Prerequisites

- Node.js 22+
- pnpm 11+
- Docker
- PostgreSQL / Redis through Docker Compose
- A configured WSO2 Asgardeo application
- Gemini API key
- S3-compatible object storage such as Cloudflare R2 for resume files

### Install

```bash
pnpm install
```

### Start PostgreSQL and Redis

```bash
docker compose up -d
```

### Configure environment

Create:

```text
backend/.env
frontend/.env
```

from their respective `.env.example` files.

Important backend variables include:

```text
DATABASE_URL
REDIS_URL
GEMINI_API_KEY
R2_ENDPOINT
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
R2_PUBLIC_URL
ASGARDEO_JWKS_URL
ASGARDEO_ISSUER
FRONTEND_URL
```

Frontend configuration includes:

```text
JOBMATCH_API_URL
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_ASGARDEO_BASE_URL
NEXT_PUBLIC_ASGARDEO_CLIENT_ID
```

### Run migrations

```bash
pnpm --filter ./backend exec drizzle-kit migrate
```

### Start the backend

```bash
pnpm --filter ./backend dev
```

### Start the AI worker

In another terminal:

```bash
pnpm --filter ./backend dev:worker
```

### Start the frontend

In another terminal:

```bash
pnpm --filter ./frontend dev
```

Frontend:

```text
http://localhost:3000
```

Backend:

```text
http://localhost:8080
```

Health check:

```text
http://localhost:8080/health
```

## Testing

Backend tests:

```bash
pnpm --filter ./backend test:run
```

Frontend tests:

```bash
pnpm --filter ./frontend test:run
```

End-to-end tests:

```bash
pnpm test:e2e
```

Build:

```bash
pnpm build
```

## CI/CD

GitHub Actions workflows are included for automated testing and backend deployment.

The test workflow provisions PostgreSQL and Redis, installs dependencies, runs backend linting and tests, applies database migrations, type-checks the project, and builds the backend.

The deployment workflow uses the test workflow as a gate before deploying the backend.

Deployment requires repository secrets and a configured target server; it is not automatic on a fresh clone.

## Security

- JWT/JWKS-based authentication
- Role-based authorization for hiring workflows
- Helmet security headers
- CORS restrictions
- API rate limiting
- Zod request validation
- Environment-based secret configuration
- Encrypted credential storage
- Controlled object-storage access

## License

Apache 2.0.

---

**JobMatch AI** is designed as a full-stack recruitment platform that combines applicant tracking with AI-assisted candidate evaluation and resume-to-job matching.
