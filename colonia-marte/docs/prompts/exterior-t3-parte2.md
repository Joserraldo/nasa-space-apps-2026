# Exterior, part 2: the paved base, the main entrance, the vehicle area and the colony by chapter

Same folder, branch and rules as `docs/prompts/exterior-t3.md` (section 2: budget of 200 draw calls max and 95/120 fps min, 3 LODs, palette only, captures beside their reference with brightness checks, the four checks plus headed Chromium). **Pieces stay uncommitted** with their file list in the report, and the reviewer commits. Don't edit `docs/restricciones-visuales.md`.

**Who does what (so nothing collides):** you (OpenCode) own **the layout**: `data/layouts/colonies/*.json`, `src/scenes/colony-layout.ts`, `src/scenes/exterior-pilot.ts` and the pieces that are **ground or infrastructure**. **Carbon makes standalone pieces** (vehicles MV-01/03/11, garage NX-01, entrance tower) in its own branch, with no placement. Where you need one of those and it doesn't exist yet, put a **placeholder slot** in the layout (a named entry with its future ID, hidden or marked with a gray box in debug), and the reviewer swaps in the real piece when merging.

María Paula: «the main entrance is missing, the starting base, where the cars are, several things are missing». Compared with the references, the gaps are these:

## 1. The paved base (the colony platform)

In `v3-t050.10` and `v3-t074.80` the whole colony sits on a **large platform of gray slabs with joints**, with **cyan LED lanes** in dashes marking the routes, and buildings, hangars and vehicles stand on it. Ours stands directly on the ground.

- A ground piece **`MI-01` with `layout: "plaza"`** (same ID, area variant): a grid of beveled slabs, cyan LED lanes as instanced dashes, a dark gray curb at the edge and the same transition to terrain you already solved for the street. It sits on the terrain without floating or sinking, flattening the terrain under it if needed (as with the landing pad).
- It covers the **core of the colony**: the hub, the vehicle area and the entrance. The capsules, the dome and the greenhouse may sit on its edge or on their own bases.
- The street (MI-01 `layout: "road"`) runs off the plaza toward the outer pieces.
- **Instancing is mandatory** for slabs and LEDs: the platform can't add more than ~6 draw calls.

## 2. The main entrance (`v3-t026.40`)

The colony's front door: where the rover arrives and the child enters. Composition in the layout:

- **A paved esplanade** (part of the plaza) in front of the **NX-04 airlock entrance**, which already exists, scaled or framed so it reads as the main entrance: frame, status lights and a cyan sign with no text.
- **MI-02 lamp posts** on both sides (from batch 2).
- **The lit entrance tower** (slot `MB-14` until Carbon makes it), beside the entrance, as a landmark visible from afar.
- A **parked rover** (slot `MV-01`) and **cargo crates** (existing pieces, or `MI-09`/`MI-11` if they fit).
- A new **camera view `view=5` "Main entrance"**, at eye height, matching the framing of `v3-t026.40`, for the capture.

## 3. The vehicle area (`v3-t050.10`, `v3-t074.80`)

- The **MB-10 hangars** that already exist, grouped on the plaza with their **doors facing the LED lanes**, and vehicle slots inside or at the door (`MV-03`, `MV-01`).
- **Parking** with marked bays (slot `NX-01` until Carbon delivers it), with room for 3 vehicles and the stranded rover once rescued (`MV-11`, C4).
- **MI-10 fuel tank** (from batch 2) beside the hangars.
- Lanes connecting the vehicle area to the entrance and to the colony exit toward the terrain.
- A camera view `view=6` "Vehicle area", from above at 3/4.

## 4. The colony grows by chapter (T5.5, exterior side)

`docs/DISENO-JUEGO.md`: «2 modules in C2, the greenhouse in C3, the garage and shelter in C4, communications and ice extraction in C5». Each chapter is a layout in `data/layouts/colonies/`:

| File | What exists |
|---|---|
| `c2-inicio.json` | **The starting base:** the MI-07 landing pad with NX-02, the first **2 modules** (one capsule and one connector or the small hub), solar panels (MI-04), the satellite antenna and the NX-04 airlock. Almost no plaza: a small patch of slabs around the modules. It should feel like **a newly arrived camp** |
| `c3.json` | Adds the **MB-11 greenhouse** and the street that connects it |
| `c4.json` | Adds the **vehicle area** (hangars, parking, vehicles) and the shelter |
| `c5.json` | Adds communications (antennas) and ice extraction toward the pole |
| `final.json` | The full colony, today's pilot plus everything above, with the families' ship MV-10 (slot) |

- `exterior-pilot.json` stays as the reference full colony (equivalent to `final`).
- A route `/colony?chapter=c2|c3|c4|c5|final` that loads each one, so Santiago can use them from his game. Tests: every layout validates against the schema, the pieces of each chapter are a subset of the next (it only grows) and every slot has its future ID from the inventory.
- Captures `docs/capturas/colonia-c2.jpg` ... `colonia-final.jpg`, from the same camera, to see the growth.

## 5. Order and pauses

1. Finish the **MI-01 route** (the previous round), then MI-02, MI-10, MB-05, MB-09 and MB-08 from batch 2.
2. **Section 1 (the paved base) and section 2 (main entrance). Pause** for María Paula's review with the `view=5` capture beside `v3-t026.40`.
3. Section 3 (vehicle area) and section 4 (chapters). Pause.

In each pause, measure fps in both views three times with the window in front and record the best and worst run.
