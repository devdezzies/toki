# Toki v2: the mint winged plush, with a sealed pod

> **Superseded in part by v3 (`TOKI_3D_SPEC.md`).** v3 measures the doll from the photos in `doll-design/` and types the result once, in `MEASURES` (`model.mjs`, spec 5.0). The body is now 260 × 187, Ø 190 on the table, gusset seam at 22, and turned as one lathe; the face, swirls, seams, wings and tag moved to their measured places. To keep 10 mm of stuffing round it, the pod shrank to x ±68, y −20 → 76, z 30 → 132.5. The exterior and pod numbers below are v2's and are kept as history; `DEVIATIONS.md` lists every v3 change.

This brief replaces sections 5–7 and 14 of `TOKI_3D_SPEC.md`. These sections of that file still govern:

- section 4: units and axes
- section 8: scene, base and camera
- section 9: behaviour
- section 10: engine rules

`model.mjs` is the only place a number is typed. This file explains those numbers. Where the build had to depart from them, `DEVIATIONS.md` records why.

## 1. Why the change

- **The doll changed.** The product is now the round mint plush in the reference photos: a soft dome, wider than tall, on a short bottom band, with two white quilted wings on top. It has embroidered orange-ringed eyes, an open smile with a pink tongue, white swirls on both sides, panel seams and a care tag. It has no limbs, no muzzle and no screen.
- **The electronics needed a safer container.** The panda kept its modules on an open 3D-printed frame, with only the stuffing between them and the child. v2 puts every hard part in one sealed, flame-retardant pod.

## 2. Exterior (Skin scene)

| Part | Geometry |
|---|---|
| Body | Sphere r 130, centre (0, 0, 80). It is cut flat at z = 25.4, where its girth equals the band's |
| Band | Upright round r 118, z 0 → 25.4. This is the bottom panel's gusset, and the sphere's flat sits flush on it |
| Wings ×2 | A narrow root ball (r 17) on the body and a larger lobe ball (r 21) above it, leaning out. Both are cut to 30 thick by two side flats. The quilted curl is drawn on each face of the lobe. The top reaches z ≈ 250 |
| Care tag | 14 × 28 × 0.8 flap at the back right, on its own small flat |

Overall size: 260 wide and 210 tall (≈ 250 to the wing tips), Ø 236 on the platter.

Embroidery is decals laid tangent to the body. Each decal sits on a small flat (Ø 12–14), a seat that stays hidden under the decal.

| Feature | Where | Drawing |
|---|---|---|
| Eyes ×2 | z 128, ±23.4° from the front | Orange ring Ø 34, black iris Ø 25, a white glint at upper left and a four-point sparkle at lower right. The left eye's pupil has a dark lens hole Ø 3 |
| Mouth | z 86, front | Open smile 36 × 29 with an orange rim and a pink tongue |
| Swirls ×2 | z 130, ±58.5° | White stitched spiral Ø 25 over the cheek glow |
| Seams | Centre back and ±112° | From the crown down to the band, where the band's edge closes the ring |

## 3. Electronics

```
18650 (own PCM) ─W1─► TP4056 + DW01 (USB-C) ─W2─► rocker ─W3─► hub: PTC fuse → VBAT bus 3.0–4.2 V
                                    └────────────W4 (return)────────────► hub
hub VBAT ─► XIAO ESP32-S3 Sense (BAT pads, on-board 3.3 V) ─► INMP441 microphone (W5: I²S + 3.3 V)
        ─► MAX98357A I²S class-D (traces on the hub) ─W6─► 40 mm 3 W speaker behind the mouth
        ─► 2 × SK6812 RGB LED + acrylic light pipes behind the swirls (W7 left, W8 right)
OV5640 lens in a sealed turret at the left eye's pupil ─flex─► the XIAO's camera connector
XIAO ──Wi-Fi──► backend (not drawn)
```

| # | Name | Part | Function (readout) |
|---|---|---|---|
| 01 | Controller | Seeed XIAO ESP32-S3 Sense: Wi-Fi, 8 MB PSRAM, camera connector | main controller · Wi-Fi |
| 02 | Camera | OV5640 lens module on a 75 mm flex | image input |
| 03 | Microphone | INMP441, I²S | voice input |
| 04 | Amplifier | MAX98357A I²S class-D, 3 W | speaker amplifier |
| 05 | Speaker | 40 mm, 3 W, 4 Ω | sound output |
| 06 | Battery | 18650 Li-ion, 2600 mAh, protected | power source |
| 07 | Charger | TP4056 USB-C module with DW01 protection | charges and protects the cell |
| 08 | Switch | Rocker in a sealed boot, 3 A | power on / off |
| 09 | Cheek lights | 2 × SK6812 RGB LED behind acrylic light pipes | shows emotion and battery state |
| 10 | Hub board | Perfboard 48 × 66: VBAT bus, PTC fuse, connectors | power and signal distribution |

These parts of the panda design are removed, and why:

- **5 V boost converter.** Every load runs from the cell's 3.0–4.2 V: the XIAO through its own regulator, and the MAX98357A and the SK6812s directly. One less hot part, and no 5 V rail to fuse.
- **ESP32-CAM and its UART link.** A single XIAO Sense board drives the camera.
- **PAM8403 and the attenuator.** The amplifier now takes I²S directly.
- **OLED and its belly window.** The plush has no screen. The cheek lights carry emotion and battery state, as colours.

| Cable | From → to | Cores | r | Hue | Readout |
|---|---|---|---|---|---|
| W1 | Battery bay → charger | 2 | 0.9 | red | cell 3.7 V |
| W2 | Charger OUT+ → switch | 1 | 0.7 | red | switched supply |
| W3 | Switch → hub | 1 | 0.7 | red | VBAT 3.0–4.2 V |
| W4 | Charger OUT− → hub | 1 | 0.7 | red | supply return |
| W5 | Hub → microphone | 5 | 1.2 | blue | I²S · SCK WS SD + 3.3 V |
| W6 | Amplifier → speaker | 2 | 0.9 | green | audio out |
| W7, W8 | Hub → left and right LED | 3 | 1.0 | blue | LED data + VBAT |

## 4. The sealed pod (the safer container)

- **Shell.** A clamshell of V-0 (flame-retardant) ABS. Plan x ±70, y −20 → 86, corner r 14, z 30 → 137, wall 2.5.
- **Covers.** It splits at y = 35 into a front cover and a rear cover with a gasket between them.
  - The covers close on three pairs of tabs per side, at z 45, 84 and 123. Each pair takes one pin-hex security screw: six in all.
  - The front cover carries the speaker grille, the microphone port, the camera turret, both light-pipe glands and the two cable clips under its lid.
- **Floor.** The floor stays when the covers open. It carries:
  - the battery in its own screwed bay (end plates, rails and a two-screw lid)
  - the charger
  - the switch
  - the hub board, in two clips
- **Charging and switching from outside.** The USB-C receptacle (with a silicone plug) and the switch (in a sealed boot) hang under the floor. They are reached through a zip in the plush's bottom panel.

Each safety measure, and why it is there:

| Measure | Why |
|---|---|
| Sealed ABS clamshell, gasketed, V-0 | Nothing hard or small is reachable even if a seam opens; it contains a cell fault and keeps out drool and washing water |
| Security screws, battery in a screwed bay | Toy standards require a tool to reach the battery |
| Double cell protection (the cell's own PCM and the DW01) plus a PTC fuse on the hub | A short anywhere downstream trips before the cell is stressed |
| No cable leaves the pod | Nothing can be pulled, chewed or caught |
| At least 10 mm of stuffing round the pod (checked by `check()`) | The child feels plush, not a box. Only the camera window and the light-pipe tips come closer, and they stay ≥ 4 mm inside the fabric |
| Rounded corners, the pod in a sewn pocket | It can't shift or point into the fabric |
| Charge with the switch off | The TP4056 can't end a charge correctly under load |

## 5. Placement (axis-aligned boxes, `BOXES` in `model.mjs`)

| # | Where | Box (mm) |
|---|---|---|
| 10 | Upright in the X–Z plane, near the split, in floor clips | x ±24, y 30 → 31.6, z 34 → 100 |
| 01 | On the hub's front face, Sense board and camera connector in front | x 2 → 19.8, y 31.6 → 42, z 58 → 80 |
| 04 | On the hub's front face beside the XIAO, screw terminal on top | x −22 → −4.2, y 31.6 → 42.7, z 66 → 85.4 |
| 06 | Cell along X in its bay on the floor | x −49 → 26.5, y ±11, z 32.5 → 56 |
| 07 | Flat on the floor; its USB-C and plug under the floor | x 32 → 48, y ±14, z 32.5 → 40 |
| 08 | Body on the floor; its face in the boot under the floor | x 50 → 62, y −7.5 → 8, z 32.5 → 47.5 |
| 05 | Rim on the front wall's inner face behind the mouth | Ø 40, y 64.5 → 83.5, centre z 86 |
| 03 | Round board on the front wall behind its port | (−36, 82.7, 97), Ø 14 |
| 02 | Module board behind the turret; the window 6 mm behind the pupil | Lens at (47.9, 104.7, 127.9) |
| 09 | LED boards on the side walls' inner faces; pipes out to 5 mm behind each swirl | y 62.6, z 129.9 |

The hardware view shows the pod on three thin display posts in place of the removed stuffing. They are not part of the product.

## 6. Figure behaviour that changed

- **Hardware scene.** It opens on the closed pod. `D` (or Open pod) lifts the front cover up and a little forward (120 mm) with everything mounted on it, and slides the rear cover back (90 mm). Picking or inspecting a component inside opens the pod.
- **Lit accent.** In Skin it is the cheek glow. In Hardware it is the selected component, or the cheek lights when nothing is selected.
- **Demo.** The same nine-chapter story, with "Display" replaced by "Cheeks": the LEDs wake pale, then take the emotion's colour. Every hardware shot opens the pod, and the camera aims at the component's centre in its own cover's frame.

## 7. Still assumed (verify on the bench)

| Item | Value | Basis |
|---|---|---|
| Body proportions | 260 × 210, band 25 high | Read from the photos (± 10 mm) |
| Load on the cell | About 0.5 A typical, 1.2 A peak | XIAO with Wi-Fi and camera 0.25 / 0.4; MAX98357A into 4 Ω 0.2 / 0.7; two LEDs 0.02 / 0.1 |
| MAX98357A from VBAT | 2.5–5.5 V supply; less headroom near 3.0 V | Cap the volume in firmware, or step down when the cell is low |
| SK6812 from VBAT | Specified from 3.5 V; dim and red-shifted below that | Show "low battery" before the LEDs fail |
