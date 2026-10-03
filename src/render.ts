import { jobs, profile, projects, stack, stats } from "./content";
import type { Project } from "./content";

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
        <p class="hero__badge"><span class="hero__dot" aria-hidden="true"></span>${esc(profile.availability)}</p>
        <p class="hero__role">${esc(profile.name)} · ${esc(profile.role)}</p>
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
          <li class="job reveal">
            <span class="job__period">${esc(j.period)}</span>
            <h3>${esc(j.company)}</h3>
            <p class="job__role">${esc(j.role)}</p>
            <p class="job__summary">${esc(j.summary)}</p>
          </li>`,
            )
            .join("")}
        </ol>
      </div>
    </section>

    <section id="about">
      <h2 class="stream">About</h2>
      ${profile.about
        .map((t) => `<p class="about__text reveal">${t.split(" ").map((w) => `<span class="w">${esc(w)}</span>`).join(" ")}</p>`)
        .join("")}
      <p class="about__hint reveal" aria-hidden="true">hover a word · attention head 1 / layer 12</p>
      <ul class="facts">
        ${profile.facts.map((f) => `<li class="reveal"><span>${esc(f.label)}</span>${esc(f.text)}</li>`).join("")}
      </ul>
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
