// All site content (profile, stats, stack, projects, experience) lives here. Section labels and button text live in render.ts.

export type Link = { label: string; href: string };
export type Metric = { value: string; label: string };
export type Stat = { value: number; prefix?: string; suffix?: string; label: string };
export type Job = { company: string; role: string; period: string; summary: string };
export type Project = {
  title: string;
  org: string;
  summary: string;
  highlights: string[];
  metrics: Metric[];
  stack: string[];
  links: Link[];
};

export const profile = {
  name: "Khachatur Pepanyan",
  role: "Senior AI Engineer",
  headline: "I take AI from research prototype to production.",
  intro:
    "Computer vision, 3D motion reconstruction, LLMs, RAG and agents — built to survive real traffic. 8+ years of shipping software, 4+ of them in production AI.",
  email: "pepaniank@gmail.com",
  cv: "/Khachatur_Pepanyan_CV.pdf",
  terminal: [
    "$ whoami",
    "khachatur — senior ai engineer",
    "$ cat focus.txt",
    "computer vision · llm systems · inference at scale",
    "$ leetcode --rank",
    "#229 global · 3,276 solved · 783 hard",
  ],
  about: [
    "I'm a Senior AI Engineer with 8+ years in software and 4+ years building production AI — computer vision, 3D human motion reconstruction, LLMs, RAG and tool-calling agents. I enjoy the half of AI that decides whether a model survives real traffic: evaluation, inference optimization, serving and observability.",
    "Today I own the end-to-end production AI systems at FitWise AI that turn match video into biomechanics insights. Before that I led a team of 5–7 engineers building LLM-powered credit decisioning in fintech. I keep my algorithms sharp on LeetCode, where I'm ranked #229 globally.",
  ],
  facts: [
    {
      label: "Patent",
      text: "Co-inventor — System and Method for Automated Sprint Biomechanics Assessment of Athletes from Reconstructed Three-Dimensional Body Motion",
    },
    { label: "Education", text: "M.Sc. Computer Engineering — Rheinberg Technical University, Germany" },
  ],
  contactNote: "Have a role or a hard problem in mind? Email or Telegram is the fastest way to reach me.",
  socials: [
    { label: "LinkedIn", href: "https://www.linkedin.com/in/yasinyan23pydev/" },
    { label: "GitHub", href: "https://github.com/Yasinyan23" },
    { label: "Telegram", href: "https://t.me/yasinyan23" },
    { label: "LeetCode", href: "https://leetcode.com/u/KhachaturPepanian/" },
  ] satisfies Link[],
};

export const stats: Stat[] = [
  { value: 229, prefix: "#", label: "LeetCode global rank" },
  { value: 3276, label: "LeetCode problems solved" },
  { value: 20, suffix: "k+", label: "plays/day through my CV pipeline" },
  { value: 8, suffix: "+", label: "years shipping software" },
];

export const stack: string[] = [
  "Python",
  "PyTorch",
  "FastAPI",
  "RabbitMQ",
  "Celery",
  "PostgreSQL",
  "pgvector",
  "Docker",
  "GCP",
  "RAG",
  "Tool calling",
  "MCP",
  "Computer vision",
  "3D reconstruction",
  "LLM evaluation",
  "OpenTelemetry",
  "Langfuse",
];

export const projects: Project[] = [
  {
    title: "Production Computer Vision & 3D Biomechanics Pipeline",
    org: "FitWise AI · Computer Vision · PyTorch · Production AI",
    summary:
      "An end-to-end computer-vision pipeline that transforms sports match video into 3D human motion reconstruction and actionable biomechanics insights: player detection and tracking, per-frame body reconstruction, gait-cycle segmentation and 34 biomechanics metrics per cycle.",
    highlights: [
      "Evaluated, selected and fine-tuned computer-vision models for production inference.",
      "Built preprocessing and postprocessing workflows for frames, player crops, keypoints, temporal smoothing and gait-phase detection.",
      "Integrated model output into downstream analytics and product APIs.",
      "Co-inventor on the patent for automated sprint biomechanics assessment from reconstructed 3D body motion.",
    ],
    metrics: [
      { value: "<3 min", label: "from video upload to athlete insights" },
      { value: "34", label: "biomechanics metrics per gait cycle" },
    ],
    stack: ["Computer Vision", "PyTorch", "Deep Learning", "3D Human Motion Reconstruction", "Model Evaluation"],
    links: [],
  },
  {
    title: "Tool-Calling AI Agent for Credit Reviews",
    org: "Nexa Product Labs · AI Agents · MCP · Workflow Automation",
    summary:
      "A tool-calling AI agent for manual credit reviews that pulls applicant profiles, bureau reports, score explanations and credit-policy retrieval through internal APIs exposed via an MCP server.",
    highlights: [
      "Implemented tool calling, policy retrieval, recommendation drafting, guardrails and PII redaction.",
      "Added mandatory human approval to keep credit decisions under human control.",
      "Integrated agent workflows into existing credit-decisioning processes.",
    ],
    metrics: [
      { value: "−52%", label: "manual-review handling time" },
      { value: "100%", label: "of decisions signed off by a human" },
    ],
    stack: ["AI Agents", "Tool Calling", "MCP", "LLM Engineering", "Prompt Engineering", "API Integration"],
    links: [],
  },
  {
    title: "Scalable AI Inference & Model Serving",
    org: "FitWise AI · Model Serving · GCP · Distributed Processing",
    summary:
      "Asynchronous inference infrastructure for production computer-vision workloads: long-lived PyTorch inference workers with Celery, RabbitMQ, Docker Compose and Google Cloud.",
    highlights: [
      "Scaled processing to 30 inference workers on an 80-vCPU GCP instance.",
      "Implemented retries, backoff, processing status, recovery and reprocessing mechanisms.",
      "Optimized worker memory usage and model lifecycle for sustained production workloads.",
    ],
    metrics: [
      { value: "20k+", label: "plays processed per day" },
      { value: "~68k", label: "historical plays reprocessed in ~3 days" },
      { value: "30", label: "inference workers on one 80-vCPU host" },
    ],
    stack: ["Model Serving", "Inference Optimization", "Python", "Celery", "RabbitMQ", "GCP"],
    links: [],
  },
  {
    title: "Document Intelligence & LLM Evaluation Framework",
    org: "Nexa Product Labs · Document AI · Evaluation · Production LLMs",
    summary:
      "Document-understanding and LLM evaluation workflows for financial underwriting, combining schema-validated extraction with labeled test datasets, production traces and automated regression checks.",
    highlights: [
      "Extracted structured fields from bank statements, payslips and identity documents; routed low-confidence fields to human review.",
      "Built an evaluation framework around 1,700 labeled cases and sampled production traces.",
      "Measured field-level accuracy, retrieval recall@k and groundedness calibrated against analyst ratings.",
      "Added CI regression gates and production drift monitoring.",
      "Optimized model routing to cut AI cost per case while keeping 3.8-second p95 latency.",
    ],
    metrics: [
      { value: "96%", label: "field-level accuracy on a held-out set" },
      { value: "1,700", label: "labeled evaluation cases" },
      { value: "−45%", label: "AI cost per case" },
    ],
    stack: ["Document Intelligence", "LLM Evaluation", "RAG", "Model Benchmarking", "OpenAI API", "Anthropic API", "Langfuse"],
    links: [],
  },
  {
    title: "AI Inference Optimization & Biomechanics Analytics",
    org: "FitWise AI · Performance Engineering · AI Evaluation",
    summary:
      "Optimized CPU-based inference and turned 3D motion model outputs into validated, queryable biomechanics data for athlete-level analytics, cohort comparisons and left/right asymmetry analysis.",
    highlights: [
      "Diagnosed PyTorch thread oversubscription under production load and tuned OMP/MKL and PyTorch thread pools.",
      "Optimized worker I/O with SSD persistent disks.",
      "Built validation workflows comparing new per-cycle metrics with legacy output — zero mismatches on production data.",
      "Developed completeness logging and human-in-the-loop review workflows for model output.",
    ],
    metrics: [
      { value: "+30–40%", label: "inference throughput" },
      { value: "0", label: "mismatches against legacy metrics" },
      { value: "20M+", label: "metric samples in PostgreSQL" },
    ],
    stack: ["Inference Optimization", "Model Evaluation", "Performance Optimization", "PostgreSQL", "AI Quality Assurance"],
    links: [],
  },
  {
    title: "LLM-Powered Credit Decisioning Platform",
    org: "Nexa Product Labs · LLM Engineering · FinTech",
    summary:
      "Led AI and backend engineering for high-volume credit-decisioning workflows, introducing LLM-powered underwriting alongside scalable Python/FastAPI services.",
    highlights: [
      "Built LLM features on OpenAI and Anthropic models: RAG over credit policies and historical cases, pgvector, hybrid search and re-ranking.",
      "Integrated structured JSON outputs validated with Pydantic schemas into decision workflows.",
      "Helped increase platform throughput by approximately 45%.",
    ],
    metrics: [
      { value: "−80%", label: "overall decision time" },
      { value: "60%+", label: "fewer manual reviews" },
      { value: "50–70k", label: "requests per day" },
    ],
    stack: ["LLMs", "RAG", "Python", "FastAPI", "pgvector", "Distributed Systems"],
    links: [],
  },
  {
    title: "DocuQuery RAG Agent",
    org: "Open source · RAG · FastAPI",
    summary:
      "A strictly grounded RAG microservice: every answer carries source citations, or the service returns a deterministic refusal.",
    highlights: [
      "Multi-format ingestion (PDF, DOCX, XLSX, CSV, HTML, Markdown) with token sliding-window chunking.",
      "Score-thresholded ChromaDB retrieval and a fast-path refusal that never calls the LLM when nothing relevant is found.",
      "Token-budget manager packs chunks under a hard ceiling; SSE streaming, full async I/O and a SQLite audit trail.",
      "Clean architecture with dependency inversion, covered by 160 tests in CI.",
    ],
    metrics: [
      { value: "160", label: "tests passing" },
      { value: "6", label: "document formats" },
      { value: "0", label: "LLM calls on a refusal" },
    ],
    stack: ["Python", "FastAPI", "ChromaDB", "OpenAI", "SSE", "Docker"],
    links: [{ label: "Code", href: "https://github.com/Yasinyan23/rag-agent" }],
  },
  {
    title: "AI Moderation API",
    org: "Open source · LLM APIs · Security",
    summary:
      "Bring-your-own-key content moderation across Claude, GPT-4o and Gemini, with a persistent strike pipeline for repeat offenders.",
    highlights: [
      "One provider interface with Claude, OpenAI and Gemini implementations resolved per request.",
      "Provider API keys encrypted with Fernet and decrypted only inside the request cycle.",
      "JWT access tokens hashed into a server-side session table, so logout really revokes them.",
      "Flagged users are blocked before any AI call is made.",
    ],
    metrics: [
      { value: "3", label: "AI providers behind one interface" },
      { value: "5", label: "strikes to a permanent flag" },
      { value: "0", label: "tokens spent on flagged users" },
    ],
    stack: ["Python", "FastAPI", "SQLAlchemy", "PostgreSQL", "Docker", "Claude", "Gemini"],
    links: [{ label: "Code", href: "https://github.com/Yasinyan23/ai-moderation-api" }],
  },
];

export const jobs: Job[] = [
  {
    company: "FitWise AI",
    role: "Senior AI Software Engineer — AI Platform & Product",
    period: "Feb 2026 — Present",
    summary:
      "Own the production AI systems that turn match video into biomechanics insights: CV models, 3D body reconstruction, serving on 30 inference workers, 20k+ plays/day. Patent co-inventor.",
  },
  {
    company: "Nexa Product Labs",
    role: "Team Lead / Senior Software Engineer — AI & Full-Stack Products",
    period: "Sep 2023 — Jan 2026",
    summary:
      "Led 5–7 engineers on fintech credit decisioning: LLM underwriting with RAG and agents, 50–70k requests/day, decision time −80%, manual reviews −60%.",
  },
  {
    company: "EPAM Systems",
    role: "Senior Software Engineer",
    period: "Jul 2021 — Oct 2023",
    summary:
      "Enterprise e-commerce on Python, Java and React: request execution time −30%, time to detect and resolve production errors −50%.",
  },
  {
    company: "BrightLayer Technologies",
    role: "Software Engineer — Python & Web Applications",
    period: "Apr 2019 — Jul 2021",
    summary:
      "Distributed backends for transport analytics and forecasting: calculation runtime −20%, manual reporting −40%, migration from legacy components to microservices.",
  },
];
