// A stream of requests through four agent systems — Junior, Mid, Senior, Staff — and then the
// release path to production. Higher grades add parallelism, routing, caching, quality gates and
// safer rollouts (registry, k8s, canary + monitoring). Packets are little files, folders, code,
// bugs and containers. Plain SVG + rAF; the clock only advances while the diagram is on screen.

type Tier = "S" | "L"; // small / large model: packet colour and cost
type Tone = "" | Tier | "fix" | "bad" | "cache" | "ops";
type Icon = "file" | "code" | "folder" | "zip" | "box" | "chart" | "bug" | "fix" | "bolt" | "check";
type Spec = { id: string; x: number; y: number; w: number; label: string; sub?: string; h?: number; kind?: "tool" | "sm"; tier?: Tier; cap?: number; pods?: number };
type EdgeKind = "v" | "h" | "side";
type Req = { bad: boolean; dropped: boolean };
type NodeState = "" | "busy" | "done" | "warn" | "fail";
type PodState = "" | "starting" | "up" | "canary" | "warn";
type HopOpts = { tone?: Tone; icon?: Icon; reverse?: boolean; dur?: number };

interface Sim {
  rng(): number;
  hop(key: string, opts?: HopOpts): Promise<void>;
  proc(id: string, ms: number): Promise<void>;
  flash(id: string, kind: "bad" | "fix" | "cache", note?: string): void;
  retry(): void;
  all(ps: Promise<void>[]): Promise<void>;
}
// the release path, run once all requests are in
interface Ops {
  bugs: number;
  hop(key: string, icon: Icon, opts?: HopOpts): Promise<void>;
  work(id: string, ms: number, note: string, after?: NodeState, afterNote?: string): Promise<void>;
  steps(id: string, label: string, n: number, ms: number): Promise<void>;
  set(id: string, s: NodeState, note?: string): void;
  pod(id: string, i: number, s: PodState): void;
  wait(ms: number): Promise<void>;
}
type Mode = {
  name: string;
  caption: string;
  nodes: Spec[];
  edges: [string, string, EdgeKind?][];
  out: string;
  count: number;
  every: number;
  seed: number;
  flow(r: Req, s: Sim): Promise<void>;
  release(o: Ops): Promise<void>;
};

const H = 40;
const TASK: Spec = { id: "task", x: 80, y: 10, w: 320, label: "Task", sub: "› waiting" };
const TITLES = ["Add RAG endpoint with citations", "Cut inference latency by 30%", "Ship document extraction v2", "Fix flaky eval in CI"];

const MODES: Mode[] = [
  {
    name: "Junior",
    caption: "one big prompt · no checks · scp to a server",
    out: "out",
    count: 10,
    every: 110,
    seed: 1,
    nodes: [
      TASK,
      { id: "llm", x: 140, y: 150, w: 200, label: "LLM", sub: "one big prompt", tier: "L", cap: 1 },
      { id: "out", x: 140, y: 290, w: 200, label: "Output", sub: "waiting" },
      { id: "server", x: 140, y: 430, w: 200, label: "prod server", sub: "scp by hand" },
    ],
    edges: [["task", "llm"], ["llm", "out"], ["out", "server"]],
    async flow(r, s) {
      await s.hop("task-llm", { icon: "file" });
      await s.proc("llm", 220);
      if (s.rng() < 0.12) {
        s.flash("llm", "bad", "timeout ✗");
        r.dropped = true;
        return;
      }
      r.bad = s.rng() < 0.55;
      await s.hop("llm-out", r.bad ? { tone: "bad" } : { icon: "code" });
    },
    async release(o) {
      await o.hop("out-server", "zip");
      await o.work("server", 450, "uploading…", o.bugs ? "fail" : "done", o.bugs ? `${o.bugs} errors in prod ✗` : "live ✓");
    },
  },
  {
    name: "Mid",
    caption: "one agent + tools · single reviewer · docker on one VM",
    out: "out",
    count: 14,
    every: 100,
    seed: 5,
    nodes: [
      TASK,
      { id: "agent", x: 140, y: 110, w: 200, label: "Agent", sub: "effort · medium", tier: "L", cap: 2 },
      { id: "search", x: 14, y: 98, w: 84, h: 26, label: "search", kind: "tool", cap: 4 },
      { id: "db", x: 14, y: 140, w: 84, h: 26, label: "db", kind: "tool", cap: 4 },
      { id: "tests", x: 382, y: 119, w: 84, h: 26, label: "run tests", kind: "tool", cap: 4 },
      { id: "review", x: 140, y: 220, w: 200, label: "Reviewer", sub: "one pass", tier: "L", cap: 1 },
      { id: "out", x: 140, y: 330, w: 200, label: "Output", sub: "waiting" },
      { id: "docker", x: 40, y: 450, w: 170, label: "docker build", sub: "Dockerfile" },
      { id: "vm", x: 270, y: 450, w: 170, label: "VM", sub: "single host" },
    ],
    edges: [
      ["task", "agent"], ["agent", "search", "h"], ["agent", "db", "h"], ["agent", "tests", "h"],
      ["agent", "review"], ["review", "out"], ["out", "docker"], ["docker", "vm", "h"],
    ],
    async flow(r, s) {
      await s.hop("task-agent", { icon: "file" });
      await s.proc("agent", 140);
      for (const t of ["search", "db", "tests"].filter(() => s.rng() < 0.55)) {
        await s.hop(`agent-${t}`, { icon: "file", dur: 150 });
        await s.proc(t, 50);
        if (s.rng() < 0.25) {
          // tool error: the failure flies back, the agent calls again
          s.flash(t, "bad");
          s.retry();
          await s.hop(`agent-${t}`, { tone: "bad", reverse: true, dur: 150 });
          await s.hop(`agent-${t}`, { icon: "file", dur: 150 });
          await s.proc(t, 50);
        }
        await s.hop(`agent-${t}`, { icon: "folder", reverse: true, dur: 150 });
      }
      r.bad = s.rng() < 0.45;
      await s.hop("agent-review", { icon: "code" });
      await s.proc("review", 120);
      if (r.bad && s.rng() < 0.5) {
        s.flash("review", "fix", "caught ⚠");
        s.retry();
        await s.hop("agent-review", { tone: "fix", reverse: true });
        await s.proc("agent", 110);
        r.bad = s.rng() < 0.3;
        await s.hop("agent-review", { icon: "code" });
        await s.proc("review", 70);
      }
      await s.hop("review-out", r.bad ? { tone: "bad" } : { icon: "code" });
    },
    async release(o) {
      await o.hop("out-docker", "zip");
      await o.steps("docker", "layer", 5, 110);
      o.set("docker", "done", "image built ✓");
      await o.hop("docker-vm", "box", { dur: 260 });
      await o.work("vm", 380, "starting…", o.bugs ? "warn" : "done", o.bugs ? `${o.bugs} bugs live ⚠` : "live ✓");
    },
  },
  {
    name: "Senior",
    caption: "parallel planner + retriever · fix loop · registry → k8s",
    out: "out",
    count: 18,
    every: 85,
    seed: 1,
    nodes: [
      TASK,
      { id: "orch", x: 155, y: 84, w: 170, label: "Orchestrator", sub: "effort · high", tier: "L", cap: 3 },
      { id: "plan", x: 40, y: 158, w: 150, label: "Planner", sub: "effort · low", tier: "L", cap: 2 },
      { id: "rag", x: 290, y: 158, w: 150, label: "Retriever", sub: "RAG · MCP", tier: "L", cap: 2 },
      { id: "code", x: 165, y: 232, w: 150, label: "Coder", sub: "effort · medium", tier: "L", cap: 2 },
      { id: "review", x: 165, y: 306, w: 150, label: "Reviewer", sub: "effort · medium", tier: "L", cap: 2 },
      { id: "out", x: 165, y: 380, w: 150, label: "Output", sub: "waiting" },
      { id: "docker", x: 14, y: 480, w: 130, label: "docker", sub: "Dockerfile" },
      { id: "registry", x: 165, y: 480, w: 130, label: "registry", sub: "images" },
      { id: "k8s", x: 316, y: 472, w: 150, h: 56, label: "k8s · prod", sub: "3 pods", pods: 3 },
    ],
    edges: [
      ["task", "orch"], ["orch", "plan"], ["orch", "rag"], ["plan", "code"], ["rag", "code"], ["code", "review"],
      ["review", "out"], ["out", "docker"], ["docker", "registry", "h"], ["registry", "k8s", "h"],
    ],
    async flow(r, s) {
      await s.hop("task-orch", { icon: "file" });
      await s.proc("orch", 60);
      await s.all([
        (async () => {
          await s.hop("orch-plan", { icon: "file" });
          await s.proc("plan", 90);
          await s.hop("plan-code", { icon: "file" });
        })(),
        (async () => {
          await s.hop("orch-rag", { icon: "file" });
          await s.proc("rag", 110);
          if (s.rng() < 0.15) {
            s.flash("rag", "bad", "retry ↺");
            s.retry();
            await s.proc("rag", 90);
          }
          await s.hop("rag-code", { icon: "folder" });
        })(),
      ]);
      await s.proc("code", 120);
      r.bad = s.rng() < 0.4;
      await s.hop("code-review", { icon: "code" });
      await s.proc("review", 90);
      for (let round = 0; r.bad && round < 3 && s.rng() < 0.75; round++) {
        s.flash("review", "fix", "caught ⚠");
        s.retry();
        await s.hop("code-review", { tone: "fix", reverse: true });
        await s.proc("code", 100);
        r.bad = s.rng() < 0.25;
        await s.hop("code-review", { icon: "code" });
        await s.proc("review", 70);
      }
      await s.hop("review-out", r.bad ? { tone: "bad" } : { icon: "code" });
    },
    async release(o) {
      await o.hop("out-docker", "zip");
      await o.steps("docker", "layer", 5, 90);
      o.set("docker", "done", "image ✓");
      await o.hop("docker-registry", "box");
      await o.work("registry", 260, "push v1.4", "done", "pushed ✓");
      await o.hop("registry-k8s", "box");
      o.set("k8s", "busy", "rolling update");
      for (let i = 0; i < 3; i++) {
        o.pod("k8s", i, "starting");
        await o.wait(240);
        o.pod("k8s", i, "up");
      }
      if (o.bugs) o.pod("k8s", 2, "warn");
      o.set("k8s", o.bugs ? "warn" : "done", o.bugs ? `${o.bugs} alerts ⚠` : "3/3 ready ✓");
    },
  },
  {
    name: "Staff",
    caption: "routing · cache · 5 quality gates · canary on k8s + monitoring",
    out: "final",
    count: 24,
    every: 70,
    seed: 2,
    nodes: [
      TASK,
      { id: "router", x: 165, y: 72, w: 150, label: "Router", sub: "model routing", tier: "L", cap: 4 },
      { id: "cache", x: 356, y: 79, w: 92, h: 26, label: "cache", kind: "tool", cap: 6 },
      { id: "plan", x: 12, y: 136, w: 104, label: "Planner", sub: "small LLM", kind: "sm", tier: "S", cap: 3 },
      { id: "rag", x: 128, y: 136, w: 104, label: "RAG", sub: "MCP tools", kind: "sm", tier: "S", cap: 3 },
      { id: "codeL", x: 244, y: 136, w: 104, label: "Coder L", sub: "large LLM", kind: "sm", tier: "L", cap: 2 },
      { id: "codeS", x: 360, y: 136, w: 104, label: "Coder S", sub: "small LLM", kind: "sm", tier: "S", cap: 3 },
      { id: "tester", x: 60, y: 200, w: 150, label: "Tester", sub: "unit + e2e", tier: "S", cap: 3 },
      { id: "guard", x: 270, y: 200, w: 150, label: "Guardrails", sub: "PII · policy", tier: "S", cap: 3 },
      { id: "review", x: 165, y: 264, w: 150, label: "Reviewer", sub: "effort · high", tier: "L", cap: 2 },
      { id: "evals", x: 165, y: 328, w: 150, label: "Evals", sub: "golden set", tier: "S", cap: 3 },
      { id: "final", x: 165, y: 392, w: 150, label: "Final gate", sub: "effort · max", tier: "L", cap: 2 },
      { id: "docker", x: 8, y: 480, w: 96, label: "docker", sub: "Dockerfile", kind: "sm" },
      { id: "registry", x: 114, y: 480, w: 96, label: "registry", sub: "images", kind: "sm" },
      { id: "k8s", x: 220, y: 472, w: 150, h: 56, label: "k8s · prod", sub: "6 pods", pods: 6 },
      { id: "monitor", x: 380, y: 480, w: 92, label: "monitor", sub: "SLO", kind: "sm" },
    ],
    edges: [
      ["task", "router"], ["router", "cache", "h"], ["cache", "final", "side"],
      ["router", "plan"], ["plan", "rag", "h"], ["rag", "codeL", "h"], ["router", "codeS"],
      ["codeL", "tester"], ["codeS", "tester"], ["tester", "guard", "h"],
      ["guard", "review"], ["review", "evals"], ["evals", "final"],
      ["final", "docker"], ["docker", "registry", "h"], ["registry", "k8s", "h"], ["k8s", "monitor", "h"],
    ],
    async flow(r, s) {
      await s.hop("task-router", { icon: "file" });
      await s.proc("router", 50);
      if (s.rng() < 0.25) {
        // cache hit: a fast path straight to the final gate
        await s.hop("router-cache", { tone: "cache", dur: 140 });
        await s.proc("cache", 30);
        await s.hop("cache-final", { tone: "cache", dur: 420 });
        return;
      }
      const simple = s.rng() < 0.55;
      const coder = simple ? "codeS" : "codeL";
      const tier: Tier = simple ? "S" : "L";
      if (simple) await s.hop("router-codeS", { tone: "S", icon: "file" });
      else {
        await s.hop("router-plan", { tone: "S", icon: "file" });
        await s.proc("plan", 60);
        await s.hop("plan-rag", { tone: "S", icon: "file", dur: 150 });
        await s.proc("rag", 70);
        if (s.rng() < 0.15) {
          s.flash("rag", "bad", "retry ↺");
          s.retry();
          await s.proc("rag", 60);
        }
        await s.hop("rag-codeL", { tone: "L", icon: "folder", dur: 150 });
      }
      await s.proc(coder, simple ? 70 : 110);
      r.bad = s.rng() < (simple ? 0.25 : 0.35);

      // quality gates in order; a caught defect walks back up to the coder and re-runs every gate
      const path = [`${coder}-tester`, "tester-guard", "guard-review", "review-evals", "evals-final"];
      const gates: [string, number][] = [["tester", 0.7], ["guard", 0.2], ["review", 0.7], ["evals", 0.85], ["final", 0.6]];
      let rounds = 0;
      for (let g = 0; g < gates.length; g++) {
        await s.hop(path[g], { tone: tier, icon: "code", dur: 170 });
        const [id, catchP] = gates[g];
        await s.proc(id, 50);
        if (id === "guard" && s.rng() < 0.12) s.flash("guard", "cache", "PII redacted");
        if (r.bad && rounds < 3 && s.rng() < catchP) {
          rounds++;
          s.flash(id, "fix", "caught ⚠");
          s.retry();
          for (const k of path.slice(0, g + 1).reverse()) await s.hop(k, { tone: "fix", reverse: true, dur: 150 });
          await s.proc(coder, 80);
          r.bad = s.rng() < 0.2;
          g = -1; // back through every gate
        }
      }
    },
    async release(o) {
      await o.hop("final-docker", "zip");
      await o.steps("docker", "layer", 5, 80);
      o.set("docker", "done", "image ✓");
      await o.hop("docker-registry", "box");
      await o.work("registry", 220, "push v2.0", "done", "signed ✓");
      await o.hop("registry-k8s", "box");
      o.set("k8s", "busy", "canary 10%");
      o.pod("k8s", 0, "starting");
      await o.wait(240);
      o.pod("k8s", 0, "canary");
      await o.hop("k8s-monitor", "chart");
      await o.work("monitor", 420, "checks…", "done", "99.9% ✓");
      await o.hop("k8s-monitor", "check", { tone: "S", reverse: true });
      o.set("k8s", "busy", "promoting…");
      for (let i = 1; i < 6; i++) {
        o.pod("k8s", i, "starting");
        await o.wait(160);
        o.pod("k8s", i, "up");
      }
      o.pod("k8s", 0, "up");
      o.set("k8s", "done", "100% live ✓");
    },
  },
];

const SPEED = 1.25; // the whole run plays this much faster than the scripted timings
const HOLD_MS = 1600; // pause on the result before the next level (scripted time)
const FLOW_MS = 1600; // one lap of the ambient particle on each link
const TOKENS_PER_MS = 8; // per busy slot
const PRICE: Record<Tier, number> = { S: 1e-6, L: 6e-6 }; // $ per token
const ABORT = Symbol("abort");
// seeds are picked so quality climbs by level: Junior 40% · Mid 71% · Senior 89% · Staff 100%

// 16×16 glyphs for packets and pods; fill is currentColor, details in dark ink
const INK = "#0c0c12";
const GLYPHS: Record<Icon | "pod", string> = {
  file: `<path d="M3.5 1.5h6l3 3v10h-9z"/><path d="M9.5 1.5v3h3" fill="none" stroke="${INK}"/>`,
  code: `<path d="M3.5 1.5h6l3 3v10h-9z"/><path d="M7 8 5.5 9.75 7 11.5M9 8l1.5 1.75L9 11.5" fill="none" stroke="${INK}" stroke-width="1.2"/>`,
  folder: `<path d="M1.5 4h5l1.5 1.5h6.5v8h-13z"/>`,
  zip: `<path d="M2.5 2.5h11v11h-11z"/><path d="M8 2.5v7.5" stroke="${INK}" stroke-dasharray="1.3 1.3"/><rect x="6.8" y="10" width="2.4" height="2.4" fill="${INK}"/>`,
  box: `<rect x="1.5" y="4" width="13" height="9" rx="1.5"/><path d="M5 4v9M8 4v9M11 4v9" stroke="${INK}" stroke-width=".9"/>`,
  chart: `<path d="M2 14V9h3v5zM6.5 14V5h3v9zM11 14V2h3v12z"/>`,
  bug: `<ellipse cx="8" cy="9" rx="4" ry="5"/><path d="M8 4V2M4.2 6.5 1.8 5M11.8 6.5 14.2 5M4 10H1.5M12 10h2.5M4.6 12.8 2.5 14.5M11.4 12.8l2.1 1.7" stroke="currentColor" stroke-width="1.3" fill="none"/>`,
  fix: `<path d="M13 8a5 5 0 1 1-1.47-3.54" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M14.5 1.5v5h-5z"/>`,
  bolt: `<path d="M9.5 1 3 9.5h4.5L6.5 15 13 6.5H8.5z"/>`,
  check: `<circle cx="8" cy="8" r="6.5"/><path d="m5 8.2 2 2 4-4.2" fill="none" stroke="${INK}" stroke-width="1.7"/>`,
  pod: `<path d="M8 1l6 3.5v7L8 15l-6-3.5v-7z"/>`,
};

const NS = "http://www.w3.org/2000/svg";
const svgEl = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>, text?: string) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  if (text) e.textContent = text;
  return e;
};
const glyph = (name: Icon | "pod", size: number, cls: string) => {
  const u = svgEl("use", { width: size, height: size, class: cls });
  u.setAttribute("href", `#g-${name}`);
  return u;
};
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

// deterministic per-request randomness, so outcomes don't depend on animation timing
function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function edgePath(a: Spec, b: Spec, kind: EdgeKind = "v"): string {
  const ha = a.h ?? H;
  const hb = b.h ?? H;
  if (kind === "h") {
    const left = b.x < a.x;
    const [x1, y1] = [left ? a.x : a.x + a.w, a.y + ha / 2];
    const [x2, y2] = [left ? b.x + b.w : b.x, b.y + hb / 2];
    const mx = (x1 + x2) / 2;
    return `M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`;
  }
  if (kind === "side") {
    // down the right margin: from a's bottom into b's right side
    const [x1, y1, x2, y2] = [a.x + a.w / 2, a.y + ha, b.x + b.w, b.y + hb / 2];
    return `M${x1} ${y1} C472 ${y1 + 90} 472 ${y2 - 60} ${x2} ${y2}`;
  }
  const [x1, y1, x2, y2] = [a.x + a.w / 2, a.y + ha, b.x + b.w / 2, b.y];
  const dy = (y2 - y1) / 2;
  return `M${x1} ${y1} C${x1} ${y1 + dy} ${x2} ${y2 - dy} ${x2} ${y2}`;
}

export function initFlow(root: HTMLElement, reduce: boolean): void {
  const svg = root.querySelector("svg")!;
  const $ = (sel: string) => root.querySelector(sel)!;
  const modeEl = $(".flow-mode");
  const reqEl = $(".flow-req");
  const retryEl = $(".flow-retry");
  const bugsEl = $(".flow-bugs");
  const costEl = $(".flow-cost");
  const qEl = $(".flow-q");
  const fill = root.querySelector<HTMLElement>(".flow__fill")!;
  const caption = $(".flow__caption");
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>(".flow__levels button"));

  const defs = svgEl("defs", {});
  defs.innerHTML = Object.entries(GLYPHS)
    .map(([k, d]) => `<symbol id="g-${k}" viewBox="0 0 16 16" fill="currentColor">${d}</symbol>`)
    .join("");
  const gEdges = svgEl("g", {});
  const gNodes = svgEl("g", {});
  const gFx = svgEl("g", {});
  svg.append(defs, gEdges, gNodes, gFx);

  let mode = MODES[0];
  let specs: Record<string, Spec> = {};
  let edges: Record<string, SVGPathElement> = {};
  let nodes: Record<string, { g: SVGGElement; sub: SVGTextElement | null; pods: SVGUseElement[] }> = {};
  let load: Record<string, { active: number; queue: (() => void)[] }> = {};
  const hot = new Map<SVGPathElement, number>();
  let gen = 0;
  let runNo = 0;
  let title = TITLES[0];
  const stats = { spawned: 0, ok: 0, bugs: 0, retries: 0, cost: 0 };

  // ---- clock: advances only while visible; waits, packets and effects run on it ----
  let clock = 0;
  let last = 0;
  let raf = 0;
  let visible = false;
  let sparkAt = 0;
  const waiters: { t: number; resolve: () => void }[] = [];
  type Dot = {
    path: SVGPathElement;
    len: number;
    start: number;
    dur: number;
    el: SVGGraphicsElement;
    size: number; // >0 = glyph of that size, 0 = trailing dot
    turn: "" | "spin" | "wobble";
    reverse: boolean;
    tone: Tone;
    lead?: () => void;
    tail: boolean;
  };
  let dots: Dot[] = [];
  let sparks: { el: SVGCircleElement; x: number; y: number; born: number }[] = [];
  let ripples: { el: SVGCircleElement; born: number }[] = [];
  let flows: { path: SVGPathElement; len: number; el: SVGCircleElement; phase: number }[] = [];
  let qAnim: { to: number; start: number } | null = null;

  const counters = () => {
    reqEl.textContent = `${stats.spawned}/${mode.count}`;
    retryEl.textContent = String(stats.retries);
    bugsEl.textContent = String(stats.bugs);
    costEl.textContent = `$${stats.cost.toFixed(2)}`;
  };

  const ripple = (x: number, y: number, tone: string) => {
    const el = svgEl("circle", { cx: x, cy: y, r: 3, class: `ripple${tone ? ` ripple--${tone}` : ""}` });
    gFx.append(el);
    ripples.push({ el, born: clock });
  };
  const heat = (path: SVGPathElement, d: number) => {
    const n = (hot.get(path) ?? 0) + d;
    hot.set(path, n);
    path.classList.toggle("is-hot", n > 0);
  };

  // a packet: glyph in front, two fading dots behind; resolves when the glyph lands
  const launch = (path: SVGPathElement, icon: Icon, tone: Tone, reverse: boolean, dur: number, size: number) =>
    new Promise<void>((lead) => {
      const len = path.getTotalLength();
      const turn = icon === "fix" ? "spin" : icon === "bug" ? "wobble" : "";
      heat(path, 1);
      const head = glyph(icon, size, `ico${tone ? ` ico--${tone}` : ""}`);
      head.style.opacity = "0";
      gFx.append(head);
      dots.push({ path, len, start: clock, dur, el: head, size, turn, reverse, tone, lead, tail: false });
      [1, 2].forEach((k) => {
        const el = svgEl("circle", { r: 2.6 - k * 0.6, class: `pkt${tone ? ` pkt--${tone}` : ""}`, style: `opacity: 0; --fade: ${0.75 - k * 0.25}` });
        gFx.append(el);
        dots.push({ path, len, start: clock + k * 40, dur, el, size: 0, turn: "", reverse, tone, tail: k === 2 });
      });
    });

  const tick = (now: number) => {
    const dt = Math.min(now - last, 50) * SPEED;
    last = now;
    clock += dt;

    for (const [id, st] of Object.entries(load)) {
      const t = specs[id]?.tier;
      if (t && st.active) stats.cost += dt * st.active * TOKENS_PER_MS * PRICE[t];
    }
    counters();

    dots = dots.filter((d) => {
      const k = Math.min(1, Math.max(0, (clock - d.start) / d.dur));
      const p = d.path.getPointAtLength(d.len * (d.reverse ? 1 - ease(k) : ease(k)));
      if (d.size) {
        d.el.setAttribute("x", String(p.x - d.size / 2));
        d.el.setAttribute("y", String(p.y - d.size / 2));
        if (d.turn) {
          const deg = d.turn === "spin" ? (clock * 0.5) % 360 : Math.sin(clock / 70) * 18;
          d.el.setAttribute("transform", `rotate(${deg.toFixed(1)} ${p.x} ${p.y})`);
        }
      } else {
        d.el.setAttribute("cx", String(p.x));
        d.el.setAttribute("cy", String(p.y));
      }
      d.el.style.opacity = clock < d.start ? "0" : "";
      if (k < 1) return true;
      d.el.remove();
      if (d.tail) heat(d.path, -1);
      if (d.lead) {
        ripple(p.x, p.y, d.tone);
        d.lead();
      }
      return false;
    });

    for (const f of flows) {
      const p = f.path.getPointAtLength((f.len * ((clock + f.phase) % FLOW_MS)) / FLOW_MS);
      f.el.setAttribute("cx", String(p.x));
      f.el.setAttribute("cy", String(p.y));
    }

    ripples = ripples.filter((r) => {
      const a = (clock - r.born) / 450;
      if (a >= 1) {
        r.el.remove();
        return false;
      }
      r.el.setAttribute("r", String(3 + a * 14));
      r.el.style.opacity = String(0.8 * (1 - a));
      return true;
    });

    // sparks rising off every busy node
    if (clock - sparkAt > 30 && sparks.length < 120) {
      sparkAt = clock;
      for (const [id, st] of Object.entries(load)) {
        const s = specs[id];
        if (!st.active || !s || s.kind === "tool") continue;
        const el = svgEl("circle", { r: 1.4 + Math.random(), class: `spark spark--${s.tier ?? "ops"}` });
        gFx.append(el);
        sparks.push({ el, x: s.x + 10 + Math.random() * (s.w - 20), y: s.y, born: clock });
      }
    }
    sparks = sparks.filter((s) => {
      const age = (clock - s.born) / 600;
      if (age >= 1) {
        s.el.remove();
        return false;
      }
      s.el.setAttribute("cx", String(s.x + Math.sin(age * 9 + s.born) * 2));
      s.el.setAttribute("cy", String(s.y - age * 22));
      s.el.style.opacity = String(1 - age);
      return true;
    });

    if (qAnim) {
      const k = Math.min(1, (clock - qAnim.start) / 500);
      qEl.textContent = `${Math.round(qAnim.to * k)}%`;
      if (k >= 1) qAnim = null;
    }

    for (let i = waiters.length - 1; i >= 0; i--) if (waiters[i].t <= clock) waiters.splice(i, 1)[0].resolve();
    raf = requestAnimationFrame(tick);
  };
  const wait = (ms: number) => new Promise<void>((resolve) => waiters.push({ t: clock + ms, resolve }));

  const setState = (id: string, s: NodeState, note?: string) => {
    const n = nodes[id];
    if (!n) return;
    n.g.classList.remove("is-busy", "is-done", "is-warn", "is-fail");
    if (s) n.g.classList.add(`is-${s}`);
    if (note !== undefined && n.sub) n.sub.textContent = note;
  };

  // node text: queue length while saturated, else working / its resting label
  const refresh = (id: string) => {
    const n = nodes[id];
    const st = load[id];
    if (!n || !st) return;
    n.g.classList.toggle("is-busy", st.active > 0);
    if (n.sub && id !== mode.out) n.sub.textContent = st.queue.length ? `queue ${st.queue.length}` : st.active ? "working…" : (specs[id].sub ?? "");
  };

  // ---- build one level's graph; links draw in, nodes pop in ----
  function build(m: number) {
    mode = MODES[m];
    for (const x of [...dots, ...sparks, ...ripples]) x.el.remove();
    dots = [];
    sparks = [];
    ripples = [];
    flows = [];
    qAnim = null;
    hot.clear();
    gEdges.replaceChildren();
    gNodes.replaceChildren();
    specs = Object.fromEntries(mode.nodes.map((s) => [s.id, s]));
    load = Object.fromEntries(mode.nodes.map((s) => [s.id, { active: 0, queue: [] }]));
    edges = {};
    nodes = {};
    mode.edges.forEach(([a, b, kind], i) => {
      const path = svgEl("path", { d: edgePath(specs[a], specs[b], kind), class: "edge" });
      gEdges.append(path);
      edges[`${a}-${b}`] = path;
      if (reduce) return;
      const len = path.getTotalLength();
      path.style.strokeDasharray = String(len);
      path.style.strokeDashoffset = String(len);
      path.style.transition = `stroke-dashoffset 0.45s ease ${60 + i * 30}ms, stroke 0.3s`;
      requestAnimationFrame(() => (path.style.strokeDashoffset = "0"));
      const el = svgEl("circle", { r: 1.7, class: "flow-dot" });
      gEdges.append(el);
      flows.push({ path, len, el, phase: Math.random() * FLOW_MS });
    });
    mode.nodes.forEach((s, i) => {
      const h = s.h ?? H;
      const g = svgEl("g", { class: `node${s.kind ? ` node--${s.kind}` : ""}`, style: `--i: ${i}` });
      g.append(svgEl("rect", { x: s.x, y: s.y, width: s.w, height: h, rx: s.kind === "tool" ? 8 : 12 }));
      let sub: SVGTextElement | null = null;
      const pods: SVGUseElement[] = [];
      if (s.kind === "tool") {
        g.append(svgEl("text", { x: s.x + s.w / 2, y: s.y + h / 2 + 4, class: "node__tool" }, s.label));
      } else {
        g.append(svgEl("text", { x: s.x + 14, y: s.y + 18, class: "node__label" }, s.label));
        sub = svgEl("text", { x: s.x + 14, y: s.y + 31, class: "node__sub" }, s.sub ?? "");
        const r = s.kind === "sm" ? 5 : 7;
        const cx = s.x + s.w - (s.kind === "sm" ? 13 : 18);
        g.append(
          sub,
          svgEl("circle", { cx, cy: s.y + h / 2, r, pathLength: 100, class: "node__spin" }),
          svgEl("text", { x: cx, y: s.y + h / 2 + 5, class: "node__check" }, "✓"),
        );
        for (let p = 0; p < (s.pods ?? 0); p++) {
          const pod = glyph("pod", 11, "pod");
          pod.setAttribute("x", String(s.x + 12 + p * 15));
          pod.setAttribute("y", String(s.y + 38));
          g.append(pod);
          pods.push(pod);
        }
      }
      gNodes.append(g);
      nodes[s.id] = { g, sub, pods };
    });
    root.dataset.level = String(m);
    modeEl.textContent = mode.name;
    caption.textContent = mode.caption;
    tabs.forEach((t, i) => t.setAttribute("aria-pressed", String(i === m)));
    fill.style.width = "0";
    qEl.textContent = "—";
    Object.assign(stats, { spawned: 0, ok: 0, bugs: 0, retries: 0, cost: 0 });
    counters();
  }

  const outNote = () => {
    const sub = nodes[mode.out]?.sub;
    if (sub) sub.textContent = `✓ ${stats.ok}  ✗ ${stats.bugs}`;
  };

  const guardFor = (my: number) => async (p: Promise<void>) => {
    await p;
    if (my !== gen) throw ABORT;
  };

  // a request's view of the system, bound to one generation: after a level switch it aborts
  function makeSim(my: number, instant: boolean, rng: () => number): Sim {
    const guard = guardFor(my);
    const pause = (ms: number) => (instant ? Promise.resolve() : wait(ms));
    return {
      rng,
      hop(key, o = {}) {
        if (instant) return guard(Promise.resolve());
        const tone = o.tone ?? "";
        const icon = o.icon ?? (tone === "bad" ? "bug" : tone === "fix" ? "fix" : tone === "cache" ? "bolt" : "file");
        return guard(launch(edges[key], icon, tone, o.reverse ?? false, o.dur ?? 230, 13));
      },
      async proc(id, ms) {
        if (instant) return guard(Promise.resolve());
        const st = load[id];
        const cap = specs[id].cap ?? 1;
        if (st.active >= cap) {
          refresh(id);
          await guard(new Promise<void>((r) => st.queue.push(r))); // the slot is handed over on release
        } else st.active++;
        refresh(id);
        await guard(pause(ms));
        const next = st.queue.shift();
        if (next) next();
        else st.active--;
        refresh(id);
      },
      flash(id, kind, note) {
        const s = specs[id];
        const n = nodes[id];
        if (!s || !n) return;
        if (!instant) ripple(s.x + s.w / 2, s.y + (s.h ?? H) / 2, kind);
        n.g.classList.add(kind === "bad" ? "is-fail" : kind === "fix" ? "is-warn" : "is-note");
        if (note && n.sub) n.sub.textContent = note;
        void pause(300).then(() => {
          n.g.classList.remove("is-fail", "is-warn", "is-note");
          refresh(id);
        });
      },
      retry() {
        stats.retries++;
      },
      all: (ps) => guard(Promise.all(ps).then(() => {})),
    };
  }

  function makeOps(my: number, instant: boolean): Ops {
    const guard = guardFor(my);
    const pause = (ms: number) => (instant ? guard(Promise.resolve()) : guard(wait(ms)));
    const busy = (id: string, d: number) => {
      if (load[id]) load[id].active += d; // sparks while it works
    };
    return {
      bugs: stats.bugs,
      hop(key, icon, o = {}) {
        if (instant) return guard(Promise.resolve());
        return guard(launch(edges[key], icon, o.tone ?? "ops", o.reverse ?? false, o.dur ?? 300, 15));
      },
      async work(id, ms, note, after = "done", afterNote = note) {
        setState(id, "busy", note);
        busy(id, 1);
        try {
          await pause(ms);
        } finally {
          busy(id, -1);
        }
        setState(id, after, afterNote);
      },
      async steps(id, label, n, ms) {
        busy(id, 1);
        try {
          for (let i = 1; i <= n; i++) {
            setState(id, "busy", `${label} ${i}/${n}`);
            await pause(ms);
          }
        } finally {
          busy(id, -1);
        }
      },
      set: setState,
      pod(id, i, s) {
        const pod = nodes[id]?.pods[i];
        if (pod) pod.setAttribute("class", `pod${s ? ` is-${s}` : ""}`);
      },
      wait: pause,
    };
  }

  async function start(m: number, instant = false, rebuild = true) {
    const my = ++gen;
    if (m === 0) title = TITLES[runNo++ % TITLES.length];
    if (rebuild) build(m);
    const pause = (ms: number) => (instant ? Promise.resolve() : wait(ms));
    const alive = () => {
      if (my !== gen) throw ABORT;
    };
    try {
      // the task types in, then requests stream from it
      const task = nodes.task;
      task.g.classList.add("is-busy");
      if (!instant)
        for (let i = 1; i <= title.length; i++) {
          if (task.sub) task.sub.textContent = `› ${title.slice(0, i)}▍`;
          await pause(9);
          alive();
        }
      if (task.sub) task.sub.textContent = `› ${title}`;

      const runs: Promise<void>[] = [];
      for (let i = 0; i < mode.count; i++) {
        const r: Req = { bad: false, dropped: false };
        const sim = makeSim(my, instant, mulberry32(mode.seed * 1000 + i));
        const p = mode.flow(r, sim).then(() => {
          alive();
          const out = specs[mode.out];
          const failed = r.dropped || r.bad;
          if (failed) stats.bugs++;
          else stats.ok++;
          if (!instant && !r.dropped) ripple(out.x + out.w / 2, out.y + H / 2, failed ? "bad" : "ok");
          if (failed && !r.dropped) {
            nodes[mode.out].g.classList.remove("is-fail");
            nodes[mode.out].g.classList.add("is-fail");
            void pause(250).then(() => my === gen && nodes[mode.out]?.g.classList.remove("is-fail"));
          }
          outNote();
        });
        p.catch(() => {}); // aborted runs end quietly; Promise.all below still sees the abort
        runs.push(p);
        stats.spawned++;
        await pause(mode.every);
        alive();
      }
      task.g.classList.remove("is-busy");
      task.g.classList.add("is-done");
      await Promise.all(runs);
      alive();

      // agent output quality, then ship it
      const q = Math.round((stats.ok / mode.count) * 100);
      setState(mode.out, stats.bugs === 0 ? "done" : stats.bugs <= 2 ? "warn" : "fail", stats.bugs === 0 ? `all ${mode.count} clean ✓` : `✓ ${stats.ok}  ✗ ${stats.bugs}`);
      fill.style.width = `${q}%`;
      if (instant) qEl.textContent = `${q}%`;
      else qAnim = { to: q, start: clock };
      await mode.release(makeOps(my, instant));
      if (instant) return;
      await wait(HOLD_MS);
      if (my === gen) void start((m + 1) % MODES.length);
    } catch (e) {
      if (e !== ABORT) throw e;
    }
  }

  tabs.forEach((t, i) => t.addEventListener("click", () => void start(i, reduce)));

  if (reduce) {
    void start(MODES.length - 1, true); // static final state of the Staff run
    return;
  }

  const play = (on: boolean) => {
    cancelAnimationFrame(raf);
    if (on) {
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }
  };
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    play(visible && !document.hidden);
  }).observe(root);
  document.addEventListener("visibilitychange", () => play(visible && !document.hidden));

  build(0); // shown while the hero fades in, then the first run starts on it
  void wait(700).then(() => start(0, false, false));
}
