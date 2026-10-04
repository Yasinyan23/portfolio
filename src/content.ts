import type { Icon } from "./svg";

// All site content (profile, stats, stack, projects, experience) lives here. Section labels and button text live in render.ts.

export type Link = { label: string; href: string };
export type Metric = { value: string; label: string };
export type Stat = { value: number; prefix?: string; suffix?: string; label: string };
export type Job = {
  company: string;
  role: string;
  period: string;
  start: string; // YYYY-MM
  end?: string; // YYYY-MM, absent = current role
  summary: string;
  chips: string[];
  stack: string[];
};
// case-study architecture: nodes on a 5-column grid, links carry a looping glyph
export type Diagram = {
  nodes: [id: string, label: string, col: number, row: number][];
  edges: [from: string, to: string, icon?: Icon, mode?: "both" | "fix" | "bad" | "L" | "ops"][];
};

export type Project = {
  title: string;
  org: string;
  summary: string;
  details: string[];
  diagram: Diagram;
  highlights: string[];
  metrics: Metric[];
  stack: string[];
  links: Link[];
};

export const profile = {
  name: "Khachatur Pepanyan",
  role: "Senior AI Engineer",
  availability: "Open to offers · remote · hybrid · on-site · relocation",
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
    "I'm a Senior AI Engineer with 8+ years in software and 4+ years building production AI — computer vision, 3D human motion reconstruction, LLMs, RAG and tool-calling agents. My focus is evaluation, inference optimization, serving and observability.",
    "Today I own the end-to-end production AI systems at FitWise AI that turn match video into biomechanics insights. Before that I led a team of 5–7 engineers building LLM-powered credit decisioning in fintech. I keep my algorithms sharp on LeetCode, where I'm ranked #229 globally.",
  ],
  facts: [
    {
      label: "Patent",
      text: "Co-inventor — System and Method for Automated Sprint Biomechanics Assessment of Athletes from Reconstructed Three-Dimensional Body Motion",
    },
    { label: "Education", text: "M.Sc. Computer Engineering — Rheinberg Technical University, Germany" },
  ],
  // word groups for the About "attention" hover; words compare lowercase, punctuation stripped
  attention: [
    ["ai", "llms", "rag", "tool-calling", "agents", "llm-powered", "evaluation", "model"],
    ["computer", "vision", "3d", "human", "motion", "reconstruction", "video", "biomechanics", "match"],
    ["production", "traffic", "inference", "optimization", "serving", "observability", "survives", "systems"],
    ["led", "team", "engineers", "5–7"],
    ["leetcode", "algorithms", "#229", "ranked", "globally"],
  ],
  quote: "The half of AI I love is the one that decides whether a model survives real traffic.",
  now: "Turning match video into 3D biomechanics insights at FitWise AI.",
  leetcode: { rank: 229, solved: 3276, hard: 783, hardTotal: 979 },
  principles: [
    { title: "Measure before optimizing", text: "Profiling an 80-core fleet at load average 837 found the real bottleneck — and a 30–40% throughput gain." },
    { title: "Evals before prompts", text: "A 1,700-case golden set and a CI gate decide whether a prompt or model change ships." },
    { title: "Humans stay in the loop", text: "Agents draft, analysts decide; low-confidence fields go to people, not downstream." },
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
  { value: 20, suffix: "k+", label: "plays/day through my computer-vision pipeline" },
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
    details: [
      "The platform turns ordinary match footage into biomechanics insights. Each play passes through player detection and tracking, per-frame 3D human body reconstruction with PyTorch and a parametric body model, gait-cycle segmentation aligned to toe-off, and 34 metrics per cycle across 5 gait phases and both legs.",
      "Models were evaluated, selected and fine-tuned for production, balancing accuracy against latency and CPU/memory limits, with weights and checkpoints versioned across releases. Pre- and post-processing — frame extraction, player cropping, keypoint filtering, temporal smoothing, toe-off detection — directly lifts metric quality, and research prototypes from biomechanics scientists move into backend services while the domain formulas stay owned by the experts.",
    ],
    diagram: {
      nodes: [["video", "Match video", 0, 0], ["track", "Detect + track", 1, 0], ["recon", "3D body model", 2, 0], ["gait", "Gait cycles", 3, 0], ["metrics", "34 metrics/cycle", 4, 0], ["pg", "Postgres · 20M+", 4, 1], ["api", "Product API", 3, 1], ["sci", "Domain formulas", 2, 1]],
      edges: [["video", "track", "file"], ["track", "recon", "file"], ["recon", "gait", "box"], ["gait", "metrics", "chart"], ["sci", "metrics", "file", "L"], ["metrics", "pg", "chart"], ["pg", "api", "chart"]],
    },
    highlights: [
      "Evaluated, selected and fine-tuned computer-vision models for production inference.",
      "Built preprocessing and postprocessing workflows for frames, player crops, keypoints, temporal smoothing and gait-phase detection.",
      "Integrated model output into downstream analytics and product APIs.",
      "Co-inventor on the patent for automated sprint biomechanics assessment from reconstructed 3D body motion.",
    ],
    metrics: [
      { value: "<3 min", label: "from video upload to athlete insights" },
      { value: "34", label: "biomechanics metrics per gait cycle" },
      { value: "340", label: "values stored per gait cycle" },
    ],
    stack: ["Computer Vision", "PyTorch", "Deep Learning", "3D Human Motion Reconstruction", "Model Evaluation"],
    links: [],
  },
  {
    title: "Tool-Calling AI Agent for Credit Reviews",
    org: "Nexa Product Labs · AI Agents · MCP · Workflow Automation",
    summary:
      "A tool-calling AI agent for manual credit reviews that pulls applicant profiles, bureau reports, score explanations and credit-policy retrieval through internal APIs exposed via an MCP server.",
    details: [
      "Analysts reviewing applications by hand had to pull applicant profiles, bureau reports, score explanations and policy text from different systems. The agent does that legwork through internal APIs exposed as an MCP server — 20 services in total — and drafts a recommendation backed by the relevant policy.",
      "Guardrails, PII redaction and mandatory human approval keep the analyst in control: the agent proposes, a person decides. Drafting a recommendation went from about 2.5 minutes to about 20 seconds, and manual-review handling time fell by 52%.",
    ],
    diagram: {
      nodes: [["analyst", "Risk analyst", 0, 1], ["agent", "Agent", 1, 1], ["mcp", "MCP server", 2, 1], ["prof", "Profiles", 3, 0], ["bureau", "Bureau reports", 3, 1], ["score", "Score reasons", 3, 2], ["policy", "Policies · RAG", 2, 0], ["guard", "Guardrails · PII", 1, 2], ["human", "Human approval", 0, 2]],
      edges: [["analyst", "agent", "file"], ["agent", "mcp", "file", "both"], ["mcp", "prof", "file", "both"], ["mcp", "bureau", "file", "both"], ["mcp", "score", "file", "both"], ["agent", "policy", "file", "both"], ["agent", "guard", "code"], ["guard", "human", "check"]],
    },
    highlights: [
      "Implemented tool calling, policy retrieval, recommendation drafting, guardrails and PII redaction.",
      "Added mandatory human approval to keep credit decisions under human control.",
      "Integrated agent workflows into existing credit-decisioning processes.",
    ],
    metrics: [
      { value: "−52%", label: "manual-review handling time" },
      { value: "20", label: "internal services wired to the agent" },
      { value: "20 s", label: "per recommendation, down from 2.5 min" },
    ],
    stack: ["AI Agents", "Tool Calling", "MCP", "LLM Engineering", "Prompt Engineering", "API Integration"],
    links: [],
  },
  {
    title: "Scalable AI Inference & Model Serving",
    org: "FitWise AI · Model Serving · GCP · Distributed Processing",
    summary:
      "Asynchronous inference infrastructure for production computer-vision workloads: long-lived PyTorch inference workers with Celery, RabbitMQ, Docker Compose and Google Cloud.",
    details: [
      "Long-lived PyTorch workers load model weights once and reuse them across tasks, keeping memory around 2.4 GiB per worker so 30 workers fit on a single 80-vCPU GCP host. Work flows through Celery and RabbitMQ with late acknowledgements, retries and backoff.",
      "Per-play processing status, bounded connection pools between inference services and recovery tooling made it possible to reprocess the entire historical catalog — about 68k plays — in roughly 3 days while sustaining 20k+ plays per day. Builds ship through Docker Compose, GitLab CI and Google Artifact Registry.",
    ],
    diagram: {
      nodes: [["videos", "Match videos", 0, 1], ["queue", "RabbitMQ", 1, 1], ["w1", "Worker 1", 2, 0], ["w2", "Worker 2", 2, 1], ["w30", "Worker 30", 2, 2], ["pg", "PostgreSQL", 3, 1], ["out", "Athlete insights", 4, 1]],
      edges: [["videos", "queue", "file"], ["queue", "w1", "file"], ["queue", "w2", "file"], ["queue", "w30", "file"], ["w30", "queue", "fix", "fix"], ["w1", "pg", "chart"], ["w2", "pg", "chart"], ["w30", "pg", "chart"], ["pg", "out", "chart"]],
    },
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
    details: [
      "Underwriting depends on fields buried in bank statements, payslips and ID documents. Extraction returns schema-validated fields for the scoring engine, and low-confidence fields go to human review instead of silently flowing downstream — 96% field-level accuracy on a held-out labeled set.",
      "Quality is guarded by an evaluation framework: a 1,700-case golden set plus sampled production traces, measuring field-level accuracy, retrieval recall@k and LLM-as-judge groundedness calibrated against analyst ratings. A CI gate blocks prompt or model changes that lower quality, and eval results drove routing simple cases to a smaller model — 45% lower AI cost per case at 3.8 s p95.",
    ],
    diagram: {
      nodes: [["docs", "Documents", 0, 0], ["extract", "LLM extractor", 1, 0], ["schema", "Schema check", 2, 0], ["scoring", "Scoring engine", 3, 0], ["human", "Human review", 2, 1], ["traces", "Prod traces", 0, 1], ["router", "Model router", 1, 1], ["golden", "Golden set 1,700", 0, 2], ["evals", "Eval suite", 1, 2], ["gate", "CI gate", 2, 2], ["ship", "Ship ✓", 3, 2]],
      edges: [["docs", "extract", "file"], ["extract", "schema", "code"], ["schema", "scoring", "check"], ["schema", "human", "file", "fix"], ["human", "scoring", "check"], ["golden", "evals", "file"], ["traces", "evals", "file"], ["evals", "gate", "chart"], ["gate", "ship", "check"], ["evals", "router", "chart"], ["router", "extract", "bolt", "L"]],
    },
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
    details: [
      "Under full production load the inference fleet stalled: load average hit ~837 on 80 cores. The cause was PyTorch thread oversubscription — every worker spinning up full-width OMP/MKL and intra-op pools. Tuning thread pools per worker and moving to SSD persistent disks gave a 30–40% throughput gain.",
      "Correctness got the same attention as speed: a value-for-value comparison of the new per-cycle metrics path against the legacy implementation on production data matched 100%, completeness logging exposes undetected gait phases, and annotators review model output in a human-in-the-loop workflow. Up to 340 values per gait cycle land in PostgreSQL — 20M+ samples for baselines, cohort comparisons and left/right asymmetry.",
    ],
    diagram: {
      nodes: [["workers", "30 × 80 threads", 0, 0], ["load", "Load avg 837", 1, 0], ["pools", "Thread pools", 2, 0], ["ssd", "SSD disks", 3, 0], ["fast", "+30–40% speed", 4, 0], ["new", "New metrics path", 0, 1], ["cmp", "vs legacy path", 1, 1], ["legacy", "Legacy output", 1, 2], ["match", "100% match ✓", 2, 1], ["pg", "Postgres · 20M+", 3, 1], ["cohort", "Cohorts · L/R", 4, 1]],
      edges: [["workers", "load", "bug", "bad"], ["load", "pools", "fix", "fix"], ["pools", "ssd", "box"], ["ssd", "fast", "chart"], ["new", "cmp", "chart"], ["legacy", "cmp", "chart"], ["cmp", "match", "check"], ["match", "pg", "chart"], ["pg", "cohort", "chart"]],
    },
    highlights: [
      "Diagnosed PyTorch thread oversubscription under production load and tuned OMP/MKL and PyTorch thread pools.",
      "Optimized worker I/O with SSD persistent disks.",
      "Built validation workflows comparing new per-cycle metrics with legacy output — zero mismatches on production data.",
      "Developed completeness logging and human-in-the-loop review workflows for model output.",
    ],
    metrics: [
      { value: "+30–40%", label: "inference throughput" },
      { value: "100%", label: "match with legacy metrics on production data" },
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
    details: [
      "High-volume credit decisioning ran on Python/FastAPI microservices with RabbitMQ, sustaining 50–70k requests per day. Automating scoring and decision steps cut overall decision time by about 80% and manual reviews by more than 60%, while throughput grew by about 45% without SLA degradation.",
      "On top of the platform came LLM-powered underwriting: RAG over credit policies and historical cases with pgvector, hybrid keyword + embedding search and re-ranking, with structured JSON outputs validated against Pydantic schemas before reaching the decision engine. I led a team of 5–7 engineers through it, including migrating legacy data and services without interrupting the business.",
    ],
    diagram: {
      nodes: [["apps", "Applications", 0, 1], ["api", "FastAPI services", 1, 1], ["mq", "RabbitMQ", 2, 1], ["scoring", "Scoring", 3, 1], ["decision", "Decision engine", 4, 1], ["kb", "Policies + cases", 1, 0], ["rag", "RAG · pgvector", 2, 0], ["llm", "LLM underwriting", 3, 0], ["json", "Pydantic JSON", 4, 0], ["fast", "−80% time", 4, 2]],
      edges: [["apps", "api", "file"], ["api", "mq", "file"], ["mq", "scoring", "file"], ["scoring", "decision", "chart"], ["kb", "rag", "folder"], ["rag", "llm", "folder"], ["llm", "json", "code", "L"], ["json", "decision", "check"], ["decision", "fast", "chart"]],
    },
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
    details: [
      "Naive RAG fails in production in three ways: hallucinated answers, unbounded token costs and answers nobody can audit. DocuQuery handles all three by design — a similarity threshold with a fast-path refusal (the LLM is never called when nothing relevant is found), a token-budget manager that packs the best chunks under a hard ceiling, and mandatory source citations.",
      "It ingests PDF, DOCX, XLSX, CSV, HTML and Markdown with section-aware citations, streams answers over SSE, keeps all I/O async and logs every query to an audit trail. Clean architecture keeps storage and LLM providers swappable, and 160 tests run in CI.",
    ],
    diagram: {
      nodes: [["files", "PDF, DOCX, XLSX", 0, 0], ["chunk", "Token chunker", 1, 0], ["embed", "Embeddings", 2, 0], ["chroma", "ChromaDB", 3, 0], ["q", "Question", 0, 1], ["retrieve", "Retrieve top-k", 1, 1], ["thresh", "Score threshold", 2, 1], ["budget", "Token budget", 3, 1], ["answer", "Cited answer", 4, 1], ["refuse", "Refuse · no LLM", 2, 2], ["audit", "Audit log", 4, 2]],
      edges: [["files", "chunk", "file"], ["chunk", "embed", "file"], ["embed", "chroma", "box"], ["q", "retrieve", "file"], ["chroma", "retrieve", "folder"], ["retrieve", "thresh", "folder"], ["thresh", "budget", "folder"], ["budget", "answer", "code"], ["thresh", "refuse", "file", "bad"], ["answer", "audit", "chart"]],
    },
    highlights: [
      "Multi-format ingestion (PDF, DOCX, XLSX, CSV, HTML, Markdown) with token sliding-window chunking.",
      "Score-thresholded ChromaDB retrieval and a fast-path refusal that never calls the LLM when nothing relevant is found.",
      "Token-budget manager packs chunks under a hard ceiling; SSE streaming, full async I/O and a SQLite audit trail.",
      "Clean architecture with dependency inversion, covered by 160 tests in CI.",
    ],
    metrics: [
      { value: "160", label: "tests passing" },
      { value: "~4 s", label: "end-to-end answer time" },
      { value: "−40%", label: "prompt tokens via context budget" },
    ],
    stack: ["Python", "FastAPI", "ChromaDB", "OpenAI", "SSE", "Docker"],
    links: [{ label: "Code", href: "https://github.com/Yasinyan23/rag-agent" }],
  },
  {
    title: "AI Moderation API",
    org: "Open source · LLM APIs · Security",
    summary:
      "Bring-your-own-key content moderation across Claude, GPT-4o and Gemini, with a persistent strike pipeline for repeat offenders.",
    details: [
      "Apps send a user ID and a message; the service returns a verdict from the customer's own connected provider — Claude, GPT-4o or Gemini — behind one interface. Provider keys are encrypted with Fernet and decrypted only inside the request, and access tokens are hashed into a server-side session table so logout truly revokes them.",
      "A strike pipeline tracks repeat offenders per app and user: after five strikes the user is permanently flagged and blocked before any AI call, so they cost zero tokens. Separate tables keep strike counters fast to query and the full violation log auditable.",
    ],
    diagram: {
      nodes: [["app", "Client app", 0, 1], ["api", "POST /moderate", 1, 1], ["strike", "Strike check", 2, 1], ["keys", "Fernet keys", 2, 0], ["router", "Provider router", 3, 1], ["claude", "Claude", 4, 0], ["openai", "OpenAI", 4, 1], ["gemini", "Gemini", 4, 2], ["flagged", "Flagged user", 2, 2], ["verdict", "Verdict + strike", 3, 2]],
      edges: [["app", "api", "file"], ["api", "strike", "file"], ["strike", "router", "file"], ["keys", "router", "box", "ops"], ["router", "claude", "file", "both"], ["router", "openai", "file", "both"], ["router", "gemini", "file", "both"], ["strike", "flagged", "bug", "bad"], ["router", "verdict", "check"]],
    },
    highlights: [
      "One provider interface with Claude, OpenAI and Gemini implementations resolved per request.",
      "Provider API keys encrypted with Fernet and decrypted only inside the request cycle.",
      "JWT access tokens hashed into a server-side session table, so logout really revokes them.",
      "Flagged users are blocked before any AI call is made.",
    ],
    metrics: [
      { value: "3", label: "AI providers behind one interface" },
      { value: "0.3 s", label: "to moderate one message" },
      { value: "60k", label: "messages per minute" },
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
    start: "2026-02",
    chips: ["20k+ plays/day", "30 inference workers", "Patent co-inventor"],
    stack: ["PyTorch", "Computer vision", "Celery", "RabbitMQ", "PostgreSQL", "GCP"],
    summary:
      "Own the production AI systems that turn match video into biomechanics insights: computer-vision models, 3D body reconstruction, serving on 30 inference workers, 20k+ plays/day. Patent co-inventor.",
  },
  {
    company: "Nexa Product Labs",
    role: "Team Lead / Senior Software Engineer — AI & Full-Stack Products",
    period: "Sep 2023 — Jan 2026",
    start: "2023-09",
    end: "2026-01",
    chips: ["−80% decision time", "50–70k requests/day", "Led 5–7 engineers"],
    stack: ["LLMs", "RAG", "MCP", "FastAPI", "pgvector", "RabbitMQ"],
    summary:
      "Led 5–7 engineers on fintech credit decisioning: LLM underwriting with RAG and agents, 50–70k requests/day, decision time −80%, manual reviews −60%.",
  },
  {
    company: "EPAM Systems",
    role: "Senior Software Engineer",
    period: "Jul 2021 — Oct 2023",
    start: "2021-07",
    end: "2023-10",
    chips: ["−30% request time", "−50% time to fix prod errors"],
    stack: ["Python", "Java", "React", "Cloud"],
    summary:
      "Enterprise e-commerce on Python, Java and React: request execution time −30%, time to detect and resolve production errors −50%.",
  },
  {
    company: "BrightLayer Technologies",
    role: "Software Engineer — Python & Web Applications",
    period: "Apr 2019 — Jul 2021",
    start: "2019-04",
    end: "2021-07",
    chips: ["−20% calculation runtime", "−40% manual reporting"],
    stack: ["Python", "Microservices", "Geospatial", "CI/CD"],
    summary:
      "Distributed backends for transport analytics and forecasting: calculation runtime −20%, manual reporting −40%, migration from legacy components to microservices.",
  },
];

export type Note = { slug: string; title: string; summary: string; tag: string; minutes: number };

// long-form pages live in public/notes/<slug>/index.html
export const notes: Note[] = [
  {
    slug: "evals-before-prompts",
    title: "Evals before prompts",
    summary:
      "A 1,700-case golden set, a judge calibrated against analysts and a CI gate: how to change prompts and models fast without silently breaking production.",
    tag: "LLM evaluation",
    minutes: 6,
  },
  {
    slug: "grounded-rag",
    title: "Refuse before you hallucinate",
    summary:
      "Design notes on DocuQuery: a score threshold with a refusal that never calls the LLM, a hard token budget and citations on every claim.",
    tag: "RAG · open source",
    minutes: 5,
  },
];
