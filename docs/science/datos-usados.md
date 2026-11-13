# Datos de NASA usados y por qué · NASA data used and why

Para el formulario de entrega y para la pantalla "Qué aprendimos hoy". En el juego, la versión para niños está en `data/i18n` (claves `datos.usados.*`). Todos los datos son **reales y curados, no en vivo**: se descargaron el 2026-11-13 y van dentro del juego. Proyecto no oficial, no avalado por NASA.

## Español

| Dato | Fuente (dueño) | Para qué lo usa el juego |
|---|---|---|
| 8 tormentas solares reales (2017 y 2024): fulguraciones, nubes solares (CME), partículas y tormentas magnéticas, con su ID | **NASA CCMC – DONKI**. El índice Kp lo aporta **NOAA** | La tormenta que golpea la base y obliga a decidir el blindaje. La Meteoróloga lee sus fases reales |
| Predicción de llegada a Marte | **DONKI – simulaciones WSA-ENLIL** (modelo, no medición) | Avisar cuántas horas faltan. Se presenta como "cálculo" |
| Radiación medida en la superficie de Marte durante tormentas | **NASA OSDR RadLab**, instrumento **RAD** del rover Curiosity (misión MSL), cráter Gale | Demostrar que la tormenta de la ruta dorada (20 may 2024) sí se midió en Marte: unas 19 veces el nivel normal ese día |
| Altura del suelo de Jezero, relieve sombreado e imagen CTX | **NASA Mars Trek** (DEM de MOLA, NASA, más HRSC, ESA/DLR; imagen CTX de MRO, NASA) | Mapa para dibujar la ruta y elegir el sitio. Pendiente, luz y blindaje los calcula el equipo a partir de la altura y se marcan como derivados |
| Dosis diaria de referencia (mSv/día) | Marte: RAD/Curiosity (NASA), Reitz et al. 2016. Luna e ISS: Zhang et al. 2020 (instrumento LND de Chang’e-4, **CNSA, no NASA**; ISS con DOSIS 3D) | Consejos de la Doctora y comparación Luna / ISS / Marte |
| 3 estudios de ciencia espacial (OSD-772, OSD-546, OSD-360) | **NASA OSDR** (OSD-546 es un experimento seleccionado por la ESA) | Tarjetas de ciencia al final: comida, huesos y radiación |

**Por qué estos datos:** el reto pide consecuencias visibles ligadas a clima espacial real. DONKI da la tormenta con su fecha e ID, RadLab muestra lo que esa tormenta hizo en Marte, Mars Trek da el lugar real donde vive la base, y OSDR explica por qué importa el blindaje y la comida. Separamos siempre lo **medido**, lo **modelado** y lo **derivado por el equipo**.

**No usado:** Mars Rover Photos (la API devolvía 404 el 2026-11-13).

### Referencias
- DONKI: https://ccmc.gsfc.nasa.gov/tools/DONKI/ (IDs en `data/curated/*.json`)
- OSDR RadLab Data API: https://visualization.osdr.nasa.gov/radlab/gui/data-api/
- NASA Mars Trek: https://trek.nasa.gov/mars/
- NASA OSDR: https://osdr.nasa.gov/bio/repo/data/studies/OSD-772 · OSD-546 · OSD-360
- Reitz G., Matthiä D., Hassler D. M., et al. (2016). Radiation Measurements of the MSL-RAD on the Surface of Mars. ICES2016, 437. https://elib.dlr.de/106090/
- Zhang S., Wimmer-Schweingruber R. F., Yu J., et al. (2020). First measurements of the radiation dose on the lunar surface. *Science Advances* 6(39), eaaz1334. doi:10.1126/sciadv.aaz1334

## English

All data are **real and curated, not live**: downloaded on 2026-11-13 and bundled in the game. Unofficial project, not endorsed by NASA.

- **NASA CCMC DONKI:** 8 real solar storms (flares, CMEs, energetic particles, geomagnetic storms) with their IDs. The Kp index comes from NOAA. They drive the shielding decisions; the Space Weather expert reads the real phases. WSA-ENLIL simulations give the *modeled* arrival at Mars.
- **NASA OSDR RadLab (RAD, Curiosity rover, Gale Crater):** the radiation actually *measured* on the Martian surface. On 20 May 2024 the daily mean was about 19× the background, which proves our golden-path storm reached Mars.
- **NASA Mars Trek (MOLA + HRSC elevation, CTX image):** the real Jezero map. Slope, sunlight and shielding scores are *derived by the team* from elevation.
- **Reference doses (mSv/day):** Mars from RAD/Curiosity (NASA; Reitz et al. 2016). Moon and ISS from Zhang et al. 2020 (Chang’e-4 LND, **CNSA, not NASA**).
- **NASA OSDR studies OSD-772, OSD-546 (ESA-selected), OSD-360:** end-of-game science cards on food, bones and radiation.

We always label what is **measured**, **modeled** or **derived**.
