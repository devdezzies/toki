// Shared scaffold: one projection, one static base, one turn group per scene.
import { k, G, A, turning } from "./kit.mjs";
import { CARD, FIT_POINTS, AZIMUTH, ELEVATION, PLATTER, ENVELOPE, POD, podOutline } from "./model.mjs";
import { base } from "./base.mjs";

export const P = k.fitProjection(FIT_POINTS, CARD.width, CARD.height, { pad: CARD.pad, azimuth: AZIMUTH, elevation: ELEVATION });
export const VERT = (x, y) => G.frameOf([x, y, 0], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
export const frameOf = (o, a, u) => {
  const ax = G.unit3(a);
  const uu = G.unit3(G.sub3(u, G.mul3(ax, G.dot3(u, ax))));
  return { o, a: ax, u: uu, v: G.cross3(ax, uu) };
};
export const f3 = (x) => (Math.round(x * 1000) / 1000).toString();
export const pathOf = (pts, closed = true) => pts.map(([x, y], i) => `${i ? "L" : "M"}${f3(x)} ${f3(y)}`).join("") + (closed ? "Z" : "");
export const circlePath = (cx, cy, r, steps = 40) => pathOf(Array.from({ length: steps }, (_, j) => [cx + r * Math.cos((j / steps) * 2 * Math.PI), cy + r * Math.sin((j / steps) * 2 * Math.PI)]));
export const roundRect = (w, h, r, steps = 6) => {
  const pts = [];
  const cs = [[w / 2 - r, -h / 2 + r, -90], [w / 2 - r, h / 2 - r, 0], [-w / 2 + r, h / 2 - r, 90], [-w / 2 + r, -h / 2 + r, 180]];
  for (const [cx, cy, a0] of cs) for (let j = 0; j <= steps; j++) {
    const a = ((a0 + (90 * j) / steps) * Math.PI) / 180;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
};
// A tangent-plane basis at a surface point with outward normal n: u = the given "right", v = down.
export const basisAt = (n, right) => {
  const N = G.unit3(n);
  let up = G.sub3([0, 0, 1], G.mul3(N, N[2]));
  if (G.len3(up) < 1e-6) up = G.cross3(N, right);
  up = G.unit3(up);
  let u = G.sub3(right, G.mul3(N, G.dot3(right, N)));
  u = G.unit3(G.sub3(u, G.mul3(up, G.dot3(u, up))));
  return { n: N, u, v: G.mul3(up, -1) };
};

export function scene() {
  const R = A.recorder(P);
  const T = turning(P, { recorder: R });
  const toki = T.group("toki", { turn: { pivot: [0, 0] } });
  const layer = T.layer("toki");
  T.stack(["back", "toki"]);
  const H = { group: toki, layer };
  const b = base(R, P);
  // platter, with the doll's footprint engraved on its top and a small front index notch
  const platter = T.round({ name: "platter", ...H, F: VERT(0, 0), s0: PLATTER.z0, s1: PLATTER.z1, r: PLATTER.r, tone: "mid", crease: "lo", details: { seams: [PLATTER.z0 + 1.6] } });
  const notch = `M0 ${PLATTER.r - 7}L0 ${PLATTER.r}`;
  const ringPath = (r, steps = 180) => circlePath(0, 0, r, steps);
  T.plane({
    part: platter, o: [0, 0, 0], u: [1, 0, 0], v: [0, 1, 0], normal: [0, 0, 1], fade: [-2, -1.9],
    svg: `<path class="iso-line" data-tone="faint" d="${ringPath(Math.min(ENVELOPE.bottomD / 2, PLATTER.r - 1.2))}"/><path class="iso-line" data-tone="lo" d="${ringPath(PLATTER.r - 7)}"/><path class="iso-line" data-tone="hi" d="${notch}"/>`,
  });
  return { R, T, H, toki, layer, halo: b.halo, platter };
}
void POD; void podOutline;
