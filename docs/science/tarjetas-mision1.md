# Tarjetas de ciencia de la misión 1 (Jezero): fuente de cada una (#93)

Revisado el 2026-11-14 contra los textos de `missions/src/textos.ts` (develop). Cada tarjeta queda en uno de tres estados:
**LISTA** (fuente de la lista oficial, ya en `data/i18n`) · **CAMBIAR TEXTO** (hay fuente, pero el texto actual dice más de lo que la fuente dice) · **PENDIENTE** (la fuente es de NASA y está comprobada, pero no está en la lista oficial del reto: Daniel tiene que aprobarla).

| Tarjeta | Estado | `fuenteKey` | Qué dice la fuente [V] |
|---|---|---|---|
| `tormenta_medida` | LISTA | `fuente.radlab` | RAD (Curiosity) midió en Marte el 20 may 2024 una media diaria de 79,7 µGy/h frente a un fondo de 4,1 (×19,4). El texto ("in May 2024 the Curiosity rover measured the radiation rising on the surface of Mars") es correcto. |
| `sitio_terreno` | LISTA | `fuente.marsTrek` | La elevación es de Mars Trek y la pendiente la calculó el equipo (`docs/science/terreno.md`). El texto lo dice bien. |
| `mensajes_tardan` | LISTA | `fuente.nssdc` | NSSDC: distancia Tierra–Marte de 54,6 a 401,4 millones de km. Entre la distancia y la velocidad de la luz salen de 3 a 22 minutos (cálculo, `data/src/comunicaciones.ts`, PR #65). El texto ("take minutes") es correcto. |
| `plantas` | CAMBIAR TEXTO | `fuente.osdr` (estudio **OSD-772**) | OSD-772 "PH-04 Chile Peppers in Space": cultivar plantas en el espacio tiene dificultades; en la Estación Espacial se cultivaron en el Advanced Plant Habitat, una cámara cerrada y controlada; el experimento duró **137 días** y dio **26 chiles**. **No dice** que cultivar "cueste energía" ni que necesiten "calor". |
| `escudo_regolito` | CAMBIAR TEXTO | `fuente.dosis.marte` | RAD (Reitz et al. 2016): **1,84 ± 0,3 mSv/día** en el viaje a Marte y **0,64 ± 0,12 mSv/día** en la superficie (casi 3 veces menos, cálculo; la cifra del viaje entra con el PR #95 como `marte-crucero`). **No dice** que el suelo de Marte sirva de escudo: esa parte no se puede afirmar con esta fuente. |
| `panel_polvo` | PENDIENTE | (`fuente.jpl.insight`, por crear) | NASA/JPL, 21 dic 2022: a InSight se le acabó la energía porque "el polvo que se acumulaba en sus paneles fue reduciendo su energía". Sirve también para #91. https://www.jpl.nasa.gov/news/nasa-retires-insight-mars-lander-mission-after-years-of-science/ |
| `agua_reciclada` | PENDIENTE | (`fuente.nasa.agua`, por crear) | NASA, 20 jun 2023: el sistema de la Estación alcanzó la meta de recuperar el **98 %** del agua; recupera agua de la orina y de la humedad del aire (respiración y sudor). https://www.nasa.gov/missions/station/iss-research/nasa-achieves-water-recovery-milestone-on-international-space-station/ |
| pregunta final (chips) | PENDIENTE | (`fuente.nasa.bitflip`, por crear) | NASA Earthdata, 2 jul 2024: las partículas de alta energía de una tormenta de radiación solar pueden alterar un bit de datos y chocar con el chip de una nave. https://www.earthdata.nasa.gov/news/feature-articles/its-always-sunny-space-thats-problem-satellite-teams |

## Textos propuestos para diseño (inglés primero)

- `mision.jezero.ciencia.invernadero`
  - en: "Plants can grow in space, but it is hard: they need a special closed chamber. On the Space Station, chile peppers grew for 137 days and gave 26 peppers."
  - es: "Las plantas pueden crecer en el espacio, pero es difícil: necesitan una cámara cerrada especial. En la Estación Espacial crecieron chiles durante 137 días y dieron 26."
- `mision.jezero.ciencia.escudo`
  - en: "On the way to Mars, the RAD instrument on the Curiosity rover measured almost 3 times more radiation than later on the surface of Mars."
  - es: "En el viaje a Marte, el instrumento RAD del rover Curiosity midió casi 3 veces más radiación que después en la superficie de Marte."
  - Si se aprueba una fuente de NASA que diga que el suelo de Marte blinda, se puede volver al texto original.
- Las tres PENDIENTES pueden quedarse con su texto actual si Daniel aprueba las fuentes. Detalle para `agua_reciclada`: "again and again" es correcto, pero no puede decir "todo el agua": el sistema recupera el 98 %.

## Unidades
`tormenta_medida` es dosis **absorbida** (µGy/h). `escudo_regolito` es dosis **equivalente** (mSv/día). No van juntas en la misma tarjeta.
