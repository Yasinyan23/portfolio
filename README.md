# pepaniank.pages.dev

Personal site of **Khachatur Pepanyan**, Senior AI Engineer — live at **[pepaniank.pages.dev](https://pepaniank.pages.dev)**.

One static page, no backend, no UI framework: Vite, TypeScript and GSAP, with every diagram hand-drawn in SVG.

## What's inside

- **Agent request stream** (hero) — the same task flowing through Junior, Mid, Senior and Staff-level agent systems: queues, tool errors, retries, caches, parallel models, quality gates and a release path from `scp` to a Kubernetes canary. A seeded RNG makes every level tell the same story on each run. Hover a node to see what it does.
- **Case studies** — each project opens full-screen with a View Transitions morph, metrics and an animated architecture diagram.
- **Terminal and ⌘K palette** — type `help` in the terminal, or press ⌘K anywhere.
- **Notes** — long-form articles as plain static pages in `public/notes/`.
- Light and dark themes with a circular reveal; `prefers-reduced-motion` is respected everywhere.

## Performance

- One JS bundle (~70 kB gzipped) and one CSS file; no images on the critical path.
- Animation loops run only while visible — they pause off-screen (IntersectionObserver) and in background tabs.
- All content is rendered from `src/content.ts`; there is no runtime data fetching.

## Structure

```
src/
  content.ts       text, projects, metrics, diagrams and notes
  render.ts        HTML templates
  flow.ts          hero agent simulation
  mini.ts          case-study architecture diagrams
  svg.ts           shared SVG glyphs and helpers
  case.ts          full-screen case-study dialog
  commands.ts      terminal and command palette
  motion.ts        scroll animations (GSAP)
  interactions.ts  theme switch, magnetic buttons, hover effects
public/
  notes/           article pages
  og.png, favicon.svg, CV, robots.txt, sitemap.xml
```

## Run locally

```bash
npm ci
npm run dev      # http://localhost:5173
npm run build    # type-check and build into dist/
```

## Deploy

Every push to `main` builds the site and deploys `dist/` to Cloudflare Pages through GitHub Actions ([`deploy.yml`](.github/workflows/deploy.yml)). The workflow expects a `CLOUDFLARE_API_TOKEN` repository secret with the *Cloudflare Pages — Edit* permission.
