// Toki v2 — every number of the figure, typed once (REDESIGN.md explains them; TOKI_3D_SPEC.md sections 4, 8–10).
// Geometry, readout, legend and caption all import from here.

// ---------- Units and axes ----------
// 1 unit = 1 mm. Origin: centre of the doll's bottom panel on the platter top. +X doll's left, +Y doll's front, +Z up.
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

// ---------- Camera and card ----------
export const CARD = { width: 720, height: 560, pad: 22 };
export const FIT_POINTS = [[-150, -150, -20], [150, 150, -20], [-150, 150, -20], [150, -150, -20], [0, 0, 260]];

// ---------- vectors ----------
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
const D2R = Math.PI / 180;
export const SIDES = [1, -1]; // s = +1 doll's left, −1 doll's right

// ---------- 1.1 Skin: one mint body, two wings, a care tag ----------
// The body is a sphere standing on a short upright band (the bottom panel's gusset), as on the plush: 260 wide,
// 210 tall, Ø 236 on the platter. The sphere is cut flat where its girth equals the band's (no curved-on-curved joint).
export const BODY = { c: [0, 0, 80], r: 130 };
export const BAND = { r: 118, z0: 0, z1: BODY.c[2] - Math.sqrt(BODY.r ** 2 - 118 ** 2) }; // z1 ≈ 25.4
export const BOTTOM = { n: [0, 0, -1], d: BODY.c[2] - BAND.z1 }; // the sphere's flat, flush on the band's top
export const ENVELOPE = { width: 2 * BODY.r, height: BODY.c[2] + BODY.r, bottomD: 2 * BAND.r };
// a point on the body at height z and azimuth a (degrees from the front, + toward the doll's left)
export const onBody = (z, a) => {
  const h = Math.sqrt(BODY.r ** 2 - (z - BODY.c[2]) ** 2);
  return [h * Math.sin(a * D2R), h * Math.cos(a * D2R), z];
};
// a small flat on the body, centred on the direction of point p, radius rf (a seat for embroidery): n·(x − c) ≤ d
export const flatAt = (p, rf) => ({ n: unit(sub(p, BODY.c)), d: Math.sqrt(BODY.r ** 2 - rf ** 2), rf });
export const flatCentre = (F) => add(BODY.c, mul(F.n, F.d));

// Embroidery: eyes, mouth and the two side swirls, each on its own small flat (vertical flats stay under Ø 44).
export const FACE = {
  // each flat is only a small seat (the decal is larger and lies tangent): a big flat shows as a pale disc
  eye: { z: 128, az: 23.4, flat: 7, ring: 17, iris: 12.6, glint: 2.6, star: 2.8, hole: 1.5 },
  mouth: { z: 86, flat: 7, w: 36, h: 29, tongue: 23 },
  swirl: { z: 130, az: 58.5, flat: 6, r: 12.5, turns: 2.4, glow: 15.5 },
  tag: { z: 70, az: -122, flat: 8, w: 14, l: 28, t: 0.8 },
  seams: { meridians: [180, 112, -112] },
};
export const eyeAt = (s) => onBody(FACE.eye.z, s * FACE.eye.az);
export const EYE_FLAT = (s) => flatAt(eyeAt(s), FACE.eye.flat);
export const MOUTH_FLAT = flatAt(onBody(FACE.mouth.z, 0), FACE.mouth.flat);
export const SWIRL_FLAT = (s) => flatAt(onBody(FACE.swirl.z, s * FACE.swirl.az), FACE.swirl.flat);
export const TAG_FLAT = flatAt(onBody(FACE.tag.z, FACE.tag.az), FACE.tag.flat);
export const CAMERA_EYE = 1; // the camera looks out through the pupil of the doll's left eye (s = +1)

// Wings: two flattened balls each (a root ball and an outer lobe), white, side faces cut flat (± WING.t / 2).
// Each joins the body, and the lobe the root, through a shared disc no larger than Ø 32 (engine limit 2).
// The wing is a narrow root on the body and a larger rounded lobe above it, leaning out (the quilted curl is on the lobe).
export const WING = { dir: [0.5, -0.06, 0.86], root: 17, lobe: 21, rootDisc: 9, lobeDisc: 12, lobeDir: [0.55, 0, 0.84], t: 30 };
export const wingAt = (s) => {
  const d = unit([s * WING.dir[0], WING.dir[1], WING.dir[2]]);
  const D = Math.sqrt(BODY.r ** 2 - WING.rootDisc ** 2) + Math.sqrt(WING.root ** 2 - WING.rootDisc ** 2);
  const root = { c: add(BODY.c, mul(d, D)), r: WING.root };
  const e = unit([s * WING.lobeDir[0], WING.lobeDir[1], WING.lobeDir[2]]);
  const D2 = Math.sqrt(WING.root ** 2 - WING.lobeDisc ** 2) + Math.sqrt(WING.lobe ** 2 - WING.lobeDisc ** 2);
  const lobe = { c: add(root.c, mul(e, D2)), r: WING.lobe };
  // the side flats face ±Y, turned with the wing's lean so they stay vertical
  const side = unit([0, 1, 0]);
  return { root, lobe, side, d };
};

// ---------- 1.2 Electronics ----------
export const COMPONENTS = [
  { id: "01", name: "Controller", part: "Seeed XIAO ESP32-S3 Sense: Wi-Fi, 8 MB PSRAM, camera connector", fn: "main controller · Wi-Fi" },
  { id: "02", name: "Camera", part: "OV5640 lens module on a 75 mm flex", fn: "image input" },
  { id: "03", name: "Microphone", part: "INMP441, I²S", fn: "voice input" },
  { id: "04", name: "Amplifier", part: "MAX98357A I²S class-D, 3 W", fn: "speaker amplifier" },
  { id: "05", name: "Speaker", part: "40 mm, 3 W, 4 Ω", fn: "sound output" },
  { id: "06", name: "Battery", part: "18650 Li-ion, 2600 mAh, protected", fn: "power source" },
  { id: "07", name: "Charger", part: "TP4056 USB-C module with DW01 protection", fn: "charges and protects the cell" },
  { id: "08", name: "Switch", part: "Rocker in a sealed boot, 3 A", fn: "power on / off" },
  { id: "09", name: "Cheek lights", part: "2 × SK6812 RGB LED behind acrylic light pipes", fn: "shows emotion and battery state" },
  { id: "10", name: "Hub board", part: "Perfboard 48 × 66: VBAT bus, PTC fuse, connectors", fn: "power and signal distribution" },
];
export const HUES = { red: "power", blue: "data", green: "audio" };
export const CABLES = [
  { id: "W1", from: "06", to: "07", cores: 2, r: 0.9, hue: "red", text: "cell 3.7 V" },
  { id: "W2", from: "07", to: "08", cores: 1, r: 0.7, hue: "red", text: "switched supply" },
  { id: "W3", from: "08", to: "10", cores: 1, r: 0.7, hue: "red", text: "VBAT 3.0–4.2 V" },
  { id: "W4", from: "07", to: "10", cores: 1, r: 0.7, hue: "red", text: "supply return" },
  { id: "W5", from: "10", to: "03", cores: 5, r: 1.2, hue: "blue", text: "I²S · SCK WS SD + 3.3 V" },
  { id: "W6", from: "04", to: "05", cores: 2, r: 0.9, hue: "green", text: "audio out" },
  { id: "W7", from: "10", to: "09", cores: 3, r: 1, hue: "blue", text: "LED data + VBAT" },
  { id: "W8", from: "10", to: "09", cores: 3, r: 1, hue: "blue", text: "LED data + VBAT" },
];
export const FLEX = { w: 8, t: 0.3, z: 96 };
// The one signal cable (data or audio) whose end lands on a component, for the readout.
export const signalOf = (id) => {
  const list = CABLES.filter((c) => c.hue !== "red" && (c.from === id || c.to === id));
  return list.length === 1 ? list[0] : null;
};
export const cablesOf = (id) => CABLES.filter((c) => c.from === id || c.to === id).map((c) => c.id);

// ---------- 1.3 The sealed pod ----------
// A rounded box of V-0 ABS: plan x ±70, y −20 → 86, corner radius 14, z 30 → 138, wall 2.5. It splits in the
// plane y = 35 into a front and a rear cover; the floor (with the battery bay, switch and USB-C) stays.
// The walls are flush tiles (engine limit 1: no vertical flat much over ~1000 mm²): `rows` and `cols` on the straight
// walls, `sides` along each side wall (front cover / rear cover), and `corner` chords per rounded corner in `cornerRows`.
export const POD = { x: 70, y0: -20, y1: 86, rc: 14, z0: 30, z1: 137, t: 2.5, split: 35, rows: [32.5, 66.5, 100.5, 134.5], cols: [-56, -28, 0, 28, 56], sides: { front: [35, 53.5, 72], rear: [-6, 14.5, 35] }, corner: 2, cornerRows: [32.5, 83.5, 134.5], tabs: [45, 84, 123], tab: { w: 5, d: 4, h: 8 } };
export const POD_IN = { x: POD.x - POD.t, y0: POD.y0 + POD.t, y1: POD.y1 - POD.t, z0: POD.z0 + POD.t, z1: POD.z1 - POD.t };
// The camera: its lens looks straight ahead (+Y) through the pupil of the left eye, from a sealed turret on the
// pod's front face. The lens tip sits 6 mm (along +Y) behind the pupil's flat.
export const PUPIL = flatCentre(EYE_FLAT(CAMERA_EYE));
export const LENS = { at: [PUPIL[0], PUPIL[1] - 6, PUPIL[2]], axis: [0, 1, 0], turret: 7, turretL: 11, nose: 4.5, window: 3 };
// The OV5640 module board sits on the front wall's inner face behind the turret; its flex runs down, across and down
// again to the XIAO's camera connector (three flat strips, two folds; the middle strip lies flat at z FLEX.z).
export const CAM = { x: [41.5, 53.5], y: [81.5, 83.5], z: [121.5, 133.5] };
// The light pipes run straight out (±X) from the side walls to just behind each swirl.
const swirlCentre = (s) => flatCentre(SWIRL_FLAT(s));
export const PIPE = (s) => {
  const S = swirlCentre(s), F = SWIRL_FLAT(s);
  // where the line y = S.y, z = S.z meets the swirl's flat, then 5 mm back along the flat's normal
  const x = (F.d - F.n[1] * (S[1] - BODY.c[1]) - F.n[2] * (S[2] - BODY.c[2])) / F.n[0] + BODY.c[0];
  return { y: S[1], z: S[2], x0: s * POD.x, x1: s * (Math.abs(x) - 5 / Math.abs(F.n[0])), r: 4, gland: 6, glandL: 4 };
};
export const MIC = { at: [-36, POD_IN.y1, 97], r: 7, t: 1.6 };
export const SPEAKER = { at: [0, POD_IN.y1, 86], r: 20, rim: 2, basket: [15, 6], magnet: [11, 8] };

// Placement of every component as axis-aligned boxes (the inspect centre and the overlap check).
export const BOXES = {
  "10": { centre: [0, 30.8, 67], min: [-24, 30, 34], max: [24, 31.6, 100] },
  "01": { centre: [10.9, 36, 69], min: [2, 31.6, 58], max: [19.8, 42, 80] },
  "04": { centre: [-13.1, 37, 76], min: [-22, 31.6, 66], max: [-4.2, 42.7, 85.4] },
  "06": { centre: [-11.25, 0, 44.25], min: [-49, -11, 32.5], max: [26.5, 11, 56] },
  "07": { centre: [40, 0, 36], min: [32, -14, 32.5], max: [48, 14, 40] },
  "08": { centre: [56, 0, 40], min: [50, -7.5, 32.5], max: [62, 8, 47.5] },
  "05": { centre: [0, 74, 86], min: [-20, 64.5, 66], max: [20, 83.5, 106] },
  "03": { centre: [-36, 82.5, 97], min: [-43, 80.9, 90], max: [-29, 83.5, 104] },
  "02": { centre: [LENS.at[0], 92, LENS.at[2]], min: [CAM.x[0], CAM.y[0], LENS.at[2] - LENS.turret], max: [CAM.x[1], LENS.at[1] + 0.4, LENS.at[2] + LENS.turret] },
  "09": { centre: [0, PIPE(1).y, PIPE(1).z], min: [-67.5, PIPE(1).y - 5, PIPE(1).z - 5], max: [67.5, PIPE(1).y + 5, PIPE(1).z + 5] },
};
// Under the pod floor, reached through the zip in the bottom panel: the USB-C receptacle with its silicone plug, and
// the rocker in its sealed boot. They hang from the floor's underside, 25 mm above the fabric.
export const UNDER = {
  usb: { min: [36, -11, 26.8], max: [45, -4, 30] },
  plug: { min: [35.5, -11.5, 24.8], max: [45.5, -3.5, 26.8] },
  boot: { min: [51, -9, 26], max: [63, 8, 30] },
};
// Display posts: the hardware view stands the pod on three thin posts in place of the removed stuffing.
export const POSTS = { at: [[-45, 30], [12, 66], [12, -12]], r: 3 };

// ---------- 8. Scene ----------
export const BASE = { plate: 280, plateH: 8, plateTop: -20, groove: 4, housingR: 128, housingTop: -6, housingH: 14, ring: [121, 127], label: { x: 70, y: 112, w: 64, d: 15, r: 1.6 } };
export const PLATTER = { r: 120, z0: -6, z1: 0 };
export const BUDGET = 230;

// ---------- 9. Behaviour ----------
export const STATE = { theta: 0, scene: "skin", selected: null, power: true };
export const MOTION = { follow: 0.12, step: 15, swap: 240, powerFade: 200, tourStart: 4, tourSpeed: 12, tourPause: 1.2, tourPauses: [0, 90, 180], tourSwapAt: 270 };
export const PULSE = {
  length: 4,
  steps: [
    { name: "listening", parts: ["03", "W5"] },
    { name: "seeing", parts: ["02.lens", "02.flex", "02"] },
    { name: "sending to backend", parts: ["01", "01.antenna"] },
    { name: "answering", parts: ["10.i2s", "04", "W6"] },
    { name: "speaking", parts: ["05", "09"] },
  ],
};
// Cheek glow colours (CSS tokens --toki-glow-<name>), by emotion.
export const GLOWS = ["happy", "listening", "thinking", "curious", "encouraging", "proud", "boot", "low"];
export const TEXT = {
  fig: "Fig 1",
  title: "Toki — smart plush, 260 mm",
  hint: "Drag to turn · S skin / hardware · D open pod",
  scenes: { skin: "skin", core: "hardware" },
  powerOff: "power off",
  caption:
    "Toki is a 260 mm mint plush for speech practice. A camera looks out through the pupil of its left eye and a microphone listens behind its face; an ESP32-S3 sends image and sound over Wi-Fi to a backend, and the answer comes back as speech from a 3 W speaker behind the mouth, while two cheek lights glow with Toki's mood. Every hard part lives in one sealed pod inside the stuffing. The hardware view is shown without plush and stuffing, with the pod on three display posts.",
  safety: [
    "Tamper-proof clamshell of V-0 (flame-retardant) ABS, gasketed, six security screws",
    "Double cell protection (the cell's own PCM and a DW01) plus a PTC fuse",
    "Battery in its own screwed bay; USB-C with a silicone plug and the switch under a zip in the bottom panel",
    "No hard part within 10 mm of the fabric, except the camera window and the light-pipe tips",
    "No cable leaves the pod; rounded corners; the pod sits in a sewn pocket",
  ],
  label:
    "A round mint plush with white wings on an inspection turntable. In the hardware view the plush is removed to show the sealed pod, which stands on three display posts and opens into a front and a rear cover around ten components and eight cables.",
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

// ---------- check() ----------
// Skin as signed distance (negative inside): the body sphere with its bottom panel; wings are outside the pod's reach.
export const skinSdf = (p) => Math.min(
  Math.max(len(sub(p, BODY.c)) - BODY.r, -p[2]), // (the sphere's part below the band's top lies inside the band)
  Math.max(Math.hypot(p[0], p[1]) - BAND.r, BAND.z0 - p[2], p[2] - BAND.z1),
);
// the pod's outer outline in plan (rounded rectangle, corners as POD.corner chords per quarter)
export function podOutline(inset = 0) {
  const { x, y0, y1, rc, corner } = POD;
  const r = rc - inset;
  const cs = [[x - rc, y1 - rc, 0], [-(x - rc), y1 - rc, 90], [-(x - rc), y0 + rc, 180], [x - rc, y0 + rc, 270]];
  const pts = [];
  for (const [cx, cy, a0] of cs) for (let j = 0; j <= corner; j++) {
    const a = (a0 + (90 * j) / corner) * D2R;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
}
export function boxSamples(b, n = 3) {
  const pts = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let l = 0; l < n; l++) pts.push([0, 1, 2].map((a, ax) => b.min[ax] + ((b.max[ax] - b.min[ax]) * [i, j, l][ax]) / (n - 1)));
  return pts;
}
export const STUFFING = 10; // mm of stuffing between the pod and the fabric
export function check() {
  const problems = [];
  // the pod: every outline point at the bottom, the top and between, and the screw tabs, 10 mm inside the skin
  const outline = podOutline();
  for (let z = POD.z0; z <= POD.z1 + 1e-9; z += (POD.z1 - POD.z0) / 8)
    for (const [x, y] of outline) {
      const f = skinSdf([x, y, z]);
      if (f > -STUFFING) problems.push(`pod point (${x.toFixed(1)}, ${y.toFixed(1)}, ${z.toFixed(1)}) is ${(-f).toFixed(2)} mm inside the skin, under ${STUFFING}`);
    }
  for (const s of SIDES) for (const z of POD.tabs) for (const y of [POD.split - 4, POD.split + 4]) {
    const f = skinSdf([s * (POD.x + 6), y, z + 5]);
    if (f > -STUFFING) problems.push(`screw tab at z ${z} is ${(-f).toFixed(2)} mm inside the skin`);
  }
  // the exempt tips: the lens and each light pipe's end still sit at least 4 mm inside the fabric
  const lensF = skinSdf(LENS.at);
  if (lensF > -4) problems.push(`lens tip is ${(-lensF).toFixed(2)} mm inside the skin, under 4`);
  for (const s of SIDES) {
    const P = PIPE(s);
    const f = skinSdf([P.x1, P.y, P.z]);
    if (f > -4) problems.push(`light pipe ${s > 0 ? "L" : "R"} tip is ${(-f).toFixed(2)} mm inside the skin, under 4`);
  }
  // the parts under the floor keep the same 10 mm from the fabric
  for (const [name, b] of Object.entries(UNDER)) for (const p of boxSamples(b)) {
    const f = skinSdf(p);
    if (f > -STUFFING) { problems.push(`${name} under the floor is ${(-f).toFixed(2)} mm inside the skin`); break; }
  }
  // every component box inside the pod, and no two overlapping
  const boxes = Object.entries(BOXES);
  for (const [name, b] of boxes) {
    if (name === "02" || name === "09") continue; // the turret and the pipes pass through the wall by design
    if (b.min[0] < -POD_IN.x - 1e-6 || b.max[0] > POD_IN.x + 1e-6 || b.min[1] < POD_IN.y0 - 1e-6 || b.max[1] > POD_IN.y1 + 1e-6 || b.max[2] > POD_IN.z1 + 1e-6 || b.min[2] < POD.z0 - 1e-6) problems.push(`box ${name} leaves the pod`);
  }
  for (let i = 0; i < boxes.length; i++)
    for (let j = i + 1; j < boxes.length; j++) {
      const [na, a] = boxes[i], [nb, b] = boxes[j];
      if ((na === "09") !== (nb === "09")) continue; // the pipe band crosses the pod at the top, above everything
      const overlap = [0, 1, 2].map((ax) => Math.min(a.max[ax], b.max[ax]) - Math.max(a.min[ax], b.min[ax]));
      if (overlap.every((o) => o > 1e-9)) problems.push(`boxes ${na} × ${nb} overlap by ${overlap.map((o) => o.toFixed(2)).join(" × ")}`);
    }
  const ids = new Set(COMPONENTS.map((c) => c.id));
  for (const c of CABLES) for (const end of [c.from, c.to]) if (!ids.has(end)) problems.push(`cable ${c.id} names ${end}, which does not exist`);
  if (CABLES.length !== 8) problems.push(`there are ${CABLES.length} cables, not 8`);
  if (COMPONENTS.length !== 10) problems.push(`there are ${COMPONENTS.length} components, not 10`);
  return problems;
}

// ---------- disassembly, zoom, inspect ----------
// The pod opens: the front cover lifts up (and a little forward) with everything mounted on it, then the rear cover slides back.
// The floor, the hub board and everything on them stay.
export const ASSEMBLIES = [
  { name: "front", direction: unit([0, 0.25, 1]), travel: 120, parts: [/^pod\.front\./, /^pod\.turret/, /^pod\.gland\./, /^pod\.pipe\./, /^pod\.tab\.f/, /^pod\.lid\.f/, /^pod\.clip\./, /^c02\./, /^c03\./, /^c05\./, /^c09\./, /^W[5-8](?=[:.]|$)/] },
  { name: "rear", direction: [0, -1, 0], travel: 90, parts: [/^pod\.rear\./, /^pod\.tab\.r/, /^pod\.lid\.r/] },
];
// Cable ends that lift off their mount when the pod opens: [start, end] of each route.
export const FREE_ENDS = { W5: [true, false], W6: [true, false], W7: [true, false], W8: [true, false] };
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
// components that live on the covers (inspecting one opens the pod)
export const INSIDE = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"];
export const ZOOM = { min: 1, max: 6, inspectMax: 10, step: 1.25, follow: 0.2, settle: 150 };
export const PHASES = { opening: "opening the pod", apart: "pod open", closing: "closing the pod" };

// ---------- the demo ----------
// Internal timings, packet and arc settings (never displayed).
export const SIM = { packetSpeed: 42, packetGap: 12, arcs: 3 };
export const FLOW_DIRS = { W1: 1, W2: 1, W3: 1, W4: 1, W5: 1, W6: 1, W7: 1, W8: 1 }; // −1: the signal runs from the route's end to its start
