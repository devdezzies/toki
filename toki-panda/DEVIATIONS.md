# Toki — departures from TOKI_3D_SPEC.md

Every change from the brief, with the reason and the audit line that forced it. Numbers not listed here are as typed in `model.mjs`.

## Forced by the engine or an audit

| # | What | Why | Audit line |
|---|---|---|---|
| 1 | Large vertical flats are built from flush pieces: carrier board in 6 (cuts at x 0, z 57.94, 83.34), ESP32 PCB and ESP32-CAM PCB in halves (x 0), cradle spine in 2 (z 62), speaker grille in 3 strips (z 36.5, 51.5, cut between slots), speaker rim Ø40 as two half-disc prisms | A vertical flat over ~1000 mm² is born with more than 2 px² as it turns past edge-on (the limit of 5.4.1). Outside sizes and positions unchanged | `continuity` (birth 78.7, 31.6, 24.0, 20.8 px² on board, grille, ESP32 PCB, rim) |
| 2 | Speaker basket is a cylinder r 15 (y 34 → 44), not a cone | A steep frustum's tone bands appeared in one step | `continuity` (birth 49.6 px² at 83.5°) |
| 3 | Roof H: the two 94 mm beams are three flush segments each (x −47/−16/16/47); the centre beam is two pieces (y −14 → −9 and −3 → 14) leaving a slot for the carrier board's top edge | A long diagonal's screen box overlapped parts it never covers and held the paint order wrong until a real overlap appeared; the board passes through the centre beam's position | `swaps` (frame.upright.R / c05.pcb 4.64 px²) |
| 4 | Board uprights end at z 111 (spec 112) | Level with the rear beam's top they swapped order at one angle | `swaps` (frame.beam.rear / frame.upright.L 0.48 px²) |
| 5 | TP4056 PCB is two flush pieces (y −50 → −44 under the USB-C shell, and −44 → −22) | A real cycle: USB shell → rear panel → cradle spine → PCB | `cycles` |
| 6 | Head-plate side clip block is two blocks split at the plate's top face (z 181) | It wrapped the plate edge in depth, forming a cycle with the eye arm | `cycles` |
| 7 | Speaker lug strip sits on the magnet's back face (y 23 → 26, z 43 → 46); W9 runs at z 44.5 | On the rim's back face it formed a cycle with rim and basket at exactly 45° and 225° | `cycles` |
| 8 | Boost-converter PCB starts at x −27.6 (spec −28); within the ± 0.5 mm target | Tried while chasing #3; kept | — |
| 9 | Boxes have sharp corners (plan radius 0) except the USB-C shell (r 1.2) and OLED glass (r 0.2) | A 0.3 mm corner radius made 12 side faces per box and doubled the live element count | `turn-check --perf` |

## Frame parts added (7.1 gives no path to ground or no fitting for these)

Every live part must reach ground through contacts, and every vertical/horizontal cable turn must happen inside a shell or a clip block on the frame (7.3). These parts are not components:

- `frame.rail.L/R` 4 × 6 × 38 at x ±(18 → 22), y −52 → −14, z 102 → 108: tie the rear panel to the rear roof beam.
- `frame.bracket` x ±18, y 46 → 50, z 66 → 79: carries the bezel on the grille.
- `frame.grille.foot.L/R` 4 × 2 × 4 under the grille, on the floor.
- `frame.clip.rear` (x −9 → 12.5, y −29 → −20, z 86 → 96, on the cradle spine), `frame.clip.board` and `frame.clip.board2` (on the carrier board's rear face): where W2, W3 and W4 turn between vertical and horizontal.
- `frame.clip.side.a/b` (x 28 → 36, y −10.5 → 7, z 161 → 196, on the head plate's edge): W5 and W6 turn here to reach the ESP32-CAM above the plate.
- Spine clips: `c0` z 117 → 141 (24 tall, so the jogs from the header positions to the cables' lanes sit at least 6 r from any visible cable), `c1` z 146 → 151, `c2` x ±12, y −14 → −3, z 160 → 179 (the clip block under the head plate).
- `frame.camclip.*`: each slotted block is two jaws (a slot is concave).
- `frame.eyearm`, `frame.socket` (backing plate behind the lens module), `frame.micarm`, `frame.micseat` (Ø7 disc on the mic's back): shapes for the arms named in 7.1.
- Battery cradle as an open skeleton: riser, base, cap, spine (two pieces), one pair of fingers.
- Board-upright grooves are drawn as two lines on the upright's inner face (a groove is concave; the board's edge sits flush on that face).

## Connector headers and terminals added to components (so every cable ends straight on a mount)

- Carrier board: top-edge headers 3/5/2/2/4-pin at x −21, −8, 2.5, 9, 19; the W8 header stands 8.5 tall so its cable leaves from its side; the bottom connector sits on the board's rear face at the bottom edge (x −4.5 → 5.5, z 30 → 33), so W3 and W4 come straight down onto it.
- TP4056: a pad header across its +Y end (B+, B−, OUT+, OUT−).
- Battery: `c06.conn` on the cradle spine.
- PAM8403: output terminal `c04.term`. OLED: 4-pin header 9 tall on its top edge. ESP32-CAM: 4-pin header on its rear face for W5 and W6. Speaker: lug strip with two lugs (#7).

## Cable routes (7.3 fixes ends and rules, not paths)

- W1 is a short straight run between the TP4056 pad header and the cradle connector (visible about 1.5 mm).
- W5 and W6 turn in the clip block under the head plate as required, then run under the plate to the side block, which brings them above the plate to the ESP32-CAM's rear header. W7 leaves the same block past the spine's left side and runs under the plate to the microphone.
- Every hidden turn sits at least 6 r inside its fitting, and the cable's own visible runs never cover it on screen. The turn audit's `folds` counts a corner as visible when the cable's own shell or run covers it.
- Tubes are chunked at up to 24 mm with a turn break every 40° (spec guide: 6) to stay inside the weight budget. `order`, `rigid` and `routes` pass with these chunks.
- Crowding pairs reviewed in 4× close-ups and listed in `core.mjs` (`TURN_CROWD`): W9 × frame.post.Lf, W8 × c01.hdr.t, W5 × c02.sd, W3 × c06.cell, W3 × frame.panel.bottom, W7 × frame.spine, W1 × c06.cell, W7 × c01.hdr.t, W8 × frame.upright.L. Each is a cable end on its own shell, or a straight run, lining up with a slender part far behind it at one angle.

## Components

- Switch: the bezel 17 × 12 fills the rear-panel opening (y −52 → −50) and the rocker stands 2 proud (y −54 → −52), so its extent is y −54 → −37 (spec −52 → −37). Its face then sits at the bottom of the skin's 6 mm recess (y −54).
- ESP32-CAM: PCB y 5.75 → 7.35; shield can on the rear (y 3.75 → 5.75); microSD cage and flex connector on the front, all inside the 4.5 depth; its cable header reaches y 2.75 (1 mm behind it).
- TP4056 PCB is 0.8 thick so the 3.2 USB-C shell fits in the 4 mm height; the shell reaches y −52 through the panel.
- Speaker cone, surround and dust cap are not drawn: they sit behind the solid grille and inside the rim, and no angle shows them. The speaking step lights the speaker instead of moving its cone.
- Drawn as flat detail on their boards rather than as solids (to keep the scene's weight at ~230): PAM8403's four chip capacitors, the attenuator (two resistors and a capacitor), the charger's two LEDs and SOT-23-6 pair, the ESP32's two tact buttons, the boost converter's SOT-23 chip and diode.
- Perfboard holes on a 5.08 grid (every other 2.54 hole) for paint cost.
- No other chip on the ESP32 beyond the parts listed in 6.3.

## Page and behaviour

- Two `TURN.mount`s on one page: both scenes are mounted (stacked, crossfaded by opacity), and `window.__isoTurn` is replaced after mounting by a dispatcher to the scene on show. For the skill's checks, `build.mjs --page=skin|core` writes a single-scene page with the live layer as a direct child of the stage.
- With nothing selected in Hardware, the OLED module (09) is the lit accent, so exactly one accent is lit at every moment.
- Dark theme: the white plush (head, muzzle, torso.lower) takes a lighter tone ramp so the panda still reads black and white.
- A front index notch is engraved on the platter rim, pointing at the ring's 0 under the fixed pointer at θ = 0.
- The belly window, rocker and charge port recesses are drawn by `live.js` each frame inside `torso.lower` (opening, visible inner walls shaded by facing, bottom face with its content, clipped to the opening and faded with facing), because their clip changes with θ. The audits do not see them; the line check does.
- Adaptive half rate in the loop (3d.md, section 15).

## Added after the brief: zoom, disassembly, inspect

- **Disassembly (Hardware).** The scene has four slide groups under the turntable group, plus the core, which stays:

  | Assembly | Moves | Holds |
  |---|---|---|
  | `rear` | −Y 60 | rear panel, rails, switch, charger, the three power clip blocks, W1–W4 |
  | `battery` | (0.6, −0.8) 60 | cradle and cell |
  | `front` | +Y 60 | bezel, lens, bracket, grille, speaker, OLED |
  | `head` | +Y 70 | head plate and everything on it, ESP32-CAM, lens, flex, mic |
  | core | stays | frame, carrier board, ESP32, PAM8403, boost converter, W5–W9 |

  - One explode value e drives them through `apartAt` (`model.mjs`), a pure function with staggered smoothstep shares (offset 0.15, span 0.55), used by the build's poses, the audit's clips and the page.
  - The head slides forward rather than up: lifting it would sweep the head plate through W5/W6's connectors, which sit above the plate (`unseparated` and `posed` on the first try).
  - Free cable ends, deliberate: W1 at the cradle; W3 and W4 at the board's bottom connector; W5, W6 at the ESP32-CAM header; W7 at the mic; W8 at the OLED header; W9 at the speaker lugs. Each end's shell stays with its cable.
  - The power clip blocks (`frame.clip.rear`, `frame.clip.board`, `frame.clip.board2`) go with the rear assembly, because the rear assembly's cables turn inside them.
- **Readout.** While the hardware is apart or moving, a phase word follows the scene: `taking apart`, `apart`, `closing up`. This extends 9.3's format. Long readouts wrap instead of running into the hint.
- **Zoom.** One viewBox is written to every SVG in the stage, from 1× to 6× (inspect may go to 10×). The scenes remount when zoom settles, so round parts are sampled for the new size. Inputs: pinch or Ctrl+wheel, +/−/0, double-click, Shift+drag to pan.
- **Inspect.** Every part except the selected component's own fades out, the static base fades to 15%, and the camera fits the component and follows its centre as it turns. Escape, I or Fit leaves inspect.
- **Reviewed crowding pairs**, added with the free ends: W9 × frame.upright.R/L, W6 × frame.spine, W5 × frame.spine, W8 × frame.upright.R, W3 × frame.rail.L, W1 × W3.
- `c01.reg` moved to x −13.5 → −7, z 74 → 77.5 (no position in the brief) to clear a 0.37 px² swap with the USB socket.

## Added after the brief: full-screen viewport and the product demo

- **Full-screen layout, not a card (replaces 9.3's plate on the main page).** The viewport fills the window beside a 300 px left sidebar of collapsible panels: Demo, View, Hardware, Components (the 11 numbered parts), Legend and About (9.5's caption). `T` or the ☰ button collapses the sidebar; on phones (≤ 760 px) it is a bottom drawer. 9.3's four card corners become viewport overlays: Fig 1 and the title at top left, a view strip (Front · Side · Back, − Fit +) at top right, the hint at bottom left and the readout at bottom right. The `--page=skin|core` check pages keep the plate so the skill's checks still run.
- **The viewBox follows the viewport, with no letterbox.** The 720 × 560 composition is centred and widened or heightened to the viewport's aspect, then zoomed and panned from there. A `ResizeObserver` rebases the camera and remounts the scenes for the new size.
- **A preset, non-interactive product demo replaces the chat simulation and the idle tour.** `demo.mjs` holds one 74 s story in 29 timed shots across nine chapters: Power on, Display, Hello, Name, Apple, Backend, Answer, Practice, Goodbye. It loops. `demo.js` plays it as a pure function of time, so play, pause, chapter jumps and `window.__tokiDemo.seek(t)` all land on the same picture. The words are bilingual subtitles (EN / ID) in the viewport, outside the drawing, and timings are never shown. The story is invented for the figure; the backend is not simulated, only narrated. There is no network, speech recognition or language model.
  - **Power on.** The rocker flips. The power chain lights in turn (cell 06 → charger 08 → switch 11 → boost 05 and carrier 10 → loads 01, 02, 04), with packets on W1 → W2 → W3/W4 → W5.
  - **Display.** The OLED boots over W8: the battery icon first, then the face.
  - **Steps.** The rest runs 9.6's step names, lit as in the pulse:
    - listening: mic, W7, arcs toward the mic
    - seeing: lens, flex, ESP32-CAM, W6
    - sending to backend: ESP32, Wi-Fi arcs from the antenna
    - answering: DAC, attenuator, PAM8403, W9
    - speaking: speaker, OLED, arcs from the speaker
  - **Faces.** The OLED face follows the story: happy, listening, thinking, curious, encouraging, proud.
- **Directed camera.** Each shot can carry a keyframe (scene, θ, zoom, focus point in the turn group's frame), eased more slowly than a user's input. Any drag or zoom turns Follow off and leaves the camera with the viewer while the story plays on. `F` or Follow hands it back.
- **The apple.** A page-drawn apple (not a solid in the scene) floats 140 mm in front of Toki's left eye, at (24, 90, 192), in the turn group's frame:
  - It has a radial gradient, a stem, a leaf and a highlight, and is scaled by the camera.
  - It is drawn over the doll while its side faces the viewer, and under the live parts otherwise.
  - While Toki looks, a translucent view cone runs from the lens (28.2, 45.6, 194.4) to the apple's limb and fades toward the apple.
  - It leaves with sparkles when Toki praises the child.
  - In Hardware it shows only while the camera looks at it, and fades as the story moves on.
  - Red, leaf, stem and cone are theme tokens (`--toki-apple*`, `--toki-cone`). Colour is the subject here.
- **Packets and arcs.** Packets ride inside their cables' own tube chunks, so they are hidden in shells and clips. Arcs fade at both ends and are marked `data-free`. Under reduced motion there is no autoplay, and Play cuts between shots with no packets, arcs or eased camera.
- **Keys and sound.** `Space` plays and pauses the demo; the manual pulse is gone. The Sound toggle (off by default) reads Toki's lines with browser text-to-speech (`en-US` / `id-ID`).
- **Readout.** It carries the step name in 9.3's step slot, plus `power off` while the doll is off.
- **Frame time.** Measured during the demo in headless Chrome at 1440 × 900: median 18.8 ms, p95 29 ms.

## Notes (not departures)

- The mouth at z ≈ 163 is hidden by the muzzle from the 30° camera at every angle; it is drawn where the brief puts it.
- The OLED window is 10 deep behind an 11-high opening, so from 30° above most of the opening shows the recess floor and the top of the screen.

## Open items

- `turn-check --order` on the Skin page reports `head over muzzle` 4–11 px at 2× between θ 21° and 36°. The runtime order is right (muzzle after head) and the separating plane is the seat flat. The painted muzzle cap is about 0.5 px inside its recorded shape (2178 vs 2380 px at 2×), so the z-buffer sees a thin crescent of muzzle where the head is painted. The geometry is Appendix A's; the orbit audit's ray-cast `depth` line passes.
- Frame time: on this machine the skill's own `turning-dial` example measures a 17.2 ms task at 1440 px; Toki's Hardware scene measures 17.6 ms and Skin 11.4 ms. The phone-profile budget (33 ms) is not met on this machine for Hardware.
