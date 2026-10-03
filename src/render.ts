import { jobs, profile, projects, stack, stats } from "./content";

const ENTITIES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ENTITIES[c]);

const ext = (href: string, label: string) =>
  `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(label)}</a>`;

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
      <a class="nav__cv" href="${esc(profile.cv)}" target="_blank" rel="noopener">CV ↓</a>
    </nav>
  </header>

  <main>
    <section class="hero" id="top">
      <div>
        <p class="hero__role">${esc(profile.role)}</p>
        <h1 class="hero__title">${profile.headline
          .split(" ")
          .map((w) => `<span class="word">${esc(w)}</span>`)
          .join(" ")}</h1>
        <p class="hero__intro">${esc(profile.intro)}</p>
        <div class="hero__cta">
          <a class="btn" href="#projects">See my work ↓</a>
          <a class="btn btn--ghost" href="${esc(profile.cv)}" target="_blank" rel="noopener">Download CV</a>
        </div>
      </div>
      <pre class="term" aria-hidden="true"><code>${profile.terminal
        .map((line, i, all) => {
          const cls = ["term__line"];
          if (line.startsWith("$ ")) cls.push("term__line--cmd");
          if (i === all.length - 1) cls.push("term__line--caret");
          return `<span class="${cls.join(" ")}">${esc(line)}</span>`;
        })
        .join("")}</code></pre>
    </section>

    <section class="stats">
      ${stats
        .map(
          (s) => `
        <div class="stat reveal">
          <span class="stat__value" data-value="${s.value}" data-prefix="${esc(s.prefix ?? "")}" data-suffix="${esc(s.suffix ?? "")}">${esc(formatStat(s.value, s.prefix, s.suffix))}</span>
          <span class="stat__label">${esc(s.label)}</span>
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

    <section id="projects">
      <h2 class="reveal">Selected projects</h2>
      ${projects
        .map(
          (p, i) => `
        <article class="card reveal">
          <span class="card__num" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span>
          <div class="card__head">
            <p class="card__org">${esc(p.org)}</p>
            <h3>${esc(p.title)}</h3>
            <p class="card__summary">${esc(p.summary)}</p>
            <ul class="metrics">
              ${p.metrics
                .map(
                  (m) =>
                    `<li><span class="metric__value">${esc(m.value)}</span><span class="metric__label">${esc(m.label)}</span></li>`,
                )
                .join("")}
            </ul>
          </div>
          <div class="card__body">
            <p class="card__label">What I did</p>
            <ul class="highlights">${p.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>
            <ul class="tags">${p.stack.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
            ${p.links.length ? `<p class="card__links">${p.links.map((l) => ext(l.href, `${l.label} ↗`)).join("")}</p>` : ""}
          </div>
        </article>`,
        )
        .join("")}
    </section>

    <section id="experience">
      <h2 class="reveal">Experience</h2>
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
      <h2 class="reveal">About</h2>
      ${profile.about.map((t) => `<p class="reveal">${esc(t)}</p>`).join("")}
      <ul class="facts">
        ${profile.facts.map((f) => `<li class="reveal"><span>${esc(f.label)}</span>${esc(f.text)}</li>`).join("")}
      </ul>
    </section>

    <section id="contact">
      <h2 class="reveal">Let's talk.</h2>
      <p class="reveal">${esc(profile.contactNote)}</p>
      <a class="btn btn--big reveal" href="mailto:${esc(profile.email)}">${esc(profile.email)}</a>
      <ul class="socials reveal">
        ${profile.socials.map((s) => `<li>${ext(s.href, s.label)}</li>`).join("")}
      </ul>
    </section>
  </main>

  <footer class="footer">© ${new Date().getFullYear()} ${esc(profile.name)}</footer>`;
}
