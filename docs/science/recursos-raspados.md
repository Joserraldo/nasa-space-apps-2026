# Recursos oficiales del reto raspados (2026-11-14)

Copia estática de las páginas de la **pestaña Resources del reto** (lista oficial), para no depender de la red durante el hackathon. Nada de esto es "en vivo": cada archivo lleva su URL y su fecha de consulta en la primera línea.

- **Script:** `data/scripts/raspar_recursos.py` (Scrapling 0.5.1, BSD-3, solo el fetcher HTTP: sin navegadores, sin antibots, sin logins). Se corre con `python -I data/scripts/raspar_recursos.py [id]` desde un venv fuera del repo con `pip install "scrapling[fetchers,rag]"`.
- **Cortesía:** respeta `robots.txt` (`urllib.robotparser`), espera 4 s entre peticiones y manda un User-Agent genérico. No usa la clave de NASA.
- **Lo que necesita JavaScript** (api.nasa.gov, portada de OSDR, Mars Trek) se leyó con Claude in Chrome y se resumió a mano. Por defecto el script no lo pisa.
- **La pestaña Resources** se leyó con Chrome: desde este equipo `curl` y Python fallan con `SEC_E_UNTRUSTED_ROOT` en spaceappschallenge.org. Resumen en `data/raw/recursos/reto-resources.md`. **Corrección:** la URL del reto es `/2026/challenges/junior-astronaut-mission-trainer/` (la de `docs/reglas.md`, con `build-a-…`, da 404).
- Se guarda Markdown limpio del `<main>`, no el HTML. OSDR se guarda resumido (ID, título, organismo, factores, resumen ≤600 caracteres): la respuesta completa pesa ~250 KB por búsqueda.

| Carpeta en `data/raw/recursos/` | URL | Dueño | Cómo | Para qué sirve en el juego |
|---|---|---|---|---|
| `reto-resources.md` | spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/?tab=resources | NASA Space Apps | Chrome | Lista oficial de fuentes (la regla de `data/CLAUDE.md`) |
| `nasa-open-apis/` | https://api.nasa.gov/ | NASA | Chrome | Límites de la clave; avisos de APIs archivadas; el catálogo incluye Moon Trek |
| `donki/` | https://ccmc.gsfc.nasa.gov/tools/DONKI/ | NASA CCMC | Scrapling | Política de uso y de cita de DONKI; migración de URLs |
| `osdr-repo/` | https://osdr.nasa.gov/bio/repo/ | NASA OSDR | Chrome | Solo nota: es un buscador |
| `osdr-search-api/` | https://osdr.nasa.gov/osdr/data/search (`radiation`, `plant`, `bone`, `food`) | NASA OSDR | API | Candidatos para tarjetas de ciencia con ID real de estudio (232 / 78 / 67 / 152 resultados; se guardan los 25 primeros de cada uno) |
| `radlab-data-api/` | https://visualization.osdr.nasa.gov/radlab/gui/data-api/ | NASA OSDR | Scrapling | Documentación de la API de RadLab (la que usa `radlab.ts`) |
| `mars-trek/` | https://trek.nasa.gov/mars/ | NASA JPL | Nota | Solo nota: es un visor; los datos ya se bajan en `jezero-descargar.ts` |
| `csa-stem/` | asc-csa.gc.ca/eng/youth-educators/resources-stem-and-youth-organizations.asp | CSA (socio, no NASA) | Scrapling | Actividades STEM bilingües (en/fr) |
| `csa-food/` (16 páginas) | asc-csa.gc.ca/eng/youth-educators/toolkits/food-production/ y las páginas de comida que enlaza | CSA (socio, no NASA) | Scrapling | Producción de alimentos en la Luna y en Marte para Soporte vital (invernadero, Tomatosphere, Deep Space Food Challenge) |

## Hallazgos [V] (leídos el 2026-11-14 en estas copias)

- **API de Mars Rover archivada.** La portada de api.nasa.gov lo dice: explica el 404 de `fuentes.md` §0b. Además, la API vieja de APOD se archiva el 1 dic 2026 y pasa a science.nasa.gov.
- **Moon Trek está en el catálogo oficial.** api.nasa.gov, que es un recurso de la lista oficial, incluye "Vesta/Moon/Mars Trek WMTS". Eso apoya usar Moon Trek en las misiones lunares (Daniel ya la aprobó el 14 nov).
- **Límite de la clave.** La documentación dice 1000 peticiones por hora; nuestra clave recibe 2500 (`fuentes.md` §0). DEMO_KEY: 30 por hora y 50 por día por IP.
- **DONKI.** El 30 sep 2026 cambió a URLs nuevas, pero las rutas después de `/DONKI/` no cambian. Nuestros scripts ya usan `ccmc.gsfc.nasa.gov`, así que no hay que tocarlos. CCMC pide tratar sus datos como de calidad de prototipo, para investigación, y remite a su política de publicación para la cita (`donki/index.md`).
- **CSA [V], según sus condiciones (https://www.asc-csa.gc.ca/eng/terms.asp#copyright):** permite reproducir sus materiales para uso personal, educativo o informativo **no comercial**, con estas condiciones: comprobar la exactitud, citar a la CSA ("© Canadian Space Agency" o "Credit: Canadian Space Agency"), no insinuar relación con la CSA ni aval suyo, y no usar los materiales de forma engañosa ni con fines políticos. El logo de la CSA no se puede usar. El contenido de terceros que aparezca en sus páginas pertenece a esos terceros. Para el juego: parafrasear en nuestros textos en/es, citar a la CSA en la tarjeta de fuente y no usar el logo.

## Para Soporte vital (comida), de la CSA [V en las copias; la cifra se cita a la CSA, no a NASA]

| Dato | Archivo en `data/raw/recursos/csa-food/` |
|---|---|
| En la ISS, cada astronauta tiene 3 comidas y 1 snack al día | `eating-in-space.md` |
| En misiones largas a la Luna (Artemis) no podrán llevar toda la comida: tendrán que cultivarla | `eating-in-space.md` |
| La ISS recibe comida fresca cada pocos meses; los menús van de 1900 a 3200 calorías al día según la persona | `growing-healthy-food-in-space-and-remote-areas.md` |
| Deep Space Food Challenge: tecnologías que gasten poco material, energía y agua. El ganador canadiense (CANGrow) podría producir más de 700 kg de comida al año | `deep-space-food-challenge.md` |
| Actividades para clase: comida equilibrada para un astronauta, almuerzo espacial, Tomatosphere (semillas de tomate expuestas al espacio) | `healthy-meals-in-microgravity.md`, `space-jam-an-astronaut-lunch.md`, `tomatosphere.md` |

DONKI también aclara (`donki/index.md`): sus datos se entregan "tal cual", son productos preliminares de investigación de NASA y la fuente oficial de pronósticos de EE. UU. es NOAA SWPC. Encaja con nuestra etiqueta "datos reales curados, no en vivo".
