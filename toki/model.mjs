// Toki v3 — every number of the figure, typed once: MEASURES (the doll, spec 5.0) and everything derived from it (TOKI_3D_SPEC.md sections 4–10).
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

// ---------- 1.0 The measured doll ----------
// Every exterior number derives from this one table. "photo:…" values were measured off doll-design/*.jpeg
// (silhouette fit of a turned profile to the front, back and side photos, camera elevation fitted per photo;
// TOKI_3D_SPEC.md §5.0), scaled so the widest girth is 260 mm. To use a tape-measured doll, replace a value and set
// its source to "tape"; check() and both audits then say whether the pod still fits.
export const MEASURES = {
  width: { value: 260, source: "scale", what: "widest girth, side to side" },
  height: { value: 187, source: "photo:front,back,side", what: "top of the head above the table (no wings)" },
  widestZ: { value: 75, source: "photo:front,back,side", what: "height of the widest girth" },
  footD: { value: 190, source: "photo:front,back,side,down", what: "diameter where the bottom panel meets the table" },
  bandTop: { value: 22, source: "photo:front,back,side", what: "height of the gusset seam above the table" },
  eyeZ: { value: 124, source: "photo:front", what: "eye centre height" },
  eyeX: { value: 51.3, source: "photo:front", what: "eye centre, straight sideways from the middle (half the eye-to-eye distance)" },
  eyeRing: { value: 39.5, source: "photo:front,side-l", what: "orange eye ring, outer diameter" },
  eyeIris: { value: 26.5, source: "photo:front", what: "black iris diameter" },
  mouthZ: { value: 88.5, source: "photo:front", what: "mouth centre height" },
  mouthW: { value: 42, source: "photo:front", what: "mouth width, orange rim outside" },
  mouthH: { value: 35, source: "photo:front", what: "mouth height, orange rim outside" },
  swirlZ: { value: 125, source: "photo:front", what: "swirl centre height" },
  swirlAz: { value: 66, source: "photo:front,side,side-l", what: "swirl centre, degrees round from the front" },
  swirlD: { value: 40, source: "photo:side,side-l", what: "swirl diameter" },
  seamAz: { value: 90, source: "photo:side-l,back,down", what: "side seams, degrees round from the front (and one at the centre back)" },
  wingRootX: { value: 88, source: "photo:front,back", what: "where each wing's root meets the body, straight sideways from the middle" },
  // the doll's left wing seen square from the front, [sideways from the middle, height] (the right wing mirrors it)
  wingOutline: { value: [[123, 219.8], [137.1, 216.3], [141.1, 212.8], [141.7, 209.3], [141.5, 205.8], [140.1, 202.3], [137, 198.8], [131.6, 195.3], [126.8, 191.8], [124.9, 184.8], [120.9, 181.3], [116.9, 174.3], [113, 166], [108.4, 216.3], [103, 212.8], [100.3, 209.3], [96.9, 205.8], [94.8, 202.3], [91.7, 198.8], [89.4, 195.3], [86.7, 191.8], [83.5, 184.8], [80.1, 177.8], [78.7, 170.8]], source: "photo:front (outline rows)", what: "wing outline; top ≈ 220, outer edge ≈ 142" },
  wingT: { value: 24, source: "photo:front,side (estimate)", what: "wing thickness" },
  wingCurl: { value: [121, 182], source: "photo:front", what: "centre of the quilted curl on a wing face, as seen square from the front" },
  wingTwist: { value: 30, source: "photo:side,side-l (estimate)", what: "how far each wing's face turns from facing straight ahead toward facing outward, degrees" },
  tagZ: { value: 46, source: "photo:front", what: "care tag seam point height" },
  tagAz: { value: 95, source: "photo:front (back.jpeg disagrees)", what: "care tag, degrees round from the front" },
};
export const M = Object.fromEntries(Object.entries(MEASURES).map(([k, v]) => [k, v.value]));

// ---------- 1.1 Skin: one turned mint body, two wings, a care tag ----------
// The body is one turned profile (a vertical lathe): an elliptical bottom from the foot (r = footD/2 at z 0) out to the
// widest girth, and an elliptical dome from there to the crown. The gusset seam is a ring on it at bandTop.
const BA = M.width / 2, BZM = M.widestZ, BCU = M.height - M.widestZ, BRB = M.footD / 2;
const SLOPE_MAX = 60;
export const rAt = (z) => {
  if (z >= BZM) { const t = Math.min(1, (z - BZM) / BCU); return BA * Math.sqrt(Math.max(0, 1 - t * t)); }
  const u = Math.min(1, Math.max(0, (BZM - z) / BZM)); return BRB + (BA - BRB) * Math.sqrt(Math.max(0, 1 - u * u));
};
export const slopeAt = (z) => { // dr/dz, clamped where the profile turns horizontal (foot, crown)
  let g;
  if (z >= BZM) { const t = Math.min(1, (z - BZM) / BCU); g = (-BA * t) / (BCU * Math.sqrt(Math.max(1e-9, 1 - t * t))); }
  else { const u = Math.min(1, Math.max(0, (BZM - z) / BZM)); g = ((BA - BRB) * u) / (BZM * Math.sqrt(Math.max(1e-9, 1 - u * u))); }
  return Math.max(-SLOPE_MAX, Math.min(SLOPE_MAX, g));
};
export const BODY = { c: [0, 0, BZM], a: BA, zm: BZM, cu: BCU, rb: BRB, h: M.height, bandTop: M.bandTop };
// lathe knots [z, r]: the foot, the gusset seam, the widest girth, the crown (radius and slope are analytic)
export const BODY_PROFILE = [[0, BRB], [M.bandTop, rAt(M.bandTop)], [BZM, BA], [M.height, 0]];
export const ENVELOPE = { width: M.width, height: M.height, bottomD: M.footD };
// a point on the body at height z and azimuth a (degrees from the front, + toward the doll's left)
export const onBody = (z, a) => { const r = rAt(z); return [r * Math.sin(a * D2R), r * Math.cos(a * D2R), z]; };
// the outward normal there
export const normalAt = (z, a) => {
  const g = slopeAt(z), k = Math.hypot(1, g);
  return [Math.sin(a * D2R) / k, Math.cos(a * D2R) / k, -g / k];
};
// azimuth of a feature measured straight sideways (x) at height z
export const azOf = (z, x) => Math.asin(Math.min(1, x / rAt(z))) / D2R;

// Embroidery: eyes, mouth and the two side swirls, as decals laid tangent to the body (no seats: a lathe takes no flats).
export const FACE = {
  eye: { z: M.eyeZ, az: azOf(M.eyeZ, M.eyeX), ring: M.eyeRing / 2, iris: M.eyeIris / 2, glint: 0.105 * M.eyeIris, star: 0.11 * M.eyeIris, hole: 1.5 },
  mouth: { z: M.mouthZ, w: M.mouthW, h: M.mouthH, tongue: 0.64 * M.mouthW },
  swirl: { z: M.swirlZ, az: M.swirlAz, r: M.swirlD / 2, turns: 2.5, glow: M.swirlD / 2 + 3 },
  tag: { z: M.tagZ, az: M.tagAz, w: 22, l: 30, t: 0.8 },
  seams: { meridians: [180, M.seamAz, -M.seamAz], gussets: [0, 90, 180, 270] },
};
export const eyeAt = (s) => onBody(FACE.eye.z, s * FACE.eye.az);
export const CAMERA_EYE = 1; // the camera looks out through the pupil of the doll's left eye (s = +1)

// Wings: each is a root ball on the body and a tip ball above it, both white and cut to M.wingT thick by two side
// flats, so the wing reads as a puffy two-lobed pad. The root ball sits on the body through a flat tangent to it at
// M.wingRootX (a flat-on-curve contact); the tip ball is placed so that, seen square from the front, its top and outer
// edge match the measured outline; the two join through a flush disc. Ball radii stay at 21 so that each side flat is
// under about 1000 mm² (engine limit 1). The pair is then twisted about the root's normal by M.wingTwist, so the
// faces turn front-outward as in the side photos.
export const WING = { t: M.wingT, root: 21, tip: 21, rootDisc: 9, curlR: 8 };
const rotAbout = (v, k, b) => { // rotate v about unit axis k by angle b (Rodrigues)
  const c = Math.cos(b), sn = Math.sin(b), kv = dot(k, v);
  const kx = [k[1] * v[2] - k[2] * v[1], k[2] * v[0] - k[0] * v[2], k[0] * v[1] - k[1] * v[0]];
  return [0, 1, 2].map((i) => v[i] * c + kx[i] * sn + k[i] * kv * (1 - c));
};
export const wingAt = (s) => {
  const zr = BZM + BCU * Math.sqrt(1 - (M.wingRootX / BA) ** 2);
  const P = [s * M.wingRootX, 0, zr];
  const V = normalAt(zr, s * 90); // the body's normal at the root (in the X–Z plane)
  const U0 = [V[2] * s, 0, -Math.abs(V[0])]; // the tangent there, outward and down
  const tw = M.wingTwist * D2R;
  const U = rotAbout(U0, V, -s * tw);
  const A = unit([U[1] * V[2] - U[2] * V[1], U[2] * V[0] - U[0] * V[2], U[0] * V[1] - U[1] * V[0]]); // thickness axis
  // a point of the wing's mid-plane (through P, spanned by U and V) with the given x and z
  const inPlane = (x, z) => {
    const det = U[0] * V[2] - U[2] * V[0];
    const a = ((x - P[0]) * V[2] - (z - P[2]) * V[0]) / det, b = (U[0] * (z - P[2]) - U[2] * (x - P[0])) / det;
    return add(P, add(mul(U, a), mul(V, b)));
  };
  const root = { c: add(P, mul(V, Math.sqrt(WING.root ** 2 - WING.rootDisc ** 2))), r: WING.root };
  const top = Math.max(...M.wingOutline.map((q) => q[1])), outer = Math.max(...M.wingOutline.map((q) => q[0]));
  const tip = { c: inPlane(s * (outer - WING.tip), top - WING.tip), r: WING.tip };
  const contact = { n: mul(V, -1), d: Math.sqrt(WING.root ** 2 - WING.rootDisc ** 2) };
  const sides = () => [{ n: A, d: WING.t / 2 }, { n: mul(A, -1), d: WING.t / 2 }]; // relative to each ball's centre (both on the mid-plane)
  // the quilted curl: toward the measured curl from the tip's centre, kept inside the tip's side flat
  const flatR = Math.sqrt(WING.tip ** 2 - (WING.t / 2) ** 2);
  const want = inPlane(s * M.wingCurl[0], M.wingCurl[1]);
  const off = sub(want, tip.c), room = Math.max(0, flatR - WING.curlR - 1.5);
  const curl = len(off) > room ? add(tip.c, mul(unit(off), room)) : want;
  const D = len(sub(tip.c, root.c));
  const joint = Math.sqrt(Math.max(0, WING.root ** 2 - ((WING.root ** 2 - WING.tip ** 2 + D * D) / (2 * D)) ** 2));
  return { root, tip, contact, sides, face: A, curl, joint, flatR, at: P };
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
// A rounded box of V-0 ABS: plan x ±68, y −20 → 76, corner radius 8, z 30 → 132.5, wall 2.5 (the largest box that keeps
// 10 mm of stuffing inside the measured body, with the turret on the flat front wall). It splits in the
// plane y = 35 into a front and a rear cover; the floor (with the battery bay, switch and USB-C) stays.
// The walls are flush tiles (engine limit 1: no vertical flat much over ~1000 mm²): `rows` and `cols` on the straight
// walls, `sides` along each side wall (front cover / rear cover), and `corner` chords per rounded corner in `cornerRows`.
export const POD = { x: 68, y0: -20, y1: 76, rc: 8, z0: 30, z1: 132.5, t: 2.5, split: 35, rows: [32.5, 63, 93, 130], cols: [-60, -36, -12, 12, 36, 60], sides: { front: [35, 55, 68], rear: [-12, 11.5, 35] }, corner: 2, cornerRows: [32.5, 81.25, 130], tabs: [45, 84, 121], tab: { w: 5, d: 4, h: 8 } };
export const POD_IN = { x: POD.x - POD.t, y0: POD.y0 + POD.t, y1: POD.y1 - POD.t, z0: POD.z0 + POD.t, z1: POD.z1 - POD.t };
// The camera: its lens looks straight ahead (+Y) through the pupil of the left eye, from a sealed turret on the
// pod's front face. The lens tip sits 6 mm (along +Y) behind the pupil on the fabric.
export const PUPIL = eyeAt(CAMERA_EYE);
export const LENS = { at: [PUPIL[0], PUPIL[1] - 6, PUPIL[2]], axis: [0, 1, 0], turret: 5.9, turretL: 11, nose: 4.5, window: 3 };
// The OV5640 module board sits on the front wall's inner face behind the turret; its flex runs down, across and down
// again to the XIAO's camera connector (three flat strips, two folds; the middle strip lies flat at z FLEX.z).
// The board (12 × 12) is centred on the lens, on the front wall's inner face.
export const CAM = { x: [LENS.at[0] - 6, LENS.at[0] + 6], y: [POD_IN.y1 - 2, POD_IN.y1], z: [LENS.at[2] - 6, LENS.at[2] + 6] };
// The light pipes run straight out (±X) from the side walls, at each swirl's height and depth, to 5 mm (along the
// fabric's normal) behind the swirl's centre.
export const PIPE = (s) => {
  const S = onBody(FACE.swirl.z, s * FACE.swirl.az), n = normalAt(FACE.swirl.z, s * FACE.swirl.az);
  return { y: S[1], z: S[2], x0: s * POD.x, x1: s * (Math.abs(S[0]) - 5 / Math.abs(n[0])), r: 4, gland: 6, glandL: 4 };
};
// (x −30, not v2's −36: the front wall sits 10 mm further back, and W5 needs that room for its two 45° bends)
export const MIC = { at: [-30, POD_IN.y1, 97], r: 7, t: 1.6 };
// The speaker is centred behind the mouth. The amplifier on the hub rises with it, so that its screw terminal stays level
// with the lug strip on the magnet and W6 stays one straight run (AMP_DZ: its rise from the v2 layout, mouth at z 86).
export const SPEAKER = { at: [0, POD_IN.y1, FACE.mouth.z], r: 20, rim: 2, basket: [15, 6], magnet: [11, 8] };
export const AMP_DZ = SPEAKER.at[2] - 86;
const SPK_BACK = SPEAKER.at[1] - SPEAKER.rim - SPEAKER.basket[1] - SPEAKER.magnet[1] - 3; // the lug strip's back

// Placement of every component as axis-aligned boxes (the inspect centre and the overlap check).
export const BOXES = {
  "10": { centre: [0, 30.8, 67], min: [-24, 30, 34], max: [24, 31.6, 100] },
  "01": { centre: [10.9, 36, 69], min: [2, 31.6, 58], max: [19.8, 42, 80] },
  "04": { centre: [-13.1, 37, 76 + AMP_DZ], min: [-22, 31.6, 66 + AMP_DZ], max: [-4.2, 42.7, 85.4 + AMP_DZ] },
  "06": { centre: [-11.25, 0, 44.25], min: [-49, -11, 32.5], max: [26.5, 11, 56] },
  "07": { centre: [40, 0, 36], min: [32, -14, 32.5], max: [48, 14, 40] },
  "08": { centre: [56, 0, 40], min: [50, -7.5, 32.5], max: [62, 8, 47.5] },
  "05": { centre: [0, (SPK_BACK + SPEAKER.at[1]) / 2, SPEAKER.at[2]], min: [-20, SPK_BACK, SPEAKER.at[2] - 20], max: [20, SPEAKER.at[1], SPEAKER.at[2] + 20] },
  "03": { centre: [MIC.at[0], MIC.at[1] - 1, MIC.at[2]], min: [MIC.at[0] - MIC.r, MIC.at[1] - 2.6, MIC.at[2] - MIC.r], max: [MIC.at[0] + MIC.r, MIC.at[1], MIC.at[2] + MIC.r] },
  "02": { centre: [LENS.at[0], 92, LENS.at[2]], min: [CAM.x[0], CAM.y[0], LENS.at[2] - LENS.turret], max: [CAM.x[1], LENS.at[1] + 0.4, LENS.at[2] + LENS.turret] },
  "09": { centre: [0, PIPE(1).y, PIPE(1).z], min: [-POD_IN.x, PIPE(1).y - 5, PIPE(1).z - 5], max: [POD_IN.x, PIPE(1).y + 5, PIPE(1).z + 5] },
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
// Skin as signed distance (negative inside): the turned body, its profile as a fine polyline in the (r, z) half-plane,
// closed by the bottom panel. Wings are outside the pod's reach.
const SKIN_LINE = [[0, 0], ...Array.from({ length: 721 }, (_, i) => { const z = (M.height * i) / 720; return [rAt(z), z]; }), [0, M.height]];
export const skinSdf = (p) => {
  const R = Math.hypot(p[0], p[1]), z = p[2];
  let d = Infinity;
  for (let i = 0; i < SKIN_LINE.length - 1; i++) {
    const [a0, b0] = SKIN_LINE[i], [a1, b1] = SKIN_LINE[i + 1];
    const vx = a1 - a0, vy = b1 - b0, L2 = vx * vx + vy * vy;
    if (L2 < 1e-12) continue;
    const t = Math.max(0, Math.min(1, ((R - a0) * vx + (z - b0) * vy) / L2));
    d = Math.min(d, Math.hypot(R - a0 - t * vx, z - b0 - t * vy));
  }
  const inside = z >= 0 && z <= M.height && R <= rAt(z);
  return inside ? -d : d;
};
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
