// Procedural 3D running skeleton drawn like pose-estimation output. Canvas 2D, no dependencies;
// the loop runs only while the canvas is on screen and the tab is visible.

type V3 = [number, number, number];

// joints: 0 head, 1 neck, 2/3 shoulder L/R, 4/5 elbow, 6/7 wrist, 8 pelvis, 9/10 hip, 11/12 knee, 13/14 ankle, 15/16 toe
const BONES: [number, number][] = [
  [0, 1], [1, 2], [1, 3], [2, 4], [4, 6], [3, 5], [5, 7], [1, 8],
  [8, 9], [8, 10], [9, 11], [11, 13], [13, 15], [10, 12], [12, 14], [14, 16],
];
const CYCLE_S = 0.9; // one stride (both legs)
const TRAIL = 14;

const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const seg = (len: number, angle: number, z = 0): V3 => [len * Math.sin(angle), -len * Math.cos(angle), z];

function leg(hip: V3, psi: number) {
  const thigh = 0.55 * Math.sin(psi);
  const flex = 0.25 + 0.95 * Math.max(0, Math.sin(psi + 2.2));
  const knee = add(hip, seg(0.45, thigh));
  const shin = thigh - flex;
  const ankle = add(knee, seg(0.45, shin));
  const toe = add(ankle, [0.14 * Math.cos(shin), 0.14 * Math.sin(shin), 0]);
  return { knee, ankle, toe, flex };
}

function arm(shoulder: V3, psi: number) {
  const upper = -0.5 * Math.sin(psi);
  const elbow = add(shoulder, seg(0.3, upper));
  return { elbow, wrist: add(elbow, seg(0.28, upper + 1.5)) };
}

export function pose(phi: number) {
  const pelvis: V3 = [0, 0.93 + 0.035 * (1 - Math.cos(2 * phi)), 0];
  const lean = 0.18;
  const neck = add(pelvis, [0.55 * Math.sin(lean), 0.55 * Math.cos(lean), 0]);
  const head = add(neck, [0.14 * Math.sin(lean), 0.14 * Math.cos(lean), 0]);
  const shL = add(neck, [0, -0.04, 0.18]);
  const shR = add(neck, [0, -0.04, -0.18]);
  const hipL = add(pelvis, [0, 0, 0.1]);
  const hipR = add(pelvis, [0, 0, -0.1]);
  const lL = leg(hipL, phi);
  const lR = leg(hipR, phi + Math.PI);
  const aL = arm(shL, phi);
  const aR = arm(shR, phi + Math.PI);
  const joints: V3[] = [
    head, neck, shL, shR, aL.elbow, aR.elbow, aL.wrist, aR.wrist,
    pelvis, hipL, hipR, lL.knee, lR.knee, lL.ankle, lR.ankle, lL.toe, lR.toe,
  ];
  return { joints, kneeL: 180 - (lL.flex * 180) / Math.PI };
}

export function gaitPhase(phi: number): string {
  const s = Math.sin(phi);
  if (Math.cos(phi) >= 0) return "swing";
  return s > -0.6 ? "stance" : "toe-off";
}

export function initSkeleton(canvas: HTMLCanvasElement, knee: HTMLElement, phase: HTMLElement, reduce: boolean): void {
  const ctx = canvas.getContext("2d")!;
  let w = 0;
  let h = 0;
  let phi = 0.8;
  let yaw = 0.7;
  let targetYaw = 0.7;
  let lastPointer = 0;
  let visible = false;
  let raf = 0;
  let last = 0;
  let hudAt = 0;
  const trails: [number, number][][] = [[], [], [], []]; // ankles + wrists

  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (reduce || !visible) draw();
  };

  const project = ([x, y, z]: V3): [number, number, number] => {
    const xr = x * Math.cos(yaw) - z * Math.sin(yaw);
    const zr = x * Math.sin(yaw) + z * Math.cos(yaw);
    const k = 3 / (3 + zr);
    const s = h * 0.4 * k;
    return [w / 2 + xr * s, h * 0.86 - y * s, zr];
  };

  function draw() {
    if (!w || !h) return;
    const { joints, kneeL } = pose(phi);
    const pts = joints.map(project);
    ctx.clearRect(0, 0, w, h);

    // ground shadow
    ctx.fillStyle = "rgba(124, 92, 255, 0.18)";
    ctx.beginPath();
    ctx.ellipse(w / 2, h * 0.88, w * 0.16, h * 0.025, 0, 0, Math.PI * 2);
    ctx.fill();

    // motion trails for ankles and wrists
    [13, 14, 6, 7].forEach((j, i) => {
      const t = trails[i];
      t.push([pts[j][0], pts[j][1]]);
      if (t.length > TRAIL) t.shift();
      t.forEach(([x, y], n) => {
        ctx.fillStyle = `rgba(45, 226, 192, ${(n / TRAIL) * 0.35})`;
        ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
      });
    });

    // detection box with corner brackets
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    const pad = 18;
    const bx = Math.min(...xs) - pad;
    const by = Math.min(...ys) - pad - 10;
    const bw = Math.max(...xs) - bx + pad;
    const bh = Math.max(...ys) - by + pad;
    const c = 14;
    ctx.strokeStyle = "rgba(45, 226, 192, 0.7)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (const [x, y, dx, dy] of [[bx, by, 1, 1], [bx + bw, by, -1, 1], [bx, by + bh, 1, -1], [bx + bw, by + bh, -1, -1]]) {
      ctx.moveTo(x + dx * c, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y + dy * c);
    }
    ctx.stroke();
    ctx.fillStyle = "rgba(45, 226, 192, 0.9)";
    ctx.font = "500 11px 'JetBrains Mono', monospace";
    ctx.fillText("person 0.98", bx, by - 6);

    // bones, far ones dimmer
    BONES.forEach(([a, b]) => {
      const depth = (pts[a][2] + pts[b][2]) / 2;
      const g = ctx.createLinearGradient(pts[a][0], pts[a][1], pts[b][0], pts[b][1]);
      g.addColorStop(0, "#2de2c0");
      g.addColorStop(1, "#7c5cff");
      ctx.strokeStyle = g;
      ctx.globalAlpha = depth > 0 ? 0.45 : 1;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(pts[a][0], pts[a][1]);
      ctx.lineTo(pts[b][0], pts[b][1]);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;

    // keypoints
    pts.forEach(([x, y, z], i) => {
      ctx.fillStyle = z > 0 ? "rgba(241, 241, 246, 0.5)" : "#f1f1f6";
      ctx.beginPath();
      ctx.arc(x, y, i === 0 ? 9 : 3.5, 0, Math.PI * 2);
      if (i === 0) {
        ctx.strokeStyle = "#2de2c0";
        ctx.stroke();
      } else ctx.fill();
    });

    const now = performance.now();
    if (now - hudAt > 120) {
      hudAt = now;
      knee.textContent = `${Math.round(kneeL)}°`;
      phase.textContent = gaitPhase(phi);
    }
  }

  function frame(t: number) {
    const dt = Math.min((t - last) / 1000, 0.05);
    last = t;
    phi = (phi + (dt * Math.PI * 2) / CYCLE_S) % (Math.PI * 2);
    if (t - lastPointer > 2000) targetYaw += dt * 0.25; // slow orbit when idle
    yaw += (targetYaw - yaw) * Math.min(1, dt * 5);
    draw();
    raf = requestAnimationFrame(frame);
  }

  const run = (on: boolean) => {
    cancelAnimationFrame(raf);
    if (on && !reduce) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  };

  canvas.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    targetYaw = ((e.clientX - r.left) / r.width - 0.5) * 2.4;
    lastPointer = performance.now();
  });

  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    run(visible && !document.hidden);
  }).observe(canvas);
  document.addEventListener("visibilitychange", () => run(visible && !document.hidden));
}
