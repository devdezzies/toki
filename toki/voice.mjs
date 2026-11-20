// node toki/voice.mjs [--list] [--dry]
// The demo's voiceover from ElevenLabs: one clip per subtitled shot and language (EN, ID), for the narrator, Toki and
// the child (demo.mjs VOICE). Clips are cached by a hash of what made them, so a re-run only sends changed lines.
// The API key comes from ELEVENLABS_API_KEY or %USERPROFILE%/.elevenlabs-key and is never written or printed.
//   --list   print the account's voices and the model's languages (to pick VOICE.speakers)
//   --dry    show what would be sent, send nothing
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SHOTS, LANGS, VOICE } from "./demo.mjs";
import { FILM_SHOTS, FILM } from "./film.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
export const VOICE_DIR = join(HERE, "voice");
export const MANIFEST = join(VOICE_DIR, "manifest.json");
const API = "https://api.elevenlabs.io";

// What a clip depends on: change any of these and it is made again.
export const clipKey = (lang, who, text) => {
  const sp = VOICE.speakers[who];
  return createHash("sha1").update(JSON.stringify([VOICE.model, VOICE.format, sp.id, sp.settings, lang, text])).digest("hex").slice(0, 16);
};
// Every line the demo voices: [shot index, lang, who, text].
export const lines = () => SHOTS.flatMap((s, i) => (s.sub ? Object.keys(LANGS).map((lang) => [i, lang, s.sub.who, s.sub[lang]]) : []));
// The walkthrough film's lines in its one language (film.mjs); the story's lines are the demo's, so already made.
export const filmLines = () => FILM_SHOTS.flatMap((s, i) => (s.sub && s.sub[FILM.lang] ? [[`f${i}`, FILM.lang, s.sub.who, s.sub[FILM.lang]]] : []));
// A clip by what it says: its file and duration, or null if it has not been made.
export function clipFile(lang, who, text) {
  const file = join(VOICE_DIR, lang, `${clipKey(lang, who, text)}.mp3`);
  return existsSync(file) ? { file, dur: mp3Duration(readFileSync(file)) } : null;
}

// Duration of an MP3 from its frame headers (any MPEG version, layer III; an ID3v2 tag is skipped).
export function mp3Duration(buf) {
  let p = 0;
  if (buf.length > 10 && buf.toString("latin1", 0, 3) === "ID3") p = 10 + ((buf[6] << 21) | (buf[7] << 14) | (buf[8] << 7) | buf[9]);
  const BR1 = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320];
  const BR2 = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160];
  const SR = { 3: [44100, 48000, 32000], 2: [22050, 24000, 16000], 0: [11025, 12000, 8000] };
  let seconds = 0, frames = 0;
  while (p + 4 <= buf.length) {
    if (buf[p] !== 0xff || (buf[p + 1] & 0xe0) !== 0xe0) { p++; continue; }
    const ver = (buf[p + 1] >> 3) & 3, layer = (buf[p + 1] >> 1) & 3, bri = buf[p + 2] >> 4, sri = (buf[p + 2] >> 2) & 3, pad = (buf[p + 2] >> 1) & 1;
    if (ver === 1 || layer !== 1 || bri === 0 || bri === 15 || sri === 3) { p++; continue; }
    const sr = SR[ver][sri], br = (ver === 3 ? BR1 : BR2)[bri] * 1000;
    const len = Math.floor(((ver === 3 ? 144 : 72) * br) / sr) + pad;
    if (len < 4) { p++; continue; }
    seconds += (ver === 3 ? 1152 : 576) / sr;
    frames++;
    p += len;
  }
  return frames ? seconds : 0;
}

function apiKey() {
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY.trim();
  const f = join(homedir(), ".elevenlabs-key");
  if (existsSync(f)) return readFileSync(f, "utf8").trim();
  throw new Error(`No ElevenLabs key: set ELEVENLABS_API_KEY, or put the key alone in ${f}`);
}
async function call(path, { method = "GET", body = null, key, binary = false } = {}) {
  for (let attempt = 0; ; attempt++) {
    let res;
    try {
      res = await fetch(API + path, { method, headers: { "xi-api-key": key, ...(body ? { "content-type": "application/json" } : {}), accept: binary ? "audio/mpeg" : "application/json" }, body: body ? JSON.stringify(body) : undefined });
    } catch (e) { // a dropped connection: retry with backoff
      if (attempt < 5) { await new Promise((r) => setTimeout(r, 1500 * 2 ** attempt)); continue; }
      throw e;
    }
    if (res.status === 429 && attempt < 5) { await new Promise((r) => setTimeout(r, 1500 * 2 ** attempt)); continue; }
    if (!res.ok) { const err = new Error(`${method} ${path.split("?")[0]} → ${res.status} ${(await res.text()).slice(0, 400)}`); err.status = res.status; throw err; }
    return binary ? Buffer.from(await res.arrayBuffer()) : res.json();
  }
}

async function list(key) {
  const { voices } = await call("/v1/voices", { key });
  console.log(`${voices.length} voices on the account:`);
  for (const v of voices) console.log(`  ${v.voice_id}  ${v.name.padEnd(28)} ${v.category ?? ""}  ${Object.entries(v.labels ?? {}).map(([k, x]) => `${k}=${x}`).join(" ")}`);
  const models = await call("/v1/models", { key });
  const m = models.find((x) => x.model_id === VOICE.model);
  if (!m) console.log(`model ${VOICE.model} not offered; models: ${models.map((x) => x.model_id).join(", ")}`);
  else {
    const langs = (m.languages ?? []).map((l) => l.language_id);
    console.log(`model ${VOICE.model}: ${langs.length} languages · en ${langs.includes("en") ? "yes" : "NO"} · id ${langs.includes("id") ? "yes" : "NO"}`);
  }
}

async function generate(key, dry) {
  const seen = new Set();
  const todo = [...lines(), ...filmLines()].filter(([, lang, who, text]) => {
    const k = `${lang}:${who}:${text}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  const manifest = { config: { model: VOICE.model, format: VOICE.format, lead: VOICE.lead, tail: VOICE.tail }, shots: {} };
  let sent = 0, made = 0, cached = 0;
  let enforce = true; // send language_code until the model says it does not take it
  for (const [i, lang, who, text] of todo) {
    const sp = VOICE.speakers[who];
    if (!dry && !sp?.id) throw new Error(`VOICE.speakers.${who} has no voice id (run --list and pick one)`);
    const name = `${clipKey(lang, who, text)}.mp3`;
    const file = join(VOICE_DIR, lang, name);
    if (!existsSync(file)) {
      if (dry) { console.log(`would send ${lang} ${who}: ${text}`); sent += text.length; continue; }
      const body = { text, model_id: VOICE.model, voice_settings: sp.settings, ...(enforce ? { language_code: lang } : {}) };
      let audio;
      try {
        audio = await call(`/v1/text-to-speech/${sp.id}?output_format=${VOICE.format}`, { method: "POST", body, key, binary: true });
      } catch (e) {
        if (enforce && e.status === 400 && /language/i.test(e.message)) {
          enforce = false;
          console.log(`  (${VOICE.model} takes no language_code; sending without it)`);
          delete body.language_code;
          audio = await call(`/v1/text-to-speech/${sp.id}?output_format=${VOICE.format}`, { method: "POST", body, key, binary: true });
        } else throw e;
      }
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, audio);
      sent += text.length;
      made++;
      console.log(`  ${lang} ${who.padEnd(8)} ${mp3Duration(audio).toFixed(2)} s  ${text}`);
    } else cached++;
    const dur = dry && !existsSync(file) ? 0 : mp3Duration(readFileSync(file));
    if (typeof i === "string") continue; // a film line: found by clipFile, not by shot index
    (manifest.shots[i] ??= {})[lang] = { file: `${lang}/${name}`, dur: Math.round(dur * 1000) / 1000, key: clipKey(lang, who, text) };
  }
  if (!dry) {
    mkdirSync(VOICE_DIR, { recursive: true });
    writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1));
  }
  console.log(`${dry ? "dry run · " : ""}${made} clips made · ${cached} cached · ${sent} characters ${dry ? "would be " : ""}sent`);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const argv = process.argv.slice(2);
  try {
    if (argv.includes("--dry")) await generate(null, true);
    else {
      const key = apiKey();
      if (argv.includes("--list")) await list(key);
      else await generate(key, false);
    }
  } catch (e) {
    console.error(e.message);
    if (e.status === 401 && /voices_read|models_read/.test(e.message)) console.error("(the key cannot list voices or models; the voice ids in demo.mjs VOICE are used as typed)");
    process.exitCode = 1; // not process.exit(): on Windows it can abort while fetch's handles are closing
  }
}
