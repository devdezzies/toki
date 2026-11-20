// The product demo: one predefined, end-to-end story of how Toki works, as a list of timed shots.
// The page plays it as a pure function of time (demo.js). Words are subtitles outside the drawing;
// the step names are the pulse's (model.mjs PULSE), and no timing is ever shown.
//
// A shot: { ch, dur, step?, lit?, packets?, arcs?, face?, power?, boot?, apple?, sub?, cam? }
//   step   listening | seeing | sending to backend | answering | speaking   (lights the pulse's parts)
//   lit    component ids lit instead of a step (the power chain)
//   arcs   speak | listen | wifi
//   face   the cheeks' emotion (a glow colour: model.mjs GLOWS)
//   boot   0 cheeks dark · 1 booting (pale glow) · 2 the emotion's colour
//   apple  in | hold | look | out | none   (look: held, with the camera's view cone)
//   cam    { scene: skin | core, theta, zoom, focus }   (a directed camera keyframe). In the hardware scene the pod
//          opens, and focus is a component id (its centre, in its own cover's frame) or a point [x, y, z].
//   sub    { who: narrator | toki | child, en, id }
import { LENS, eyeAt, CAMERA_EYE } from "./model.mjs";

const S = (who, en, id) => ({ who, en, id });

export const LANGS = { en: { label: "EN", voice: "en-US" }, id: { label: "ID", voice: "id-ID" } };

// The cheeks' emotions (colours are CSS tokens --toki-glow-<name>).
export const FACES = { happy: 1, listening: 1, thinking: 1, curious: 1, encouraging: 1, proud: 1 };

export const CHAPTERS = [
  { id: "power", en: "Power on", id_: "Menyala" },
  { id: "cheeks", en: "Cheeks", id_: "Pipi" },
  { id: "hello", en: "Hello", id_: "Halo" },
  { id: "name", en: "Name", id_: "Nama" },
  { id: "apple", en: "Apple", id_: "Apel" },
  { id: "backend", en: "Backend", id_: "Server" },
  { id: "answer", en: "Answer", id_: "Jawaban" },
  { id: "practice", en: "Practice", id_: "Latihan" },
  { id: "bye", en: "Goodbye", id_: "Dadah" },
];

const FACE_AT = [0, 70, 110]; // the face, for skin shots
const CHEEK = [70, 60, 130]; // the left cheek's swirl
const EYE = eyeAt(CAMERA_EYE);
const APPLE_SEEN = [EYE[0] + 6, EYE[1] + 62, EYE[2] + 4];

export const SHOTS = [
  // 1 power on: the switch, then the power chain on the red cables
  { ch: "power", dur: 2.8, power: false, boot: 0, apple: "none", cam: { scene: "skin", theta: 200, zoom: 1 }, sub: S("narrator", "Toki is switched off. Every hard part sits in one sealed pod inside the stuffing.", "Toki dalam keadaan mati. Semua bagian keras ada di satu wadah tertutup di dalam isian boneka.") },
  { ch: "power", dur: 2.2, power: true, cam: { scene: "core", theta: 100, zoom: 2.2, focus: "08" }, sub: S("narrator", "The switch, under a zip in its bottom panel, turns it on.", "Saklar di balik ritsleting di bagian bawahnya menyalakan Toki.") },
  { ch: "power", dur: 2.6, lit: ["06"], packets: ["W1"], cam: { scene: "core", theta: 75, zoom: 1.8, focus: "06" }, sub: S("narrator", "Power flows from the cell in its screwed bay to the protected charger,", "Arus mengalir dari sel di ruang bersekrup ke modul pengisi daya berpelindung,") },
  { ch: "power", dur: 2.2, lit: ["07", "08"], packets: ["W2"], cam: { scene: "core", theta: 95, zoom: 2.2, focus: "07" }, sub: S("narrator", "through the switch,", "melewati saklar,") },
  { ch: "power", dur: 2.4, lit: ["10"], packets: ["W3", "W4"], cam: { scene: "core", theta: 120, zoom: 1.7, focus: "10" }, sub: S("narrator", "to the hub board, through a fuse onto the battery bus,", "ke papan hub, lewat sekring ke jalur baterai,") },
  { ch: "power", dur: 2.8, lit: ["01", "04", "09"], packets: ["W7", "W8"], cam: { scene: "core", theta: 20, zoom: 1.1, focus: [0, 50, 110] }, sub: S("narrator", "which feeds the XIAO, the amplifier and the cheek lights.", "yang memberi daya ke XIAO, penguat suara, dan lampu pipi.") },
  // 2 the cheeks wake
  { ch: "cheeks", dur: 2.6, boot: 1, lit: ["09"], packets: ["W7", "W8"], cam: { scene: "core", theta: 150, zoom: 1.4, focus: [0, 90, 240] }, sub: S("narrator", "Two RGB LEDs wake behind acrylic light pipes,", "Dua LED RGB menyala di balik pipa cahaya akrilik,") },
  { ch: "cheeks", dur: 3, boot: 2, face: "happy", cam: { scene: "skin", theta: 40, zoom: 2.2, focus: CHEEK }, sub: S("narrator", "and Toki's cheeks glow with its mood.", "dan pipi Toki bercahaya sesuai suasana hatinya.") },
  // 3 hello
  { ch: "hello", dur: 1.3, step: "answering", face: "happy", cam: { scene: "skin", theta: 10, zoom: 1.35, focus: FACE_AT } },
  { ch: "hello", dur: 3.4, step: "speaking", arcs: "speak", face: "happy", sub: S("toki", "Hi! I'm Toki. What's your name?", "Halo! Aku Toki. Siapa namamu?") },
  { ch: "hello", dur: 2.6, step: "speaking", arcs: "speak", cam: { scene: "core", theta: 170, zoom: 2, focus: "05" }, sub: S("narrator", "An I²S amplifier drives the 3 W speaker behind its mouth.", "Penguat I²S menggerakkan speaker 3 W di balik mulutnya.") },
  // 4 the child answers
  { ch: "name", dur: 2.6, step: "listening", arcs: "listen", face: "listening", cam: { scene: "core", theta: 200, zoom: 2.4, focus: "03" }, sub: S("child", "Rara!", "Rara!") },
  { ch: "name", dur: 1.8, step: "sending to backend", arcs: "wifi", face: "thinking", cam: { scene: "core", theta: 25, zoom: 2.4, focus: "01" }, sub: S("narrator", "The microphone's sound goes through the XIAO ESP32-S3 to the backend over Wi-Fi.", "Suara dari mikrofon dikirim lewat XIAO ESP32-S3 ke server melalui Wi-Fi.") },
  { ch: "name", dur: 3, step: "speaking", arcs: "speak", face: "happy", cam: { scene: "skin", theta: 20, zoom: 1.4, focus: FACE_AT }, sub: S("toki", "Hello, Rara! Show me something!", "Halo, Rara! Tunjukkan sesuatu ke Toki!") },
  // 5 the apple
  { ch: "apple", dur: 2.6, apple: "in", face: "curious", cam: { scene: "skin", theta: 38, zoom: 1.6, focus: [EYE[0], EYE[1] + 30, EYE[2]] }, sub: S("child", "Look, Toki!", "Lihat, Toki!") },
  { ch: "apple", dur: 3, step: "seeing", apple: "look", sub: S("narrator", "The camera looks out through the pupil of Toki's left eye.", "Kamera melihat lewat pupil mata kiri Toki.") },
  { ch: "apple", dur: 3.4, step: "seeing", apple: "look", cam: { scene: "core", theta: 40, zoom: 2.2, focus: "02" }, sub: S("narrator", "The image runs from the sealed lens turret over a flex to the XIAO, and on over Wi-Fi.", "Gambar mengalir dari turet lensa yang tertutup rapat lewat kabel fleksibel ke XIAO, lalu lewat Wi-Fi.") },
  // 6 the backend
  { ch: "backend", dur: 3.6, step: "sending to backend", arcs: "wifi", face: "thinking", apple: "hold", cam: { scene: "core", theta: 25, zoom: 2.4, focus: "01" }, sub: S("narrator", "On the backend: speech recognition, computer vision and a language model.", "Di server: pengenalan suara, visi komputer, dan model bahasa.") },
  // 7 the answer
  { ch: "answer", dur: 2.2, step: "answering", cam: { scene: "core", theta: 340, zoom: 2.4, focus: "04" }, sub: S("narrator", "The answer comes back as speech: I²S, amplifier, speaker.", "Jawaban kembali sebagai suara: I²S, penguat, speaker.") },
  { ch: "answer", dur: 3.4, step: "speaking", arcs: "speak", face: "curious", cam: { scene: "skin", theta: 22, zoom: 1.5, focus: [12, 80, 115] }, sub: S("toki", "An apple! Can you say “apple”?", "Apel! Coba bilang “apel”!") },
  // 8 practice: a near miss, gentle modelling, the word
  { ch: "practice", dur: 2, step: "listening", arcs: "listen", face: "listening", sub: S("child", "Appo!", "Apeu!") },
  { ch: "practice", dur: 1.3, step: "sending to backend", face: "thinking" },
  { ch: "practice", dur: 3.2, step: "speaking", arcs: "speak", face: "encouraging", sub: S("toki", "Almost! Listen: apple. Your turn!", "Hampir! Dengar ya: apel. Giliranmu!") },
  { ch: "practice", dur: 2, step: "listening", arcs: "listen", face: "listening", sub: S("child", "Apple!", "Apel!") },
  { ch: "practice", dur: 1.3, step: "sending to backend", face: "thinking" },
  { ch: "practice", dur: 3.2, step: "speaking", arcs: "speak", face: "proud", apple: "out", sub: S("toki", "Great job! You said “apple”!", "Hebat! Kamu bilang “apel”!") },
  // 9 goodbye and power off
  { ch: "bye", dur: 3, step: "speaking", arcs: "speak", face: "happy", apple: "none", cam: { scene: "skin", theta: 0, zoom: 1.2 }, sub: S("toki", "Bye-bye, Rara! Let's play again tomorrow.", "Dadah, Rara! Besok main lagi ya.") },
  { ch: "bye", dur: 2.8, power: false, boot: 0, cam: { scene: "skin", theta: 200, zoom: 1.1 }, sub: S("narrator", "Off again. The cell charges through the USB-C port under the zip, with the switch off.", "Mati lagi. Sel diisi lewat port USB-C di balik ritsleting, dengan saklar mati.") },
  { ch: "bye", dur: 3, cam: { scene: "skin", theta: 330, zoom: 1 } },
];

export const APPLE = { seen: APPLE_SEEN, from: [APPLE_SEEN[0] + 40, APPLE_SEEN[1] + 140, APPLE_SEEN[2] - 30], away: [APPLE_SEEN[0] - 70, APPLE_SEEN[1] + 100, APPLE_SEEN[2] + 60], r: 26, lens: LENS.at };
export const UI = { narrator: { en: "", id: "" }, toki: { en: "Toki", id: "Toki" }, child: { en: "Child", id: "Anak" } };
