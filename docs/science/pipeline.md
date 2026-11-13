# Pipeline DONKI → `data/curated` (respaldo offline, no en vivo)

1. `cd data && npm run descargar`: baja las ventanas de `curated/config.json` (máx. 30 días) a `data/raw/<grupo>/`. FLR sale de `ccmc.gsfc.nasa.gov/DONKI-API` y lo demás de `api.nasa.gov/DONKI` con `NASA_API_KEY` del entorno o del `.env`. La clave no se imprime ni se guarda (`consulta.json` guarda la URL sin clave).
2. `npm run curar`: no usa la red. Convierte los IDs elegidos en `config.json` en `data/curated/<id>.json` y `index.json`.
3. `npm test`: regenera lo curado desde raw y lo compara con los archivos.

## Reglas (código: `data/scripts/curar.ts`)
| Dato | Regla |
|---|---|
| Hora de la FLR | `peakTime` (si falta, `beginTime`) |
| Clase de la FLR | `classType` tal cual |
| Velocidad de la CME | la que se usó como entrada en la **última** simulación WSA-ENLIL de esa CME; si no hubo, la del análisis `isMostAccurate` más reciente (`time21_5`) |
| SEP | `eventTime`. Se rechazan instrumentos `MODEL:` (pronósticos, no mediciones). `observadoEn: Tierra` (GOES, SOHO y ACE están cerca de la Tierra) |
| GST | `startTime` y el Kp máximo de `allKpIndex`. El Kp lo da **NOAA** y mide la **Tierra** |
| Cadena | cada fase tiene que estar enlazada en DONKI (`linkedEvents`) con una fase anterior; si no, falla |
| Marte | la última WSA-ENLIL completada que usa la CME (las nuevas reemplazan a las viejas). Si nombra a `Mars` → `marcoMarte: "modelado"` (es un modelo, no una medición); si no → `"escenario"` |
| Región | `activeRegionNum` de DONKI (5 cifras: 13664 = AR 3664) |

## Qué decide un humano
Solo **qué IDs** entran (en `config.json`) y los textos para niños (`data/i18n`). Ninguna cifra se escribe a mano.
