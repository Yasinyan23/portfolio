import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { formatStat } from "./render";

gsap.registerPlugin(ScrollTrigger);

const GLYPHS = "!<>-_/[]{}=+*^?#01";

// words appear like streamed LLM tokens: blurred, irregular timing, a caret while streaming
function streamTokens(h: HTMLElement): void {
  h.innerHTML = (h.textContent ?? "")
    .split(" ")
    .map((w) => `<span class="tok">${w.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</span>`)
    .join(" ");
  const toks = h.querySelectorAll(".tok");
  gsap.set(toks, { opacity: 0, filter: "blur(8px)", y: 6 });
  ScrollTrigger.create({
    trigger: h,
    start: "clamp(top 88%)",
    once: true,
    onEnter: () => {
      h.classList.add("streaming");
      gsap.to(toks, {
        opacity: 1,
        filter: "blur(0px)",
        y: 0,
        duration: 0.45,
        ease: "power2.out",
        stagger: (i) => i * 0.09 + Math.random() * 0.08,
        onComplete: () => void setTimeout(() => h.classList.remove("streaming"), 700),
      });
    },
  });
}

// characters resolve left to right out of random glyphs
export function scramble(el: HTMLElement, duration = 0.8, delay = 0): void {
  const text = el.textContent ?? "";
  el.setAttribute("aria-label", text);
  const state = { p: 0 };
  gsap.to(state, {
    p: 1,
    duration,
    delay,
    ease: "power1.inOut",
    onUpdate: () => {
      const done = Math.floor(state.p * text.length);
      el.textContent = [...text]
        .map((ch, i) => (i < done || ch === " " ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0]))
        .join("");
    },
    onComplete: () => void (el.textContent = text),
  });
}

export function initMotion(reduce: boolean): void {
  // card spotlight follows the cursor; not movement, so it stays on with reduced motion
  document.querySelectorAll<HTMLElement>(".card").forEach((card) =>
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    }),
  );

  if (reduce) return;

  gsap
    .timeline({ defaults: { ease: "power4.out" } })
    .from([".hero__role", ".hero__badge"], { y: 20, autoAlpha: 0, duration: 0.6, stagger: 0.1 })
    .from(".hero__title .word", { yPercent: 100, autoAlpha: 0, rotate: 3, duration: 0.9, stagger: 0.07 }, "-=0.3")
    .from([".hero__intro", ".hero__cta", ".hero__worked"], { y: 24, autoAlpha: 0, duration: 0.7, stagger: 0.1 }, "-=0.5")
    .from(".flow", { scale: 0.94, autoAlpha: 0, duration: 1.1 }, "-=0.9");

  // section headings alternate between two entrances so no two neighbours feel the same
  document.querySelectorAll<HTMLElement>("h2.stream").forEach((h, i) => {
    if (i % 2 === 0) return streamTokens(h);
    gsap.set(h, { opacity: 0 });
    ScrollTrigger.create({
      trigger: h,
      start: "clamp(top 88%)",
      once: true,
      onEnter: () => {
        gsap.to(h, { opacity: 1, duration: 0.2 });
        scramble(h, 0.9);
      },
    });
  });

  document.querySelectorAll<HTMLElement>(".card h3").forEach((h) =>
    ScrollTrigger.create({ trigger: h, start: "clamp(top 85%)", once: true, onEnter: () => scramble(h, 0.7) }),
  );

  // opacity, not autoAlpha: blocks waiting to reveal stay focusable for keyboard and screen readers
  gsap.set(".reveal", { opacity: 0, y: 48 });
  ScrollTrigger.batch(".reveal", {
    start: "clamp(top 88%)", // clamp so the last blocks still fire on very tall viewports
    once: true,
    batchMax: 4,
    onEnter: (els) =>
      gsap.to(els, { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "power3.out", clearProps: "transform" }),
  });

  document.querySelectorAll<HTMLElement>(".stat__value").forEach((el) => {
    const { prefix = "", suffix = "" } = el.dataset;
    const counter = { value: 0 };
    el.textContent = formatStat(0, prefix, suffix);
    gsap.to(counter, {
      value: Number(el.dataset.value),
      duration: 1.8,
      ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 92%", once: true },
      onUpdate: () => {
        el.textContent = formatStat(counter.value, prefix, suffix);
      },
    });
  });

  // the job in the middle of the screen lights up its year and timeline node
  document.querySelectorAll<HTMLElement>(".job").forEach((job) =>
    ScrollTrigger.create({ trigger: job, start: "top 60%", end: "bottom 40%", toggleClass: "is-active" }),
  );

  gsap.from(".ring__bar", {
    strokeDashoffset: 100,
    duration: 1.6,
    ease: "power3.out",
    scrollTrigger: { trigger: ".ring", start: "top 90%", once: true },
  });

  gsap.from(".timeline__line", {
    scaleY: 0,
    ease: "none",
    scrollTrigger: { trigger: ".timeline", start: "top 75%", end: "bottom 65%", scrub: true },
  });
}
