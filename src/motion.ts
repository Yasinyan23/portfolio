import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { formatStat } from "./render";

gsap.registerPlugin(ScrollTrigger);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function initMotion(): void {
  // card spotlight follows the cursor; not movement, so it stays on with reduced motion
  document.querySelectorAll<HTMLElement>(".card").forEach((card) =>
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    }),
  );

  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  gsap
    .timeline({ defaults: { ease: "power4.out" } })
    .from(".hero__role", { y: 20, autoAlpha: 0, duration: 0.6 })
    .from(".hero__title .word", { yPercent: 100, autoAlpha: 0, rotate: 3, duration: 0.9, stagger: 0.07 }, "-=0.3")
    .from([".hero__intro", ".hero__cta"], { y: 24, autoAlpha: 0, duration: 0.7, stagger: 0.1 }, "-=0.5")
    .from(".term", { y: 40, autoAlpha: 0, duration: 0.9 }, "-=0.6");

  void typeTerminal();

  gsap.set(".reveal", { autoAlpha: 0, y: 48 });
  ScrollTrigger.batch(".reveal", {
    start: "top 88%",
    once: true,
    onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "power3.out" }),
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

  gsap.from(".timeline__line", {
    scaleY: 0,
    ease: "none",
    scrollTrigger: { trigger: ".timeline", start: "top 75%", end: "bottom 65%", scrub: true },
  });
}

// types the terminal card line by line; commands char by char, output at once
async function typeTerminal(): Promise<void> {
  const lines = Array.from(document.querySelectorAll<HTMLElement>(".term__line"));
  const texts = lines.map((line) => line.textContent ?? "");
  lines.forEach((line) => (line.textContent = ""));
  await sleep(1600);
  for (const [i, line] of lines.entries()) {
    lines.forEach((l) => l.classList.toggle("term__line--caret", l === line));
    const text = texts[i];
    if (text.startsWith("$ ")) {
      for (let n = 1; n <= text.length; n++) {
        line.textContent = text.slice(0, n);
        await sleep(45);
      }
      await sleep(300);
    } else {
      line.textContent = text;
      await sleep(180);
    }
  }
}
