// Skin scene (5): the fourteen solids of Appendix A, then the surface features of 5.3.
import { G } from "./kit.mjs";
import { scene, VERT, frameOf, basisAt, circlePath, pathOf, roundRect, f3 } from "./scene.mjs";
import { HEAD, TORSO, NECK, NM, MUZZLE, MUZZLE_FLAT, HEAD_MUZZLE_FLAT, earAt, eyeFlat, SHOULDER, SHOULDER_BOTTOM, ARM, LEG, TORSO_LOWER, SIDES, FEATURES, cut, sub, len, unit, add, mul, dot } from "./model.mjs";

export function buildSkin() {
  const S = scene();
  const { T, H } = S;
  const parts = {};
  // ---- Appendix A, as audited ----
  const headFlats = [{ n: [0, 0, -1], d: HEAD.c[2] - NECK }, HEAD_MUZZLE_FLAT];
  const torsoFlats = [{ n: [0, 0, -1], d: 0 }, { n: [0, 0, 1], d: NECK - TORSO.c[2] }];
  parts.torsoLower = T.round({ name: "torso.lower", ...H, F: VERT(0, 0), s0: TORSO_LOWER.z0, s1: TORSO_LOWER.z1, r: TORSO_LOWER.r });
  parts.muzzle = T.ball({ name: "muzzle", ...H, ...MUZZLE, flats: [MUZZLE_FLAT] });
  for (const s of SIDES) {
    const side = s > 0 ? "L" : "R";
    const EAR = earAt(s), [hE, eH] = cut(HEAD, EAR);
    headFlats.push(hE, eyeFlat(s));
    T.ball({ name: `ear.${side}`, ...H, ...EAR, flats: [eH], material: "rubber" });
    const SH = SHOULDER(s), [tS, sT] = cut(TORSO, SH);
    torsoFlats.push(tS);
    T.ball({ name: `shoulder.${side}`, ...H, ...SH, flats: [sT, SHOULDER_BOTTOM], material: "rubber" });
    const arm = ARM(s);
    T.round({ name: `arm.${side}`, ...H, F: VERT(arm.at[0], arm.at[1]), s0: arm.z0, s1: arm.z1, r: arm.r, ends: ["dome", "flat"], material: "rubber" });
    const { hip, foot, r } = LEG(s);
    parts[`leg.${side}`] = T.round({ name: `leg.${side}`, ...H, F: frameOf(hip, sub(foot, hip), [0, 0, 1]), s0: 0, s1: len(sub(foot, hip)), r, ends: ["dome", "dome"], material: "rubber" });
  }
  parts.head = T.ball({ name: "head", ...H, ...HEAD, flats: headFlats });
  parts.torsoUpper = T.ball({ name: "torso.upper", ...H, ...TORSO, flats: torsoFlats, material: "rubber" });

  // ---- 5.3 surface features (decals on their hosts) ----
  const plane = (part, o, n, right, svg, fade) => {
    const B = basisAt(n, right);
    T.plane({ part, o, u: B.u, v: B.v, normal: B.n, svg, ...(fade ? { fade } : {}) });
  };
  const X = [1, 0, 0];
  for (const s of SIDES) {
    // eye patch fills the eye flat; eye disc Ø14 with a highlight Ø3 at upper left (as the viewer sees it)
    const F = eyeFlat(s);
    const n = unit(F.n);
    const o = add(HEAD.c, mul(n, F.d));
    const rFlat = Math.sqrt(HEAD.r * HEAD.r - F.d * F.d);
    const eye = FEATURES.eye.d / 2;
    const hl = FEATURES.eye.highlight / 2;
    plane(parts.head, o, n, X,
      `<path class="tk-ink" d="${circlePath(0, 0, rFlat, 64)}"/>` +
      `<path class="tk-eye" d="${circlePath(0, 0, eye, 40)}"/>` +
      `<path class="tk-gloss" data-free="" d="${circlePath(-2.7, -2.7, hl, 16)}"/>`);
    // cheek ring Ø16 at (s·36, surface, 176)
    const cz = FEATURES.cheek.z - HEAD.c[2];
    const cy = Math.sqrt(HEAD.r ** 2 - cz ** 2 - FEATURES.cheek.x ** 2);
    const cp = [s * FEATURES.cheek.x, HEAD.c[1] + cy, FEATURES.cheek.z];
    plane(parts.head, cp, sub(cp, HEAD.c), X, `<path class="iso-line" data-tone="faint" d="${circlePath(0, 0, FEATURES.cheek.d / 2, 40)}"/>`);
    // sole pad: one dot Ø16 at the front pole, four Ø6 toes on an arc above it
    const { hip, foot, r } = LEG(s);
    const dir = unit(sub(foot, hip));
    const side = unit([dir[1], -dir[0], 0]);
    const pole = add(foot, mul(dir, r));
    const sag = (rr) => r - Math.sqrt(r * r - rr * rr);
    plane(parts[`leg.${s > 0 ? "L" : "R"}`], sub(pole, mul(dir, sag(FEATURES.sole.pad / 2) / 2)), dir, X, `<path class="tk-pad" d="${circlePath(0, 0, FEATURES.sole.pad / 2, 40)}"/>`);
    for (let j = 0; j < FEATURES.sole.toes; j++) {
      const az = ((-33 + 22 * j) * Math.PI) / 180;
      const el = (38 * Math.PI) / 180;
      const d = unit(add(add(mul(dir, Math.cos(el) * Math.cos(az)), mul(side, Math.cos(el) * Math.sin(az))), [0, 0, Math.sin(el)]));
      const p = add(foot, mul(d, r - sag(FEATURES.sole.toe / 2) / 2));
      plane(parts[`leg.${s > 0 ? "L" : "R"}`], p, d, X, `<path class="tk-pad" d="${circlePath(0, 0, FEATURES.sole.toe / 2, 24)}"/>`);
    }
  }
  // nose: filled oval 10 × 7 at the muzzle tip
  const tip = add(MUZZLE.c, mul(NM, MUZZLE.r));
  plane(parts.muzzle, sub(tip, mul(NM, 0.5)), NM, X, `<ellipse class="tk-ink" cx="0" cy="0" rx="${FEATURES.nose.w / 2}" ry="${FEATURES.nose.h / 2}"/>`);
  // mouth: two arcs, 12 wide, just under the muzzle at z ≈ 163
  const mz = FEATURES.mouth.z - HEAD.c[2];
  const mp = [0, HEAD.c[1] + Math.sqrt(HEAD.r ** 2 - mz ** 2), FEATURES.mouth.z];
  const w = FEATURES.mouth.w / 2;
  plane(parts.head, mp, sub(mp, HEAD.c), X, `<path class="iso-line" data-tone="lo" d="M${-w} -0.6Q${-w / 2} 2.4 0 0Q${w / 2} 2.4 ${w} -0.6"/><path class="iso-line" data-tone="lo" d="M0 0L0 -1.6"/>`);
  // seam over the head from the muzzle seat to the neck, in short planes that each fade with facing
  const phi0 = (-Math.acos(HEAD_MUZZLE_FLAT.d / HEAD.r) + Math.atan2(-NM[2], NM[1]) + 0) ;
  const seamStart = Math.atan2(NM[2], NM[1]) + Math.acos(HEAD_MUZZLE_FLAT.d / HEAD.r); // rim of the muzzle seat, above it
  const seamEnd = Math.PI + Math.asin((HEAD.c[2] - NECK) / HEAD.r); // neck rim at the back
  void phi0;
  const SEG = 10;
  const count = Math.ceil(((seamEnd - seamStart) * 180) / Math.PI / SEG);
  for (let i = 0; i < count; i++) {
    const a0 = seamStart + ((seamEnd - seamStart) * i) / count;
    const a1 = seamStart + ((seamEnd - seamStart) * (i + 1)) / count;
    const am = (a0 + a1) / 2;
    const at = (a) => add(HEAD.c, [0, HEAD.r * Math.cos(a), HEAD.r * Math.sin(a)]);
    const o = at(am);
    const n = unit(sub(o, HEAD.c));
    const B = basisAt(n, X);
    const pts = Array.from({ length: 5 }, (_, j) => {
      const p = sub(at(a0 + ((a1 - a0) * j) / 4), o);
      return [dot(p, B.u), dot(p, B.v)];
    });
    const ends = i === 0 ? "" : i === count - 1 ? "" : "";
    void ends;
    T.plane({ part: parts.head, o, u: B.u, v: B.v, normal: n, fade: [0.02, 0.32], svg: `<path class="iso-line" data-tone="faint" d="${pathOf(pts, false)}"/>` });
  }
  // seam round the neck, on the top flat of torso.upper
  T.plane({ part: parts.torsoUpper, o: [0, 0, NECK], u: [1, 0, 0], v: [0, 1, 0], normal: [0, 0, 1], fade: [-2, -1.9], svg: `<path class="iso-line" data-tone="faint" d="${circlePath(0, 0, 23, 96)}"/>` });

  // ---- recesses on torso.lower: drawn per frame by live.js inside the torso.lower node ----
  const recesses = [recess("oled", FEATURES.oled.w, FEATURES.oled.h, 2, FEATURES.oled.at, FEATURES.oled.depth, 1), recess("rocker", FEATURES.rocker.open[0], FEATURES.rocker.open[1], 1.5, FEATURES.rocker.at, FEATURES.rocker.depth, -1), recess("port", FEATURES.port.w, FEATURES.port.h, FEATURES.port.h / 2, FEATURES.port.at, FEATURES.port.depth, -1)];
  return { ...S, recesses };
}

// A rounded opening on the torso.lower cylinder (facing +Y for dir 1, −Y for −1), with straight walls
// back to a flat bottom `depth` in. Points are rest-world (the turn group's frame).
function recess(name, w, h, r, at, depth, dir) {
  const R = TORSO_LOWER.r;
  const flat = roundRect(w, h, r, 6);
  const right = dir > 0 ? 1 : -1; // viewer's right is +X at the front, −X at the back
  const rim = flat.map(([x, y]) => {
    const X = at[0] + right * x;
    return [X, dir * Math.sqrt(R * R - X * X), at[2] - y];
  });
  const yb = dir * (R - depth);
  const back = rim.map(([x, , z]) => [x, yb, z]);
  return { name, rim: rim.map((p) => p.map(r4)), back: back.map((p) => p.map(r4)), n: [0, dir, 0], o: [at[0], yb, at[2]], u: [right, 0, 0], v: [0, 0, -1], w, h };
}
const r4 = (x) => Math.round(x * 1e4) / 1e4;
void G; void f3;
