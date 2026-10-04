import { jobs, notes, profile, projects, stack } from "./content";

type Hooks = { openCase: (i: number) => void; toggleTheme: () => void };
type Action = { label: string; hint: string; run: () => void };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const download = (href: string) => {
  const a = document.createElement("a");
  a.href = href;
  a.download = "";
  a.click();
};

const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

export function initCommands({ openCase, toggleTheme }: Hooks, reduce: boolean): void {
  const out = document.querySelector<HTMLElement>(".term__out")!;
  const input = document.querySelector<HTMLInputElement>("#term-input")!;

  const print = (text: string, cls = "") => {
    const line = document.createElement("span");
    line.className = `term__line ${cls}`;
    line.textContent = text;
    out.append(line);
    out.scrollTop = out.scrollHeight;
  };

  const COMMANDS: Record<string, (args: string[]) => string | void> = {
    help: () =>
      "commands: whoami · projects · open <n> · notes · experience · stack · contact · cv · leetcode · theme · ls · cat about.txt · clear · sudo hire-me",
    whoami: () => `${profile.name} — ${profile.role}\n${profile.intro}`,
    projects: () => projects.map((p, i) => `${i + 1}. ${p.title}`).join("\n") + "\n→ open <n> for the full case study",
    open: ([n]) => {
      const i = Number(n) - 1;
      if (!projects[i]) return `open: pick a project 1–${projects.length}`;
      openCase(i);
      return `opening "${projects[i].title}"…`;
    },
    notes: () => notes.map((n, i) => `${i + 1}. ${n.title}\n   ${location.origin}/notes/${n.slug}/`).join("\n"),
    experience: () => jobs.map((j) => `${j.period.padEnd(20)} ${j.company}`).join("\n"),
    stack: () => stack.join(" · "),
    contact: () =>
      [`email     ${profile.email}`, ...profile.socials.map((s) => `${s.label.toLowerCase().padEnd(9)} ${s.href}`)].join("\n"),
    cv: () => {
      download(profile.cv);
      return "downloading Khachatur_Pepanyan_CV.pdf…";
    },
    leetcode: () => profile.terminal[profile.terminal.length - 1],
    theme: () => {
      toggleTheme();
      return "theme switched";
    },
    ls: () => "projects/  experience/  notes/  about.txt  cv.pdf",
    cat: ([file]) => (file === "about.txt" ? profile.about.join("\n\n") : `cat: ${file ?? ""}: no such file`),
    clear: () => {
      out.replaceChildren();
    },
    sudo: (args) => {
      if (args.join(" ") !== "hire-me") return "sudo: try `sudo hire-me`";
      location.href = `mailto:${profile.email}?subject=${encodeURIComponent("Let's talk")}`;
      return "permission granted ✓ opening your mail client…";
    },
  };

  const run = (raw: string) => {
    const [name = "", ...args] = raw.trim().split(/\s+/);
    print(`$ ${raw}`, "term__line--cmd");
    if (!name) return;
    const cmd = COMMANDS[name.toLowerCase()];
    const result = cmd ? cmd(args) : `command not found: ${name} — try help`;
    if (result) result.split("\n").forEach((l) => print(l));
  };

  const history: string[] = [];
  let cursor = 0;
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const value = input.value;
      if (value.trim()) history.push(value);
      cursor = history.length;
      input.value = "";
      run(value);
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      cursor = Math.max(0, Math.min(history.length, cursor + (e.key === "ArrowUp" ? -1 : 1)));
      input.value = history[cursor] ?? "";
    } else if (e.key === "Tab" && input.value) {
      const match = Object.keys(COMMANDS).find((c) => c.startsWith(input.value.toLowerCase()));
      if (match) {
        e.preventDefault();
        input.value = match + " ";
      }
    }
  });
  out.addEventListener("click", () => input.focus());

  // intro: type the scripted session once the terminal scrolls into view
  const intro = async () => {
    for (const line of profile.terminal) {
      if (reduce || !line.startsWith("$ ")) {
        print(line, line.startsWith("$ ") ? "term__line--cmd" : "");
        if (!reduce) await sleep(160);
        continue;
      }
      const el = document.createElement("span");
      el.className = "term__line term__line--cmd term__line--caret";
      out.append(el);
      for (let n = 1; n <= line.length; n++) {
        el.textContent = line.slice(0, n);
        await sleep(40);
      }
      el.classList.remove("term__line--caret");
      await sleep(260);
    }
    print("type help to see what I can do", "term__line--hint");
  };
  new IntersectionObserver((entries, obs) => {
    if (entries[0].isIntersecting) {
      obs.disconnect();
      void intro();
    }
  }).observe(out);

  initPalette([
    ...["projects", "experience", "about", "notes", "contact"].map((id) => ({
      label: `Go to ${id[0].toUpperCase()}${id.slice(1)}`,
      hint: "section",
      run: () => go(id),
    })),
    ...projects.map((p, i) => ({ label: p.title, hint: "case study", run: () => openCase(i) })),
    ...notes.map((n) => ({ label: n.title, hint: "note", run: () => location.assign(`/notes/${n.slug}/`) })),
    { label: "Open terminal", hint: "interactive", run: () => (go("terminal"), input.focus({ preventScroll: true })) },
    { label: "Download CV", hint: "pdf", run: () => download(profile.cv) },
    { label: "Copy email", hint: profile.email, run: () => void navigator.clipboard?.writeText(profile.email) },
    { label: "Toggle light / dark theme", hint: "theme", run: toggleTheme },
    ...profile.socials.map((s) => ({ label: `Open ${s.label}`, hint: "link", run: () => window.open(s.href, "_blank", "noopener") })),
  ]);
}

// subsequence match: "dcv" finds "Download CV"; score = span of the match (tighter ranks first), -1 = no match
const fuzzy = (query: string, text: string) => {
  let i = 0;
  let first = -1;
  const t = text.toLowerCase();
  for (const ch of query.toLowerCase()) {
    i = t.indexOf(ch, i);
    if (i < 0) return -1;
    if (first < 0) first = i;
    i++;
  }
  return first < 0 ? 0 : i - first;
};

function initPalette(actions: Action[]): void {
  const dialog = document.querySelector<HTMLDialogElement>(".palette")!;
  const input = dialog.querySelector("input")!;
  const list = dialog.querySelector("ul")!;
  let shown: Action[] = actions;
  let active = 0;

  const paint = () => {
    shown = actions
      .map((a) => ({ a, score: fuzzy(input.value, a.label) }))
      .filter((x) => x.score >= 0)
      .sort((x, y) => x.score - y.score)
      .map((x) => x.a);
    active = Math.min(active, Math.max(0, shown.length - 1));
    list.replaceChildren(
      ...shown.map((a, i) => {
        const li = document.createElement("li");
        li.id = `pal-${i}`;
        li.setAttribute("role", "option");
        li.setAttribute("aria-selected", String(i === active));
        li.innerHTML = `<span></span><small></small>`;
        li.firstElementChild!.textContent = a.label;
        li.lastElementChild!.textContent = a.hint;
        li.addEventListener("click", () => choose(i));
        li.addEventListener("pointermove", () => {
          if (active !== i) (active = i), paint();
        });
        return li;
      }),
    );
    input.setAttribute("aria-activedescendant", shown.length ? `pal-${active}` : "");
    list.children[active]?.scrollIntoView({ block: "nearest" });
  };

  const choose = (i: number) => {
    const action = shown[i];
    if (!action) return;
    dialog.close();
    action.run();
  };

  const open = () => {
    input.value = "";
    active = 0;
    paint();
    dialog.showModal();
  };

  input.addEventListener("input", () => ((active = 0), paint()));
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      active = (active + (e.key === "ArrowDown" ? 1 : -1) + shown.length) % Math.max(shown.length, 1);
      paint();
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(active);
    }
  });
  dialog.addEventListener("click", (e) => e.target === dialog && dialog.close());
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      if (dialog.open) dialog.close();
      else open();
    }
  });
  document.querySelector(".nav__k")?.addEventListener("click", open);
}
