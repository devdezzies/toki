// Skin scene (spec 5): one turned mint body (measured profile, a vertical lathe with the gusset seam as a ring),
// two two-ball wings placed from the measured outline, a care tag on the side seam, and the embroidery (eyes, mouth, side swirls with the cheek glow
// behind them, seams) as decals laid tangent to the body.
import { G } from "./kit.mjs";
import { scene, basisAt, circlePath, pathOf, f3, VERT } from "./scene.mjs";
import { BODY, BODY_PROFILE, M, FACE, WING, SIDES, CAMERA_EYE, rAt, slopeAt, onBody, normalAt, wingAt, sub, add, mul, dot, unit, cut } from "./model.mjs";

const D2R = Math.PI / 180;

// An Archimedean spiral in a plane, from radius r0 out to r1 over `turns`, as points.
const spiral = (r0, r1, turns, phase = 0, dir = 1, steps = 72) =>
  Array.from({ length: steps + 1 }, (_, j) => {
    const t = j / steps;
    const a = phase + dir * t * turns * 2 * Math.PI;
    const r = r0 + (r1 - r0) * t;
    return [r * Math.cos(a), r * Math.sin(a)];
  });
const dotAt = ([x, y], r, cls) => `<circle class="${cls}" cx="${f3(x)}" cy="${f3(y)}" r="${r}"/>`;

// The body's meridian at azimuth az, from the crown down to z = zEnd, as a fine polyline (by the ellipse angles, so
// the flat crown and the steep sides are sampled alike).
const meridian = (az, zEnd = 0.6, zStart = BODY.h) => {
  const pts = [];
  const a = az * D2R;
  const at = (r, z) => [r * Math.sin(a), r * Math.cos(a), z];
  for (let j = 0; j <= 120; j++) { const th = (j / 120) * (Math.PI / 2); pts.push(at(BODY.a * Math.sin(th), BODY.zm + BODY.cu * Math.cos(th))); }
  for (let j = 1; j <= 80; j++) { const ph = (j / 80) * (Math.PI / 2); pts.push(at(BODY.rb + (BODY.a - BODY.rb) * Math.cos(ph), BODY.zm * (1 - Math.sin(ph)))); }
  return pts.filter((p) => p[2] >= zEnd - 1e-9 && p[2] <= zStart + 1e-9);
};

export function buildSkin() {
  const S = scene();
  const { T, H } = S;
  const parts = {};
  const X = [1, 0, 0];
  const plane = (part, o, n, right, svg, fade) => {
    const B = basisAt(n, right);
    return T.plane({ part, o, u: B.u, v: B.v, normal: B.n, svg, ...(fade ? { fade } : {}) });
  };

  // ---- solids ----
  // the body: one vertical lathe (a fixed picture under the turn), its gusset seam a ring at M.bandTop
  parts.body = T.lathe({ name: "body", ...H, F: VERT(0, 0), profile: BODY_PROFILE, radius: rAt, slope: slopeAt, crease: "faint", details: { seams: [M.bandTop] } });
  // the wings: a root ball and a tip ball each, cut to M.wingT thick, joined flush
  for (const s of SIDES) {
    const side = s > 0 ? "L" : "R";
    const w = wingAt(s);
    const [rootTip, tipRoot] = cut(w.root, w.tip);
    parts[`wing.${side}.root`] = T.ball({ name: `wing.${side}.root`, ...H, ...w.root, flats: [w.contact, rootTip, ...w.sides()] });
    parts[`wing.${side}.tip`] = T.ball({ name: `wing.${side}.tip`, ...H, ...w.tip, flats: [tipRoot, ...w.sides()] });
  }

  // care tag: a thin fabric flap on the side seam, its back face tangent to the body, hanging below the seam point
  {
    const { z, az, w, l, t } = FACE.tag;
    const o = onBody(z, az), n = normalAt(z, az);
    const B = basisAt(n, unit([-n[1], n[0], 0])); // u along the surface (horizontal), v down
    parts.tag = T.prism({ name: "tag", ...H, F: { o, a: B.n, u: B.u, v: B.v }, polygon: [[-w / 2, -6], [w / 2, -6], [w / 2, l - 6], [-w / 2, l - 6]], s0: 0, s1: t, tone: "hi", crease: "faint" });
    const face = add(o, mul(B.n, t));
    const rules = [0, 1, 2, 3].map((i) => `M${f3(-w / 2 + 2.5)} ${f3(4 + i * 3.6)}L${f3(w / 2 - 2.5)} ${f3(4 + i * 3.6)}`).join("");
    T.plane({ part: parts.tag, o: face, u: B.u, v: B.v, normal: B.n, svg: `<path class="iso-line" data-tone="faint" d="M${-w / 2 + 2} 1H${w / 2 - 2}V${l - 9}H${-w / 2 + 2}Z"/><path class="iso-line" data-tone="faint" d="${rules}"/>` });
  }

  // ---- embroidery ----
  // eyes: an orange ring, a black iris with a big glint at upper left and a four-point sparkle at lower right
  const star = (cx, cy, s) => `M${f3(cx)} ${f3(cy - s)}L${f3(cx + s * 0.28)} ${f3(cy - s * 0.28)}L${f3(cx + s)} ${f3(cy)}L${f3(cx + s * 0.28)} ${f3(cy + s * 0.28)}L${f3(cx)} ${f3(cy + s)}L${f3(cx - s * 0.28)} ${f3(cy + s * 0.28)}L${f3(cx - s)} ${f3(cy)}L${f3(cx - s * 0.28)} ${f3(cy - s * 0.28)}Z`;
  for (const s of SIDES) {
    const E = FACE.eye;
    const lens = s === CAMERA_EYE ? `<path class="tk-lenshole" d="${circlePath(0, 0, E.hole, 24)}"/>` : "";
    const g = E.iris * 0.35;
    plane(parts.body, onBody(E.z, s * E.az), normalAt(E.z, s * E.az), X,
      `<path class="tk-eye-ring" d="${circlePath(0, 0, E.ring, 72)}${circlePath(0, 0, E.iris + 0.4, 64)}"/>` +
      `<path class="tk-eye" d="${circlePath(0, 0, E.iris, 64)}"/>` +
      lens +
      `<path class="tk-gloss" d="${circlePath(-g, -g, E.glint, 24)}"/>` +
      `<path class="tk-gloss" d="${star(g * 1.05, g, E.star)}"/>`);
  }
  // mouth: an open smile with an orange rim and a pink tongue
  {
    const { w, h, z } = FACE.mouth;
    const hw = w / 2;
    const top = -h * 0.32, bot = h * 0.56;
    const mouth = `M${-hw} ${f3(top)}Q0 ${f3(top - 3.5)} ${hw} ${f3(top)}Q${f3(hw - 0.5)} ${f3(bot - 6)} 0 ${f3(bot)}Q${f3(-hw + 0.5)} ${f3(bot - 6)} ${-hw} ${f3(top)}Z`;
    const tw = FACE.mouth.tongue / 2;
    const tongue = `M${-tw} ${f3(bot - 8.6)}Q0 ${f3(bot - 15.5)} ${tw} ${f3(bot - 8.6)}Q${f3(tw - 3)} ${f3(bot - 1.2)} 0 ${f3(bot - 0.9)}Q${f3(-tw + 3)} ${f3(bot - 1.2)} ${-tw} ${f3(bot - 8.6)}Z`;
    plane(parts.body, onBody(z, 0), normalAt(z, 0), X, `<path class="tk-mouth" d="${mouth}"/><path class="tk-tongue" d="${tongue}"/><path class="tk-mouth-rim" d="${mouth}"/>`);
  }
  // swirls on both sides, with the cheek glow under them (live.js drives its colour and strength)
  for (const s of SIDES) {
    const W = FACE.swirl;
    const pts = spiral(1.6, W.r, W.turns, -Math.PI / 2, s, 96);
    plane(parts.body, onBody(W.z, s * W.az), normalAt(W.z, s * W.az), [0, -s, 0],
      `<circle class="tk-glow" data-glow="${s > 0 ? "L" : "R"}" r="${f3(W.glow)}" fill="url(#tk-glow-grad)"/>` +
      `<path class="tk-stitch" d="${pathOf(pts, false)}"/>${dotAt(pts[0], 0.8, "tk-knot")}${dotAt(pts[pts.length - 1], 0.8, "tk-knot")}`);
  }
  // wings: a quilted curl on both faces of the tip piece
  for (const s of SIDES) {
    const side = s > 0 ? "L" : "R";
    const { curl, face, tip } = wingAt(s);
    for (const f of [1, -1]) {
      const n = mul(face, f);
      const o = add(curl, mul(n, WING.t / 2 - dot(sub(curl, tip.c), n)));
      const pts = spiral(1, WING.curlR, 1.6, Math.PI, f * s);
      const B = basisAt(n, [f, 0, 0]);
      T.plane({ part: parts[`wing.${side}.tip`], o, u: B.u, v: B.v, normal: n, svg: `<path class="iso-line" data-tone="faint" d="${pathOf(pts, false)}"/>${dotAt([pts[0][0], pts[0][1]], 0.55, "tk-knot-w")}${dotAt([pts[pts.length - 1][0], pts[pts.length - 1][1]], 0.55, "tk-knot-w")}` });
    }
  }

  // ---- seams: centre back and both sides from the crown to the foot, and the gusset's front seam, in short
  // facing-faded planes (the lathe draws the gusset ring itself) ----
  const segment = (pts, az, knot = false) => {
    const mid = pts[Math.floor(pts.length / 2)];
    const n = normalAt(mid[2], az);
    const B = basisAt(n, Math.abs(n[2]) > 0.98 ? X : unit([-n[1], n[0], 0]));
    const flat = pts.map((p) => [dot(sub(p, mid), B.u), dot(sub(p, mid), B.v)]);
    // the three seams meet at the crown on a knot, so no seam's end floats
    const dotSvg = knot ? `<g class="iso-dots" data-tone="faint"><circle cx="${f3(flat[0][0])}" cy="${f3(flat[0][1])}" r=".9"/></g>` : "";
    T.plane({ part: parts.body, o: mid, u: B.u, v: B.v, normal: n, fade: [0.02, 0.32], svg: `<path class="iso-line" data-tone="faint" d="${pathOf(flat, false)}"/>${dotSvg}` });
  };
  const pieces = (line, count) => {
    const L = G.pathLength(line);
    return Array.from({ length: count }, (_, i) => Array.from({ length: 5 }, (_, j) => G.pointAlong(line, (L * (i + j / 4)) / count)));
  };
  for (const az of FACE.seams.meridians) pieces(meridian(az), 18).forEach((pts, i) => segment(pts, az, i === 0));
  for (const az of FACE.seams.gussets.filter((a) => !FACE.seams.meridians.some((m) => ((m - a) % 360 + 360) % 360 === 0)))
    pieces(meridian(az, 0.6, M.bandTop), 2).forEach((pts) => segment(pts, az));

  return { ...S, recesses: [] };
}
