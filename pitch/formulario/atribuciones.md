# Attributions · Atribuciones

> **Borrador — un segundo humano lo revisa antes de enviar.**

## Mandatory line (in the game, README and form)

> **Data: NASA (exact source + date). Unofficial project, not endorsed by NASA.**

In the game each source card fills the "exact source + date" part, for example: *"Data: NASA CCMC DONKI, event 2024-05-20T05:36:00-CME-001, queried 2026-11-13; radiation on Mars: RAD on the Curiosity rover via NASA OSDR RadLab. Unofficial project, not endorsed by NASA."* (the key `datos.aviso` in `data/i18n` already carries the second sentence).

Rules we follow: no NASA logo or insignia anywhere; no wording that suggests NASA approves the game; AI or team calculations are never presented as "according to NASA"; data that is not NASA's is labeled with its real owner.

## 1. Data

Details, URLs and dates are in [datos-nasa.md](datos-nasa.md). All data was queried on 2026-11-13 and is static, not live.

| Data | Credit |
|---|---|
| Solar flares, CMEs, particle events, geomagnetic storms, WSA-ENLIL runs | NASA Community Coordinated Modeling Center (CCMC), DONKI. Kp index: NOAA |
| Radiation on the Martian surface (RAD, Curiosity rover, MSL) and inside Orion (HERA, Artemis I) | NASA Open Science Data Repository (OSDR), RadLab |
| Jezero elevation, shaded relief and CTX imagery | NASA Mars Trek. MOLA (NASA) blended with HRSC (ESA/DLR) for elevation; CTX camera on MRO (NASA) for imagery |
| Mars axis tilt and gravity | NASA NSSDC Mars fact sheet |
| Science cards OSD-772, OSD-546, OSD-360 | NASA OSDR. OSD-546 is an experiment selected by ESA; OSD-360 is a ground study partly NASA-funded |
| Mars reference dose 0.64 mSv/day | RAD / Curiosity (NASA). Reitz G., Matthiä D., Hassler D. M., et al. (2016), ICES2016, 437, https://elib.dlr.de/106090/ |
| Moon dose 1.369 mSv/day and ISS dose 0.731 mSv/day | Zhang S., Wimmer-Schweingruber R. F., Yu J., et al. (2020), *Science Advances* 6(39), eaaz1334, doi:10.1126/sciadv.aaz1334. Moon: LND on Chang'e-4, **CNSA (China), not NASA**. ISS: DOSIS 3D DOSTEL as cited there |
| Derived values (slope, sunlight, shielding scores; Sun height at the north pole; "storm intensity" 0 to 1) | Calculated by the team from the data above; labeled "derived", not NASA data |

## 2. Software libraries (from `package.json` and `package-lock.json` of this repo)

| Library | Version in lockfile | License |
|---|---|---|
| TypeScript | 5.9.3 (data package pins 5.6.3) | Apache-2.0 |
| Vitest | 2.1.9 (data package: 2.1.5) | MIT |
| Zod | 3.25.76 (data package: 3.23.8) | MIT |
| tsx | 4.23.15 | MIT |
| @types/node | 22.9.0 | MIT |

Licenses are the `license` field recorded in `package-lock.json`. Libraries used only to build and test (TypeScript, Vitest, tsx, @types/node) are not shipped to players.

**POR VERIFICAR:** the front end and server libraries are not in the repo yet (`ui/` has no `package.json`; the classifier Worker (`infra/worker`, PR #76) uses no framework, only `fetch` (no Hono)). The plan names React, Vite, PixiJS or Three.js and Hono (Cloudflare Workers), but the exact list, versions and licenses must be re-read from the final `package-lock.json` before sending. Add each one to the table above.

## 3. Fonts, images, sounds, 3D models

- Repo today: no fonts, images, sounds or 3D models by the team. `assets/` only holds a README; `assets/LICENCIAS.md` does not exist yet.
- Real map imagery from Mars Trek is listed under Data above.
- **POR VERIFICAR:** fonts, icons, sounds, music and 3D models that `ui` adds. Rule for the team: CC0 or original, each piece recorded in `assets/LICENCIAS.md`. Copy that file's contents here before sending.
- **POR VERIFICAR:** any art produced with AI tools (none is registered in `docs/ia-uso.md` so far).
- Characters (crew experts and the base AI, Iris) are original to this project. No characters, names or look of existing franchises.

## 4. Services

| Service | Use | Note |
|---|---|---|
| Cloudflare (Pages / Workers) | Hosting and the optional classifier endpoint | **POR VERIFICAR:** not deployed yet; confirm when it is |
| Language-model provider for the optional classifier (b.ai, API compatible with OpenAI) | Only sorts a typed phrase into JSON; see [ia-uso.md](ia-uso.md) | Models tested: `qwen3.8-flash`, `deepseek-v4.1-flash`. Not enabled by default (see D4) |
| Browser Web Speech API | Optional voice input and output | Done in the player's browser; the game stores no audio |

## 5. Project license

**POR VERIFICAR:** the repo has no `LICENSE` file. The Space Apps terms may require an open license for submitted original content (`docs/reglas.md`, unconfirmed). Decide and add the license before sending.

---

## Resumen en español

Línea obligatoria: **"Datos: NASA (fuente exacta + fecha). Proyecto no oficial, no avalado por NASA."** Sin logo de NASA. Datos: DONKI (NASA CCMC; Kp de NOAA), OSDR RadLab (RAD de Curiosity y HERA de Artemis I), Mars Trek (MOLA de NASA con HRSC de ESA/DLR; CTX de MRO), ficha de Marte de NSSDC, estudios OSDR; dosis de Luna e ISS de Zhang et al. 2020 (CNSA, no NASA). Librerías del repo: TypeScript (Apache-2.0), Vitest, Zod, tsx y @types/node (MIT). Aún no hay fuentes, imágenes, sonidos ni modelos 3D en el repo; las librerías de UI y Worker, los assets y la licencia del proyecto están marcados POR VERIFICAR.
