// node toki/build.mjs [--light] [--scene=skin|core] [--audit] [--quick] [--only=a,b] [--verify] [--verbose]
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { k, G, A, TA, turnScript } from "./kit.mjs";
import { FACE, POD, SPEAKER, MIC, onBody, rAt } from "./model.mjs";
import { check, CARD, TEXT, COMPONENTS, HUES, MOTION, AZIMUTH, PULSE, CABLES, BOXES, GLOWS, INSIDE, ASSEMBLIES, STAGGER, ZOOM, PHASES, SIM, FLOW_DIRS, apartAt, assemblyOf, signalOf, cablesOf } from "./model.mjs";
import { P } from "./scene.mjs";
import { buildSkin } from "./skin.mjs";
import { buildCore } from "./core.mjs";
import { SHOTS, CHAPTERS, FACES, UI, LANGS, APPLE, VOICE } from "./demo.mjs";
import { MANIFEST, VOICE_DIR, clipKey, clipFile } from "./voice.mjs";
import { FILM_SHOTS, FILM_CHAPTERS, FILM } from "./film.mjs";
import { mkdirSync } from "node:fs";

const HERE = dirname(fileURLToPath(import.meta.url));

// The voiceover (voice.mjs): when every subtitled shot has a current clip in both languages, the clips are embedded and
// each voiced shot is stretched to hold its longer clip (one timeline for both languages). Otherwise the demo keeps its
// typed timing and the page falls back to the browser's speech synthesis.
function voiceover() {
  const plain = { shots: SHOTS, voice: null };
  if (!existsSync(MANIFEST)) return { ...plain, note: "voice: no clips (node toki/voice.mjs makes them); speech synthesis fallback" };
  const man = JSON.parse(readFileSync(MANIFEST, "utf8"));
  const voice = {};
  const shots = SHOTS.map((s) => ({ ...s }));
  let stale = 0, bytes = 0;
  SHOTS.forEach((s, i) => {
    if (!s.sub) return;
    const out = {};
    for (const lang of Object.keys(LANGS)) {
      const c = man.shots?.[i]?.[lang];
      const file = c && join(VOICE_DIR, c.file);
      if (!c || c.key !== clipKey(lang, s.sub.who, s.sub[lang]) || !existsSync(file)) { stale++; continue; }
      const buf = readFileSync(file);
      bytes += buf.length;
      out[lang] = { src: `data:audio/mpeg;base64,${buf.toString("base64")}`, dur: c.dur };
    }
    voice[i] = out;
    const longest = Math.max(...Object.values(out).map((c) => c.dur));
    shots[i].dur = Math.max(s.dur, Math.round((VOICE.lead + longest + VOICE.tail) * 100) / 100);
  });
  if (stale) return { ...plain, note: `voice: ${stale} clips missing or out of date (node toki/voice.mjs); speech synthesis fallback` };
  const was = SHOTS.reduce((t, s) => t + s.dur, 0), now = shots.reduce((t, s) => t + s.dur, 0);
  return { shots, voice, lead: VOICE.lead, note: `voice: ${Object.keys(voice).length} shots × ${Object.keys(LANGS).length} languages embedded (${(bytes / 1024).toFixed(0)} KB) · demo ${was.toFixed(1)} → ${now.toFixed(1)} s` };
}
const argv = process.argv.slice(2);
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
const theme = argv.includes("--light") ? "light" : "dark";
const only = argv.find((a) => a.startsWith("--only="))?.slice(7).split(",") ?? null;
const pick = argv.find((a) => a.startsWith("--scene="))?.slice(8) ?? null;
const verify = argv.includes("--verify");
const pageArg = argv.find((a) => a.startsWith("--page="))?.slice(7) ?? null;
const film = pageArg === "film"; // the walkthrough film's page (spec 9.8): the full stage, no tool chrome
const single = film ? null : pageArg; // a single-scene page: skin or core

if (isMain) {
  const problems = check();
  if (problems.length) {
    console.error(`check() failed:\n  ${problems.join("\n  ")}`);
    process.exit(1);
  }
  console.log("check() passed");
}

export const sweepPoses = () => Array.from({ length: 360 }, (_, i) => ({ toki: i }));
// Disassembly: one explode value e drives the four assemblies' slides (model.mjs apartAt).
export const follow = (values) => ({ ...values, ...apartAt(values.apart ?? 0, ASSEMBLIES, STAGGER) });
const ease = (x) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};
export const OPEN = 1.4; // seconds the audit's explode clip takes; the page eases e over about the same time
export const corePoses = () => {
  const out = [];
  for (let i = 0; i < 360; i++) out.push(follow({ toki: i, apart: 0 }));
  for (let i = 0; i < 360; i += 2) out.push(follow({ toki: i, apart: 1 }));
  for (let a = 0; a < 360; a += 45) for (let j = 0; j <= 24; j++) out.push(follow({ toki: a, apart: j / 24 }));
  return out;
};

export function build(name) {
  const t0 = Date.now();
  const S = name === "skin" ? buildSkin() : buildCore();
  const out = S.T.build({ statics: S.R.items, poses: name === "core" ? corePoses : sweepPoses, verify });
  A.settle(S.R, S.P ?? P);
  return { ...S, out, seconds: (Date.now() - t0) / 1000 };
}

function audit(S, name) {
  const { T, R } = S;
  A.auditOrExit(R, P, { crowd: S.crowd ?? [] });
  TA.orbitOrExit(T, R, P, {
    sweep: { at: (x) => (name === "core" ? follow({ toki: x, apart: 0 }) : { toki: x }), from: 0, to: 360, frame: 0.3 },
    clips:
      name === "core"
        ? [
            { name: "apart", at: (t) => follow({ toki: 20 + 10 * t, apart: ease(t / OPEN) }), from: 0, to: OPEN, frame: 1 / 60 },
            { name: "close", at: (t) => follow({ toki: 200 + 10 * t, apart: 1 - ease(t / OPEN) }), from: 0, to: OPEN, frame: 1 / 60 },
            { name: "apart-orbit", at: (x) => follow({ toki: x, apart: 1 }), from: 0, to: 360, frame: 0.5 },
          ]
        : [],
    crowd: S.turnCrowd ?? [],
    fittings: S.fittings ?? [],
    quick: argv.includes("--quick"),
    only,
    log: argv.includes("--verbose") ? (text) => console.log(`  … ${text}`) : null,
  });
}

// The film's timeline: its shots stretched to their (English) clips, and the voice cues for the soundtrack and subtitles.
export function filmTimeline() {
  const shots = FILM_SHOTS.map((s) => ({ ...s }));
  const cues = [];
  let t = 0;
  shots.forEach((s, i) => {
    if (s.sub) {
      const text = s.sub[FILM.lang];
      const c = clipFile(FILM.lang, s.sub.who, text);
      if (!c) throw new Error(`film: no clip for "${text}" (run node toki/voice.mjs)`);
      s.dur = Math.max(s.dur, Math.round((VOICE.lead + c.dur + VOICE.tail) * 100) / 100);
      cues.push({ at: Math.round((t + VOICE.lead) * 1000) / 1000, dur: c.dur, file: c.file, who: s.sub.who, text, shot: i });
    }
    t += s.dur;
  });
  return { shots, cues, total: t };
}
// Where the speaking, listening and Wi-Fi arcs start, on the skin and in the hardware's own group frames.
const SOURCES = (() => {
  const mouth = onBody(FACE.mouth.z, 0);
  const micY = Math.sqrt(rAt(MIC.at[2]) ** 2 - MIC.at[0] ** 2);
  return {
    speak: { skin: { c: [0, mouth[1] - 0.6, FACE.mouth.z], d: [0, 1, 0], s: [1, 0, 0] }, core: { g: "front", c: [0, POD.y1 + 0.5, SPEAKER.at[2]], d: [0, 1, 0], s: [1, 0, 0] }, grow: true },
    listen: { skin: { c: [MIC.at[0], micY - 0.6, MIC.at[2]], d: [0, 1, 0], s: [1, 0, 0] }, core: { g: "front", c: [MIC.at[0], POD.y1 + 0.5, MIC.at[2]], d: [0, 1, 0], s: [1, 0, 0] }, grow: false },
    wifi: { core: { c: [12, 31.8, 87], d: [0, 0.55, 0.835], s: [0, 0.835, -0.55] }, grow: true },
  };
})();

function page(skin, core) {
  const W = CARD.width;
  const Hh = CARD.height;
  const back = skin.R.items.filter((item) => item.layer === "back").sort((a, b) => a.key - b.key).map((item) => item.svg);
  const backSvg = k.figureSvg({ width: W, height: Hh, label: TEXT.label, body: [skin.halo, ...back] });
  const sceneDiv = (name, S) => `<div class="toki-scene" data-scene="${name}"${name === "skin" ? " data-active" : ""}>${S.out.layerSvg("toki", { width: W, height: Hh })}</div>`;
  const flat = single ? (single === "skin" ? skin : core).out.layerSvg("toki", { width: W, height: Hh }) : null;
  const stage = single ? `<div class="iso-stage iso-turn toki-stage" tabindex="0" role="slider" aria-label="Toki" aria-valuemin="0" aria-valuemax="359" aria-valuenow="0">${backSvg}${flat}</div>` : `<div class="iso-stage iso-turn toki-stage" tabindex="0" role="slider" aria-label="Toki on a turntable: drag or use the arrow keys to turn it, S swaps skin and hardware, P switches the power, up and down select a component, D opens the sealed pod, I inspects the selected component, plus and minus zoom, 0 fits, Space plays the demo" aria-valuemin="0" aria-valuemax="359" aria-valuenow="0" aria-valuetext="θ 000° · front · skin">${backSvg}${sceneDiv("skin", skin)}${sceneDiv("core", core)}</div>`;
  const button = (attrs, html) => `<button type="button" class="toki-btn" ${attrs}>${html}</button>`;
  const controls =
    `<div class="toki-legend">` +
    `<div class="toki-row" role="group" aria-label="Scene">${button('data-scene-btn="skin" aria-pressed="true"', "Skin")}<span class="toki-dot" aria-hidden="true">·</span>${button('data-scene-btn="core" aria-pressed="false"', "Hardware")}</div>` +
    `<div class="toki-row" role="group" aria-label="View">${button('data-view="0"', "Front")}${button('data-view="90"', "Side")}${button('data-view="180"', "Back")}<span class="toki-gap" aria-hidden="true"></span>${button('data-zoom="out" aria-label="Zoom out"', "−")}${button('data-zoom="fit"', "Fit")}${button('data-zoom="in" aria-label="Zoom in"', "+")}<span class="toki-chip" data-zoom-chip>1.0×</span></div>` +
    `<div class="toki-row" role="group" aria-label="Hardware">${button('data-apart aria-pressed="false"', "Open pod")}${button('data-inspect-btn aria-pressed="false" disabled', "Inspect")}<span class="toki-tip">D · I · double-click a part · pinch or Ctrl+wheel to zoom · Shift+drag to pan</span></div>` +
    `<div class="toki-parts" role="group" aria-label="Components">${COMPONENTS.map((c) => button(`data-pick="${c.id}" aria-pressed="false"`, `<span class="toki-num">${c.id}</span>${c.name}`)).join("")}</div>` +
    `</div>`;
  const keys = Object.entries(HUES).map(([hue, label]) => ({ mark: hue, label: `${hue} — ${label}` }));
  const plate = k.plateHtml({ fig: TEXT.fig, title: TEXT.title, hint: TEXT.hint, readout: "θ 000° · front · skin", keys, caption: TEXT.caption, body: `<style>${skin.out.css}\n${readFileSync(join(HERE, "toki.css"), "utf8")}</style>${stage}` });
  const body = plate.replace("<figcaption", `${controls}<figcaption`) + `<p class="toki-live" aria-live="polite"></p>`;
  const panel = (title, html, open = true) => `<details class="tk-panel"${open ? " open" : ""}><summary>${title}</summary><div class="tk-panel-body">${html}</div></details>`;
  const B = (attrs, html, cls = "") => `<button type="button" class="toki-btn ${cls}" ${attrs}>${html}</button>`;
  const side =
    `<aside class="tk-side" aria-label="Controls"><header class="tk-brand"><span class="tk-fig">${TEXT.fig}</span><span class="tk-name">${TEXT.title}</span></header>` +
    panel("Demo", `<div class="tk-row">${B('data-demo-play aria-pressed="false"', "Play", "tk-primary")}${B("data-demo-restart", "Restart")}${B('data-demo-follow aria-pressed="true"', "Follow")}</div>` +
      `<div class="tk-row">${B('data-lang="en" aria-pressed="true"', "EN")}${B('data-lang="id" aria-pressed="false"', "ID")}${B('data-sound aria-pressed="false"', "Sound")}</div>` +
      `<div class="tk-progress"><div data-demo-progress></div></div>` +
      `<ol class="tk-chapters">${CHAPTERS.map((c, i) => `<li><button type="button" class="tk-ch" data-chapter="${c.id}" aria-current="false"><span class="tk-num">${String(i + 1).padStart(2, "0")}</span><span class="tk-ch-name">${c.en}</span></button></li>`).join("")}</ol>` +
      `<p class="tk-keys">Space play · F follow · T panel</p>`) +
    panel("View", `<div class="tk-row">${B('data-scene-btn="skin" aria-pressed="true"', "Skin")}${B('data-scene-btn="core" aria-pressed="false"', "Hardware")}</div><div class="tk-row">${B('data-view="0"', "Front")}${B('data-view="90"', "Side")}${B('data-view="180"', "Back")}</div><div class="tk-row">${B('data-zoom="out" aria-label="Zoom out"', "−")}${B('data-zoom="fit"', "Fit")}${B('data-zoom="in" aria-label="Zoom in"', "+")}<span class="toki-chip" data-zoom-chip>1.0×</span></div><p class="tk-keys">Drag turns · pinch or Ctrl+wheel zooms · Shift+drag pans · S skin / hardware</p>`) +
    panel("Hardware", `<div class="tk-row">${B('data-apart aria-pressed="false"', "Open pod")}${B('data-inspect-btn aria-pressed="false" disabled', "Inspect")}${B('data-power-btn', "Power")}</div><p class="tk-keys">D · I · P · double-click a part to inspect</p>`) +
    panel("Components", `<div class="tk-parts">${COMPONENTS.map((c) => B(`data-pick="${c.id}" aria-pressed="false"`, `<span class="tk-num">${c.id}</span>${c.name}`)).join("")}</div>`) +
    panel("Legend", `<ul class="tk-keylist">${Object.entries(HUES).map(([hue, label]) => `<li><span class="tk-swatch" data-hue="${hue}"></span>${hue} — ${label}</li>`).join("")}</ul>`) +
    panel("About", `<p class="tk-about">${TEXT.caption}</p>`, false) +
    `</aside>`;
  const view =
    `<main class="tk-view">${stage}` +
    `<div class="tk-ov tk-ov-tl"><span class="tk-fig">${TEXT.fig}</span><span class="tk-name">${TEXT.title}</span></div>` +
    `<div class="tk-ov tk-ov-tr" role="group" aria-label="View">${B('data-view="0"', "Front")}${B('data-view="90"', "Side")}${B('data-view="180"', "Back")}<span class="tk-sep"></span>${B('data-zoom="out" aria-label="Zoom out"', "−")}${B('data-zoom="fit"', "Fit")}${B('data-zoom="in" aria-label="Zoom in"', "+")}</div>` +
    `<div class="tk-ov tk-ov-bl">${TEXT.hint}</div><div class="tk-ov tk-ov-br" data-readout>θ 000° · front · skin</div>` +
    `<div class="tk-sub" data-subtitle aria-live="polite"><span class="tk-sub-who"></span><span class="tk-sub-text"></span></div>` +
    `<button type="button" class="tk-side-toggle" data-side-toggle aria-label="Show or hide the controls">☰</button></main>`;
  const full = `<style>${skin.out.css}
${readFileSync(join(HERE, "toki.css"), "utf8")}</style><div class="tk-app" data-side="open">${side}${view}</div><p class="toki-live" aria-live="polite"></p>`;
  const partsOf = (S) => S.partsByComponent ?? {};
  const DATA = {
    skin: skin.out.data,
    core: core.out.data,
    azimuth: AZIMUTH,
    light: G.lightOf(P),
    recesses: [],
    components: COMPONENTS.map((c) => ({ id: c.id, name: c.name, fn: c.fn, signal: signalOf(c.id)?.text ?? null, cables: cablesOf(c.id) })),
    cables: CABLES.map((c) => ({ id: c.id, from: c.from, to: c.to })),
    parts: partsOf(core),
    traces: core.traces ?? {},
    motion: MOTION,
    pulse: PULSE,
    rocker: core.rocker ?? null,
    text: { scenes: TEXT.scenes, powerOff: TEXT.powerOff },
    glows: GLOWS,
    inside: INSIDE,
    screen: core.screen ?? null,
    demo: (() => {
      if (single) return { shots: SHOTS, chapters: CHAPTERS, faces: FACES, ui: UI, langs: LANGS, apple: APPLE, voice: null };
      if (film) {
        const f = filmTimeline();
        console.log(`film: ${f.shots.length} shots · ${f.cues.length} voiced · ${f.total.toFixed(1)} s · ${Math.floor(f.total * FILM.fps)} frames`);
        return { shots: f.shots, chapters: FILM_CHAPTERS, faces: FACES, ui: UI, langs: LANGS, apple: APPLE, voice: null, lead: VOICE.lead };
      }
      const v = voiceover();
      console.log(v.note);
      return { shots: v.shots, chapters: CHAPTERS, faces: FACES, ui: UI, langs: LANGS, apple: APPLE, voice: v.voice, lead: v.lead ?? 0 };
    })(),
    sim: SIM,
    flows: Object.fromEntries(Object.entries(FLOW_DIRS).map(([id, dir]) => {
      const route = core.T.routes.find((r) => r.name === id);
      const spec = CABLES.find((c) => c.id === id);
      const chunks = core.T.parts.filter((p) => p.route === id).map((p) => ({ name: p.name, from: Math.round(p.spec.from * 100) / 100, to: Math.round(p.spec.to * 100) / 100 }));
      const points = route.points.map((p) => p.map((x) => Math.round(x * 100) / 100));
      let total = 0;
      for (let i = 1; i < route.points.length; i++) total += Math.hypot(...route.points[i].map((x, j) => x - route.points[i - 1][j]));
      return [id, { group: route.group ? route.group.name : "toki", points, total: Math.round(total * 100) / 100, chunks, dir, hue: spec.hue, r: spec.r }];
    })),
    assemblies: ASSEMBLIES.map((a) => ({ name: a.name, travel: a.travel })),
    stagger: STAGGER,
    zoom: ZOOM,
    phases: PHASES,
    inspect: Object.fromEntries(COMPONENTS.map((c) => {
      const b = BOXES[c.id];
      const centre = b.centre;
      const group = assemblyOf((core.partsByComponent?.[c.id] ?? [])[0] ?? "") ?? "toki";
      return [c.id, { centre, group }];
    })),
    single,
    sources: SOURCES,
    film: film ? FILM : null,
  };
  const live = readFileSync(join(HERE, "live.js"), "utf8").replace("__DATA__", JSON.stringify(DATA)) + "\n" + readFileSync(join(HERE, single ? "nodemo.js" : "demo.js"), "utf8") + (film ? "\n" + readFileSync(join(HERE, "film.js"), "utf8") : "");
  const script = turnScript() + (verify ? (single ? `window.__isoVerify = ${JSON.stringify((single === "skin" ? skin : core).out.verify)};\n` : `window.__isoVerifyAll = ${JSON.stringify({ skin: skin.out.verify, core: core.out.verify })};\n`) : "") + live;
  if (single) return k.pageHtml({ title: "Toki — smart plush", theme, body, script, width: 760 });
  if (film) {
    // a virtual clock, installed before the page's own scripts: film/record.mjs advances it one frame at a time
    const clock = `(()=>{let vt=0;const q=[];performance.now=()=>vt;window.requestAnimationFrame=(cb)=>{q.push(cb);return q.length};window.cancelAnimationFrame=()=>{};window.__filmAdvance=(ms)=>{vt+=ms;const list=q.splice(0);for(const cb of list)cb(vt)}})();`;
    const overlays = `<div class="tk-film-chapter" data-film-chapter><span class="n"></span><span class="t"></span></div><div class="tk-film-card" data-film-card><h1></h1><p></p></div><div class="tk-film-black" data-film-black></div>`;
    const filmFull = full.replace(`<button type="button" class="tk-side-toggle"`, `${overlays}<button type="button" class="tk-side-toggle"`).replace("</style>", `
${readFileSync(join(HERE, "film.css"), "utf8")}</style>`);
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=${FILM.width}"><title>Toki — walkthrough film</title><style>${k.ISO_CSS}</style><script>${clock}</script></head><body class="iso tk-body tk-film" data-theme="dark">${filmFull}<script type="module">${script.replace(/<\/(script)/gi, "<\\/$1")}</script></body></html>`;
  }
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Toki — smart plush</title><style>${k.ISO_CSS}</style></head><body class="iso tk-body" data-theme="${theme}">${full}<script type="module">${script.replace(/<\/(script)/gi, "<\\/$1")}</script></body></html>`;
}

if (isMain) {
  if (pick) {
    const S = build(pick);
    const r = S.out.report;
    console.log(`${pick}: ${r.parts} parts · ${r.layers.map((l) => `${l.name}: ${l.planar} planar, ${l.framed} framed, ${l.dynamic} dynamic`).join(" · ")} · build ${S.seconds.toFixed(1)} s`);
    if (argv.includes("--audit")) audit(S, pick);
  } else {
    const skin = build("skin");
    const core = build("core");
    const html = page(skin, core);
    const name = film ? "toki-film.html" : `toki${single ? `-${single}` : ""}${verify ? "-verify" : ""}${theme === "light" ? "-light" : ""}.html`;
    writeFileSync(join(HERE, name), html);
    console.log(`wrote ${name} · ${(html.length / 1024).toFixed(0)} KB · skin ${skin.out.report.parts} parts (${skin.seconds.toFixed(1)} s) · core ${core.out.report.parts} parts (${core.seconds.toFixed(1)} s)`);
  }
}
