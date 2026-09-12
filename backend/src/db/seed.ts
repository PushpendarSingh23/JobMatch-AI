import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and } from "drizzle-orm";
import { Pool } from "pg";
import {
  users,
  company,
  departments,
  pipelineStageTemplates,
  jobPipelineStages,
  jobs,
  jobSkills,
  jobHiringTeam,
  assessments,
  assessmentQuestions,
  assessmentQuestionOptions,
  jobAssessmentAttachments,
  templates,
  candidates,
  candidateStageHistory,
  candidateCvAnalysis,
  candidateInterviews,
  interviewFeedback,
  candidateAssessmentAttempts,
  offers,
  candidateActivities,
  candidateRejections,
  pageSettings,
} from "./schema";
import logger from "../utils/logger";

const isProduction = process.env.NODE_ENV === "production" || !!process.env.RENDER;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  max: 1,
  ssl: isProduction ? { rejectUnauthorized: false } : undefined,
});
const db = drizzle(pool);

async function seed() {
  console.log("==================================================");
  console.log("🌱 STARTING COMPREHENSIVE JOBMATCH AI DATABASE SEED");
  console.log("==================================================\n");

  // 1. Clean existing records in dependency order for clean idempotency
  console.log("🧹 Clearing previous seed data...");
  await db.delete(candidateActivities);
  await db.delete(candidateRejections);
  await db.delete(interviewFeedback);
  await db.delete(candidateInterviews);
  await db.delete(candidateAssessmentAttempts);
  await db.delete(candidateCvAnalysis);
  await db.delete(candidateStageHistory);
  await db.delete(offers);
  await db.delete(candidates);
  await db.delete(jobAssessmentAttachments);
  await db.delete(jobHiringTeam);
  await db.delete(jobPipelineStages);
  await db.delete(jobSkills);
  await db.delete(jobs);
  await db.delete(assessmentQuestionOptions);
  await db.delete(assessmentQuestions);
  await db.delete(assessments);
  await db.delete(templates);
  await db.delete(departments);
  await db.delete(company);
  await db.delete(users);
  await db.delete(pipelineStageTemplates);
  await db.delete(pageSettings);

  // 2. Company Info
  console.log("🏢 Seeding company and departments...");
  const insertedCompany = await db
    .insert(company)
    .values({
      name: "TechFlow Innovations",
      email: "talent@techflow.ai",
      website: "https://techflow.ai",
      phone: "+1 (415) 890-4321",
      address: "100 Montgomery St, Suite 1500, San Francisco, CA 94104",
      description:
        "TechFlow Innovations is an AI-first cloud enterprise company building next-generation workflow automation, intelligent developer tooling, and collaborative software.",
      logoUrl: "/assets/jobmatch-logo.svg",
    })
    .returning();
  const techflow = insertedCompany[0]!;

  // 3. Departments
  const deptNames = [
    "Engineering",
    "Product Management",
    "Design & UX",
    "Data & AI Research",
    "Sales & Business Development",
    "Marketing & Growth",
    "People & Culture",
  ];
  const insertedDepts = await db
    .insert(departments)
    .values(deptNames.map((name) => ({ companyId: techflow.id, name })))
    .returning();

  const deptMap = new Map<string, number>();
  insertedDepts.forEach((d) => deptMap.set(d.name, d.id));

  // 4. Users (Demo user + hiring team)
  console.log("👥 Seeding users & hiring team...");
  const seededUsers = await db
    .insert(users)
    .values([
      {
        asgardeoUserId: "demo-asgardeo-sub-id",
        firstName: "Sarah",
        lastName: "Jenkins",
        email: "demo@jobmatch-ai.dev",
        role: "super_admin",
        avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
        isActive: true,
      },
      {
        asgardeoUserId: "marcus-asgardeo-sub-id",
        firstName: "Marcus",
        lastName: "Chen",
        email: "marcus.chen@jobmatch-ai.dev",
        role: "hiring_manager",
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
        isActive: true,
      },
      {
        asgardeoUserId: "elena-asgardeo-sub-id",
        firstName: "Elena",
        lastName: "Rostova",
        email: "elena.rostova@jobmatch-ai.dev",
        role: "interviewer",
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
        isActive: true,
      },
      {
        asgardeoUserId: "david-asgardeo-sub-id",
        firstName: "David",
        lastName: "Kim",
        email: "david.kim@jobmatch-ai.dev",
        role: "interviewer",
        avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
        isActive: true,
      },
      {
        asgardeoUserId: "priya-asgardeo-sub-id",
        firstName: "Priya",
        lastName: "Patel",
        email: "priya.patel@jobmatch-ai.dev",
        role: "interviewer",
        avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
        isActive: true,
      },
    ])
    .returning();

  const primaryUser = seededUsers[0]!;
  const marcus = seededUsers[1]!;
  const elena = seededUsers[2]!;
  const david = seededUsers[3]!;
  const priya = seededUsers[4]!;

  // 5. Pipeline Stage Templates
  console.log("📋 Seeding pipeline stage templates...");
  const stageTemplateData = [
    { name: "Screening", position: 1, stageType: "screening" as const, isDeletable: false },
    { name: "Screening Qualified", position: 2, stageType: "screening" as const, isDeletable: false },
    { name: "Technical Assessment", position: 3, stageType: "screening" as const, isDeletable: false },
    { name: "Team Interviews", position: 4, stageType: "interview" as const, isDeletable: false },
    { name: "Hiring Manager Review", position: 5, stageType: "interview" as const, isDeletable: false },
    { name: "Offer Extended", position: 6, stageType: "offer" as const, isDeletable: false },
    { name: "Hired", position: 7, stageType: "offer" as const, isDeletable: false },
  ];
  const stageTemplates = await db.insert(pipelineStageTemplates).values(stageTemplateData).returning();

  // 6. Templates (Email & Event)
  console.log("✉️ Seeding email and event templates...");
  const insertedTemplates = await db
    .insert(templates)
    .values([
      {
        name: "Formal Employment Offer Letter",
        type: "email",
        subject: "Offer of Employment with TechFlow Innovations",
        bodyJson: `<div style="font-family:sans-serif;color:#1e293b;line-height:1.6">
          <h2>Congratulations on your offer!</h2>
          <p>Dear {{candidate_name}},</p>
          <p>We are delighted to extend an offer for the position of <strong>{{job_title}}</strong> at TechFlow Innovations.</p>
          <p>We were thoroughly impressed with your technical skills, leadership experience, and cultural alignment throughout the interview process.</p>
          <ul>
            <li><strong>Starting Compensation:</strong> {{salary}} {{currency}} per year</li>
            <li><strong>Employment Type:</strong> Full-time</li>
            <li><strong>Anticipated Start Date:</strong> {{start_date}}</li>
          </ul>
          <p>Please review and sign the formal agreement below.</p>
        </div>`,
        createdBy: primaryUser.id,
      },
      {
        name: "Application Received Confirmation",
        type: "email",
        subject: "Thank you for applying to TechFlow Innovations",
        bodyJson: `<p>Dear {{candidate_name}},</p><p>Thank you for submitting your application for {{job_title}}. Our hiring team is currently reviewing your background and will reach out shortly.</p>`,
        createdBy: primaryUser.id,
      },
      {
        name: "Respectful Candidate Rejection",
        type: "email",
        subject: "Update on your application with TechFlow Innovations",
        bodyJson: `<p>Dear {{candidate_name}},</p><p>Thank you for the time and effort you invested in meeting with our team for {{job_title}}. While we were very impressed by your background, we have chosen to move forward with another candidate whose experience more closely aligns with our immediate requirements.</p>`,
        createdBy: primaryUser.id,
      },
      {
        name: "Round 1 - Technical Architecture Discussion",
        type: "event",
        subject: "Technical Deep-Dive & System Architecture Interview",
        bodyJson: [
          { type: "heading", content: "Technical Deep Dive (60 mins)" },
          { type: "text", content: "Agenda: System design, concurrency patterns, and live problem solving." },
          { type: "divider" },
          { type: "text", content: "Meeting will be hosted via Google Meet." },
        ],
        createdBy: primaryUser.id,
      },
    ])
    .returning();

  const offerTemplate = insertedTemplates[0]!;
  const appReceivedTemplate = insertedTemplates[1]!;
  const rejectionTemplate = insertedTemplates[2]!;

  // 7. Assessments
  console.log("📝 Seeding technical & design assessments...");
  const insertedAssessments = await db
    .insert(assessments)
    .values([
      {
        title: "Full-Stack Senior TypeScript & React Assessment",
        description: "Comprehensive evaluation of React Server Components, TypeScript type systems, Node.js concurrency, and SQL optimization.",
        timeLimit: 45,
        createdBy: primaryUser.id,
      },
      {
        title: "AI & Machine Learning Engineering Evaluation",
        description: "In-depth questions covering RAG architectures, vector embeddings, fine-tuning heuristics, and low-latency LLM serving.",
        timeLimit: 60,
        createdBy: primaryUser.id,
      },
      {
        title: "Product Design & Design Systems Assessment",
        description: "Design system scalability, accessible tokens, WCAG 2.1 AA compliance, and cross-platform responsive patterns.",
        timeLimit: 30,
        createdBy: primaryUser.id,
      },
    ])
    .returning();

  const fsAssessment = insertedAssessments[0]!;
  const aiAssessment = insertedAssessments[1]!;
  const uxAssessment = insertedAssessments[2]!;

  // Assessment Questions & Options
  const q1 = await db.insert(assessmentQuestions).values({
    assessmentId: fsAssessment.id,
    title: "How do React Server Components (RSC) handle client-side interactivity?",
    description: "Explain the boundary between Server Components and Client Components.",
    questionType: "multiple_choice",
    points: 10,
    position: 1,
  }).returning();
  const q1Record = q1[0]!;

  await db.insert(assessmentQuestionOptions).values([
    { questionId: q1Record.id, label: "Server components can import 'use client' components directly as leaves", isCorrect: true, position: 1 },
    { questionId: q1Record.id, label: "Server components can use useState and useEffect hooks", isCorrect: false, position: 2 },
    { questionId: q1Record.id, label: "All JavaScript bundles are shipped to the client regardless of directive", isCorrect: false, position: 3 },
  ]);

  const q2 = await db.insert(assessmentQuestions).values({
    assessmentId: fsAssessment.id,
    title: "Which index type is best suited for PostgreSQL full-text search queries?",
    description: "Selecting the optimal index for tsvector and search queries.",
    questionType: "multiple_choice",
    points: 10,
    position: 2,
  }).returning();
  const q2Record = q2[0]!;

  await db.insert(assessmentQuestionOptions).values([
    { questionId: q2Record.id, label: "GIN (Generalized Inverted Index)", isCorrect: true, position: 1 },
    { questionId: q2Record.id, label: "B-Tree", isCorrect: false, position: 2 },
    { questionId: q2Record.id, label: "Hash Index", isCorrect: false, position: 3 },
  ]);

  // 8. Jobs (20 Realistic Jobs)
  console.log("💼 Seeding 20 realistic jobs across departments...");
  const jobsData = [
    {
      title: "Senior Full-Stack Engineer (Next.js & Node.js)",
      slug: "senior-fullstack-engineer-nextjs-node",
      departmentId: deptMap.get("Engineering")!,
      employmentType: "full_time" as const,
      location: "San Francisco, CA (Hybrid)",
      description: "We are seeking a Senior Full-Stack Engineer to lead the development of our collaborative AI workspaces. You will own core features spanning our Next.js App Router frontend, distributed Node.js microservices, PostgreSQL data models, and real-time WebSockets.",
      salaryType: "range" as const,
      currency: "USD",
      payFrequency: "yearly" as const,
      salaryMin: 165000,
      salaryMax: 210000,
      status: "published" as const,
      createdBy: primaryUser.id,
      skills: ["React", "Next.js", "TypeScript", "Node.js", "PostgreSQL", "TailwindCSS", "Redis", "Docker"],
      assessmentId: fsAssessment.id,
    },
    {
      title: "Staff Distributed Systems Architect",
      slug: "staff-distributed-systems-architect",
      departmentId: deptMap.get("Engineering")!,
      employmentType: "full_time" as const,
      location: "Remote, US",
      description: "Join our core infrastructure team to architect high-throughput event-driven data pipelines, multi-region database replication, and zero-downtime deployment pipelines handling millions of monthly operations.",
      salaryType: "range" as const,
      currency: "USD",
      payFrequency: "yearly" as const,
      salaryMin: 210000,
      salaryMax: 260000,
      status: "published" as const,
      createdBy: primaryUser.id,
      skills: ["Go", "Kubernetes", "PostgreSQL", "Kafka", "AWS", "gRPC", "Distributed Systems"],
      assessmentId: fsAssessment.id,
    },
    {
      title: "Principal AI Research Scientist (LLMs & RAG)",
      slug: "principal-ai-research-scientist-llms-rag",
      departmentId: deptMap.get("Data & AI Research")!,
      employmentType: "full_time" as const,
      location: "San Francisco, CA (On-site)",
      description: "Lead cutting-edge research in generative AI, semantic vector retrieval, structured output extraction, and domain-adapted fine-tuning for automated enterprise talent intelligence.",
      salaryType: "range" as const,
      currency: "USD",
      payFrequency: "yearly" as const,
      salaryMin: 220000,
      salaryMax: 290000,
      status: "published" as const,
      createdBy: primaryUser.id,
      skills: ["Python", "PyTorch", "Transformers", "LangChain", "Vector DBs", "RAG", "Gemini API"],
      assessmentId: aiAssessment.id,
    },
    {
      title: "Lead Frontend Architect (Design Systems)",
      slug: "lead-frontend-architect-design-systems",
      departmentId: deptMap.get("Engineering")!,
      employmentType: "full_time" as const,
      location: "New York, NY (Hybrid)",
      description: "Own our UI component ecosystem, accessibility compliance (WCAG 2.1 AA), frontend performance budgets, micro-frontends, and design token integration across our suite of web and mobile apps.",
      salaryType: "range" as const,
      currency: "USD",
      payFrequency: "yearly" as const,
      salaryMin: 180000,
      salaryMax: 225000,
      status: "published" as const,
      createdBy: primaryUser.id,
      skills: ["TypeScript", "React", "Design Systems", "TailwindCSS", "Accessibility (a11y)", "Storybook"],
      assessmentId: uxAssessment.id,
    },
    {
      title: "Senior Product Designer (UI/UX)",
      slug: "senior-product-designer-ui-ux",
      departmentId: deptMap.get("Design & UX")!,
      employmentType: "full_time" as const,
      location: "San Francisco, CA (Hybrid)",
      description: "Shape intuitive, delightful user experiences for complex AI-assisted hiring workflows. You will partner with product managers and engineers to conduct user research, create high-fidelity prototypes, and refine production interactions.",
      salaryType: "range" as const,
      currency: "USD",
      payFrequency: "yearly" as const,
      salaryMin: 150000,
      salaryMax: 190000,
      status: "published" as const,
      createdBy: primaryUser.id,
      skills: ["Figma", "UI/UX", "User Research", "Prototyping", "Design Systems", "Information Architecture"],
      assessmentId: uxAssessment.id,
    },
    {
      title: "Director of Product Management (Enterprise AI)",
      slug: "director-product-management-enterprise-ai",
      departmentId: deptMap.get("Product Management")!,
      employmentType: "full_time" as const,
      location: "New York, NY (Hybrid)",
      description: "Define product strategy, roadmaps, and go-to-market execution for our enterprise AI portfolio. Drive customer discovery with Fortune 500 talent executives and cross-functional engineering alignment.",
      salaryType: "range" as const,
      currency: "USD",
      payFrequency: "yearly" as const,
      salaryMin: 195000,
      salaryMax: 250000,
      status: "published" as const,
      createdBy: primaryUser.id,
      skills: ["Product Strategy", "Roadmapping", "Enterprise SaaS", "Data Analytics", "AI Products"],
    },
    {
      title: "Senior DevOps & Cloud Infrastructure Engineer",
      slug: "senior-devops-cloud-infrastructure-engineer",
      departmentId: deptMap.get("Engineering")!,
      employmentType: "full_time" as const,
      location: "Seattle, WA (Hybrid)",
      description: "Manage and scale our multi-region Kubernetes clusters on AWS and Google Cloud. Lead Terraform automation, CI/CD pipelines, security compliance, observability with Prometheus/Grafana, and disaster recovery.",
      salaryType: "range" as const,
      currency: "USD",
      payFrequency: "yearly" as const,
      salaryMin: 160000,
      salaryMax: 205000,
      status: "published" as const,
      createdBy: primaryUser.id,
      skills: ["Kubernetes", "Terraform", "AWS", "Docker", "CI/CD", "Prometheus", "Linux"],
    },
    {
      title: "Machine Learning Operations (MLOps) Engineer",
      slug: "mlops-engineer-infrastructure",
      departmentId: deptMap.get("Data & AI Research")!,
      employmentType: "full_time" as const,
      location: "Remote, US",
      description: "Build robust infrastructure for training, evaluating, deploying, and monitoring LLMs and embedding models. Implement automated model evaluation, feature stores, and GPU cluster optimization.",
      salaryType: "range" as const,
      currency: "USD",
      payFrequency: "yearly" as const,
      salaryMin: 170000,
      salaryMax: 220000,
      status: "published" as const,
      createdBy: primaryUser.id,
      skills: ["Python", "Kubernetes", "Docker", "MLflow", "Triton", "Ray", "AWS SageMaker"],
    },
    {
      title: "Technical Product Manager (Developer Platform)",
      slug: "technical-product-manager-developer-platform",
      departmentId: deptMap.get("Product Management")!,
      employmentType: "full_time" as const,
      location: "Austin, TX (Hybrid)",
      description: "Own developer experience, public APIs, webhooks, and third-party integrations (WSO2, Google Workspace, Slack, HRIS systems). Guide developer documentation and SDK strategies.",
      salaryType: "range" as const,
      currency: "USD",
      payFrequency: "yearly" as const,
      salaryMin: 155000,
      salaryMax: 195000,
      status: "published" as const,
      createdBy: primaryUser.id,
      skills: ["REST APIs", "GraphQL", "Webhooks", "OAuth2", "Developer Experience", "Agile"],
    },
    {
      title: "Senior Data Engineer (Snowflake & dbt)",
      slug: "senior-data-engineer-snowflake-dbt",
      departmentId: deptMap.get("Data & AI Research")!,
      employmentType: "full_time" as const,
      location: "London, UK (Hybrid)",
      description: "Design modern data pipelines and analytics marts supporting enterprise reporting, recruiting funnel metrics, and real-time business intelligence.",
      salaryType: "range" as const,
      currency: "GBP",
      payFrequency: "yearly" as const,
      salaryMin: 95000,
      salaryMax: 130000,
      status: "published" as const,
      createdBy: primaryUser.id,
      skills: ["Snowflake", "dbt", "SQL", "Python", "Airflow", "Data Modeling"],
    },
    {
      title: "Strategic Enterprise Account Executive",
      slug: "strategic-enterprise-account-executive",
      departmentId: deptMap.get("Sales & Business Development")!,
      employmentType: "full_time" as const,
      location: "Chicago, IL (Remote)",
      description: "Drive net-new enterprise revenue by partnering with CHROs and VP of Talent Acquisition at Fortune 1000 organizations. Manage end-to-end sales cycles from qualification to contract close.",
      salaryType: "range" as const,
      currency: "USD",
      payFrequency: "yearly" as const,
      salaryMin: 130000,
      salaryMax: 180000,
      status: "published" as const,
      createdBy: primaryUser.id,
      skills: ["Enterprise Sales", "SaaS", "Solution Selling", "Executive Presentation", "CRM"],
    },
    {
      title: "Growth Marketing Director",
      slug: "growth-marketing-director-demand-gen",
      departmentId: deptMap.get("Marketing & Growth")!,
      employmentType: "full_time" as const,
      location: "New York, NY (Remote)",
      description: "Spearhead multi-channel demand generation, paid acquisition, SEO/content strategies, and brand positioning to drive inbound pipeline for our enterprise product lines.",
      salaryType: "range" as const,
      currency: "USD",
      payFrequency: "yearly" as const,
      salaryMin: 160000,
      salaryMax: 200000,
      status: "published" as const,
      createdBy: primaryUser.id,
      skills: ["Demand Generation", "SEO", "Paid Media", "Marketing Analytics", "HubSpot"],
    },
    {
      title: "Senior Security & Compliance Engineer",
      slug: "senior-security-compliance-engineer",
      departmentId: deptMap.get("Engineering")!,
      employmentType: "full_time" as const,
      location: "San Francisco, CA (Hybrid)",
      description: "Ensure the highest security posture across SOC 2 Type II, ISO 27001, and GDPR compliance. Implement automated vulnerability scanning, secure code audits, and identity federation.",
      salaryType: "range" as const,
      currency: "USD",
      payFrequency: "yearly" as const,
      salaryMin: 175000,
      salaryMax: 220000,
      status: "published" as const,
      createdBy: primaryUser.id,
      skills: ["AppSec", "SOC 2", "OAuth2 / OIDC", "Penetration Testing", "Cloud Security", "SIEM"],
    },
    {
      title: "QA Automation Architect (Playwright & TypeScript)",
      slug: "qa-automation-architect-playwright",
      departmentId: deptMap.get("Engineering")!,
      employmentType: "contract" as const,
      location: "Remote, US",
      description: "Establish end-to-end automation frameworks using Playwright, Vitest, and GitHub Actions. Guarantee zero regressions across critical auth, billing, and candidate review flows.",
      salaryType: "range" as const,
      currency: "USD",
      payFrequency: "yearly" as const,
      salaryMin: 135000,
      salaryMax: 165000,
      status: "published" as const,
      createdBy: primaryUser.id,
      skills: ["Playwright", "TypeScript", "CI/CD", "E2E Testing", "Load Testing", "Vitest"],
    },
    {
      title: "People Operations & Talent Acquisition Lead",
      slug: "people-operations-talent-acquisition-lead",
      departmentId: deptMap.get("People & Culture")!,
      employmentType: "full_time" as const,
      location: "San Francisco, CA (Hybrid)",
      description: "Scale our global team by managing full-cycle hiring, onboarding, employee engagement, compensation benchmarking, and DE&I initiatives.",
      salaryType: "fixed" as const,
      currency: "USD",
      payFrequency: "yearly" as const,
      salaryFixed: 145000,
      status: "published" as const,
      createdBy: primaryUser.id,
      skills: ["Talent Acquisition", "HR Operations", "Compensation", "Employee Relations", "ATS"],
    },
    {
      title: "Customer Success Manager (Strategic Accounts)",
      slug: "customer-success-manager-strategic-accounts",
      departmentId: deptMap.get("Sales & Business Development")!,
      employmentType: "full_time" as const,
      location: "Boston, MA (Hybrid)",
      description: "Partner with enterprise customers post-sale to drive platform adoption, executive business reviews, user training, and net revenue retention (NRR).",
      salaryType: "range" as const,
      currency: "USD",
      payFrequency: "yearly" as const,
      salaryMin: 110000,
      salaryMax: 145000,
      status: "published" as const,
      createdBy: primaryUser.id,
      skills: ["Customer Success", "Account Management", "Onboarding", "Renewals", "Gainsight"],
    },
    {
      title: "Mobile Engineer (React Native & iOS)",
      slug: "mobile-engineer-react-native-ios",
      departmentId: deptMap.get("Engineering")!,
      employmentType: "full_time" as const,
      location: "Austin, TX (Hybrid)",
      description: "Develop our high-performance recruiter mobile app for iOS and Android, enabling on-the-go candidate review, interview scheduling, and instant chat.",
      salaryType: "range" as const,
      currency: "USD",
      payFrequency: "yearly" as const,
      salaryMin: 140000,
      salaryMax: 180000,
      status: "draft" as const,
      createdBy: primaryUser.id,
      skills: ["React Native", "TypeScript", "iOS", "Android", "Mobile Architecture"],
    },
    {
      title: "VP of Engineering",
      slug: "vp-of-engineering",
      departmentId: deptMap.get("Engineering")!,
      employmentType: "full_time" as const,
      location: "San Francisco, CA (On-site)",
      description: "Executive engineering leadership role overseeing product engineering, platform architecture, infrastructure, and technical hiring strategy across 60+ engineers.",
      salaryType: "range" as const,
      currency: "USD",
      payFrequency: "yearly" as const,
      salaryMin: 280000,
      salaryMax: 360000,
      status: "draft" as const,
      createdBy: primaryUser.id,
      skills: ["Engineering Leadership", "Executive Management", "System Architecture", "Hiring"],
    },
    {
      title: "Chief of Staff to CEO",
      slug: "chief-of-staff-to-ceo",
      departmentId: deptMap.get("People & Culture")!,
      employmentType: "full_time" as const,
      location: "New York, NY (On-site)",
      description: "High-impact strategic partner to executive leadership driving strategic planning, quarterly business reviews, investor relations, and operational special projects.",
      salaryType: "fixed" as const,
      currency: "USD",
      payFrequency: "yearly" as const,
      salaryFixed: 185000,
      status: "closed" as const,
      createdBy: primaryUser.id,
      skills: ["Strategic Planning", "Executive Communications", "Financial Modeling", "Operations"],
    },
    {
      title: "Junior Data Analyst Intern",
      slug: "junior-data-analyst-intern-summer",
      departmentId: deptMap.get("Data & AI Research")!,
      employmentType: "internship" as const,
      location: "San Francisco, CA (Hybrid)",
      description: "Summer internship program focused on data modeling, dashboard generation, predictive recruitment analytics, and SQL query optimization.",
      salaryType: "fixed" as const,
      currency: "USD",
      payFrequency: "monthly" as const,
      salaryFixed: 6500,
      status: "closed" as const,
      createdBy: primaryUser.id,
      skills: ["SQL", "Python", "Tableau", "Data Analysis", "Excel"],
    },
  ];

  type CreatedJobInfo = {
    id: number;
    title: string;
    departmentId: number;
    stageMap: Map<string, number>;
  };

  const createdJobs: CreatedJobInfo[] = [];

  for (const jd of jobsData) {
    const { skills, assessmentId, ...jobFields } = jd;
    const insertedJobs = await db
      .insert(jobs)
      .values({
        ...jobFields,
        applicationEmailTemplateId: appReceivedTemplate.id,
      })
      .returning();
    const job = insertedJobs[0]!;

    // Skills
    if (skills && skills.length > 0) {
      await db.insert(jobSkills).values(skills.map((s) => ({ jobId: job.id, skill: s })));
    }

    // Pipeline stages for this job
    const insertedStages = await db
      .insert(jobPipelineStages)
      .values(
        stageTemplates.map((st) => ({
          jobId: job.id,
          name: st.name,
          position: st.position,
          stageType: st.stageType,
          sourceTemplateId: st.id,
        })),
      )
      .returning();

    const stageMap = new Map<string, number>();
    insertedStages.forEach((s) => stageMap.set(s.name, s.id));

    // Hiring team: add primary user + relevant team members
    await db.insert(jobHiringTeam).values([
      { jobId: job.id, userId: primaryUser.id },
      { jobId: job.id, userId: marcus.id },
      { jobId: job.id, userId: elena.id },
    ]);

    // Attach assessment if configured
    if (assessmentId) {
      const techStageId = stageMap.get("Technical Assessment");
      if (techStageId) {
        await db.insert(jobAssessmentAttachments).values({
          jobId: job.id,
          assessmentId,
          triggerStageId: techStageId,
        });
      }
    }

    createdJobs.push({ id: job.id, title: job.title, departmentId: job.departmentId, stageMap });
  }

  // 9. Realistic Candidates & Applications (32 Candidates across stages)
  console.log("👨‍💼 Seeding 32 candidates with CV analysis, stage history & interviews...");
  const primaryJob = createdJobs[0]!; // Senior Full-Stack
  const staffJob = createdJobs[1]!;   // Staff Distributed Systems
  const aiJob = createdJobs[2]!;      // Principal AI Scientist
  const uxJob = createdJobs[4]!;      // Senior Product Designer
  const opsJob = createdJobs[6]!;     // Senior DevOps

  const candidatesData = [
    // --- HIRED (2 Candidates) ---
    {
      job: primaryJob,
      firstName: "Alexander",
      lastName: "Wright",
      email: "alexander.wright@techcraft.io",
      phone: "+1 (415) 321-7890",
      stageName: "Hired",
      status: "hired" as const,
      daysAgo: 45,
      cv: {
        score: 96,
        skills: ["React", "Next.js", "TypeScript", "Node.js", "PostgreSQL", "Docker", "TailwindCSS"],
        missing: [],
        breakdown: { skills: 98, experience: 96, level: 95, certs: 92 },
        summary: "Exceptional full-stack engineer with 8 years of production Next.js experience. Spearheaded enterprise migrations at Stripe and Vercel.",
        strengths: ["Expert Next.js App Router & Server Actions architecture", "Deep PostgreSQL optimization & connection pooling", "Proven track record in engineering mentorship"],
        gaps: ["None identified for this seniority level"],
        signal: "Strong Hire — Immediate impact expected across technical architecture.",
        verdict: "strong_fit" as const,
      },
      hasOffer: true,
      offerStatus: "accepted" as const,
      offerSalary: 195000,
    },
    {
      job: staffJob,
      firstName: "Claire",
      lastName: "Delacroix",
      email: "claire.delacroix@cloudsystems.org",
      phone: "+1 (206) 555-0199",
      stageName: "Hired",
      status: "hired" as const,
      daysAgo: 40,
      cv: {
        score: 95,
        skills: ["Go", "Kubernetes", "PostgreSQL", "Kafka", "AWS", "Distributed Systems"],
        missing: ["gRPC"],
        breakdown: { skills: 96, experience: 95, level: 97, certs: 90 },
        summary: "Principal distributed systems architect with extensive expertise in multi-region Kafka event streams and resilient Raft consensus implementations.",
        strengths: ["10+ years in mission-critical distributed systems", "Author of several widely adopted Go open-source libraries", "Deep Kubernetes operator development skills"],
        gaps: ["Prefers pure Go over Rust for low-level network daemons"],
        signal: "Strong Hire — Exceptional architecture depth.",
        verdict: "strong_fit" as const,
      },
      hasOffer: true,
      offerStatus: "accepted" as const,
      offerSalary: 245000,
    },

    // --- OFFER EXTENDED (3 Candidates) ---
    {
      job: primaryJob,
      firstName: "Maya",
      lastName: "Lin",
      email: "maya.lin.dev@gmail.com",
      phone: "+1 (415) 888-2341",
      stageName: "Offer Extended",
      status: "offered" as const,
      daysAgo: 28,
      cv: {
        score: 92,
        skills: ["React", "Next.js", "TypeScript", "Node.js", "PostgreSQL", "TailwindCSS"],
        missing: ["Redis"],
        breakdown: { skills: 94, experience: 90, level: 92, certs: 88 },
        summary: "Staff frontend and fullstack specialist with deep knowledge of React Server Components, hydration performance, and accessible UI systems.",
        strengths: ["Fastidious attention to Core Web Vitals and render efficiency", "High code quality and test coverage standards", "Strong product intuition"],
        gaps: ["Less direct Redis cluster administration experience"],
        signal: "Strong Hire — Excellent culture and technical fit.",
        verdict: "strong_fit" as const,
      },
      hasOffer: true,
      offerStatus: "sent" as const,
      offerSalary: 185000,
    },
    {
      job: aiJob,
      firstName: "Dr. Vikram",
      lastName: "Rao",
      email: "vikram.rao@stanford.alum.edu",
      phone: "+1 (650) 443-1289",
      stageName: "Offer Extended",
      status: "offered" as const,
      daysAgo: 25,
      cv: {
        score: 94,
        skills: ["Python", "PyTorch", "Transformers", "LangChain", "Vector DBs", "RAG"],
        missing: [],
        breakdown: { skills: 97, experience: 92, level: 95, certs: 90 },
        summary: "PhD in Machine Learning from Stanford with 4 top-tier conference publications in neural retrieval and token-efficient reasoning models.",
        strengths: ["World-class theoretical and practical understanding of RAG pipelines", "Hands-on experience deploying open-weights models at scale", "Clear communicator on complex math"],
        gaps: ["Relatively new to enterprise B2B product cycles"],
        signal: "Strong Hire — Foundational addition to the research team.",
        verdict: "strong_fit" as const,
      },
      hasOffer: true,
      offerStatus: "sent" as const,
      offerSalary: 260000,
    },
    {
      job: uxJob,
      firstName: "Sophie",
      lastName: "Dubois",
      email: "sophie.dubois@designstudio.fr",
      phone: "+1 (415) 777-9012",
      stageName: "Offer Extended",
      status: "offered" as const,
      daysAgo: 20,
      cv: {
        score: 91,
        skills: ["Figma", "UI/UX", "User Research", "Prototyping", "Design Systems"],
        missing: ["Information Architecture"],
        breakdown: { skills: 92, experience: 91, level: 90, certs: 88 },
        summary: "Senior product designer specializing in complex SaaS workflows, data visualization dashboards, and modern micro-animations.",
        strengths: ["Exemplary visual design and micro-interaction polish", "Strong user empathy and research methodology", "Seamless design-to-code handoff"],
        gaps: ["Limited experience with native mobile design systems"],
        signal: "Hire — High design caliber.",
        verdict: "strong_fit" as const,
      },
      hasOffer: true,
      offerStatus: "draft" as const,
      offerSalary: 175000,
    },

    // --- HIRING MANAGER REVIEW (4 Candidates) ---
    {
      job: primaryJob,
      firstName: "Daniel",
      lastName: "Kovacs",
      email: "daniel.kovacs@devhub.net",
      phone: "+1 (512) 349-8812",
      stageName: "Hiring Manager Review",
      status: "active" as const,
      daysAgo: 18,
      cv: {
        score: 89,
        skills: ["React", "TypeScript", "Node.js", "PostgreSQL", "Docker"],
        missing: ["Next.js", "TailwindCSS"],
        breakdown: { skills: 88, experience: 90, level: 89, certs: 85 },
        summary: "Solid full-stack developer with 6 years building high-traffic Node.js backends and complex React SPAs.",
        strengths: ["Strong database query tuning and index analysis", "Clean API design principles", "Excellent team collaborator"],
        gaps: ["Experience is with Pages Router rather than Next.js App Router"],
        signal: "Hire — Will quickly bridge the App Router gap.",
        verdict: "strong_fit" as const,
      },
      hasInterview: true,
      interviewOutcome: "pass" as const,
    },
    {
      job: staffJob,
      firstName: "Kavita",
      lastName: "Sharma",
      email: "kavita.sharma@cloudinfra.io",
      phone: "+1 (408) 555-8910",
      stageName: "Hiring Manager Review",
      status: "active" as const,
      daysAgo: 16,
      cv: {
        score: 90,
        skills: ["Go", "Kubernetes", "PostgreSQL", "AWS", "Distributed Systems"],
        missing: ["Kafka"],
        breakdown: { skills: 91, experience: 92, level: 90, certs: 86 },
        summary: "Senior infrastructure engineer with deep Kubernetes internals and cloud networking experience.",
        strengths: ["Expert-level container networking and CNI plugins", "Outstanding troubleshooting skills during production incidents", "Strong mentor"],
        gaps: ["Less direct experience with event streaming at multi-gigabyte scale"],
        signal: "Hire — Proven senior engineer.",
        verdict: "strong_fit" as const,
      },
      hasInterview: true,
      interviewOutcome: "pass" as const,
    },
    {
      job: aiJob,
      firstName: "Ethan",
      lastName: "Cole",
      email: "ethan.cole@neuralfrontier.ai",
      phone: "+1 (617) 234-9988",
      stageName: "Hiring Manager Review",
      status: "active" as const,
      daysAgo: 15,
      cv: {
        score: 88,
        skills: ["Python", "PyTorch", "LangChain", "Vector DBs", "RAG"],
        missing: ["Transformers"],
        breakdown: { skills: 87, experience: 88, level: 89, certs: 85 },
        summary: "Applied AI engineer with strong hands-on experience integrating LLM APIs, building automated evaluators, and hybrid search RAG systems.",
        strengths: ["High development velocity and pragmatic prototype delivery", "Great understanding of prompt caching and cost optimization", "Passionate about UX of AI products"],
        gaps: ["Less formal training on foundational pre-training algorithms"],
        signal: "Hire — Pragmatic builder with strong execution.",
        verdict: "moderate_fit" as const,
      },
      hasInterview: true,
      interviewOutcome: "pending" as const,
    },
    {
      job: opsJob,
      firstName: "Hannah",
      lastName: "Vanderbilt",
      email: "hannah.vanderbilt@infraops.co",
      phone: "+1 (206) 888-4422",
      stageName: "Hiring Manager Review",
      status: "active" as const,
      daysAgo: 14,
      cv: {
        score: 89,
        skills: ["Kubernetes", "Terraform", "AWS", "Docker", "CI/CD", "Linux"],
        missing: ["Prometheus"],
        breakdown: { skills: 90, experience: 89, level: 91, certs: 84 },
        summary: "DevOps engineer with 7 years managing AWS and Kubernetes enterprise environments. Built GitOps pipelines reducing release cycle from days to minutes.",
        strengths: ["Flawless Terraform modular architecture", "Security-first infrastructure posture", "Strong calm demeanour under incident pressure"],
        gaps: ["Uses Datadog instead of native Prometheus/Grafana stack"],
        signal: "Hire — Highly capable SRE.",
        verdict: "strong_fit" as const,
      },
      hasInterview: true,
      interviewOutcome: "pass" as const,
    },

    // --- TEAM INTERVIEWS (5 Candidates) ---
    {
      job: primaryJob,
      firstName: "Liam",
      lastName: "O'Connor",
      email: "liam.oconnor@codeworks.ie",
      phone: "+1 (415) 654-3210",
      stageName: "Team Interviews",
      status: "active" as const,
      daysAgo: 12,
      cv: {
        score: 86,
        skills: ["React", "TypeScript", "Node.js", "TailwindCSS"],
        missing: ["Next.js", "PostgreSQL", "Docker"],
        breakdown: { skills: 85, experience: 87, level: 86, certs: 82 },
        summary: "Fullstack web developer with 5 years experience primarily in React and Express with MongoDB.",
        strengths: ["Fast frontend feature builder", "Clear communication", "Proactive test writing"],
        gaps: ["Relational database indexing knowledge needs leveling up"],
        signal: "Lean Hire — Solid foundational abilities.",
        verdict: "moderate_fit" as const,
      },
      hasInterview: true,
      interviewOutcome: "pending" as const,
    },
    {
      job: staffJob,
      firstName: "Yuki",
      lastName: "Takahashi",
      email: "yuki.takahashi@tokyotech.jp",
      phone: "+1 (415) 992-1133",
      stageName: "Team Interviews",
      status: "active" as const,
      daysAgo: 11,
      cv: {
        score: 87,
        skills: ["Go", "Kubernetes", "Docker", "AWS", "Distributed Systems"],
        missing: ["Kafka", "PostgreSQL"],
        breakdown: { skills: 88, experience: 86, level: 87, certs: 85 },
        summary: "Backend systems engineer with 6 years experience in microservice choreography and high-concurrency Go network services.",
        strengths: ["Deep grasp of Go runtime concurrency primitives", "Clean modular code layout", "Diligent benchmark profiling"],
        gaps: ["Familiar with DynamoDB rather than relational PostgreSQL"],
        signal: "Lean Hire — Very capable systems developer.",
        verdict: "moderate_fit" as const,
      },
      hasInterview: true,
      interviewOutcome: "pending" as const,
    },
    {
      job: uxJob,
      firstName: "Camila",
      lastName: "Santos",
      email: "camila.santos@designbr.com",
      phone: "+1 (305) 555-7821",
      stageName: "Team Interviews",
      status: "active" as const,
      daysAgo: 10,
      cv: {
        score: 88,
        skills: ["Figma", "UI/UX", "Prototyping", "Design Systems"],
        missing: ["User Research"],
        breakdown: { skills: 89, experience: 87, level: 88, certs: 84 },
        summary: "Product designer with clean aesthetic sensibility and strong component library design skills.",
        strengths: ["Fast turnarounds on high-fidelity designs", "Great design tokens architecture", "Enthusiastic collaborator"],
        gaps: ["Relies on PMs for quantitative user research data"],
        signal: "Hire — Strong visual and system designer.",
        verdict: "strong_fit" as const,
      },
      hasInterview: true,
      interviewOutcome: "pending" as const,
    },
    {
      job: aiJob,
      firstName: "Marcus",
      lastName: "Aurelius",
      email: "m.aurelius@computational.ai",
      phone: "+1 (212) 555-6677",
      stageName: "Team Interviews",
      status: "active" as const,
      daysAgo: 9,
      cv: {
        score: 85,
        skills: ["Python", "PyTorch", "Transformers", "Vector DBs"],
        missing: ["LangChain", "RAG"],
        breakdown: { skills: 86, experience: 84, level: 85, certs: 83 },
        summary: "Research engineer working on embedding fine-tuning and contrastive learning representations.",
        strengths: ["Strong mathematical foundation", "Extensive PyTorch modeling experience", "Clean experimental documentation"],
        gaps: ["Less exposure to enterprise application integration"],
        signal: "Lean Hire — Great technical foundation.",
        verdict: "moderate_fit" as const,
      },
      hasInterview: true,
      interviewOutcome: "pending" as const,
    },
    {
      job: opsJob,
      firstName: "Dmitri",
      lastName: "Ivanov",
      email: "dmitri.ivanov@berlinops.de",
      phone: "+1 (415) 333-2211",
      stageName: "Team Interviews",
      status: "active" as const,
      daysAgo: 8,
      cv: {
        score: 87,
        skills: ["Kubernetes", "Docker", "CI/CD", "Linux", "Terraform"],
        missing: ["AWS"],
        breakdown: { skills: 88, experience: 87, level: 86, certs: 85 },
        summary: "Cloud engineer with deep bare-metal and GCP Kubernetes experience.",
        strengths: ["Expert Linux kernel performance tuning", "Automation enthusiast", "Thorough disaster recovery planning"],
        gaps: ["GCP background; AWS knowledge is conceptual"],
        signal: "Hire — Capable engineer with fast learning curve.",
        verdict: "strong_fit" as const,
      },
      hasInterview: true,
      interviewOutcome: "pending" as const,
    },

    // --- TECHNICAL ASSESSMENT (5 Candidates) ---
    {
      job: primaryJob,
      firstName: "Zoe",
      lastName: "Washington",
      email: "zoe.washington@techforward.org",
      phone: "+1 (202) 555-0143",
      stageName: "Technical Assessment",
      status: "active" as const,
      daysAgo: 7,
      cv: {
        score: 84,
        skills: ["React", "TypeScript", "Node.js", "TailwindCSS"],
        missing: ["PostgreSQL", "Docker", "Redis"],
        breakdown: { skills: 83, experience: 85, level: 84, certs: 81 },
        summary: "Full-stack engineer with 4 years experience building responsive web applications with TypeScript and GraphQL.",
        strengths: ["Clean component composition", "TypeScript type-safety enthusiast", "Enthusiastic and motivated"],
        gaps: ["Needs backend database tuning experience"],
        signal: "Under Review — Pending assessment outcome.",
        verdict: "moderate_fit" as const,
      },
      hasAssessmentAttempt: true,
      scorePct: 85,
    },
    {
      job: primaryJob,
      firstName: "Siddharth",
      lastName: "Mehta",
      email: "sid.mehta@bangalorecode.in",
      phone: "+1 (415) 898-1122",
      stageName: "Technical Assessment",
      status: "active" as const,
      daysAgo: 6,
      cv: {
        score: 85,
        skills: ["React", "Next.js", "TypeScript", "Node.js"],
        missing: ["Docker", "PostgreSQL"],
        breakdown: { skills: 86, experience: 84, level: 85, certs: 82 },
        summary: "Product-minded full-stack developer with 4 years building SaaS platforms and developer portals.",
        strengths: ["Great UI eye", "Strong Next.js understanding", "Collaborative team player"],
        gaps: ["Light on DevOps and container deployment"],
        signal: "Under Review — Assessment in progress.",
        verdict: "moderate_fit" as const,
      },
      hasAssessmentAttempt: true,
      scorePct: 90,
    },
    {
      job: staffJob,
      firstName: "Nadia",
      lastName: "Benali",
      email: "nadia.benali@systems.fr",
      phone: "+1 (415) 777-6655",
      stageName: "Technical Assessment",
      status: "active" as const,
      daysAgo: 6,
      cv: {
        score: 83,
        skills: ["Go", "Kubernetes", "AWS", "Linux"],
        missing: ["Kafka", "Distributed Systems"],
        breakdown: { skills: 84, experience: 83, level: 84, certs: 80 },
        summary: "Backend engineer with 5 years writing Go microservices in AWS ECS and EKS.",
        strengths: ["Reliable service architecture", "Strong API documentation", "Diligent unit testing"],
        gaps: ["Limited experience designing multi-region distributed consensus"],
        signal: "Under Review — Assessment evaluating system design skills.",
        verdict: "moderate_fit" as const,
      },
      hasAssessmentAttempt: true,
      scorePct: 80,
    },
    {
      job: aiJob,
      firstName: "Jordan",
      lastName: "Taylor",
      email: "jordan.taylor@aimodels.io",
      phone: "+1 (312) 555-7788",
      stageName: "Technical Assessment",
      status: "active" as const,
      daysAgo: 5,
      cv: {
        score: 86,
        skills: ["Python", "PyTorch", "LangChain", "Vector DBs"],
        missing: ["RAG"],
        breakdown: { skills: 87, experience: 85, level: 86, certs: 83 },
        summary: "Machine learning engineer building automated data extraction pipelines and classification agents.",
        strengths: ["Fast prototyper", "Good evaluation metrics rigor", "Strong Python fundamentals"],
        gaps: ["Less production scale experience"],
        signal: "Under Review — Assessment pending.",
        verdict: "moderate_fit" as const,
      },
      hasAssessmentAttempt: true,
      scorePct: 88,
    },
    {
      job: uxJob,
      firstName: "Lucas",
      lastName: "Mendoza",
      email: "lucas.mendoza@uxcraft.es",
      phone: "+1 (415) 666-4433",
      stageName: "Technical Assessment",
      status: "active" as const,
      daysAgo: 5,
      cv: {
        score: 84,
        skills: ["Figma", "UI/UX", "Prototyping"],
        missing: ["Design Systems", "User Research"],
        breakdown: { skills: 85, experience: 84, level: 83, certs: 80 },
        summary: "Product designer with clean portfolio of B2C mobile apps and responsive web interfaces.",
        strengths: ["Expressive animations and micro-interactions", "High fidelity mockups", "Fast workflow"],
        gaps: ["Needs more enterprise design system governance experience"],
        signal: "Under Review — Assessment evaluating design system skills.",
        verdict: "moderate_fit" as const,
      },
      hasAssessmentAttempt: true,
      scorePct: 82,
    },

    // --- SCREENING QUALIFIED (6 Candidates) ---
    {
      job: primaryJob,
      firstName: "Emma",
      lastName: "Goldman",
      email: "emma.goldman@codenyc.com",
      phone: "+1 (212) 555-8890",
      stageName: "Screening Qualified",
      status: "active" as const,
      daysAgo: 4,
      cv: {
        score: 82,
        skills: ["React", "TypeScript", "Node.js"],
        missing: ["Next.js", "PostgreSQL", "Docker", "TailwindCSS"],
        breakdown: { skills: 81, experience: 83, level: 82, certs: 79 },
        summary: "Frontend-leaning full-stack developer with 4 years experience in React and Node.js.",
        strengths: ["Strong TypeScript knowledge", "Clear communicator", "Collaborative demeanor"],
        gaps: ["Less exposure to modern Server Components"],
        signal: "Screening Passed — Recommend moving to technical assessment.",
        verdict: "moderate_fit" as const,
      },
    },
    {
      job: primaryJob,
      firstName: "Gabriel",
      lastName: "Silva",
      email: "gabriel.silva@techrio.br",
      phone: "+1 (415) 123-9988",
      stageName: "Screening Qualified",
      status: "active" as const,
      daysAgo: 4,
      cv: {
        score: 83,
        skills: ["React", "TypeScript", "TailwindCSS", "PostgreSQL"],
        missing: ["Next.js", "Node.js", "Docker"],
        breakdown: { skills: 82, experience: 84, level: 83, certs: 80 },
        summary: "Web developer with 5 years experience creating responsive applications with modern React.",
        strengths: ["CSS mastery and responsive layouts", "High attention to visual fidelity", "Fast learner"],
        gaps: ["Less experience with backend architecture"],
        signal: "Screening Passed — Qualified for next round.",
        verdict: "moderate_fit" as const,
      },
    },
    {
      job: staffJob,
      firstName: "Tomas",
      lastName: "Novak",
      email: "tomas.novak@praguesystems.cz",
      phone: "+1 (415) 887-2244",
      stageName: "Screening Qualified",
      status: "active" as const,
      daysAgo: 3,
      cv: {
        score: 81,
        skills: ["Go", "Docker", "AWS", "Linux"],
        missing: ["Kubernetes", "Distributed Systems", "Kafka"],
        breakdown: { skills: 80, experience: 82, level: 81, certs: 78 },
        summary: "Backend engineer with 5 years developing REST APIs and asynchronous worker queues in Go.",
        strengths: ["Solid Go fundamentals", "Thorough unit test suites", "Dependable delivery"],
        gaps: ["Needs Kubernetes orchestration depth"],
        signal: "Screening Passed — Strong developer, assess architecture depth.",
        verdict: "moderate_fit" as const,
      },
    },
    {
      job: aiJob,
      firstName: "Fatima",
      lastName: "Al-Mansoor",
      email: "fatima.mansoor@aiinst.ae",
      phone: "+1 (415) 445-6677",
      stageName: "Screening Qualified",
      status: "active" as const,
      daysAgo: 3,
      cv: {
        score: 85,
        skills: ["Python", "PyTorch", "Transformers"],
        missing: ["LangChain", "Vector DBs", "RAG"],
        breakdown: { skills: 86, experience: 84, level: 85, certs: 82 },
        summary: "Applied researcher with strong NLP fundamentals and transformer fine-tuning experience.",
        strengths: ["Rigorous scientific methodology", "High quality publication record", "Fast prototyping"],
        gaps: ["RAG architectural integration experience needed"],
        signal: "Screening Passed — Strong research potential.",
        verdict: "moderate_fit" as const,
      },
    },
    {
      job: uxJob,
      firstName: "Aria",
      lastName: "Montgomery",
      email: "aria.montgomery@uxdesign.net",
      phone: "+1 (310) 555-3344",
      stageName: "Screening Qualified",
      status: "active" as const,
      daysAgo: 3,
      cv: {
        score: 83,
        skills: ["Figma", "UI/UX", "Prototyping"],
        missing: ["Design Systems", "User Research"],
        breakdown: { skills: 84, experience: 82, level: 83, certs: 80 },
        summary: "UI/UX designer with 4 years creating clean, modern web dashboards and mobile experiences.",
        strengths: ["Strong typography and grid discipline", "Quick interactive Figma components", "Positive team attitude"],
        gaps: ["Less formal design system tokenization experience"],
        signal: "Screening Passed — Good visual portfolio.",
        verdict: "moderate_fit" as const,
      },
    },
    {
      job: opsJob,
      firstName: "Kenji",
      lastName: "Sato",
      email: "kenji.sato@cloudtokyo.jp",
      phone: "+1 (415) 778-9900",
      stageName: "Screening Qualified",
      status: "active" as const,
      daysAgo: 2,
      cv: {
        score: 82,
        skills: ["Kubernetes", "Docker", "Linux", "CI/CD"],
        missing: ["Terraform", "AWS"],
        breakdown: { skills: 81, experience: 83, level: 82, certs: 79 },
        summary: "Platform engineer with 4 years managing Docker Swarm and Kubernetes clusters.",
        strengths: ["Strong container troubleshooting", "Hands-on Linux system admin skills", "Reliable on-call demeanor"],
        gaps: ["Transitioning from Ansible to Terraform"],
        signal: "Screening Passed — Solid foundations.",
        verdict: "moderate_fit" as const,
      },
    },

    // --- SCREENING (7 Candidates - Recent applications) ---
    {
      job: primaryJob,
      firstName: "Jessica",
      lastName: "Parker",
      email: "jessica.parker@frontendlab.co",
      phone: "+1 (415) 555-1234",
      stageName: "Screening",
      status: "active" as const,
      daysAgo: 1,
      cv: {
        score: 79,
        skills: ["React", "TypeScript", "TailwindCSS"],
        missing: ["Next.js", "Node.js", "PostgreSQL", "Docker"],
        breakdown: { skills: 78, experience: 80, level: 79, certs: 76 },
        summary: "Frontend engineer with 3 years focusing on modern React components and design system styling.",
        strengths: ["Fast frontend implementation", "Attention to detail", "Modern CSS knowledge"],
        gaps: ["Full-stack backend experience is limited"],
        signal: "Initial Review — Under consideration for mid-level or screening qualification.",
        verdict: "moderate_fit" as const,
      },
    },
    {
      job: primaryJob,
      firstName: "Rohan",
      lastName: "Gupta",
      email: "rohan.gupta@mumbaitech.in",
      phone: "+1 (415) 902-3344",
      stageName: "Screening",
      status: "active" as const,
      daysAgo: 1,
      cv: {
        score: 78,
        skills: ["Node.js", "PostgreSQL", "TypeScript"],
        missing: ["React", "Next.js", "TailwindCSS"],
        breakdown: { skills: 77, experience: 79, level: 78, certs: 75 },
        summary: "Backend Node.js developer with 4 years experience in microservice APIs and PostgreSQL schema design.",
        strengths: ["Strong SQL queries", "Clean REST API development", "Good testing habits"],
        gaps: ["No React frontend experience"],
        signal: "Initial Review — Backend skills strong, assess frontend adaptability.",
        verdict: "moderate_fit" as const,
      },
    },
    {
      job: staffJob,
      firstName: "Sergei",
      lastName: "Petrov",
      email: "sergei.petrov@infraarch.com",
      phone: "+1 (415) 678-9012",
      stageName: "Screening",
      status: "active" as const,
      daysAgo: 2,
      cv: {
        score: 80,
        skills: ["Go", "Docker", "Linux", "AWS"],
        missing: ["Kubernetes", "Kafka", "Distributed Systems"],
        breakdown: { skills: 81, experience: 80, level: 80, certs: 78 },
        summary: "Cloud systems software developer with 5 years experience writing Go tools and services in AWS.",
        strengths: ["Pragmatic code style", "Strong Linux knowledge", "Good unit tests"],
        gaps: ["Staff-level architecture depth needs evaluation"],
        signal: "Initial Review — Solid engineer.",
        verdict: "moderate_fit" as const,
      },
    },
    {
      job: aiJob,
      firstName: "Avery",
      lastName: "Sinclair",
      email: "avery.sinclair@berkeley.edu",
      phone: "+1 (510) 555-9011",
      stageName: "Screening",
      status: "active" as const,
      daysAgo: 1,
      cv: {
        score: 82,
        skills: ["Python", "PyTorch", "Transformers"],
        missing: ["LangChain", "Vector DBs", "RAG"],
        breakdown: { skills: 83, experience: 81, level: 82, certs: 79 },
        summary: "Recent master's graduate in computer science with emphasis on natural language understanding.",
        strengths: ["Cutting-edge research understanding", "Strong mathematical foundation", "Enthusiastic and motivated"],
        gaps: ["No commercial production experience"],
        signal: "Initial Review — High potential junior/mid researcher.",
        verdict: "moderate_fit" as const,
      },
    },
    {
      job: uxJob,
      firstName: "Chloe",
      lastName: "Bennett",
      email: "chloe.bennett@creativestudio.uk",
      phone: "+1 (415) 345-6789",
      stageName: "Screening",
      status: "active" as const,
      daysAgo: 2,
      cv: {
        score: 77,
        skills: ["Figma", "UI/UX"],
        missing: ["Prototyping", "Design Systems", "User Research"],
        breakdown: { skills: 76, experience: 78, level: 77, certs: 74 },
        summary: "Digital designer with 3 years designing marketing websites, landing pages, and email templates.",
        strengths: ["Eye for visual aesthetics", "Fast Figma execution", "Great typography"],
        gaps: ["Complex enterprise application interaction design is limited"],
        signal: "Initial Review — Under consideration.",
        verdict: "weak_fit" as const,
      },
    },
    {
      job: opsJob,
      firstName: "Brandon",
      lastName: "Taylor",
      email: "brandon.taylor@devopsworks.io",
      phone: "+1 (206) 555-3412",
      stageName: "Screening",
      status: "active" as const,
      daysAgo: 1,
      cv: {
        score: 79,
        skills: ["Docker", "Linux", "AWS", "CI/CD"],
        missing: ["Kubernetes", "Terraform", "Prometheus"],
        breakdown: { skills: 78, experience: 80, level: 79, certs: 76 },
        summary: "Systems administrator transitioning into DevOps with 4 years Linux server management.",
        strengths: ["Strong shell scripting", "Dependable maintenance", "Fast troubleshooting"],
        gaps: ["Lacks infrastructure-as-code and container orchestration"],
        signal: "Initial Review — Early stage evaluation.",
        verdict: "moderate_fit" as const,
      },
    },
    {
      job: primaryJob,
      firstName: "Mateo",
      lastName: "Hernandez",
      email: "mateo.hernandez@madridtech.es",
      phone: "+1 (415) 890-5544",
      stageName: "Screening",
      status: "active" as const,
      daysAgo: 2,
      cv: {
        score: 76,
        skills: ["JavaScript", "React", "Node.js"],
        missing: ["TypeScript", "Next.js", "PostgreSQL", "TailwindCSS"],
        breakdown: { skills: 75, experience: 77, level: 76, certs: 73 },
        summary: "Fullstack JavaScript developer with 3 years experience building consumer web applications.",
        strengths: ["Enthusiastic attitude", "Quick prototype builder", "Collaborative team player"],
        gaps: ["No TypeScript or typed language experience"],
        signal: "Initial Review — Needs TypeScript leveling up.",
        verdict: "weak_fit" as const,
      },
    },

    // --- REJECTED (3 Candidates) ---
    {
      job: primaryJob,
      firstName: "Justin",
      lastName: "Beaver",
      email: "justin.b@musiccode.com",
      phone: "+1 (310) 555-0100",
      stageName: "Screening",
      status: "rejected" as const,
      daysAgo: 35,
      cv: {
        score: 58,
        skills: ["HTML", "CSS", "JavaScript"],
        missing: ["React", "Next.js", "TypeScript", "Node.js", "PostgreSQL"],
        breakdown: { skills: 55, experience: 60, level: 58, certs: 55 },
        summary: "Junior web developer with 1 year creating static HTML/CSS brochure websites.",
        strengths: ["Enthusiastic beginner", "Creative design background"],
        gaps: ["Missing all primary requirements for Senior Full-Stack Engineer"],
        signal: "Not Recommended — Significantly below seniority requirements.",
        verdict: "not_recommended" as const,
      },
      hasRejection: true,
      rejectionReason: "Underqualified for senior level role; lacking TypeScript, Next.js, and backend experience.",
    },
    {
      job: staffJob,
      firstName: "Trevor",
      lastName: "Philips",
      email: "trevor@sandyindustries.net",
      phone: "+1 (213) 555-9876",
      stageName: "Team Interviews",
      status: "rejected" as const,
      daysAgo: 22,
      cv: {
        score: 64,
        skills: ["Go", "Linux"],
        missing: ["Kubernetes", "Kafka", "AWS", "Distributed Systems", "PostgreSQL"],
        breakdown: { skills: 62, experience: 68, level: 60, certs: 65 },
        summary: "Generalist systems programmer with background in game modding and small network utilities.",
        strengths: ["Deep low-level debugging intuition"],
        gaps: ["Did not demonstrate scalable architectural thinking during interview"],
        signal: "Not Recommended — Incompatible architectural approach and poor collaboration signals.",
        verdict: "weak_fit" as const,
      },
      hasRejection: true,
      rejectionReason: "Culture and communication misalignment during technical architectural interview.",
    },
    {
      job: aiJob,
      firstName: "Oscar",
      lastName: "Martinez",
      email: "oscar.m@scrantonfinance.org",
      phone: "+1 (570) 555-0199",
      stageName: "Screening",
      status: "rejected" as const,
      daysAgo: 19,
      cv: {
        score: 52,
        skills: ["Python", "Excel"],
        missing: ["PyTorch", "Transformers", "LangChain", "Vector DBs", "RAG"],
        breakdown: { skills: 50, experience: 55, level: 50, certs: 52 },
        summary: "Financial analyst who uses basic Python scripts for spreadsheet automation.",
        strengths: ["Strong quantitative numeracy and financial forecasting"],
        gaps: ["Not a machine learning researcher or engineer"],
        signal: "Not Recommended — Background does not match engineering discipline.",
        verdict: "not_recommended" as const,
      },
      hasRejection: true,
      rejectionReason: "Candidate applied for Principal AI Scientist with finance analyst background.",
    },
  ];

  for (const cData of candidatesData) {
    const stageId = cData.job.stageMap.get(cData.stageName)!;
    const appliedDate = new Date(Date.now() - cData.daysAgo * 24 * 60 * 60 * 1000);

    const insertedCandidate = await db
      .insert(candidates)
      .values({
        jobId: cData.job.id,
        firstName: cData.firstName,
        lastName: cData.lastName,
        email: cData.email,
        phone: cData.phone,
        resumeUrl: "https://pub-demo.r2.dev/sample-resume.pdf",
        currentStageId: stageId,
        status: cData.status,
        appliedAt: appliedDate,
        updatedAt: new Date(appliedDate.getTime() + 1000 * 60 * 60 * 4),
      })
      .returning();
    const candidate = insertedCandidate[0]!;

    // Stage History: record movement through earlier stages up to current
    const stageTemplateNames = [
      "Screening",
      "Screening Qualified",
      "Technical Assessment",
      "Team Interviews",
      "Hiring Manager Review",
      "Offer Extended",
      "Hired",
    ];
    const currentIndex = stageTemplateNames.indexOf(cData.stageName);
    const maxStageIdx = currentIndex >= 0 ? currentIndex : 0;

    for (let sIdx = 0; sIdx <= maxStageIdx; sIdx++) {
      const histStageName = stageTemplateNames[sIdx]!;
      const histStageId = cData.job.stageMap.get(histStageName);
      if (histStageId) {
        const movedDate = new Date(appliedDate.getTime() + sIdx * 3 * 24 * 60 * 60 * 1000);
        await db.insert(candidateStageHistory).values({
          candidateId: candidate.id,
          stageId: histStageId,
          movedBy: primaryUser.id,
          movedAt: movedDate < new Date() ? movedDate : new Date(),
        });
      }
    }

    // Candidate CV Analysis
    await db.insert(candidateCvAnalysis).values({
      candidateId: candidate.id,
      jobId: cData.job.id,
      matchScore: cData.cv.score,
      matchedSkills: cData.cv.skills,
      missingSkills: cData.cv.missing,
      scoreBreakdown: cData.cv.breakdown,
      aiSummary: {
        quickSummary: cData.cv.summary,
        strengths: cData.cv.strengths,
        gaps: cData.cv.gaps,
        hiringSignal: cData.cv.signal,
        verdict: cData.cv.verdict,
      },
      extractedText: `Resume of ${cData.firstName} ${cData.lastName}. Skills: ${cData.cv.skills.join(", ")}. Summary: ${cData.cv.summary}`,
      status: "done",
    });

    // Assessment Attempt if applicable
    if (cData.hasAssessmentAttempt) {
      await db.insert(candidateAssessmentAttempts).values({
        candidateId: candidate.id,
        assessmentId: fsAssessment.id,
        token: `token-${candidate.id}-${Date.now()}`,
        status: "completed",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        startedAt: new Date(appliedDate.getTime() + 2 * 24 * 60 * 60 * 1000),
        completedAt: new Date(appliedDate.getTime() + 2 * 24 * 60 * 60 * 1000 + 35 * 60 * 1000),
        scoreRaw: (cData.scorePct / 100) * 20,
        scoreTotal: 20,
        scorePercentage: cData.scorePct,
        passed: cData.scorePct >= 80,
        candidateNameInput: `${cData.firstName} ${cData.lastName}`,
        candidateEmailInput: cData.email,
      });
    }

    // Interview if applicable
    if (cData.hasInterview) {
      const interviewDate = new Date(appliedDate.getTime() + 5 * 24 * 60 * 60 * 1000);
      const insertedInterview = await db
        .insert(candidateInterviews)
        .values({
          candidateId: candidate.id,
          stageId,
          jobId: cData.job.id,
          eventName: "Technical Architecture & System Design",
          eventType: "virtual",
          meetingUrl: `https://meet.google.com/techflow-${candidate.id}`,
          interviewerId: marcus.id,
          timeSlots: [{ datetime: interviewDate.toISOString(), selected: true }],
          status: "scheduled",
          outcome: cData.interviewOutcome ?? "pending",
          scheduledAt: interviewDate,
          durationMinutes: 60,
          notes: `Conducted technical interview with ${cData.firstName} ${cData.lastName}.`,
          createdBy: primaryUser.id,
        })
        .returning();
      const interview = insertedInterview[0]!;

      // Interview Feedback
      await db.insert(interviewFeedback).values({
        interviewId: interview.id,
        authorId: marcus.id,
        content: `Candidate demonstrated solid understanding of software engineering trade-offs. Code was structured, verified with edge-case consideration, and communication was clear throughout.`,
        rating: cData.interviewOutcome === "pass" ? 5 : 4,
        createdAt: new Date(interviewDate.getTime() + 60 * 60 * 1000),
      });
    }

    // Offer if applicable
    if (cData.hasOffer) {
      const offerDate = new Date(appliedDate.getTime() + 12 * 24 * 60 * 60 * 1000);
      const insertedOffer = await db
        .insert(offers)
        .values({
          candidateId: candidate.id,
          jobId: cData.job.id,
          templateId: offerTemplate.id,
          status: cData.offerStatus,
          salary: cData.offerSalary,
          currency: "USD",
          employmentType: "full_time",
          startDate: "2026-10-01",
          reportingManager: "Marcus Chen",
          benefits: "Comprehensive health/dental/vision, 401(k) matching up to 5%, annual $3,000 learning stipend, home office setup budget.",
          offerLetterHtml: `<p>Formal offer of employment for ${cData.firstName} ${cData.lastName} as ${cData.job.title} with annual compensation of $${cData.offerSalary.toLocaleString()}.</p>`,
          reviewToken: `offer-token-${candidate.id}`,
          sentAt: offerDate,
          acceptedAt: cData.offerStatus === "accepted" ? new Date(offerDate.getTime() + 2 * 24 * 60 * 60 * 1000) : null,
          createdBy: primaryUser.id,
          createdAt: offerDate,
          updatedAt: cData.offerStatus === "accepted" ? new Date(offerDate.getTime() + 2 * 24 * 60 * 60 * 1000) : offerDate,
        })
        .returning();
      const createdOffer = insertedOffer[0]!;

      // Activity entries
      await db.insert(candidateActivities).values([
        {
          candidateId: candidate.id,
          jobId: cData.job.id,
          offerId: createdOffer.id,
          stageId,
          actorId: primaryUser.id,
          eventType: "offer_created",
          metadata: { salary: cData.offerSalary, currency: "USD" },
          createdAt: offerDate,
        },
        {
          candidateId: candidate.id,
          jobId: cData.job.id,
          offerId: createdOffer.id,
          stageId,
          actorId: primaryUser.id,
          eventType: "offer_sent",
          metadata: { sentTo: candidate.email },
          createdAt: new Date(offerDate.getTime() + 1000 * 60),
        },
      ]);

      if (cData.offerStatus === "accepted") {
        await db.insert(candidateActivities).values([
          {
            candidateId: candidate.id,
            jobId: cData.job.id,
            offerId: createdOffer.id,
            stageId,
            actorId: primaryUser.id,
            eventType: "offer_accepted",
            metadata: { acceptedOn: "2026-09-08" },
            createdAt: new Date(offerDate.getTime() + 2 * 24 * 60 * 60 * 1000),
          },
          {
            candidateId: candidate.id,
            jobId: cData.job.id,
            offerId: createdOffer.id,
            stageId,
            actorId: primaryUser.id,
            eventType: "candidate_hired",
            metadata: { effectiveDate: "2026-10-01" },
            createdAt: new Date(offerDate.getTime() + 2 * 24 * 60 * 60 * 1000 + 1000),
          },
        ]);
      }
    }

    // Rejection if applicable
    if (cData.hasRejection) {
      const rejectDate = new Date(appliedDate.getTime() + 4 * 24 * 60 * 60 * 1000);
      await db.insert(candidateRejections).values({
        candidateId: candidate.id,
        jobId: cData.job.id,
        fromStageId: stageId,
        rejectedBy: primaryUser.id,
        reason: cData.rejectionReason,
        internalNote: `Candidate notified via email template. Candidate was evaluated respectfully.`,
        templateId: rejectionTemplate.id,
        emailStatus: "sent",
        sentAt: rejectDate,
        rejectedAt: rejectDate,
      });
    }
  }

  // 10. Public Page Settings
  console.log("⚙️ Seeding public page settings...");
  await db.insert(pageSettings).values({
    allowedOrigins: [
      "http://localhost:3000",
      "http://localhost:8080",
      "https://job-match-ai-frontend.vercel.app",
    ],
  });

  console.log("\n==================================================");
  console.log("✅ COMPREHENSIVE SEED FINISHED SUCCESSFULLY!");
  console.log(`- Seeded 1 Company: TechFlow Innovations`);
  console.log(`- Seeded ${deptNames.length} Departments`);
  console.log(`- Seeded ${seededUsers.length} Users (including demo@jobmatch-ai.dev)`);
  console.log(`- Seeded 7 Pipeline Stage Templates`);
  console.log(`- Seeded 4 Templates (Offers, Confirmations, Rejections, Interviews)`);
  console.log(`- Seeded 3 Assessments with Question Banks`);
  console.log(`- Seeded ${jobsData.length} Realistic Jobs`);
  console.log(`- Seeded ${candidatesData.length} Candidates with AI CV Analysis, Interviews & Offers`);
  console.log("==================================================\n");

  await pool.end();
  process.exit(0);
}

seed().catch(async (err) => {
  logger.error("Seed execution failed:", err);
  console.error(err);
  await pool.end();
  process.exit(1);
});

