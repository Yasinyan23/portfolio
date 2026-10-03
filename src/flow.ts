// Live diagram of a multi-agent run: an orchestrator fans work out to agents, a review/fix loop and
// evals lift the output from junior to staff level. Plain SVG + rAF; the run's clock only advances
// while the diagram is on screen, so an offscreen hero costs nothing.

type NodeId = "task" | "orch" | "plan" | "rag" | "code" | "review" | "evals" | "final";
type State = "" | "busy" | "done" | "warn";

const H = 50;
const NODES: Record<NodeId, { x: number; y: number; w: number; label: string; sub: string }> = {
  task: { x: 80, y: 14, w: 320, label: "Task", sub: "› waiting" },
  orch: { x: 155, y: 112, w: 170, label: "Orchestrator", sub: "effort · high" },
  plan: { x: 12, y: 220, w: 142, label: "Planner", sub: "effort · low" },
  rag: { x: 169, y: 220, w: 142, label: "Retriever", sub: "RAG · MCP tools" },
  code: { x: 326, y: 220, w: 142, label: "Coder", sub: "effort · medium" },
  review: { x: 169, y: 326, w: 142, label: "Reviewer", sub: "effort · medium" },
  evals: { x: 169, y: 428, w: 142, label: "Evals", sub: "golden set" },
  final: { x: 155, y: 526, w: 170, label: "Final review", sub: "effort · max" },
};
const EDGES: [NodeId, NodeId][] = [
  ["task", "orch"], ["orch", "plan"], ["orch", "rag"], ["orch", "code"],
  ["plan", "review"], ["rag", "review"], ["code", "review"], ["review", "evals"], ["evals", "final"],
];
const TASKS = [
  { title: "Add RAG endpoint with citations", plan: "3 steps", rag: "12 docs found", code: "writing code", issue: "2 issues found" },
  { title: "Cut inference latency by 30%", plan: "profile first", rag: "traces loaded", code: "tuning threads", issue: "1 regression" },
  { title: "Ship document extraction v2", plan: "schema first", rag: "labeled set", code: "new extractor", issue: "3 weak fields" },
  { title: "Fix flaky eval in CI", plan: "reproduce", rag: "CI history", code: "seed + retry", issue: "missing test" },
];
const TOKENS_PER_MS = 6; // per busy agent; ~48k tokens a run
const USD_PER_TOKEN = 6e-6;

const NS = "http://www.w3.org/2000/svg";
const svgEl = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>, text?: string) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  if (text) e.textContent = text;
  return e;
};
const fmt = (n: number) => (n < 1000 ? String(Math.round(n)) : `${(n / 1000).toFixed(1)}k`);
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

function edgePath(a: NodeId, b: NodeId): string {
  const A = NODES[a];
  const B = NODES[b];
  const [x1, y1, x2, y2] = [A.x + A.w / 2, A.y + H, B.x + B.w / 2, B.y];
  const dy = (y2 - y1) / 2;
  return `M${x1} ${y1} C${x1} ${y1 + dy} ${x2} ${y2 - dy} ${x2} ${y2}`;
}

// the fix loop: from the reviewer's right side back up into the coder
function fixPath(): string {
  const r = NODES.review;
  const c = NODES.code;
  const [sx, sy, ex, ey] = [r.x + r.w, r.y + H / 2, c.x + c.w / 2, c.y + H];
  return `M${sx} ${sy} C${ex} ${sy} ${ex} ${ey + 30} ${ex} ${ey}`;
}

export function initFlow(root: HTMLElement, reduce: boolean): void {
  const svg = root.querySelector("svg")!;
  const runEl = root.querySelector(".flow-run")!;
  const tokEl = root.querySelector(".flow-tokens")!;
  const costEl = root.querySelector(".flow-cost")!;
  const fill = root.querySelector<HTMLElement>(".flow__fill")!;
  const steps = Array.from(root.querySelectorAll(".flow__steps span"));

  const gEdges = svgEl("g", {});
  const gNodes = svgEl("g", {});
  const gPackets = svgEl("g", {});
  svg.append(gEdges, gNodes, gPackets);

  const edges: Record<string, SVGPathElement> = {};
  for (const [a, b] of EDGES) gEdges.append((edges[`${a}-${b}`] = svgEl("path", { d: edgePath(a, b), class: "edge" })));
  gEdges.append((edges["review-code"] = svgEl("path", { d: fixPath(), class: "edge edge--fix" })));

  const nodes = {} as Record<NodeId, { g: SVGGElement; sub: SVGTextElement }>;
  for (const [id, n] of Object.entries(NODES) as [NodeId, (typeof NODES)[NodeId]][]) {
    const g = svgEl("g", { class: "node" });
    const sub = svgEl("text", { x: n.x + 14, y: n.y + 38, class: "node__sub" }, n.sub);
    g.append(
      svgEl("rect", { x: n.x, y: n.y, width: n.w, height: H, rx: 12 }),
      svgEl("text", { x: n.x + 14, y: n.y + 21, class: "node__label" }, n.label),
      sub,
      svgEl("circle", { cx: n.x + n.w - 18, cy: n.y + H / 2, r: 7, pathLength: 100, class: "node__spin" }),
      svgEl("text", { x: n.x + n.w - 18, y: n.y + H / 2 + 5, class: "node__check" }, "✓"),
    );
    gNodes.append(g);
    nodes[id] = { g, sub };
  }

  const busy = new Set<NodeId>();
  let tokens = 0;
  const state = (id: NodeId, s: State, note?: string) => {
    const { g, sub } = nodes[id];
    g.classList.remove("is-busy", "is-done", "is-warn");
    if (s) g.classList.add(`is-${s}`);
    if (note !== undefined) sub.textContent = note;
    if (s === "busy") busy.add(id);
    else busy.delete(id);
  };
  const level = (l: number) => {
    fill.style.width = `${((l + 1) / steps.length) * 100}%`;
    steps.forEach((s, i) => s.classList.toggle("is-on", i <= l));
  };
  const counters = () => {
    tokEl.textContent = fmt(tokens);
    costEl.textContent = `$${(tokens * USD_PER_TOKEN).toFixed(2)}`;
  };

  if (reduce) {
    const t = TASKS[0];
    (Object.keys(NODES) as NodeId[]).forEach((id) => state(id, "done"));
    state("task", "done", `› ${t.title}`);
    state("review", "done", "approved ✓");
    state("final", "done", "shipped ✓");
    level(steps.length - 1);
    tokens = 48200;
    counters();
    return;
  }

  // clock that only runs while visible; waits and packet flights are measured on it
  let clock = 0;
  let last = 0;
  let raf = 0;
  let visible = false;
  const waiters: { t: number; resolve: () => void }[] = [];
  const packets: { path: SVGPathElement; len: number; start: number; dur: number; dot: SVGCircleElement; done: () => void }[] = [];

  const tick = (now: number) => {
    const dt = Math.min(now - last, 50);
    last = now;
    clock += dt;
    tokens += busy.size * dt * TOKENS_PER_MS;
    counters();
    for (let i = packets.length - 1; i >= 0; i--) {
      const p = packets[i];
      const k = Math.min(1, (clock - p.start) / p.dur);
      const pt = p.path.getPointAtLength(p.len * ease(k));
      p.dot.setAttribute("cx", String(pt.x));
      p.dot.setAttribute("cy", String(pt.y));
      if (k >= 1) {
        p.dot.remove();
        p.path.classList.remove("is-hot");
        packets.splice(i, 1);
        p.done();
      }
    }
    for (let i = waiters.length - 1; i >= 0; i--) {
      if (waiters[i].t <= clock) waiters.splice(i, 1)[0].resolve();
    }
    raf = requestAnimationFrame(tick);
  };

  const wait = (ms: number) => new Promise<void>((resolve) => waiters.push({ t: clock + ms, resolve }));
  const travel = (key: string, dur = 520, fix = false) =>
    new Promise<void>((done) => {
      const path = edges[key];
      path.classList.add("is-hot");
      const dot = svgEl("circle", { r: 4.5, class: fix ? "pkt pkt--fix" : "pkt" });
      gPackets.append(dot);
      packets.push({ path, len: path.getTotalLength(), start: clock, dur, dot, done });
    });
  const work = async (id: NodeId, ms: number, note: string, after: State = "done", afterNote = note) => {
    state(id, "busy", note);
    await wait(ms);
    state(id, after, afterNote);
  };

  async function run(n: number) {
    const t = TASKS[n % TASKS.length];
    runEl.textContent = `#${n + 1}`;
    tokens = 0;
    (Object.keys(NODES) as NodeId[]).forEach((id) => state(id, "", NODES[id].sub));
    level(-1);

    state("task", "busy", "› ");
    for (let i = 1; i <= t.title.length; i++) {
      nodes.task.sub.textContent = `› ${t.title.slice(0, i)}`;
      await wait(28);
    }
    state("task", "done");
    await travel("task-orch");
    await work("orch", 700, "planning…");

    const branch = async (id: NodeId, ms: number, note: string) => {
      await travel(`orch-${id}`, 480);
      await work(id, ms, note);
      await travel(`${id}-review`, 520);
    };
    await Promise.all([branch("plan", 700, t.plan), branch("rag", 1100, t.rag), branch("code", 1500, t.code)]);
    level(0); // first draft: junior

    await work("review", 800, "reviewing…", "warn", t.issue);
    await travel("review-code", 650, true);
    await work("code", 800, "fix round 1");
    await travel("code-review");
    await work("review", 600, "re-checking…", "done", "approved ✓");
    level(1);

    await travel("review-evals");
    await work("evals", 1000, "1,700 cases…", "done", "all green ✓");
    level(2);

    await travel("evals-final");
    await work("final", 900, "deep review…", "done", "shipped ✓");
    level(3);
    await wait(2600);
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

  void (async () => {
    await wait(900); // let the hero fade in first
    for (let n = 0; ; n++) await run(n);
  })();
}
