// Shared SVG helpers and the 16×16 glyph set used by the hero diagram and the case-study diagrams.

export type Icon = "file" | "code" | "folder" | "zip" | "box" | "chart" | "bug" | "fix" | "bolt" | "check";

const NS = "http://www.w3.org/2000/svg";
const INK = "#0c0c12"; // details drawn on top of the glyph's currentColor fill

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

export const svgEl = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>, text?: string) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  if (text) e.textContent = text;
  return e;
};

// one hidden <svg> holds the symbols; every diagram on the page references them by id
let defined = false;
export function ensureGlyphs(): void {
  if (defined) return;
  defined = true;
  const host = svgEl("svg", { width: 0, height: 0, "aria-hidden": "true", style: "position:absolute" });
  host.innerHTML = `<defs>${Object.entries(GLYPHS)
    .map(([k, d]) => `<symbol id="g-${k}" viewBox="0 0 16 16" fill="currentColor">${d}</symbol>`)
    .join("")}</defs>`;
  document.body.append(host);
}

export const glyph = (name: Icon | "pod", size: number, cls: string) => {
  const u = svgEl("use", { width: size, height: size, class: cls });
  u.setAttribute("href", `#g-${name}`);
  return u;
};
