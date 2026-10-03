// All site content (profile, stats, stack, projects, experience) lives here. Section labels and button text live in render.ts.

export type Link = { label: string; href: string };
export type Metric = { value: string; label: string };
export type Stat = { value: number; prefix?: string; suffix?: string; label: string };
export type Job = { company: string; role: string; period: string; summary: string };
export type Project = {
  title: string;
  org: string;
  tagline: string;
  problem: string;
  solution: string;
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
    title: "Sprint biomechanics from match video",
    org: "FitWise AI · 2026 — now",
    tagline: "A computer-vision pipeline that turns ordinary match footage into 34 biomechanics metrics per gait cycle.",
    problem:
      "Coaches and sports scientists wanted sprint biomechanics without markers or a lab — straight from match video, and fast enough to act on the same day.",
    solution:
      "A multi-stage pipeline: player detection and tracking, per-frame 3D human body reconstruction with PyTorch and a parametric body model, gait-cycle segmentation aligned to toe-off, then 34 metrics per cycle. Long-lived inference workers load model weights once (~2.4 GiB each), so 30 of them share a single host. Results land in PostgreSQL as queryable per-cycle data. Co-inventor on the patent for the method.",
    metrics: [
      { value: "<3 min", label: "from upload to athlete insights" },
      { value: "20k+", label: "plays processed per day" },
      { value: "20M+", label: "biomechanics samples stored" },
    ],
    stack: ["PyTorch", "Computer vision", "3D reconstruction", "Celery", "RabbitMQ", "PostgreSQL", "GCP"],
    links: [],
  },
  {
    title: "LLM underwriting copilot",
    org: "Nexa Product Labs · 2023 — 2026",
    tagline: "RAG plus a tool-calling agent that drafts credit-review recommendations for risk analysts.",
    problem:
      "Manual credit reviews were slow: for every application analysts dug through credit policies, bureau reports and past cases by hand.",
    solution:
      "RAG over credit policies and historical cases with pgvector, hybrid keyword + embedding search and re-ranking; structured JSON outputs validated against Pydantic schemas before they reach the decision engine. A tool-calling agent reaches applicant profiles, bureau reports and score explanations through internal APIs exposed as an MCP server — with guardrails, PII redaction and mandatory human approval.",
    metrics: [
      { value: "−52%", label: "review handling time" },
      { value: "50–70k", label: "requests/day on the platform" },
    ],
    stack: ["OpenAI", "Anthropic", "RAG", "pgvector", "MCP", "Pydantic", "FastAPI"],
    links: [],
  },
  {
    title: "Document intelligence with an eval gate",
    org: "Nexa Product Labs · 2023 — 2026",
    tagline: "Schema-validated extraction from bank statements, payslips and IDs — protected by a CI quality gate.",
    problem:
      "The scoring engine needed reliable fields from messy documents, and every prompt or model change risked silently degrading quality.",
    solution:
      "Extraction workflows return schema-validated fields and route low-confidence ones to human review. An evaluation framework over a 1,700-case golden set plus sampled production traces measures field-level accuracy, retrieval recall@k and LLM-as-judge groundedness calibrated against analyst ratings. A CI regression gate blocks prompt or model changes that lower quality, and eval results drive model routing — simpler cases go to a smaller model.",
    metrics: [
      { value: "96%", label: "field-level accuracy" },
      { value: "1,700", label: "labeled golden cases" },
      { value: "−45%", label: "AI cost per case at 3.8 s p95" },
    ],
    stack: ["LLMs", "Structured outputs", "Pydantic", "Langfuse", "OpenTelemetry", "CI/CD"],
    links: [],
  },
  {
    title: "Fleet-scale CPU inference tuning",
    org: "FitWise AI · 2026 — now",
    tagline: "Why 30 inference workers on 80 vCPUs were crawling — and how they got 30–40% faster.",
    problem:
      "Throughput stalled under full production load while the historical catalog was being reprocessed: load average hit ~837 on an 80-core GCP instance.",
    solution:
      "Traced it to PyTorch thread oversubscription — every worker spinning up a full-width intra-op pool. Tuned OMP/MKL and PyTorch thread pools per worker, moved workers to SSD persistent disks to remove I/O stalls, and kept RabbitMQ late acks, retries and backoff so no play was lost mid-run.",
    metrics: [
      { value: "+30–40%", label: "inference throughput" },
      { value: "~68k", label: "plays reprocessed in ~3 days" },
      { value: "30", label: "workers on a single host" },
    ],
    stack: ["PyTorch", "Profiling", "Celery", "RabbitMQ", "Docker", "GCP"],
    links: [],
  },
  {
    title: "DocuQuery RAG agent",
    org: "Open source",
    tagline: "A strictly grounded RAG microservice: cited answers, or a deterministic refusal.",
    problem:
      "Naive RAG hallucinates, stuffs whole documents into the prompt and produces answers nobody can audit.",
    solution:
      "A clean-architecture FastAPI service: multi-format ingestion (PDF, DOCX, XLSX, CSV, HTML, Markdown) with token sliding-window chunking, ChromaDB retrieval with a score threshold, and a fast-path refusal that never calls the LLM when nothing relevant is found. A token-budget manager packs chunks under a hard ceiling, every answer carries source citations, responses stream over SSE, and every query lands in an audit trail.",
    metrics: [
      { value: "160", label: "tests passing" },
      { value: "6", label: "document formats" },
      { value: "0", label: "LLM calls on a refusal" },
    ],
    stack: ["Python", "FastAPI", "ChromaDB", "OpenAI", "SSE", "Docker"],
    links: [{ label: "Code", href: "https://github.com/Yasinyan23/rag-agent" }],
  },
  {
    title: "AI moderation API",
    org: "Open source",
    tagline: "Bring-your-own-key content moderation across Claude, GPT-4o and Gemini.",
    problem:
      "Apps need moderation without handing their AI spend — or their API keys — to a third party, and without paying for inference on users who are already banned.",
    solution:
      "One provider interface with Claude, OpenAI and Gemini implementations resolved per request. Provider keys are encrypted with Fernet and decrypted only inside the request. JWT access tokens are hashed into a server-side session table, so logout really revokes them. A five-strike pipeline flags repeat offenders, and flagged users are blocked before any AI call is made.",
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
