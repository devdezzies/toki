// node toki/film/record.mjs [--from s] [--to s] [--stills t1,t2,…] [--no-build] [--out file.mp4]
// Renders the walkthrough film (spec 9.8) frame by frame: toki-film.html runs on a virtual clock in headless Chrome,
// each frame is captured as a JPEG and piped into ffmpeg together with the voice track, mixed here from the
// ElevenLabs clips at their cue times. Every frame is exact, and picture and voice share one timeline.
//   --from/--to  render only that span (seconds), for checking
//   --stills     save PNG stills at these times instead of a video
import { spawn, spawnSync, execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromePort } from "file:///C:/Users/Abdullah/.claude/skills/anatomy/scripts/chrome-port.mjs";
import { FILM } from "../film.mjs";
import { filmTimeline } from "../build.mjs";

if (typeof WebSocket === "undefined" && !process.execArgv.includes("--experimental-websocket")) {
  const child = spawn(process.execPath, ["--experimental-websocket", ...process.argv.slice(1)], { stdio: "inherit" });
  child.on("exit", (code) => process.exit(code ?? 1));
} else await main();

function ffmpegPath() {
  if (process.env.FFMPEG && existsSync(process.env.FFMPEG)) return process.env.FFMPEG;
  try {
    const found = execFileSync(process.platform === "win32" ? "where" : "which", ["ffmpeg"], { encoding: "utf8" }).split(/\r?\n/)[0].trim();
    if (found) return found;
  } catch {}
  const local = process.env.LOCALAPPDATA ?? join(homedir(), "AppData/Local");
  const link = join(local, "Microsoft/WinGet/Links/ffmpeg.exe");
  if (existsSync(link)) return link;
  const pkgs = join(local, "Microsoft/WinGet/Packages");
  if (existsSync(pkgs))
    for (const dir of readdirSync(pkgs).filter((d) => /ffmpeg/i.test(d))) {
      const walk = (d, depth) => {
        for (const e of readdirSync(d, { withFileTypes: true })) {
          const p = join(d, e.name);
          if (e.isFile() && e.name.toLowerCase() === "ffmpeg.exe") return p;
          if (e.isDirectory() && depth < 4) { const r = walk(p, depth + 1); if (r) return r; }
        }
        return null;
      };
      const r = walk(join(pkgs, dir), 0);
      if (r) return r;
    }
  return null;
}
function chromePath() {
  const local = process.env.LOCALAPPDATA ?? "";
  return [process.env.CHROME_PATH, "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe", join(local, "Google\\Chrome\\Application\\chrome.exe"), "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe", "/usr/bin/google-chrome", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].filter(Boolean).find((p) => existsSync(p));
}
function fmt(s) { const t = Math.max(0, s); const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), sec = Math.floor(t % 60), ms = Math.round((t - Math.floor(t)) * 1000); return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")},${String(ms === 1000 ? 999 : ms).padStart(3, "0")}`; }

async function main() {
  const HERE = dirname(fileURLToPath(import.meta.url));
  const argv = process.argv.slice(2);
  const opt = (name, fallback) => { const i = argv.indexOf(name); return i < 0 ? fallback : argv[i + 1]; };
  const stills = opt("--stills", null)?.split(",").map(Number);
  const from = Number(opt("--from", 0));
  const to = opt("--to", null);
  const out = resolve(opt("--out", join(HERE, `toki-walkthrough-${FILM.lang}.mp4`)));
  mkdirSync(HERE, { recursive: true });

  if (!argv.includes("--no-build")) {
    const b = spawnSync(process.execPath, [join(HERE, "..", "build.mjs"), "--page=film"], { stdio: "inherit" });
    if (b.status !== 0) throw new Error("film build failed");
  }
  const { cues, total } = filmTimeline();
  const end = Math.min(total, to === null ? total : Number(to));
  const frames = Math.floor((end - from) * FILM.fps);

  // ---- the voice track and the subtitles, on the film's timeline ----
  const ffmpeg = stills ? null : ffmpegPath();
  if (!stills && !ffmpeg) throw new Error("ffmpeg not found (winget install Gyan.FFmpeg, or set FFMPEG)");
  const wav = join(HERE, `voice-${FILM.lang}.wav`);
  if (!stills) {
    const inputs = [], chains = [], labels = [];
    cues.forEach((c, i) => {
      inputs.push("-i", c.file);
      const ms = Math.round((c.at - from) * 1000);
      if (c.at + c.dur < from || c.at > end) return;
      chains.push(ms >= 0 ? `[${i}:a]aresample=48000,adelay=${ms}|${ms}[a${i}]` : `[${i}:a]aresample=48000,atrim=start=${(-ms / 1000).toFixed(3)},asetpts=PTS-STARTPTS[a${i}]`);
      labels.push(`[a${i}]`);
    });
    const span = (end - from).toFixed(3);
    const graph = `${chains.join(";")};${labels.join("")}amix=inputs=${labels.length}:normalize=0:dropout_transition=0,apad=whole_dur=${span},atrim=0:${span},loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000[out]`;
    const r = spawnSync(ffmpeg, ["-y", "-loglevel", "error", ...inputs, "-filter_complex", graph, "-map", "[out]", "-ac", "2", "-ar", "48000", wav], { stdio: "inherit" });
    if (r.status !== 0) throw new Error("mixing the voice track failed");
    const srt = cues.filter((c) => c.at + c.dur > from && c.at < end).map((c, i, list) => {
      const next = list[i + 1];
      const stop = Math.min(c.at + c.dur + 0.35, next ? next.at - 0.05 : end);
      return `${i + 1}\n${fmt(c.at - from)} --> ${fmt(stop - from)}\n${c.who === "narrator" ? "" : `${c.who === "toki" ? "TOKI" : "CHILD"}: `}${c.text}\n`;
    }).join("\n");
    writeFileSync(out.replace(/\.mp4$/, ".srt"), srt);
    console.log(`voice track: ${cues.length} lines → ${wav}`);
  }

  // ---- the picture: headless Chrome on the film page's virtual clock ----
  const binary = chromePath();
  if (!binary) throw new Error("No Chrome found (set CHROME_PATH)");
  const profile = mkdtempSync(join(tmpdir(), "toki-film-"));
  const chrome = spawn(binary, ["--headless=new", ...(process.platform === "win32" ? ["--do-not-de-elevate"] : []), "--remote-debugging-port=0", `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--allow-file-access-from-files", "--force-device-scale-factor=1", `--window-size=${FILM.width},${FILM.height}`, "about:blank"]);
  const port = await chromePort(chrome, profile);
  const cleanup = () => { chrome.kill("SIGKILL"); try { rmSync(profile, { recursive: true, force: true }); } catch {} };
  try {
    const page = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json();
    const socket = new WebSocket(page.webSocketDebuggerUrl);
    let id = 0, loaded = () => {};
    const pending = new Map(), problems = [];
    socket.onmessage = (m) => {
      const d = JSON.parse(m.data);
      if (d.method === "Page.loadEventFired") loaded();
      if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
      else if (d.method === "Runtime.exceptionThrown") problems.push(d.params.exceptionDetails.exception?.description ?? d.params.exceptionDetails.text);
    };
    await new Promise((r) => (socket.onopen = r));
    const send = (method, params = {}) => new Promise((done, fail) => {
      const call = ++id;
      const timer = setTimeout(() => { pending.delete(call); fail(new Error(`no answer to ${method}`)); }, 120000);
      pending.set(call, (d) => { clearTimeout(timer); d.error ? fail(new Error(`${method}: ${d.error.message}`)) : done(d.result); });
      socket.send(JSON.stringify({ id: call, method, params }));
    });
    const evaluate = async (expression) => {
      const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
      return r.result.value;
    };
    await send("Runtime.enable");
    await send("Page.enable");
    await send("Emulation.setDeviceMetricsOverride", { width: FILM.width, height: FILM.height, deviceScaleFactor: 1, mobile: false });
    const load = new Promise((r) => { loaded = r; setTimeout(r, 15000); });
    await send("Page.navigate", { url: pathToFileURL(join(HERE, "..", "toki-film.html")).href });
    await load;
    await new Promise((r) => setTimeout(r, 1500));
    await evaluate("document.fonts ? document.fonts.ready.then(() => 1) : 1");
    await evaluate("window.__film.start() && 1");
    const shot = async (format) => Buffer.from((await send("Page.captureScreenshot", { format, ...(format === "jpeg" ? { quality: 93 } : {}), fromSurface: true })).data, "base64");

    if (stills) {
      const dir = join(HERE, "stills");
      mkdirSync(dir, { recursive: true });
      for (const t of stills) {
        await evaluate(`window.__film.at(${t})`);
        const file = join(dir, `t${String(t).replace(".", "_")}.png`);
        writeFileSync(file, await shot("png"));
        console.log(`still ${t} s → ${file}`);
      }
    } else {
      // run up to the first frame, then capture one frame per step
      for (let k = 0; k < Math.round(from * FILM.fps); k++) await evaluate("window.__film.step() && 1");
      const enc = spawn(ffmpeg, ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FILM.fps), "-c:v", "mjpeg", "-i", "-", "-i", wav, "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-r", String(FILM.fps), "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", out], { stdio: ["pipe", "inherit", "inherit"] });
      const done = new Promise((r, j) => enc.on("exit", (code) => (code === 0 ? r() : j(new Error(`ffmpeg exited ${code}`)))));
      const t0 = Date.now();
      for (let n = 0; n < frames; n++) {
        const jpg = await shot("jpeg");
        if (!enc.stdin.write(jpg)) await new Promise((r) => enc.stdin.once("drain", r));
        if (n === Math.round((2.5 - from) * FILM.fps)) writeFileSync(join(HERE, "poster.png"), await shot("png"));
        await evaluate("window.__film.step() && 1");
        if (n % 150 === 0 || n === frames - 1) {
          const rate = (n + 1) / ((Date.now() - t0) / 1000);
          process.stdout.write(`frame ${n + 1}/${frames} · ${rate.toFixed(1)} fps · ${Math.round((frames - n - 1) / rate)} s left\n`);
        }
      }
      enc.stdin.end();
      await done;
      console.log(`wrote ${out} (${frames} frames, ${(frames / FILM.fps).toFixed(1)} s)`);
    }
    if (problems.length) console.log(`page problems:\n  ${problems.join("\n  ")}`);
  } finally {
    cleanup();
  }
}
