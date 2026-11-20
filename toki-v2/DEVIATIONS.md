# Toki v2: departures from the brief

The brief is `REDESIGN.md`, plus sections 4 and 8–10 of `TOKI_3D_SPEC.md`. This file lists every departure, with its reason and, where an audit forced it, the audit line. Numbers not listed here are as typed in `model.mjs`. The panda build and its own departures are kept in `../toki-panda/`.

## Forced by the engine or an audit

| # | What | Why | Audit line |
|---|---|---|---|
| 1 | The pod's straight walls are flush tiles, about 28 × 34. The side walls are two tiles per cover per row, and each rounded corner is 2 chord pieces × 2 rows | A vertical flat over about 1000 mm² is born with more than 2 px² as it turns past edge-on (spec 5.4, limit 1). The outside sizes are unchanged | `continuity` (spec limit 1, kept from the panda build) |
| 2 | The rounded corners are 2 chords per quarter, not a true radius | Each chord is a convex prism. The 10 mm stuffing check runs on the same chorded outline | — |
| 3 | The body's embroidery seats are small flats (eyes and mouth Ø 14, swirls Ø 12). The decals are larger and lie tangent beyond them | A flat as large as the decal shows as a pale disc on the mint (its flat tone differs from the sphere's bands) | Seen in the 1× shots (`shots/v2/skin-*.png`) |
| 4 | Each wing root meets the body through a Ø 18 disc (first try Ø 24) | Ball-on-ball flush joints swap order by a fraction of a px² above about this size (spec 5.4, limit 2) | `swaps` (wing.L.root / body 0.55 px² at 222°, wing.R.root / body 0.52 px² at 48°) |
| 5 | The body is a sphere cut flat at z 25.4, standing on an upright band r 118 | The photos show a near-vertical bottom band. A sphere alone reads as a ball. The joint is flat-on-flat (spec 5.4, limit 3) | — |
| 6 | Platter r 120 (spec 100), housing r 128, degree ring r 121 → 127, label plate moved to (70, 112) | The band is Ø 236, so the platter grew to carry it. The label would otherwise sit on the larger housing | — |

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
- **Cheek glow colour.** A token per emotion (`--toki-glow-<emotion>`, light and dark). Speaking brightens the glow with the voice. The demo's boot shows dark, then pale, then the emotion.
- **Demo.**
  - "Display" is now "Cheeks".
  - Every hardware shot opens the pod.
  - A shot's focus may name a component; the camera then follows the component's centre in its own cover's frame.
  - The apple and the view cone follow the front cover in the hardware scene.
- **Removed.** The belly window, the rocker and charge-port recesses, the OLED faces, and clicking the rocker for power. The switch is under the plush. Power is `P` or the Power button.
- **Kept from the panda build.** Zoom, inspect, the full-screen viewport, the bilingual demo, the adaptive half rate, and the two-scene stack with one `__isoTurn` dispatcher.

## Reviewed crowding pairs (`TURN_CROWD` in `core.mjs`)

W5, W6, W7 × `pod.front.corner.L00`; W8 × `pod.front.corner.L10`; W6, W7 × `pod.front.corner.R10`; W5 × W8. Each is a cable end inside the closed pod, behind its walls, whose outline lines up with a corner chord (a slender solid) at one angle. Inside the closed pod nothing is seen. In the open pod the ends sit on their own shells.

## Open items

- The full orbit audits are the proof: `audit-skin.txt` and `audit-core.txt`.
- The speaker cone, surround and dust cap are not drawn. They face the front wall and no angle shows them.
