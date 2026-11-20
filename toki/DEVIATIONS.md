# Toki v3: departures from the brief

The brief is `TOKI_3D_SPEC.md` (v3). `REDESIGN.md` is the v2 history. This file lists every departure, with its reason and, where an audit forced it, the audit line. Numbers not listed here are as typed in `model.mjs`. v2, as it stood before the v3 measurements, is kept in `../toki-v2/` (with its spec as `TOKI_3D_SPEC.v2.md`); the panda build and its own departures are in `../toki-panda/`.

## v3: measured from the photos

| # | What | Why | Audit line |
|---|---|---|---|
| 1 | Every exterior number derives from `MEASURES` in `model.mjs`. Today every value comes from the photos in `doll-design/`, scaled to a 260 mm girth | The real doll has not been tape-measured. Replacing a value with a taped one (`source: "tape"`) updates the figure, and `check()` says whether the pod still fits. Accuracy is about ±3 mm for the body and ±5 mm for the face and wings | — |
| 2 | The care tag is at +95° (the left side seam), z 46 | `front.jpeg` shows it on the doll's left. `back.jpeg` shows it on the right, apparently mirrored. The front photo was taken as the reference | — |
| 3 | `wingT` (24) and `wingTwist` (30°) are estimates | No photo shows a wing exactly edge-on or face-on. The twist comes from which wing shows its face in `side.jpeg` and `side-l.jpeg` | — |

## Forced by the engine or an audit

| # | What | Why | Audit line |
|---|---|---|---|
| 4 | The pod's straight walls are flush tiles. The front and rear walls are 5 × 3 tiles (columns x −60, −36, −12, 12, 36, 60; rows z 32.5, 63, 93, 130), and the side walls are two tiles per cover per row. Each rounded corner is 2 chord pieces × 2 rows | A vertical flat over about 1000 mm² is born with more than 2 px² as it turns past edge-on (spec 5.4, limit 1). The outside sizes are unchanged | `continuity` (spec limit 1, kept from the panda build) |
| 5 | No front-wall column boundary at x ±20 (first v3 grid: −60, −40, … 60) | A tile boundary within 0.5 mm of the speaker rim's edge (r 20) made two hidden tiles swap order | `swaps` (`pod.front.wall.32 / pod.front.wall.42` 4.74 px² at sweep 136.548, closed and open; with it, `mount.post.2 / c08.boot` 0.54 px² at sweep 14.016). Both gone on the new grid |
| 6 | The rounded corners are 2 chords per quarter, not a true radius | Each chord is a convex prism. The 10 mm stuffing check runs on the same chorded outline | — |
| 7 | The body is one vertical lathe (the measured profile), with no seats under the embroidery. The decals lie tangent to the body at `onBody` / `normalAt` | A lathe takes no flats. A vertical lathe in the turn group is a fixed picture, so it is nearly free. It replaces v2's sphere-on-band | Quick skin audit: `audit passed`, no turn problems |
| 8 | Each wing is two r 21 balls (root and tip), not a slab cut to the measured outline | A slab's faces (about 2400 mm²) break limit 1. Split into flush pieces they pass, but the kit strokes every piece's outline, and the wing read as segmented. r 21 keeps each ball's side flat about 930 mm². The tip ball is placed so that, seen square from the front, its top and outer edge match the outline (219.8, ±141.7) | Limit 1 (spec 5.4), not audited on the slab. The split slab was judged in a 4× close-up (that capture was later overwritten by the ball version, `shots/v3/wing-zoom.png`) |
| 9 | Each wing root touches the body through a flat tangent to it, not a flush cut disc. The root–tip joint is a Ø 25.0 disc | A ball-on-body flush disc over Ø 18 swapped order in v2 (spec 5.4, limit 2), and Ø 18 is too small for the measured wings. A tangent flat avoids that joint. The two r 21 balls pass with Ø 25 | v2: `swaps` (wing.L.root / body 0.55 px² at 222°); v3 quick: `swaps: 0` |
| 10 | Platter r 120, housing r 128, degree ring r 121 → 127, label plate at (70, 112), as in v2 | They were sized for v2's Ø 236 band. The measured foot is Ø 190; the girth (Ø 260) overhangs the platter, as before | — |

## v3 hardware refit (the pod inside the measured body)

| # | What | Why |
|---|---|---|
| 11 | Pod x ±68, y −20 → 76, corner radius 8, z 30 → 132.5 (v2: x ±70, y −20 → 86, corner radius 14, z 30 → 137) | The measured body is 23 mm lower. v2's pod sits only 2.5 mm inside it. This is the largest such box that keeps 10.3 mm of stuffing (`check()`) while its flat front wall still reaches x 60, which the turret at the eye (x 51.3) needs |
| 12 | Camera turret r 5.9 (v2: 7) | The boss, centred on the lens at z 124, must end below the lid at z 130 |
| 13 | Microphone at x −30 (v2: −36) | The front wall is 10 mm further back. W5's two 45° bends of radius 10 r need two straight runs of ≥ 10.8 between them, and x −36 leaves too little |
| 14 | Amplifier 2.5 mm higher (`AMP_DZ`) | The speaker is centred behind the measured mouth (z 88.5). Raising the amplifier keeps its terminal level with the lug strip, so W6 is still one straight run |
| 15 | Lid clips z 118 → 130 (from 7 below the pipes to the lid); the camera board, flex, glands, pipes, LED boards and W7/W8 all follow the measured eye and swirls | Derived, not typed: `CAM`, `PIPE`, `SPEAKER`, `MIC` and the routes read `model.mjs` |

## Added parts (the brief gives no path to ground or no fitting for these)

- **Display posts.** `mount.post.0–2` are Ø 6 rounds from the platter to the pod's floor. They are not product parts: the hardware view removes the stuffing that holds the pod, so something must stand it on the turntable. The caption says so.
- **Hub clips.** `pod.floor.clip.L/R` each have a riser and two jaws on the floor, holding the hub board's ends.
- **Lid clips.** `pod.clip.L/R` are blocks under the front lid where W7 and W8 turn from vertical to horizontal. Every vertical/horizontal turn happens inside a fitting (spec 7.3).
- **Battery bay.** `pod.bay.*`: end plates, two low rails and a lid with two screws, open at the sides so the cell shows.
- **Connectors.** Hub power header on the rear face (W3, W4); microphone and LED headers on the top edge (W5, W7, W8); the amplifier's screw terminal (W6); the charger's in and out pad headers (W1, W2, W4); the switch's terminal block (W2, W3); the speaker's lug strip; the XIAO's camera connector (the flex).
- **Under-floor parts.** The USB-C receptacle, its silicone plug and the switch boot hang under the floor. The drawing omits each part's short pass-through inside the 2.5 mm floor.
- **Camera flex.** Three flat strips: down from the module board, across in a horizontal ribbon at z 96, and down onto the XIAO's camera connector. Two folds; the brief allows one, but a straight diagonal strip cannot land square on both boards.

## Disassembly

| Assembly | Moves | Holds |
|---|---|---|
| `front` | up and a little forward, (0, 0.24, 0.97) × 120 | The front cover's walls, corners, lid and tabs; turret, glands, pipes, lid clips; camera (window, board, flex), microphone, speaker, LED boards; W5–W8 |
| `rear` | −Y 90 | The rear cover's walls, corners, lid and tabs |
| core | stays | Floor, posts, battery bay and cell, charger, switch, hub, XIAO, amplifier, W1–W4 |

- **Why up.** The first version slid the front cover forward (0.9, 0.45 × 80). It hid the hub's face (XIAO, amplifier) from every front angle, and the cover's own inside from most angles. Lifting it shows the hub from the front and the cover's inner face from behind.
- **Free ends.** These come away from their mounts when the cover lifts:
  - W5 at the microphone header
  - W6 at the amplifier terminal
  - W7, W8 at the LED headers
  - the flex at the XIAO's connector
  
  Each end's shell stays with its cable.
- **Auto-open.** Picking a component inside the pod (legend, arrow keys, inspect) opens the pod.

## Page and behaviour (kept from the panda build, adapted)

- **Lit accent.** In Skin the cheek glow is the one accent; with power off it fades out in 200 ms. In Hardware it is the selected component, or the cheek lights (LED boards and pipes) when nothing is selected.
- **Cheek glow colour.** A token per emotion (`--toki-glow-<emotion>`, light and dark). Speaking brightens the glow with the voice. The demo's boot shows dark, then pale, then the emotion. v3: the glow disc is r 23, sized to the measured Ø 40 swirl.
- **Demo.**
  - "Display" is now "Cheeks".
  - Every hardware shot opens the pod.
  - A shot's focus may name a component; the camera then follows the component's centre in its own cover's frame.
  - The apple and the view cone follow the front cover in the hardware scene.
  - v3: the face and cheek focus points derive from `FACE`, and the cheek shot turns to θ 48 (v2: 40) because the swirls moved from 58.5° to 66°.
- **Voiceover (v3).** The demo's `Sound` plays ElevenLabs clips for all three speakers in EN and ID, in place of the browser's speech synthesis for Toki only (spec 9.7).
  - **Voices.** `eleven_multilingual_v2` with three of ElevenLabs' built-in voices: George `JBFqnCBsd6RMkjVDRZzb` (narrator), Jessica `cgSgspJ2msm6clMCkdW9` (Toki) and Laura `FGY2WhTYpPnrIDTdsKH5` (the child).
  - **Why built-in voices.** The API key in use has no `voices_read` permission, so the account's own voices could not be listed. There is no child voice among the built-in ones; Laura, a young, upbeat voice, stands in.
  - **Timing.** Voiced shots stretch to their longer clip, and the demo grows from 75.3 s to 110.5 s.
  - **Clock.** The clips follow the demo's clock: a clip that starts late while decoding is moved back within 0.3 s.
- **Removed.** The belly window, the rocker and charge-port recesses, the OLED faces, and clicking the rocker for power. The switch is under the plush. Power is `P` or the Power button.
- **Kept from the panda build.** Zoom, inspect, the full-screen viewport, the bilingual demo, the adaptive half rate, and the two-scene stack with one `__isoTurn` dispatcher.
- **Single-scene pages.** `toki-skin*.html` draw the body in the kit's default tones, not mint. The mint tokens in `toki.css` key on `.toki-scene`, which only the full page has. Unchanged from v2.

## Reviewed crowding pairs (`TURN_CROWD` in `core.mjs`)

W5, W6, W7 × `pod.front.corner.L00`; W8 × `pod.front.corner.L10`; W6, W7 × `pod.front.corner.R10`; W5 × W8. Each is a cable end inside the closed pod, behind its walls, whose outline lines up with a corner chord at one angle. Inside the closed pod nothing is seen. In the open pod the ends sit on their own shells.

v3 adds W7 × `pod.front.corner.R00` (inside the closed pod, θ 117°), and W6 × `L10`, W8 × `L00`, W5 × `L10` (θ 246°, early in the close clip, with the ends on their shells inside the lifted cover; `shots/v3/crowd-close-4x.png`). The quick run flagged them at 4.4–5.0 px.

## Open items

- The full orbit audits are the proof: `audit-skin.txt` and `audit-core.txt`.
- The speaker cone, surround and dust cap are not drawn. They face the front wall and no angle shows them.
- Replace the photo values in `MEASURES` with tape measures of the real doll, then rebuild and re-audit.
