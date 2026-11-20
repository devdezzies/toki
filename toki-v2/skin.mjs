// Skin scene (REDESIGN 1.1): one mint body cut flat at the bottom panel, two two-lobe wings, a care tag,
// and the embroidery (eyes, mouth, side swirls with the cheek glow behind them, seams) as decals on small flats.
import { G } from "./kit.mjs";
import { scene, basisAt, circlePath, pathOf, f3, VERT } from "./scene.mjs";
import { BODY, BAND, BOTTOM, FACE, WING, SIDES, CAMERA_EYE, EYE_FLAT, MOUTH_FLAT, SWIRL_FLAT, TAG_FLAT, flatCentre, wingAt, cut, sub, add, mul, dot, unit, len } from "./model.mjs";

const D2R = Math.PI / 180;
const bare = ({ n, d }) => ({ n, d });

// An Archimedean spiral in a plane, from radius r0 out to r1 over `turns`, as points.
const spiral = (r0, r1, turns, phase = 0, dir = 1, steps = 72) =>
  Array.from({ length: steps + 1 }, (_, j) => {
    const t = j / steps;
    const a = phase + dir * t * turns * 2 * Math.PI;
    const r = r0 + (r1 - r0) * t;
    return [r * Math.cos(a), r * Math.sin(a)];
  });
const dotAt = ([x, y], r, cls) => `<circle class="${cls}" cx="${f3(x)}" cy="${f3(y)}" r="${r}"/>`;

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
  const bodyFlats = [BOTTOM, ...SIDES.map((s) => bare(EYE_FLAT(s))), bare(MOUTH_FLAT), ...SIDES.map((s) => bare(SWIRL_FLAT(s))), bare(TAG_FLAT)];
  for (const s of SIDES) {
    const side = s > 0 ? "L" : "R";
    const { root, lobe } = wingAt(s);
    const [bodyCut, rootCut] = cut(BODY, root);
    bodyFlats.push(bodyCut);
    const [rootLobe, lobeRoot] = cut(root, lobe);
    const sideFlats = (b) => [{ n: [0, 1, 0], d: WING.t / 2 }, { n: [0, -1, 0], d: WING.t / 2 }];
    parts[`wing.${side}.root`] = T.ball({ name: `wing.${side}.root`, ...H, ...root, flats: [rootCut, rootLobe, ...sideFlats(root)] });
    parts[`wing.${side}.lobe`] = T.ball({ name: `wing.${side}.lobe`, ...H, ...lobe, flats: [lobeRoot, ...sideFlats(lobe)] });
  }
  parts.body = T.ball({ name: "body", ...H, ...BODY, flats: bodyFlats });
  // the bottom panel's band: an upright round the sphere's flat sits on (a vertical round is a fixed picture)
  parts.band = T.round({ name: "body.band", ...H, F: VERT(0, 0), s0: BAND.z0, s1: BAND.z1, r: BAND.r, crease: "faint" });

  // care tag: a thin fabric flap on its own small flat at the back-right seam, hanging below it
  {
    const F = TAG_FLAT;
    const o = flatCentre(F);
    const B = basisAt(F.n, [0, -1, 0].map((x, i) => x)); // u along the surface, v down
    const { w, l, t } = FACE.tag;
    parts.tag = T.prism({ name: "tag", ...H, F: { o, a: B.n, u: B.u, v: B.v }, polygon: [[-w / 2, -6], [w / 2, -6], [w / 2, l - 6], [-w / 2, l - 6]], s0: 0, s1: t, tone: "hi", crease: "faint" });
    const face = add(o, mul(B.n, t));
    const rules = [0, 1, 2].map((i) => `M${f3(-w / 2 + 2)} ${f3(4 + i * 3.4)}L${f3(w / 2 - 2)} ${f3(4 + i * 3.4)}`).join("");
    T.plane({ part: parts.tag, o: face, u: B.u, v: B.v, normal: B.n, svg: `<path class="iso-line" data-tone="faint" d="M${-w / 2 + 2} 1H${w / 2 - 2}V${l - 9}H${-w / 2 + 2}Z"/><path class="iso-line" data-tone="faint" d="${rules}"/>` });
  }

  // ---- embroidery ----
  // eyes: an orange ring, a black iris with a big glint at upper left and a four-point sparkle at lower right
  const star = (cx, cy, s) => `M${f3(cx)} ${f3(cy - s)}L${f3(cx + s * 0.28)} ${f3(cy - s * 0.28)}L${f3(cx + s)} ${f3(cy)}L${f3(cx + s * 0.28)} ${f3(cy + s * 0.28)}L${f3(cx)} ${f3(cy + s)}L${f3(cx - s * 0.28)} ${f3(cy + s * 0.28)}L${f3(cx - s)} ${f3(cy)}L${f3(cx - s * 0.28)} ${f3(cy - s * 0.28)}Z`;
  for (const s of SIDES) {
    const F = EYE_FLAT(s);
    const E = FACE.eye;
    const lens = s === CAMERA_EYE ? `<path class="tk-lenshole" d="${circlePath(0, 0, E.hole, 24)}"/>` : "";
    plane(parts.body, flatCentre(F), F.n, X,
      `<path class="tk-eye-ring" d="${circlePath(0, 0, E.ring, 72)}${circlePath(0, 0, E.iris + 0.4, 64)}"/>` +
      `<path class="tk-eye" d="${circlePath(0, 0, E.iris, 64)}"/>` +
      lens +
      `<path class="tk-gloss" d="${circlePath(-4.4, -4.2, E.glint, 24)}"/>` +
      `<path class="tk-gloss" d="${star(4.6, 4.4, E.star)}"/>`);
  }
  // mouth: an open smile with an orange rim and a pink tongue
  {
    const F = MOUTH_FLAT;
    const { w, h } = FACE.mouth;
    const hw = w / 2;
    const top = -h * 0.32, bot = h * 0.56;
    const mouth = `M${-hw} ${f3(top)}Q0 ${f3(top - 3.5)} ${hw} ${f3(top)}Q${f3(hw - 0.5)} ${f3(bot - 6)} 0 ${f3(bot)}Q${f3(-hw + 0.5)} ${f3(bot - 6)} ${-hw} ${f3(top)}Z`;
    const tw = FACE.mouth.tongue / 2;
    const tongue = `M${-tw} ${f3(bot - 7.6)}Q0 ${f3(bot - 14)} ${tw} ${f3(bot - 7.6)}Q${f3(tw - 3)} ${f3(bot - 1.2)} 0 ${f3(bot - 0.9)}Q${f3(-tw + 3)} ${f3(bot - 1.2)} ${-tw} ${f3(bot - 7.6)}Z`;
    plane(parts.body, flatCentre(F), F.n, X, `<path class="tk-mouth" d="${mouth}"/><path class="tk-tongue" d="${tongue}"/><path class="tk-mouth-rim" d="${mouth}"/>`);
  }
  // swirls on both sides, with the cheek glow under them (live.js drives its colour and strength)
  for (const s of SIDES) {
    const F = SWIRL_FLAT(s);
    const W = FACE.swirl;
    const pts = spiral(1.2, W.r, W.turns, -Math.PI / 2, s);
    plane(parts.body, flatCentre(F), F.n, [0, -s, 0],
      `<circle class="tk-glow" data-glow="${s > 0 ? "L" : "R"}" r="${W.glow}" fill="url(#tk-glow-grad)"/>` +
      `<path class="tk-stitch" d="${pathOf(pts, false)}"/>${dotAt(pts[0], 0.7, "tk-knot")}${dotAt(pts[pts.length - 1], 0.7, "tk-knot")}`);
  }
  // wings: a quilted curl on both faces of the lobe
  for (const s of SIDES) {
    const side = s > 0 ? "L" : "R";
    const { lobe: root } = wingAt(s);
    for (const f of [1, -1]) {
      const n = [0, f, 0];
      const o = add(root.c, mul(n, WING.t / 2));
      const pts = spiral(1, 8.5, 1.6, Math.PI, f * s);
      const B = basisAt(n, [f, 0, 0]);
      T.plane({ part: parts[`wing.${side}.lobe`], o, u: B.u, v: B.v, normal: n, svg: `<path class="iso-line" data-tone="faint" d="${pathOf(pts.map(([x, y]) => [x - 2, y + 3]), false)}"/>${dotAt([pts[0][0] - 2, pts[0][1] + 3], 0.55, "tk-knot-w")}${dotAt([pts[pts.length - 1][0] - 2, pts[pts.length - 1][1] + 3], 0.55, "tk-knot-w")}` });
    }
  }

  // ---- seams: the centre-back and two side meridians, and the bottom-panel ring, in short facing-faded planes ----
  const avoid = [...SIDES.map((s) => flatCentre(EYE_FLAT(s))), flatCentre(TAG_FLAT)];
  void avoid;
  const segment = (pts, knot = false) => {
    const mid = pts[Math.floor(pts.length / 2)];
    const n = unit(sub(mid, BODY.c));
    const B = basisAt(n, Math.abs(n[2]) > 0.98 ? X : unit([-n[1], n[0], 0]));
    const flat = pts.map((p) => [dot(sub(p, mid), B.u), dot(sub(p, mid), B.v)]);
    // the three seams meet at the crown on a knot, so no seam's end floats
    const dotSvg = knot ? `<g class="iso-dots" data-tone="faint"><circle cx="${f3(flat[0][0])}" cy="${f3(flat[0][1])}" r=".9"/></g>` : "";
    T.plane({ part: parts.body, o: mid, u: B.u, v: B.v, normal: n, fade: [0.02, 0.32], svg: `<path class="iso-line" data-tone="faint" d="${pathOf(flat, false)}"/>${dotSvg}` });
  };
  // the meridians run from the crown down to the band's seam (the band's top edge draws the ring itself)
  const polarRing = Math.acos((BAND.z1 - BODY.c[2]) / BODY.r); // the seams end on the band's top edge
  const at = (polar, az) => add(BODY.c, [BODY.r * Math.sin(polar) * Math.sin(az * D2R), BODY.r * Math.sin(polar) * Math.cos(az * D2R), BODY.r * Math.cos(polar)]);
  for (const az of FACE.seams.meridians) {
    const count = 14;
    for (let i = 0; i < count; i++) {
      const p0 = (polarRing * i) / count, p1 = (polarRing * (i + 1)) / count;
      segment(Array.from({ length: 5 }, (_, j) => at(p0 + ((p1 - p0) * j) / 4, az)), i === 0);
    }
  }

  return { ...S, recesses: [] };
}
void G; void len;
