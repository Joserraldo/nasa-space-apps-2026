# Rescue status: Solar Shield

Updated: Sun 15 Nov 2026, 18:50 (local). Worktree: `C:/Users/mpaul/Documents/ss-rescue`, local branch `main`
(= `origin/develop` at `def6e77` + the work below). Nothing has been pushed. `[V]` = verified by
execution in this worktree; `[NV]` = not verified.

Working plan: `docs/referenciapau/PLAN-INTEGRACION-SANTIAGO-PAULA.md` (Haiku reads, Opus implements,
Fable integrates and audits).

## Known issues that stay OPEN until fixed and validated on the real game

| # | Issue | State | Evidence before |
| --- | --- | --- | --- |
| 1 | Mobile portrait: HUD too tall, child cut off, actions outside the first screen | OPEN (workstream A in progress) | `ui/capturas/rescate/antes/e6-base-390x844.png` |
| 2 | Camera fixed; does not follow the player; no working first/third person switch in the game | OPEN (workstream B in progress) | `ui/capturas/rescate/antes/e6-base-1024x683.png` |
| 3 | E7: the panel covers about 62 % x 62 % of the world; resources shown twice | OPEN (workstream A in progress) | `ui/capturas/rescate/antes/e7-tormenta-1024x683.png`, `e7-plan-1024x683.png` |
| 4 | The child is cut off at the bottom edge at every size (fixed framing) | OPEN (workstream B) | `ui/capturas/rescate/antes/e6-base-*.png` |
| 5 | E6 layout differs from the reference: permanent 40 % side panel instead of the full-screen world with Crew, Map, `[E]`, `[V]` | OPEN (workstream A) | `ui/capturas/rescate/antes/e6-base-1024x683.png` vs `santiago/04_Jugabilidad/01_Web/01_tercera_persona.png` |
| 6 | Shield module is modelled as a small shelter door in a rock; it does not read as a shield (spec: "carcasa de refuerzo con señal de estado, distinto de refugiarse") | OPEN (fidelity batch F, after B) | `ui/capturas/rescate/antes/escena-recorte-escudo.png` |
| 7 | Crew stands still: only the idle gesture; Iris does not accompany | OPEN (workstream B) | same captures |
| 8 | Engine: a resource reaching 0 beats the telemetry arriving in the same turn (`engine/src/acciones.ts:330`) | OPEN, design decision, not touched | Sonnet simulation report |

A screenshot, a green test or a mounted component does not close any of these: each one closes only
with a before/after pair looked at next to its reference, at 1440x900, 1024x683, 844x390 and 390x844.

## Completed

- `[V]` Baseline: `origin/main` was byte-identical to `develop` commit `32ab2e9`; local `main` = current `develop`.
- `[V]` E6 Base now mounts the 3D scene (PR #247 integrated; before it was an empty box).
- `[V]` Crew (child, Engineer, Iris) mounted in the shared scene (PR #328 branch integrated).
- `[V]` One reducer for the game state (`ui/src/juego/reductor.ts`); the duplicate in `App.tsx` is gone.
- `[V]` `Continue` on the cover works: the game in progress is saved in the browser and restored after a reload.
- `[V]` Language and sound choice are remembered; the sound switch now produces sound (Web Audio, no files).
- `[V]` New e2e: defeat, replay with a clean game, continue after reload, remembered language.
- `[V]` e2e clock stepping changed to `fastForward` (with the 3D scene, `runFor` took 46 s to 84 s per test).
- `[V]` Additive A/B interface in `EscenaBaseProps` (destination, blocked, position, camera toggle, touch input).
- `[V]` Capture script `tests/capturas/capturar.mjs`; 60 "before" images in `ui/capturas/rescate/antes/` (untracked).

## Audits

- Engine (Sonnet, by simulation): both endings reachable; passive player loses at turn 10; golden path wins at
  turn 5; 151 distinct end states over 160 site x module x dilemma combinations. `[NV]` by the lead.
- Localization (Haiku): 795 keys in each language, full parity, no hard-coded text; 7 missing keys only in the
  unused account module (`ui/src/juego/cuenta.ts`). `[NV]` by the lead.

## Tests executed (last run on `main` before the workstreams)

- `npm run typecheck`: exit 0. `npm test`: 112 files, 840 tests passed. `npm run build`: OK.
- `npx playwright test`: 4 passed (13.4 s).

## Deployment (read-only checks, nothing deployed)

- `[V]` Production `nasa-space-apps-2026.santiago031541.workers.dev`: HTTP 200, older bundle (`main` of 13:40);
  `/api/health` reports model and database OK.
- `[V]` Preview `nasa-space-apps-2026-preview...workers.dev`: HTTP 200, bundle identical to the local build of `develop`.
- `[V]` `hackaton-nasa.trakatra.lat`: HTTP 200, serves the same bundle as the preview (develop), not production.
  `[NV]` which Worker the domain is attached to (it is not in `wrangler.jsonc`; set in the dashboard).
- `[V]` `wrangler` is not authenticated on this machine: deploys only happen through GitHub Actions on push to
  `develop` (preview) or `main` (production). `main` is protected (required check "Tipos y tests").

## Blockers

- Publishing: pushing to `develop` or `main` deploys. Not done; needs an explicit decision on the target.
- A real phone and an older PC have not been tested: everything mobile here is emulation in headless Chromium.

## Next three actions

1. Audit and integrate workstream A (`rescate/a-pantallas`) and workstream B (`rescate/b-mundo`), then test both together.
2. Fidelity batch F: shield module first, then every object reviewed from the walking camera.
3. Full playthrough in EN and ES at the four sizes, "after" captures, then decide where to publish.
