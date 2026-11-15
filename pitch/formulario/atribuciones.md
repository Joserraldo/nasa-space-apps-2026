# Attributions · Atribuciones

> **Borrador actualizado el 15 nov (mañana) por un agente de apoyo a pedido de Santiago — un segundo humano lo revisa antes de enviar.** Las filas de la Luna, el polo norte de Marte y la CSA son de misiones que solo existen como datos (no jugables); ver `datos-nasa.md` sección 9.

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
| Science cards OSD-269, OSD-314, OSD-326, OSD-289 | NASA OSDR. OSD-314: experiment in ESA's EMCS (Spain's State Research Agency); OSD-326: NIH and U.S. DoD funded; OSD-289: JAXA experiment |
| Moon sites (near Apollo 11, 16, 15) and south pole craters: elevation, shaded relief, positions (data only, not playable) | NASA Moon Trek (JPL), LOLA on LRO (NASA); NASA GSFC PGDA, Mazarico et al. 2011 (horizon method) |
| Mars north pole elevation (data only, not playable) | NASA Mars Trek, MOLA polar DEM; IAU nomenclature |
| Radiation in lunar orbit (CRaTER, LRO) and Sun position at Apollo sites on the 2024 storm dates | NASA OSDR RadLab (CRaTER); NASA SVS 5187 |
| Food cards (Space Station meals, CANGrow) | **Canadian Space Agency (CSA), a challenge partner, not NASA.** © Canadian Space Agency, terms https://www.asc-csa.gc.ca/eng/terms.asp#copyright |
| Derived values (slope, sunlight, shielding scores; Sun height at the north pole; "storm intensity" 0 to 1) | Calculated by the team from the data above; labeled "derived", not NASA data |

## 2. Software libraries (from `package.json` and `package-lock.json` of this repo)

| Library | Version in lockfile | License |
|---|---|---|
| TypeScript | 5.9.3 (data package pins 5.6.3) | Apache-2.0 |
| Vitest | 2.1.9 (data package: 2.1.5) | MIT |
| Zod | 3.25.76 (data package: 3.23.8) | MIT |
| tsx | 4.23.15 | MIT |
| @types/node | 22.9.0 | MIT |
| React, React DOM (game screen, shipped to players) | 18.3.1 | MIT |
| Vite, @vitejs/plugin-react (build only) | 5.4.21, 4.7.0 | MIT |
| @types/react, @types/react-dom (build only) | 18.3.31, 18.3.7 | MIT |

Licenses are the `license` field recorded in `package-lock.json`. Libraries used only to build and test (TypeScript, Vitest, tsx, @types/node) are not shipped to players.

**POR VERIFICAR:** re-read this table from the final `package-lock.json` before sending. `develop` today has React and no Three.js; the branch `feat/ui-escenarios` adds `three` 0.160.1 and `@types/three` (MIT, decision D6, shipped to players if the 3D scene is in the submitted build), so add it to this table if it is. The Worker (`infra/worker`) uses no framework, only `fetch` (no Hono). `@playwright/test` ^1.65.1 (Apache-2.0, **POR VERIFICAR**) is used only for end-to-end tests.

## 3. Fonts, images, sounds, 3D models

- `develop` today: no fonts, images, sounds or 3D models by the team. On `feat/ui-escenarios`, `assets/LICENCIAS.md` lists **Nunito and Nunito Italic** (The Nunito Project Authors, SIL Open Font License 1.1, latin subset from Google Fonts v32, served from the game, never from Google at runtime; license in `ui/public/fuentes/OFL.txt`). Add that row here if the branch is in the submitted build. A logo PNG (`ui/public/logo-solar-shield.png`) is also there: **POR VERIFICAR** its origin (original to the project? made with an AI tool?) and record it in `assets/LICENCIAS.md`.
- Real map imagery from Mars Trek is listed under Data above.
- The 3D scene is built only with code in Three.js (procedural); no external 3D models (D6).
- **POR VERIFICAR:** sounds and music (none registered). Rule for the team: CC0 or original, each piece recorded in `assets/LICENCIAS.md`. Copy that file's contents here before sending.
- **POR VERIFICAR:** any art produced with AI tools (none is registered in `docs/ia-uso.md` so far). The character portraits and the illustrated intro come from the design references of `docs/referenciapau/`: **POR VERIFICAR** with María Paula how they were made.
- Characters (crew experts and the base AI, Iris) are original to this project. No characters, names or look of existing franchises.

## 4. Services

| Service | Use | Note |
|---|---|---|
| Cloudflare (Workers, D1, rate limiting) | One Worker serves the game and the API (classifier, optional login, progress) | Deployed from GitHub Actions since 14 Nov |
| Language-model provider for the optional classifier (b.ai, API compatible with OpenAI) | Only sorts a typed phrase into JSON; see [ia-uso.md](ia-uso.md) | Models tested: `qwen3.8-flash`, `deepseek-v4.1-flash`. The Worker route exists but the game screen does not call it today (see D4) |
| Browser Web Speech API | Not used: the game screen has no voice input or output in this version | Future work. The game records no audio |

## 5. Project license

The repository is public (https://github.com/Joserraldo/nasa-space-apps-2026). **POR VERIFICAR:** the repo has no `LICENSE` file (checked 15 nov, `develop`); the decision is José's (`infra/ESTADO.md`). The Space Apps terms may require an open license for submitted original content (`docs/reglas.md`, unconfirmed). Decide and add the license before sending.

---

## Resumen en español

Línea obligatoria: **"Datos: NASA (fuente exacta + fecha). Proyecto no oficial, no avalado por NASA."** Sin logo de NASA. Datos: DONKI (NASA CCMC; Kp de NOAA), OSDR RadLab (RAD de Curiosity y HERA de Artemis I), Mars Trek (MOLA de NASA con HRSC de ESA/DLR; CTX de MRO), ficha de Marte de NSSDC, estudios OSDR; dosis de Luna e ISS de Zhang et al. 2020 (CNSA, no NASA). Librerías del repo: TypeScript (Apache-2.0), Vitest, Zod, tsx, @types/node, React 18.3.1 y Vite 5.4.21 (MIT). También: estudios OSDR extra (ESA, NIH/DoD, JAXA indicados), datos de la Luna y del polo norte de Marte (Moon Trek, LOLA, PGDA, SVS 5187; solo como datos) y tarjetas de comida de la **Agencia Espacial Canadiense (socia del reto, no NASA)**. En `feat/ui-escenarios` entran Three.js 0.160.1 (MIT) y la fuente Nunito (SIL OFL 1.1, en `assets/LICENCIAS.md`); la 3D es solo código, sin modelos externos. No hay voz en esta versión. La tabla final de librerías, el origen del logo y las ilustraciones, los sonidos y la licencia del proyecto (no hay archivo `LICENSE`; el repo es público) están marcados POR VERIFICAR.
