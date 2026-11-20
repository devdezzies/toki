// The walkthrough film (spec 9.8): the demo's story (demo.mjs SHOTS) with a narrated intro (what Toki is, a turntable
// reveal, a tour of the sealed pod) and an outro, rendered full-screen by film/record.mjs. English only.
//
// Film-only shot fields (demo.js reads them; the interactive demo never uses them):
//   card       { title, sub }   a title card over the picture
//   cam.spin   degrees per second added to θ over the shot (a slow turntable)
//   cam.pod    "closed" | "open"   a hardware shot that keeps the pod closed, or opens it (default: open)
// Every fact in the narration is the spec's (sections 2, 6, 7, 14.2).
import { SHOTS, CHAPTERS } from "./demo.mjs";
import { FACE } from "./model.mjs";

const N = (en) => ({ who: "narrator", en });
const FACE_AT = [0, 70, (FACE.eye.z + FACE.mouth.z) / 2];

const INTRO = [
  { ch: "intro", dur: 4.2, power: true, boot: 2, face: "happy", apple: "none", card: { title: "Toki", sub: "A smart plush for speech practice" }, cam: { scene: "skin", theta: 320, zoom: 0.95, spin: 9 } },
  { ch: "intro", dur: 5, cam: { scene: "skin", theta: 358, zoom: 1, spin: 9 }, sub: N("This is Toki: a soft, twenty-six-centimetre plush that helps children aged three to six practise speaking.") },
  { ch: "intro", dur: 3, step: "listening", arcs: "listen", face: "listening", cam: { scene: "skin", theta: 45, zoom: 1.05, spin: 9 }, sub: N("It listens, it sees, and it talks back.") },
  { ch: "intro", dur: 5, step: "speaking", arcs: "speak", face: "happy", cam: { scene: "skin", theta: 18, zoom: 1.55, focus: FACE_AT }, sub: N("A camera looks out through the pupil of its left eye, a speaker sits behind its smile, and its cheeks glow with its mood.") },
];

const INSIDE = [
  { ch: "inside", dur: 6, face: "happy", cam: { scene: "core", theta: 30, zoom: 1.15, pod: "closed", spin: 6 }, sub: N("Take away the fabric and the stuffing, and every hard part is in one sealed pod: flame-retardant, gasketed, and closed with six security screws, with ten millimetres of stuffing all round.") },
  { ch: "inside", dur: 5, lit: ["01", "02", "03", "04", "05", "09"], cam: { scene: "core", theta: 40, zoom: 1.1, pod: "open" }, sub: N("Inside: an ESP32-S3 controller, a camera, a microphone, an amplifier and speaker, two cheek lights, and the battery.") },
  { ch: "inside", dur: 4, lit: ["06"], cam: { scene: "core", theta: 70, zoom: 1.9, focus: "06" }, sub: N("The cell sits in its own screwed bay, behind two layers of protection and a fuse.") },
  { ch: "inside", dur: 4, lit: ["07", "08"], cam: { scene: "core", theta: 110, zoom: 2, focus: "08" }, sub: N("The switch and the charging port are reached through a zip in the bottom panel: nothing hard on the outside.") },
];

const OUTRO = [
  { ch: "outro", dur: 4.5, power: true, boot: 2, face: "happy", apple: "none", cam: { scene: "skin", theta: 340, zoom: 1, spin: 10 }, sub: N("Toki: a friendly face for speech practice, with a sealed, child-safe heart.") },
  { ch: "outro", dur: 4.5, card: { title: "Toki", sub: "Smart plush prototype\nListens · Sees · Speaks · Glows" }, cam: { scene: "skin", theta: 25, zoom: 0.95, spin: 10 } },
];

export const FILM_SHOTS = [...INTRO, ...INSIDE, ...SHOTS, ...OUTRO];
export const FILM_CHAPTERS = [
  { id: "intro", en: "Meet Toki", id_: "Kenalan" },
  { id: "inside", en: "Inside the pod", id_: "Di dalam" },
  ...CHAPTERS,
  { id: "outro", en: "Toki", id_: "Toki" },
];
// Chapter cards ("02 · Inside the pod") show at these chapters' starts; the intro and outro have title cards instead.
export const FILM = { fps: 30, width: 1920, height: 1080, lang: "en", cards: FILM_CHAPTERS.filter((c) => c.id !== "intro" && c.id !== "outro").map((c) => c.id), fadeIn: 0.8, fadeOut: 1.4, chapterCard: 2.6, cardShift: 0.13 };
