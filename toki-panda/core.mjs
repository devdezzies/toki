// Hardware scene (7): internal frame, 11 components, 9 cables. Every number from model.mjs or derived here once.
import { G } from "./kit.mjs";
import { scene, VERT, frameOf, circlePath, pathOf, roundRect } from "./scene.mjs";
import { FRAME, MIC, CABLES, ASSEMBLIES, FREE_ENDS, assemblyOf, unit, sub, add, mul, dot, len } from "./model.mjs";

const r3 = (x) => Math.round(x * 1000) / 1000;

export function buildCore() {
  const S = scene();
  const { T, H } = S;
  const owners = {}; // component id → part names
  const own = (id, part) => {
    (owners[id] ??= []).push(part.name);
    return part;
  };
  const boxes = []; // every box we place, for the cable hide test
  // An axis-aligned box as an upright prism.
  const DROP = (process.env.TOKI_DROP ?? "").split(",").filter(Boolean);
  const box = (name, [x0, y0, z0], [x1, y1, z1], opts = {}) => {
    if (DROP.some((d) => name.startsWith(d))) { boxes.push({ name, min: [x0, y0, z0], max: [x1, y1, z1] }); return { name, planes: [] }; }
    const r = Math.min(opts.r ?? 0, (x1 - x0) / 2 - 0.01, (y1 - y0) / 2 - 0.01);
    const part = T.prism({ name, ...H, plan: { x: x0, y: y0, w: x1 - x0, d: y1 - y0, r: Math.max(0, r) }, z: z0, h: z1 - z0, steps: 2, tone: opts.tone ?? "mid", crease: opts.crease ?? "faint", bevel: opts.bevel ?? 0, material: opts.material, owner: opts.owner, details: opts.details ?? {} });
    boxes.push({ name, min: [x0, y0, z0], max: [x1, y1, z1] });
    if (opts.id) own(opts.id, part);
    return part;
  };
  const plane = (part, o, u, v, svg, normal, fade) => T.plane({ part, o, u, v, svg, normal, ...(fade ? { fade } : {}) });
  const PY = [0, 1, 0], NY = [0, -1, 0], PX = [1, 0, 0], NX = [-1, 0, 0], PZ = [0, 0, 1], NZ = [0, 0, -1];
  const ALWAYS = [-2, -1.9];

  // ======================= 7.1 frame =======================
  const F = FRAME;
  const fz0 = F.floor.z0, fz1 = F.floor.z1;
  T.round({ name: "frame.floor", ...H, F: VERT(0, 0), s0: fz0, s1: fz1, r: F.floor.r, tone: "lo", crease: "faint", details: { bolts: [{ s: fz1, r: 46, count: 16, size: 0.42, tone: "mid", phase: 0.2 }] } });
  [[0, 30], [-26, -15], [26, -15]].forEach(([x, y], i) => T.round({ name: `frame.foot.${i}`, ...H, F: VERT(x, y), s0: 0, s1: fz0, r: F.floor.feet / 2, tone: "lo" }));
  const pw = F.posts.w / 2;
  for (const [x, y] of F.posts.at) box(`frame.post.${x > 0 ? "L" : "R"}${y > 0 ? "f" : "b"}`, [x - pw, y - pw, F.posts.z0], [x + pw, y + pw, F.posts.z1], { tone: "mid", details: { dots: [{ at: [F.posts.z1 - 3, x, y + (y > 0 ? pw : -pw)], normal: [0, Math.sign(y), 0], size: 0.4 }] } });
  const rz0 = F.roof.z0, rz1 = F.roof.z1;
  // the two long roof beams in three flush segments each (a 94 mm diagonal's screen box reaches parts it never covers)
  for (const [k, y0] of [["front", 14], ["rear", -18]]) for (const [j, x0, x1] of [["R", -47, -16], ["C", -16, 16], ["L", 16, 47]]) box(`frame.beam.${k}.${j}`, [x0, y0, rz0], [x1, y0 + 4, rz1], { tone: "mid", bevel: 0.4 });
  box("frame.beam.mid.b", [-2, -14, rz0], [2, -9, rz1], { tone: "mid" });
  box("frame.beam.mid.f", [-2, -3, rz0], [2, 14, rz1], { tone: "mid" });
  for (const [x, y] of F.uprights.at) {
    const s = Math.sign(x);
    // top 1 mm under the roof plane (DEVIATIONS: level with the rear beam's top it swapped order at one angle)
    const UT = F.uprights.z1 - 1;
    const up = box(`frame.upright.${s > 0 ? "L" : "R"}`, [x - pw, y - pw, F.uprights.z0], [x + pw, y + pw, UT], { tone: "mid" });
    // the groove that holds the board edge, on the inner face, top to bottom
    const hh = (UT - F.uprights.z0) / 2;
    plane(up, [x - s * pw, y, (F.uprights.z0 + UT) / 2], [0, 1, 0], NZ, `<path class="iso-line" data-tone="lo" d="M-0.8 ${-hh}L-0.8 ${hh}M0.8 ${-hh}L0.8 ${hh}"/>`, [-s, 0, 0]);
  }
  // rear panel x ±22, y −52 → −50, z 62 → 102, with openings for the switch and the USB-C shell
  const RP = F.rear;
  const panel = (name, x0, x1, z0, z1, extra = {}) => box(`frame.panel.${name}`, [x0, RP.y0, z0], [x1, RP.y1, z1], { tone: "mid", ...extra });
  panel("bottom", -RP.x, RP.x, RP.z0, 70.8, { details: { dots: [-16, 16].map((x) => ({ at: [66.4, x, RP.y0], normal: NY, size: 0.5 })), rings: [] } });
  panel("usb.R", -RP.x, -4.5, 70.8, 74);
  panel("usb.L", 4.5, RP.x, 70.8, 74);
  panel("mid", -RP.x, RP.x, 74, 86);
  panel("sw.R", -RP.x, -8.5, 86, 98);
  panel("sw.L", 8.5, RP.x, 86, 98);
  const pTop = panel("top", -RP.x, RP.x, 98, RP.z1);
  void pTop;
  // battery door: a seam on the bottom panel round the two screws
  // rails tie the rear panel to the roof (added: the panel needs a path to ground)
  box("frame.rail.L", [18, -52, RP.z1], [22, -14, rz0], { tone: "mid" });
  box("frame.rail.R", [-22, -52, RP.z1], [-18, -14, rz0], { tone: "mid" });
  // front: speaker grille (stands on two feet), bracket, bezel with window and clear lens
  const GR = F.grille;
  // the grille is five flush strips cut between its slots (engine limit: a vertical flat over ~1000 mm² pops in edge-on)
  const STRIPS = [GR.z0, 36.5, 51.5, GR.z1];
  for (let i = 0; i < STRIPS.length - 1; i++) {
    const z0 = STRIPS[i], z1 = STRIPS[i + 1];
    const strip = box(`frame.grille.${i}`, [-GR.x, GR.y0, z0], [GR.x, GR.y1, z1], { tone: "mid", bevel: 0.4 });
    const zm = (z0 + z1) / 2;
    const slots = Array.from({ length: GR.slots }, (_, j) => 29 + j * 5).filter((zc) => zc > z0 && zc < z1).map((zc) => pathOf(roundRect(30, 2.2, 1.1, 4).map(([x, y]) => [x, y + (zm - zc)]))).join("");
    if (slots) plane(strip, [0, GR.y1, zm], PX, NZ, `<path class="iso-line" data-tone="lo" d="${slots}"/>`, PY);
  }
  box("frame.grille.foot.L", [8, GR.y0, fz1], [12, GR.y1, GR.z0], { tone: "lo" });
  box("frame.grille.foot.R", [-12, GR.y0, fz1], [-8, GR.y1, GR.z0], { tone: "lo" });
  box("frame.bracket", [-F.bezel.x, GR.y0, GR.z1], [F.bezel.x, F.bezel.y1, F.bezel.z0], { tone: "mid", details: { dots: [-12, 12].map((x) => ({ at: [72.5, x, F.bezel.y1], normal: PY, size: 0.45 })) } });
  const BZ = F.bezel;
  const wx = BZ.window[0] / 2, wz0 = BZ.windowZ - BZ.window[1] / 2, wz1 = BZ.windowZ + BZ.window[1] / 2;
  box("frame.bezel.bottom", [-BZ.x, BZ.y0, BZ.z0], [BZ.x, BZ.y1, wz0], { tone: "mid" });
  box("frame.bezel.top", [-BZ.x, BZ.y0, wz1], [BZ.x, BZ.y1, BZ.z1], { tone: "mid" });
  box("frame.bezel.R", [-BZ.x, BZ.y0, wz0], [-wx, BZ.y1, wz1], { tone: "mid" });
  box("frame.bezel.L", [wx, BZ.y0, wz0], [BZ.x, BZ.y1, wz1], { tone: "mid" });
  box("frame.lens", [-wx, BZ.y0, wz0], [wx, BZ.y0 + BZ.lens, wz1], { tone: "hi", crease: "none" });
  // clips holding the speaker rim (top, left, right)
  box("frame.clip.sp.top", [-3, 44, 64], [3, GR.y0, 66], { tone: "lo" });
  box("frame.clip.sp.L", [20, 43, 41], [22, GR.y0, 47], { tone: "lo" });
  box("frame.clip.sp.R", [-22, 43, 41], [-20, GR.y0, 47], { tone: "lo" });
  // battery cradle: riser, end plates, inner spine, a pair of fingers (open, so the cell shows)
  const CR = F.cradle;
  const [cx, cy] = CR.centre;
  const c0 = [cx - 10.5, cy - 10.5], c1 = [cx + 10.5, cy + 10.5];
  const cz0 = CR.centre[2] - CR.size[2] / 2, cz1 = CR.centre[2] + CR.size[2] / 2; // 23.5 → 100.5
  box("frame.cradle.riser", [cx - 8, cy - 8, fz1], [cx + 8, cy + 8, cz0], { tone: "lo" });
  box("frame.cradle.base", [c0[0], c0[1], cz0], [c1[0], c1[1], cz0 + 3], { tone: "mid" });
  box("frame.cradle.cap", [c0[0], c0[1], cz1 - 3], [c1[0], c1[1], cz1], { tone: "mid" });
  box("frame.cradle.spine.a", [c0[0], c0[1], cz0 + 3], [c0[0] + 1, c1[1], 62], { tone: "mid" });
  box("frame.cradle.spine.b", [c0[0], c0[1], 62], [c0[0] + 1, c1[1], cz1 - 3], { tone: "mid" });
  const CELL_R = 9.15;
  for (const [i, zc] of [[0, 67]]) {
    box(`frame.cradle.finger.${i}b`, [c0[0] + 1, c0[1], zc - 3], [cx + 5, cy - CELL_R, zc + 3], { tone: "lo" });
    box(`frame.cradle.finger.${i}f`, [c0[0] + 1, cy + CELL_R, zc - 3], [cx + 5, c1[1], zc + 3], { tone: "lo" });
  }
  // neck spine on the roof's centre beam, three cable clips on its rear face, head plate
  const SP = F.spine;
  box("frame.spine", [-SP.w / 2, -SP.d / 2, SP.z0], [SP.w / 2, SP.d / 2, SP.z1], { tone: "mid" });
  const CLIPS = { c0: [[-12, -9.5, 117], [12, -3, 141]], c1: [[-6, -9.5, 146], [6, -3, 151]], c2: [[-12, -14, 160], [12, -3, 179]] };
  for (const [k, [a, b]] of Object.entries(CLIPS)) box(`frame.clip.${k}`, a, b, { tone: "lo", details: { dots: [{ at: [(a[2] + b[2]) / 2, a[0] + 1.6, a[1]], normal: NY, size: 0.4 }, { at: [(a[2] + b[2]) / 2, b[0] - 1.6, a[1]], normal: NY, size: 0.4 }] } });
  const HP = F.headPlate;
  T.prism({ name: "frame.headplate", ...H, plan: { x: -HP.w / 2, y: HP.centre[1] - HP.d / 2, w: HP.w, d: HP.d, r: 6 }, z: HP.centre[2] - HP.t / 2, h: HP.t, steps: 4, tone: "mid", bevel: 0.3, details: { dots: [[-23, -7], [23, -7], [-23, 23], [23, 23]].map(([x, y]) => ({ at: [181, x, y], normal: PZ, size: 0.45 })) } });
  boxes.push({ name: "frame.headplate", min: [-28, -12, 179], max: [28, 28, 181] });
  // the side clip block is two blocks, below and above the head plate's top face, so it never wraps the plate in depth
  box("frame.clip.side.a", [28, -10.5, 161], [36, 7, 181], { tone: "lo" });
  box("frame.clip.side.b", [28, -10.5, 181], [36, 7, 196], { tone: "lo" });
  // camera clips: two slotted blocks, each two jaws round the ESP32-CAM board's bottom edge
  for (const s of [1, -1]) {
    box(`frame.camclip.${s > 0 ? "L" : "R"}f`, [s > 0 ? 9 : -15, 7.35, 181], [s > 0 ? 15 : -9, 9.35, 186], { tone: "lo" });
    box(`frame.camclip.${s > 0 ? "L" : "R"}b`, [s > 0 ? 9 : -15, 3.75, 181], [s > 0 ? 15 : -9, 5.75, 186], { tone: "lo" });
  }
  // eye socket: arm from the head plate, a backing plate for the lens module
  box("frame.eyearm", [25, 22, 181], [31, 38.5, 190.15], { tone: "lo" });
  box("frame.socket", [23.95, 35.5, 190.15], [32.45, 38.5, 198.65], { tone: "mid" });
  // mic arm and seat
  box("frame.micarm", [-2, 20, 176], [2, 49.6, 179], { tone: "lo" });
  const MF = frameOf(MIC.at, MIC.normal, PX); // a = n, u = +X, v = n × u (down and back)
  T.round({ name: "frame.micseat", ...H, F: MF, s0: -3, s1: -1, r: 3.5, tone: "mid" });
  // clip blocks for the power cables (added: every vertical turn happens in a fitting)
  box("frame.clip.rear", [-9, -29, 86], [12.5, -20, 96], { tone: "lo" });
  box("frame.clip.board", [-5, -16, 64], [5, -6.8, 77], { tone: "lo" });
  box("frame.clip.board2", [-5, -16, 84], [5, -6.8, 97], { tone: "lo" });

  // ======================= 7.2 components =======================
  // 10 carrier board: perfboard in the uprights' grooves, hole grid both faces, traces on the front
  // The board is six flush pieces (engine limit: a vertical flat over ~1000 mm² pops in as it turns edge-on).
  // Holes sit on a 2.54 grid that never touches a cut; traces are clipped per piece and meet across the cuts.
  const BX = [-30, 0, 30], BZS = [30, 57.94, 83.34, 110];
  const SEGS = [
    { ends: "10 05 01 04 02", tone: "mid", a: [26, 33], b: [26, 106] }, // 5 V bus
    { ends: "10 05 01 04 02", tone: "mid", a: [26, 106], b: [-10, 106] },
    { ends: "01 03 09", tone: "lo", a: [-27, 101.5], b: [-27, 106.5] }, // 3.3 V bus
    { ends: "01 04", tone: "mid", a: [-16, 70.75], b: [-16, 65.5] }, // DAC → attenuator
    { ends: "01 04", tone: "mid", a: [-16, 64.2], b: [-16, 61] }, // attenuator → amplifier
  ];
  const BUS = { ends: "10", x0: -26, x1: 24, z0: 32.4, z1: 33.6 }; // ground bus bar
  const TERM = [[-26, 33], [24, 33], [-4, 33], [26, 33], [26, 106], [-10, 106], [-27, 101.5], [-27, 106.5], [-16, 70.75], [-16, 61]];
  const clipSeg = (sg, x0, x1, z0, z1) => {
    const [ax, az] = sg.a, [bx, bz] = sg.b;
    const lx = Math.max(Math.min(ax, bx), x0), hx = Math.min(Math.max(ax, bx), x1), lz = Math.max(Math.min(az, bz), z0), hz = Math.min(Math.max(az, bz), z1);
    if (lx > hx + 1e-9 || lz > hz + 1e-9) return null;
    if (ax === bx && (ax < x0 || ax > x1)) return null;
    if (az === bz && (az < z0 || az > z1)) return null;
    if (ax === bx && hz - lz < 1e-6) return null;
    if (az === bz && hx - lx < 1e-6) return null;
    return ax === bx ? [[ax, lz], [ax, hz]] : [[lx, az], [hx, az]];
  };
  for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) {
    const x0 = BX[i], x1 = BX[i + 1], z0 = BZS[j], z1 = BZS[j + 1];
    const cxp = (x0 + x1) / 2, czp = (z0 + z1) / 2;
    const piece = box(`c10.board.${i}${j}`, [x0, -6.8, z0], [x1, -5.2, z1], { id: "10", tone: "hi", crease: "lo" });
    const holes = [];
    for (let x = -26.035; x <= 28.6; x += 5.08) for (let z = 33.81; z <= 109; z += 5.08) if (x - 0.35 > x0 && x + 0.35 < x1 && z - 0.35 > z0 && z + 0.35 < z1) holes.push(`M${r3(x - cxp - 0.35)} ${r3(czp - z)}a.35 .35 0 1 0 .7 0a.35 .35 0 1 0 -.7 0`);
    const holeSvg = `<path class="tk-hole" d="${holes.join("")}"/>`;
    plane(piece, [cxp, -6.8, czp], NX, NZ, holeSvg.replace(/M(-?[d.]+) /g, (m, x) => `M${r3(-Number(x) - 0.7)} `), NY);
    const L = (p) => `${r3(p[0] - cxp)} ${r3(czp - p[1])}`;
    let tr = "";
    for (const sg of SEGS) {
      const c = clipSeg(sg, x0, x1, z0, z1);
      if (c) tr += `<path class="iso-line" data-tone="${sg.tone}" data-trace="${sg.ends}" d="M${L(c[0])}L${L(c[1])}"/>`;
    }
    const bx0 = Math.max(BUS.x0, x0), bx1 = Math.min(BUS.x1, x1);
    if (bx1 > bx0 && BUS.z0 >= z0 && BUS.z1 <= z1) tr += `<path class="tk-bus" data-trace="${BUS.ends}" d="M${L([bx0, BUS.z1])}L${L([bx1, BUS.z1])}L${L([bx1, BUS.z0])}L${L([bx0, BUS.z0])}Z"/>`;
    for (const [n, ax] of [["r1", -20], ["r2", -17.4], ["c1", -14.8]]) if (ax > x0 && ax + 2 < x1 && 64.2 > z0 && 65.5 < z1) tr += `<path class="tk-chip${n === "c1" ? " tk-chip-c" : ""}" data-att="" d="M${L([ax, 65.5])}L${L([ax + 2, 65.5])}L${L([ax + 2, 64.2])}L${L([ax, 64.2])}Z"/>`;
    const dots = TERM.filter(([x, z]) => x > x0 && x < x1 && z > z0 && z < z1);
    if (dots.length) tr += `<g class="iso-dots" data-tone="mid">${dots.map((p) => { const [u, w] = L(p).split(" "); return `<circle cx="${u}" cy="${w}" r=".6"/>`; }).join("")}</g>`;
    plane(piece, [cxp, -5.2, czp], PX, NZ, holeSvg + (tr ? `<g class="tk-traces">${tr}</g>` : ""), PY);
  }
  // headers on the top edge (five) and the bottom edge (one)
  const TOP = [["t.spare", -21, 3], ["t.w7", -8, 5], ["t.w6", 2.5, 2], ["t.w5", 9, 2], ["t.w8", 19, 4]];
  for (const [n, x, pins] of TOP) {
    const w = pins * 2.54 + 1;
    box(`c10.hdr.${n}`, [x - w / 2, -8.5, 110], [x + w / 2, -3.5, n === "t.w8" ? 118.5 : 113], { id: "10", tone: "lo", material: "gunmetal", details: { dots: Array.from({ length: pins }, (_, j) => ({ at: [113, x - ((pins - 1) * 2.54) / 2 + j * 2.54, -6], normal: PZ, size: 0.35, tone: "mid" })) } });
  }
  box("c10.hdr.b", [-4.5, -12, 30], [5.5, -6.8, 33], { id: "10", tone: "lo", material: "gunmetal" });
  // attenuator on the board between the ESP32 and the amplifier: two resistors and a capacitor

  // 01 ESP32 DevKit on the board's front face
  const E = { x0: -25.75, x1: 25.75, z0: 70.75, z1: 99.25 };
  for (const [n, z0] of [["hdr.b", 72.75], ["hdr.t", 94.75]]) box(`c01.${n}`, [-19.05, -5.2, z0 - 1.25], [19.05, 2.2, z0 + 1.25], { id: "01", tone: "lo", material: "gunmetal" });
  const esp0 = box("c01.pcb.R", [E.x0, 2.2, E.z0], [0, 3.8, E.z1], { id: "01", tone: "hi", crease: "lo", details: { dots: [[-23.6, 72.9], [-23.6, 97.1]].map(([x, z]) => ({ at: [z, x, 3.8], normal: PY, size: 0.5, tone: "mid" })) } });
  // two tact buttons drawn on the PCB face (each a square body with a round plunger)
  const espR = esp0;
  plane(espR, [-12.875, 3.8, 85], PX, NZ, [[-17.5, 76], [-17.5, 94]].map(([x, z]) => `<path class="tk-chip" d="M${r3(x + 12.875 - 2)} ${r3(85 - z - 2)}h4v4h-4Z"/><path class="iso-line" data-tone="mid" d="${circlePath(x + 12.875, 85 - z, 1.1, 16)}"/>`).join(""), PY);
  const esp = box("c01.pcb.L", [0, 2.2, E.z0], [E.x1, 3.8, E.z1], { id: "01", tone: "hi", crease: "lo", details: { dots: [[23.6, 72.9], [23.6, 97.1]].map(([x, z]) => ({ at: [z, x, 3.8], normal: PY, size: 0.5, tone: "mid" })) } });
  // antenna meander beyond the shield can, at +X
  const meander = [];
  for (let i = 0; i < 6; i++) meander.push(`${i ? "L" : "M"}${r3(-2 + (i % 2) * 4)} ${r3(-5 + i * 2)}L${r3(-2 + (i % 2) * 4)} ${r3(-5 + (i + 1) * 2)}`);
  // the meander leaves the shield can's edge (x 19.75) and ends on a via
  plane(esp, [22.75, 3.8, 85], PX, NZ, `<path class="iso-line tk-antenna" data-tone="mid" d="M-3 -6L1.6 -6L1.6 -3.6L-1.6 -3.6L-1.6 -1.2L1.6 -1.2L1.6 1.2L-1.6 1.2L-1.6 3.6L1.6 3.6L1.6 6"/><g class="iso-dots" data-tone="mid"><circle class="tk-antenna-dot" cx="1.6" cy="6" r=".55"/></g>`, PY);
  own("01", box("c01.shield", [1.75, 3.8, 77], [19.75, 6.8, 93], { tone: "mid", material: "steel", details: { dots: [] } }));
  box("c01.usb", [-26.75, 3.8, 81], [-20.75, 7.8, 89], { id: "01", tone: "mid", material: "steel" });
  box("c01.reg", [-13.5, 3.8, 74], [-7, 5.4, 77.5], { id: "01", tone: "lo", material: "gunmetal" });

  // 04 PAM8403 on the front face below the ESP32
  const amp = box("c04.pcb", [-25.5, -5.2, 43], [-4.5, -3.6, 61], { id: "04", tone: "hi", crease: "lo" });
  plane(amp, [-15, -3.6, 52], PX, NZ, `<g class="iso-dots" data-tone="mid">${[[-8.5, -7], [-6.5, -7], [-4.5, -7], [8.5, -7], [6.5, -7], [-8.5, 7], [-6.5, 7], [6.5, 7], [8.5, 7]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".55"/>`).join("")}</g><path class="iso-line" data-tone="faint" d="M-9.5 -8.2H-3.5V-5.8H-9.5ZM5.5 -8.2H9.5V-5.8H5.5ZM-9.5 5.8H-5.5V8.2H-9.5ZM5.5 5.8H9.5V8.2H5.5Z"/>${[[-22.5, 50], [-22.5, 54], [-8, 50], [-8, 54]].map(([x, z]) => `<path class="tk-chip tk-chip-c" d="M${r3(x + 15 - 1)} ${r3(52 - z - 0.6)}H${r3(x + 15 + 1)}V${r3(52 - z + 0.6)}H${r3(x + 15 - 1)}Z"/>`).join("")}`, PY);
  box("c04.term", [-10, -3.6, 43], [-6, -1.6, 46], { id: "04", tone: "lo", material: "gunmetal" });
  box("c04.chip", [-18.5, -3.6, 47.5], [-11.5, -2.1, 56.5], { id: "04", tone: "lo", material: "gunmetal", details: { dots: [] } });

  // 05 boost converter on the rear face, long side along Z
  const boost = box("c05.pcb", [-27.6, -8.4, 52], [-11, -6.8, 88], { id: "05", tone: "hi", crease: "lo", details: { dots: [[-26.5, 53.5], [-12.5, 53.5], [-26.5, 86.5], [-12.5, 86.5]].map(([x, z]) => ({ at: [z, x, -8.4], normal: NY, size: 0.6, tone: "mid" })) } });
  void boost;
  const capF = (x, z) => frameOf([x, -8.4, z], NY, PX);
  own("05", T.round({ name: "c05.cap.big", ...H, F: capF(-19.5, 57), s0: 0, s1: 12.4, r: 4.5, tone: "hi", crease: "lo", material: "steel", details: { seams: [1.4] } }));
  own("05", T.round({ name: "c05.cap.small", ...H, F: capF(-19.5, 80), s0: 0, s1: 6.6, r: 3, tone: "hi", crease: "lo", material: "steel" }));
  // SOT-23 chip and diode drawn on the PCB face
  plane(boost, [-19.5, -8.4, 70], NX, NZ, `<path class="tk-chip" d="M${r3(19.5 - 26.5 - 2.5)} ${r3(70 - 67)}h2.5v3h-2.5Z"/><path class="tk-chip" d="M${r3(-19.5 + 12.5)} ${r3(70 - 67)}h3.5v3h-3.5Z"/><path class="iso-line" data-tone="mid" d="M${r3(-19.5 + 13.2)} ${r3(70 - 67)}v3"/>`, NY);
  box("c05.inductor", [-23, -12.4, 68], [-16, -8.4, 75], { id: "05", tone: "mid", material: "gunmetal" });
  const pot = box("c05.pot", [-23, -12.4, 84], [-16, -8.4, 87.6], { id: "05", tone: "mid", material: "brass" });
  plane(pot, [-19.5, -12.4, 85.8], NX, NZ, `<path class="iso-line" data-tone="hi" d="${circlePath(0, 0, 1.3, 20)}"/><path class="iso-line" data-tone="hi" d="M-1.3 0L1.3 0"/>`, NY);

  // 06 battery: 18650 in the cradle, positive end up, spring at the negative end
  const CF = VERT(cx, cy);
  own("06", T.round({ name: "c06.spring", ...H, F: CF, s0: cz0 + 3, s1: 32.5, r: 5.5, tone: "mid", material: "steel", details: { seams: [27.4, 28.6, 29.8, 31.0] } }));
  const wrapAngle = (215 * Math.PI) / 180;
  own("06", T.round({ name: "c06.cell", ...H, F: CF, s0: 32.5, s1: 96.5, r: CELL_R, tone: "hi", crease: "lo", details: { seams: [34.2, 94.8], rules: [{ points: [[34.2, CELL_R * Math.cos(wrapAngle), CELL_R * Math.sin(wrapAngle)], [94.8, CELL_R * Math.cos(wrapAngle), CELL_R * Math.sin(wrapAngle)]], normal: [Math.cos(wrapAngle), Math.sin(wrapAngle), 0], tone: "lo" }] } }));
  own("06", T.round({ name: "c06.ring", ...H, F: CF, s0: 96.5, s1: 97, r: 7, tone: "mid", material: "gunmetal" }));
  own("06", T.round({ name: "c06.cap", ...H, F: CF, s0: 97, s1: 97.5, r: 4, tone: "hi", material: "steel" }));
  box("c06.conn", [11.5, -26, 69.8], [12.5, -20.5, 74.8], { id: "06", tone: "lo", material: "gunmetal" });

  // 08 TP4056 charger, flat, USB-C through the rear panel
  // the PCB is two pieces (under the USB shell, and the rest) so it never sits both in front of and behind the cradle
  box("c08.pcb.a", [-8.5, -50, 70], [8.5, -44, 70.8], { id: "08", tone: "hi", crease: "lo" });
  const tp = box("c08.pcb", [-8.5, -44, 70], [8.5, -22, 70.8], { id: "08", tone: "hi", crease: "lo" });
  plane(tp, [0, -33, 70.8], PX, PY, `<path class="iso-line" data-tone="faint" d="M-7.5 6H-4.5V9H-7.5ZM-3.5 6H-0.5V9H-3.5ZM2.5 6H6.5V9H2.5Z"/><path class="tk-led" d="M-6.5 -10H-4.5V-8.8H-6.5ZM4.5 -10H6.5V-8.8H4.5Z"/><path class="tk-chip" d="M-6.5 3H-3.5V6H-6.5ZM3.5 3H6.5V6H3.5Z"/>`, PZ, ALWAYS);
  const usb = box("c08.usb", [-4.5, -52, 70.8], [4.5, -45, 74], { id: "08", tone: "mid", material: "steel", r: 1.2 });
  plane(usb, [0, -52, 72.4], NX, NZ, `<path class="tk-port-mouth" d="${pathOf(roundRect(7.6, 2.2, 1.1, 5))}"/><path class="iso-line" data-tone="mid" d="M-2.6 0H2.6"/>`, NY);
  box("c08.hdr", [-8, -24.5, 70.8], [8, -22, 73.8], { id: "08", tone: "lo", material: "gunmetal", details: { dots: [-6, -3, 3, 6].map((x) => ({ at: [73.8, x, -23.25], normal: PZ, size: 0.4, tone: "mid" })) } });
  box("c08.chip", [-3, -38, 70.8], [3, -33, 72.3], { id: "08", tone: "lo", material: "gunmetal" });

  // 11 switch in the rear panel (bezel fills the opening, rocker 2 proud)
  box("c11.bezel", [-8.5, -52, 86], [8.5, -50, 98], { id: "11", tone: "lo", material: "gunmetal" });
  const rocker = box("c11.rocker", [-7.5, -54, 87], [7.5, -52, 97], { id: "11", tone: "mid", material: "gunmetal" });
  plane(rocker, [0, -54, 92], NX, NZ, `<g class="tk-rocker-marks"><path class="iso-line" data-tone="hi" d="M0 -4.4V4.4"/><path class="iso-line" data-tone="hi" data-mark="I" d="M-3.75 -1.8V1.8"/><path class="iso-line" data-tone="hi" data-mark="O" d="${circlePath(3.75, 0, 1.8, 20)}"/></g>`, NY);
  box("c11.body", [-7.5, -50, 87], [7.5, -41, 97], { id: "11", tone: "lo", material: "gunmetal" });
  box("c11.blade.R", [-3.8, -41, 89], [-2.2, -37, 95], { id: "11", tone: "mid", material: "brass", r: 0.1 });
  box("c11.blade.L", [2.2, -41, 89], [3.8, -37, 95], { id: "11", tone: "mid", material: "brass", r: 0.1 });

  // 07 speaker, axis +Y, rim on the grille
  const SPF = (y) => frameOf([0, y, 44], PY, PX);
  own("07", T.round({ name: "c07.magnet", ...H, F: SPF(26), s0: 0, s1: 8, r: 11, tone: "mid", material: "steel", details: { seams: [2.5] } }));
  own("07", T.round({ name: "c07.basket", ...H, F: SPF(34), s0: 0, s1: 10, r: 15, tone: "mid", material: "gunmetal", details: { seams: [5] } }));
  // the Ø40 rim as two half-discs (engine limit: a Ø40 flat pops in edge-on)
  for (const [k, a0] of [["a", 0], ["b", Math.PI]]) {
    const poly = Array.from({ length: 17 }, (_, j) => { const t = a0 + (j / 16) * Math.PI; return [20 * Math.cos(t), 20 * Math.sin(t)]; });
    own("07", T.prism({ name: `c07.rim.${k}`, ...H, F: { o: [0, 44, 44], a: PY, u: PX, v: PZ }, polygon: poly, s0: 0, s1: 2, tone: "mid", crease: "lo", material: "gunmetal", details: { dots: [Math.PI / 4, (3 * Math.PI) / 4].map((t) => ({ at: [0, 18.6 * Math.cos(a0 + t), 18.6 * Math.sin(a0 + t)], normal: NY, size: 0.45, tone: "mid" })) } }));
  }
  box("c07.strip", [-5, 23, 43], [5, 26, 46], { id: "07", tone: "lo", details: { dots: [-3.5, 3.5].map((x) => ({ at: [44.5, x, 23], normal: NY, size: 0.5, tone: "hi" })) } });

  // 09 OLED module: PCB, glass with black border, folded flex tail, 4-pin header
  const oledPcb = box("c09.pcb", [-13.65, 44, 81.1], [13.65, 45.6, 108.9], { id: "09", tone: "hi", crease: "lo" });
  plane(oledPcb, [0, 44, 95], NX, NZ, `<path class="iso-line" data-tone="lo" d="${[[-11.65, -11.9], [11.65, -11.9], [-11.65, 11.9], [11.65, 11.9]].map(([x, y]) => circlePath(x, y, 1, 16)).join("")}"/>`, NY);
  const glass = box("c09.glass", [-13, 45.6, 87.5], [13, 48, 103], { id: "09", tone: "lo", material: "gunmetal", r: 0.2 });
  S.screenPlane = plane(glass, [0, 48, 95], PX, NZ, `<path class="tk-glass" d="${pathOf(roundRect(25.6, 15.1, 0.6, 3))}"/><path class="tk-screen-bg" d="M-10.85 -5.45H10.85V5.45H-10.85Z"/>${SCREEN}`, PY);
  box("c09.tail", [-6, 43.7, 84], [6, 44, 92], { id: "09", tone: "mid", material: "copper", r: 0.1 });
  box("c09.hdr", [-5, 43.6, 108.9], [5, 46, 118], { id: "09", tone: "lo", material: "gunmetal" });

  // 02 ESP32-CAM upright on the head plate, lens module behind the left eye, flex between
  for (const [k, x0, x1] of [["R", -20.25, 0], ["L", 0, 20.25]]) {
    const half = box(`c02.pcb.${k}`, [x0, 5.75, 181], [x1, 7.35, 208], { id: "02", tone: "hi", crease: "lo" });
    const xs = Array.from({ length: 8 }, (_, j) => -17.78 + j * 5.08).filter((x) => x > x0 && x < x1);
    plane(half, [(x0 + x1) / 2, 7.35, 194.5], PX, NZ, `<g class="iso-dots" data-tone="mid">${xs.map((x) => `<circle cx="${r3(x - (x0 + x1) / 2)}" cy="12" r=".5"/>`).join("")}</g>`, PY);
  }
  box("c02.shield", [-16, 3.75, 190], [2, 5.75, 206], { id: "02", tone: "mid", material: "steel" });
  box("c02.sd", [-8, 7.35, 186.5], [6, 8.25, 199.5], { id: "02", tone: "mid", material: "steel" });
  box("c02.hdr", [11, 2.75, 186], [15, 5.75, 194], { id: "02", tone: "lo", material: "gunmetal" });
  box("c02.fpc", [12, 7.35, 203], [20, 8.25, 208], { id: "02", tone: "lo", material: "gunmetal" });
  box("c02.lens.body", [23.95, 38.5, 190.15], [32.45, 42.5, 198.65], { id: "02", tone: "lo", material: "gunmetal" });
  own("02", T.round({ name: "c02.lens.barrel", ...H, F: frameOf([28.2, 42.5, 194.4], PY, PX), s0: 0, s1: 2, r: 3.5, tone: "mid", material: "chrome", details: { rings: [{ at: [2, 0, 0], normal: PY, r: 2.1, tone: "hi" }] } }));
  // the flex: one diagonal strip over the board's top edge, one fold, one strip down to the lens module
  const fA = [16, 7.8, 208], fB = [28.2, 40.5, 208];
  const fd = G.unit3(sub(fB, fA));
  const fl = len(sub(fB, fA));
  const FX = { o: fA, a: fd, u: [-fd[1], fd[0], 0], v: PZ };
  own("02", T.prism({ name: "c02.flex.a", ...H, F: FX, polygon: [[-4, 0], [4, 0], [4, 0.3], [-4, 0.3]], s0: 0, s1: fl, tone: "mid", material: "copper", crease: "none" }));
  own("02", T.prism({ name: "c02.flex.b", ...H, F: { o: [0, 0, 0], a: PZ, u: PX, v: PY }, polygon: [[-4, 0], [4, 0], [4, 0.3], [-4, 0.3]].map(([u, w]) => { const p = add(add(fB, mul(FX.u, u)), mul(fd, w)); return [p[0], p[1]]; }), s0: 198.65, s1: 208.3, tone: "mid", material: "copper", crease: "none" }));

  // 03 microphone: round board facing forward and 30° down, can, port, six pads
  const micBoard = own("03", T.round({ name: "c03.board", ...H, F: MF, s0: -1, s1: 1, r: 7, tone: "hi", crease: "lo", details: { dots: Array.from({ length: 6 }, (_, j) => { const a = (j / 6) * 2 * Math.PI + Math.PI / 6; return { at: [1, 5.6 * Math.cos(a), 5.6 * Math.sin(a)], normal: MIC.normal, size: 0.5, tone: "mid" }; }), rings: [{ at: [1, 0, -3.2], normal: MIC.normal, r: 0.5, tone: "hi" }] } }));
  void micBoard;
  own("03", T.prism({ name: "c03.can", ...H, F: MF, polygon: [[-2, -1.5], [2, -1.5], [2, 1.5], [-2, 1.5]], s0: 1, s1: 2, tone: "mid", material: "steel", crease: "lo" }));

  // ======================= 7.3 cables =======================
  const hideOf = []; // [{ test(p) }] per cable
  const inBox = (b, p, e = 1e-6) => p.every((x, i) => x >= b.min[i] - e && x <= b.max[i] + e);
  const boxShell = (cable, name, min, max, id = null) => {
    const part = box(`${cable}.${name}`, min, max, { tone: "lo", material: "gunmetal", owner: cable });
    void id;
    return { part, test: (p) => inBox({ min, max }, p) };
  };
  const frameBox = (name) => {
    const b = boxes.find((x) => x.name === name);
    return { name, test: (p) => inBox(b, p) };
  };
  // the mic shell, a prism in the mic frame on the board's back face
  const micShellPoly = [[-2.5, 4], [2.5, 4], [2.5, 7], [-2.5, 7]];
  T.prism({ name: "W7.shell.b", ...H, F: MF, polygon: micShellPoly, s0: -3.5, s1: -1, tone: "lo", material: "gunmetal", owner: "W7" });
  const toMic = (p) => { const q = sub(p, MF.o); return [dot(q, MF.a), dot(q, MF.u), dot(q, MF.v)]; };
  const micShell = { test: (p) => { const [s, u, v] = toMic(p); return s >= -3.5 - 0.8 && s <= -1 + 1e-6 && u >= -2.5 && u <= 2.5 && v >= 4 && v <= 7; } };

  // a polyline with a bend radius per corner (null: a sharp turn hidden inside a fitting)
  const bend = (pts, radius) => {
    const out = [pts[0]];
    for (let i = 1; i < pts.length - 1; i++) {
      const a = pts[i - 1], p = pts[i], b = pts[i + 1];
      const d1 = G.unit3(sub(p, a)), d2 = G.unit3(sub(b, p));
      const c = Math.max(-1, Math.min(1, dot(d1, d2)));
      const phi = Math.acos(c);
      const R = radius[i] ?? 1.5;
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
    let walked = 0;
    let open = null;
    const step = 0.05;
    const total = G.pathLength(route);
    for (let at = 0; at <= total + 1e-9; at += step) {
      const p = G.pointAlong(route, Math.min(at, total));
      const hidden = hides.some((h) => h.test(p, h.pad ?? 0));
      if (hidden && open === null) open = Math.max(0, at - step - 0.04);
      if (!hidden && open !== null) {
        gaps.push([open, at + 0.04]);
        open = null;
      }
      walked = at;
    }
    if (open !== null) gaps.push([open, total]);
    void walked;
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
    if (process.env.TOKI_DEBUG) console.log(id, JSON.stringify(gaps), G.pathLength(G.resample(route, 0.8)).toFixed(2));
    T.tube({ name: id, ...H, route, r: spec.r, chunk: 24, turn: 40, gaps, free: FREE_ENDS[id], touch: hides.filter((h) => h.name).map((h) => h.name), hue: spec.hue, tone: "hi", material: "rubber" });
    for (const [a, b] of gaps) fittings.push([id, a, b]);
    return route;
  };
  const R10 = (id) => 10 * CABLES.find((c) => c.id === id).r + 0.5;

  // W1 battery cradle connector ← TP4056 pad header: one straight run
  {
    const a = boxShell("W1", "shell.a", [8, -24.5, 70.8], [9, -22, 73.8]);
    const b = boxShell("W1", "shell.b", [10.5, -24.5, 70.8], [11.5, -22, 73.8]);
    cable("W1", [[8, -23.25, 72.3], [11.5, -23.25, 72.3]], [], [a, b]);
  }
  // W2 TP4056 OUT+ → switch blade (−3): rises from the pad header, turns in the rear clip block
  {
    const a = boxShell("W2", "shell.a", [-4.5, -24.5, 73.8], [-1.5, -22, 76.8]);
    const b = boxShell("W2", "shell.b", [-5, -37, 90], [-1, -33, 94]);
    cable("W2", [[-3, -23.25, 73.8], [-3, -23.25, 92], [-3, -37, 92]], [], [a, b, frameBox("frame.clip.rear")]);
  }
  // W3 switch blade (+3) → carrier board bottom connector: through the rear clip, down the board's back
  {
    const a = boxShell("W3", "shell.a", [1, -37, 90], [5, -33, 94]);
    const b = boxShell("W3", "shell.b", [1.5, -11.5, 33], [4.5, -8.5, 36]);
    cable("W3", [[3, -37, 92], [3, -10, 92], [3, -10, 33]], [], [a, b, frameBox("frame.clip.rear"), frameBox("frame.clip.board2"), frameBox("frame.clip.board")]);
  }
  // W4 TP4056 OUT− → carrier board bottom connector
  {
    const a = boxShell("W4", "shell.a", [-3.5, -22, 70.8], [-0.5, -20, 73.8]);
    const b = boxShell("W4", "shell.b", [-3.5, -11.5, 33], [-0.5, -8.5, 36]);
    cable("W4", [[-2, -22, 72.3], [-2, -10, 72.3], [-2, -10, 33]], [], [a, b, frameBox("frame.clip.board")]);
  }
  // W5, W6, W7 rise behind the neck spine through its clips and turn in the clip block under the head plate
  const spineHides = ["frame.clip.c0", "frame.clip.c1", "frame.clip.c2"].map(frameBox);
  {
    const a = boxShell("W7", "shell.a", [-14.5, -8.5, 113], [-1.5, -3.5, 117]);
    const rad = [];
    rad[7] = R10("W7");
    rad[8] = R10("W7");
    const route = [[-8, -6, 113], [-8, -6, 125.5], [-3, -6, 132.5], [-3, -6, 170.86], [-7.5, -10.8, 170.86], [-7.5, -3, 170.86], [-7.5, -3, 170.86], [-7.5, 22, 170.86], [0, 34, 170.86], [0, 46.06, 170.86], toMicWorld(MF, -2.6, 0, 5.5), toMicWorld(MF, -1, 0, 5.5)];
    route.splice(6, 1);
    const r2 = [];
    r2[6] = R10("W7");
    r2[7] = R10("W7");
    cable("W7", route, r2, [a, micShell, ...spineHides]);
  }
  const side = { name: "frame.clip.side.a", test: (p) => p[0] >= 28 - 1e-6 && p[0] <= 36 && p[1] >= -10.5 && p[1] <= 7 && p[2] >= 161 && p[2] <= 196 };
  const sideB = { name: "frame.clip.side.b", test: () => false };
  {
    const a = boxShell("W6", "shell.a", [-0.3, -8.5, 113], [5.3, -3.5, 117]);
    const b = boxShell("W6", "shell.b", [15, 2.75, 186.3], [18, 5.75, 189.7]);
    cable("W6", [[2.5, -6, 113], [2.5, -6, 125], [0, -6, 131], [0, -6, 166], [4, -6, 166], [7, -9, 166], [34, -9, 166], [34, 4.25, 188], [15, 4.25, 188]], [], [a, b, side, sideB, ...spineHides]);
  }
  {
    const a = boxShell("W5", "shell.a", [6, -8.5, 113], [12, -3.5, 117]);
    const b = boxShell("W5", "shell.b", [15, 2.75, 190.1], [18, 5.75, 193.5]);
    cable("W5", [[9, -6, 113], [9, -6, 125], [3, -6, 131], [3, -6, 175.5], [34, -6, 175.5], [34, 4.25, 191.8], [15, 4.25, 191.8]], [], [a, b, side, sideB, ...spineHides]);
  }
  // W8 carrier board → OLED header: one horizontal run over the roof, header face to header face
  {
    const a = boxShell("W8", "shell.a", [14, -3.5, 113.5], [24, -0.5, 117.5]);
    const b = boxShell("W8", "shell.b", [-5, 40.6, 113.5], [5, 43.6, 117.5]);
    const rad = [];
    rad[1] = R10("W8");
    rad[2] = R10("W8");
    cable("W8", [[19, -3.5, 115.5], [19, 14, 115.5], [0, 30, 115.5], [0, 43.6, 115.5]], rad, [a, b]);
  }
  // W9 PAM8403 terminal → speaker lugs on the magnet's back
  {
    const a = boxShell("W9", "shell.a", [-10, -1.6, 43], [-6, 1.4, 46]);
    const b = boxShell("W9", "shell.b", [-4, 20, 43], [4, 23, 46]);
    const rad = [];
    rad[1] = R10("W9");
    rad[2] = R10("W9");
    cable("W9", [[-8, -1.6, 44.5], [-8, 6, 44.5], [0, 14, 44.5], [0, 23, 44.5]], rad, [a, b]);
  }

  // component ownership of cable shells stays with the cable (cableOf in live.js)
  for (const c of CABLES) void c;
  // ======================= disassembly: four assemblies slide out, the core stays =======================
  // A slide group's origin is its parent's ([0, 0, 0] for the turntable), so parts keep their coordinates
  // when they are moved into their assembly's group.
  const groups = Object.fromEntries(ASSEMBLIES.map((a) => [a.name, T.group(a.name, { parent: S.toki, slide: { direction: a.direction, travel: a.travel } })]));
  for (const part of T.parts) {
    const g = assemblyOf(part.route ?? part.name);
    if (g) part.group = groups[g];
  }
  for (const route of T.routes) {
    const g = assemblyOf(route.name);
    if (g) route.group = groups[g];
  }
  const rockerFace = [[-7.5, -54, 97], [7.5, -54, 97], [7.5, -54, 87], [-7.5, -54, 87]];
  return { ...S, partsByComponent: owners, traces: {}, fittings, rocker: { corners: rockerFace, n: NY }, screen: SCREEN, crowd: [], turnCrowd: TURN_CROWD };
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

function toMicWorld(MF, s, u, v) {
  return add(add(add(MF.o, mul(MF.a, s)), mul(MF.u, u)), mul(MF.v, v));
}

// The OLED picture, in mm on the glass: x right, y down, centred on the active area (21.7 × 10.9).
export const SCREEN =
  `<g class="tk-face">` +
  `<path class="tk-px tk-eye-l" d="M-8.4 -0.9Q-6.75 -3.5 -5.1 -0.9"/>` +
  `<path class="tk-px tk-eye-r" d="M-1.9 -0.9Q-0.25 -3.5 1.4 -0.9"/>` +
  `<path class="tk-px tk-smile" d="M-6.4 1.6Q-3.5 4.3 -0.6 1.6"/>` +
  `<path class="tk-px tk-batt" d="M5.6 -4.3H9.1V-1.9H5.6ZM9.1 -3.5H9.7V-2.7H9.1Z"/>` +
  `<path class="tk-pxf tk-batt" d="M6.05 -3.85H7.05V-2.35H6.05ZM7.35 -3.85H8.35V-2.35H7.35Z"/>` +
  `<circle class="tk-pxf" cx="6.6" cy="3.4" r=".6"/><circle class="tk-pxf" cx="8.7" cy="3.4" r=".6"/>` +
  `</g>`;

// Crowding pairs looked at in 4× close-ups (toki/shots/z-*.png): each is a cable end on its own connector shell,
// or a straight run, that lines up on screen with a slender part far behind it at one angle. They read as separate parts.
const TURN_CROWD = [
  ["W9", "frame.post.Lf"], ["W8", "c01.hdr.t"], ["W5", "c02.sd"], ["W3", "c06.cell"], ["W3", "frame.panel.bottom"],
  ["W7", "frame.spine"], ["W1", "c06.cell"], ["W7", "c01.hdr.t"], ["W8", "frame.upright.L"],
  // with the free (disassembly) ends, looked at in toki/shots/cr*.png
  ["W9", "frame.upright.R"], ["W9", "frame.upright.L"], ["W6", "frame.spine"], ["W5", "frame.spine"], ["W8", "frame.upright.R"], ["W3", "frame.rail.L"], ["W1", "W3"],
  // from the full run (toki/shots/cr-w6.png, cr-w9.png): ends on their own shells lining up with posts and panels at one angle
  ["W8", "frame.post.Rf"], ["W9", "frame.post.Rf"], ["W6", "W7"], ["W5", "W7"], ["W8", "frame.spine"], ["W8", "frame.post.Lf"], ["W8", "frame.post.Lb"], ["W8", "frame.post.Rb"],
  ["W3", "frame.panel.top"], ["W4", "frame.panel.bottom"], ["W2", "frame.rail.R"], ["W2", "frame.panel.top"],
];
