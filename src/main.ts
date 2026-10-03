import "./style.css";
import { profile } from "./content";
import { render } from "./render";
import { initMotion } from "./motion";
import { initSkeleton } from "./skeleton";
import { initCase } from "./case";
import { initCommands } from "./commands";
import { initAttention, initAurora, initMagnetic, initTheme } from "./interactions";

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

render(document.getElementById("app")!);
initSkeleton(
  document.querySelector<HTMLCanvasElement>(".viz__canvas")!,
  document.querySelector<HTMLElement>(".hud-knee")!,
  document.querySelector<HTMLElement>(".hud-phase")!,
  reduce,
);
const toggleTheme = initTheme(reduce);
const openCase = initCase(reduce);
initCommands({ openCase, toggleTheme }, reduce);
initAttention(profile.attention);
if (!reduce) {
  initMagnetic();
  initAurora();
}
initMotion(reduce);
