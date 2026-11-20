# Toki — interactive 3D product model (v3: the mint winged plush measured from the photos, with a sealed pod)

This file is the complete brief. Every dimension, part, position, cable, string and rule the figure needs is written here, and every number matches `toki/model.mjs` (or, where `model.mjs` is silent, the scene file named in the text). Where this file says nothing, apply the skill's own rules (`SKILL.md`, `references/3d.md`, `references/craft.md`, `references/motion.md`, `references/verify.md`).

The first design, a seated panda on an open 3D-printed frame, is kept with its own brief and departures in `toki-panda/`. Section 14 says what changed and why.

---

## 1. Instructions to the builder

1. Read `SKILL.md`, `references/3d.md`, `references/craft.md` and `examples/turning-dial/build.mjs` before writing geometry.
2. Size: **Hero**. Tell the user the estimate (about 3–5 hours, including two background orbit audits), then build without waiting.
3. Type every number once, in `toki/model.mjs`, copied from this file. Geometry, readout, legend, demo and caption import from it.
4. Follow the numbers here exactly. If the engine or an audit forces a change, make the smallest change that passes and record it in `toki/DEVIATIONS.md` (what, why, which audit line). Never adjust silently.
5. Add no components, cables, labels, pin numbers, voltages, capacities, timings or percentages that are not in this file.
6. Output: standalone framework-free HTML. Design the light theme first; ship the dark theme too.

**Accuracy target.** Positions and sizes in the figure match this file within ± 0.5 mm in model space, except where `DEVIATIONS.md` says otherwise. The exterior is a smooth sphere-and-round rendering of a plush toy; fur and fabric texture are not drawn.

---

## 2. The product

**Toki** is a round mint plush for children aged 3–6 who are at risk of speech delay. It is a soft dome, wider than tall, on a short bottom band, with two white quilted wings on top. It is 260 mm wide and 187 mm tall (220 mm to the wing tips), widest 75 mm above the table, and Ø 190 mm where it stands. These numbers are measured from the reference photos in `doll-design/` (5.0). Its face is embroidered: orange-ringed eyes, an open smile with a pink tongue, and a white swirl on each cheek. It has panel seams and a care tag. It has no limbs, no muzzle and no screen.

Toki talks with the child. It listens through a microphone, sees through a camera that looks out through the pupil of its left eye, and sends sound and images over Wi-Fi to a backend (speech recognition, computer vision, a language model). It answers through a speaker behind its mouth. Two cheek lights glow behind the swirls in the colour of Toki's mood and battery state. A parent app tracks vocabulary, mood and screening results. The app and the backend are not part of this figure.

Because it is a toy for small children, every hard part sits in **one sealed, flame-retardant pod** inside the stuffing, with at least 10 mm of stuffing all round it. The battery is behind a screwed lid inside that pod. The USB-C port and the power switch are reached through a zip in the bottom panel. No cable leaves the pod.

---

## 3. The figure

**Object.** Toki on a small inspection turntable with an engraved degree ring, as a product is presented for review.

**One figure, two scenes.** They share one camera, one static base and one turn angle:

| Scene | Shows |
|---|---|
| **Skin** | The plush as the child sees it |
| **Hardware** | The same plush with fabric and stuffing removed: the sealed pod on three display posts, which opens into a front and a rear cover around 10 components and 8 cables |

**What moves, and what it means**

| Motion | Meaning |
|---|---|
| Toki turns on the turntable | Front, side and back become one object; every part can be found from any side |
| Skin ↔ Hardware swap | Where each component sits inside the plush |
| Open pod (front cover lifts, rear cover slides back) | What is inside the sealed pod, and which parts belong to which cover |
| Power | The power chain: cell → charger → switch → hub (fuse, VBAT bus) → loads |
| The demo (one end-to-end story) | Voice and image in, speech and cheek colour out |

**Lit accent** (exactly one at a time):
- in Skin, the cheek glow;
- in Hardware, the selected component, or the cheek lights (LED boards and pipes) when nothing is selected.

---

## 4. Units and axes

- **1 world unit = 1 mm.**
- Origin: the centre of the plush's bottom panel, on the top face of the turntable platter.
- **+X** = the doll's left (the viewer's right when the doll faces the viewer).
- **+Y** = the doll's front.
- **+Z** = up.
- Turn value **θ = 0°** presents the front to the viewer. Positive θ brings the doll's left side toward the viewer. Named views: front 0°, left side 90°, back 180°, right side 270°.
- The camera sits at azimuth 45°, so the turn group's value is θ − 45 (`groupOf`, `thetaOf`).

All coordinates below are `(x, y, z)` in millimetres in this frame, at θ = 0°. `s` is +1 for the doll's left and −1 for its right.

---

## 5. Exterior (Skin scene)

### 5.0 Measurements (the doll-design photos)

Every exterior number comes from one table, `MEASURES` in `model.mjs`. Each entry carries its source. Today every source is a photo in `doll-design/`, because the real doll has not been measured yet. To use tape-measured values, change the entry's `value` and set `source: "tape"`; everything below is derived from it. Then rebuild: `check()` and both audits say whether the pod still fits.

**How the photo values were taken (v3).**
1. Each photo was drawn into a canvas in headless Chrome. The pixels were classed by colour:
   - the body (green ≥ red, which includes the shaded gusset);
   - the white wings;
   - the orange rings, the black iris and pink.
2. A turned profile (an elliptical foot-to-girth curve below, an elliptical dome above) was fitted to the silhouette widths, row by row, of `front.jpeg`, `back.jpeg` and `side.jpeg` together.
   - Each photo's camera elevation was a free parameter of the fit; it came out at 16.6°, 21.8° and 17.2°.
   - The fit's RMS error is 4 mm.
3. Everything is scaled so that the widest girth is 260 mm.
4. Feature positions were solved on that profile, from the front photo's pixel positions and its fitted camera elevation. Offsets measured straight sideways were turned into azimuths with `asin(x / r(z))`. The side photos (camera at about −50° and +60°) located the swirls, the side seams and the wing twist.

Accuracy is about ±3 mm for the body and ±5 mm for the face and wings, limited by photo perspective. The values the side photos disagree on are marked "estimate" in `MEASURES`.

| Measure (`MEASURES`) | Value | Source | To measure on the real doll |
|---|---|---|---|
| `width` | 260 | scale | Widest girth, side to side (sets the scale) |
| `height` | 187 | front, back, side | Top of the head above the table, without wings |
| `widestZ` | 75 | front, back, side | Height of the widest girth |
| `footD` | 190 | front, back, side, down | Diameter where the bottom panel meets the table |
| `bandTop` | 22 | front, back, side | Height of the gusset seam |
| `eyeZ`, `eyeX` | 124, 51.3 | front | Eye centre height; half the eye-to-eye distance, measured straight |
| `eyeRing`, `eyeIris` | Ø 39.5, Ø 26.5 | front, side-l | Orange ring outer diameter; black iris diameter |
| `mouthZ`, `mouthW`, `mouthH` | 88.5, 42, 35 | front | Mouth centre height; width and height outside the orange rim |
| `swirlZ`, `swirlAz`, `swirlD` | 125, 66°, Ø 40 | front, side, side-l | Swirl centre height; degrees round from the front; diameter |
| `seamAz` | ±90° (and 180°) | side-l, back, down | Side seams, degrees round from the front |
| `wingRootX` | 88 | front, back | Where a wing's root meets the body, straight sideways from the middle |
| `wingOutline` | 24 points; top 219.8, outer edge 141.7 | front | The wing's outline seen square from the front |
| `wingCurl` | (121, 182) | front | Centre of the quilted curl, seen square from the front |
| `wingT` | 24 | front, side (estimate) | Wing thickness |
| `wingTwist` | 30° | side, side-l (estimate) | How far a wing's face turns from facing straight ahead toward facing outward |
| `tagZ`, `tagAz` | 46, +95° | front (back.jpeg disagrees) | Where the care tag is sewn |

Compared with v2, which was read by eye: the body is 23 mm lower (187, not 210) and its dome flatter. It stands on a Ø 190 foot, not a Ø 236 band, and the gusset seam is at 22. The eyes are larger (Ø 39.5) and 4 mm lower. The mouth is 2.5 mm higher and larger. The swirls are larger (Ø 40) and further round (66°). The side seams are at ±90°, not ±112°. The wings are bigger, lean out past the body's sides and are turned front-outward. The care tag is on the left side seam, not at the back right.

### 5.1 Envelope

| Measure | mm |
|---|---|
| Width (widest girth, at z 75) | 260 |
| Height of the body (crown) | 187 |
| Top of the wings | 219.8 |
| Outer edge of the wings | ±141.7 |
| Foot on the platter | Ø 190 |
| Gusset seam | z 22 (r 119.76) |
| Front of the body | y = +130 at z = 75 |

### 5.2 Solids

Seven parts. The body is one vertical lathe, and every other solid meets it, or its neighbour, flush or tangent.

```js
const BA = 130, BZM = 75, BCU = 112, BRB = 95;                    // from MEASURES
rAt(z) = z ≥ BZM ? BA·√(1 − ((z − BZM)/BCU)²)                     // the dome
                 : BRB + (BA − BRB)·√(1 − ((BZM − z)/BZM)²)        // the foot
BODY_PROFILE = [[0, 95], [22, 119.76], [75, 130], [187, 0]]        // lathe knots; radius and slope are analytic
```

| Part | Primitive | Geometry | Flats or ends | Colour |
|---|---|---|---|---|
| `body` | `T.lathe`, axis Z at (0, 0), `radius: rAt`, `slope: slopeAt` | `BODY_PROFILE`, z 0 → 187; the gusset seam is a ring detail at z 22 | Flat foot Ø 190; closed crown | mint |
| `wing.L.root`, `wing.R.root` | `T.ball` | r 21, centre (s·99.78, 0, 172.31) | A flat tangent to the body at (s·88, 0, 157.44): the contact. `cut(root, tip)[0]`. Side flats ±A at 12 | white |
| `wing.L.tip`, `wing.R.tip` | `T.ball` | r 21, centre (s·120.70, 0.03, 198.80) | `cut(root, tip)[1]`. Side flats ±A at 12 | white |
| `tag` | `T.prism` | 22 wide × 30 long × 0.8 thick flap, its back face tangent to the body at z 46, azimuth +95°, hanging 24 below that point and reaching 6 above it | — | white (`hi`), crease `faint` |

How the wings are built (`wingAt` in `model.mjs`):

- Each wing has a frame at its root's contact point p, which is on the body at x = s·88:
  - V is the body's normal at p;
  - U is the tangent (outward and down);
  - A = U × V is the thickness axis.
- The frame is twisted about V by s·30° (`wingTwist`). The faces then point front-outward, with face normal (s·0.39, 0.87, −0.31). The bottom flat stays tangent to the body.
- The root ball's centre is p + 19.0·V, so its contact flat is a disc of radius 9.
- The tip ball's centre lies in the wing's mid-plane at x = s·(141.7 − 21) and z = 219.8 − 21. Seen square from the front, its top and outer edge therefore match the measured outline.
- The two balls join through a flush disc of Ø 25.0.
- Both balls are cut to 24 thick by side flats ±A. Each side flat is a disc of Ø 34.4 (about 930 mm², under engine limit 1).

How the parts meet:

- The body's flat foot stands on the platter.
- Each wing root touches the body through a flat tangent to it (a flat-on-curve contact). Each tip meets its root on a shared cut plane.
- The tag's back face is tangent to the body.

**Colours.**
- Mint body: the tokens in `toki.css` (paper `#c5ebe4`, face `#d2f1eb`, top `#ddf5f1`, shades `#93d3c9` → `#c3e9e3`, lo `#5e9f96`, faint `#8ec5bd`), redefined for the dark theme.
- Wings and tag: the kit's `hi` whites. In the dark theme they keep reading as white against the mint.
- Embroidery inks (light / dark):

  | Token | Light | Dark |
  |---|---|---|
  | `--toki-orange` | `#e8772e` | `#f08a44` |
  | `--toki-eye` | `#141212` | `#060505` |
  | `--toki-gloss` | `#ffffff` | `#f2f2f2` |
  | `--toki-mouth` | `#231a1a` | `#120c0c` |
  | `--toki-tongue` | `#ec8f9e` | `#d77d8c` |
  | `--toki-stitch` | `#ffffff` | `#e6f4f1` |
  | `--toki-lens` | `#2f4652` | `#38566a` |

- No other colour on the skin except the cheek glow (9.4).

### 5.3 Surface features (embroidery)

Embroidery is drawn as `T.plane` decals laid tangent to the body. Each is centred on the body point `onBody(z, a)` and faces along the profile's normal `normalAt(z, a)`. `onBody(z, a)` is the point on the profile at height z and azimuth a, measured in degrees from the front, positive toward the doll's left. A lathe takes no flats, so there are no seats. The decals fade near the silhouette.

| Feature | Where (`FACE`) | Drawing |
|---|---|---|
| Eye ×2 | z 124, azimuth s·26.03° (centre (s·51.30, 105.04, 124)) | Orange ring Ø 39.5. Black iris Ø 26.5. A white glint Ø 5.6 at upper left and a four-point sparkle 5.8 across at lower right. The **left** eye (s = +1) also has a dark lens hole Ø 3 at the centre of its pupil |
| Mouth | z 88.5, front (centre (0, 129.05, 88.5)) | Open smile 42 wide × 35 high: dark fill, orange rim, pink tongue 26.9 wide at the bottom |
| Swirl ×2 | z 125, azimuth s·66° (centre (s·106.27, 47.31, 125)) | White stitched Archimedean spiral, out to Ø 40 over 2.5 turns, with a knot at each end. It runs clockwise on one side and counter-clockwise on the other. Under it, the **cheek glow**: a radial gradient r 23 (9.4) |
| Care tag | z 46, azimuth +95° (on the left side seam) | A `faint` outline and four `faint` rule lines on the flap's face |
| Wing quilting | Both side faces of each tip ball, at the measured curl (121, 182), kept inside the face | One `faint` stitched curl (a spiral out to r 8 over 1.6 turns) with a knot at each end |
| Seams | Meridians at 180° (centre back) and ±90° | `faint` lines from the crown down to the foot. Each meridian is 18 short planes with a facing fade `[0.02, 0.32]`. The three meet at the crown on a knot. The gusset's front seam (azimuth 0°, z 0 → 22) is 2 more planes. The lathe draws the gusset ring at z 22 |

The camera looks out through the pupil of the doll's **left** eye (s = +1). From outside the eyes differ only by the lens hole.

### 5.4 What was tested, and the limits that shaped this

The Skin scene is 7 parts: the platter, body, four wing balls and the tag. The body is a vertical lathe in an upright turn group, so it is a fixed picture and nearly free to draw.

- `--scene=skin --audit --quick` (v3): `audit passed`; every kit check at 0 problems; `turn audit quick: no problems in what ran`.
- **The full orbit audit result is not yet recorded** in `audit-skin.txt`. Re-run it and keep its output there (13).

Three engine limits shaped this design. They were found on the panda build and confirmed on v2 and v3. Keep to them if anything must change:

1. **A flat that turns edge-on to the camera must be small.** A flat larger than about 1000 mm² at this scale fails `continuity`: a face is born with more than 2 px². This is why the pod's walls are tiles (7.1), and why the wing balls stay at r 21 (side flats about 930 mm²).
   - v3 tried wings as slabs cut to the measured outline (about 2400 mm² a face). They had to be split into flush pieces, and the kit strokes every piece's outline, so the wing read as segmented. They were dropped.
2. **A flush joint between a small ball and the big body must be small.** At Ø 24 the v2 body–wing-root disc failed `swaps`; Ø 18 passed. v3 avoids that joint altogether: the root touches the body through a tangent flat. The root–tip joint between two r 21 balls (Ø 25.0) passes the quick audit.
3. **Curved-on-curved tangent contact is unreliable.** Join through flats, or leave air. The wing root and the tag both land a flat on the curved body.

These limits are in px², so they move with the drawing scale. Do not enlarge the projection of 8.4.

While iterating, `--audit --only=order` and `--audit --quick` are fast predictors. Run the full audit in the background.

---

## 6. Electronics

### 6.1 Architecture

```
18650 (own PCM) ─W1─► TP4056 + DW01 (USB-C) ─W2─► rocker ─W3─► hub: PTC fuse → VBAT bus 3.0–4.2 V
                                    └────────────W4 (return)────────────► hub
hub VBAT ─► XIAO ESP32-S3 Sense (BAT pads, on-board 3.3 V) ─► INMP441 microphone (W5: I²S + 3.3 V)
        ─► MAX98357A I²S class-D (traces on the hub) ─W6─► 40 mm 3 W speaker behind the mouth
        ─► 2 × SK6812 RGB LED + acrylic light pipes behind the swirls (W7 left, W8 right)
OV5640 lens in a sealed turret at the left eye's pupil ─flex─► the XIAO's camera connector
XIAO ──Wi-Fi──► backend (not drawn)
```

### 6.2 Rails

| Rail | Value | Source | Loads |
|---|---|---|---|
| Cell | 3.7 V nominal (3.0–4.2 V) | 18650 | TP4056 |
| VBAT | 3.0–4.2 V | the switched cell, through the PTC fuse on the hub | XIAO (BAT pads), MAX98357A, both SK6812 |
| 3.3 V | 3.3 V | regulator on the XIAO | INMP441 |

There is no 5 V rail and no converter.

### 6.3 Components

Ten components (`COMPONENTS`). "Draw" lists what the Hardware scene shows. Sizes are in mm.

| # | Name | Part | Function (readout text) | Draw |
|---|---|---|---|---|
| 01 | Controller | Seeed XIAO ESP32-S3 Sense: Wi-Fi, 8 MB PSRAM, camera connector | `main controller · Wi-Fi` | XIAO board 17.8 × 1.2 × 22 with a row of seven pin dots; USB-C shell 9 × 3.2 × 7; board-to-board connector; the Sense board in front of it with a chip and an outline; the camera FPC connector 12 × 4.8 × 8; the FPC antenna (outline 12 × 8 and a meander) stuck on the hub above it |
| 02 | Camera | OV5640 lens module on a 75 mm flex | `image input` | Module board 12 × 2 × 12 with a chip and four pads; the lens window Ø 6 × 0.4 (chrome, with a highlight ring) at the tip of the turret; the flex (7.3) |
| 03 | Microphone | INMP441, I²S | `voice input` | Round board Ø 14 × 1.6 with six pads on the rim; metal can 4 × 1 × 3 on its back; the port in the wall in front of it |
| 04 | Amplifier | MAX98357A I²S class-D, 3 W | `speaker amplifier` | Board 17.8 × 1.6 × 19.4; seven header dots; two chip capacitors; the chip 4 × 0.8 × 4; a screw terminal 4.5 × 9.5 × 5.4 on top |
| 05 | Speaker | 40 mm, 3 W, 4 Ω | `sound output` | Rim Ø 40 × 2 (two half discs with four screw dots) against the front wall; basket Ø 30 × 6; magnet Ø 22 × 8; lug strip 4.5 × 3 × 3.4 on the magnet. The cone faces the wall and is not drawn |
| 06 | Battery | 18650 Li-ion, 2600 mAh, protected | `power source` | Cell Ø 18.3 × 64.5 lying along X, positive end toward +X, with a wrap seam, end seams, a ring Ø 14 × 0.5 and a cap Ø 8 × 0.5; a spring Ø 11 × 4 at the negative end; the bay (7.1) |
| 07 | Charger | TP4056 USB-C module with DW01 protection | `charges and protects the cell` | Board 16 × 28 × 0.8 with two LEDs, two chips and a rule; the main chip 4 × 5 × 1.5; an input and an output pad header; the USB-C receptacle and its silicone plug under the floor |
| 08 | Switch | Rocker in a sealed boot, 3 A | `power on / off` | Body 10 × 15 × 15 on the floor; brass terminal block; the rubber boot under the floor with a rule and the I and O marks |
| 09 | Cheek lights | 2 × SK6812 RGB LED behind acrylic light pipes | `shows emotion and battery state` | A board 1.6 × 10 × 9 on each side wall's inner face (chip 5 × 5, LED dot, four pads); a rubber gland and an acrylic pipe out to each swirl, with a ring on the tip |
| 10 | Hub board | Perfboard 48 × 66: VBAT bus, PTC fuse, connectors | `power and signal distribution` | Six flush pieces with Ø 0.7 holes on a 5.08 grid on both faces; traces and terminal dots on the front (7.3); a power header on the rear face; the microphone and two LED headers on the top edge |

---

## 7. The pod, placement and wiring (Hardware scene)

### 7.1 The sealed pod

A clamshell of V-0 (flame-retardant) ABS (`POD`):
- Plan x ±68, y −20 → 76, corner radius 8.
- z 30 → 132.5, wall 2.5.
- This is the largest such box that keeps 10 mm of stuffing inside the measured body (5.0) and still has a flat front wall wide enough for the camera turret. v2's pod (x ±70, y −20 → 86, z 30 → 137, corner radius 14) fits only 2.5 mm inside it.
- It splits in the plane **y = 35** into a front cover and a rear cover, with a gasket between them.
- The floor stays when the covers open.

| Piece | Geometry |
|---|---|
| Floor `pod.floor` | The rounded outline, z 30 → 32.5. Tone `mid` |
| Lids `pod.lid.f`, `pod.lid.r` | The outline split at y = 35, z 130 → 132.5. Tone `hi`. An inset rule 6 mm in on each lid's top marks the moulded edge |
| Front and rear walls | Flush tiles 2.5 thick on columns x −60, −36, −12, 12, 36, 60 and rows z 32.5, 63, 93, 130 (5 × 3 per wall). No column boundary at x ±20: a boundary that grazes the speaker rim's edge made two tiles swap order (`swaps`, `pod.front.wall.32 / .42`, 4.74 px²) |
| Side walls | Flush tiles at x ±(65.5 → 68) on the same rows: front cover y 35, 55, 68; rear cover y −12, 11.5, 35 |
| Rounded corners | Each quarter is 2 chords (convex prisms, 2.5 thick), in two rows z 32.5 → 81.25 → 130 |
| Screw tabs | Three pairs per side at z 45, 84, 121. Each tab is 5 (X) × 4 (Y) × 8 (Z) outside the side wall, the front tab at y 35 → 39 and the rear at y 31 → 35. A pin-hex security screw head (ring Ø 3.4, hex hole, centre pin) is on the rear tab and a captive nut hex is on the front tab: six screws in all |
| Camera turret | A sealed boss r 5.9 × 11 from the front wall (y 76 → 87), with a seam ring, and a nose r 4.5 out to the lens tip at y 99.04. (r 5.9, not 7: the boss must end below the lid at z 130) |
| Glands ×2 | Rubber rounds r 4.8 × 4 on each side wall at (±68 → ±72, 47.31, 125) |
| Light pipes ×2 | Acrylic rounds r 4 from x ±72 out to x ±99.94, ending 5 mm (along the fabric's normal) behind each swirl's centre (`PIPE`) |
| Grille and port | Decals on the front-wall tiles. Speaker holes Ø 1.4 on a staggered 3.2 × 2.77 grid within r 16.6 of (0, 88.5); the microphone port (hole Ø 1.2 in a ring Ø 3.2) at (−30, 97). Each hole stays inside its own tile |
| Lid clips ×2 | Blocks under the front lid, x 4 → 18 and −18 → −4, y 35 → 40, z 118 → 130 (from 7 below the pipes to the lid). W7 and W8 turn from vertical to horizontal inside them |
| Hub floor clips ×2 | At x ±(20 → 25): a riser y 30 → 31.6, z 32.5 → 34, and two jaws 2.5 thick on either side of the board, up to z 44 |
| Battery bay | End plates x −49 → −46 and 23.5 → 26.5 (y ±11, z 32.5 → 56); two low rails 1.4 thick to z 38; a lid z 53.5 → 56 with two screws at x −38 and 15. Open at the sides so the cell shows |
| Display posts `mount.post.0–2` | Rounds r 3 from the platter (z 0) to the floor (z 30) at (−45, 30), (12, 66), (12, −12). **Not part of the product:** the hardware view removes the stuffing that holds the pod, so the posts stand it on the turntable. The caption says so |

Tones: walls, corners, lids and the turret are `hi`; tabs and the floor are `mid`; clips and posts are `lo`.

**Why tiles and chords.** These are engine-forced (5.4, limit 1); the outside sizes are unchanged.
- A whole wall is a vertical flat far over 1000 mm², so it is split into tiles of about 28 × 34.
- Each rounded corner is drawn as two chords per quarter. `check()` tests the same chorded outline.

### 7.2 Placement

Component boxes (`BOXES`), as axis-aligned boxes:

| # | Where | Box (mm) |
|---|---|---|
| 10 | Upright in the X–Z plane near the split, in the floor clips | x ±24, y 30 → 31.6, z 34 → 100 |
| 01 | On the hub's front face; the Sense board and camera connector in front | x 2 → 19.8, y 31.6 → 42, z 58 → 80 |
| 04 | On the hub's front face beside the XIAO, screw terminal on top; 2.5 higher than v2 (`AMP_DZ`), so its terminal stays level with the speaker's lug strip | x −22 → −4.2, y 31.6 → 42.7, z 68.5 → 87.9 |
| 06 | Cell along X in its bay on the floor (cell axis at z 43.15) | x −49 → 26.5, y ±11, z 32.5 → 56 |
| 07 | Flat on the floor | x 32 → 48, y ±14, z 32.5 → 40 |
| 08 | Body on the floor | x 50 → 62, y −7.5 → 8, z 32.5 → 47.5 |
| 05 | Rim on the front wall's inner face, centred behind the mouth | Ø 40 at z 88.5; y 54.5 → 73.5 |
| 03 | Round board on the front wall's inner face behind its port (x −30, not v2's −36: W5 needs the room for its bends now that the wall is 10 mm further back) | centre (−30, 73.5, 97), Ø 14; box x −37 → −23, y 70.9 → 73.5, z 90 → 104 |
| 02 | Module board behind the turret, centred on the lens; the lens tip 6 mm (along +Y) behind the pupil | lens tip (51.30, 99.04, 124), optical axis +Y; board x 45.3 → 57.3, y 71.5 → 73.5, z 118 → 130 |
| 09 | LED boards on the side walls' inner faces; pipes out to each swirl | y 47.31, z 125; x ±(63.9 → 65.5) for the boards |

Under the floor (`UNDER`), reached through the zip in the bottom panel. Each part hangs from the floor's underside, 25 mm above the fabric. The drawing omits each part's short pass-through inside the 2.5 mm floor.

| Part | Box (mm) |
|---|---|
| USB-C receptacle (07) | x 36 → 45, y −11 → −4, z 26.8 → 30 |
| Silicone plug (07) | x 35.5 → 45.5, y −11.5 → −3.5, z 24.8 → 26.8 |
| Switch boot (08) | x 51 → 63, y −9 → 8, z 26 → 30 |

**`check()`** (in `model.mjs`; `build.mjs` calls it first and exits on failure) asserts:
- Every point of the pod's chorded outline, at nine heights from z 30 to 137, and every screw tab lies **≥ 10 mm inside the skin** (body sphere plus band).
- The lens tip and both light-pipe tips lie ≥ 4 mm inside the skin.
- The three under-floor parts lie ≥ 10 mm inside the skin.
- Every component box except 02 and 09 (which pass through the wall by design) lies inside the pod, and no two boxes overlap. The pipe band 09 is exempt from the overlap test because it crosses the pod above everything else.
- Every cable names two existing components; there are exactly 8 cables and 10 components.

Do not draw stuffing or foam. The caption says they are removed.

### 7.3 Wiring

Eight cables (`CABLES`). Each is one sheathed multi-core cable drawn as a single `T.tube`, `material: "rubber"`, `chunk: 24`. Each has a connector shell at both ends; the shells are separate parts owned by the cable and listed in the tube's `gaps`.

| Cable | From → to | Cores | r | Hue | Readout text |
|---|---|---|---|---|---|
| W1 | Battery bay → charger | 2 | 0.9 | red | `cell 3.7 V` |
| W2 | Charger OUT+ → switch | 1 | 0.7 | red | `switched supply` |
| W3 | Switch → hub | 1 | 0.7 | red | `VBAT 3.0–4.2 V` |
| W4 | Charger OUT− → hub | 1 | 0.7 | red | `supply return` |
| W5 | Hub → microphone | 5 | 1.2 | blue | `I²S · SCK WS SD + 3.3 V` |
| W6 | Amplifier → speaker | 2 | 0.9 | green | `audio out` |
| W7 | Hub → left LED | 3 | 1.0 | blue | `LED data + VBAT` |
| W8 | Hub → right LED | 3 | 1.0 | blue | `LED data + VBAT` |

Routes (polyline corners; bends of radius 10 r + 0.5 where marked):

- **W1**: (26.5, 0, 38) → (32, 0, 38). One straight run from the bay's positive end plate to the charger's input header.
- **W2**: (48, 2, 38) → (50, 2, 38). A short jumper from the charger's output header to the switch terminal.
- **W3**: (50.6, 6, 40.5) → (50.6, 25, 40.5) → (16, 25, 40.5), bent at the middle corner. From the switch terminal to the hub's power header on its rear face, above W4.
- **W4**: (46.5, 5, 36.5) → (46.5, 25, 36.5) → (16, 25, 36.5), bent at the middle corner. From the charger's output header to the hub's power header.
- **W5**: at z 101.5, (−20.5, 36) → (−20.5, 49.2) → (−30, 58.7) → (−30, 71.9), bent at both inner corners (two 45° turns in the horizontal plane, round two equal straight runs). From the microphone header on the hub's top edge onto the back of the mic board.
- **W6**: (−6.75, 42.7, 85.2) → (−6.75, 54.5, 85.2). One straight run from the amplifier terminal to the speaker's lug strip.
- **W7 / W8**:
  - Up from the LED header at (s·10, 37.5, 105) to z 125, inside the lid clip.
  - Then across along X to s·30.
  - Then diagonally in the horizontal plane to (s·39.81, 47.31).
  - Then along X to the LED board at s·63.9.
  - The two horizontal corners are bent.

**Camera flex** (part of component 02, not a cable): 8 wide × 0.3 thick, copper, in three flat strips with two folds:
- down from the module board (x 47.3 → 55.3, from z 118 to 96);
- across as a horizontal ribbon at z 95.7 → 96;
- down onto the XIAO's camera connector (x 7 → 15, to z 80).

A straight diagonal strip cannot land square on both boards.

**Hub traces**, drawn as lines on the front face (not cables):
- the VBAT input through the **PTC fuse** (a chip at x 14 → 18, z 38.6 → 40.4) onto the VBAT bus;
- the bus up the right edge (x 22) and across the top (z 96) to the two LED headers;
- a ground bus bar (x −22 → 20, z 35.4 → 36.6);
- the 3.3 V and I²S trace from the XIAO to the microphone header;
- the I²S trace from the XIAO to the amplifier (class `tk-i2s`; it lights in the pulse);
- terminal dots at every trace end.

The XIAO and the amplifier are soldered to the hub and need no cables.

**Routing rules**

- Every run is horizontal or vertical. No run rests at 15°–45° of elevation.
- Bends lie in horizontal planes with radius ≥ 10 r. Every change between horizontal and vertical happens inside a connector shell or a clip block.
- Each end lands on its own connector shell, and the shell sits on a board, a header, a terminal or a lug.
- Keep 1.5 r of clearance from everything but a cable's own connectors.
- Every cable is in the `toki` turn group (or a cover's group, 7.4). Nothing spans the turning group and the static base.

### 7.4 Disassembly (open pod)

The pod opens as two slide groups under the turn group (`ASSEMBLIES`):

| Assembly | Moves | Holds |
|---|---|---|
| `front` | Up and a little forward, along `unit([0, 0.25, 1])`, 120 mm | The front cover's walls, corners, lid and tabs; turret, glands, pipes, lid clips; camera (window, board, flex), microphone, speaker, LED boards; W5–W8 |
| `rear` | −Y, 90 mm | The rear cover's walls, corners, lid and tabs |
| core | Stays | Floor, posts, battery bay and cell, charger, switch, hub, XIAO, amplifier, W1–W4 |

- The motion is one explode value e ∈ [0, 1]. Each assembly's travel is `travel · smoothstep(x)`, with x = (e − 0.15 · i) / 0.55 (`apartAt`, `STAGGER`). The page eases e over about 1.4 s.
- **Why up.** The front cover is lifted, not slid forward. Sliding it forward hid the hub's face (XIAO, amplifier) from every front angle. Lifting it shows the hub from the front and the cover's inner face from behind.
- **Free ends** (`FREE_ENDS`). As the cover lifts, W5, W6, W7 and W8 come away from their hub-side mount (microphone header, amplifier terminal, LED headers), and the flex comes away from the XIAO's connector. Each end's shell stays with its cable.
- **Auto-open.** Picking, stepping to or inspecting a component inside the pod opens it.
- **Reviewed crowding pairs** (`TURN_CROWD` in `core.mjs`): W5, W6, W7 × `pod.front.corner.L00`; W8 × `pod.front.corner.L10`; W6, W7 × `pod.front.corner.R10`; W5 × W8; and, from v3's smaller pod, W7 × `pod.front.corner.R00`, W6, W5 × `pod.front.corner.L10` and W8 × `pod.front.corner.L00`. Each is a cable end, on its own shell, whose outline lines up with a corner chord at one angle. Most are inside the closed pod, where nothing is seen. Three of the v3 pairs are early in the close clip at θ 246°, with the ends hanging inside the lifted cover in front of its far corner (`shots/v3/crowd-close-4x.png`).

---

## 8. Scene

### 8.1 Static base

Kit art in layer `back`, no materials. **Name every part `stand.*`.** The audit treats those names as ground, and every live part must reach ground through contacts. The numbers are in `BASE`.

- `stand.plate`: 280 × 280 × 8, corner radius 10, top face at z = −20. It has:
  - four feet (Ø 18 × 1.6 pad and a Ø 14 post, 6 high in all), 26 in from the corners;
  - a groove inset 4 and a side seam;
  - corner screws with rings Ø 6.4, 12 in from the corners.
- `stand.housing`: turntable housing r 128 × 14, centred on the plate, top face at z = −6, with a side seam.
- Degree ring engraved on the housing top between r 121 and r 127:
  - ticks every 5°;
  - longer every 15° (tone `mid`);
  - full length at 0°, 90°, 180°, 270° (tone `hi`), with a dot outside each;
  - the ring's 0° sits where the platter's front notch points at θ = 0.
- `stand.index`: a fixed wedge pointer on the viewer's side of the housing (azimuth 45°), r 129.5 → 139, 4 high, tone `hi`.
- `stand.label`: label plate 64 × 15 × 0.8 at (70, 112), with an inset outline, three rule lines and two screws.
- A soft halo under the plate.

The platter is r 120 and the housing r 128 (the panda used 100 and 110). They were sized for v2's Ø 236 band; v3 keeps them. The measured foot is Ø 190, and the body's widest girth (Ø 260, at z 75) overhangs the platter as it did in v2.

Everything static stays at or below z = −6, under the live layer.

### 8.2 Live group

```js
const toki = T.group("toki", { turn: { pivot: [0, 0] } });
```

- `platter`: `T.round`, axis Z, r 120, z −6 → 0, tone `mid`, crease `lo`, with a seam at z −4.4. It rests flush on `stand.housing`. Its top carries:
  - the footprint ring r 118 (`faint`), which stays visible in Hardware and keeps the plush's size readable;
  - a ring r 113 (`lo`);
  - a front index notch from r 113 to r 120 (`hi`).
- Skin scene: the platter plus everything in section 5.
- Hardware scene: the platter plus everything in section 7. The `front` and `rear` slide groups are children of `toki`.

### 8.3 Two scenes on one page

A solid skin cannot contain the hardware (the audit reports any part inside another as sunk), so the scenes are separate builds:

- One `model.mjs`, one projection `P`, one static base (`scene.mjs`).
- Two recorders and two `turning()` builders, `skin` and `core`, each audited on its own (`--scene=skin`, `--scene=core`).
- The page stacks both stages over the shared static SVG and shows one at a time. Both always hold the same θ, and one `window.__isoTurn` dispatcher drives both.
- Swap = 240 ms opacity crossfade, instant under reduced motion.

### 8.4 Camera and card

- `fitProjection([[-150,-150,-20],[150,150,-20],[-150,150,-20],[150,-150,-20],[0,0,260]], 720, 560, { pad: 22, azimuth: 45, elevation: 30 })`. Use exactly these points: the geometry was audited at this scale.
- The plush and turntable fill 55–65 % of the card. The figure must still read at 390 px wide.
- Corner texts:
  - `Fig 1`
  - `Toki — smart plush, 260 mm`
  - hint `Drag to turn · S skin / hardware · D open pod`
  - the live readout

### 8.5 Page layout

- **Full page** (`toki.html`, `toki-light.html`): a side panel beside a full-screen stage.
  - The stage carries the four corner texts as overlays, a subtitle line for the demo, and a panel toggle (☰).
  - The top-right overlay holds `Front`, `Side`, `Back` and zoom `−`, `Fit`, `+`.
  - The side panel's sections are `Demo` (open), `View`, `Hardware`, `Components`, `Legend`, and `About` (closed), the last holding the caption.
  - The side panel starts closed at widths ≤ 760 px.
- **Single-scene pages** (`--page=skin|core`): one card with the static base and that scene only, no demo.

### 8.6 Performance budget

Each scene's weight is ≤ 230 (measure with `scripts/turn-bench.mjs`). In Hardware:
- model boards and walls as prisms;
- put pads, holes, pins and screws in `details` or decals, not parts;
- chunk cables with as few chunks as the bends allow.

The page drops to an **adaptive half rate** (it draws every other frame) when a render costs more than 14 ms, and returns to full rate below 9 ms.

---

## 9. Behaviour

### 9.1 Controls

| Input | Action |
|---|---|
| Drag on the stage | Turn (`controller.angleAt`, exponential follow, τ = 0.12 s) |
| Shift + drag, or middle-button drag | Pan |
| Pinch, or Ctrl + wheel (a trackpad pinch) | Zoom about the pointer. A plain wheel keeps scrolling the page |
| Double-click | In Hardware on a part: inspect its component. Elsewhere: zoom 2× about the pointer |
| ← / → | θ ∓ 15° |
| Shift + ← / → | To the previous / next named view (multiples of 90°) |
| Home | Front, θ = 0° |
| `S`, or the `Skin · Hardware` buttons | Swap scene |
| ↑ / ↓ | Select the previous / next component. Swaps to Hardware first, and opens the pod for a part inside |
| Component buttons `01`–`10` | Select that component (click again to clear). From Skin, swap to Hardware first; open the pod |
| `D`, or `Open pod` | Open or close the pod (swaps to Hardware first) |
| `I`, or `Inspect` | Inspect the selected component: open the pod and zoom to frame it (zoom ≤ 10). Pressing again leaves inspect. With nothing selected it announces `select a component first` |
| Escape | Leave inspect, else clear the selection |
| `+` / `−` / `0`, or `+`, `−`, `Fit` | Zoom in or out by 1.25×, or fit (zoom 1, centred; also leaves inspect) |
| `P`, or `Power` | Power on / off |
| Space | Play or pause the demo. On a page without the demo: play one interaction pulse (9.6) |
| `F` / `Follow` | Demo camera follows the story, or not |
| `T` / ☰ | Show or hide the side panel |
| `Front`, `Side`, `Back` | Turn the shortest way to 0°, 90°, 180° |

Any input stops the idle tour and leaves the state as it is. During the demo, a drag or key hands the camera back by turning `Follow` off; the story keeps playing.

Stage attributes:
- `tabindex="0"`, `role="slider"`, `aria-valuemin="0"`, `aria-valuemax="359"`;
- `aria-valuenow` = θ, `aria-valuetext` = the readout;
- an `aria-label` that names the keys;
- `touch-action: pan-y`.

Announcements go to a polite live region.

### 9.2 State

```js
{ theta: 0, scene: "skin" | "core", selected: null | "01"…"10", power: true,
  apart: 0…1,           // the pod's explode value (7.4)
  zoom: 1…6, inspect: null | "01"…"10",
  glow: "happy" | …,    // the cheek emotion (9.4)
  demo: { playing, t, lang: "en" | "id", sound, follow } }
```

- **Selection**:
  - The selected component is `lit`.
  - The cables and traces that end on it step up one tone; every other part steps down one.
  - With nothing selected in Hardware, the cheek lights carry the lit accent.
- **Power off**:
  - The cheek glow fades out in 200 ms and the readout says `power off`.
  - Pulses cannot start.
  - Power on restores the glow with a 200 ms fade.
- **Zoom**: 1 → 6, 1.25× per step, follow 0.2. Inspect may go to 10.
- **Idle tour** (pages without the demo):
  - Starts 4 s after load if untouched, at 12°/s.
  - Pauses 1.2 s at 0°, 90° and 180°.
  - Swaps scene once per lap at 270°.
  - It stops offscreen.
- **Demo auto-start**: on the full page the demo starts 2 s after load in place of the idle tour, if untouched.
- **Reduced motion**: no tour, no auto-start, no pulse; one still frame. If the demo is played, each shot is drawn without motion.

### 9.3 Readout

Format: `θ NNN° · view · scene[ · pod phase][ · step | selection][ · power off]`.
- `view` is the nearest named view within 10°; otherwise it is omitted.
- The pod phase appears only in Hardware: `opening the pod`, `pod open` or `closing the pod`.
- The selection appears only in Hardware.

```
θ 000° · front · skin
θ 090° · left side · hardware
θ 180° · back · hardware · pod open · 07 Charger · charges and protects the cell
θ 035° · hardware · pod open · 03 Microphone · voice input · I²S · SCK WS SD + 3.3 V
θ 020° · hardware · sending to backend
θ 000° · front · skin · power off
```

A selected component shows its name and function from 6.3. Then comes the readout text of its one signal cable (a data or audio cable that ends on it), if it has exactly one.

### 9.4 Cheek glow

- **Drawing.** One radial gradient per page (`#tk-glow-grad`, opacity .9 → .45 → 0) fills each swirl's glow disc (r 15.5).
- **Colour.** The colour is a token per emotion (`--toki-glow-<name>`):

  | Emotion | Light | Dark |
  |---|---|---|
  | happy | `#ff9a3c` | `#ffa552` |
  | listening | `#3d9cff` | `#5aacff` |
  | thinking | `#9a7cff` | `#a98fff` |
  | curious | `#ffd23f` | `#ffdb5c` |
  | encouraging | `#ff6fae` | `#ff85bb` |
  | proud | `#ffc21f` | `#ffcb3d` |
  | boot | `#bfe3ff` | `#cfeaff` |
  | low | `#ff4d4d` | `#ff6363` |

- **Speaking.** While Toki speaks, the glow brightens with the voice, by up to 1.35×.
- **Boot sequence.** In the demo the cheeks boot dark, then `boot` (pale), then the emotion's colour.
- **No words.** No text or numbers are shown on the plush.

### 9.5 Legend and caption

Controls under the card (the single-scene layout) or in the side panel:
- the `Skin · Hardware` toggle;
- `Front`, `Side`, `Back`;
- zoom `−`, `Fit`, `+` and a zoom chip (`1.0×`);
- `Open pod`, `Inspect` (disabled until something is selected) and `Power`;
- ten numbered component buttons with the names from 6.3;
- three hue keys: `red — power`, `blue — data`, `green — audio`.

Caption (`TEXT.caption`):

> Toki is a 260 mm mint plush for speech practice. A camera looks out through the pupil of its left eye and a microphone listens behind its face; an ESP32-S3 sends image and sound over Wi-Fi to a backend, and the answer comes back as speech from a 3 W speaker behind the mouth, while two cheek lights glow with Toki's mood. Every hard part lives in one sealed pod inside the stuffing. The hardware view is shown without plush and stuffing, with the pod on three display posts.

Figure label (`TEXT.label`, the SVG's accessible name):

> A round mint plush with white wings on an inspection turntable. In the hardware view the plush is removed to show the sealed pod, which stands on three display posts and opens into a front and a rear cover around ten components and eight cables.

### 9.6 Interaction pulse

The pulse is a pure function of time, 4 s long, in five equal steps (`PULSE`). It plays on Space when powered and in Hardware, on pages without the demo; the demo reuses its steps. Each step lights its parts in turn:

1. `listening`: the microphone, then W5.
2. `seeing`: the lens window, then the module board, then the flex.
3. `sending to backend`: the XIAO, while its antenna meander blinks three times.
4. `answering`: the hub's I²S trace, then the amplifier, then W6.
5. `speaking`: the speaker and the cheek lights together, while the cheek glow brightens.

The readout shows the step name only. No durations are shown.

### 9.7 The demo

The demo is one predefined end-to-end story of how Toki works (`demo.mjs`).
- **Playback.** It plays as a pure function of time, so play, pause, seek and chapter jumps all land on the same picture.
- **Subtitles.** Words appear as subtitles outside the drawing: narrator, `Toki` or `Child`, in English or Indonesian (`EN` / `ID`).
- **Sound.** `Sound` plays a recorded voiceover of every subtitle (narrator, Toki and the child) in the chosen language, EN or ID.
  - **Making the clips.** The clips come from ElevenLabs, made by `voice.mjs` with the voices and model in `VOICE` (`demo.mjs`). Today those are `eleven_multilingual_v2` and three built-in voices: George (narrator), Jessica (Toki) and Laura (the child). Each request carries `language_code` en / id. The clips are cached in `toki/voice/` by a hash of (model, voice, settings, language, text), so only changed lines are made again.
  - **Embedding and timing.** `build.mjs` embeds them in the full page (low-bitrate MP3 data URIs, about 630 KB). It stretches each voiced shot to `lead` 0.15 s + its longer clip (EN or ID) + `tail` 0.4 s. One timeline serves both languages; the demo is 110.5 s long.
  - **Playback.** A clip plays from `demo.t − shot start − lead`, so pause, seek, chapter jumps and language switches land on the same word. It is kept within 0.3 s of the demo's clock.
  - **Fallback.** Without current clips, the build keeps the typed timing and `Sound` falls back to the browser's speech synthesis (`en-US` / `id-ID`, Toki's lines only).
- **Camera.** A directed camera (scene, θ, zoom, focus) follows the story while `Follow` is on. Every hardware shot opens the pod, and a focus on a component follows its centre in its own cover's frame.
- **Controls.** The side panel holds `Play`, `Restart` and `Follow`; `EN`, `ID` and `Sound`; a progress bar; and the chapter list.

Nine chapters (EN / ID):

1. **Power on / Menyala.** Skin from the back, switched off. Then Hardware:
   - the switch;
   - the cell and W1;
   - the charger, the switch and W2;
   - the hub and W3/W4;
   - the XIAO, the amplifier and the cheek lights with W7/W8.
2. **Cheeks / Pipi.** The LED boards wake pale (W7/W8). In Skin, the cheeks take the `happy` colour.
3. **Hello / Halo.** Toki greets the child (`answering`, `speaking`). In Hardware, the speaker.
4. **Name / Nama.** The child answers (`listening`, the microphone). The XIAO sends it (`sending to backend`, `thinking`). Toki replies.
5. **Apple / Apel.** An apple comes into view; the camera's view cone shows from the left eye (`seeing`). In Hardware, the turret, the flex and the XIAO.
6. **Backend / Server.** The XIAO sends over Wi-Fi to speech recognition, computer vision and a language model.
7. **Answer / Jawaban.** The amplifier (`answering`). Then, in Skin, Toki asks for the word (`curious`).
8. **Practice / Latihan.** A near miss, gentle modelling (`encouraging`), then the word (`proud`). The apple leaves.
9. **Goodbye / Dadah.** Toki says goodbye. It powers off, and the narrator says it charges through the USB-C port under the zip, with the switch off.

The apple (r 26) and the view cone follow the front cover in the Hardware scene. Shot durations, packet speeds and arc counts are internal (`SIM`, the shot list) and are never displayed.

---

### 9.8 The walkthrough film

A narrated, full-screen product video of the same story, without the tool UI: `toki/film/toki-walkthrough-en.mp4` (1920 × 1080, 30 fps, H.264 + AAC, English), with `toki-walkthrough-en.srt` and `poster.png`.

- **Script** (`film.mjs`):
  - an intro: the title card, a turntable reveal, what Toki is for, and the face;
  - "Inside the pod": the closed pod, then open, the battery bay, and the switch and USB-C under the zip;
  - the demo's nine chapters (`SHOTS`);
  - an outro and an end card.
- **New narration.** The new lines are the narrator's (George), made by `voice.mjs` like the demo's. Every fact comes from sections 2, 6, 7 and 14.2.
- **Film-only shot fields.** `card` (a title card), `cam.spin` (a slow turntable) and `cam.pod: "closed"`.
- **The page** (`node toki/build.mjs --page=film` → `toki-film.html`):
  - the full stage only, dark, 1920 × 1080: no side panel, overlay buttons, readout or corner texts;
  - lower-third subtitles; chapter cards ("02 · Inside the pod"); title cards (the stage slides right while one is up); fades from and to black;
  - a virtual clock in the head replaces `requestAnimationFrame` and `performance.now`, and `window.__film` steps one frame at a time;
  - CSS motion is off and every fade is computed from `demo.t`, so each frame is exact;
  - the camera may pan 30 % past the card's edges, to follow the lifted front cover.
- **Rendering** (`node toki/film/record.mjs`):
  - **Timeline.** It builds the page and stretches each voiced shot to its clip (lead 0.15 s, tail 0.4 s).
  - **Voice.** It mixes the clips at their cue times into `voice-en.wav` (ffmpeg `adelay` + `amix`, `loudnorm` −16 LUFS).
  - **Picture.** It steps headless Chrome frame by frame, captures JPEGs and pipes them into ffmpeg (`libx264` CRF 18, `-movflags +faststart`).
  - **Options.** `--from` / `--to` render a span; `--stills t1,t2,…` saves PNG stills.
  - **Requires** Chrome and ffmpeg (`winget install Gyan.FFmpeg`).

## 10. Engine rules that bind this figure

These come from `references/3d.md`; the build and audits fail without them.

- **Convex parts only.** Anything concave is several convex pieces: the pod is tiles, chords, lids and tabs.
- **Contacts are flush or rim-on-flat.** Nothing is sunk into anything. A rim cannot land on a bare sphere: give the sphere a flat (the embroidery seats, the wing cuts, the bottom flat). See the three limits in 5.4.
- **Ground.** Every live part must connect through contacts to a `stand.*` part. In Hardware, the path to ground runs pod → display posts → platter → housing.
- **No part inside another.** This is why Skin and Hardware are separate scenes.
- **Cables** follow 7.3. A route starts and ends on a mount surface, never on a connector's outer face.
- **Costs:** fixed picture 0.5 · prism 1 · tube chunk 2–3 · round 2.5–4 · ball with flats 8–10 · lathe about 25.
- **Textures end on an edge or fade.** Use `fade` on seams, dots and hole grids.
- **One `lit` accent.** Words stay out of the drawing.

---

## 11. Files

```
toki/
  model.mjs       MEASURES (5.0) and every number of sections 4–9 derived from it, check(), the state model, the strings, apartAt
  kit.mjs         the paths of the anatomy skill's kit
  scene.mjs       shared scaffold: projection, static base, turn group, platter
  base.mjs        static base (stand.*)
  skin.mjs        Skin scene
  core.mjs        Hardware scene: pod, components, cables, disassembly groups, TURN_CROWD
  demo.mjs        the demo's chapters, shots, subtitles (EN/ID), VOICE (the voiceover's model and voices)
  voice.mjs       makes the voiceover clips with ElevenLabs (key from ELEVENLABS_API_KEY or ~/.elevenlabs-key); --list, --dry
  voice/          the clips (en/, id/) and manifest.json
  film.mjs        the walkthrough film's script (9.8): intro, the pod tour, the demo story, outro
  film.js film.css  the film page's overlays, clock control and styles
  film/record.mjs renders toki-film.html to film/toki-walkthrough-en.mp4 (+ .srt, poster.png, voice-en.wav)
  toki-film.html  the film page (no tool UI; driven frame by frame)
  build.mjs       flags: --light --scene=skin|core --audit --quick --only=… --verify --page=skin|core --verbose
  live.js         loop, controller, selection, power, pod, zoom, inspect, glow, tour, readout, pulse
  demo.js         demo player (full page); nodemo.js for single-scene pages
  toki.css
  toki.html  toki-light.html                     full page, dark / light
  toki-skin*.html  toki-core*.html               single-scene pages (-light, -verify variants)
  shots/          every PNG read during verification
  audit-skin.txt  audit-core.txt
  REDESIGN.md     the v2 redesign note (history; this file governs)
  DEVIATIONS.md
```

`build.mjs` calls `check()` first and exits on failure. The core build records:
- the 360° sweep closed;
- a 180-pose sweep open;
- a 0 → 1 explode at every 45°.

The core audit adds three clips:
- `apart`: opening over 1.4 s while turning;
- `close`: closing over 1.4 s;
- `apart-orbit`: a full turn, open.

---

## 12. Build order

1. `model.mjs` and `check()`.
2. Static base and platter. A page that opens in the browser within the first hour.
3. Skin scene: the body, band and wings first, audited with `--scene=skin --audit --quick` before anything is added. Then the tag and the embroidery of 5.3, audited again.
4. Hardware scene, in this order:
   1. the pod's floor, walls, corners, lids and tabs, and the display posts;
   2. the floor parts (battery bay and cell, charger, switch, under-floor parts);
   3. the hub, its clips, the XIAO and the amplifier;
   4. the front cover's parts (speaker, microphone, camera and turret, LED boards, glands and pipes, lid clips);
   5. the cables;
   6. the disassembly groups.

   Run `--scene=core --audit --quick --only=rigid,order` after each group.
5. Card or side panel, legend, readout, controls, power, pod, zoom, inspect, tour.
6. 4× close-up sweep of the whole drawing: both scenes, the pod closed and open, both themes. Add true detail from the "Draw" column of 6.3 wherever a face is bare.
7. Full audits in the background (`node toki/build.mjs --scene=… --audit > toki/audit-….txt 2>&1 &`). Budget 30–40 s per live part. Then the browser checks.
8. The pulse, then the demo.

---

## 13. Acceptance

**Geometry**
- [x] `--scene=skin --audit`: kit audit `audit passed` (`audit-skin.txt`).
- [x] `--scene=core --audit`: kit audit `audit passed` (`audit-core.txt`).
- [ ] Both files also end with `turn audit passed` on a full run (not `--quick`, not `--only`), with the core run including the `apart`, `close` and `apart-orbit` clips. *Not yet recorded.*
- [ ] `scripts/turn-check.mjs` passes `--fidelity`, `--order`, `--pops`, `--lines` for both scenes in both themes.
- [ ] `scripts/lines.mjs` prints `line ends: 0` on every page.

**Truth**
- [x] `check()` passes.
- [ ] Skin matches 5.1: 260 wide, 187 tall, wings to 219.8 high and ±141.7 out, Ø 190 on the platter.
- [ ] Hardware shows exactly the 10 components of 6.3 and the 8 cables of 7.3, each at its position in 7.2.
- [ ] At θ = 0° both eyes and the mouth face the viewer, with a swirl on each side. At θ = 180° the centre-back seam shows; at θ = 90° the left side seam and the care tag.
- [ ] The lens tip is behind the left eye's pupil in both scenes. The switch boot and USB-C are under the pod's floor.
- [ ] No pin numbers, currents, capacities, percentages or durations appear anywhere on the page.

**Craft**
- [ ] Reads as a round winged plush on a turntable at 1×; every region has a true detail at 4×, with the pod both closed and open.
- [ ] Exactly one `lit` accent at any moment.
- [ ] Pointer and keyboard both work; reduced motion gives a still frame; reads at 390 px.
- [ ] Main-thread task ≤ 13 ms at 1440 px and ≤ 33 ms on the phone profile.

**Honesty**
- [ ] `DEVIATIONS.md` exists and lists every departure from this file. It may be empty.

---

## 14. Design record

This section is for the product team. The builder does not need it.

### 14.1 Changes from the original proposal

| # | Proposal | This revision | Reason |
|---|---|---|---|
| 1 | Panda doll, head-to-body 100 : 150 | Round mint plush with white quilted wings, 260 × 187 (measured from the photos, 5.0), embroidered face | The product changed to the plush in the reference photos |
| 2 | LM2596 step-down, "3 V" output, from one 3.7 V cell | No converter: every load runs from VBAT 3.0–4.2 V; 3.3 V from the XIAO's regulator | An LM2596 cannot regulate from one cell. The XIAO, the MAX98357A and the SK6812s all run from the cell directly: one less hot part, and no 5 V rail to fuse |
| 3 | ESP32 + ESP32-CAM "5 MP", linked by "camera data" | One Seeed XIAO ESP32-S3 Sense with an OV5640 on a 75 mm flex | One board drives the camera; no UART link. The stock sensor (OV2640) is 2 MP. The long flex lets the lens sit in a sealed turret at the eye's pupil |
| 4 | PAM8403 driven from the ESP32 DAC | MAX98357A I²S class-D | Takes I²S directly: no attenuator, no clipping |
| 5 | Speaker at the mouth | Speaker behind the mouth, on the pod's front wall | The 260 mm body has room for it. It sits apart from the microphone (−30, 97) |
| 6 | OLED showing emotion and battery | Two SK6812 cheek lights behind acrylic pipes and the white swirls | The plush has no screen. Colours carry emotion and battery state; no bare glass |
| 7 | Switch and charge port on the back | Under the pod's floor, through a zip in the bottom panel; switch in a sealed boot, USB-C with a silicone plug | Nothing hard on the outside |
| 8 | TP4056, unspecified variant | TP4056 with DW01 protection, plus the cell's own PCM, plus a PTC fuse on the hub | Required for a bare Li-ion cell in a toy; a short anywhere trips before the cell is stressed |
| 9 | Internal casing, not drawn | One sealed pod (7.1) | See 14.2 |
| 10 | "Mini PCB", unspecified | A 48 × 66 perfboard hub: VBAT bus, PTC fuse, connectors, with the XIAO and amplifier soldered on | Gives every loose module a fixed mount |

Proposal text to correct to match:
- the power block and rails ("3V" → VBAT 3.0–4.2 V and 3.3 V);
- the component list (step-down, ESP32-CAM, PAM8403 and OLED → the parts of 6.3);
- the placement figure.

The budget's INMP441 row reads Rp 180.000 for 3 × Rp 120.000; the stated subtotal is right only with Rp 360.000.

### 14.2 Safety measures

| Measure | Why |
|---|---|
| Sealed clamshell of V-0 (flame-retardant) ABS, gasketed, six pin-hex security screws | Nothing hard or small is reachable even if a seam opens. It contains a cell fault and keeps out drool and washing water |
| Battery in its own screwed bay | Toy standards require a tool to reach the battery |
| Double cell protection (the cell's own PCM and a DW01) plus a PTC fuse | A short anywhere downstream trips before the cell is stressed |
| USB-C with a silicone plug, and the switch in a sealed boot, under a zip in the bottom panel | Reachable for a parent, not exposed to the child |
| At least 10 mm of stuffing round the pod (checked by `check()`) | The child feels plush, not a box. Only the camera window and the light-pipe tips come closer, and they stay ≥ 4 mm inside the fabric |
| No cable leaves the pod; rounded corners; the pod sits in a sewn pocket | Nothing can be pulled, chewed or caught; the pod can't shift or point into the fabric |
| Charge with the switch off | The TP4056 can't end a charge correctly under load |

### 14.3 Load estimates (verify on the bench)

| Load on VBAT | Typical | Peak |
|---|---|---|
| XIAO with Wi-Fi and camera | 0.25 A | 0.4 A |
| MAX98357A into 4 Ω | 0.2 A | 0.7 A |
| Two SK6812 | 0.02 A | 0.1 A |
| **Total** | **about 0.5 A** | **about 1.2 A** |

- **MAX98357A.** It is specified from 2.5 to 5.5 V, so it has less headroom near 3.0 V. Cap the volume in firmware.
- **SK6812.** It is specified from 3.5 V and dims and shifts red below that. Show `low` (the red glow) before the LEDs fail.

### 14.4 Still assumed

| Item | Value used | Basis |
|---|---|---|
| Body proportions, face, wings | `MEASURES` (5.0): 260 × 187, foot Ø 190, gusset seam at 22 | Fitted to the reference photos (about ± 3 mm body, ± 5 mm face and wings). Replace with tape measures of the real doll |
| Module sizes in 6.3 | Nominal | Common off-the-shelf parts; measure the purchased ones |
| Speaker diameter | 40 mm | Not stated in the proposal |
| Camera eye | Left | The proposal's front view points to the eye on the viewer's right |
| Pod geometry | 7.1 | Not drawn in the proposal |

---

## Appendix A. Skin solids as built

This is the geometry code of the Skin solids (`model.mjs`, and `skin.mjs` `buildSkin`), with the doll's left at s = +1.
- `H` is `{ group: toki, layer }`.
- `VERT` is the vertical frame helper from `scene.mjs`.
- `M` is `MEASURES` reduced to values (5.0).

Add the tag, decals and details on top.

```js
const BA = M.width / 2, BZM = M.widestZ, BCU = M.height - M.widestZ, BRB = M.footD / 2;   // 130, 75, 112, 95
const rAt = (z) => z >= BZM ? BA * Math.sqrt(1 - ((z - BZM) / BCU) ** 2)
                            : BRB + (BA - BRB) * Math.sqrt(1 - ((BZM - z) / BZM) ** 2);
const slopeAt = (z) => /* dr/dz of rAt, clamped to ±60 where the profile turns horizontal */;
const normalAt = (z, a) => { const g = slopeAt(z), k = Math.hypot(1, g); return [sin(a) / k, cos(a) / k, -g / k]; };
const BODY_PROFILE = [[0, BRB], [M.bandTop, rAt(M.bandTop)], [BZM, BA], [M.height, 0]];

const WING = { t: M.wingT, root: 21, tip: 21, rootDisc: 9, curlR: 8 };
const wingAt = (s) => {
  const zr = BZM + BCU * Math.sqrt(1 - (M.wingRootX / BA) ** 2);           // 157.44
  const P = [s * M.wingRootX, 0, zr], V = normalAt(zr, s * 90);
  const U = rotAbout([V[2] * s, 0, -Math.abs(V[0])], V, -s * M.wingTwist);  // the tangent, twisted about V
  const A = unit(cross(U, V));                                              // thickness axis
  const root = { c: P + V * √(21² − 9²), r: 21 };                           // (s·99.78, 0, 172.31)
  const tip = { c: inPlane(s * (outlineOuter − 21), outlineTop − 21), r: 21 };   // (s·120.70, 0.03, 198.80)
  return { root, tip, contact: { n: −V, d: √(21² − 9²) }, sides: () => [{ n: A, d: 12 }, { n: −A, d: 12 }], face: A };
};

T.round({ name: "platter", ...H, F: VERT(0, 0), s0: -6, s1: 0, r: 120, tone: "mid", crease: "lo", details: { seams: [-4.4] } });
T.lathe({ name: "body", ...H, F: VERT(0, 0), profile: BODY_PROFILE, radius: rAt, slope: slopeAt, crease: "faint", details: { seams: [M.bandTop] } });
for (const s of [1, -1]) {
  const side = s > 0 ? "L" : "R";
  const w = wingAt(s);
  const [rootTip, tipRoot] = cut(w.root, w.tip);
  T.ball({ name: `wing.${side}.root`, ...H, ...w.root, flats: [w.contact, rootTip, ...w.sides()] });
  T.ball({ name: `wing.${side}.tip`, ...H, ...w.tip, flats: [tipRoot, ...w.sides()] });
}
```

The ground is the static base of 8.1; `stand.housing` (r 128, z −20 → −6) carries the platter.
