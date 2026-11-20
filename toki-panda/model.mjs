// Toki — every number of the figure, typed once, copied from TOKI_3D_SPEC.md (sections 4–9).
// Geometry, readout, legend and caption all import from here.

// ---------- 4. Units and axes ----------
// 1 unit = 1 mm. Origin: seat centre on the platter top. +X doll's left, +Y doll's front, +Z up.
// θ = 0 presents the front. The turn group value is θ − 45 because the camera sits at azimuth 45.
export const AZIMUTH = 45;
export const ELEVATION = 30;
export const groupOf = (theta) => theta - AZIMUTH;
export const thetaOf = (group) => group + AZIMUTH;
export const VIEWS = [
  { name: "front", at: 0 },
  { name: "left side", at: 90 },
  { name: "back", at: 180 },
  { name: "right side", at: 270 },
];

// ---------- 8.4 Camera and card ----------
export const CARD = { width: 720, height: 560, pad: 22 };
export const FIT_POINTS = [[-150, -150, -20], [150, 150, -20], [-150, 150, -20], [150, -150, -20], [0, 0, 260]];

// ---------- 5.1 Envelope ----------
export const ENVELOPE = { body: 152, headD: 100, total: 250, ears: 261, torsoD: 120, shoulders: 141, feet: 163, feetFront: 104, muzzleTip: 57 };

// ---------- 5.2 Solids ----------
export const unit = (v) => { const l = Math.hypot(...v); return v.map((x) => x / l); };
export const sub = (a, b) => a.map((x, i) => x - b[i]);
export const add = (a, b) => a.map((x, i) => x + b[i]);
export const mul = (a, s) => a.map((x) => x * s);
export const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
export const len = (a) => Math.hypot(...a);
// radical plane of two overlapping spheres: flat for a (facing b), flat for b (facing a)
export const cut = (a, b) => {
  const v = sub(b.c, a.c), D = len(v), n = unit(v);
  const d = (a.r * a.r - b.r * b.r + D * D) / (2 * D);
  return [{ n, d }, { n: n.map((x) => -x), d: D - d }];
};
export const HEAD = { c: [0, 8, 200], r: 50 };
export const TORSO = { c: [0, 0, 101.3], r: 60 };
export const NECK = 152;
export const NM = [0, 0.866, -0.5]; // muzzle direction
export const MUZZLE = { c: HEAD.c.map((x, i) => x + 43.54 * NM[i]), r: 13 }; // (0, 45.71, 178.23)
export const MUZZLE_FLAT = { n: NM.map((x) => -x), d: -5 };
export const HEAD_MUZZLE_FLAT = { n: NM, d: 48.54 };
export const earAt = (s) => {
  const u = unit([s * 0.72, -0.08, 0.69]);
  const D = Math.sqrt(2500 - 256) + Math.sqrt(400 - 256);
  return { c: HEAD.c.map((x, i) => x + D * u[i]), r: 20 };
};
export const eyeFlat = (s) => ({ n: unit([s * 30, 39.5, -6]), d: 47 });
export const SHOULDER = (s) => ({ c: [s * 52.7, 52.7, 120], r: 18 });
export const SHOULDER_BOTTOM = { n: [0, 0, -1], d: 11.3 };
export const ARM = (s) => ({ at: [s * 52.7, 52.7], z0: 72, z1: 108.7, r: 14 }); // dome bottom (tip z 58), flat top
export const LEG = (s) => ({ hip: [s * 54.7, 63.8, 24], foot: [s * 57.5, 80, 24], r: 24 });
export const TORSO_LOWER = { z0: 0, z1: 101.3, r: 60 };
export const SIDES = [1, -1]; // s = +1 doll's left, −1 doll's right

// ---------- 5.3 Surface features ----------
export const FEATURES = {
  eyePatch: { d: 34, centre: (s) => [s * 28.2, 45.2, 194.4] },
  eye: { d: 14, highlight: 3 },
  nose: { w: 10, h: 7, at: [0, 57, 171.7] },
  mouth: { w: 12, z: 163 },
  cheek: { d: 16, x: 36, z: 176 },
  oled: { w: 22, h: 11, at: [0, 60, 95], depth: 10 },
  sole: { pad: 16, toe: 6, toes: 4 },
  rocker: { open: [17, 12], face: [15, 10], at: [0, -60, 92], depth: 6 },
  port: { w: 10, h: 4.5, at: [0, -60, 72], depth: 8 },
};
export const CAMERA_EYE = 1; // the camera is behind the doll's left eye (s = +1)

// ---------- 6.3 Components ----------
export const COMPONENTS = [
  { id: "01", name: "Microcontroller", part: "ESP32 DevKit, 30-pin, Wi-Fi + Bluetooth", fn: "main controller" },
  { id: "02", name: "Camera", part: "ESP32-CAM board with OV5640 5 MP sensor on a 75 mm flex", fn: "image input" },
  { id: "03", name: "Microphone", part: "INMP441, I²S", fn: "voice input" },
  { id: "04", name: "Amplifier", part: "PAM8403, one channel used", fn: "speaker amplifier" },
  { id: "05", name: "Boost converter", part: "5 V step-up module, ≥ 2 A", fn: "raises cell voltage to 5 V" },
  { id: "06", name: "Battery", part: "18650 Li-ion cell, 3.7 V, one cell", fn: "power source" },
  { id: "07", name: "Speaker", part: "3 W, 4 Ω", fn: "sound output" },
  { id: "08", name: "Charger", part: "TP4056 module with cell protection, USB-C", fn: "charges and protects the cell" },
  { id: "09", name: "Display", part: 'OLED 0.96", SSD1306, I²C, 128 × 64', fn: "shows emotion and battery state" },
  { id: "10", name: "Carrier board", part: "Perfboard", fn: "power and signal distribution" },
  { id: "11", name: "Switch", part: "Rocker, 15 × 10 mm face, 2-pin, 3 A", fn: "power on / off" },
];
export const SIZES = {
  esp32: [51.5, 28.5, 13], cam: [40.5, 27, 4.5], lens: [8.5, 8.5, 6], lensBarrel: 7, mic: [14, 2], micCan: [4, 3, 1], micPort: 1,
  amp: [21, 18, 4], boost: [36, 17, 14], inductor: [7, 7, 4], cell: [18.3, 65], cradle: [21, 21, 77], speaker: [40, 20], dustCap: 14, magnet: 22,
  charger: [28, 17, 4], usbc: [9, 7, 3.2], oled: [27.3, 27.8, 4], oledActive: [21.7, 10.9], carrier: [60, 80, 1.6], switchFace: [15, 10], switch: [15, 10, 15],
  shield: [18, 16, 3],
};

// ---------- 7.2 Placement (centres and axis-aligned extents) ----------
export const BOXES = {
  "10": { centre: [0, -6, 70], min: [-30, -6.8, 30], max: [30, -5.2, 110] },
  "01": { centre: [0, 1.3, 85], min: [-25.75, -5.2, 70.75], max: [25.75, 7.8, 99.25] },
  "04": { centre: [-15, -3.2, 52], min: [-25.5, -5.2, 43], max: [-4.5, -1.2, 61] },
  "05": { centre: [-19.5, -13.8, 70], min: [-28, -20.8, 52], max: [-11, -6.8, 88] },
  "06": { centre: [23, -26, 62], min: [12.5, -36.5, 23.5], max: [33.5, -15.5, 100.5] },
  "08": { centre: [0, -36, 72], min: [-8.5, -50, 70], max: [8.5, -22, 74] },
  "11": { centre: [0, -44.5, 92], min: [-7.5, -52, 87], max: [7.5, -37, 97] },
  "07": { centre: [0, 36, 44], min: [-20, 26, 24], max: [20, 46, 64] },
  "09": { centre: [0, 46, 95], min: [-13.65, 44, 81.1], max: [13.65, 48, 108.9] },
  "02": { centre: [0, 6, 194.5], min: [-20.25, 3.75, 181], max: [20.25, 8.25, 208] },
  "02.lens": { centre: [28.2, 41.5, 194.4], min: [23.95, 38.5, 190.15], max: [32.45, 44.5, 198.65] },
  "03": { centre: [0, 52.2, 174.5], normal: [0, 0.866, -0.5], r: 7, t: 2 },
};
// Parts exempt from the 8 mm stuffing rule (7.2 "Checked").
export const SKIN_EXEMPT = ["02.lens", "03", "11"];
export const LENS = { at: [28.2, 41.5, 194.4], axis: [0, 1, 0] };
export const MIC = { at: [0, 52.2, 174.5], normal: [0, 0.866, -0.5] };

// ---------- 7.1 Internal frame ----------
export const FRAME = {
  floor: { r: 50, z0: 14, z1: 18, feet: 8 },
  posts: { w: 4, z0: 18, z1: 108, at: [[45, 16], [-45, 16], [45, -16], [-45, -16]] },
  roof: { z0: 108, z1: 112, h: 4 },
  uprights: { w: 4, z0: 18, z1: 112, at: [[32, -6], [-32, -6]] },
  rear: { x: 22, y0: -52, y1: -50, z0: 62, z1: 102 },
  bezel: { x: 18, y0: 48, y1: 50, z0: 79, z1: 109, window: [22, 11], windowZ: 95, lens: 1.5 },
  grille: { x: 22, y0: 46, y1: 48, z0: 22, z1: 66, slots: 7, clips: 3 },
  cradle: { size: [21, 21, 77], centre: [23, -26, 62], riser: 5.5 },
  spine: { w: 8, d: 6, z0: 112, z1: 179, clips: 3 },
  headPlate: { w: 56, d: 40, t: 2, centre: [0, 8, 180] },
  eyeSocket: { at: [28.2, 41.5, 194.4] },
  micArm: { at: [0, 52.2, 174.5] },
};

// ---------- 7.3 Wiring ----------
export const HUES = { red: "power", blue: "data", green: "audio" };
export const CABLES = [
  { id: "W1", from: "06", to: "08", cores: 2, r: 0.9, hue: "red", text: "cell 3.7 V" },
  { id: "W2", from: "08", to: "11", cores: 1, r: 0.7, hue: "red", text: "switched supply" },
  { id: "W3", from: "11", to: "10", cores: 1, r: 0.7, hue: "red", text: "switched supply" },
  { id: "W4", from: "08", to: "10", cores: 1, r: 0.7, hue: "red", text: "supply return" },
  { id: "W5", from: "10", to: "02", cores: 2, r: 0.9, hue: "red", text: "5 V rail" },
  { id: "W6", from: "10", to: "02", cores: 2, r: 0.9, hue: "blue", text: "UART · TX RX" },
  { id: "W7", from: "10", to: "03", cores: 5, r: 1.2, hue: "blue", text: "I²S · SCK WS SD + 3.3 V" },
  { id: "W8", from: "10", to: "09", cores: 4, r: 1.1, hue: "blue", text: "I²C · SDA SCL + 3.3 V" },
  { id: "W9", from: "04", to: "07", cores: 2, r: 0.9, hue: "green", text: "audio out" },
];
export const FLEX = { w: 8, t: 0.3 };
// The one signal cable (data or audio) whose end lands on a component, for the readout (9.3).
export const signalOf = (id) => {
  const list = CABLES.filter((c) => c.hue !== "red" && (c.from === id || c.to === id));
  return list.length === 1 ? list[0] : null;
};
export const cablesOf = (id) => CABLES.filter((c) => c.from === id || c.to === id).map((c) => c.id);

// ---------- 8. Scene ----------
export const BASE = { plate: 280, plateH: 8, plateTop: -20, groove: 4, housingR: 110, housingTop: -6, housingH: 14, ring: [102, 108] };
export const PLATTER = { r: 100, z0: -6, z1: 0 };
export const BUDGET = 230;

// ---------- 9. Behaviour ----------
export const STATE = { theta: 0, scene: "skin", selected: null, power: true };
export const MOTION = { follow: 0.12, step: 15, swap: 240, powerFade: 200, tourStart: 4, tourSpeed: 12, tourPause: 1.2, tourPauses: [0, 90, 180], tourSwapAt: 270 };
export const PULSE = {
  length: 4,
  steps: [
    { name: "listening", parts: ["03", "W7"] },
    { name: "seeing", parts: ["02.lens", "02.flex", "02", "W6"] },
    { name: "sending to backend", parts: ["01", "01.antenna"] },
    { name: "answering", parts: ["10.dac", "10.att", "04", "W9"] },
    { name: "speaking", parts: ["07", "09"] },
  ],
};
export const TEXT = {
  fig: "Fig 1",
  title: "Toki — smart plush, 250 mm",
  hint: "Drag to turn · S skin / hardware · P power",
  scenes: { skin: "skin", core: "hardware" },
  powerOff: "power off",
  caption:
    "Toki is a 250 mm plush panda for speech practice. A camera behind its left eye and a microphone behind its nose send image and sound through an ESP32 to a backend over Wi-Fi; the answer comes back as speech from a 3 W speaker and as an emotion on a 0.96-inch display. One 18650 cell, raised to 5 V, powers everything. The hardware view is shown without plush, stuffing and the frame's side shells.",
  label:
    "A seated plush panda on an inspection turntable. In the hardware view the plush is removed to show the internal frame, eleven components and nine cables.",
};

const pad3 = (n) => String(Math.round(n)).padStart(3, "0");
export const wrap360 = (x) => ((x % 360) + 360) % 360;
export const viewOf = (theta) => {
  const t = wrap360(theta);
  for (const v of VIEWS) {
    const d = Math.abs(((t - v.at + 540) % 360) - 180);
    if (d <= 10) return v.name;
  }
  return null;
};
export const componentOf = (id) => COMPONENTS.find((c) => c.id === id) ?? null;
export function readoutOf({ theta, scene, selected, power, step = null }) {
  const t = wrap360(Math.round(theta));
  const parts = [`θ ${pad3(t % 360)}°`];
  const view = viewOf(theta);
  if (view) parts.push(view);
  parts.push(TEXT.scenes[scene]);
  if (step) parts.push(step);
  else if (selected) {
    const c = componentOf(selected);
    parts.push(`${c.id} ${c.name}`, c.fn);
    const s = signalOf(selected);
    if (s) parts.push(s.text);
  }
  if (!power) parts.push(TEXT.powerOff);
  return parts.join(" · ");
}

// ---------- 11. check() ----------
// Skin as signed distance: the union of the fourteen convex solids of 5.2 (negative inside).
function skinSolids() {
  const out = [];
  const ball = (c, r, flats) => (p) => Math.max(len(sub(p, c)) - r, ...flats.map(({ n, d }) => dot(unit(n), sub(p, c)) - d));
  const capsule = (a, b, r) => (p) => {
    const ab = sub(b, a), t = Math.max(0, Math.min(1, dot(sub(p, a), ab) / dot(ab, ab)));
    return len(sub(p, add(a, mul(ab, t)))) - r;
  };
  const cyl = (x, y, z0, z1, r, domeBottom = false) => (p) => {
    const radial = Math.hypot(p[0] - x, p[1] - y) - r;
    if (domeBottom && p[2] < z0) return len(sub(p, [x, y, z0])) - r;
    return Math.max(radial, z0 - p[2], p[2] - z1);
  };
  out.push(cyl(0, 0, TORSO_LOWER.z0, TORSO_LOWER.z1, TORSO_LOWER.r));
  const torsoFlats = [{ n: [0, 0, -1], d: 0 }, { n: [0, 0, 1], d: NECK - TORSO.c[2] }];
  const headFlats = [{ n: [0, 0, -1], d: HEAD.c[2] - NECK }, HEAD_MUZZLE_FLAT];
  for (const s of SIDES) {
    const ear = earAt(s), [hE, eH] = cut(HEAD, ear);
    headFlats.push(hE, eyeFlat(s));
    out.push(ball(ear.c, ear.r, [eH]));
    const sh = SHOULDER(s), [tS, sT] = cut(TORSO, sh);
    torsoFlats.push(tS);
    out.push(ball(sh.c, sh.r, [sT, SHOULDER_BOTTOM]));
    const arm = ARM(s);
    out.push(cyl(arm.at[0], arm.at[1], arm.z0, arm.z1, arm.r, true));
    const leg = LEG(s);
    out.push(capsule(leg.hip, leg.foot, leg.r));
  }
  out.push(ball(HEAD.c, HEAD.r, headFlats));
  out.push(ball(TORSO.c, TORSO.r, torsoFlats));
  out.push(ball(MUZZLE.c, MUZZLE.r, [MUZZLE_FLAT]));
  return out;
}
export const skinSdf = (() => {
  let solids = null;
  return (p) => {
    solids ??= skinSolids();
    return Math.min(...solids.map((f) => f(p)));
  };
})();
const fibonacci = (n) => Array.from({ length: n }, (_, i) => {
  const y = 1 - (2 * (i + 0.5)) / n, r = Math.sqrt(1 - y * y), a = i * 2.399963229728653;
  return [Math.cos(a) * r, y, Math.sin(a) * r];
});
export function boxSamples(b, n = 3) {
  const pts = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let l = 0; l < n; l++) pts.push([0, 1, 2].map((a, ax) => b.min[ax] + ((b.max[ax] - b.min[ax]) * [i, j, l][ax]) / (n - 1)));
  return pts;
}
export function check() {
  const problems = [];
  const boxes = Object.entries(BOXES).filter(([, b]) => b.min);
  for (let i = 0; i < boxes.length; i++)
    for (let j = i + 1; j < boxes.length; j++) {
      const [na, a] = boxes[i], [nb, b] = boxes[j];
      const overlap = [0, 1, 2].map((ax) => Math.min(a.max[ax], b.max[ax]) - Math.max(a.min[ax], b.min[ax]));
      if (overlap.every((o) => o > 1e-9)) problems.push(`boxes ${na} × ${nb} overlap by ${overlap.map((o) => o.toFixed(2)).join(" × ")}`);
    }
  const dirs = fibonacci(64);
  for (const [name, b] of boxes) {
    if (SKIN_EXEMPT.includes(name)) continue;
    let worst = Infinity;
    for (const p of boxSamples(b)) for (const d of dirs) {
      const q = add(p, mul(d, 8));
      const f = skinSdf(q);
      if (f > 0) worst = Math.min(worst, -f);
    }
    if (worst < Infinity) problems.push(`box ${name} is less than 8 mm inside the skin (a point 8 mm from it lies ${(-worst).toFixed(2)} outside)`);
  }
  const ids = new Set([...COMPONENTS.map((c) => c.id)]);
  for (const c of CABLES) for (const end of [c.from, c.to]) if (!ids.has(end)) problems.push(`cable ${c.id} names ${end}, which does not exist`);
  if (CABLES.length !== 9) problems.push(`there are ${CABLES.length} cables, not 9`);
  if (COMPONENTS.length !== 11) problems.push(`there are ${COMPONENTS.length} components, not 11`);
  return problems;
}

// ---------- added: disassembly, zoom, inspect ----------
// Hardware comes apart into five assemblies: four slide out in this order, the core (frame and carrier board) stays.
export const ASSEMBLIES = [
  { name: "rear", direction: [0, -1, 0], travel: 60, parts: [/^frame\.panel\./, /^frame\.rail\./, /^c11\./, /^c08\./, /^frame\.clip\.rear$/, /^frame\.clip\.board2?$/, /^W[1-4](?=[:.]|$)/] },
  { name: "battery", direction: [0.6, -0.8, 0], travel: 60, parts: [/^frame\.cradle\./, /^c06\./] },
  { name: "front", direction: [0, 1, 0], travel: 60, parts: [/^frame\.bezel\./, /^frame\.lens$/, /^frame\.bracket$/, /^frame\.grille/, /^frame\.clip\.sp\./, /^c07\./, /^c09\./] },
  { name: "head", direction: [0, 1, 0], travel: 70, parts: [/^frame\.headplate$/, /^frame\.camclip/, /^frame\.eyearm$/, /^frame\.socket$/, /^frame\.micarm$/, /^frame\.micseat$/, /^c02\./, /^c03\./] },
];
// Cable ends that lift off their mount when the figure comes apart: [start, end] of each route.
export const FREE_ENDS = { W1: [false, true], W3: [false, true], W4: [false, true], W5: [false, true], W6: [false, true], W7: [false, true], W8: [false, true], W9: [false, true] };
export const STAGGER = { offset: 0.15, span: 0.55 };
// Group values for an explode value e ∈ [0, 1]: a pure function, shared by the build, the audit and the page.
export function apartAt(e, list, stagger) {
  const out = {};
  list.forEach((a, i) => {
    const x = Math.min(1, Math.max(0, (e - stagger.offset * i) / stagger.span));
    out[a.name] = a.travel * x * x * (3 - 2 * x);
  });
  return out;
}
export const assemblyOf = (name) => ASSEMBLIES.find((a) => a.parts.some((re) => re.test(name)))?.name ?? null;
export const ZOOM = { min: 1, max: 6, inspectMax: 10, step: 1.25, follow: 0.2, settle: 150 };
export const PHASES = { opening: "taking apart", apart: "apart", closing: "closing up" };

// ---------- added: simulation mode ----------
// Internal timings of the simulated steps (never displayed), packet and arc settings.
export const SIM = { durations: { answering: 0.9, listening: 1.3, seeing: 1.4, sending: 1.2 }, charRate: 0.065, minSpeak: 1.4, rest: 4, idleAuto: 6, resumeAfter: 20, packetSpeed: 42, packetGap: 12, arcs: 3 };
export const FLOW_DIRS = { W1: -1, W2: 1, W3: 1, W4: -1, W5: 1, W7: -1, W6: -1, W8: 1, W9: 1 }; // −1: the signal runs from the route's end to its start
