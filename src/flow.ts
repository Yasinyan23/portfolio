// The same task run four ways — Junior, Mid, Senior, Staff — as a live agent diagram, so the
// difference in process (and in the result) is visible. Plain SVG + rAF; the clock only advances
// while the diagram is on screen, so an offscreen hero costs nothing.

type State = "" | "busy" | "done" | "warn" | "fail";
type Tier = "S" | "L"; // small / large model, drives packet colour and cost
type Spec = { id: string; x: number; y: number; w: number; label: string; sub?: string; h?: number; kind?: "tool" | "sm"; tier?: Tier };
type EdgeKind = "v" | "h" | "fix";

interface Run {
  type(): Promise<void>;
  go(key: string, dur?: number, opts?: { reverse?: boolean; fix?: boolean; tier?: Tier }): Promise<void>;
  work(id: string, ms: number, note: string, after?: State, afterNote?: string): Promise<void>;
  call(from: string, tool: string, delay: number): Promise<void>;
  state(id: string, s: State, note?: string): void;
  all(ps: Promise<void>[]): Promise<void>;
}
type Mode = { name: string; caption: string; quality: number; nodes: Spec[]; edges: [string, string, EdgeKind?][]; script: (r: Run) => Promise<void> };

const H = 46;
const TASK: Spec = { id: "task", x: 80, y: 14, w: 320, label: "Task", sub: "› waiting" };
const TITLES = ["Add RAG endpoint with citations", "Cut inference latency by 30%", "Ship document extraction v2", "Fix flaky eval in CI"];

const MODES: Mode[] = [
  {
    name: "Junior",
    caption: "one big prompt · no review · no evals",
    quality: 41,
    nodes: [
      TASK,
      { id: "llm", x: 140, y: 230, w: 200, label: "LLM", sub: "one big prompt", tier: "L" },
      { id: "out", x: 140, y: 450, w: 200, label: "Output", sub: "waiting" },
    ],
    edges: [["task", "llm"], ["llm", "out"]],
    async script(r) {
      await r.type();
      await r.go("task-llm");
      await r.work("llm", 650, "generating…", "done", "no review");
      await r.go("llm-out");
      r.state("out", "fail", "2 bugs shipped ✗");
    },
  },
  {
    name: "Mid",
    caption: "one agent + tools · single review",
    quality: 68,
    nodes: [
      TASK,
      { id: "agent", x: 140, y: 175, w: 200, label: "Agent", sub: "effort · medium", tier: "L" },
      { id: "search", x: 14, y: 160, w: 84, h: 28, label: "search", kind: "tool" },
      { id: "db", x: 14, y: 210, w: 84, h: 28, label: "db", kind: "tool" },
      { id: "tests", x: 382, y: 184, w: 84, h: 28, label: "run tests", kind: "tool" },
      { id: "review", x: 140, y: 320, w: 200, label: "Reviewer", sub: "one pass", tier: "L" },
      { id: "out", x: 140, y: 465, w: 200, label: "Output", sub: "waiting" },
    ],
    edges: [["task", "agent"], ["agent", "search", "h"], ["agent", "db", "h"], ["agent", "tests", "h"], ["agent", "review"], ["review", "out"]],
    async script(r) {
      await r.type();
      await r.go("task-agent");
      r.state("agent", "busy", "calling tools…");
      await r.all(["search", "db", "tests"].map((t, i) => r.call("agent", t, i * 110)));
      await r.work("agent", 300, "drafting…", "done", "draft ready");
      await r.go("agent-review");
      await r.work("review", 400, "reviewing…", "done", "1 issue fixed");
      await r.go("review-out");
      r.state("out", "warn", "1 bug slipped ⚠");
    },
  },
  {
    name: "Senior",
    caption: "planner + parallel agents · review & fix loop",
    quality: 86,
    nodes: [
      TASK,
      { id: "orch", x: 155, y: 108, w: 170, label: "Orchestrator", sub: "effort · high", tier: "L" },
      { id: "plan", x: 12, y: 208, w: 142, label: "Planner", sub: "effort · low", tier: "L" },
      { id: "rag", x: 169, y: 208, w: 142, label: "Retriever", sub: "RAG · MCP", tier: "L" },
      { id: "code", x: 326, y: 208, w: 142, label: "Coder", sub: "effort · medium", tier: "L" },
      { id: "review", x: 169, y: 316, w: 142, label: "Reviewer", sub: "effort · medium", tier: "L" },
      { id: "out", x: 155, y: 440, w: 170, label: "Output", sub: "waiting" },
    ],
    edges: [
      ["task", "orch"], ["orch", "plan"], ["orch", "rag"], ["orch", "code"],
      ["plan", "review"], ["rag", "review"], ["code", "review"], ["review", "code", "fix"], ["review", "out"],
    ],
    async script(r) {
      await r.type();
      await r.go("task-orch");
      await r.work("orch", 280, "planning…", "done", "3 agents");
      const branch = async (id: string, ms: number, note: string) => {
        await r.go(`orch-${id}`, 260);
        await r.work(id, ms, note);
        await r.go(`${id}-review`, 280);
      };
      await r.all([branch("plan", 300, "3 steps"), branch("rag", 450, "12 docs found"), branch("code", 600, "writing code")]);
      await r.work("review", 300, "reviewing…", "warn", "1 issue found");
      await r.go("review-code", 320, { fix: true });
      await r.work("code", 280, "fix round 1");
      await r.go("code-review", 260);
      await r.work("review", 220, "re-checking…", "done", "approved ✓");
      await r.go("review-out");
      r.state("out", "done", "shipped ✓");
    },
  },
  {
    name: "Staff",
    caption: "model routing · parallel agents · evals · final review",
    quality: 97,
    nodes: [
      TASK,
      { id: "orch", x: 140, y: 100, w: 200, label: "Orchestrator", sub: "router · effort high", tier: "L" },
      { id: "plan", x: 12, y: 192, w: 108, label: "Planner", sub: "small LLM", kind: "sm", tier: "S" },
      { id: "rag", x: 128, y: 192, w: 108, label: "RAG", sub: "MCP tools", kind: "sm", tier: "S" },
      { id: "code", x: 244, y: 192, w: 108, label: "Coder", sub: "large LLM", kind: "sm", tier: "L" },
      { id: "test", x: 360, y: 192, w: 108, label: "Tester", sub: "small LLM", kind: "sm", tier: "S" },
      { id: "review", x: 150, y: 290, w: 180, label: "Reviewer", sub: "effort · high", tier: "L" },
      { id: "evals", x: 150, y: 388, w: 180, label: "Evals", sub: "golden set", tier: "S" },
      { id: "final", x: 150, y: 486, w: 180, label: "Final review", sub: "effort · max", tier: "L" },
    ],
    edges: [
      ["task", "orch"], ["orch", "plan"], ["orch", "rag"], ["orch", "code"], ["orch", "test"],
      ["plan", "review"], ["rag", "review"], ["code", "review"], ["test", "review"],
      ["review", "code", "fix"], ["review", "evals"], ["evals", "final"],
    ],
    async script(r) {
      await r.type();
      await r.go("task-orch");
      await r.work("orch", 260, "routing…", "done", "4 agents · 2 models");
      const branch = async (id: string, tier: Tier, ms: number, note: string) => {
        await r.go(`orch-${id}`, 240, { tier });
        await r.work(id, ms, note);
        await r.go(`${id}-review`, 280, { tier });
      };
      await r.all([
        branch("plan", "S", 260, "3 steps"),
        branch("rag", "S", 380, "12 docs"),
        branch("code", "L", 520, "writing…"),
        branch("test", "S", 420, "4 tests"),
      ]);
      await r.work("review", 280, "reviewing…", "warn", "1 issue found");
      await r.go("review-code", 320, { fix: true });
      await r.work("code", 240, "fix #1");
      await r.go("code-review", 260, { tier: "L" });
      await r.work("review", 200, "re-checking…", "done", "approved ✓");
      await r.go("review-evals");
      await r.work("evals", 420, "1,700 cases…", "done", "100% ✓");
      await r.go("evals-final");
      await r.work("final", 320, "deep review…", "done", "shipped ✓");
    },
  },
];

const TOKENS_PER_MS = 8; // per busy agent
const PRICE: Record<Tier, number> = { S: 1e-6, L: 6e-6 }; // $ per token
const HOLD_MS = 1400; // pause on the result before the next level (scripted time)
const SPEED = 1.4; // the whole run plays this much faster than the scripted timings
const FLOW_MS = 1600; // one lap of the ambient particle on each link
const ABORT = Symbol("abort");

const NS = "http://www.w3.org/2000/svg";
const svgEl = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>, text?: string) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  if (text) e.textContent = text;
  return e;
};
const fmt = (n: number) => (n < 1000 ? String(Math.round(n)) : `${(n / 1000).toFixed(1)}k`);
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

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
  if (kind === "fix") {
    // from the reviewer's right side back up into the coder
    const [sx, sy, ex, ey] = [a.x + a.w, a.y + ha / 2, b.x + b.w / 2, b.y + hb];
    return `M${sx} ${sy} C${ex + 40} ${sy} ${ex} ${ey + 30} ${ex} ${ey}`;
  }
  const [x1, y1, x2, y2] = [a.x + a.w / 2, a.y + ha, b.x + b.w / 2, b.y];
  const dy = (y2 - y1) / 2;
  return `M${x1} ${y1} C${x1} ${y1 + dy} ${x2} ${y2 - dy} ${x2} ${y2}`;
}

export function initFlow(root: HTMLElement, reduce: boolean): void {
  const svg = root.querySelector("svg")!;
  const modeEl = root.querySelector(".flow-mode")!;
  const runEl = root.querySelector(".flow-run")!;
  const tokEl = root.querySelector(".flow-tokens")!;
  const costEl = root.querySelector(".flow-cost")!;
  const qEl = root.querySelector(".flow-q")!;
  const fill = root.querySelector<HTMLElement>(".flow__fill")!;
  const caption = root.querySelector(".flow__caption")!;
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>(".flow__levels button"));

  const gEdges = svgEl("g", {});
  const gNodes = svgEl("g", {});
  const gFx = svgEl("g", {});
  svg.append(gEdges, gNodes, gFx);

  let specs: Record<string, Spec> = {};
  let edges: Record<string, SVGPathElement> = {};
  let nodes: Record<string, { g: SVGGElement; sub: SVGTextElement | null }> = {};
  const busy = new Set<string>();
  let tokens = 0;
  let cost = 0;
  let gen = 0;
  let runNo = 0;
  let title = TITLES[0];

  // ---- clock: advances only while visible; waits, packets and sparks run on it ----
  let clock = 0;
  let last = 0;
  let raf = 0;
  let visible = false;
  let sparkAt = 0;
  const waiters: { t: number; resolve: () => void }[] = [];
  type Dot = { path: SVGPathElement; len: number; start: number; dur: number; el: SVGCircleElement; reverse: boolean; tone: string; done?: () => void; hot: boolean };
  let dots: Dot[] = [];
  let sparks: { el: SVGCircleElement; x: number; y: number; born: number }[] = [];
  let ripples: { el: SVGCircleElement; born: number }[] = [];
  let flows: { path: SVGPathElement; len: number; el: SVGCircleElement; phase: number }[] = [];
  let qAnim: { to: number; start: number } | null = null;

  const counters = () => {
    tokEl.textContent = fmt(tokens);
    costEl.textContent = `$${cost.toFixed(2)}`;
  };

  const tick = (now: number) => {
    const dt = Math.min(now - last, 50) * SPEED;
    last = now;
    clock += dt;
    for (const id of busy) {
      const t = specs[id]?.tier;
      if (!t) continue;
      tokens += dt * TOKENS_PER_MS;
      cost += dt * TOKENS_PER_MS * PRICE[t];
    }
    counters();

    // comet packets along edges
    dots = dots.filter((d) => {
      const k = Math.min(1, Math.max(0, (clock - d.start) / d.dur));
      const p = d.path.getPointAtLength(d.len * (d.reverse ? 1 - ease(k) : ease(k)));
      d.el.setAttribute("cx", String(p.x));
      d.el.setAttribute("cy", String(p.y));
      d.el.style.opacity = clock < d.start ? "0" : "";
      if (k < 1) return true;
      d.el.remove();
      if (d.hot) d.path.classList.remove("is-hot");
      if (d.done) {
        // ripple where the lead packet lands
        const el = svgEl("circle", { cx: p.x, cy: p.y, r: 3, class: `ripple${d.tone ? ` ripple--${d.tone}` : ""}` });
        gFx.append(el);
        ripples.push({ el, born: clock });
        d.done();
      }
      return false;
    });

    // ambient data flow: one faint particle laps every visible link
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

    if (qAnim) {
      const k = Math.min(1, (clock - qAnim.start) / 500);
      qEl.textContent = `${Math.round(qAnim.to * k)}%`;
      if (k >= 1) qAnim = null;
    }

    // sparks rising off busy agents
    if (clock - sparkAt > 30 && busy.size && sparks.length < 110) {
      sparkAt = clock;
      for (const id of busy) {
        const s = specs[id];
        if (!s || s.kind === "tool") continue;
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

    for (let i = waiters.length - 1; i >= 0; i--) if (waiters[i].t <= clock) waiters.splice(i, 1)[0].resolve();
    raf = requestAnimationFrame(tick);
  };
  const wait = (ms: number) => new Promise<void>((resolve) => waiters.push({ t: clock + ms, resolve }));

  // ---- build one level's graph; nodes pop in with a stagger (CSS) ----
  function build(m: number) {
    const mode = MODES[m];
    for (const x of [...dots, ...sparks, ...ripples]) x.el.remove();
    dots = [];
    sparks = [];
    ripples = [];
    flows = [];
    qAnim = null;
    busy.clear();
    gEdges.replaceChildren();
    gNodes.replaceChildren();
    specs = Object.fromEntries(mode.nodes.map((s) => [s.id, s]));
    edges = {};
    nodes = {};
    mode.edges.forEach(([a, b, kind], i) => {
      const path = svgEl("path", { d: edgePath(specs[a], specs[b], kind), class: kind === "fix" ? "edge edge--fix" : "edge" });
      gEdges.append(path);
      edges[`${a}-${b}`] = path;
      if (kind === "fix" || reduce) return;
      // links draw themselves in, then carry a faint particle forever
      const len = path.getTotalLength();
      path.style.strokeDasharray = String(len);
      path.style.strokeDashoffset = String(len);
      path.style.transition = `stroke-dashoffset 0.45s ease ${60 + i * 35}ms, stroke 0.3s`;
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
    tokens = 0;
    cost = 0;
    counters();
  }

  const setState = (id: string, s: State, note?: string) => {
    const n = nodes[id];
    if (!n) return;
    n.g.classList.remove("is-busy", "is-done", "is-warn", "is-fail");
    if (s) n.g.classList.add(`is-${s}`);
    if (note !== undefined && n.sub) n.sub.textContent = note;
    if (s === "busy") busy.add(id);
    else busy.delete(id);
  };

  // a run bound to one generation: anything awaited after a level switch aborts
  function makeRun(my: number, instant: boolean): Run {
    const guard = async (p: Promise<void>) => {
      await p;
      if (my !== gen) throw ABORT;
    };
    const pause = (ms: number) => (instant ? Promise.resolve() : wait(ms));
    const run: Run = {
      async type() {
        setState("task", "busy", "› ");
        if (!instant)
          for (let i = 1; i <= title.length; i++) {
            if (nodes.task.sub) nodes.task.sub.textContent = `› ${title.slice(0, i)}▍`;
            await guard(wait(10));
          }
        setState("task", "done", `› ${title}`);
      },
      go(key, dur = 270, opts = {}) {
        if (instant) return Promise.resolve();
        const path = edges[key];
        path.classList.add("is-hot");
        const len = path.getTotalLength();
        const cls = opts.fix ? "pkt pkt--fix" : opts.tier ? `pkt pkt--${opts.tier}` : "pkt";
        return guard(
          new Promise<void>((done) => {
            // a comet: lead packet + three fading followers
            const tone = opts.fix ? "fix" : (opts.tier ?? "");
            [0, 1, 2, 3].forEach((k) => {
              const el = svgEl("circle", { r: 4.6 - k, class: cls, style: `opacity: 0; --fade: ${1 - k * 0.22}` });
              gFx.append(el);
              dots.push({ path, len, start: clock + k * 38, dur, el, reverse: !!opts.reverse, tone, hot: k === 3, done: k === 0 ? done : undefined });
            });
          }),
        );
      },
      async work(id, ms, note, after = "done", afterNote = note) {
        setState(id, "busy", note);
        await guard(pause(ms));
        setState(id, after, afterNote);
      },
      async call(from, tool, delay) {
        await guard(pause(delay));
        await run.go(`${from}-${tool}`, 230);
        await run.work(tool, 140, "");
        await run.go(`${from}-${tool}`, 230, { reverse: true });
      },
      state: setState,
      all: (ps) => guard(Promise.all(ps).then(() => {})),
    };
    return run;
  }

  async function start(m: number, instant = false, rebuild = true) {
    const my = ++gen;
    if (m === 0) title = TITLES[runNo++ % TITLES.length];
    runEl.textContent = `#${Math.max(runNo, 1)}`;
    if (rebuild) build(m);
    const mode = MODES[m];
    try {
      await mode.script(makeRun(my, instant));
      fill.style.width = `${mode.quality}%`;
      if (instant) {
        qEl.textContent = `${mode.quality}%`;
        return;
      }
      qAnim = { to: mode.quality, start: clock };
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
