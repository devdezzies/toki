const DATA = __DATA__;
const stage = document.querySelector(".toki-stage");
// A check page (build --page=…) holds one scene as the stage itself; the figure holds both, stacked.
const SINGLE = DATA.single ?? null;
const sceneEl = SINGLE ? { [SINGLE]: stage } : { skin: stage.querySelector('[data-scene="skin"]'), core: stage.querySelector('[data-scene="core"]') };
const EMPTY = document.createElement("div");
const readout = document.querySelector("[data-readout]");
const announcer = document.querySelector(".toki-live");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const M = DATA.motion;
const NS = "http://www.w3.org/2000/svg";
const state = { theta: 0, scene: SINGLE ?? "skin", selected: null, power: true };
let angle = 0;
let target = 0;
let frame = 0;
let last = 0;
let visible = false;
let drawnAt = null;
let fading = null;
let touring = false;
let tourWait = 0;
let tourStarted = false;
let touched = false;
let pulse = null;
// shared with sim.js (concatenated after this file): the step the readout shows, and per-frame hooks
let simStep = null;
let simOn = false;
let demoFocus = null; // { group, point } the camera centres on (demo.js)
let onTakeOver = null; // demo.js: a user drag or key hands the camera back
let spaceAction = null; // demo.js: Space plays and pauses the demo
let autoStart = null; // demo.js: replaces the idle tour
let followTau = null; // demo.js: a slower, cinematic turn while the demo directs
let zoomTau = null;
const frameHooks = [];
const groupValue = (theta) => theta - DATA.azimuth;
const wrap = (x) => ((x % 360) + 360) % 360;
const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// ---------- the cheek glow: one gradient per page, its colour from the emotion on show ----------
let glowNow = "happy";
function setGlow(name) {
  glowNow = name ?? glowNow;
  stage.setAttribute("data-glow", glowNow);
}

// ---------- mounts ----------
const ctl = {};
let painting = false;
let ready = false;
const onFrame = () => {};
const hold = () => takeOver();
const mountScene = (name) => (ctl[name] = TURN.mount(sceneEl[name], DATA[name], { onHold: hold, onFrame: (c) => onFrame(name, c) }));
for (const name of Object.keys(sceneEl)) mountScene(name);
// Disassembly: one explode value e drives the four assemblies (the same pure function as model.mjs apartAt).
const ex = { x: 0, v: 0, target: 0 };
const apartAt = (e) => {
  const out = {};
  (DATA.assemblies ?? []).forEach((a, i) => {
    const t = Math.min(1, Math.max(0, (e - DATA.stagger.offset * i) / DATA.stagger.span));
    out[a.name] = a.travel * t * t * (3 - 2 * t);
  });
  return out;
};
const valuesFor = (name, theta, e) => (name === "core" ? { toki: groupValue(theta), ...apartAt(e) } : { toki: groupValue(theta) });
// One global hook for the tools, always pointing at the scene on show.
const HOOK = {
  get controller() {
    return ctl[state.scene];
  },
  set(next) {
    takeOver();
    const value = typeof next === "number" ? next : next && next.toki !== undefined ? next.toki : null;
    if (value !== null) angle = target = value + DATA.azimuth;
    if (next && typeof next === "object" && next.apart !== undefined) ex.x = ex.target = next.apart;
    draw(true);
    return ctl[state.scene].stats();
  },
  get() {
    takeOver();
    return ctl[state.scene].values;
  },
  order(name) {
    takeOver();
    return ctl[state.scene].order(name);
  },
  events() {
    takeOver();
    return ctl[state.scene].events();
  },
  stats() {
    return ctl[state.scene].stats();
  },
  layers: () => [...sceneEl[state.scene].querySelectorAll("svg[data-live]")].map((svg) => svg.dataset.live),
  scene(name) {
    takeOver();
    if (name && name !== state.scene) swap(name, true);
    return state.scene;
  },
};
window.__isoTurn = HOOK;

// the glow gradient lives in the skin scene's svg (the swirls' decals point at it)
{
  const svg = sceneEl.skin ? sceneEl.skin.querySelector("svg[data-live]") : null;
  if (svg) {
    const defs = document.createElementNS(NS, "defs");
    defs.innerHTML = `<radialGradient id="tk-glow-grad"><stop offset="0" class="tk-glow-stop" stop-opacity=".9"/><stop offset=".5" class="tk-glow-stop" stop-opacity=".45"/><stop offset="1" class="tk-glow-stop" stop-opacity="0"/></radialGradient>`;
    svg.prepend(defs);
  }
}
const fmt = (x) => (Math.round(x * 100) / 100).toString();
void fmt;

// ---------- selection ----------
const partsOf = DATA.parts; // component id → part names (hardware)
const coreScene = sceneEl.core ?? EMPTY;
const coreNodes = [...coreScene.querySelectorAll(".iso-live [data-name]")];
const ownerOf = new Map();
for (const [id, names] of Object.entries(partsOf)) for (const name of names) ownerOf.set(name, id);
const cableOf = (name) => {
  const m = /^(W\d)(?=[:.]|$)/.exec(name);
  return m ? m[1] : null;
};
function select(id) {
  state.selected = id;
  const comp = id ? DATA.components.find((c) => c.id === id) : null;
  const ups = new Set(comp ? comp.cables : []);
  const scene = coreScene;
  if (id) scene.setAttribute("data-sel", id);
  else scene.removeAttribute("data-sel");
  const litId = id ?? "09";
  for (const node of coreNodes) {
    const name = node.getAttribute("data-name");
    const owner = ownerOf.get(name);
    const cable = cableOf(name);
    const lit = owner === litId && (id || owner === "09") && !cable;
    const up = Boolean(id) && cable && ups.has(cable);
    const dim = Boolean(id) && !lit && !up;
    toggle(node, "data-lit", lit);
    node.querySelectorAll(".iso-solid").forEach((el) => toggle(el, "data-lit", lit));
    toggle(node, "data-up", up);
    toggle(node, "data-dim", dim);
  }
  scene.querySelectorAll("[data-trace]").forEach((el) => {
    const ends = (el.getAttribute("data-trace") || "").split(" ");
    const up = Boolean(id) && ends.includes(id);
    toggle(el, "data-up", up);
    toggle(el, "data-dim", Boolean(id) && !up);
  });
  document.querySelectorAll("[data-pick]").forEach((b) => b.setAttribute("aria-pressed", String(b.getAttribute("data-pick") === id)));
  document.querySelectorAll("[data-inspect-btn]").forEach((b) => (b.disabled = !id));
  say();
  describe();
}
const toggle = (el, attr, on) => {
  if (on) {
    if (!el.hasAttribute(attr)) el.setAttribute(attr, "");
  } else if (el.hasAttribute(attr)) el.removeAttribute(attr);
};

// ---------- power ----------
function setPower(on) {
  state.power = on;
  stage.setAttribute("data-power", on ? "on" : "off");
  if (!on && pulse) {
    pulse = null;
    paintPulse(null);
  }
  say();
  describe();
  announce(on ? "power on" : "power off");
}

// ---------- scenes ----------
function swap(name, instant = false) {
  if (name === state.scene || !sceneEl[name]) return;
  const from = state.scene;
  if (from === "core" && inspect) setInspect(null);
  state.scene = name;
  const to = sceneEl[name];
  to.removeAttribute("data-gone");
  ctl[name].set(valuesFor(name, angle, ex.x));
  to.setAttribute("data-active", "");
  sceneEl[from].removeAttribute("data-active");
  const quick = instant || still.matches;
  fading = quick ? null : { from, until: performance.now() + M.swap };
  if (quick) sceneEl[from].setAttribute("data-gone", "");
  document.querySelectorAll("[data-scene-btn]").forEach((b) => b.setAttribute("aria-pressed", String(b.getAttribute("data-scene-btn") === name)));
  say();
  describe();
  announce(DATA.text.scenes[name]);
  run();
}

// ---------- readout ----------
const VIEWS = [["front", 0], ["left side", 90], ["back", 180], ["right side", 270]];
const viewOf = (theta) => {
  const t = wrap(theta);
  for (const [name, at] of VIEWS) if (Math.abs(((t - at + 540) % 360) - 180) <= 10) return name;
  return null;
};
function text(theta) {
  const t = wrap(Math.round(theta)) % 360;
  const parts = [`θ ${String(t).padStart(3, "0")}°`];
  const view = viewOf(theta);
  if (view) parts.push(view);
  parts.push(DATA.text.scenes[state.scene]);
  if (state.scene === "core" && (ex.x > 1e-3 || ex.target > 0)) parts.push(ex.target > 0 ? (ex.x >= 1 - 1e-3 ? DATA.phases.apart : DATA.phases.opening) : DATA.phases.closing);
  if (pulse && pulse.step) parts.push(pulse.step);
  else if (simStep) parts.push(simStep);
  else if (state.selected && state.scene === "core") {
    const c = DATA.components.find((x) => x.id === state.selected);
    parts.push(`${c.id} ${c.name}`, c.fn);
    if (c.signal) parts.push(c.signal);
  }
  if (!state.power) parts.push(DATA.text.powerOff);
  return parts.join(" · ");
}
const say = () => {
  const value = text(angle);
  if (readout.textContent !== value) readout.textContent = value;
};
const describe = () => {
  stage.setAttribute("aria-valuenow", String(wrap(Math.round(target)) % 360));
  stage.setAttribute("aria-valuetext", text(target));
};
let quiet = 0;
const announce = (line) => {
  clearTimeout(quiet);
  quiet = setTimeout(() => (announcer.textContent = line), 120);
};

// ---------- loop ----------
// Adaptive half rate (references/3d.md, section 15): above 14 ms per render, draw every other frame;
// below 9 ms, every frame again. Motion stays time-based, and the last frame of a move is always drawn.
let cost = 0;
let half = false;
let skip = false;
let drawnE = 0;
function draw(force = false) {
  if (!force && drawnAt !== null && Math.abs(angle - drawnAt) < 1e-4 && Math.abs(ex.x - drawnE) < 1e-5) return;
  const final = angle === target && ex.x === ex.target;
  if (!force && half && !final && (skip = !skip)) return;
  painting = true;
  const t0 = performance.now();
  ctl[state.scene].set(valuesFor(state.scene, angle, ex.x));
  if (fading) ctl[fading.from].set(valuesFor(fading.from, angle, ex.x));
  cost = cost ? cost + 0.1 * (performance.now() - t0 - cost) : performance.now() - t0;
  if (cost > 14) half = true;
  else if (cost < 9) half = false;
  painting = false;
  drawnAt = angle;
  drawnE = ex.x;
  say();
}
function tourStep(dt) {
  if (tourWait > 0) {
    tourWait -= dt;
    return;
  }
  const before = target;
  const next = target + M.tourSpeed * dt;
  const lap = Math.floor(before / 90);
  if (Math.floor(next / 90) > lap) {
    const mark = (lap + 1) * 90;
    target = mark;
    const at = wrap(mark);
    if (M.tourPauses.includes(at)) tourWait = M.tourPause;
    if (at === M.tourSwapAt) swap(state.scene === "skin" ? "core" : "skin");
    return;
  }
  target = next;
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  if (calm) touring = false;
  if (touring) tourStep(dt);
  angle = calm ? target : angle + (target - angle) * (1 - Math.exp(-dt / (followTau ?? M.follow)));
  if (Math.abs(target - angle) < 1e-3) angle = target;
  let moving = angle !== drawnAt;
  if (fading && now >= fading.until) {
    sceneEl[fading.from].setAttribute("data-gone", "");
    fading = null;
  }
  if (pulse) moving = stepPulse(dt) || moving;
  let hooked = false;
  for (const hook of frameHooks) hooked = hook(dt, calm) || hooked;
  const exMoving = stepExplode(dt, calm);
  draw();
  const camMoving = stepCamera(dt, calm);
  const settled = !touring && angle === target && !fading && !pulse && !exMoving && !camMoving && !hooked;
  frame = visible && !settled ? requestAnimationFrame(tick) : 0;
}
const run = () => {
  if (!frame && visible) {
    last = 0;
    frame = requestAnimationFrame(tick);
  }
};
new IntersectionObserver(
  (entries) => {
    visible = entries[entries.length - 1].isIntersecting;
    if (visible) run();
    else if (frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  },
  { rootMargin: "120px 0px" },
).observe(stage);

// ---------- disassembly ----------
function stepExplode(dt, calm) {
  if (calm) {
    const was = ex.x;
    ex.x = ex.target;
    ex.v = 0;
    if (was !== ex.x) describe();
    return false;
  }
  if (ex.x === ex.target && ex.v === 0) return false;
  const w = 1 / 0.22;
  for (let i = 0; i < 4; i++) {
    const h = dt / 4;
    ex.v += (w * w * (ex.target - ex.x) - 2 * w * ex.v) * h;
    ex.x += ex.v * h;
  }
  ex.x = Math.min(1, Math.max(0, ex.x));
  if (Math.abs(ex.target - ex.x) < 2e-3 && Math.abs(ex.v) < 2e-2) {
    ex.x = ex.target;
    ex.v = 0;
    describe();
    announce(ex.target ? DATA.phases.apart : "assembled");
  }
  return true;
}
function setApart(on) {
  if (on && state.scene !== "core") swap("core");
  ex.target = on ? 1 : 0;
  document.querySelectorAll("[data-apart]").forEach((b) => {
    b.setAttribute("aria-pressed", String(on));
    b.textContent = on ? "Assemble" : "Disassemble";
  });
  announce(on ? DATA.phases.opening : DATA.phases.closing);
  describe();
  run();
}

// ---------- camera: zoom and pan, one viewBox on every svg of the stage ----------
const Z = DATA.zoom;
const svgs = [...stage.querySelectorAll("svg")].filter((svg) => svg.viewBox && svg.viewBox.baseVal && svg.viewBox.baseVal.width);
const VB0 = svgs[0].viewBox.baseVal;
// The drawing's composition (the built viewBox) and the base box: the composition widened or heightened to the
// stage's aspect, so a full-window stage is filled with no letterbox and every client point maps straight to the view.
const CW = VB0.width, CH = VB0.height, CX0 = VB0.x + CW / 2, CY0 = VB0.y + CH / 2;
let VW = CW, VH = CH, BX0 = VB0.x, BY0 = VB0.y;
function rebase() {
  const r = stage.getBoundingClientRect();
  if (!r.width || !r.height) return;
  const a = r.width / r.height;
  if (a > CW / CH) {
    VH = CH;
    VW = CH * a;
  } else {
    VW = CW;
    VH = CW / a;
  }
  BX0 = CX0 - VW / 2;
  BY0 = CY0 - VH / 2;
}
rebase();
const camera = { z: 1, cx: CX0, cy: CY0, tz: 1, tcx: CX0, tcy: CY0, mountedZ: 1, still: 0 };
const clampZ = (z) => Math.min(Z.max, Math.max(Z.min, z));
// (the walkthrough film may pan past the card's edges, to follow the front cover when it is lifted)
const PAN_SLACK = DATA.film ? 0.3 : 0;
const clampC = (z, cx, cy) => {
  const w = VW / z, h = VH / z, mx = VW * PAN_SLACK, my = VH * PAN_SLACK;
  return [Math.min(BX0 + VW + mx - w / 2, Math.max(BX0 - mx + w / 2, cx)), Math.min(BY0 + VH + my - h / 2, Math.max(BY0 - my + h / 2, cy))];
};
const chip = document.querySelector("[data-zoom-chip]");
function applyCamera() {
  const w = VW / camera.z, h = VH / camera.z;
  const vb = `${(camera.cx - w / 2).toFixed(3)} ${(camera.cy - h / 2).toFixed(3)} ${w.toFixed(3)} ${h.toFixed(3)}`;
  for (const svg of svgs) svg.setAttribute("viewBox", vb);
  if (chip) chip.textContent = `${camera.z.toFixed(1)}×`;
  stage.toggleAttribute("data-zoomed", camera.z > 1.01);
}
function zoomTo(z, cx = camera.tcx, cy = camera.tcy) {
  camera.tz = clampZ(z);
  [camera.tcx, camera.tcy] = clampC(camera.tz, cx, cy);
  run();
}
// the view point under a client point
function viewPoint(clientX, clientY) {
  const box = svgs[0].getBoundingClientRect();
  const w = VW / camera.z, h = VH / camera.z;
  return [camera.cx - w / 2 + ((clientX - box.left) / box.width) * w, camera.cy - h / 2 + ((clientY - box.top) / box.height) * h];
}
// zoom by a factor about a client point, keeping that point under the pointer
function zoomAt(factor, clientX, clientY) {
  const [px, py] = viewPoint(clientX, clientY);
  const z = clampZ(camera.tz * factor);
  const k = camera.tz / z;
  zoomTo(z, px + (camera.tcx - px) * k, py + (camera.tcy - py) * k);
}
function stepCamera(dt, calm) {
  if (inspect && ctl.core) {
    const spec = DATA.inspect[inspect];
    const a = ctl.core.anchor(spec.group, spec.centre);
    if (a) [camera.tcx, camera.tcy] = clampC(camera.tz, a.screen[0], a.screen[1]);
  } else if (demoFocus && ctl[state.scene]) {
    const a = ctl[state.scene].anchor(demoFocus.group, demoFocus.point);
    if (a) [camera.tcx, camera.tcy] = clampC(camera.tz, a.screen[0], a.screen[1]);
  }
  const f = calm ? 1 : 1 - Math.exp(-dt / (zoomTau ?? Z.follow));
  const before = [camera.z, camera.cx, camera.cy];
  camera.z += (camera.tz - camera.z) * f;
  camera.cx += (camera.tcx - camera.cx) * f;
  camera.cy += (camera.tcy - camera.cy) * f;
  if (Math.abs(camera.tz - camera.z) < 1e-3 && Math.hypot(camera.tcx - camera.cx, camera.tcy - camera.cy) < 0.02) {
    camera.z = camera.tz;
    camera.cx = camera.tcx;
    camera.cy = camera.tcy;
  }
  const moved = before[0] !== camera.z || before[1] !== camera.cx || before[2] !== camera.cy;
  if (moved) {
    applyCamera();
    camera.still = performance.now();
  } else if (Math.abs(camera.z - camera.mountedZ) > 0.05 && performance.now() - camera.still > Z.settle) remount();
  return moved || Math.abs(camera.z - camera.mountedZ) > 0.05;
}
if (typeof ResizeObserver === "function")
  new ResizeObserver(() => {
    rebase();
    [camera.cx, camera.cy] = clampC(camera.z, camera.cx, camera.cy);
    [camera.tcx, camera.tcy] = clampC(camera.tz, camera.tcx, camera.tcy);
    applyCamera();
    camera.mountedZ = -1;
    camera.still = performance.now();
    run();
  }).observe(stage);
// Remount at the new zoom so round parts are sampled for the device pixels they now cover.
function remount() {
  camera.mountedZ = camera.z;
  for (const name of Object.keys(sceneEl)) {
    ctl[name].destroy();
    mountScene(name);
    ctl[name].set(valuesFor(name, angle, ex.x));
  }
  window.__isoTurn = HOOK;
}

// ---------- inspect: one component alone, centred, the turn orbiting it ----------
let inspect = null;
let savedCamera = null;
// A component inside the sealed pod is only seen with the covers open: picking one opens them.
const openFor = (id) => {
  if (id && (DATA.inside ?? []).includes(id) && ex.target === 0 && !SINGLE) setApart(true);
};
function setInspect(id) {
  if (id && state.scene !== "core") swap("core", true);
  openFor(id);
  if (id) {
    if (state.selected !== id) select(id);
    if (!inspect) savedCamera = { z: camera.tz, cx: camera.tcx, cy: camera.tcy };
    inspect = id;
    coreScene.setAttribute("data-inspect", id);
    stage.setAttribute("data-inspecting", "");
    for (const node of coreNodes) toggle(node, "data-keep", ownerOf.get(node.getAttribute("data-name")) === id);
    // fit the component's screen box to about 60% of the card
    const box = svgs[0].getBoundingClientRect();
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const node of coreNodes) {
      if (!node.hasAttribute("data-keep")) continue;
      const r = node.getBoundingClientRect();
      if (!r.width && !r.height) continue;
      x0 = Math.min(x0, r.left);
      y0 = Math.min(y0, r.top);
      x1 = Math.max(x1, r.right);
      y1 = Math.max(y1, r.bottom);
    }
    if (x1 > x0) {
      const w = ((x1 - x0) / box.width) * (VW / camera.z);
      const h = ((y1 - y0) / box.height) * (VH / camera.z);
      camera.tz = Math.min(Z.inspectMax ?? Z.max, Math.max(Z.min, Math.min((VW * 0.6) / w, (VH * 0.6) / h)));
    }
    announce(`inspecting ${DATA.components.find((c) => c.id === id).name}`);
  } else if (inspect) {
    inspect = null;
    coreScene.removeAttribute("data-inspect");
    stage.removeAttribute("data-inspecting");
    for (const node of coreNodes) toggle(node, "data-keep", false);
    const back = savedCamera ?? { z: 1, cx: CX0, cy: CY0 };
    zoomTo(back.z, back.cx, back.cy);
  }
  document.querySelectorAll("[data-inspect-btn]").forEach((b) => b.setAttribute("aria-pressed", String(Boolean(inspect))));
  run();
}

function takeOver() {
  touched = true;
  if (onTakeOver) onTakeOver();
  if (touring) {
    touring = false;
    target = angle;
  }
}
setTimeout(() => {
  if (!touched && !still.matches && !tourStarted) {
    tourStarted = true;
    if (autoStart) autoStart();
    else touring = true;
    run();
  }
}, (autoStart ? 2 : M.tourStart) * 1000);

// ---------- pulse (stretch goal) ----------
// One interaction pulse: a pure function of time over DATA.pulse.length seconds (9.6).
const nodesWhere = (test) => coreNodes.filter((n) => test(n.getAttribute("data-name")));
const PULSE_GROUPS = [
  [nodesWhere((n) => /^c03\./.test(n)), nodesWhere((n) => cableOf(n) === "W5")],
  [nodesWhere((n) => /^c02\.window/.test(n)), nodesWhere((n) => /^c02\.board/.test(n)), nodesWhere((n) => /^c02\.flex/.test(n))],
  [nodesWhere((n) => /^c01\./.test(n))],
  [[...coreScene.querySelectorAll(".tk-i2s")], nodesWhere((n) => /^c04\./.test(n)), nodesWhere((n) => cableOf(n) === "W6")],
  [nodesWhere((n) => /^c05\./.test(n)), nodesWhere((n) => /^c09\.|^pod\.pipe\./.test(n))],
];
const antenna = [...coreScene.querySelectorAll(".tk-antenna, .tk-antenna-dot")];
const pulseAt = (t) => {
  const per = DATA.pulse.length / DATA.pulse.steps.length;
  const k = Math.min(DATA.pulse.steps.length - 1, Math.floor(t / per));
  return stepState(k, (t - k * per) / per);
};
// the lighting of step k (0 listening … 4 speaking) at progress local ∈ [0, 1]
function stepState(k, local) {
  const subs = PULSE_GROUPS[k];
  const sub = Math.min(subs.length - 1, Math.floor(local * subs.length));
  const blink = k === 2 ? 0.35 + 0.65 * (0.5 - 0.5 * Math.cos(local * Math.PI * 6)) : 1;
  return { k, sub: k === 4 ? -1 : sub, step: DATA.pulse.steps[k].name, blink, wide: k === 4 ? Math.sin(Math.min(1, local * 1.4) * Math.PI) : 0 };
}
let pulseLit = [];
function paintPulse(p) {
  for (const el of pulseLit) {
    el.removeAttribute("data-pulse");
    el.removeAttribute("data-lit");
    el.querySelectorAll(".iso-solid").forEach((x) => x.removeAttribute("data-lit"));
  }
  pulseLit = [];
  if (!p) {
    antenna.forEach((el) => el.removeAttribute("opacity"));
    stage.style.removeProperty("--tk-glow-pulse");
    select(state.selected);
    return;
  }
  const groups = p.sub < 0 ? PULSE_GROUPS[p.k] : [PULSE_GROUPS[p.k][p.sub]];
  for (const n of coreNodes) {
    n.removeAttribute("data-lit");
    n.querySelectorAll(".iso-solid").forEach((x) => x.removeAttribute("data-lit"));
  }
  for (const list of groups) for (const el of list) {
    el.setAttribute("data-pulse", "");
    el.setAttribute("data-lit", "");
    el.querySelectorAll(".iso-solid").forEach((x) => x.setAttribute("data-lit", ""));
    pulseLit.push(el);
  }
  antenna.forEach((el) => el.setAttribute("opacity", p.k === 2 ? p.blink.toFixed(2) : "1"));
  // speaking: the cheeks brighten with the voice
  if (p.wide > 0.01) stage.style.setProperty("--tk-glow-pulse", (1 + 0.35 * p.wide).toFixed(3));
  else stage.style.removeProperty("--tk-glow-pulse");
}
function stepPulse(dt) {
  if (!pulse) return false;
  pulse.t += dt;
  if (pulse.t >= DATA.pulse.length || !state.power || state.scene !== "core") {
    pulse = null;
    paintPulse(null);
    say();
    announce("ready");
    return false;
  }
  const p = pulseAt(pulse.t);
  if (p.step !== pulse.step) announce(p.step);
  pulse.step = p.step;
  paintPulse(p);
  say();
  return true;
}

// ---------- input ----------
let drag = null;
let pan = null;
const touches = new Map();
let pinch = null;
const DRAG_Z = 60;
stage.addEventListener("pointerdown", (event) => {
  takeOver();
  if (event.pointerType === "touch") {
    touches.set(event.pointerId, [event.clientX, event.clientY]);
    if (touches.size === 2) {
      const [a, b] = [...touches.values()];
      drag = null;
      pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), z: camera.tz, mid: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], c: [camera.tcx, camera.tcy] };
      return;
    }
  }
  if (event.shiftKey || event.button === 1) {
    pan = { id: event.pointerId, x: event.clientX, y: event.clientY, cx: camera.tcx, cy: camera.tcy };
    stage.setPointerCapture(event.pointerId);
    stage.setAttribute("data-pan", "");
    event.preventDefault();
    return;
  }
  drag = { from: ctl[state.scene].angleAt(event.clientX, event.clientY, DRAG_Z, "toki"), base: target, id: event.pointerId, captured: false, x: event.clientX, y: event.clientY };
});
const panBy = (dxClient, dyClient, cx, cy) => {
  const box = svgs[0].getBoundingClientRect();
  zoomTo(camera.tz, cx - (dxClient / box.width) * (VW / camera.tz), cy - (dyClient / box.height) * (VH / camera.tz));
};
stage.addEventListener("pointermove", (event) => {
  if (touches.has(event.pointerId)) touches.set(event.pointerId, [event.clientX, event.clientY]);
  if (pinch && touches.size === 2) {
    const [a, b] = [...touches.values()];
    const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    camera.tz = clampZ((pinch.z * d) / (pinch.d || 1));
    if (!inspect) panBy(mid[0] - pinch.mid[0], mid[1] - pinch.mid[1], pinch.c[0], pinch.c[1]);
    else run();
    return;
  }
  if (pan && event.pointerId === pan.id) {
    if (!inspect) panBy(event.clientX - pan.x, event.clientY - pan.y, pan.cx, pan.cy);
    return;
  }
  if (drag && event.pointerId === drag.id) {
    const now = ctl[state.scene].angleAt(event.clientX, event.clientY, DRAG_Z, "toki");
    const delta = now - drag.from;
    if (!drag.captured && Math.abs(delta) > 1.5) {
      drag.captured = true;
      stage.setPointerCapture(event.pointerId);
      stage.setAttribute("data-drag", "");
    }
    if (!drag.captured) return;
    target = drag.base + delta;
    describe();
    run();
    return;
  }
  if (state.scene === "core" && event.pointerType !== "touch" && !inspect) {
    const node = event.target && event.target.closest ? event.target.closest("[data-name]") : null;
    const id = node ? ownerOf.get(node.getAttribute("data-name")) : null;
    if (id && id !== state.selected) {
      takeOver();
      select(id);
    }
  }
});
const release = (event) => {
  touches.delete(event.pointerId);
  if (touches.size < 2) pinch = null;
  if (pan && event.pointerId === pan.id) {
    pan = null;
    stage.removeAttribute("data-pan");
    try {
      stage.releasePointerCapture(event.pointerId);
    } catch {}
    return;
  }
  if (!drag || event.pointerId !== drag.id) return;
  const was = drag;
  drag = null;
  stage.removeAttribute("data-drag");
  try {
    stage.releasePointerCapture(event.pointerId);
  } catch {}
  if (!was.captured && event.type === "pointerup" && onRocker(event.clientX, event.clientY)) setPower(!state.power);
  else if (!was.captured && event.type === "pointerup" && state.scene === "core") {
    const node = event.target && event.target.closest ? event.target.closest("[data-name]") : null;
    const id = node ? ownerOf.get(node.getAttribute("data-name")) : null;
    if (id) select(id);
  }
};
stage.addEventListener("pointerup", release);
stage.addEventListener("pointercancel", release);
// a trackpad pinch arrives as a ctrl+wheel; a plain wheel keeps scrolling the page
stage.addEventListener(
  "wheel",
  (event) => {
    if (!event.ctrlKey) return;
    event.preventDefault();
    takeOver();
    zoomAt(Math.exp(-event.deltaY * 0.01), event.clientX, event.clientY);
  },
  { passive: false },
);
stage.addEventListener("dblclick", (event) => {
  takeOver();
  const node = state.scene === "core" && event.target && event.target.closest ? event.target.closest("[data-name]") : null;
  const id = node ? ownerOf.get(node.getAttribute("data-name")) : null;
  if (id) setInspect(id);
  else zoomAt(2, event.clientX, event.clientY);
});
function onRocker(clientX, clientY) {
  const face = DATA.rocker;
  if (!face) return false;
  const c = ctl[state.scene];
  const cam = c.cams()[0];
  if (face.n[0] * cam.V[0] + face.n[1] * cam.V[1] + face.n[2] * cam.V[2] < 0.1) return false;
  const svg = sceneEl[state.scene].querySelector("svg[data-live]");
  const box = svg.getBoundingClientRect();
  const vb = svg.viewBox.baseVal;
  const x = vb.x + ((clientX - box.left) / box.width) * vb.width;
  const y = vb.y + ((clientY - box.top) / box.height) * vb.height;
  const m = cam.m;
  const pts = face.corners.map((p) => [cam.ox + m[0] * p[0] + m[1] * p[1] + m[2] * p[2], cam.oy + m[3] * p[0] + m[4] * p[1] + m[5] * p[2]]);
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  if (inside) return true;
  // a little slack: within 3 px of the face
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  return Math.hypot(x - cx, y - cy) < 6;
}
const ORDER = DATA.components.map((c) => c.id);
function toView(next) {
  takeOver();
  target = next;
  describe();
  run();
}
stage.addEventListener("keydown", (event) => {
  const key = event.key;
  let handled = true;
  if (key === "ArrowLeft" || key === "ArrowRight") {
    const dir = key === "ArrowRight" ? 1 : -1;
    const base = touring ? angle : target;
    if (event.shiftKey) {
      const k = dir > 0 ? Math.floor(base / 90 + 1e-6) + 1 : Math.ceil(base / 90 - 1e-6) - 1;
      toView(k * 90);
    } else toView(Math.round(base) + dir * M.step);
  } else if (key === "Home") toView(target - (((wrap(target) + 180) % 360) - 180));
  else if (key === "s" || key === "S") {
    takeOver();
    swap(state.scene === "skin" ? "core" : "skin");
  } else if (key === "p" || key === "P") {
    takeOver();
    setPower(!state.power);
  } else if (key === "ArrowUp" || key === "ArrowDown") {
    takeOver();
    if (state.scene !== "core") swap("core");
    const at = state.selected ? ORDER.indexOf(state.selected) : -1;
    const next = key === "ArrowDown" ? (at + 1) % ORDER.length : at <= 0 ? ORDER.length - 1 : at - 1;
    openFor(ORDER[next]);
    if (inspect) setInspect(ORDER[next]);
    else select(ORDER[next]);
  } else if (key === "Escape") {
    takeOver();
    if (inspect) setInspect(null);
    else select(null);
  } else if (key === "d" || key === "D") {
    takeOver();
    setApart(ex.target === 0);
  } else if (key === "i" || key === "I") {
    takeOver();
    if (inspect) setInspect(null);
    else if (state.selected) setInspect(state.selected);
    else announce("select a component first");
  } else if (key === "+" || key === "=") {
    takeOver();
    zoomTo(camera.tz * Z.step);
  } else if (key === "-" || key === "_") {
    takeOver();
    zoomTo(camera.tz / Z.step);
  } else if (key === "0") {
    takeOver();
    if (inspect) setInspect(null);
    zoomTo(1, CX0, CY0);
  } else if (key === " ") {
    if (spaceAction) spaceAction();
    else {
      takeOver();
      startPulse();
    }
  } else handled = false;
  if (handled) event.preventDefault();
});
function startPulse() {
  if (simOn) return;
  if (!state.power || state.scene !== "core" || still.matches) return;
  pulse = { t: 0, step: null };
  run();
}
document.querySelectorAll("[data-scene-btn]").forEach((b) =>
  b.addEventListener("click", () => {
    takeOver();
    swap(b.getAttribute("data-scene-btn"));
  }),
);
document.querySelectorAll("[data-view]").forEach((b) =>
  b.addEventListener("click", () => {
    const view = Number(b.getAttribute("data-view"));
    const base = target;
    toView(base + ((((view - wrap(base)) % 360) + 540) % 360) - 180);
  }),
);
document.querySelectorAll("[data-pick]").forEach((b) =>
  b.addEventListener("click", () => {
    takeOver();
    const id = b.getAttribute("data-pick");
    if (state.scene !== "core") swap("core");
    if (state.selected !== id) openFor(id);
    if (inspect) setInspect(id);
    else select(state.selected === id ? null : id);
  }),
);
document.querySelectorAll("[data-zoom]").forEach((b) =>
  b.addEventListener("click", () => {
    takeOver();
    const how = b.getAttribute("data-zoom");
    if (how === "in") zoomTo(camera.tz * Z.step);
    else if (how === "out") zoomTo(camera.tz / Z.step);
    else {
      if (inspect) setInspect(null);
      zoomTo(1, CX0, CY0);
    }
  }),
);
document.querySelectorAll("[data-apart]").forEach((b) =>
  b.addEventListener("click", () => {
    takeOver();
    setApart(ex.target === 0);
  }),
);
document.querySelectorAll("[data-inspect-btn]").forEach((b) =>
  b.addEventListener("click", () => {
    takeOver();
    if (inspect) setInspect(null);
    else if (state.selected) setInspect(state.selected);
  }),
);
stage.addEventListener("focus", () => announce(text(target)));

ready = true;
stage.setAttribute("data-power", "on");
setGlow("happy");
if (!SINGLE) sceneEl.core.setAttribute("data-gone", "");
select(null);
draw(true);
if (ctl.core && state.scene !== "core") ctl.core.set(valuesFor("core", angle, ex.x));
say();
describe();
void painting;
