import "./style.css";
import { profile } from "./content";
import { render } from "./render";
import { initMotion } from "./motion";
import { initFlow } from "./flow";
import { initCase } from "./case";
import { initCommands } from "./commands";
import { initAttention, initAurora, initMagnetic, initTheme } from "./interactions";

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

render(document.getElementById("app")!);
initFlow(document.querySelector<HTMLElement>(".flow")!, reduce);
const toggleTheme = initTheme(reduce);
const openCase = initCase(reduce);
initCommands({ openCase, toggleTheme }, reduce);
initAttention(profile.attention);
if (!reduce) {
  initMagnetic();
  initAurora();
}
initMotion(reduce);
