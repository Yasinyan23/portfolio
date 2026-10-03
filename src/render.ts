import { jobs, profile, projects, stack, stats } from "./content";
import type { Job, Project } from "./content";

const ENTITIES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ENTITIES[c]);

const ext = (href: string, label: string, icon = "") =>
  `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(label)}${icon ? ` <span aria-hidden="true">${icon}</span>` : ""}</a>`;

const metricsHTML = (p: Project) =>
  p.metrics
    .map((m) => `<li><span class="metric__value">${esc(m.value)}</span><span class="metric__label">${esc(m.label)}</span></li>`)
    .join("");

const sideHTML = (p: Project) => `
  <p class="card__label">What I did</p>
  <ul class="highlights">${p.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>
  <ul class="tags">${p.stack.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
  ${p.links.length ? `<p class="card__links">${p.links.map((l) => ext(l.href, l.label, "↗")).join("")}</p>` : ""}`;

// full-screen case study (dialog body); prev/next buttons carry data-case
export const caseHTML = (p: Project, i: number, total: number) => `
  <p class="card__org">${esc(p.org)}</p>
  <h2 class="case__title" id="case-title">${esc(p.title)}</h2>
  <p class="case__summary">${esc(p.summary)}</p>
  <ul class="metrics metrics--big">${metricsHTML(p)}</ul>
  <div class="case__cols">
    <div class="case__story">${p.details.map((d) => `<p>${esc(d)}</p>`).join("")}</div>
    <div>${sideHTML(p)}</div>
  </div>
  <p class="case__nav">
    ${i > 0 ? `<button type="button" class="btn btn--ghost" data-case="${i - 1}">← ${esc(projects[i - 1].title)}</button>` : "<span></span>"}
    ${i < total - 1 ? `<button type="button" class="btn btn--ghost" data-case="${i + 1}">${esc(projects[i + 1].title)} →</button>` : ""}
  </p>`;

// months between YYYY-MM dates; an open end means "until now"
const months = (start: string, end?: string) => {
  const [y1, m1] = start.split("-").map(Number);
  const now = new Date();
  const [y2, m2] = end ? end.split("-").map(Number) : [now.getFullYear(), now.getMonth() + 1];
  return Math.max(1, (y2 - y1) * 12 + (m2 - m1));
};
const duration = (n: number) => [Math.floor(n / 12) && `${Math.floor(n / 12)} yr`, n % 12 && `${n % 12} mo`].filter(Boolean).join(" ");
const years = (j: Job) => `${j.start.slice(0, 4)} — ${j.end ? j.end.slice(0, 4) : "now"}`;

export const formatStat = (value: number, prefix = "", suffix = "") =>
  `${prefix}${Math.round(value).toLocaleString("en-US")}${suffix}`;

export function render(root: HTMLElement): void {
  root.innerHTML = `
  <header class="nav">
    <a class="nav__name" href="#top">${esc(profile.name)}</a>
    <nav>
      <a href="#projects">Projects</a>
      <a href="#experience">Experience</a>
      <a href="#about">About</a>
      <a href="#contact">Contact</a>
      <button class="nav__k" type="button" aria-label="Open command palette" data-magnetic><kbd>⌘K</kbd></button>
      <button class="nav__theme" type="button" data-magnetic></button>
      <a class="nav__cv" href="${esc(profile.cv)}" download data-magnetic>CV <span aria-hidden="true">↓</span></a>
    </nav>
  </header>

  <main>
    <section class="hero" id="top">
      <div>
        <p class="hero__role"><b>${esc(profile.name)}</b> · ${esc(profile.role)}</p>
        <p class="hero__badge"><span class="hero__dot" aria-hidden="true"></span>${esc(profile.availability)}</p>
        <h1 class="hero__title">${profile.headline
          .split(" ")
          .map((w) => `<span class="word">${esc(w)}</span>`)
          .join(" ")}</h1>
        <p class="hero__intro">${esc(profile.intro)}</p>
        <div class="hero__cta">
          <a class="btn" href="#projects" data-magnetic>See my work <span aria-hidden="true">↓</span></a>
          <a class="btn btn--ghost" href="${esc(profile.cv)}" download data-magnetic>Download CV</a>
        </div>
        <p class="hero__worked"><span>Worked at</span>${jobs.map((j) => `<b>${esc(j.company)}</b>`).join("")}</p>
      </div>
      <figure class="viz" aria-label="Animated 3D pose estimation of a running athlete">
        <canvas class="viz__canvas"></canvas>
        <div class="viz__hud" aria-hidden="true">
          <span>knee L <b class="hud-knee">—</b></span>
          <span>phase <b class="hud-phase">—</b></span>
          <span>keypoints <b>17</b></span>
        </div>
        <figcaption>live pose estimation · move the cursor to rotate</figcaption>
      </figure>
    </section>

    <section class="stats">
      ${stats
        .map(
          (s) => `
        <div class="stat reveal">
          <span class="stat__value" aria-hidden="true" data-value="${s.value}" data-prefix="${esc(s.prefix ?? "")}" data-suffix="${esc(s.suffix ?? "")}">${esc(formatStat(s.value, s.prefix, s.suffix))}</span>
          <span class="stat__label"><span class="sr-only">${esc(formatStat(s.value, s.prefix, s.suffix))} </span>${esc(s.label)}</span>
        </div>`,
        )
        .join("")}
    </section>

    <div class="marquee">
      <ul class="marquee__track">
        ${[...stack, ...stack]
          .map((t, i) => `<li${i >= stack.length ? ' aria-hidden="true"' : ""}>${esc(t)}</li>`)
          .join("")}
      </ul>
    </div>

    <section id="terminal" class="console">
      <h2 class="stream">Ask my terminal</h2>
      <div class="term reveal">
        <div class="term__out" role="log" aria-live="polite"></div>
        <label class="term__prompt"><span aria-hidden="true">$</span><input id="term-input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Terminal command, for example help" placeholder="type help" /></label>
      </div>
      <p class="console__hint reveal">Try <kbd>projects</kbd>, <kbd>open 2</kbd>, <kbd>sudo hire-me</kbd> — or press <kbd>⌘K</kbd> anywhere.</p>
    </section>

    <section id="projects">
      <h2 class="stream">Selected projects</h2>
      ${projects
        .map(
          (p, i) => `
        <article class="card reveal">
          <span class="card__num" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span>
          <div class="card__head">
            <p class="card__org">${esc(p.org)}</p>
            <h3>${esc(p.title)}</h3>
            <p class="card__summary">${esc(p.summary)}</p>
            <ul class="metrics">${metricsHTML(p)}</ul>
          </div>
          <div class="card__body">
            ${sideHTML(p)}
            <button class="card__open" type="button">Case study <span aria-hidden="true">→</span></button>
          </div>
        </article>`,
        )
        .join("")}
    </section>

    <section id="experience">
      <h2 class="stream">Experience</h2>
      <div class="timeline">
        <span class="timeline__line" aria-hidden="true"></span>
        <ol>
          ${jobs
            .map(
              (j) => `
          <li class="job reveal${j.end ? "" : " job--now"}">
            <div class="job__side">
              <span class="job__years">${years(j)}</span>
              <span class="job__dur">${duration(months(j.start, j.end))}${j.end ? "" : ` <span class="job__live"><i aria-hidden="true"></i>now</span>`}</span>
            </div>
            <div class="job__main">
              <h3>${esc(j.company)}</h3>
              <p class="job__role">${esc(j.role)}</p>
              <p class="job__summary">${esc(j.summary)}</p>
              <ul class="job__chips">${j.chips.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>
              <ul class="tags">${j.stack.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
            </div>
          </li>`,
            )
            .join("")}
        </ol>
      </div>
    </section>

    <section id="about">
      <h2 class="stream">About</h2>
      <blockquote class="about__quote reveal">${esc(profile.quote)}</blockquote>
      <div class="bento">
        <div class="tile tile--text reveal">
          ${profile.about
            .map((t) => `<p class="about__text">${t.split(" ").map((w) => `<span class="w">${esc(w)}</span>`).join(" ")}</p>`)
            .join("")}
          <p class="about__hint" aria-hidden="true">hover a word · attention head 1 / layer 12</p>
        </div>
        <div class="tile tile--leet reveal">
          <p class="tile__label">LeetCode</p>
          <div class="ring">
            <svg viewBox="0 0 120 120" aria-hidden="true">
              <circle class="ring__track" cx="60" cy="60" r="52" />
              <circle class="ring__bar" cx="60" cy="60" r="52" pathLength="100" style="--p: ${Math.round((profile.leetcode.hard / profile.leetcode.hardTotal) * 100)}" />
            </svg>
            <span class="ring__text"><b>#${profile.leetcode.rank}</b>global</span>
          </div>
          <p>${profile.leetcode.hard} / ${profile.leetcode.hardTotal} hard · ${profile.leetcode.solved.toLocaleString("en-US")} solved</p>
        </div>
        <div class="tile tile--now reveal">
          <p class="tile__label"><span class="hero__dot" aria-hidden="true"></span>Now</p>
          <p class="tile__big">${esc(profile.now)}</p>
        </div>
        ${profile.facts
          .map(
            (f) => `
        <div class="tile tile--${f.label.toLowerCase()} reveal">
          <p class="tile__label">${esc(f.label)}</p>
          <p class="tile__big">${esc(f.text)}</p>
        </div>`,
          )
          .join("")}
        <div class="tile tile--how reveal">
          <p class="tile__label">How I work</p>
          <ol class="principles">
            ${profile.principles
              .map((x, i) => `<li><span>0${i + 1}</span><b>${esc(x.title)}</b><p>${esc(x.text)}</p></li>`)
              .join("")}
          </ol>
        </div>
      </div>
    </section>

    <section id="contact">
      <h2 class="stream">Let's talk.</h2>
      <p class="reveal">${esc(profile.contactNote)}</p>
      <a class="btn btn--big reveal" data-magnetic href="mailto:${esc(profile.email)}">${esc(profile.email)}</a>
      <ul class="socials reveal">
        ${profile.socials.map((s) => `<li>${ext(s.href, s.label)}</li>`).join("")}
      </ul>
    </section>
  </main>

  <footer class="footer">© ${new Date().getFullYear()} ${esc(profile.name)} · press <kbd>⌘K</kbd></footer>

  <dialog class="case" aria-labelledby="case-title">
    <button class="case__close" type="button" aria-label="Close case study">✕</button>
    <div class="case__body"></div>
  </dialog>

  <dialog class="palette" aria-label="Command palette">
    <input type="text" role="combobox" aria-expanded="true" aria-controls="pal-list" aria-autocomplete="list" placeholder="Search projects, sections, actions…" autocomplete="off" spellcheck="false" />
    <ul id="pal-list" role="listbox"></ul>
    <p class="palette__hint">↑↓ move · Enter run · Esc close</p>
  </dialog>`;
}
