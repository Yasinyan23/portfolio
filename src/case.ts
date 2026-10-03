import { projects } from "./content";
import { caseHTML } from "./render";

// Card → full-screen case study. The clicked card and its title share view-transition names with
// the dialog panel and its heading, so the browser morphs one into the other (and back on close).
export function initCase(reduce: boolean): (i: number) => void {
  const dialog = document.querySelector<HTMLDialogElement>(".case")!;
  const body = dialog.querySelector<HTMLElement>(".case__body")!;
  const cards = Array.from(document.querySelectorAll<HTMLElement>(".card"));
  let current = -1;

  const tag = (i: number, on: boolean) => {
    const card = cards[i];
    if (!card) return;
    card.style.viewTransitionName = on ? "case-card" : "";
    card.querySelector<HTMLElement>("h3")!.style.viewTransitionName = on ? "case-title" : "";
  };

  const transition = (update: () => void, done = () => {}) => {
    if (reduce || !document.startViewTransition) {
      update();
      done();
      return;
    }
    const vt = document.startViewTransition(update);
    vt.ready.catch(() => {}); // aborted (e.g. tab hidden): the DOM update still applies
    vt.finished.finally(done);
  };

  const fill = (i: number) => {
    current = i;
    body.innerHTML = caseHTML(projects[i], i, projects.length);
    body.scrollTop = 0;
  };

  const open = (i: number) => {
    if (dialog.open) return transition(() => fill(i));
    tag(i, true);
    transition(() => {
      tag(i, false);
      fill(i);
      dialog.showModal();
    });
  };

  const close = () => {
    const i = current;
    transition(
      () => {
        dialog.close();
        tag(i, true);
      },
      () => {
        tag(i, false);
        cards[i]?.querySelector<HTMLElement>(".card__open")?.focus({ preventScroll: true });
      },
    );
  };

  cards.forEach((card, i) =>
    card.addEventListener("click", (e) => {
      if ((e.target as HTMLElement).closest("a")) return; // links inside the card keep working
      open(i);
    }),
  );
  dialog.addEventListener("cancel", (e) => {
    e.preventDefault(); // Esc: animate instead of the instant native close
    close();
  });
  dialog.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (target === dialog || target.closest(".case__close")) close();
    const step = target.closest<HTMLElement>("[data-case]");
    if (step) open(Number(step.dataset.case));
  });

  return open;
}
