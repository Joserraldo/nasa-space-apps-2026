# Datos de NASA usados y por qué · NASA data used and why

Para el formulario de entrega y para la pantalla "Qué aprendimos hoy". En el juego, la versión para niños está en `data/i18n` (claves `datos.usados.*`). Todos los datos son **reales y curados, no en vivo**: se consultaron el 13–15 de noviembre de 2026 y van dentro del juego. Cada archivo conserva su fecha de consulta. Proyecto no oficial, no avalado por NASA.

## Español

| Dato | Fuente (dueño) | Para qué lo usa el juego |
|---|---|---|
| 8 tormentas solares reales (2017 y 2024): fulguraciones, nubes solares (CME), partículas y tormentas magnéticas, con su ID | **NASA CCMC – DONKI**. El índice Kp lo aporta **NOAA** | La tormenta que golpea la base y obliga a decidir el blindaje. La Meteoróloga lee sus fases reales |
| Predicción de llegada a Marte | **DONKI – simulaciones WSA-ENLIL** (modelo, no medición) | Avisar cuántas horas faltan. Se presenta como "cálculo" |
| Radiación medida en la superficie de Marte durante tormentas | **NASA OSDR RadLab**, instrumento **RAD** del rover Curiosity (misión MSL), cráter Gale | Demostrar que la tormenta de la ruta dorada (20 may 2024) sí se midió en Marte: unas 19 veces el nivel normal ese día |
| Altura del suelo de Jezero, relieve sombreado e imagen CTX | **NASA Mars Trek** (DEM de MOLA, NASA, más HRSC, ESA/DLR; imagen CTX de MRO, NASA) | Mapa para dibujar la ruta y elegir el sitio. Pendiente, luz y blindaje los calcula el equipo a partir de la altura y se marcan como derivados |
| Dosis diaria de referencia (mSv/día) | Marte: RAD/Curiosity (NASA), Reitz et al. 2016. Luna e ISS: Zhang et al. 2020 (instrumento LND de Chang’e-4, **CNSA, no NASA**; ISS con DOSIS 3D) | Consejos de la Doctora y comparación Luna / ISS / Marte |
| Radiación dentro de la nave Orión en Artemis I (2022) | **NASA OSDR RadLab**, instrumento HERA de la misión Artemis I (NASA) | Tarjeta de ciencia: qué tan distinta es la radiación según el momento del viaje |
| Altura del suelo de 3 sitios de la Luna (cerca de Apolo 11, 16 y 15), sombreado y cielo tapado | **NASA Moon Trek** (JPL), DEM LOLA de LRO; posiciones de Moon Trek. Método de horizonte inspirado en NASA GSFC PGDA, Mazarico et al. 2011 | Mapa de la Luna visible. Altura medida; pendiente, relieve y blindaje del terreno derivados. La puntuación de luz sigue sin fuente y no se muestra |
| Seis cráteres del polo sur lunar: altura, sombra, luz, visibilidad de la Tierra y cielo tapado | **NASA Moon Trek**, LOLA de LRO; **NASA GSFC PGDA**, Mazarico et al. 2011 | Comparar sitios con datos de terreno y luz. Los puntajes son derivados. La capa de posibles puntos de hielo no tiene atribución verificada y no genera texto en el juego |
| Altura del terreno del polo norte marciano | **NASA Mars Trek**, DEM polar MOLA y nomenclátor UAI | Comparar cuatro sitios; pendiente y relieve derivados. Luz y blindaje no se muestran |
| 7 estudios de ciencia espacial (OSD-772, OSD-546, OSD-360, OSD-269, OSD-314, OSD-326, OSD-289) | **NASA OSDR** (OSD-546: seleccionado por la ESA; OSD-314: en el EMCS de la ESA; OSD-289: experimento de JAXA) | Tarjetas de ciencia: comida, huesos, músculo, defensas y radiación |
| Comida en la Estación y la granja espacial CANGrow | **Agencia Espacial Canadiense (CSA), socia del reto, no NASA** · © Canadian Space Agency | Tarjetas de comida para Soporte vital |

**Por qué estos datos:** el reto pide consecuencias visibles ligadas a clima espacial real. DONKI da la tormenta con su fecha e ID, RadLab muestra lo que esa tormenta hizo en Marte, Mars Trek da el lugar real donde vive la base, y OSDR explica por qué importa el blindaje y la comida. Separamos siempre lo **medido**, lo **modelado** y lo **derivado por el equipo**.

**Medido / modelado / derivado:** *medido* = RAD, CRaTER y HERA en RadLab, altura de MOLA y LOLA, estudios OSDR; *modelado* = llegada a Marte (WSA-ENLIL); *derivado por el equipo* = pendiente, relieve y puntajes de los sitios, tiempos de comunicación, factores "veces el nivel normal".

**Otros datos curados:** CRaTER de LRO mide radiación en órbita lunar, no en la superficie; NASA SVS 5187 aporta la posición del Sol para las fechas de tormentas de 2024 en los sitios Apolo. La luz calculada supone horizonte plano y no se usa como puntaje de sitio.

**No usado:** Mars Rover Photos (la API devolvía 404 el 2026-11-13).

### Referencias
- DONKI: https://ccmc.gsfc.nasa.gov/tools/DONKI/ (IDs en `data/curated/*.json`)
- OSDR RadLab Data API: https://visualization.osdr.nasa.gov/radlab/gui/data-api/
- NASA Mars Trek: https://trek.nasa.gov/mars/
- NASA Moon Trek: https://trek.nasa.gov/moon/
- NASA OSDR: https://osdr.nasa.gov/bio/repo/data/studies/OSD-772 · OSD-546 · OSD-360 · OSD-269 · OSD-314 · OSD-326 · OSD-289
- CSA (© Canadian Space Agency): https://www.asc-csa.gc.ca/eng/astronauts/living-in-space/eating-in-space.asp · https://www.asc-csa.gc.ca/eng/sciences/food-production/deep-space-food-challenge.asp
- Reitz G., Matthiä D., Hassler D. M., et al. (2016). Radiation Measurements of the MSL-RAD on the Surface of Mars. ICES2016, 437. https://elib.dlr.de/106090/
- Zhang S., Wimmer-Schweingruber R. F., Yu J., et al. (2020). First measurements of the radiation dose on the lunar surface. *Science Advances* 6(39), eaaz1334. doi:10.1126/sciadv.aaz1334

## English

All data are **real and curated, not live**: retrieved on 13–15 November 2026 and bundled in the game. Each file records its retrieval date. Unofficial project, not endorsed by NASA.

- **NASA CCMC DONKI:** 8 real solar storms (flares, CMEs, energetic particles, geomagnetic storms) with their IDs. The Kp index comes from NOAA. They drive the shielding decisions; the Space Weather expert reads the real phases. WSA-ENLIL simulations give the *modeled* arrival at Mars.
- **NASA OSDR RadLab (RAD, Curiosity rover, Gale Crater):** the radiation actually *measured* on the Martian surface. On 20 May 2024 the daily mean was about 19× the background, which proves our golden-path storm reached Mars.
- **NASA Mars Trek (MOLA + HRSC elevation, CTX image):** the real Jezero map. Slope, sunlight and shielding scores are *derived by the team* from elevation.
- **Reference doses (mSv/day):** Mars from RAD/Curiosity (NASA; Reitz et al. 2016). Moon and ISS from Zhang et al. 2020 (Chang’e-4 LND, **CNSA, not NASA**).
- **NASA OSDR RadLab, Artemis I (HERA):** absorbed dose inside Orion in 2022. Steady during the cruise, about 480× higher for a while shortly after launch.
- **NASA Moon Trek (JPL; LOLA elevation, NASA's LRO):** ground height of 3 sites near Apollo 11, 16 and 15. Height is *measured*; slope, relief and terrain shielding are *derived*. The site sunlight score remains unavailable.
- **NASA Moon Trek and NASA GSFC PGDA (Mazarico et al. 2011):** terrain, permanent shadow, average sunlight, Earth visibility and sky occlusion for six lunar south pole craters. Site scores are *derived*. The possible ice layer has no verified attribution and produces no game text.
- **NASA Mars Trek (MOLA polar DEM):** elevation at four north polar Martian sites; slope and relief are *derived*. Sunlight and shielding scores remain unavailable.
- **NASA OSDR RadLab (CRaTER, LRO):** radiation measured in lunar orbit, never presented as a surface measurement. **NASA SVS 5187:** Sun position at Apollo sites during the 2024 storm dates, calculated for a flat horizon.
- **NASA OSDR studies OSD-772, OSD-546 (ESA-selected), OSD-360, OSD-269, OSD-314 (ESA's EMCS), OSD-326, OSD-289 (JAXA):** science cards on food, bones, muscles, the body's defenses and radiation.
- **Canadian Space Agency (CSA, a challenge partner, not NASA; © Canadian Space Agency):** food cards for Life Support (meals on the Space Station, the CANGrow space farm).

*Measured* = RAD, CRaTER, HERA, MOLA/LOLA heights, OSDR studies; *modeled* = Mars arrival (WSA-ENLIL); *derived by the team* = slopes, relief, site scores, communication times, "times normal" factors.

We always label what is **measured**, **modeled** or **derived**.
