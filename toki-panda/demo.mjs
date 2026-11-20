// The product demo: one predefined, end-to-end story of how Toki works, as a list of timed shots.
// The page plays it as a pure function of time (demo.js). Words are subtitles outside the drawing;
// the step names are 9.6's, and no timing is ever shown.
//
// A shot: { ch, dur, step?, lit?, packets?, arcs?, face?, power?, boot?, apple?, sub?, cam? }
//   step   listening | seeing | sending to backend | answering | speaking   (lights 9.6's parts)
//   lit    component ids lit instead of a step (the power chain)
//   arcs   speak | listen | wifi
//   apple  in | hold | look | out | none   (look: held, with the camera's view cone)
//   cam    { scene: skin | core, theta, zoom, focus: [x, y, z] }   (a directed camera keyframe)
//   sub    { who: narrator | toki | child, en, id }

const S = (who, en, id) => ({ who, en, id });

export const LANGS = { en: { label: "EN", voice: "en-US" }, id: { label: "ID", voice: "id-ID" } };

// OLED faces (mm on the active area, x right, y down). No text, no numbers.
const eye = (cx, kind) =>
  kind === "round" ? `M${cx - 0.95} -1.4a.95 .95 0 1 0 1.9 0a.95 .95 0 1 0 -1.9 0` : kind === "up" ? `M${cx - 1.4} -1.8Q${cx} -3.6 ${cx + 1.4} -1.8` : `M${cx - 1.65} -0.9Q${cx} -3.5 ${cx + 1.65} -0.9`;
const face = (eyes, mouth) => ({ l: eye(-6.75, eyes), r: eye(-0.25, eyes), m: mouth });
export const FACES = {
  happy: face("arc", "M-6.4 1.6Q-3.5 4.3 -0.6 1.6"),
  listening: face("round", "M-4.2 2.6a.7 .7 0 1 0 1.4 0a.7 .7 0 1 0 -1.4 0"),
  thinking: face("up", "M-5.1 2.6H-1.9"),
  encouraging: face("arc", "M-5.8 1.9Q-3.5 3.7 -1.2 1.9"),
  curious: face("round", "M-5.4 2.6Q-3.3 3.3 -1.4 1.9"),
  proud: face("arc", "M-7.4 1.3Q-3.5 5.5 0.4 1.3"),
};

export const CHAPTERS = [
  { id: "power", en: "Power on", id_: "Menyala" },
  { id: "display", en: "Display", id_: "Layar" },
  { id: "hello", en: "Hello", id_: "Halo" },
  { id: "name", en: "Name", id_: "Nama" },
  { id: "apple", en: "Apple", id_: "Apel" },
  { id: "backend", en: "Backend", id_: "Server" },
  { id: "answer", en: "Answer", id_: "Jawaban" },
  { id: "practice", en: "Practice", id_: "Latihan" },
  { id: "bye", en: "Goodbye", id_: "Dadah" },
];

const ROCKER = [0, -60, 85];
const BELLY = [0, 60, 95];
const HEAD = [0, 25, 185];
const ESP = [12, 2, 88];
const AMP = [-12, 10, 55];
const SPEAKER = [0, 36, 44];
const APPLE_SEEN = [24, 90, 192];

export const SHOTS = [
  // 1 power on: the switch, then the power chain on the red cables
  { ch: "power", dur: 2.6, power: false, boot: 0, apple: "none", cam: { scene: "skin", theta: 200, zoom: 1 }, sub: S("narrator", "Toki is switched off. Its one 18650 cell sits behind a screwed battery door.", "Toki dalam keadaan mati. Satu sel 18650 ada di balik pintu baterai bersekrup.") },
  { ch: "power", dur: 1.8, power: true, cam: { scene: "skin", theta: 180, zoom: 2.4, focus: ROCKER }, sub: S("narrator", "The rocker switch on its back turns it on.", "Saklar di punggungnya menyalakan Toki.") },
  { ch: "power", dur: 2.6, lit: ["06"], packets: ["W1"], cam: { scene: "core", theta: 150, zoom: 1.7, focus: [10, -28, 72] }, sub: S("narrator", "Power flows from the cell to the charger,", "Arus mengalir dari sel ke modul pengisi daya,") },
  { ch: "power", dur: 2.2, lit: ["08", "11"], packets: ["W2"], sub: S("narrator", "through the switch,", "melewati saklar,") },
  { ch: "power", dur: 2.2, lit: ["05", "10"], packets: ["W3", "W4"], cam: { scene: "core", theta: 125, zoom: 1.6, focus: [-8, -10, 70] }, sub: S("narrator", "to the 5 V boost converter on the carrier board,", "ke penaik tegangan 5 V di papan pembawa,") },
  { ch: "power", dur: 2.8, lit: ["01", "02", "04"], packets: ["W5"], cam: { scene: "core", theta: 60, zoom: 1.15, focus: [0, 0, 125] }, sub: S("narrator", "which feeds the ESP32, the camera and the amplifier.", "yang memberi daya ke ESP32, kamera, dan penguat suara.") },
  // 2 the display wakes
  { ch: "display", dur: 2.6, boot: 1, lit: ["09"], packets: ["W8"], cam: { scene: "core", theta: 15, zoom: 3, focus: [0, 46, 95] }, sub: S("narrator", "The display wakes over I²C: the battery first,", "Layar menyala lewat I²C: baterai dulu,") },
  { ch: "display", dur: 3, boot: 2, face: "happy", cam: { scene: "skin", theta: 0, zoom: 3.2, focus: BELLY }, sub: S("narrator", "then Toki's face.", "lalu wajah Toki.") },
  // 3 hello
  { ch: "hello", dur: 1.3, step: "answering", face: "happy", cam: { scene: "skin", theta: 10, zoom: 1.35, focus: [0, 10, 125] } },
  { ch: "hello", dur: 3.4, step: "speaking", arcs: "speak", face: "happy", sub: S("toki", "Hi! I'm Toki. What's your name?", "Halo! Aku Toki. Siapa namamu?") },
  { ch: "hello", dur: 2.6, step: "speaking", arcs: "speak", cam: { scene: "core", theta: 20, zoom: 2.4, focus: SPEAKER }, sub: S("narrator", "The amplifier drives the 3 W speaker in the belly.", "Penguat menggerakkan speaker 3 W di perut.") },
  // 4 the child answers
  { ch: "name", dur: 2.6, step: "listening", arcs: "listen", face: "listening", cam: { scene: "core", theta: 330, zoom: 2.4, focus: [0, 30, 176] }, sub: S("child", "Rara!", "Rara!") },
  { ch: "name", dur: 1.6, step: "sending to backend", arcs: "wifi", face: "thinking", cam: { scene: "core", theta: 300, zoom: 2.4, focus: ESP }, sub: S("narrator", "The microphone's sound goes through the ESP32 to the backend over Wi-Fi.", "Suara dari mikrofon dikirim lewat ESP32 ke server melalui Wi-Fi.") },
  { ch: "name", dur: 3, step: "speaking", arcs: "speak", face: "happy", cam: { scene: "skin", theta: 20, zoom: 1.4, focus: [0, 20, 140] }, sub: S("toki", "Hello, Rara! Show me something!", "Halo, Rara! Tunjukkan sesuatu ke Toki!") },
  // 5 the apple
  { ch: "apple", dur: 2.6, apple: "in", face: "curious", cam: { scene: "skin", theta: 38, zoom: 1.9, focus: [16, 70, 190] }, sub: S("child", "Look, Toki!", "Lihat, Toki!") },
  { ch: "apple", dur: 3, step: "seeing", apple: "look", sub: S("narrator", "The camera behind Toki's left eye sees the apple.", "Kamera di balik mata kiri Toki melihat apelnya.") },
  { ch: "apple", dur: 3.2, step: "seeing", apple: "look", cam: { scene: "core", theta: 40, zoom: 2.5, focus: [18, 30, 196] }, sub: S("narrator", "The image travels from the lens over the flex to the ESP32-CAM, and on over UART.", "Gambar berjalan dari lensa lewat kabel fleksibel ke ESP32-CAM, lalu lewat UART.") },
  // 6 the backend
  { ch: "backend", dur: 3.6, step: "sending to backend", arcs: "wifi", face: "thinking", apple: "hold", cam: { scene: "core", theta: 300, zoom: 2.4, focus: ESP }, sub: S("narrator", "On the backend: speech recognition, computer vision and a language model.", "Di server: pengenalan suara, visi komputer, dan model bahasa.") },
  // 7 the answer
  { ch: "answer", dur: 2.2, step: "answering", cam: { scene: "core", theta: 15, zoom: 2.6, focus: AMP }, sub: S("narrator", "The answer comes back as speech: DAC, attenuator, amplifier, speaker.", "Jawaban kembali sebagai suara: DAC, peredam, penguat, speaker.") },
  { ch: "answer", dur: 3.4, step: "speaking", arcs: "speak", face: "curious", cam: { scene: "skin", theta: 22, zoom: 1.5, focus: [12, 50, 150] }, sub: S("toki", "An apple! Can you say “apple”?", "Apel! Coba bilang “apel”!") },
  // 8 practice: a near miss, gentle modelling, the word
  { ch: "practice", dur: 2, step: "listening", arcs: "listen", face: "listening", sub: S("child", "Appo!", "Apeu!") },
  { ch: "practice", dur: 1.3, step: "sending to backend", face: "thinking" },
  { ch: "practice", dur: 3.2, step: "speaking", arcs: "speak", face: "encouraging", sub: S("toki", "Almost! Listen: apple. Your turn!", "Hampir! Dengar ya: apel. Giliranmu!") },
  { ch: "practice", dur: 2, step: "listening", arcs: "listen", face: "listening", sub: S("child", "Apple!", "Apel!") },
  { ch: "practice", dur: 1.3, step: "sending to backend", face: "thinking" },
  { ch: "practice", dur: 3.2, step: "speaking", arcs: "speak", face: "proud", apple: "out", sub: S("toki", "Great job! You said “apple”!", "Hebat! Kamu bilang “apel”!") },
  // 9 goodbye and power off
  { ch: "bye", dur: 3, step: "speaking", arcs: "speak", face: "happy", apple: "none", cam: { scene: "skin", theta: 0, zoom: 1.2 }, sub: S("toki", "Bye-bye, Rara! Let's play again tomorrow.", "Dadah, Rara! Besok main lagi ya.") },
  { ch: "bye", dur: 2.8, power: false, boot: 0, cam: { scene: "skin", theta: 180, zoom: 2.4, focus: ROCKER }, sub: S("narrator", "Off again. The cell charges through the USB-C port with the switch off.", "Mati lagi. Sel diisi lewat port USB-C saat saklar mati.") },
  { ch: "bye", dur: 3, cam: { scene: "skin", theta: 330, zoom: 1 } },
];

export const APPLE = { seen: APPLE_SEEN, from: [40, 300, 150], away: [-40, 260, 230], r: 26, lens: [28.2, 45.6, 194.4] };
export const UI = { narrator: { en: "", id: "" }, toki: { en: "Toki", id: "Toki" }, child: { en: "Child", id: "Anak" } };
