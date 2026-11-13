# NASA data used and why · Datos de NASA usados y por qué

> **Borrador — un segundo humano lo revisa antes de enviar.**

Everything below comes from files inside this repository (`data/`, `docs/science/`). Nothing is live: all data was downloaded on **2026-11-13**, curated by code (`npm run curar`) and bundled in the game. The in-game label says "Real curated data, not live". Unofficial project, not endorsed by NASA.

"POR VERIFICAR" = the repo does not give that detail; a human must confirm it before sending.

## 1. Why these data

The challenge asks for visible consequences tied to real space weather. DONKI gives the storm with its ID and date; RadLab shows what a storm actually did on Mars; Mars Trek gives the real place (Jezero crater) where the base lives; OSDR and reference doses explain why shielding and food matter. We always label each number as **measured**, **modeled** or **derived by the team**.

## 2. Solar storms: NASA CCMC DONKI (static, curated)

- **Source:** NASA Community Coordinated Modeling Center (CCMC), DONKI. Portal: https://ccmc.gsfc.nasa.gov/tools/DONKI/ . The Kp index inside DONKI geomagnetic storms is provided by NOAA.
- **Queried:** 2026-11-13 (`data/raw/*/consulta.json`). Endpoints: `https://api.nasa.gov/DONKI/{CME,SEP,GST,WSAEnlilSimulations}` and, for flares, `https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR` (FLR returns 404 on api.nasa.gov).
- **How it is used:** one real storm per game (picked by seed). The Space Weather expert reads its real phases; the storm tells the child when to decide about shielding. The golden-path demo storm is `2024-05-20-marte`.
- **Status:** static, curated. Never presented as live.

Event pages: `https://ccmc.gsfc.nasa.gov/DONKI/view/<TYPE>/<number>/-1`. The number in parentheses below is that view number (from the `url` of each phase in `data/curated/*.json`).

| Game storm id | Date | DONKI event IDs used | Frame in game |
|---|---|---|---|
| `2024-05-20-marte` (golden path) | 2024-05-20 | CME `2024-05-20T05:36:00-CME-001` (31034) | observed on Mars |
| `2024-05-11-x58` | 2024-05-11 | FLR `2024-05-11T01:10:00-FLR-001` (30711), CME `2024-05-11T01:36:00-CME-001` (30719), SEP `2024-05-11T02:10:00-SEP-001` (30714); ENLIL `WSA-ENLIL/30801/1` | modeled |
| `2024-05-10-gannon` | 2024-05-09/10 | FLR `2024-05-09T08:45:00-FLR-001` (30605), CME `2024-05-09T09:24:00-CME-001` (30619), SEP `2024-05-10T13:35:00-SEP-001` (30677), GST `2024-05-10T15:00:00-GST-001` (30693; Kp 9, Earth) | scenario |
| `2024-05-14-x87` | 2024-05-14 | FLR `2024-05-14T16:46:00-FLR-001` (30849), CME `2024-05-14T17:00:00-CME-001` (30867); ENLIL `WSA-ENLIL/30869/1` | modeled |
| `2024-10-03-x90` | 2024-10-03 | FLR `2024-10-03T12:08:00-FLR-001` (33693), CME `2024-10-03T12:48:00-CME-001` (33703), GST `2024-10-07T12:00:00-GST-001` (33817; Kp 7.33, Earth); ENLIL `WSA-ENLIL/33719/1` | modeled |
| `2024-10-10-g4` | 2024-10-09/10 | FLR `2024-10-09T01:25:00-FLR-001` (33863), CME `2024-10-09T02:12:00-CME-001` (33873), SEP `2024-10-09T03:50:00-SEP-001` (33868), GST `2024-10-10T15:00:00-GST-001` (33913; Kp 8.67, Earth); ENLIL `WSA-ENLIL/33939/1` | modeled |
| `2017-09-06-x93` | 2017-09-06/07 | FLR `2017-09-06T11:53:00-FLR-001` (13010), CME `2017-09-06T12:24:00-CME-001` (13013), SEP `2017-09-06T23:30:00-SEP-001` (13081), GST `2017-09-07T21:00:00-GST-001` (13054; Kp 8, Earth) | scenario |
| `2017-09-10-x82` | 2017-09-10 | FLR `2017-09-10T15:35:00-FLR-001` (13098), CME `2017-09-10T16:09:00-CME-001` (13107), SEP `2017-09-10T16:25:00-SEP-001` (13101) | observed on Mars |

Honest wording rules:
- **Kp is an Earth index.** It is shown only for Earth, never as a Mars measurement.
- **WSA-ENLIL** arrival times at Mars are a **model calculation**, not a measurement ("the model calculates it arrives in X hours").
- "Scenario" = a real storm that happened near Earth; in the game we imagine it reaches the base. "Modeled" = ENLIL computed an arrival at Mars. "Observed" = a detector on Mars recorded a rise.
- A flare is a flash of light; the particle cloud (CME) comes later. The game never treats the flash as the thing that hits the base.

## 3. Radiation measured on Mars: NASA OSDR RadLab, RAD instrument (static, curated)

- **Source:** NASA Open Science Data Repository (OSDR) RadLab Data API, instrument `MSL-RAD-Surface` (RAD on the Curiosity rover, MSL mission, Gale crater). API docs: https://visualization.osdr.nasa.gov/radlab/gui/data-api/
- **Queried:** 2026-11-13. Query as stored in `data/curated/2024-05-20-marte.json`: `https://visualization.osdr.nasa.gov/radlab/api/?instrument_id=MSL-RAD-Surface&timestamp>=2024-05-03&timestamp<2024-05-26&absorbed_dose_rate>0&format=json` (window 2024-05-03 to 2024-05-26).
- **Values used** (absorbed dose rate, daily means UTC, µGy/h):
  - 2024-05-20: background 4.1, then 79.7 the same day (about 19.4 times; single-sample peak 304). Shows the golden-path storm reached Mars.
  - 2017-09-11: background 7.9, then 17.9 (about 2.3 times; peak 23.2).
  - 2024-05-14: no increase (0.9 times), even though ENLIL modeled the cloud heading to Mars.
  - October 2024: RAD returned no data (empty response), so no Mars measurement is shown for those storms.
- **How it is used:** the "measured on Mars" source card and the Doctor's explanations. The unit stays µGy/h (detector, absorbed dose). It is never converted into mSv (people).
- **Status:** static, curated.

## 4. Artemis I radiation: NASA OSDR RadLab (static, curated)

- **Source:** OSDR RadLab, instrument `Artemis-I-HERA-HSU1` (HERA, Orion spacecraft, Artemis I). URL as stored in `data/ciencia/artemis.json`: `https://visualization.osdr.nasa.gov/radlab/api/?instrument_id=Artemis-I-HERA-HSU1&absorbed_dose_rate>0&format=json`
- **Queried:** 2026-11-13. Data span 2022-11-16 to 2022-12-11 (36,583 samples).
- **Values:** cruise median 16.68 µGy/h; peak 8012.58 µGy/h on 2022-11-16 (about 480 times the median, shortly after launch). The cause of the peak is not claimed (no verified source).
- **How it is used:** one science card: radiation changes depending on the moment of the trip. Absorbed dose, µGy/h.

## 5. Real map of Jezero crater: NASA Mars Trek (static)

- **Source:** NASA Mars Trek, https://trek.nasa.gov/mars/ (ArcGIS ImageServer under `trek.nasa.gov/mars/trekarcgis/rest/services/`).
- **Queried:** 2026-11-13 (`data/terreno/jezero/consulta.json`). Area: longitude 76.9 to 78.3 E, latitude 17.7 to 19.1 N.
- **Layers:** elevation `Mars_MOLA_blend200ppx_HRSC_DEM_clon0dd_200mpp_lzw` (MOLA, NASA, blended with HRSC, ESA/DLR); shaded relief `Mars_MOLA_blend200ppx_HRSC_Shade_clon0dd_200mpp_lzw`; CTX imagery `Jezero_CTX_BlockAdj_dd` (MRO CTX, NASA), tiles at level 9. Full layer URLs are in `consulta.json`.
- **How it is used:** map to draw the landing route and choose the site. Slope, sunlight and shielding scores are **derived by the team** from elevation and labeled as derived.
- **Status:** static image and elevation files bundled in the game.

## 6. Reference doses for people (mSv/day)

Stored in `data/ciencia/radiacion.json` (queried 2026-11-13). Unit for people: **mSv/day** (dose equivalent). Never mixed with µGy/h.

| Place | Value | Source |
|---|---|---|
| Mars surface | 0.64 ± 0.12 mSv/day (2012-08-07 to 2013-06-01) | RAD / Curiosity (NASA, MSL). Reitz G., Matthiä D., Hassler D. M., et al. (2016), ICES2016, 437. https://elib.dlr.de/106090/ |
| Moon surface | 1.369 mSv/day (2019) | **CNSA, not NASA.** LND on Chang'e-4. Zhang S., et al. (2020), *Science Advances* 6(39), eaaz1334. doi:10.1126/sciadv.aaz1334 . Text: https://europepmc.org/article/PMC/PMC7518862 |
| International Space Station | 0.731 mSv/day (same period as Chang'e-4) | DOSIS 3D DOSTEL, as cited in Zhang et al. 2020 (not a NASA measurement) |

Mars vs. ISS comparisons are approximate: they were measured in different years (different solar cycle).

## 7. Mars fact sheet: NASA NSSDC

- **Source:** https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html (page updated 2025-05-19); queried 2026-11-13.
- **Values used:** axis tilt 25.19 degrees (used to estimate the Sun's height near the north pole); surface gravity 3.73 m/s², which is 0.380 of Earth's ("on Mars you weigh about a third").
- **Honest note:** the Sun-height estimate is **derived by the team**; the game has no terrain map for that region.

## 8. Science cards: NASA OSDR studies

Source: NASA OSDR, `https://osdr.nasa.gov/bio/repo/data/studies/<ID>`. Queried 2026-11-13 via `https://osdr.nasa.gov/osdr/data/search`.

| Study | Topic | Title | Owner as recorded in the repo |
|---|---|---|---|
| OSD-772 | food | PH-04 Chile Peppers in Space | NASA (Kennedy Space Center); data in NASA OSDR |
| OSD-546 | bones | SCD – Stem Cell Differentiation Toward Osteoblast Onboard the International Space Station | Experiment selected by ESA; data in NASA OSDR |
| OSD-360 | radiation | Effects of low dose space radiation exposures on the splenic metabolome | Ground study partly NASA-funded (grant NNX15AD65G); data in NASA OSDR |

Used only as end-of-game science cards, with no claim beyond what each study says. The kids' text is in `data/i18n` (`datos.ciencia.*`).

## 9. Checked and NOT used

- NASA Mars Rover Photos API: returned 404 on 2026-11-13. Not used.
- APOD: not used.
- Mars north-pole DEM: Trek `exportImage` errored (HTTP 400). Not used.
- Mock storms (IDs `MOCK-`): invented, for tests only; labeled "Made-up test data (not real)".

## 10. POR VERIFICAR

- **POR VERIFICAR:** that every source above appears in the official Resources list and Submission Guide of the challenge (the Guide is not in the repo; `docs/reglas.md` says it is unconfirmed).
- **POR VERIFICAR:** OSDR science cards: the repo stores only the query template `https://osdr.nasa.gov/osdr/data/search?term=<ID>&type=cgene` and the date 2026-11-13, not a per-study response date or version.
- **POR VERIFICAR:** SOHO / STEREO imagery credit text. The game shows only the instrument names stored in DONKI; `docs/science/fuentes.md` §5 says credit must be checked case by case.
- **POR VERIFICAR:** public URL of the deployed game and of the in-game "NASA data we used and why" page (no deployment exists in the repo yet).

---

## Resumen en español

Todo viene de archivos del repo y es **real, curado y no en vivo** (descargado el 2026-11-13). Fuentes: **NASA CCMC DONKI** (8 tormentas con ID, tabla arriba; el Kp lo aporta NOAA y solo vale para la Tierra; las llegadas a Marte de WSA-ENLIL son un cálculo del modelo), **NASA OSDR RadLab** con el instrumento **RAD** del rover Curiosity (el 20 may 2024 la media diaria subió de 4,1 a 79,7 µGy/h, unas 19 veces; es dosis absorbida de un detector y nunca se convierte a mSv) y con **HERA** de Artemis I, **NASA Mars Trek** (mapa de Jezero; pendiente, luz y blindaje los deriva el equipo), dosis de referencia en mSv/día (Marte: NASA, Reitz 2016; Luna e ISS: Zhang 2020, **CNSA, no NASA**), la ficha de Marte de **NASA NSSDC** y 3 estudios de **NASA OSDR** (OSD-772, OSD-546, OSD-360). No usados: Mars Rover Photos (404) y APOD. Los puntos "POR VERIFICAR" están en la sección 10.
