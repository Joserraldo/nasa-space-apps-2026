# Fuentes de datos NASA para el juego de tormentas solares (Luna/Marte)

Investigación del 2026-11-02. Solo documentación, sin código. Convención: **[V]** = verificado en una fuente consultada; **NO VERIFICADO** = viene de memoria o de una sola fuente secundaria, hay que comprobarlo antes de usarlo. Nota: durante la investigación `api.nasa.gov` devolvió 503 y `curl` no tuvo salida desde este equipo, así que **no se pudo probar ninguna respuesta real de DONKI**; los campos se marcan según su fuente.

## 0. Verificado con llamadas reales (2026-11-13)

Consultas hechas con la clave del equipo desde un script. Las muestras están en `data/samples/` (ver su README).
- **CORS [V]:** `api.nasa.gov/DONKI` y `ccmc.gsfc.nasa.gov/DONKI-API` responden `Access-Control-Allow-Origin: *`. Decisión: igual no se llama desde el navegador.
- **Límite [V]:** `X-RateLimit-Limit: 2500` por hora con clave personal (corrige el "1000" de terceros de la §1).
- **FLR [V]:** `api.nasa.gov/DONKI/FLR` devuelve **404**. Funciona `https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR?startDate=…&endDate=…`, sin clave. CME, GST y SEP funcionan en api.nasa.gov.
- **Campos [V]:** FLR, CME, GST y SEP, tal como están en la §1, más `link`, `linkedEvents`, `submissionTime` y `versionId`. `linkedEvents[].activityID` **sí existe** en FLR, GST y SEP.
- **Tormenta de mayo de 2024 [V], IDs reales:**
  - GST `2024-05-10T15:00:00-GST-001`, Kp máximo 9.0 (fuente del Kp: NOAA). Enlazada a CMEs del 8 may, entre ellas `2024-05-08T05:36:00-CME-001`. https://ccmc.gsfc.nasa.gov/DONKI/view/GST/30693/-1
  - CME `2024-05-08T05:36:00-CME-001`: halo completo hacia la Tierra desde AR 13664, 870 km/s (análisis "most accurate").
  - FLR X3.9 `2024-05-10T06:27:00-FLR-001`, pico 06:54Z. https://ccmc.gsfc.nasa.gov/DONKI/view/FLR/30666/-1
  - SEP `2024-05-09T13:59:00-SEP-001` (enlazada a FLR `2024-05-09T08:45:00-FLR-001`, X2.2).
- **14 de mayo de 2024 [V]:** FLR X8.7 `2024-05-14T16:46:00-FLR-001`, pico 16:51Z, región 13664. https://ccmc.gsfc.nasa.gov/DONKI/view/FLR/30849/-1. Coincide con SWPC (§4 #5).
- **Numeración de regiones [V]:** DONKI usa 5 cifras (`13664`) y NOAA usa "AR 3664". Es la misma región.
- **Marte en DONKI [V]:** las simulaciones `WSAEnlilSimulations` traen `impactList` con `location: "Mars"`, `arrivalTime` e `isGlancingBlow`. Es un **modelo** (predicción), no una medición en Marte. **Corrección:** antes escribí "mayo de 2024 no tiene impacto en Marte", pero la consulta del 8–10 de mayo era demasiado corta. Con ventanas más amplias sí hay corridas con Marte (ej. `WSA-ENLIL/30869/1` para la CME del X8.7).
- **Catálogo curado [V]** (7 tormentas, `data/curated/`): todo sale de `data/raw` por código (`npm run curar`), y una prueba lo regenera para comprobarlo. Las reglas están en `docs/science/pipeline.md`.
  - X8.7 del 14 may 2024 (ruta dorada): FLR `2024-05-14T16:46:00-FLR-001` → CME `2024-05-14T17:00:00-CME-001` (2119 km/s). Llegada a Marte según `WSA-ENLIL/30869/1`: 2024-05-16T20:47Z, directa. Ninguna corrida la manda a la Tierra.
  - X5.8 del 11 may 2024: hacia Marte según ENLIL `30801`. Gran tormenta de mayo 2024: Kp 9 en la Tierra. X9.0 del 3 oct 2024: Kp 7.33 (Tierra) y Marte según ENLIL.
  - 10 oct 2024: GST `2024-10-10T15:00:00-GST-001`, **Kp 8.67** (antes estaba NO VERIFICADO en §4 #7).
  - **Sep 2017 [V]:** X9.3 `2017-09-06T11:53:00-FLR-001` (pico 12:02Z; corrige el "NO VERIFICADO" de §4 #3) y X8.2 `2017-09-10T15:35:00-FLR-001` con una CME a 2650 km/s. La corrida ENLIL más reciente (`13117`) ya no incluye a Marte, aunque una anterior (`13114`) sí la incluía. Que RAD o MAVEN midieran algo en Marte sigue **NO VERIFICADO** (no viene de DONKI).

## 0b. Recursos oficiales del reto y lo verificado (2026-11-13)

Lista oficial (pestaña Resources del reto, copiada en ORQUESTACION): NASA Open APIs (APOD, Mars Rover Photos, DONKI) · DONKI · OSDR search · OSDR RadLab · Mars Trek · CSA (socio, no NASA).

| Recurso | Estado [V] | Lo que usamos |
|---|---|---|
| DONKI | FLR solo vía `ccmc.gsfc.nasa.gov/DONKI-API` (404 en api.nasa.gov). CME, GST, SEP y ENLIL en api.nasa.gov. CORS `*`. Límite 2500/h | 8 tormentas en `data/curated` |
| **OSDR RadLab** | **Sí tiene Marte y Luna**, no solo la ISS (corrige ORQUESTACION). Marte: `MSL-RAD-Surface` (Curiosity). Luna: `CRaTER-D1D2` (LRO, 2009–2024) e instrumentos de Artemis I (EAD-MU01, HERA-HSU1/2, M42-SN127). `absorbed_dose_rate` en µGy/h. Para RAD **no hay** `dose_equivalent_rate`. Sin datos de RAD en oct 2024 (respuesta vacía). Sin cabecera CORS para otros orígenes | `medicionMarte` de las tormentas |
| OSDR search | Funciona. CORS solo para `osdr.nasa.gov` (el navegador no puede llamarla) | 3 tarjetas (OSD-772, OSD-546, OSD-360) |
| Mars Trek | Funciona: catálogo, WMTS y ArcGIS ImageServer (`trekarcgis`), sin clave | Mapa de Jezero (`data/terreno/jezero`). También hay un DEM MOLA polar norte en metros (`..._NP/ImageServer`), para `marte_polo_norte`, pero su `exportImage` da error 400. El DEM equirectangular no tiene datos por encima de ~83,5° N |
| **Mars Rover Photos** | **Caído:** `api.nasa.gov/mars-photos/...` devuelve 404 "No such app" | No se usa |

**RAD en Marte durante tormentas [V, RadLab]** (dosis absorbida, medias diarias UTC, µGy/h):
- 20 may 2024: fondo 4,1 → **79,7** el mismo día (pico de muestra 304), factor 19,4. CME de origen en DONKI: `2024-05-20T05:36:00-CME-001` (halo rápido; según la nota de DONKI, salió de la cara oculta del Sol). DONKI no tiene FLR ni SEP de ese evento.
- 10 sep 2017: fondo 7,9 → **17,9** el 11 sep (pico 23,2), factor 2,3. Después baja a ~6,6 (14 sep).
- 14 may 2024 (X8.7, que el modelo ENLIL mandaba a Marte): **sin aumento** (factor 0,9).

**Artemis I en RadLab [V, 2026-11-13]** (el enunciado oficial nombra los datos de Artemis): `Artemis-I-HERA-HSU1`, del 2022-11-16T06:51 al 2022-12-11T16:58, 36 583 muestras de dosis **absorbida** en µGy/h. Mediana de crucero 16,68 (días intermedios); pico de **8012,58 µGy/h** el 2022-11-16T07:27, unas 480 veces la mediana. La causa del pico no se afirma (sin fuente verificada). Script: `data/scripts/artemis.ts`; resumen en `data/ciencia/artemis.json`.

**Marte, ficha NASA NSSDC [V, 2026-11-13]** (https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html, actualizada el 19 may 2025): inclinación del eje 25,19°; gravedad superficial 3,73 m/s², que es **0,380** veces la de la Tierra; día de 24,6597 h; semieje mayor 227,956 millones de km (1,524 veces el de la Tierra).

**Tormentas vistas desde la Luna [V, 2026-11-13]:** OSDR RadLab `CRaTER-D1D2` (LRO, NASA; **en órbita lunar, no en la superficie**), dosis absorbida en µGy/h. Misma regla que RAD (`data/src/medicion.ts`). **Gannon, 10 may 2024:** fondo 5,2 → media diaria 1082,5 µGy/h el 11 may (×206,3), fondo limpio. 17 sep 2017 (X8.2): pico 19 481,6 el 11 sep, pero el fondo ya traía la tormenta del 6 sep (`fondoTranquilo: false`, el factor ×27 sale bajo). Sin datos de CRaTER en octubre de 2024. Script `data/scripts/luna.ts`, resultado `data/ciencia/luna.json`.

**Constantes de ARES verificadas [V, NASA NSSDC, 2026-11-13]:** gravedad Marte 3,73 m/s² y Luna 1,62 m/s²; irradiancia solar Marte 586,2 W/m², Luna 1361,0 W/m² (igual que la Tierra). Luna: periodo sinódico 29,53 días; rango de temperatura en el ecuador 95–390 K; distancia media 384 400 km (retraso de luz ≈ 1,3 s, cálculo). Fichas: https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html (11 ene 2024) y marsfact.html (19 may 2025). Inclinación del eje lunar respecto a la eclíptica: NO VERIFICADO (la ficha no la da).

**Dosis de referencia [V en fuente primaria]** (`data/ciencia/radiacion.json`):
- Marte, **viaje (crucero)**: **1,84 ± 0,3 mSv/día** durante los 253 días de viaje [V, mismo resumen, 2026-11-14]. Unas 2,9 veces la de la superficie (cálculo).
- Marte, superficie: **0,64 ± 0,12 mSv/día** (7 ago 2012 – 1 jun 2013). Cita: Reitz, Matthiä, Hassler et al. 2016, ICES2016 (https://elib.dlr.de/106090/). La página da esta cita, no el artículo de *Science* de 2014.
- Luna, superficie: **1369 µSv/día**, medido por LND en Chang’e-4 (**CNSA**). En el mismo periodo, la ISS (DOSIS 3D DOSTEL) dio **731 µSv/día**. Zhang et al. 2020, *Sci. Adv.* 6(39) eaaz1334, texto completo en PMC7518862. El resumen da la dosis absorbida: 13,2 ± 1 µGy/h en silicio.
- Las comparaciones Marte/ISS son aproximadas porque se midieron en años distintos (ciclo solar distinto).

## 1. DONKI (Database Of Notifications, Knowledge, Information)

### Acceso y URLs
- Portal CCMC: https://ccmc.gsfc.nasa.gov/tools/DONKI/ [V]. Indica que reemplazar `kauai.ccmc.gsfc.nasa.gov` por `ccmc.gsfc.nasa.gov` en los enlaces antiguos funciona directamente [V]. También existe un servicio bajo `/DONKI-API/get/` (ej. `CMEAnalysis.txt` o `CMEAnalysis/` para JSON, con `startDate`, `endDate`, `mostAccurateOnly`, `keyword`) [V, misma página]. La página de documentación `/tools/DONKI/api/` dio 404.
- Vía api.nasa.gov (la más usada): `https://api.nasa.gov/DONKI/<ENDPOINT>?startDate=yyyy-MM-dd&endDate=yyyy-MM-dd&api_key=KEY`. Fuente de endpoints/parámetros: docs de terceros, no la página oficial (https://api.nasa.gov/ carga el formulario por JS y no se pudo leer). Terceros: https://rdrr.io/github/Liu-Zhichao/nasaR/man/DONKI_Notifications.html , https://www.rubydoc.info/gems/bowshock/0.1.3/Bowshock/Donki
- Páginas de eventos individuales (útiles para enlazar en el juego): `https://kauai.ccmc.gsfc.nasa.gov/DONKI/view/FLR/<id>/<ver>` (ej. https://kauai.ccmc.gsfc.nasa.gov/DONKI/view/FLR/35860/1) [V que existen].

### Endpoints relevantes
| Endpoint | Qué devuelve | Estado |
|---|---|---|
| `/DONKI/FLR` | Fulguraciones (flares) | Existe [V terceros] |
| `/DONKI/CME` | Eyecciones de masa coronal | Existe [V terceros] |
| `/DONKI/CMEAnalysis` | Análisis de CME (velocidad, ángulo); parámetros extra `mostAccurateOnly`, `completeEntryOnly`, `speed`, `halfAngle`, `catalog`, `keyword` | Existe [V, portal CCMC]; parámetros extra NO VERIFICADO |
| `/DONKI/GST` | Tormentas geomagnéticas (índice Kp) | Existe [V terceros] |
| `/DONKI/SEP` | Eventos de partículas energéticas solares (el que más importa para radiación) | Existe [V terceros] |
| `/DONKI/IPS` | Choques interplanetarios | Existe [V terceros] |
| `/DONKI/RBE` | Aumentos de cinturones de radiación | Existe [V terceros] |
| `/DONKI/MPC`, `/HSS`, `/WSAEnlilSimulations` | Cruces de magnetopausa, corrientes de alta velocidad, simulaciones WSA-Enlil | NO VERIFICADO |
| `/DONKI/notifications` | Mensajes/avisos; parámetro `type` = all, FLR, SEP, CME, IPS, MPC, GST, RBE, report | Existe [V terceros] |

Fuentes: https://rdrr.io/github/Liu-Zhichao/nasaR/man/DONKI_Notifications.html y https://glama.ai/mcp/servers/AnCode666/nasa-mcp/tools/get_notifications

### Parámetros
- `startDate`, `endDate` en formato `yyyy-MM-dd` [V terceros]. Si se omiten: por defecto 30 días antes de hoy (UTC) según una fuente, y 7 días para notifications según otra; NO VERIFICADO cuál aplica (conflicto entre fuentes).
- Rango máximo 30 días: si se pide más, la API recorta a (endDate − 30 días)–endDate [V terceros, no oficial]. Implicación: para tormentas históricas, pedir ventanas cortas (3-7 días alrededor de la fecha) y **precargar/cachear los JSON en el repo** en vez de llamar en vivo.
- `api_key` obligatorio en api.nasa.gov.

### Forma de la respuesta (campos clave)
- **FLR** [V, esquema de terceros https://apis.io/schemas/nasa/solar-flare/]: `flrID`, `instruments[].displayName`, `beginTime`, `peakTime`, `endTime`, `classType` (ej. "X1.8"), `sourceLocation` (ej. "S16E37"), `activeRegionNum` (entero). Las páginas CCMC muestran además actividades enlazadas, ej. `2024-12-22T21:36:00-CME-001` (https://kauai.ccmc.gsfc.nasa.gov/DONKI/view/FLR/47186/3). Que el JSON incluya `linkedEvents` con `activityID`: NO VERIFICADO.
- **CME**: `activityID` (formato `2024-05-08T05:36:00-CME-001`), `startTime`, `sourceLocation`, `activeRegionNum`, `note`, `cmeAnalyses[]` (`speed`, `halfAngle`, `latitude`, `longitude`, `type`, `isMostAccurate`), `linkedEvents`. NO VERIFICADO (de memoria).
- **GST**: `gstID`, `startTime`, `allKpIndex[]` (`observedTime`, `kpIndex`, `source`), `linkedEvents`. NO VERIFICADO.
- **SEP**: `sepID`, `eventTime`, `instruments`, `linkedEvents`. NO VERIFICADO.
- **IPS**: `activityID`, `location`, `eventTime`, `instruments`. NO VERIFICADO. **RBE**: `rbeID`, `eventTime`, `instruments`. NO VERIFICADO.
- **notifications**: `messageType`, `messageID`, `messageURL`, `messageIssueTime`, `messageBody`. NO VERIFICADO.
- Recomendación: antes del hackathon, hacer una llamada real por endpoint (con key propia) y guardar un ejemplo en el repo para confirmar campos. Cadena útil para el juego: FLR -> CME -> (IPS) -> GST, enlazada por `linkedEvents`/`activityID`; SEP indica la dosis de partículas peligrosa para astronautas.

### Límites de API key
- `DEMO_KEY`: 30 solicitudes/hora y 50/día por IP [V terceros: https://zuplo.com/blog/2025/03/18/nasa-api , https://beta-pyspace.readthedocs.io/en/latest/rate_limits.html]. Clave personal: 1000 solicitudes/hora por clave [V terceros]; tope diario no encontrado. Límites compartidos entre todas las APIs de api.nasa.gov; al excederlos devuelve HTTP 429 y se desbloquea tras 1 hora; cabeceras `X-RateLimit-Limit` y `X-RateLimit-Remaining` [V terceros]. Confirmar en https://api.nasa.gov/ (página oficial, no legible por herramienta).
- Obtener clave propia gratis en https://api.nasa.gov/ ("Generate API Key"). **No poner la key en el código del front**; ver CORS.

### CORS
- **NO VERIFICADO.** No se pudo probar. Si el front llama directo desde el navegador, la key queda expuesta y puede haber bloqueo CORS. Plan seguro: script de precarga que guarde los JSON de las tormentas elegidas como archivos estáticos (`/data/*.json`), y usar la API en vivo solo opcionalmente vía un proxy/función serverless con la key en variable de entorno.

## 2. OSDR (Open Science Data Repository)

- Portal: https://osdr.nasa.gov/ (no consultado directamente). Visualización: https://visualization.osdr.nasa.gov/ [V]. Contiene datos de biología espacial con una "Biological Data API" separada [V, resultado de búsqueda]. Para salud de astronautas hay poco "listo para juego"; lo útil para radiación es **RadLab**.
- **RadLab** (plataforma de radiación de OSDR): base de datos, portal de envío y herramientas de visualización/API; cobertura actual sobre todo ISS, con instrumentos de espacio profundo (BLEO) también destacados [V: https://visualization.osdr.nasa.gov/radlab/ ; https://astrobiology.com/2024/03/03/nasa-open-science-for-life-in-space-the-radlab-portal-radlab-data-api/].
- **RadLab Data API** [V, https://visualization.osdr.nasa.gov/radlab/gui/data-api/]:
  - Base: `https://visualization.osdr.nasa.gov/radlab/api` (GET). Dos sintaxis excluyentes: clave=valor, o `query=` booleano (AND, OR, `=`, `<=`, `>=`, paréntesis) con `fields+=`.
  - Filtros: `celestial_body` (Earth, Moon, Sun, deep space; `|` = OR), `trajectory` (LEO, Orbit, Surface, BLEO), `spacecraft` (ej. ISS), `module` (solo ISS), `instrument_family` (TEPC, Timepix, Lidal, DosTel), `instrument` (TEPC, ALTEA, REM), `instrument_id`, `timestamp` (ISO o Unix, con comparadores), y medidas `absorbed_dose_rate` (µGy/h), `dose_equivalent_rate` (µSv/h), `flux` (cm⁻²sr⁻¹s⁻¹), `latitude`, `longitude`, `altitude`, `B`, `L`.
  - `format` = csv (defecto), tsv, json o html. Codificar espacios como `%20`.
  - Ejemplo oficial: `https://visualization.osdr.nasa.gov/radlab/api/?spacecraft=ISS&instrument=DosTel&timestamp>=2022-04-01T23:00&timestamp<2022-04-02T01:05&absorbed_dose_rate>2&format=json`
  - Idea para el juego (NO VERIFICADO que devuelva datos): `.../radlab/api/?celestial_body=Moon&trajectory=Surface&format=json` o `celestial_body=Mars`.
- CORS y límites de RadLab: NO VERIFICADO. Probar desde el navegador antes de depender de ella.
- RadLab agrega datos de varias agencias (la página no las nombra [V]); revisar el origen de cada instrumento antes de atribuir todo a NASA.

## 3. Radiación en superficie y en órbita

| Lugar | Dosis equivalente | Fuente / estado |
|---|---|---|
| Superficie de la Luna | **1 369 µSv/día** (~1,4 mSv/día; ~60 µSv/h). Instrumento LND de **Chang'e-4 (CNSA, China, NO es NASA)** | [V resumen] Zhang et al. 2020, Science Advances 6(39) eaaz1334, https://doi.org/10.1126/sciadv.aaz1334 , resumen https://www.sci.news/space/radiation-dose-rates-lunar-surface-08893.html . Cifra vista solo en resumen secundario; el artículo no se abrió |
| Órbita lunar (CRaTER, LRO, **NASA**) | Dosis absorbida de partículas cargadas consistente con LND (13,2 ± 1 µGy/h en silicio); en órbita de 50 km ~30 % menos que en el medio interplanetario | https://findscholars.unh.edu/display/publication41079 , https://scholars.unh.edu/physics_facpub/189 . Cifras de CRaTER en mSv/día: NO VERIFICADO |
| Superficie de Marte (RAD, Curiosity, **NASA**) | **0,64 ± 0,12 mSv/día** (7 ago 2012 – 1 jun 2013) | [V, resumen DLR] https://elib.dlr.de/106090 ; artículo: Hassler et al. 2014, Science 343(6169), doi 10.1126/science.1244797, https://authors.library.caltech.edu/records/kdt88-3aw98 (la cifra no está en el abstract) |
| Viaje a Marte (cruise, RAD) | 1,84 ± 0,3 mSv/día; viaje redondo mínimo ~0,66 Sv | [V] https://elib.dlr.de/106090 , https://www.swri.org/newsroom/press-releases/swri-led-team-calculates-radiation-exposure-associated-trip-mars |
| ISS | **731 µSv/día** en el periodo de LND (523 rayos cósmicos + 208 protones de la Anomalía del Atlántico Sur); rango habitual citado 0,2-0,5 mSv/día, hasta ~1 según otras fuentes | [V] https://www.sci.news/space/radiation-dose-rates-lunar-surface-08893.html ; https://www.ptb.de/cms/en/presseaktuelles/journals-magazines/ptb-news/ptb-news-ausgaben/archivederptb-news/news08-1/direct-reading-personal-dosemeters.html ; https://pmc.ncbi.nlm.nih.gov/articles/PMC10919966 |
| Tierra, suelo | >200 veces menos que la Luna | [V, sci.news] |

Mensaje para niños: Luna ≈ 2x la ISS en rayos cósmicos; Marte ≈ comparable a la ISS (el planeta bajo los pies y la atmósfera delgada bloquean parte). Esto es dosis de **fondo (rayos cósmicos galácticos)**; una tormenta solar (SEP) añade picos. Dosis durante eventos concretos en superficie (ej. RAD en sept 2017): NO VERIFICADO. No mezclar dosis absorbida (mGy) con equivalente (mSv): el juego debe usar mSv.
- Datos públicos de RAD y CRaTER están en el Planetary Data System (PDS); URL exacta NO VERIFICADO.
- Límites de carrera de astronautas de NASA: NO VERIFICADO, no consultado.

## 4. Diez tormentas solares candidatas

Clases de flare en escala GOES.

| # | Fecha | Evento / clase | Por qué sirve para niños | Consulta DONKI |
|---|---|---|---|---|
| 1 | 28 oct – 4 nov 2003 | "Tormentas de Halloween": flare X17.2 (28 oct), G5, auroras hasta Florida y Texas; el del 4 nov se midió X28 y se revisó a ~X45 (no apuntaba a la Tierra). Mató al satélite japonés ADEOS-II [V: https://en.wikipedia.org/wiki/2003_Halloween_solar_storms] | Nombre divertido, satélite perdido, auroras en el sur de EE.UU. | DONKI arranca ~2010 (NO VERIFICADO la cobertura anterior); usar NOAA/SWPC o SOHO. Imagen: https://svs.gsfc.nasa.gov/2959 |
| 2 | 23 jul 2012 | Superstorm "casi": CME potente que golpeó STEREO-A y no la Tierra; habría sido tipo Carrington de frente; tránsito 18,5 h [V: https://en.wikipedia.org/wiki/July_2012_solar_storm ; https://arxiv.org/pdf/1902.03416] | "La Tierra se salvó por 9 días": tensión narrativa | CME `startDate=2012-07-22&endDate=2012-07-25` (activityID NO VERIFICADO) |
| 3 | 6-10 sep 2017 | Región AR 12673: X9.3 (6 sep, NO VERIFICADO aquí) y X8.2 (10 sep) con GLE 72, partículas hasta el suelo [V: https://arxiv.org/pdf/1805.02678 ; búsqueda]. Mi hipótesis previa "X13" es incorrecta | Ocurrió en el mínimo solar, sorpresa; Marte también lo sintió (valor RAD NO VERIFICADO) | FLR/SEP `2017-09-04` a `2017-09-12` |
| 4 | 10-11 may 2024 | Tormenta "Gannon": G5, Kp 9, Dst -412 nT, tres CMEs del 8 may [V: https://en.wikipedia.org/wiki/May_2024_solar_storms] | Muy reciente, abundantes fotos de auroras | CME y GST `startDate=2024-05-08&endDate=2024-05-14` |
| 5 | 14 may 2024 | Flare X8.7 de AR 3664 (la misma región), el mayor del ciclo hasta entonces, **sin efecto en la Tierra** (rotaba al limbo) [V: https://www.spaceweather.gov/news/region-3664-not-done-yet-produces-x87-flarelargest-solar-cycle] | Contraste: "flare enorme no siempre = tormenta" | FLR `2024-05-14` |
| 6 | 3 oct 2024 | Flare X9.0 de AR 3842, pico ~12:18 UTC, el más fuerte del ciclo 25 hasta entonces; CME halo [V: https://scijinks.gov/news/sun-releases-strong-x90-solar-flare ; https://webtools.ccmc.gsfc.nasa.gov/CMEscoreboard/prediction/detail/3650] | Récord reciente, fácil de explicar | FLR `2024-10-03`; CME `2024-10-03`..`2024-10-05` |
| 7 | 8-10 oct 2024 | Flare X1.8 (8 oct, AR 3848) y tormenta G4 pronosticada para el 10 oct; resultado real **NO VERIFICADO** (solo artículos de pronóstico) | Muchas auroras, material visual | GST `2024-10-09`..`2024-10-12` |
| 8 | 20 ene 2005 | Flare X7 de la región 720 y mayor tormenta de protones desde oct 1989: GLE 69 [V parcial, resultado de búsqueda, fuente NTRS: https://ntrs.nasa.gov/citations/20170004868 no abierta] | Ejemplo de **radiación para astronautas**: tormenta de protones dura | Pre-DONKI: NOAA/SWPC |
| 9 | 14-15 jul 2000 | "Bastille Day": flare X5.7 (algunas fuentes X5.8, NO VERIFICADO) y G5 al día siguiente [V parcial: https://en.wikipedia.org/wiki/2003_Halloween_solar_storms resultados de búsqueda] | Nombre llamativo, imágenes SOHO | Pre-DONKI |
| 10 | 1-2 sep 1859 | Evento Carrington, tormenta de referencia; telégrafos con chispas, auroras muy al sur [NO VERIFICADO, de memoria] | "Tormenta final" del juego: "¿qué pasaría hoy en la Luna?" | No existe en DONKI |
| Alt. | 13 mar 1989 | Apagón de Quebec por tormenta G5 (de memoria; **NO VERIFICADO**) | Consecuencias en la red eléctrica | No en DONKI |

Más viables con DONKI: 3, 4, 5, 6 (y 2, 7). Las históricas (1, 8, 9, 10) aportan narrativa pero requieren NOAA/SWPC, SOHO o texto estático. Antes de fijar fechas: ejecutar las consultas con key propia y copiar los `activityID`/`flrID` reales a este documento.

## 5. Atribución y licencia

- Contenido de NASA: en general **no está sujeto a copyright en EE.UU.**; imágenes de terceros llevan el nombre del titular y requieren su permiso [V: https://www.nasa.gov/nasa-brand-center/images-and-media y https://www.nasa.gov/multimedia/guidelines/index.html].
- No implicar aval de NASA (endorsement) en productos comerciales ni publicidad [V, misma guía].
- El logo/insignia de NASA no es de dominio público y no debe usarse sin permiso [V, misma guía].
- Atribución: las fuentes divergen (una dice que se requiere, otra que no) [V parcial: https://www.vondranlegal.com/how-to-legally-use-nasa-images-in-your-youtube-blogs-and-social-media ; https://www.plagiarismtoday.com/2024/11/04/nasa-copyright-and-trademark-in-space/]. **Práctica recomendada: citar "Datos: NASA CCMC DONKI / OSDR RadLab", con URL y fecha de consulta, y poner "proyecto no oficial, no avalado por NASA".**
- Las salidas de modelos de IA se atribuyen al producto de IA, no a NASA, y no deben decir "según NASA" [V, guía de medios].
- LND (Chang'e-4) es de CNSA/CAS China: citar Zhang et al. 2020, no marcarlo como NASA. Imágenes SDO/SOHO: https://sdo.gsfc.nasa.gov/resources/press.php ; SOHO es ESA/NASA, revisar crédito caso por caso (NO VERIFICADO).
- Reglas específicas de NASA Space Apps (uso de datos, créditos, licencia del código): NO VERIFICADO, revisar las reglas del evento.
