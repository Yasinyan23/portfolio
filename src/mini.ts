import { glyph, svgEl } from "./svg";
import type { Diagram } from "./content";

// Small looping architecture diagram for a case study: nodes on a 5-column grid, one glyph per
// link running laps. Returns a stop() — the loop only runs while the case study is open.

const COL = 128;
const ROW = 62;
const W = 112;
const NH = 36;

type Box = { x: number; y: number; col: number; row: number };

function path(a: Box, b: Box): string {
  if (a.col === b.col) {
    const down = b.row > a.row;
    const [x1, y1, x2, y2] = [a.x + W / 2, down ? a.y + NH : a.y, b.x + W / 2, down ? b.y : b.y + NH];
    const my = (y1 + y2) / 2;
    return `M${x1} ${y1} C${x1} ${my} ${x2} ${my} ${x2} ${y2}`;
  }
  const right = b.col > a.col;
  const [x1, y1, x2, y2] = [right ? a.x + W : a.x, a.y + NH / 2, right ? b.x : b.x + W, b.y + NH / 2];
  const mx = (x1 + x2) / 2;
  return `M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`;
}

export function renderMini(svg: SVGSVGElement, d: Diagram, reduce: boolean): () => void {
  // phones get the grid transposed so it runs top-down; 640 units squeezed into a phone make 4px labels
  const flip = matchMedia("(max-width: 600px)").matches;
  const cells = d.nodes.map(([, , col, row]) => (flip ? [row, col] : [col, row]));
  const cols = Math.max(...cells.map((c) => c[0])) + 1;
  const rows = Math.max(...cells.map((c) => c[1])) + 1;
  svg.setAttribute("viewBox", `0 0 ${flip ? 16 + (cols - 1) * COL + W : 640} ${20 + (rows - 1) * ROW + NH}`);
  svg.replaceChildren();
  const gE = svgEl("g", {});
  const gN = svgEl("g", {});
  const gFx = svgEl("g", {});
  svg.append(gE, gN, gFx);

  const box: Record<string, Box> = {};
  d.nodes.forEach(([id, label], i) => {
    const [col, row] = cells[i];
    const b = { x: 8 + col * COL, y: 10 + row * ROW, col, row };
    box[id] = b;
    const g = svgEl("g", { class: "mnode", style: `--i: ${i}` });
    g.append(
      svgEl("rect", { x: b.x, y: b.y, width: W, height: NH, rx: 10 }),
      svgEl("text", { x: b.x + W / 2, y: b.y + NH / 2 + 4 }, label),
    );
    gN.append(g);
  });

  type Lap = { el: SVGUseElement; p: SVGPathElement; len: number; dur: number; phase: number; both: boolean; icon: string; turn: boolean };
  const laps: Lap[] = [];
  d.edges.forEach(([a, b, icon = "file", mode = ""], k) => {
    const p = svgEl("path", { d: path(box[a], box[b]), class: `edge${mode === "fix" || mode === "bad" ? ` edge--${mode}` : ""}` });
    gE.append(p);
    if (reduce) return;
    const len = p.getTotalLength();
    p.style.setProperty("--len", len.toFixed(1)); // for the draw-in on entrance
    p.style.setProperty("--k", String(k));
    const tone = mode === "both" ? "" : mode;
    const el = glyph(icon, 12, `ico${tone ? ` ico--${tone}` : ""}`);
    el.style.opacity = "0";
    gFx.append(el);
    laps.push({ el, p, len, dur: Math.min(2200, Math.max(900, len * 7)), phase: Math.random() * 2000, both: mode === "both", icon, turn: icon === "fix" });
  });
  if (reduce) return () => {};

  let raf = 0;
  let t0 = 0;
  const frame = (now: number) => {
    if (!t0) t0 = now;
    const t = now - t0;
    for (const l of laps) {
      const lap = (t + l.phase) / l.dur;
      const n = Math.floor(lap);
      const k = lap - n;
      const back = l.both && n % 2 === 1; // request out, response back
      const pt = l.p.getPointAtLength(l.len * (back ? 1 - k : k));
      l.el.setAttribute("href", `#g-${back ? "folder" : l.icon}`);
      l.el.setAttribute("x", String(pt.x - 6));
      l.el.setAttribute("y", String(pt.y - 6));
      l.el.style.opacity = String(Math.min(1, k * 6, (1 - k) * 6));
      if (l.turn) l.el.setAttribute("transform", `rotate(${((t * 0.5) % 360).toFixed(1)} ${pt.x} ${pt.y})`);
    }
    raf = requestAnimationFrame(frame);
  };
  // laps start once the entrance has drawn the links
  const timer = setTimeout(() => (raf = requestAnimationFrame(frame)), 1300);
  return () => {
    clearTimeout(timer);
    cancelAnimationFrame(raf);
  };
}
