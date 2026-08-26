# 🤖 JobMatch AI

> **AI-powered recruitment and applicant tracking platform for smarter candidate screening.**

JobMatch AI is a full-stack recruitment platform that combines **applicant tracking**, **AI-powered resume analysis**, and **resume-to-job matching** into a single hiring workflow.

Recruiters can create jobs, manage candidates, track applications, schedule interviews, and evaluate candidates using AI-assisted insights.

When a candidate applies with a resume, JobMatch AI processes the document asynchronously, analyzes it against the selected job requirements, and produces a structured **0–100 match score** with matched skills, missing skills, experience analysis, job-level evaluation, certifications, and an AI-generated candidate summary.

---

## ✨ Key Highlights

- 🤖 **AI-powered resume-to-job matching**
- 📄 Intelligent resume parsing with Google Gemini
- 🎯 **0–100 candidate match scoring**
- 🔎 Matched and missing skill detection
- 🧠 AI-generated candidate summaries
- 💡 Candidate strengths, gaps, and hiring signals
- 👥 Complete applicant tracking workflow
- 💼 Job and candidate management
- 📋 Configurable hiring pipeline
- 📅 Interview scheduling and feedback
- ⚡ Real-time updates with Socket.IO
- 🔄 Background processing with BullMQ + Redis
- 📧 Email notifications with Resend
- 🔐 JWT/JWKS authentication and role-based authorization
- 🧪 Automated testing with Vitest and Playwright
- 🚀 GitHub Actions CI/CD
- 🐳 Docker-based local infrastructure

---

# 🧩 Features

## 🤖 AI Resume-to-Job Matching

JobMatch AI analyzes candidate resumes against the requirements of a specific job.

The AI pipeline can:

- Parse candidate resumes
- Extract technical and professional skills
- Identify project technologies
- Extract work experience
- Extract certifications
- Determine candidate/job level
- Parse job descriptions and requirements
- Identify matched skills
- Identify missing skills
- Calculate a normalized **0–100 match score**
- Generate candidate strengths
- Identify candidate gaps
- Generate hiring signals
- Produce an AI-assisted candidate summary
- Reject documents that are not valid resumes

---

## 👥 Recruitment & Applicant Tracking

Recruiters can:

- Create and manage job openings
- Define job requirements and skills
- Manage candidates
- Manage applications
- Move candidates through hiring stages
- Search and filter candidates
- Paginate candidate and job lists
- Schedule interviews
- Record interview feedback
- Manage offers
- Track candidate activity
- Review the complete recruitment workflow

---

## ⚡ Real-Time Collaboration

JobMatch AI uses **Socket.IO** for real-time recruitment updates.

This enables:

- Candidate status updates
- Application activity updates
- Hiring-team collaboration
- Interview notifications
- Recruitment workflow synchronization

---

# 🔄 Background AI Processing

Resume analysis runs asynchronously using **BullMQ + Redis**, preventing long-running AI operations from blocking the main API request.

```text
Candidate applies
       │
       ▼
Resume uploaded to object storage
       │
       ▼
BullMQ Job
       │
       ▼
Redis Queue
       │
       ▼
AI CV Analysis Worker
       │
       ├── Gemini resume parsing
       ├── Gemini job-description parsing
       ├── Skill matching
       ├── Experience analysis
       ├── Job-level analysis
       ├── Certification analysis
       └── AI candidate summary
       │
       ▼
PostgreSQL
       │
       ▼
Recruiter Dashboard
       │
       ▼
Real-Time Socket.IO Updates
