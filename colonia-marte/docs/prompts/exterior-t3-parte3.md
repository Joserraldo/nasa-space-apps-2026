# Exterior, part 3: the families' arrival made real, and a readable dust storm

Same folder, branch and rules as `docs/prompts/exterior-t3.md` and `exterior-t3-parte2.md` (budget of 200 draw calls max on the exterior, 95/120 fps min, 3 LODs, palette only, captures beside their reference with brightness checks, the four checks plus headed Chromium using **one** page that you close at the end). **Changes stay uncommitted** with their file list in the report; the reviewer commits. Don't edit `docs/restricciones-visuales.md`. Close every server and process you start before you finish.

The reviewer committed your previous round as `ced6e7a`. Two things are left.

## 1. The families arrive in a lander; the big ship stays in orbit

María Paula's decision (2026-11-26): MV-09/MV-10 represents NASA's Orion docked to the Deep Space Transport. That is a **transit ship**: with its huge solar wings it can never enter Mars' atmosphere or land. Today view 8 shows MV-10 descending onto MI-07, which is wrong and teaches children something false.

- **MV-10 stays in orbit.** In view 8 and in `final`, it is a small, recognizable silhouette high in the sky (visible against the backdrop, with its cyan lights), never on or near the ground. Use LOD `far` there. Remove its descent from `src/scenes/colony-arrival.ts`.
- **New piece `MV-12` "families' descent vehicle"** in `src/kit/pieces/mars/`, registered in `index.ts`, with its inventory row added to `docs/INVENTARIO.md` under MV-11. Based on NASA's published human Mars lander concepts, with no logos:
  - a **blunt, wide conical body** (heat-shield underside in dark gray, white upper hull with panels and joints, two tones plus cyan accent), a crew hatch with a small window band, RCS thruster clusters;
  - **4 landing legs** with round footpads that deploy;
  - **retro-rocket engines underneath** that fire during the final descent (supersonic retropropulsion is how NASA plans to land heavy loads on Mars): short warm engine glow plus a **ring of dust kicked up** from the pad while it lands, which fades after touchdown;
  - 3 LODs, the MV-09 quality bar (bevels, AO, small detail), 3,000 to 8,000 triangles in LOD0 unless justified.
- **`colony-arrival.ts`** animates MV-12 descending onto MI-07 (legs deploy before touchdown, engines on, dust ring, engines off at touchdown). Keep the existing `descent` parameter and the function signature so Santiago's game can drive it.
- Captures: `exterior-t3-mv12-detalle.jpg` (the lander alone, orbit camera) and view 8 recaptured with MV-12 on the pad and MV-10 visible in the sky.

## 2. The dust storm must stay readable

C4's `AMB-06` is too dense: in the capture the colony almost disappears in brown fog. A child has to see where they are and where to go.

- Keep the storm feeling (warm haze, less contrast, dusty panels, dimmer sun), but the **colony core must stay legible** from the game camera: the hub, the entrance and the vehicle area clearly visible, with the far terrain fading.
- Concretely: the fog should start further from the camera and reach full density only near the horizon, so nearby buildings keep most of their contrast. Measure it: in the C4 capture, the colony core region keeps a contrast (standard deviation of luminance) at least 60% of the clear-weather `final` capture from the same camera, and mean brightness within the brightness rules.
- Any airborne dust particles stay instanced and within budget.
- Recapture `colonia-c4.jpg` and record the contrast measurement in the report.

## 3. Report and pause

Update `docs/capturas/exterior-t3-informe.md` with a section «Part 3» in VERIFIED and NOT VERIFIED form: files per point, draw calls and fps for view 8, `final` and C4 (three runs each with the window in front, best and worst), and the contrast numbers. Then pause.
