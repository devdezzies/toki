// ---------- the product demo (demo.js, concatenated after live.js: same module scope) ----------
// One predefined, end-to-end story of how Toki works (demo.mjs), played as a pure function of time:
// play, pause, seek and chapter jumps all land on the same picture. A directed camera follows the story
// until the viewer takes it back (any drag, zoom or key); Follow returns it.
const DM = DATA.demo;
const FX = DATA.sim;
const STEP = { listening: 0, seeing: 1, "sending to backend": 2, answering: 3, speaking: 4 };
const demo = { playing: false, t: 0, lang: "en", sound: false, follow: true, shot: -1, fx: 0 };
const ui = {
  sub: document.querySelector("[data-subtitle]"),
  who: document.querySelector("[data-subtitle] .tk-sub-who"),
  text: document.querySelector("[data-subtitle] .tk-sub-text"),
  play: [...document.querySelectorAll("[data-demo-play]")],
  follow: [...document.querySelectorAll("[data-demo-follow]")],
  bar: document.querySelector("[data-demo-progress]"),
  chapters: [...document.querySelectorAll("[data-chapter]")],
};

// ---------- the timeline: shot starts, and the state each shot carries forward ----------
const SHOTS = DM.shots;
const starts = [];
let total = 0;
for (const s of SHOTS) {
  starts.push(total);
  total += s.dur;
}
const carried = [];
{
  let power = true, face = "happy", boot = 2, apple = "none", cam = null;
  SHOTS.forEach((s, i) => {
    if (s.power !== undefined) power = s.power;
    if (s.face) face = s.face;
    if (s.boot !== undefined) boot = s.boot;
    const appleNow = s.apple ?? (apple === "in" || apple === "look" ? "hold" : apple === "out" ? "none" : apple);
    apple = appleNow;
    if (s.cam) cam = s.cam;
    carried[i] = { power, face, boot, apple: appleNow, cam };
  });
}
const shotAt = (t) => {
  let i = 0;
  while (i < SHOTS.length - 1 && t >= starts[i + 1]) i++;
  return i;
};
const chapterStart = Object.fromEntries(DM.chapters.map((c) => [c.id, starts[SHOTS.findIndex((s) => s.ch === c.id)]]));

// ---------- words ----------
const word = (pair) => (pair ? pair[demo.lang] ?? pair.en : "");
function subtitle(s) {
  if (!ui.sub) return;
  if (!s) {
    ui.sub.removeAttribute("data-on");
    return;
  }
  ui.sub.setAttribute("data-on", "");
  ui.sub.setAttribute("data-who", s.who);
  ui.who.textContent = s.who === "narrator" ? "" : word(DM.ui[s.who]);
  const text = word(s);
  if (ui.text.textContent !== text) {
    ui.text.textContent = text;
    ui.sub.classList.remove("tk-sub-in");
    void ui.sub.offsetWidth;
    ui.sub.classList.add("tk-sub-in");
  }
}

// ---------- the cheeks: an emotion's glow, and the boot (dark, pale, then the emotion) ----------
function setFace(name) {
  if (!DM.faces[name]) return;
  setGlow(name);
}
const setBoot = (n) => (n === null ? stage.removeAttribute("data-boot") : stage.setAttribute("data-boot", String(n)));

// ---------- voice (Toki's lines only, with Sound on) ----------
function speakAloud(text) {
  if (!demo.sound || typeof speechSynthesis === "undefined" || typeof SpeechSynthesisUtterance === "undefined") return;
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = DM.langs[demo.lang].voice;
    const voice = speechSynthesis.getVoices().find((v) => v.lang && v.lang.toLowerCase().startsWith(u.lang.slice(0, 2)));
    if (voice) u.voice = voice;
    u.rate = 0.95;
    u.pitch = 1.25;
    speechSynthesis.speak(u);
  } catch {}
}
const hush = () => {
  try {
    if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
  } catch {}
};

// ---------- lighting: a step of 9.6, or a list of components (the power chain) ----------
let lightKey = "";
function light(p) {
  const key = p ? `${p.k}:${p.sub}:${p.blink.toFixed(2)}:${p.wide.toFixed(2)}` : "";
  if (key === lightKey) return;
  lightKey = key;
  paintPulse(p);
}
function lightIds(ids) {
  const key = `ids:${ids.join(",")}`;
  if (key === lightKey) return;
  lightKey = key;
  for (const n of coreNodes) {
    const name = n.getAttribute("data-name");
    const on = ids.includes(ownerOf.get(name)) && !cableOf(name);
    toggle(n, "data-lit", on);
    n.querySelectorAll(".iso-solid").forEach((el) => toggle(el, "data-lit", on));
  }
}

// ---------- packets along the cables ----------
const flowNodes = new Map();
const packets = {};
function packetsFor(id) {
  if (packets[id]) return packets[id];
  const flow = DATA.flows[id];
  const count = Math.max(3, Math.round(flow.total / FX.packetGap));
  packets[id] = Array.from({ length: count }, () => {
    const c = document.createElementNS(NS, "circle");
    c.setAttribute("class", "tk-packet");
    c.setAttribute("data-hue", flow.hue);
    return c;
  });
  return packets[id];
}
const chunkNode = (name) => {
  let node = flowNodes.get(name);
  if (!node || !node.isConnected) {
    node = coreScene.querySelector(`.iso-live [data-name="${name}"]`);
    flowNodes.set(name, node);
  }
  return node;
};
function drawPackets(active, calm) {
  for (const [id, list] of Object.entries(packets)) if (!active.includes(id) || calm || state.scene !== "core") list.forEach((c) => c.remove());
  if (calm || state.scene !== "core" || !ctl.core) return;
  const k = ctl.core.cams()[0].k;
  for (const id of active) {
    const flow = DATA.flows[id];
    if (!flow) continue;
    const list = packetsFor(id);
    const step = flow.total / (flow.points.length - 1);
    list.forEach((c, i) => {
      let s = (demo.fx * FX.packetSpeed + (i * flow.total) / list.length) % flow.total;
      if (flow.dir < 0) s = flow.total - s;
      const chunk = flow.chunks.find((ch) => s >= ch.from + 0.4 && s <= ch.to - 0.4);
      if (!chunk) return c.remove();
      const at = s / step;
      const j = Math.min(flow.points.length - 2, Math.floor(at));
      const f = at - j;
      const a = flow.points[j], b = flow.points[j + 1];
      const screen = ctl.core.anchor(flow.group, [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]).screen;
      c.setAttribute("cx", screen[0].toFixed(2));
      c.setAttribute("cy", screen[1].toFixed(2));
      c.setAttribute("r", (flow.r * 1.05 * k).toFixed(2));
      const node = chunkNode(chunk.name);
      if (node && c.parentNode !== node) node.append(c);
    });
  }
}

// ---------- overlay layers: under the parts (the apple behind the doll) and over them ----------
const layers = {};
for (const name of Object.keys(sceneEl)) {
  const svg = sceneEl[name].querySelector("svg[data-live]");
  const parts = svg.querySelector(".iso-parts");
  const under = document.createElementNS(NS, "g");
  under.setAttribute("class", "tk-under");
  svg.insertBefore(under, parts);
  const over = document.createElementNS(NS, "g");
  over.setAttribute("class", "tk-over");
  svg.append(over);
  const arcs = document.createElementNS(NS, "g");
  arcs.setAttribute("class", "tk-arcs");
  svg.append(arcs);
  layers[name] = { under, over, arcs };
}

// ---------- sound and Wi-Fi arcs, faded toward both ends ----------
// each source in its own group's rest frame: the speaker, microphone and LEDs ride the front cover when the pod opens
const SOURCES = {
  speak: { skin: { c: [0, 128.5, 86], d: [0, 1, 0], s: [1, 0, 0] }, core: { g: "front", c: [0, 86.5, 86], d: [0, 1, 0], s: [1, 0, 0] }, grow: true },
  listen: { skin: { c: [-36, 124.5, 97], d: [0, 1, 0], s: [1, 0, 0] }, core: { g: "front", c: [-36, 86.5, 97], d: [0, 1, 0], s: [1, 0, 0] }, grow: false },
  wifi: { core: { c: [12, 31.8, 87], d: [0, 0.55, 0.835], s: [0, 0.835, -0.55] }, grow: true },
};
function drawArcs(kind, calm) {
  for (const [name, L] of Object.entries(layers)) {
    const g = L.arcs;
    const src = kind && SOURCES[kind] ? SOURCES[kind][name] : null;
    if (!src || calm || name !== state.scene || !ctl[name]) {
      if (g.childNodes.length) g.textContent = "";
      continue;
    }
    const c = ctl[name];
    const V = c.cams()[0].V;
    const alpha = smooth(0.04, 0.35, src.d[0] * V[0] + src.d[1] * V[1] + src.d[2] * V[2]);
    let out = "";
    for (let i = 0; i < FX.arcs; i++) {
      const f = (demo.fx * 0.9 + i / FX.arcs) % 1;
      const r = SOURCES[kind].grow ? 5 + 22 * f : 24 - 18 * f;
      const a0 = alpha * Math.sin(Math.PI * f);
      if (a0 < 0.02) continue;
      const pts = [];
      for (let j = 0; j <= 10; j++) {
        const t = ((-55 + 11 * j) * Math.PI) / 180;
        pts.push(c.anchor(src.g ?? "toki", src.c.map((x, k) => x + r * (Math.cos(t) * src.d[k] + Math.sin(t) * src.s[k]))).screen);
      }
      [0.2, 0.6, 1, 0.6, 0.2].forEach((w, s) => {
        const seg = pts.slice(s * 2, s * 2 + 3);
        out += `<path class="tk-arc" data-free="" opacity="${(a0 * w).toFixed(3)}" d="M${seg.map((q) => `${q[0].toFixed(2)} ${q[1].toFixed(2)}`).join("L")}"/>`;
      });
    }
    g.innerHTML = out;
  }
}

// ---------- the apple: a shaded apple in front of Toki's left eye, with the camera's view cone ----------
const APPLE_BODY = "M0 -0.62C0.35 -1.02 1.02 -0.86 1.02 -0.12C1.02 0.62 0.52 1.02 0.16 0.92C0.07 0.89 -0.07 0.89 -0.16 0.92C-0.52 1.02 -1.02 0.62 -1.02 -0.12C-1.02 -0.86 -0.35 -1.02 0 -0.62Z";
const appleSvg = (id) =>
  `<defs><radialGradient id="${id}-g" cx="0.36" cy="0.3" r="0.8"><stop offset="0" stop-color="var(--toki-apple-hi)"/><stop offset="0.55" stop-color="var(--toki-apple)"/><stop offset="1" stop-color="var(--toki-apple-lo)"/></radialGradient>` +
  `<linearGradient id="${id}-c" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="var(--toki-cone)" stop-opacity="0.32"/><stop offset="1" stop-color="var(--toki-cone)" stop-opacity="0.05"/></linearGradient></defs>` +
  `<path class="tk-cone" fill="url(#${id}-c)"/>` +
  `<g class="tk-apple"><path class="tk-apple-body" fill="url(#${id}-g)" d="${APPLE_BODY}"/><ellipse class="tk-apple-shine" cx="-0.44" cy="-0.36" rx="0.16" ry="0.24" transform="rotate(-25 -0.44 -0.36)"/><path class="tk-apple-stem" data-free="" d="M0 -0.66Q0.04 -0.96 0.16 -1.16"/><path class="tk-apple-leaf" d="M0.08 -0.92Q0.5 -1.3 0.86 -0.98Q0.48 -0.7 0.08 -0.92Z"/></g>` +
  `<g class="tk-sparks"></g>`;
const apples = {};
for (const name of Object.keys(sceneEl)) {
  const g = document.createElementNS(NS, "g");
  g.setAttribute("class", "tk-apple-set");
  g.innerHTML = appleSvg(`tk-apple-${name}`);
  apples[name] = { g, cone: g.querySelector(".tk-cone"), body: g.querySelector(".tk-apple"), sparks: g.querySelector(".tk-sparks"), grad: g.querySelector(`#tk-apple-${name}-c`) };
}
const easeIO = (x) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};
const lerp3 = (a, b, t) => a.map((x, i) => x + (b[i] - x) * t);
function drawApple(mode, u, calm, i) {
  const A = DM.apple;
  // in the Hardware scene the apple only matters while the camera looks at it: it fades as the story moves on
  const coreFade = mode === "hold" ? (SHOTS[i].apple === "hold" && carried[i - 1]?.apple === "look" ? 1 - smooth(0, 0.22, u) : 0) : 1;
  for (const [name, set] of Object.entries(apples)) {
    if (mode === "none" || name !== state.scene || !ctl[name] || (name === "core" && coreFade <= 0.001)) {
      if (set.g.parentNode) set.g.remove();
      continue;
    }
    let p = A.seen, alpha = 1, cone = 0, sparks = 0;
    if (mode === "in") {
      p = lerp3(A.from, A.seen, easeIO(u));
      alpha = smooth(0, 0.25, u);
    } else if (mode === "out") {
      p = lerp3(A.seen, A.away, easeIO((u - 0.35) / 0.65));
      alpha = 1 - smooth(0.55, 1, u);
      sparks = u;
    } else if (mode === "look") cone = smooth(0, 0.15, u) * (1 - smooth(0.9, 1, u));
    if (name === "core") alpha *= coreFade;
    if (!calm && (mode === "hold" || mode === "look")) p = [p[0], p[1], p[2] + 1.6 * Math.sin(demo.fx * 2.2)];
    const c = ctl[name];
    const cam = c.cams()[0];
    const C = c.anchor(name === "core" ? "front" : "toki", p).screen; // in the hardware the eye's turret rides the front cover
    const r = A.r * cam.k;
    // over the doll while the apple's side faces the viewer, under it otherwise
    const n = Math.hypot(p[0], p[1]) || 1;
    const facing = (p[0] / n) * cam.V[0] + (p[1] / n) * cam.V[1];
    const host = facing > -0.15 ? layers[name].over : layers[name].under;
    if (set.g.parentNode !== host) host.prepend(set.g);
    set.g.setAttribute("opacity", alpha.toFixed(3));
    set.body.setAttribute("transform", `translate(${C[0].toFixed(2)} ${C[1].toFixed(2)}) scale(${r.toFixed(3)})`);
    // view cone from the lens to the apple's limb
    if (cone > 0.01 && !calm) {
      const L = c.anchor(name === "core" ? "front" : "toki", A.lens).screen;
      const dx = C[0] - L[0], dy = C[1] - L[1], d = Math.hypot(dx, dy);
      const rr = r * 0.92;
      if (d > rr * 1.05) {
        const base = Math.atan2(L[1] - C[1], L[0] - C[0]);
        const off = Math.acos(rr / d);
        const T1 = [C[0] + rr * Math.cos(base + off), C[1] + rr * Math.sin(base + off)];
        const T2 = [C[0] + rr * Math.cos(base - off), C[1] + rr * Math.sin(base - off)];
        set.cone.setAttribute("d", `M${L[0].toFixed(2)} ${L[1].toFixed(2)}L${T1[0].toFixed(2)} ${T1[1].toFixed(2)}L${C[0].toFixed(2)} ${C[1].toFixed(2)}L${T2[0].toFixed(2)} ${T2[1].toFixed(2)}Z`);
        set.grad.setAttribute("x1", L[0].toFixed(2));
        set.grad.setAttribute("y1", L[1].toFixed(2));
        set.grad.setAttribute("x2", C[0].toFixed(2));
        set.grad.setAttribute("y2", C[1].toFixed(2));
        set.cone.setAttribute("opacity", cone.toFixed(3));
      } else set.cone.setAttribute("opacity", "0");
    } else set.cone.setAttribute("opacity", "0");
    // a few sparkles as it is praised and leaves
    if (sparks > 0 && !calm) {
      let out = "";
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + 0.4;
        const rad = r * (1.25 + 0.9 * sparks);
        const x = C[0] + rad * Math.cos(a), y = C[1] + rad * Math.sin(a);
        const s = r * 0.16 * Math.sin(Math.PI * Math.min(1, sparks * 1.4));
        const o = Math.max(0, 1 - sparks);
        if (s > 0.05) out += `<path class="tk-spark" opacity="${o.toFixed(2)}" d="M${x.toFixed(2)} ${(y - s).toFixed(2)}L${(x + s * 0.3).toFixed(2)} ${(y - s * 0.3).toFixed(2)}L${(x + s).toFixed(2)} ${y.toFixed(2)}L${(x + s * 0.3).toFixed(2)} ${(y + s * 0.3).toFixed(2)}L${x.toFixed(2)} ${(y + s).toFixed(2)}L${(x - s * 0.3).toFixed(2)} ${(y + s * 0.3).toFixed(2)}L${(x - s).toFixed(2)} ${y.toFixed(2)}L${(x - s * 0.3).toFixed(2)} ${(y - s * 0.3).toFixed(2)}Z"/>`;
      }
      set.sparks.innerHTML = out;
    } else if (set.sparks.childNodes.length) set.sparks.textContent = "";
  }
}

// ---------- the directed camera ----------
function applyCam(c) {
  if (!c || !demo.follow) return;
  if (c.scene && c.scene !== state.scene) swap(c.scene);
  // the hardware shots look inside: the pod opens; back on the skin it closes for the next time
  if (c.scene === "core" && ex.target === 0) setApart(true);
  else if (c.scene === "skin" && ex.target !== 0) setApart(false);
  if (c.theta !== undefined) target = angle + ((((c.theta - wrap(angle)) % 360) + 540) % 360) - 180;
  const spec = typeof c.focus === "string" ? DATA.inspect[c.focus] : null;
  demoFocus = spec ? { group: spec.group, point: spec.centre } : c.focus ? { group: "toki", point: c.focus } : null;
  if (c.focus) camera.tz = clampZ(c.zoom ?? 1);
  else zoomTo(c.zoom ?? 1, CX0, CY0);
  describe();
  run();
}
function setFollow(on) {
  demo.follow = on;
  ui.follow.forEach((b) => b.setAttribute("aria-pressed", String(on)));
  if (on) {
    followTau = demo.playing ? 0.75 : null;
    zoomTau = demo.playing ? 0.6 : null;
    applyCam(carried[Math.max(0, demo.shot)].cam);
  } else {
    demoFocus = null;
    followTau = null;
    zoomTau = null;
  }
}

// ---------- entering a shot, and every frame of it ----------
function enter(i, seeking) {
  const s = SHOTS[i];
  const c = carried[i];
  demo.shot = i;
  if (c.power !== state.power) setPower(c.power);
  setBoot(c.boot);
  setFace(c.face);
  subtitle(s.sub ?? null);
  if (s.sub && s.sub.who === "toki" && demo.playing && !seeking) speakAloud(word(s.sub));
  if (seeking) applyCam(c.cam);
  else if (s.cam) applyCam(s.cam);
  lightKey = "-";
  ui.chapters.forEach((b) => b.setAttribute("aria-current", String(b.getAttribute("data-chapter") === s.ch)));
}
function renderShot(calm) {
  const i = demo.shot;
  if (i < 0) return;
  const s = SHOTS[i];
  const u = Math.min(1, (demo.t - starts[i]) / s.dur);
  simStep = s.step ?? null;
  if (s.step) light(stepState(STEP[s.step], u));
  else if (s.lit) lightIds(s.lit);
  else light(null);
  drawPackets(state.power ? s.packets ?? [] : [], calm);
  drawArcs(state.power ? s.arcs ?? null : null, calm);
  drawApple(carried[i].apple, u, calm, i);
  if (ui.bar) ui.bar.style.width = `${((demo.t / total) * 100).toFixed(2)}%`;
  say();
}
frameHooks.push((dt, calm) => {
  if (demo.shot < 0) return false;
  if (demo.playing) {
    demo.t += dt;
    demo.fx += dt;
    if (demo.t >= total) {
      demo.t = 0;
      enter(0, false);
    }
    const i = shotAt(demo.t);
    if (i !== demo.shot) enter(i, false);
  }
  renderShot(calm);
  return demo.playing;
});

// ---------- controls ----------
function play() {
  if (demo.playing) return;
  if (inspect) setInspect(null);
  setApart(false);
  if (pulse) {
    pulse = null;
    paintPulse(null);
  }
  touring = false;
  demo.playing = true;
  simOn = true;
  if (demo.shot < 0) enter(shotAt(demo.t), true);
  setFollow(demo.follow);
  ui.play.forEach((b) => {
    b.textContent = "Pause";
    b.setAttribute("aria-pressed", "true");
  });
  stage.setAttribute("data-demo", "");
  announce("demo playing");
  run();
}
function pause() {
  if (!demo.playing) return;
  demo.playing = false;
  hush();
  followTau = null;
  zoomTau = null;
  ui.play.forEach((b) => {
    b.textContent = "Play";
    b.setAttribute("aria-pressed", "false");
  });
  announce("demo paused");
  run();
}
function seek(t) {
  hush();
  demo.t = Math.max(0, Math.min(total - 1e-3, t));
  enter(shotAt(demo.t), true);
  renderShot(still.matches);
  run();
}
spaceAction = () => (demo.playing ? pause() : play());
autoStart = () => play();
onTakeOver = () => {
  if (demo.playing && demo.follow) setFollow(false);
};
ui.play.forEach((b) => b.addEventListener("click", () => (demo.playing ? pause() : play())));
document.querySelectorAll("[data-demo-restart]").forEach((b) =>
  b.addEventListener("click", () => {
    seek(0);
    setFollow(true);
    play();
  }),
);
ui.follow.forEach((b) => b.addEventListener("click", () => setFollow(!demo.follow)));
document.querySelectorAll("[data-power-btn]").forEach((b) =>
  b.addEventListener("click", () => {
    pause();
    setPower(!state.power);
    setBoot(null);
  }),
);
ui.chapters.forEach((b) =>
  b.addEventListener("click", () => {
    seek(chapterStart[b.getAttribute("data-chapter")]);
    setFollow(true);
    play();
  }),
);
document.querySelectorAll("[data-lang]").forEach((b) =>
  b.addEventListener("click", () => {
    demo.lang = b.getAttribute("data-lang");
    document.querySelectorAll("[data-lang]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    document.documentElement.lang = demo.lang;
    document.querySelectorAll("[data-chapter]").forEach((x) => {
      const c = DM.chapters.find((y) => y.id === x.getAttribute("data-chapter"));
      x.querySelector(".tk-ch-name").textContent = demo.lang === "id" ? c.id_ : c.en;
    });
    hush();
    if (demo.shot >= 0) subtitle(SHOTS[demo.shot].sub ?? null);
  }),
);
document.querySelectorAll("[data-sound]").forEach((b) =>
  b.addEventListener("click", () => {
    demo.sound = !demo.sound;
    b.setAttribute("aria-pressed", String(demo.sound));
    if (!demo.sound) hush();
  }),
);
// the sidebar, collapsible like Blender's
const app = document.querySelector(".tk-app");
const toggleSide = () => app && app.setAttribute("data-side", app.getAttribute("data-side") === "open" ? "closed" : "open");
document.querySelectorAll("[data-side-toggle]").forEach((b) => b.addEventListener("click", toggleSide));
if (app && matchMedia("(max-width: 760px)").matches) app.setAttribute("data-side", "closed");
stage.addEventListener("keydown", (event) => {
  if (event.key === "f" || event.key === "F") {
    event.preventDefault();
    setFollow(!demo.follow);
  } else if (event.key === "t" || event.key === "T") {
    event.preventDefault();
    toggleSide();
  }
});
tourStarted = false;
window.__tokiDemo = { seek, play, pause, total, chapters: DM.chapters.map((c) => ({ id: c.id, t: chapterStart[c.id] })), get state() {
  return { t: demo.t, shot: demo.shot, playing: demo.playing, follow: demo.follow };
} };
