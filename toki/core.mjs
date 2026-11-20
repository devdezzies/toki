// Hardware scene (REDESIGN.md 3–5): the sealed pod on three display posts, ten components, eight cables.
// Every number comes from model.mjs or is derived here once.
import { G } from "./kit.mjs";
import { scene, VERT, frameOf, circlePath, pathOf, roundRect } from "./scene.mjs";
import { POD, LENS, CAM, FLEX, PIPE, MIC, SPEAKER, AMP_DZ, UNDER, POSTS, SIDES, CABLES, ASSEMBLIES, FREE_ENDS, assemblyOf, podOutline, sub, add, mul, dot, len } from "./model.mjs";

const r3 = (x) => Math.round(x * 1000) / 1000;
const area = (poly) => poly.reduce((s, [x, y], i) => { const [u, v] = poly[(i + 1) % poly.length]; return s + x * v - u * y; }, 0) / 2;
const ccw = (poly) => (area(poly) > 0 ? poly : poly.slice().reverse());
// keep the part of a convex polygon where side(p) ≥ 0 (side is affine)
const clipPoly = (poly, side) => {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const fa = side(a), fb = side(b);
    if (fa >= 0) out.push(a);
    if ((fa >= 0) !== (fb >= 0)) {
      const t = fa / (fa - fb);
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }
  return out.filter((p, i) => { const q = out[(i + 1) % out.length]; return Math.hypot(p[0] - q[0], p[1] - q[1]) > 1e-6; });
};
// convex hull (monotone chain), counter-clockwise
const hull = (pts) => {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], hi = [];
  for (const q of p) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.slice().reverse()) { while (hi.length >= 2 && cross(hi[hi.length - 2], hi[hi.length - 1], q) <= 0) hi.pop(); hi.push(q); }
  return lo.slice(0, -1).concat(hi.slice(0, -1));
};

export function buildCore() {
  const S = scene();
  const { T, H } = S;
  const owners = {}; // component id → part names
  const own = (id, part) => {
    (owners[id] ??= []).push(part.name);
    return part;
  };
  const boxes = []; // every box we place, for the cable hide test
  const DROP = (process.env.TOKI_DROP ?? "").split(",").filter(Boolean);
  // An axis-aligned box as an upright prism.
  const box = (name, [x0, y0, z0], [x1, y1, z1], opts = {}) => {
    boxes.push({ name, min: [x0, y0, z0], max: [x1, y1, z1] });
    if (DROP.some((d) => name.startsWith(d))) return { name, planes: [] };
    const r = Math.min(opts.r ?? 0, (x1 - x0) / 2 - 0.01, (y1 - y0) / 2 - 0.01);
    const part = T.prism({ name, ...H, plan: { x: x0, y: y0, w: x1 - x0, d: y1 - y0, r: Math.max(0, r) }, z: z0, h: z1 - z0, steps: 2, tone: opts.tone ?? "mid", crease: opts.crease ?? "faint", bevel: opts.bevel ?? 0, material: opts.material, owner: opts.owner, details: opts.details ?? {} });
    if (opts.id) own(opts.id, part);
    return part;
  };
  const VZ = { o: [0, 0, 0], a: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] };
  const slab = (name, polygon, z0, z1, opts = {}) => {
    if (DROP.some((d) => name.startsWith(d))) return { name, planes: [] };
    const part = T.prism({ name, ...H, F: VZ, polygon: ccw(polygon), s0: z0, s1: z1, tone: opts.tone ?? "mid", crease: opts.crease ?? "faint", material: opts.material, details: opts.details ?? {} });
    if (opts.id) own(opts.id, part);
    return part;
  };
  const plane = (part, o, u, v, svg, normal, fade) => (part.planes ? null : T.plane({ part, o, u, v, svg, normal, ...(fade ? { fade } : {}) }));
  const PY = [0, 1, 0], NY = [0, -1, 0], PX = [1, 0, 0], NX = [-1, 0, 0], PZ = [0, 0, 1], NZ = [0, 0, -1];
  const ALWAYS = [-2, -1.9];
  const sideName = (s) => (s > 0 ? "L" : "R");

  // ======================= the pod =======================
  const { x: PX0, y0: Y0, y1: Y1, rc: RC, t: WT, z0: Z0, z1: Z1, split: SPLIT } = POD;
  const ZB = Z0 + WT, ZT = Z1 - WT; // floor top, lid underside
  const outline = podOutline();
  // floor: stays with the hub; the battery bay, charger and switch stand on it, the USB-C and the switch boot hang under it
  slab("pod.floor", outline, Z0, ZB, { tone: "mid", crease: "lo" });
  // lids: one per cover, split at the clamshell plane
  const lidF = slab("pod.lid.f", clipPoly(outline, ([, y]) => y - SPLIT), ZT, Z1, { tone: "hi", crease: "lo" });
  const lidR = slab("pod.lid.r", clipPoly(outline, ([, y]) => SPLIT - y), ZT, Z1, { tone: "hi", crease: "lo" });
  // an inset rule on each lid's top (the moulded edge) and the gasket line along the split
  {
    const inset = podOutline(6).map(([x, y]) => [x * (PX0 - 6) / PX0, y]);
    for (const [part, keep] of [[lidF, ([, y]) => y - SPLIT - 6], [lidR, ([, y]) => SPLIT - 6 - y]]) {
      const pts = clipPoly(inset, keep);
      plane(part, [0, 0, Z1], PX, PY, `<path class="iso-line" data-tone="faint" d="${pathOf(pts.map(([x, y]) => [x, y]))}"/>`, PZ);
    }
  }
  // walls: flush tiles; front and rear straight walls on cols × rows, side walls on sides × rows
  const tiles = {};
  const rows = POD.rows;
  for (let i = 0; i < POD.cols.length - 1; i++)
    for (let j = 0; j < rows.length - 1; j++) {
      const [c0, c1] = [POD.cols[i], POD.cols[i + 1]];
      tiles[`f${i}${j}`] = box(`pod.front.wall.${i}${j}`, [c0, Y1 - WT, rows[j]], [c1, Y1, rows[j + 1]], { tone: "hi", crease: "lo" });
      box(`pod.rear.wall.${i}${j}`, [c0, Y0, rows[j]], [c1, Y0 + WT, rows[j + 1]], { tone: "hi", crease: "lo" });
    }
  for (const s of SIDES) {
    const [x0, x1] = s > 0 ? [PX0 - WT, PX0] : [-PX0, -PX0 + WT];
    for (const [cover, ys] of [["front", POD.sides.front], ["rear", POD.sides.rear]])
      for (let k = 0; k < ys.length - 1; k++)
        for (let j = 0; j < rows.length - 1; j++) tiles[`${cover}.${sideName(s)}${k}${j}`] = box(`pod.${cover}.side.${sideName(s)}${k}${j}`, [x0, ys[k], rows[j]], [x1, ys[k + 1], rows[j + 1]], { tone: "hi", crease: "lo" });
  }
  // rounded corners: chord pieces, in two rows
  const CORNERS = [["front", PX0 - RC, Y1 - RC, 0, "L"], ["front", -(PX0 - RC), Y1 - RC, 90, "R"], ["rear", -(PX0 - RC), Y0 + RC, 180, "R"], ["rear", PX0 - RC, Y0 + RC, 270, "L"]];
  for (const [cover, cx, cy, a0, side] of CORNERS)
    for (let j = 0; j < POD.corner; j++) {
      const aA = ((a0 + (90 * j) / POD.corner) * Math.PI) / 180, aB = ((a0 + (90 * (j + 1)) / POD.corner) * Math.PI) / 180;
      const at = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
      const quad = [at(RC, aA), at(RC, aB), at(RC - WT, aB), at(RC - WT, aA)];
      const zr = POD.cornerRows;
      for (let k = 0; k < zr.length - 1; k++) slab(`pod.${cover}.corner.${side}${j}${k}`, quad, zr[k], zr[k + 1], { tone: "hi", crease: "lo" });
    }
  // screw tabs: a pair at each of three heights on both sides, closed by security screws through both
  POD.tabs.forEach((tz, k) => {
    for (const s of SIDES) {
      const [x0, x1] = s > 0 ? [PX0, PX0 + POD.tab.w] : [-PX0 - POD.tab.w, -PX0];
      const front = box(`pod.tab.f.${sideName(s)}${k}`, [x0, SPLIT, tz], [x1, SPLIT + POD.tab.d, tz + POD.tab.h], { tone: "mid", crease: "lo" });
      const rear = box(`pod.tab.r.${sideName(s)}${k}`, [x0, SPLIT - POD.tab.d, tz], [x1, SPLIT, tz + POD.tab.h], { tone: "mid", crease: "lo" });
      const xm = (x0 + x1) / 2, zm = tz + POD.tab.h / 2;
      // a pin-hex security screw head on the rear tab, the captive nut on the front tab
      const hex = Array.from({ length: 6 }, (_, i) => [0.75 * Math.cos((i * Math.PI) / 3), 0.75 * Math.sin((i * Math.PI) / 3)]);
      plane(rear, [xm, SPLIT - POD.tab.d, zm], NX, NZ, `<path class="iso-line" data-tone="lo" d="${circlePath(0, 0, 1.7, 24)}"/><path class="tk-hole" d="${pathOf(hex)}"/><circle class="tk-pin" r=".28"/>`, NY);
      plane(front, [xm, SPLIT + POD.tab.d, zm], PX, NZ, `<path class="iso-line" data-tone="lo" d="${pathOf(Array.from({ length: 6 }, (_, i) => [1.6 * Math.cos((i * Math.PI) / 3 + Math.PI / 6), 1.6 * Math.sin((i * Math.PI) / 3 + Math.PI / 6)]))}"/>`, PY);
    }
  });
  // the camera turret: a sealed boss on the front wall with a nose, its window at the lens tip
  const TF = (y) => frameOf([LENS.at[0], y, LENS.at[2]], PY, PX);
  T.round({ name: "pod.turret", ...H, F: TF(Y1), s0: 0, s1: LENS.turretL, r: LENS.turret, tone: "hi", crease: "lo", details: { seams: [LENS.turretL - 1.2] } });
  T.round({ name: "pod.turret.nose", ...H, F: TF(Y1 + LENS.turretL), s0: 0, s1: LENS.at[1] - Y1 - LENS.turretL, r: LENS.nose, tone: "hi", crease: "lo" });
  own("02", T.round({ name: "c02.window", ...H, F: TF(LENS.at[1]), s0: 0, s1: 0.4, r: LENS.window, tone: "lo", material: "chrome", details: { rings: [{ at: [0.4, 0, 0], normal: PY, r: 1.7, tone: "hi" }, { at: [0.4, -0.9, -0.9], normal: PY, r: 0.45, tone: "hi" }] } }));
  // glands and light pipes on the side walls, an LED board behind each on the inner face
  for (const s of SIDES) {
    const P = PIPE(s);
    const GF = (x) => frameOf([x, P.y, P.z], [s, 0, 0], PY);
    T.round({ name: `pod.gland.${sideName(s)}`, ...H, F: GF(s * PX0), s0: 0, s1: P.glandL, r: 4.8, tone: "lo", material: "rubber" });
    own("09", T.round({ name: `pod.pipe.${sideName(s)}`, ...H, F: GF(s * (PX0 + P.glandL)), s0: 0, s1: Math.abs(P.x1) - PX0 - P.glandL, r: P.r, tone: "hi", crease: "faint", details: { rings: [{ at: [Math.abs(P.x1) - PX0 - P.glandL, 0, 0], normal: [s, 0, 0], r: 2.4, tone: "mid" }] } }));
    const xin = s * (PX0 - WT);
    const led = box(`c09.${sideName(s)}`, s > 0 ? [xin - 1.6, P.y - 5, P.z - 4.5] : [xin, P.y - 5, P.z - 4.5], s > 0 ? [xin, P.y + 5, P.z + 4.5] : [xin + 1.6, P.y + 5, P.z + 4.5], { id: "09", tone: "hi", crease: "lo" });
    plane(led, [xin - s * 1.6, P.y, P.z], [0, s, 0], NZ, `<path class="tk-chip" d="M-2.5 -2.5H2.5V2.5H-2.5Z"/><circle class="tk-led-dot" r="1.3"/><g class="iso-dots" data-tone="mid">${[[-3.6, -3.6], [3.6, -3.6], [-3.6, 3.6], [3.6, 3.6]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".45"/>`).join("")}</g>`, [-s, 0, 0]);
  }
  // decals on the front wall: the speaker grille holes and the microphone port, per tile
  {
    const [sx, sz] = [SPEAKER.at[0], SPEAKER.at[2]];
    const holes = [];
    for (let row = -6; row <= 6; row++)
      for (let col = -6; col <= 6; col++) {
        const x = sx + (col + (row % 2 ? 0.5 : 0)) * 3.2, z = sz + row * 2.77;
        if (Math.hypot(x - sx, z - sz) <= SPEAKER.r - 3.4) holes.push([x, z]);
      }
    for (let i = 0; i < POD.cols.length - 1; i++)
      for (let j = 0; j < rows.length - 1; j++) {
        const part = tiles[`f${i}${j}`];
        const [c0, c1, z0, z1] = [POD.cols[i], POD.cols[i + 1], rows[j], rows[j + 1]];
        const cx = (c0 + c1) / 2, cz = (z0 + z1) / 2;
        const mine = holes.filter(([x, z]) => x - 0.8 > c0 && x + 0.8 < c1 && z - 0.8 > z0 && z + 0.8 < z1);
        let svg = mine.length ? `<path class="tk-hole" d="${mine.map(([x, z]) => `M${r3(x - cx - 0.7)} ${r3(cz - z)}a.7 .7 0 1 0 1.4 0a.7 .7 0 1 0 -1.4 0`).join("")}"/>` : "";
        const [mx, , mz] = MIC.at;
        if (mx > c0 && mx < c1 && mz > z0 && mz < z1) svg += `<path class="iso-line" data-tone="lo" d="${circlePath(mx - cx, cz - mz, 1.6, 20)}"/><path class="tk-hole" d="${circlePath(mx - cx, cz - mz, 0.6, 12)}"/>`;
        if (svg) plane(part, [cx, Y1, cz], PX, NZ, svg, PY);
      }
  }
  // two clip blocks under the front lid: W7 and W8 turn from vertical to horizontal inside them
  const CLIP = { y: [SPLIT, SPLIT + 5], z: [PIPE(1).z - 7, ZT] };
  for (const s of SIDES) box(`pod.clip.${sideName(s)}`, s > 0 ? [4, CLIP.y[0], CLIP.z[0]] : [-18, CLIP.y[0], CLIP.z[0]], s > 0 ? [18, CLIP.y[1], CLIP.z[1]] : [-4, CLIP.y[1], CLIP.z[1]], { tone: "lo" });
  // display posts (not part of the product): the pod's floor on the platter
  POSTS.at.forEach(([x, y], i) => T.round({ name: `mount.post.${i}`, ...H, F: VERT(x, y), s0: 0, s1: Z0, r: POSTS.r, tone: "lo", crease: "faint" }));

  // ======================= hub board 10, in two clips on the floor =======================
  const HUB = { x: 24, y0: 30, y1: 31.6, z0: 34, z1: 100 };
  for (const s of SIDES) {
    const [x0, x1] = s > 0 ? [20, 25] : [-25, -20];
    box(`pod.floor.clip.${sideName(s)}.riser`, [x0, HUB.y0, ZB], [x1, HUB.y1, HUB.z0], { tone: "lo" });
    box(`pod.floor.clip.${sideName(s)}.b`, [x0, HUB.y0 - 2.5, ZB], [x1, HUB.y0, 44], { tone: "lo" });
    box(`pod.floor.clip.${sideName(s)}.f`, [x0, HUB.y1, ZB], [x1, HUB.y1 + 2.5, 44], { tone: "lo" });
  }
  // the board is six flush pieces; holes on a 5.08 grid both faces; traces on the front
  const BX = [-HUB.x, 0, HUB.x], BZ = [HUB.z0, 56, 78, HUB.z1];
  const SEGS = [
    { ends: "10 01 04 09", tone: "mid", a: [22, 39.5], b: [22, 96] }, // VBAT bus up the right edge
    { ends: "10 01 04 09", tone: "mid", a: [22, 96], b: [-14, 96] }, // and across the top to the LED headers
    { ends: "10 09", tone: "mid", a: [10, 96], b: [10, 100] },
    { ends: "10 09", tone: "mid", a: [-10, 96], b: [-10, 100] },
    { ends: "10", tone: "mid", a: [10, 39.5], b: [14, 39.5] }, // VBAT in → PTC fuse → bus
    { ends: "10", tone: "mid", a: [18, 39.5], b: [22, 39.5] },
    { ends: "01 03", tone: "lo", a: [3, 80], b: [3, 92] }, // 3.3 V and I²S to the microphone header
    { ends: "01 03", tone: "lo", a: [3, 92], b: [-20.5, 92] },
    { ends: "01 03", tone: "lo", a: [-20.5, 92], b: [-20.5, 100] },
    { ends: "01 04", tone: "mid", a: [2, 72], b: [-4.2, 72], cls: "tk-i2s" }, // I²S to the amplifier
  ];
  const GND = { x0: -22, x1: 20, z0: 35.4, z1: 36.6 };
  const TERM = [[22, 39.5], [-14, 96], [10, 100], [-10, 100], [10, 39.5], [-20.5, 100], [2, 72], [-4.2, 72], [3, 80]];
  const clipSeg = (sg, x0, x1, z0, z1) => {
    const [ax, az] = sg.a, [bx, bz] = sg.b;
    const lx = Math.max(Math.min(ax, bx), x0), hx = Math.min(Math.max(ax, bx), x1), lz = Math.max(Math.min(az, bz), z0), hz = Math.min(Math.max(az, bz), z1);
    if (lx > hx + 1e-9 || lz > hz + 1e-9) return null;
    if (ax === bx && (ax <= x0 || ax >= x1)) return null;
    if (az === bz && (az <= z0 || az >= z1)) return null;
    if (ax === bx && hz - lz < 1e-6) return null;
    if (az === bz && hx - lx < 1e-6) return null;
    return ax === bx ? [[ax, lz], [ax, hz]] : [[lx, az], [hx, az]];
  };
  for (let i = 0; i < 2; i++)
    for (let j = 0; j < 3; j++) {
      const x0 = BX[i], x1 = BX[i + 1], z0 = BZ[j], z1 = BZ[j + 1];
      const cxp = (x0 + x1) / 2, czp = (z0 + z1) / 2;
      const piece = box(`c10.board.${i}${j}`, [x0, HUB.y0, z0], [x1, HUB.y1, z1], { id: "10", tone: "hi", crease: "lo" });
      const holes = [];
      for (let x = -21.59; x <= 22; x += 5.08) for (let z = 36.54; z <= 99; z += 5.08) if (x - 0.35 > x0 && x + 0.35 < x1 && z - 0.35 > z0 && z + 0.35 < z1) holes.push([x, z]);
      const holePath = (sign) => `<path class="tk-hole" d="${holes.map(([x, z]) => `M${r3(sign * (x - cxp) - 0.35)} ${r3(czp - z)}a.35 .35 0 1 0 .7 0a.35 .35 0 1 0 -.7 0`).join("")}"/>`;
      plane(piece, [cxp, HUB.y0, czp], NX, NZ, holePath(-1), NY);
      const L = (p) => `${r3(p[0] - cxp)} ${r3(czp - p[1])}`;
      let tr = "";
      for (const sg of SEGS) {
        const c = clipSeg(sg, x0, x1, z0, z1);
        if (c) tr += `<path class="iso-line${sg.cls ? ` ${sg.cls}` : ""}" data-tone="${sg.tone}" data-trace="${sg.ends}" d="M${L(c[0])}L${L(c[1])}"/>`;
      }
      const gx0 = Math.max(GND.x0, x0), gx1 = Math.min(GND.x1, x1);
      if (gx1 > gx0 && GND.z0 >= z0 && GND.z1 <= z1) tr += `<path class="tk-bus" data-trace="10" d="M${L([gx0, GND.z1])}L${L([gx1, GND.z1])}L${L([gx1, GND.z0])}L${L([gx0, GND.z0])}Z"/>`;
      // the PTC fuse on the VBAT input
      if (14 > x0 && 18 < x1 && 38.6 > z0 && 40.4 < z1) tr += `<path class="tk-chip tk-chip-c" data-trace="10" d="M${L([14, 40.4])}L${L([18, 40.4])}L${L([18, 38.6])}L${L([14, 38.6])}Z"/>`;
      // the XIAO's FPC antenna, stuck on the hub above the board
      if (6 > x0 && 18 < x1 && 83 > z0 && 91 < z1) {
        const mz = (z) => r3(czp - z);
        const mx = (x) => r3(x - cxp);
        tr += `<path class="iso-line" data-tone="faint" d="M${mx(6)} ${mz(91)}H${mx(18)}V${mz(83)}H${mx(6)}Z"/><path class="iso-line tk-antenna" data-tone="mid" d="M${mx(7.5)} ${mz(84.5)}V${mz(89.5)}H${mx(9.5)}V${mz(84.5)}H${mx(11.5)}V${mz(89.5)}H${mx(13.5)}V${mz(84.5)}H${mx(15.5)}V${mz(89.5)}H${mx(16.5)}"/><g class="iso-dots" data-tone="mid"><circle class="tk-antenna-dot" cx="${mx(7.5)}" cy="${mz(84.5)}" r=".5"/></g>`;
      }
      const dots = TERM.filter(([x, z]) => x > x0 && x < x1 && z > z0 && z < z1);
      if (dots.length) tr += `<g class="iso-dots" data-tone="mid">${dots.map((p) => { const [u, w] = L(p).split(" "); return `<circle cx="${u}" cy="${w}" r=".6"/>`; }).join("")}</g>`;
      plane(piece, [cxp, HUB.y1, czp], PX, NZ, holePath(1) + (tr ? `<g class="tk-traces">${tr}</g>` : ""), PY);
    }
  // headers: power in on the rear face at the bottom, the microphone and the two LED headers on the top edge
  box("c10.hdr.pwr", [4, 22, HUB.z0], [16, HUB.y0, 43], { id: "10", tone: "lo", material: "gunmetal" });
  box("c10.hdr.w5", [-24, 28, HUB.z1], [-17, 36, 103], { id: "10", tone: "lo", material: "gunmetal", details: { dots: [-22.5, -20.5, -18.5].map((x) => ({ at: [103, x, 32], normal: PZ, size: 0.35, tone: "mid" })) } });
  for (const s of SIDES) box(`c10.hdr.w${s > 0 ? 7 : 8}`, s > 0 ? [6, HUB.y0, HUB.z1] : [-14, HUB.y0, HUB.z1], s > 0 ? [14, 39.2, 105] : [-6, 39.2, 105], { id: "10", tone: "lo", material: "gunmetal", details: { dots: [-2.54, 0, 2.54].map((d) => ({ at: [105, s * 10 + d, 32.5], normal: PZ, size: 0.35, tone: "mid" })) } });

  // 01 XIAO ESP32-S3 Sense, soldered on the hub's front face: the XIAO, its USB-C, the board-to-board
  // connector, the Sense board and its camera connector
  box("c01.pcb", [2, HUB.y1, 58], [19.8, 32.8, 80], { id: "01", tone: "hi", crease: "lo", details: { dots: [3, 5.54, 8.08, 10.62, 13.16, 15.7, 18.24].flatMap((x) => [{ at: [79, x, 32.8], normal: PY, size: 0.45, tone: "mid" }]) } });
  box("c01.usb", [6.5, 32.8, 58], [15.5, 36, 65], { id: "01", tone: "mid", material: "steel", r: 1.2 });
  box("c01.b2b", [5, 32.8, 70], [17, 36, 74], { id: "01", tone: "lo", material: "gunmetal" });
  const sense = box("c01.sense", [2, 36, 66], [19.8, 37.2, 80], { id: "01", tone: "hi", crease: "lo" });
  plane(sense, [10.9, 37.2, 69], PX, NZ, `<path class="tk-chip" d="M-6.5 -1.5H-2.5V1.5H-6.5Z"/><path class="iso-line" data-tone="faint" d="M1.5 -2.2H7.5V2.2H1.5Z"/>`, PY);
  box("c01.fpc", [5, 37.2, 72], [17, 42, 80], { id: "01", tone: "lo", material: "gunmetal" });

  // 04 MAX98357A, soldered on the hub's front face beside the XIAO, screw terminal on top
  // (raised AMP_DZ from v2 so its terminal stays level with the speaker's lug strip behind the mouth)
  const AZ = AMP_DZ;
  const amp = box("c04.pcb", [-22, HUB.y1, 66 + AZ], [-4.2, 33.2, 85.4 + AZ], { id: "04", tone: "hi", crease: "lo" });
  plane(amp, [-13.1, 33.2, 75.7 + AZ], PX, NZ, `<g class="iso-dots" data-tone="mid">${Array.from({ length: 7 }, (_, j) => `<circle cx="${r3(-7.6 + j * 2.54)}" cy="7.9" r=".5"/>`).join("")}</g><path class="tk-chip tk-chip-c" d="M3.4 -1H5.4V.2H3.4ZM3.4 1.2H5.4V2.4H3.4Z"/>`, PY);
  box("c04.chip", [-15.5, 33.2, 72 + AZ], [-11.5, 34, 76 + AZ], { id: "04", tone: "lo", material: "gunmetal" });
  box("c04.term", [-9, 33.2, 80 + AZ], [-4.5, 42.7, 85.4 + AZ], { id: "04", tone: "lo", material: "gunmetal", details: { dots: [{ at: [85.4 + AZ, -6.75, 38], normal: PZ, size: 0.6, tone: "hi" }] } });

  // 06 battery: an 18650 lying along X in its screwed bay (end plates, two low rails, a lid)
  const CELL = { r: 9.15, z: 43.15, x0: -42, x1: 22.5 };
  box("pod.bay.end.n", [-49, -11, ZB], [-46, 11, 56], { tone: "mid" });
  box("pod.bay.end.p", [23.5, -11, ZB], [26.5, 11, 56], { tone: "mid" });
  box("pod.bay.rail.f", [-46, 9.6, ZB], [23.5, 11, 38], { tone: "mid" });
  box("pod.bay.rail.b", [-46, -11, ZB], [23.5, -9.6, 38], { tone: "mid" });
  box("pod.bay.lid", [-46, -11, 53.5], [23.5, 11, 56], { tone: "mid", crease: "lo", details: { dots: [-38, 15].map((x) => ({ at: [56, x, 0], normal: PZ, size: 0.7, tone: "lo" })) } });
  const CF = (x) => frameOf([x, 0, CELL.z], PX, PY);
  own("06", T.round({ name: "c06.spring", ...H, F: CF(-46), s0: 0, s1: 4, r: 5.5, tone: "mid", material: "steel", details: { seams: [0.8, 1.6, 2.4, 3.2] } }));
  const wrap = (215 * Math.PI) / 180;
  own("06", T.round({ name: "c06.cell", ...H, F: CF(CELL.x0), s0: 0, s1: CELL.x1 - CELL.x0, r: CELL.r, tone: "hi", crease: "lo", details: { seams: [1.7, CELL.x1 - CELL.x0 - 1.7], rules: [{ points: [[1.7, CELL.r * Math.cos(wrap), CELL.r * Math.sin(wrap)], [CELL.x1 - CELL.x0 - 1.7, CELL.r * Math.cos(wrap), CELL.r * Math.sin(wrap)]], normal: [0, Math.cos(wrap), Math.sin(wrap)], tone: "lo" }] } }));
  own("06", T.round({ name: "c06.ring", ...H, F: CF(CELL.x1), s0: 0, s1: 0.5, r: 7, tone: "mid", material: "gunmetal" }));
  own("06", T.round({ name: "c06.cap", ...H, F: CF(CELL.x1 + 0.5), s0: 0, s1: 0.5, r: 4, tone: "hi", material: "steel" }));

  // 07 charger: TP4056 + DW01 flat on the floor; its USB-C receptacle and silicone plug under the floor
  const tp = box("c07.pcb", [32, -14, ZB], [48, 14, 33.3], { id: "07", tone: "hi", crease: "lo" });
  plane(tp, [40, 0, 33.3], PX, PY, `<path class="tk-led" d="M-5.5 -11H-3.5V-9.8H-5.5ZM3.5 -11H5.5V-9.8H3.5Z"/><path class="tk-chip" d="M-6 6H-3V9H-6ZM3 6H6V9H3Z"/><path class="iso-line" data-tone="faint" d="M-6.5 -8H6.5"/>`, PZ, ALWAYS);
  box("c07.chip", [38, -3, 33.3], [42, 2, 34.8], { id: "07", tone: "lo", material: "gunmetal" });
  box("c07.hdr.in", [32, -6, 33.3], [35, 6, 40], { id: "07", tone: "lo", material: "gunmetal" });
  box("c07.hdr.out", [45, -6, 33.3], [48, 5, 40], { id: "07", tone: "lo", material: "gunmetal" });
  const usb = box("c07.usb", UNDER.usb.min, UNDER.usb.max, { id: "07", tone: "mid", material: "steel" });
  void usb;
  const plug = box("c07.plug", UNDER.plug.min, UNDER.plug.max, { id: "07", tone: "lo", material: "rubber" });
  plane(plug, [(UNDER.plug.min[0] + UNDER.plug.max[0]) / 2, (UNDER.plug.min[1] + UNDER.plug.max[1]) / 2, UNDER.plug.min[2]], PX, NY, `<path class="iso-line" data-tone="mid" d="${pathOf(roundRect(7.6, 2.6, 1.2, 4))}"/>`, NZ);

  // 08 switch: a rocker whose body stands on the floor and whose face, in a sealed boot, is under it
  box("c08.body", [52, -7.5, ZB], [62, 7.5, 47.5], { id: "08", tone: "lo", material: "gunmetal" });
  box("c08.term", [50, -6, 36], [52, 6, 42], { id: "08", tone: "mid", material: "brass" });
  const boot = box("c08.boot", UNDER.boot.min, UNDER.boot.max, { id: "08", tone: "lo", material: "rubber" });
  plane(boot, [57, -0.5, UNDER.boot.min[2]], PX, NY, `<g class="tk-rocker-marks"><path class="iso-line" data-tone="hi" d="M-4.5 -0.2H4.5"/><path class="iso-line" data-tone="hi" data-mark="I" d="M0 -5.2V-2.6"/><path class="iso-line" data-tone="hi" data-mark="O" d="${circlePath(0, 3.9, 1.3, 16)}"/></g>`, NZ);

  // 05 speaker: magnet, basket and rim (two half-discs) on the front wall behind the mouth, lug strip on the magnet
  const [, , SZ] = SPEAKER.at;
  const SF = (y) => frameOf([0, y, SZ], PY, PX);
  const yRim = SPEAKER.at[1] - SPEAKER.rim, yBasket = yRim - SPEAKER.basket[1], yMagnet = yBasket - SPEAKER.magnet[1];
  own("05", T.round({ name: "c05.magnet", ...H, F: SF(yMagnet), s0: 0, s1: SPEAKER.magnet[1], r: SPEAKER.magnet[0], tone: "mid", material: "steel", details: { seams: [2.5] } }));
  own("05", T.round({ name: "c05.basket", ...H, F: SF(yBasket), s0: 0, s1: SPEAKER.basket[1], r: SPEAKER.basket[0], tone: "mid", material: "gunmetal", details: { seams: [3] } }));
  for (const [k, a0] of [["a", 0], ["b", Math.PI]]) {
    const poly = Array.from({ length: 17 }, (_, j) => { const t = a0 + (j / 16) * Math.PI; return [SPEAKER.r * Math.cos(t), SPEAKER.r * Math.sin(t)]; });
    own("05", T.prism({ name: `c05.rim.${k}`, ...H, F: { o: [0, yRim, SZ], a: PY, u: PX, v: PZ }, polygon: poly, s0: 0, s1: SPEAKER.rim, tone: "mid", crease: "lo", material: "gunmetal", details: { dots: [Math.PI / 4, (3 * Math.PI) / 4].map((t) => ({ at: [0, 18.6 * Math.cos(a0 + t), 18.6 * Math.sin(a0 + t)], normal: NY, size: 0.45, tone: "mid" })) } }));
  }
  box("c05.strip", [-9, yMagnet - 3, 81 + AMP_DZ], [-4.5, yMagnet, 84.4 + AMP_DZ], { id: "05", tone: "lo", details: { dots: [-7.8, -5.7].map((x) => ({ at: [82.7 + AMP_DZ, x, yMagnet - 3], normal: NY, size: 0.45, tone: "hi" })) } });

  // 03 microphone: the INMP441's round board on the front wall's inner face behind its port, can on the back
  const MF = frameOf(MIC.at, NY, PX); // s back from the wall, x along +X, y up
  own("03", T.round({ name: "c03.board", ...H, F: MF, s0: 0, s1: MIC.t, r: MIC.r, tone: "hi", crease: "lo", details: { dots: Array.from({ length: 6 }, (_, j) => { const a = (j / 6) * 2 * Math.PI + Math.PI / 6; return { at: [MIC.t, 5.6 * Math.cos(a), -5.6 * Math.sin(a) - 0.8], normal: NY, size: 0.5, tone: "mid" }; }) } }));
  const yMicBack = MIC.at[1] - MIC.t;
  box("c03.can", [MIC.at[0] - 2, yMicBack - 1, MIC.at[2] - 4.5], [MIC.at[0] + 2, yMicBack, MIC.at[2] - 1.5], { id: "03", tone: "mid", material: "steel" });

  // 02 camera: the OV5640 module on the front wall behind the turret, and its flex to the XIAO
  const cam = box("c02.board", [CAM.x[0], CAM.y[0], CAM.z[0]], [CAM.x[1], CAM.y[1], CAM.z[1]], { id: "02", tone: "hi", crease: "lo" });
  plane(cam, [(CAM.x[0] + CAM.x[1]) / 2, CAM.y[0], (CAM.z[0] + CAM.z[1]) / 2], NX, NZ, `<path class="tk-chip" d="M-3 -3H3V3H-3Z"/><g class="iso-dots" data-tone="mid">${[[-4.6, -4.6], [4.6, -4.6], [-4.6, 4.6], [4.6, 4.6]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".45"/>`).join("")}</g>`, NY);
  const FC = { x: [LENS.at[0] - FLEX.w / 2, LENS.at[0] + FLEX.w / 2], y: [CAM.y[0] + 0.1, CAM.y[0] + 0.1 + FLEX.t] };
  const FB = { x: [7, 15], y: [39.45, 39.45 + FLEX.t] };
  own("02", box("c02.flex.c", [FC.x[0], FC.y[0], FLEX.z], [FC.x[1], FC.y[1], CAM.z[0]], { tone: "mid", material: "copper", crease: "none" }));
  own("02", slab("c02.flex.a", hull([[FC.x[0], FC.y[0]], [FC.x[1], FC.y[0]], [FC.x[1], FC.y[1]], [FC.x[0], FC.y[1]], [FB.x[0], FB.y[0]], [FB.x[1], FB.y[0]], [FB.x[1], FB.y[1]], [FB.x[0], FB.y[1]]]), FLEX.z - FLEX.t, FLEX.z, { tone: "mid", material: "copper", crease: "none" }));
  own("02", box("c02.flex.b", [FB.x[0], FB.y[0], 80], [FB.x[1], FB.y[1], FLEX.z - FLEX.t], { tone: "mid", material: "copper", crease: "none" }));

  // ======================= cables =======================
  const inBox = (b, p, e = 1e-6) => p.every((x, i) => x >= b.min[i] - e && x <= b.max[i] + e);
  const boxShell = (cable, name, min, max) => {
    box(`${cable}.${name}`, min, max, { tone: "lo", material: "gunmetal", owner: cable });
    return { test: (p) => inBox({ min, max }, p) };
  };
  const frameBox = (name) => {
    const b = boxes.find((x) => x.name === name);
    return { name, test: (p) => inBox(b, p) };
  };
  // a polyline with a bend radius per corner (0 or missing: a sharp turn hidden inside a fitting)
  const bend = (pts, radius) => {
    const out = [pts[0]];
    for (let i = 1; i < pts.length - 1; i++) {
      const a = pts[i - 1], p = pts[i], b = pts[i + 1];
      const d1 = G.unit3(sub(p, a)), d2 = G.unit3(sub(b, p));
      const phi = Math.acos(Math.max(-1, Math.min(1, dot(d1, d2))));
      const R = radius[i] ?? 0;
      if (phi < 1e-4 || !R) {
        out.push(p);
        continue;
      }
      const t = Math.min(R * Math.tan(phi / 2), 0.48 * Math.min(len(sub(p, a)), len(sub(b, p))));
      const Rr = t / Math.tan(phi / 2);
      const A0 = sub(p, mul(d1, t)), C0 = add(p, mul(d2, t));
      const O = add(p, mul(G.unit3(sub(d2, d1)), Rr / Math.cos(phi / 2)));
      const va = sub(A0, O), vc = sub(C0, O);
      const steps = Math.max(4, Math.ceil((phi * 180) / Math.PI / 6));
      for (let j = 0; j <= steps; j++) {
        const f = j / steps;
        const w0 = Math.sin((1 - f) * phi) / Math.sin(phi), w1 = Math.sin(f * phi) / Math.sin(phi);
        out.push(add(O, add(mul(va, w0), mul(vc, w1))));
      }
    }
    out.push(pts[pts.length - 1]);
    return out;
  };
  const gapsOf = (route, hides) => {
    const gaps = [];
    let open = null;
    const step = 0.05;
    const total = G.pathLength(route);
    for (let at = 0; at <= total + 1e-9; at += step) {
      const p = G.pointAlong(route, Math.min(at, total));
      const hidden = hides.some((h) => h.test(p));
      if (hidden && open === null) open = Math.max(0, at - step - 0.04);
      if (!hidden && open !== null) {
        gaps.push([open, at + 0.04]);
        open = null;
      }
    }
    if (open !== null) gaps.push([open, total]);
    const merged = [];
    for (const [a, b] of gaps) {
      const last = merged[merged.length - 1];
      if (last && a - last[1] < 0.4) last[1] = b;
      else merged.push([a, b]);
    }
    if (merged.length && merged[0][0] < 0.4) merged[0][0] = 0;
    if (merged.length && total - merged[merged.length - 1][1] < 0.4) merged[merged.length - 1][1] = total;
    return merged.map(([a, b]) => [r3(Math.max(0, a)), b >= total ? total : r3(Math.min(total, b))]);
  };
  const fittings = [];
  const cable = (id, pts, radius, hides) => {
    const spec = CABLES.find((c) => c.id === id);
    const route = evenChords(bend(pts, radius), 0.8);
    const gaps = gapsOf(route, hides);
    if (process.env.TOKI_DEBUG) console.log(id, JSON.stringify(gaps), G.pathLength(route).toFixed(2));
    if (DROP.some((d) => id.startsWith(d))) return route;
    T.tube({ name: id, ...H, route, r: spec.r, chunk: 24, turn: 40, gaps, free: FREE_ENDS[id], touch: hides.filter((h) => h.name).map((h) => h.name), hue: spec.hue, tone: "hi", material: "rubber" });
    for (const [a, b] of gaps) fittings.push([id, a, b]);
    return route;
  };
  const R10 = (id) => 10 * CABLES.find((c) => c.id === id).r + 0.5;
  const rad = (id, ...at) => { const r = []; for (const i of at) r[i] = R10(id); return r; };

  // W1 battery bay (+ end plate) → charger B+ / B− header: one short straight run
  {
    const a = boxShell("W1", "shell.a", [26.5, -1.5, 36.5], [28, 1.5, 39.5]);
    const b = boxShell("W1", "shell.b", [30.5, -1.5, 36.5], [32, 1.5, 39.5]);
    cable("W1", [[26.5, 0, 38], [32, 0, 38]], [], [a, b]);
  }
  // W2 charger OUT+ → switch terminal: a short jumper
  {
    const a = boxShell("W2", "shell.a", [48, 0.5, 36.5], [48.6, 3.5, 39.5]);
    const b = boxShell("W2", "shell.b", [49.4, 0.5, 36.5], [50, 3.5, 39.5]);
    cable("W2", [[48, 2, 38], [50, 2, 38]], [], [a, b]);
  }
  // W3 switch terminal → hub power header (VBAT in): along +Y, then −X above W4
  {
    const a = boxShell("W3", "shell.a", [49.6, 6, 39], [51.6, 8, 42]);
    const b = boxShell("W3", "shell.b", [16, 23.5, 39], [18, 26.5, 42]);
    cable("W3", [[50.6, 6, 40.5], [50.6, 25, 40.5], [16, 25, 40.5]], rad("W3", 1), [a, b]);
  }
  // W4 charger OUT− → hub power header (return)
  {
    const a = boxShell("W4", "shell.a", [45, 5, 35], [48, 7, 38]);
    const b = boxShell("W4", "shell.b", [16, 23.5, 35], [18, 26.5, 38]);
    cable("W4", [[46.5, 5, 36.5], [46.5, 25, 36.5], [16, 25, 36.5]], rad("W4", 1), [a, b]);
  }
  // W5 hub → microphone: forward from the header, two 45° bends, onto the mic board's back
  {
    const z = 101.5;
    const a = boxShell("W5", "shell.a", [-23, 36, 100], [-18, 38.5, 103]);
    const mx = MIC.at[0], dx = -20.5 - mx, run = (yMicBack - 36 - dx) / 2; // two equal straight runs round a 45° diagonal
    const b = boxShell("W5", "shell.b", [mx - 2, yMicBack - 2.5, 99.5], [mx + 2, yMicBack, 103.5]);
    cable("W5", [[-20.5, 36, z], [-20.5, 36 + run, z], [mx, 36 + run + dx, z], [mx, yMicBack, z]], rad("W5", 1, 2), [a, b]);
  }
  // W6 amplifier terminal → speaker lug strip: one straight run along +Y
  {
    const a = boxShell("W6", "shell.a", [-9, 42.7, 81 + AMP_DZ], [-4.5, 45, 84.4 + AMP_DZ]);
    const b = boxShell("W6", "shell.b", [-9, yMagnet - 5.5, 81 + AMP_DZ], [-4.5, yMagnet - 3, 84.4 + AMP_DZ]);
    cable("W6", [[-6.75, 42.7, 82.7 + AMP_DZ], [-6.75, yMagnet - 3, 82.7 + AMP_DZ]], [], [a, b]);
  }
  // W7 / W8 hub → cheek LED boards: up from the header, turn inside the lid clip, across under the lid to the side wall
  for (const s of SIDES) {
    const id = s > 0 ? "W7" : "W8";
    const P = PIPE(s);
    const xLed = s * (PX0 - WT - 1.6);
    const a = boxShell(id, "shell.a", [s * 10 - 2.5, 35.5, 105], [s * 10 + 2.5, 39.2, 107.5]);
    const b = boxShell(id, "shell.b", s > 0 ? [xLed - 2.5, P.y - 2.5, P.z - 2.5] : [xLed, P.y - 2.5, P.z - 2.5], s > 0 ? [xLed, P.y + 2.5, P.z + 2.5] : [xLed + 2.5, P.y + 2.5, P.z + 2.5]);
    const y0 = 37.5, x1 = s * 30, xd = s * (30 + (P.y - y0));
    cable(id, [[s * 10, y0, 105], [s * 10, y0, P.z], [x1, y0, P.z], [xd, P.y, P.z], [xLed, P.y, P.z]], rad(id, 2, 3), [a, b, frameBox(`pod.clip.${sideName(s)}`)]);
  }

  // ======================= disassembly: the two covers open, the floor and the hub stay =======================
  // A slide group's origin is its parent's ([0, 0, 0] for the turntable), so parts keep their coordinates.
  const groups = Object.fromEntries(ASSEMBLIES.map((a) => [a.name, T.group(a.name, { parent: S.toki, slide: { direction: a.direction, travel: a.travel } })]));
  for (const part of T.parts) {
    const g = assemblyOf(part.route ?? part.name);
    if (g) part.group = groups[g];
  }
  for (const route of T.routes) {
    const g = assemblyOf(route.name);
    if (g) route.group = groups[g];
  }
  return { ...S, partsByComponent: owners, traces: {}, fittings, rocker: null, screen: null, crowd: [], turnCrowd: TURN_CROWD };
}

// A polyline of equal chords along the curve, so the kit's resample at that spacing reproduces it exactly
// (then gaps, chunks and the audit's runs all measure the same arc length).
function evenChords(curve, spacing) {
  const fine = G.resample(curve, 0.02);
  const march = (c) => {
    const out = [fine[0]];
    let cur = fine[0];
    let i = 1;
    for (;;) {
      while (i < fine.length && len(sub(fine[i], cur)) < c) i++;
      if (i >= fine.length) return { out, rest: len(sub(fine[fine.length - 1], cur)) };
      const a = fine[i - 1], b = fine[i];
      let lo = 0, hi = 1;
      for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (len(sub(add(a, mul(sub(b, a), m)), cur)) < c) lo = m; else hi = m; }
      cur = add(a, mul(sub(b, a), hi));
      out.push(cur);
    }
  };
  let c = spacing;
  for (let it = 0; it < 30; it++) {
    const { out, rest } = march(c);
    const n = out.length - 1;
    if (rest < 1e-6) return out;
    const target = (n * c + rest) / Math.max(1, Math.round((n * c + rest) / spacing));
    if (Math.abs(target - c) < 1e-9) { out.push(fine[fine.length - 1]); return out; }
    c = target;
  }
  const { out } = march(c);
  out[out.length - 1] = fine[fine.length - 1];
  return out;
}

// Crowding pairs looked at in 4× close-ups (toki/shots/): each is a cable end on its own shell, or a straight run,
// lining up on screen with a slender part far behind it at one angle.
const TURN_CROWD = [
  // cable ends inside the closed pod, behind its walls, lining up with a corner chord at one angle (quick run, 192° and 72°)
  ["W5", "pod.front.corner.L00"], ["W6", "pod.front.corner.L00"], ["W7", "pod.front.corner.L00"], ["W8", "pod.front.corner.L10"],
  ["W6", "pod.front.corner.R10"], ["W7", "pod.front.corner.R10"], ["W5", "W8"],
  // v3 (smaller pod, corner radius 8): the same kind, from the quick run. W7 × R00 is inside the closed pod (θ 117°).
  // The other three are at θ 246°, early in the close clip with the front cover still lifted: the cable ends hang on
  // their shells inside the cover and its far corner chord lines up behind them (shots/v3/crowd-close-4x.png).
  ["W7", "pod.front.corner.R00"], ["W6", "pod.front.corner.L10"], ["W8", "pod.front.corner.L00"], ["W5", "pod.front.corner.L10"],
];
