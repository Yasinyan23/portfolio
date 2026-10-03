import { gsap } from "gsap";

// Theme: light/dark with a circular reveal from the button (View Transitions); choice persists.
export function initTheme(reduce: boolean): () => void {
  const root = document.documentElement;
  const btn = document.querySelector<HTMLButtonElement>(".nav__theme")!;
  const sync = () => {
    const light = root.dataset.theme === "light";
    btn.setAttribute("aria-label", light ? "Switch to dark theme" : "Switch to light theme");
    btn.textContent = light ? "☾" : "☀";
  };
  sync();

  const toggle = () => {
    const apply = () => {
      root.dataset.theme = root.dataset.theme === "light" ? "dark" : "light";
      try {
        localStorage.setItem("theme", root.dataset.theme);
      } catch {
        // private mode: the choice just isn't remembered
      }
      sync();
    };
    if (reduce || !document.startViewTransition) return apply();
    const r = btn.getBoundingClientRect();
    root.style.setProperty("--tx", `${r.left + r.width / 2}px`);
    root.style.setProperty("--ty", `${r.top + r.height / 2}px`);
    root.classList.add("theme-vt");
    const vt = document.startViewTransition(apply);
    vt.ready.catch(() => {}); // aborted (e.g. tab hidden): the DOM update still applies
    vt.finished.finally(() => root.classList.remove("theme-vt"));
  };
  btn.addEventListener("click", toggle);
  return toggle;
}

// Background glow drifts after the pointer (CSS transition does the easing). Fine pointers only.
export function initAurora(): void {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  const root = document.documentElement;
  let queued = false;
  addEventListener("pointermove", (e) => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      root.style.setProperty("--px", (e.clientX / innerWidth - 0.5).toFixed(3));
      root.style.setProperty("--py", (e.clientY / innerHeight - 0.5).toFixed(3));
    });
  });
}

// Buttons lean toward the pointer. Fine pointers only.
export function initMagnetic(): void {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  document.querySelectorAll<HTMLElement>("[data-magnetic], .socials a").forEach((el) => {
    const mx = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3" });
    const my = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3" });
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      mx((e.clientX - r.left - r.width / 2) * 0.3);
      my((e.clientY - r.top - r.height / 2) * 0.35);
    });
    el.addEventListener("pointerleave", () => (mx(0), my(0)));
  });
}

// About text: hovering a word lights up related words like a transformer attention head.
export function initAttention(groups: string[][]): void {
  const about = document.getElementById("about")!;
  const words = Array.from(about.querySelectorAll<HTMLElement>(".w"));
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9#+–-]/g, "");
  const group = words.map((w) => groups.findIndex((g) => g.includes(norm(w.textContent ?? ""))));

  words.forEach((w, i) =>
    w.addEventListener("pointerenter", () => {
      about.classList.add("attending");
      words.forEach((o, j) => {
        let a = Math.max(0, 1 - Math.abs(i - j) / 5) * 0.45; // local context
        if (group[i] >= 0 && group[j] === group[i]) a = Math.max(a, 0.9);
        if (i === j) a = 1;
        o.style.setProperty("--a", a.toFixed(2));
      });
    }),
  );
  about.querySelectorAll(".about__text").forEach((p) =>
    p.addEventListener("pointerleave", () => about.classList.remove("attending")),
  );
}
