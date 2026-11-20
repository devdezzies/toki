// Static base (8.1): kit art in layer "back", every part named stand.*.
import { k, A } from "./kit.mjs";
import { BASE, AZIMUTH } from "./model.mjs";

const D2R = Math.PI / 180;

export function base(R, P) {
  const at = (p) => k.iso(p, P);
  const S = (paths, style) => k.solidSvg(paths, style);
  const L = (d, style) => k.lineSvg(d, style);
  const Dt = (points, style) => k.dotsSvg(points, style);
  const byDepth = (points) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
  const put = (item) => R.put({ layer: "back", ...item, shapes: item.shapes.map((shape, index) => R.solid(Object.assign(shape, { name: shape.name ?? (index ? `${item.name}#${index + 1}` : item.name) }))) });

  const half = BASE.plate / 2;
  const PLATE = { x: -half, y: -half, w: BASE.plate, d: BASE.plate, r: 10 };
  const top = BASE.plateTop;
  const z0 = top - BASE.plateH;
  const FOOT_H = 6;
  const halo = `<path class="iso-halo" d="${k.haloOf(PLATE, z0 - FOOT_H, BASE.plateH + FOOT_H, P)}"/>`;

  // feet
  for (const [x, y] of byDepth(k.corners(PLATE, 26))) {
    const svg = S(k.cylinder(x, y, 9, z0 - FOOT_H, 1.6, P, 32), { tone: "lo" }) + S(k.cylinder(x, y, 7, z0 - FOOT_H + 1.6, FOOT_H - 1.6, P, 32), { tone: "mid", crease: "none" });
    put({ name: `stand.foot.${x > 0 ? "p" : "n"}${y > 0 ? "p" : "n"}`, at: [x, y, z0 - FOOT_H], svg, shapes: [A.cylinder(x, y, 9, z0 - FOOT_H, 1.6, { ground: true }), A.cylinder(x, y, 7, z0 - FOOT_H + 1.6, FOOT_H - 1.6)] });
  }

  // plate: slab, groove, corner screws with rings
  const screws = k.corners(PLATE, 12);
  const plateSvg =
    S(k.slabOf(PLATE, z0, BASE.plateH, P, 8, 1.4), { tone: "lo", inner: L(k.sideSeam(PLATE, z0 + 2.4, P, 8), { tone: "faint" }) }) +
    L(k.planOutline(k.insetPlan(PLATE, BASE.groove), top, P, 8), { tone: "faint" }) +
    L(screws.map(([x, y]) => k.ring(x, y, 3.2, top, P, 18)).join(""), { tone: "lo" }) +
    Dt(screws.map(([x, y]) => at([x, y, top])), { size: 0.55 });
  put({ name: "stand.plate", at: [0, 0, z0], bias: 2, svg: plateSvg, shapes: [A.slab(PLATE, z0, BASE.plateH, { ground: true })] });

  // label plate with three rule lines, two screws (front-left edge, clear of the housing)
  const LABEL = BASE.label;
  const lz = top + 0.8;
  const rules = [[LABEL.x + 6, LABEL.x + 50], [LABEL.x + 6, LABEL.x + 40], [LABEL.x + 6, LABEL.x + 28]].map(([a, b], i) => k.lineOnTop([a, LABEL.y + 4 + i * 3.4], [b, LABEL.y + 4 + i * 3.4], lz, P)).join("");
  const labelScrews = [[LABEL.x + LABEL.w - 5, LABEL.y + 4], [LABEL.x + LABEL.w - 5, LABEL.y + LABEL.d - 4]];
  const labelSvg =
    S(k.slabOf(LABEL, top, 0.8, P, 3), { tone: "mid", crease: "none" }) +
    L(k.planOutline(k.insetPlan(LABEL, 1.6), lz, P, 3), { tone: "faint" }) +
    L(rules, { tone: "lo", free: true }) +
    Dt(labelScrews.map(([x, y]) => at([x, y, lz])), { size: 0.45 });
  put({ name: "stand.label", at: [LABEL.x + LABEL.w / 2, LABEL.y + LABEL.d / 2, top], bias: 3, svg: labelSvg, shapes: [A.slab(LABEL, top, 0.8)] });

  // turntable housing Ø220 × 14, top at −6, with the engraved degree ring (r 102 → 108)
  const H = BASE.housingR;
  const hz = BASE.housingTop;
  const [r0, r1] = BASE.ring;
  const ticks = { minor: [], major: [], cardinal: [] };
  for (let d = 0; d < 360; d += 5) {
    const w = (AZIMUTH + d) * D2R; // θ = d sits where the platter's front mark points at θ = d
    const c = Math.cos(w), s = Math.sin(w);
    const inner = d % 90 === 0 ? r0 : d % 15 === 0 ? r0 + 2.4 : r1 - 2.6;
    const list = d % 90 === 0 ? ticks.cardinal : d % 15 === 0 ? ticks.major : ticks.minor;
    list.push(k.lineOnTop([c * r1, s * r1], [c * inner, s * inner], hz, P));
  }
  const ring = (r, steps = 180) => k.ring(0, 0, r, hz, P, steps);
  const housingSvg =
    S(k.cylinder(0, 0, H, top, BASE.housingH, P, 96, 0.8), { tone: "mid", crease: "lo", inner: L(k.sideArc(0, 0, H, top + 4, P, 96), { tone: "faint" }) }) +
    L(ring(r1) + ring(r0), { tone: "lo" }) +
    L(ticks.minor.join(""), { tone: "lo" }) +
    L(ticks.major.join(""), { tone: "mid" }) +
    L(ticks.cardinal.join(""), { tone: "hi" }) +
    Dt([0, 90, 180, 270].map((d) => at([Math.cos((AZIMUTH + d) * D2R) * (r1 + 0.9), Math.sin((AZIMUTH + d) * D2R) * (r1 + 0.9), hz])), { size: 0.6, tone: "hi" });
  put({ name: "stand.housing", at: [0, 0, top], bias: 4, svg: housingSvg, shapes: [A.cylinder(0, 0, H, top, BASE.housingH)] });

  // fixed index pointer on the viewer's side of the housing, pointing at the ring's 0
  const w = AZIMUTH * D2R;
  const c = Math.cos(w), s = Math.sin(w);
  const wedge = [[H + 1.5, -1.0], [H + 1.5, 1.0], [H + 11, 3.6], [H + 11, -3.6]].map(([r, t]) => [c * r - s * t, s * r + c * t]);
  const indexSvg = S(k.extrude(wedge, top, 4, P, { bevel: 0.35 }), { tone: "hi", crease: "lo" }) + Dt([at([c * (H + 8), s * (H + 8), top + 4])], { size: 0.5 });
  put({ name: "stand.index", at: [c * (H + 6), s * (H + 6), top], bias: 5, svg: indexSvg, shapes: [A.extruded(wedge, top, 4)] });

  return { halo, plate: PLATE };
}
