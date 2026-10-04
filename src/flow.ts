// A stream of requests through four agent systems — Junior, Mid, Senior, Staff. Higher grades add
// parallelism, routing, caching and quality gates; caught defects walk back for a fix, tool calls
// fail and retry, and quality is computed from what actually reaches the output.
// Plain SVG + rAF; the clock only advances while the diagram is on screen.

type Tier = "S" | "L"; // small / large model: packet colour and cost
type Tone = "" | Tier | "fix" | "bad" | "cache";
type Spec = { id: string; x: number; y: number; w: number; label: string; sub?: string; h?: number; kind?: "tool" | "sm"; tier?: Tier; cap?: number };
type EdgeKind = "v" | "h" | "side";
type Req = { bad: boolean; dropped: boolean };

interface Sim {
  rng(): number;
  hop(key: string, tone?: Tone, reverse?: boolean, dur?: number): Promise<void>;
  proc(id: string, ms: number): Promise<void>;
  flash(id: string, kind: "bad" | "fix" | "cache", note?: string): void;
  retry(): void;
  all(ps: Promise<void>[]): Promise<void>;
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
};

const H = 46;
const TASK: Spec = { id: "task", x: 80, y: 14, w: 320, label: "Task", sub: "› waiting" };
const TITLES = ["Add RAG endpoint with citations", "Cut inference latency by 30%", "Ship document extraction v2", "Fix flaky eval in CI"];

const MODES: Mode[] = [
  {
    name: "Junior",
    caption: "one big prompt · no checks · no retries",
    out: "out",
    count: 10,
    every: 110,
    seed: 1,
    nodes: [
      TASK,
      { id: "llm", x: 140, y: 200, w: 200, label: "LLM", sub: "one big prompt", tier: "L", cap: 1 },
      { id: "out", x: 140, y: 420, w: 200, label: "Output", sub: "waiting" },
    ],
    edges: [["task", "llm"], ["llm", "out"]],
    async flow(r, s) {
      await s.hop("task-llm");
      await s.proc("llm", 220);
      if (s.rng() < 0.12) {
        s.flash("llm", "bad", "timeout ✗");
        r.dropped = true;
        return;
      }
      r.bad = s.rng() < 0.55;
      await s.hop("llm-out", r.bad ? "bad" : "");
    },
  },
  {
    name: "Mid",
    caption: "one agent + tools · single reviewer",
    out: "out",
    count: 14,
    every: 100,
    seed: 5,
    nodes: [
      TASK,
      { id: "agent", x: 140, y: 150, w: 200, label: "Agent", sub: "effort · medium", tier: "L", cap: 2 },
      { id: "search", x: 14, y: 138, w: 84, h: 28, label: "search", kind: "tool", cap: 4 },
      { id: "db", x: 14, y: 188, w: 84, h: 28, label: "db", kind: "tool", cap: 4 },
      { id: "tests", x: 382, y: 162, w: 84, h: 28, label: "run tests", kind: "tool", cap: 4 },
      { id: "review", x: 140, y: 300, w: 200, label: "Reviewer", sub: "one pass", tier: "L", cap: 1 },
      { id: "out", x: 140, y: 450, w: 200, label: "Output", sub: "waiting" },
    ],
    edges: [["task", "agent"], ["agent", "search", "h"], ["agent", "db", "h"], ["agent", "tests", "h"], ["agent", "review"], ["review", "out"]],
    async flow(r, s) {
      await s.hop("task-agent");
      await s.proc("agent", 140);
      for (const t of ["search", "db", "tests"].filter(() => s.rng() < 0.55)) {
        await s.hop(`agent-${t}`, "", false, 150);
        await s.proc(t, 50);
        if (s.rng() < 0.25) {
          // tool error: the failure flies back, the agent calls again
          s.flash(t, "bad");
          s.retry();
          await s.hop(`agent-${t}`, "bad", true, 150);
          await s.hop(`agent-${t}`, "", false, 150);
          await s.proc(t, 50);
        }
        await s.hop(`agent-${t}`, "", true, 150);
      }
      r.bad = s.rng() < 0.45;
      await s.hop("agent-review");
      await s.proc("review", 120);
      if (r.bad && s.rng() < 0.5) {
        s.flash("review", "fix", "caught ⚠");
        s.retry();
        await s.hop("agent-review", "fix", true);
        await s.proc("agent", 110);
        r.bad = s.rng() < 0.3;
        await s.hop("agent-review");
        await s.proc("review", 70);
      }
      await s.hop("review-out", r.bad ? "bad" : "");
    },
  },
  {
    name: "Senior",
    caption: "planner + retriever in parallel · review & fix loop",
    out: "out",
    count: 18,
    every: 85,
    seed: 1,
    nodes: [
      TASK,
      { id: "orch", x: 155, y: 100, w: 170, label: "Orchestrator", sub: "effort · high", tier: "L", cap: 3 },
      { id: "plan", x: 40, y: 190, w: 150, label: "Planner", sub: "effort · low", tier: "L", cap: 2 },
      { id: "rag", x: 290, y: 190, w: 150, label: "Retriever", sub: "RAG · MCP", tier: "L", cap: 2 },
      { id: "code", x: 165, y: 280, w: 150, label: "Coder", sub: "effort · medium", tier: "L", cap: 2 },
      { id: "review", x: 165, y: 370, w: 150, label: "Reviewer", sub: "effort · medium", tier: "L", cap: 2 },
      { id: "out", x: 165, y: 470, w: 150, label: "Output", sub: "waiting" },
    ],
    edges: [["task", "orch"], ["orch", "plan"], ["orch", "rag"], ["plan", "code"], ["rag", "code"], ["code", "review"], ["review", "out"]],
    async flow(r, s) {
      await s.hop("task-orch");
      await s.proc("orch", 60);
      await s.all([
        (async () => {
          await s.hop("orch-plan");
          await s.proc("plan", 90);
          await s.hop("plan-code");
        })(),
        (async () => {
          await s.hop("orch-rag");
          await s.proc("rag", 110);
          if (s.rng() < 0.15) {
            s.flash("rag", "bad", "retry ↺");
            s.retry();
            await s.proc("rag", 90);
          }
          await s.hop("rag-code");
        })(),
      ]);
      await s.proc("code", 120);
      r.bad = s.rng() < 0.4;
      await s.hop("code-review");
      await s.proc("review", 90);
      for (let round = 0; r.bad && round < 3 && s.rng() < 0.75; round++) {
        s.flash("review", "fix", "caught ⚠");
        s.retry();
        await s.hop("code-review", "fix", true);
        await s.proc("code", 100);
        r.bad = s.rng() < 0.25;
        await s.hop("code-review");
        await s.proc("review", 70);
      }
      await s.hop("review-out", r.bad ? "bad" : "");
    },
  },
  {
    name: "Staff",
    caption: "routing · cache · parallel models · tests, guardrails, review, evals",
    out: "final",
    count: 24,
    every: 70,
    seed: 2,
    nodes: [
      TASK,
      { id: "router", x: 165, y: 92, w: 150, label: "Router", sub: "model routing", tier: "L", cap: 4 },
      { id: "cache", x: 356, y: 101, w: 92, h: 28, label: "cache", kind: "tool", cap: 6 },
      { id: "plan", x: 12, y: 176, w: 104, label: "Planner", sub: "small LLM", kind: "sm", tier: "S", cap: 3 },
      { id: "rag", x: 128, y: 176, w: 104, label: "RAG", sub: "MCP tools", kind: "sm", tier: "S", cap: 3 },
      { id: "codeL", x: 244, y: 176, w: 104, label: "Coder L", sub: "large LLM", kind: "sm", tier: "L", cap: 2 },
      { id: "codeS", x: 360, y: 176, w: 104, label: "Coder S", sub: "small LLM", kind: "sm", tier: "S", cap: 3 },
      { id: "tester", x: 60, y: 262, w: 150, label: "Tester", sub: "unit + e2e", tier: "S", cap: 3 },
      { id: "guard", x: 270, y: 262, w: 150, label: "Guardrails", sub: "PII · policy", tier: "S", cap: 3 },
      { id: "review", x: 165, y: 348, w: 150, label: "Reviewer", sub: "effort · high", tier: "L", cap: 2 },
      { id: "evals", x: 165, y: 434, w: 150, label: "Evals", sub: "golden set", tier: "S", cap: 3 },
      { id: "final", x: 165, y: 520, w: 150, label: "Final review", sub: "effort · max", tier: "L", cap: 2 },
    ],
    edges: [
      ["task", "router"], ["router", "cache", "h"], ["cache", "final", "side"],
      ["router", "plan"], ["plan", "rag", "h"], ["rag", "codeL", "h"], ["router", "codeS"],
      ["codeL", "tester"], ["codeS", "tester"], ["tester", "guard", "h"],
      ["guard", "review"], ["review", "evals"], ["evals", "final"],
    ],
    async flow(r, s) {
      await s.hop("task-router");
      await s.proc("router", 50);
      if (s.rng() < 0.25) {
        // cache hit: a fast path straight to the final gate
        await s.hop("router-cache", "cache", false, 140);
        await s.proc("cache", 30);
        await s.hop("cache-final", "cache", false, 420);
        return;
      }
      const simple = s.rng() < 0.55;
      const coder = simple ? "codeS" : "codeL";
      const tier: Tier = simple ? "S" : "L";
      if (simple) await s.hop("router-codeS", "S");
      else {
        await s.hop("router-plan", "S");
        await s.proc("plan", 60);
        await s.hop("plan-rag", "S", false, 150);
        await s.proc("rag", 70);
        if (s.rng() < 0.15) {
          s.flash("rag", "bad", "retry ↺");
          s.retry();
          await s.proc("rag", 60);
        }
        await s.hop("rag-codeL", "L", false, 150);
      }
      await s.proc(coder, simple ? 70 : 110);
      r.bad = s.rng() < (simple ? 0.25 : 0.35);

      // quality gates in order; a caught defect walks back up to the coder and re-runs every gate
      const path = [`${coder}-tester`, "tester-guard", "guard-review", "review-evals", "evals-final"];
      const gates: [string, number][] = [["tester", 0.7], ["guard", 0.2], ["review", 0.7], ["evals", 0.85], ["final", 0.6]];
      let rounds = 0;
      for (let g = 0; g < gates.length; g++) {
        await s.hop(path[g], tier, false, 170);
        const [id, catchP] = gates[g];
        await s.proc(id, 50);
        if (id === "guard" && s.rng() < 0.12) s.flash("guard", "cache", "PII redacted");
        if (r.bad && rounds < 3 && s.rng() < catchP) {
          rounds++;
          s.flash(id, "fix", "caught ⚠");
          s.retry();
          for (const k of path.slice(0, g + 1).reverse()) await s.hop(k, "fix", true, 150);
          await s.proc(coder, 80);
          r.bad = s.rng() < 0.2;
          g = -1; // back through every gate
        }
      }
    },
  },
];

const SPEED = 1.4; // the whole run plays this much faster than the scripted timings
const HOLD_MS = 1600; // pause on the result before the next level (scripted time)
const FLOW_MS = 1600; // one lap of the ambient particle on each link
const TOKENS_PER_MS = 8; // per busy slot
const PRICE: Record<Tier, number> = { S: 1e-6, L: 6e-6 }; // $ per token
const ABORT = Symbol("abort");
// seeds are picked so quality climbs by level: Junior 40% · Mid 71% · Senior 89% · Staff 100%

const NS = "http://www.w3.org/2000/svg";
const svgEl = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>, text?: string) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  if (text) e.textContent = text;
  return e;
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

  const gEdges = svgEl("g", {});
  const gNodes = svgEl("g", {});
  const gFx = svgEl("g", {});
  svg.append(gEdges, gNodes, gFx);

  let mode = MODES[0];
  let specs: Record<string, Spec> = {};
  let edges: Record<string, SVGPathElement> = {};
  let nodes: Record<string, { g: SVGGElement; sub: SVGTextElement | null }> = {};
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
  type Dot = { path: SVGPathElement; len: number; start: number; dur: number; el: SVGCircleElement; reverse: boolean; tone: Tone; lead?: () => void; tail: boolean };
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
      d.el.setAttribute("cx", String(p.x));
      d.el.setAttribute("cy", String(p.y));
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
        const el = svgEl("circle", { r: 1.4 + Math.random(), class: `spark spark--${s.tier ?? "S"}` });
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
      if (s.kind === "tool") {
        g.append(svgEl("text", { x: s.x + s.w / 2, y: s.y + 18, class: "node__tool" }, s.label));
      } else {
        g.append(svgEl("text", { x: s.x + 14, y: s.y + 20, class: "node__label" }, s.label));
        sub = svgEl("text", { x: s.x + 14, y: s.y + 36, class: "node__sub" }, s.sub ?? "");
        const r = s.kind === "sm" ? 5 : 7;
        const cx = s.x + s.w - (s.kind === "sm" ? 13 : 18);
        g.append(
          sub,
          svgEl("circle", { cx, cy: s.y + h / 2, r, pathLength: 100, class: "node__spin" }),
          svgEl("text", { x: cx, y: s.y + h / 2 + 5, class: "node__check" }, "✓"),
        );
      }
      gNodes.append(g);
      nodes[s.id] = { g, sub };
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

  // a run bound to one generation: anything awaited after a level switch aborts
  function makeSim(my: number, instant: boolean, rng: () => number): Sim {
    const guard = async (p: Promise<void>) => {
      await p;
      if (my !== gen) throw ABORT;
    };
    const pause = (ms: number) => (instant ? Promise.resolve() : wait(ms));
    return {
      rng,
      hop(key, tone = "", reverse = false, dur = 230) {
        if (instant) return guard(Promise.resolve());
        const path = edges[key];
        const len = path.getTotalLength();
        heat(path, 1);
        return guard(
          new Promise<void>((lead) => {
            // a comet: lead packet + two fading followers
            [0, 1, 2].forEach((k) => {
              const el = svgEl("circle", { r: 4.4 - k * 1.1, class: `pkt${tone ? ` pkt--${tone}` : ""}`, style: `opacity: 0; --fade: ${1 - k * 0.28}` });
              gFx.append(el);
              dots.push({ path, len, start: clock + k * 36, dur, el, reverse, tone, tail: k === 2, lead: k === 0 ? lead : undefined });
            });
          }),
        );
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

      const q = Math.round((stats.ok / mode.count) * 100);
      const out = nodes[mode.out];
      out.g.classList.remove("is-busy", "is-fail", "is-warn");
      out.g.classList.add(stats.bugs === 0 ? "is-done" : stats.bugs <= 2 ? "is-warn" : "is-fail");
      if (out.sub) out.sub.textContent = stats.bugs === 0 ? `all ${mode.count} clean ✓` : `✓ ${stats.ok}  ✗ ${stats.bugs} shipped`;
      fill.style.width = `${q}%`;
      if (instant) {
        qEl.textContent = `${q}%`;
        return;
      }
      qAnim = { to: q, start: clock };
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
