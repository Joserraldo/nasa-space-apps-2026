# D8 — Catálogo de tormentas reales
**Dueño:** datos (Daniel) · **Fecha:** 2026-11-13 · **Estado:** tomada (catálogo), pendiente de OK del equipo

Contexto: la rebanada vertical es en Marte (Jezero). Una tormenta "real" tiene que ser honesta con el lugar donde se observó.

## Lo que ya sabemos [V] (llamadas reales a DONKI del 13 nov, ver `docs/science/fuentes.md` §0)
- Mayo 2024: GST `2024-05-10T15:00:00-GST-001`, Kp 9 (Kp de NOAA, **mide la Tierra**). FLR X8.7 `2024-05-14T16:46:00-FLR-001`.
- Las simulaciones WSA-ENLIL de DONKI **sí** pueden listar a Marte en `impactList` (es un modelo). Corrección del 13 nov: la primera consulta (8–10 may) era corta y no lo mostraba.
- DONKI no tiene ninguna fulguración X entre el 20 y el 21 may 2024 (la más fuerte es M1.9). La "X12 del lado oculto" que circula **NO VERIFICADO**: no se usa.

## Elegida: catálogo de 8 (PR #26) (PR #23, `data/curated/index.json`)
| ID | Cadena real (DONKI) | Marte |
|---|---|---|
| `2024-05-20-marte` **(ruta dorada)** | CME 1927 km/s (cara oculta del Sol) | **observado**: RAD ×19,4 (79,7 µGy/h frente a 4,1) |
| `2024-05-14-x87` | X8.7 → CME 2119 km/s | modelado (ENLIL 30869); RAD sin aumento (×0,9) |
| `2024-05-11-x58` | X5.8 → CME 1263 km/s → SEP | modelado (ENLIL 30801) |
| `2024-05-10-gannon` | X2.2 → CME 1330 km/s → SEP → Kp 9 | escenario |
| `2024-10-03-x90` | X9.0 → CME 863 km/s → Kp 7.33 | modelado |
| `2024-10-10-g4` | X1.8 → CME 1473 km/s → SEP → Kp 8.67 | modelado |
| `2017-09-06-x93` | X9.3 → CME 1238 km/s → SEP → Kp 8 | escenario |
| `2017-09-10-x82` | X8.2 → CME 2650 km/s → SEP | **observado**: RAD ×2,3 el 11 sep |

## Por qué el 20 de mayo de 2024 para la ruta dorada
Es la única tormenta del catálogo con una **medición fuerte en Marte**: Curiosity (RAD) vio subir la radiación unas 19 veces ese mismo día. La historia es perfecta: "una explosión en la cara del Sol que no vemos desde la Tierra… y en Marte se midió". El ID de DONKI es real y la medición sale de RadLab, un recurso oficial del reto. Antes iba el X8.7, pero era solo un modelo y RAD no vio aumento.

## Consecuencias para cada rol
- **motor:** sortea de `curated/index.json` (orden fijo). La semilla dorada usa `ID_RUTA_DORADA`.
- **agentes:** la Meteoróloga no dice "Kp" en Marte. Con `observado` dice "Curiosity midió la subida"; con `modelado`, "el modelo calcula que llega en X horas"; con `escenario`, "pasó cerca de la Tierra; imaginamos que llega".
- **ui:** la tarjeta muestra el ID, la fecha, "datos reales curados, no en vivo" y el texto de `datos.marco.<marco>`.
- **mecanicas:** el e2e de la semilla dorada valida que aparezcan el ID y la fecha.
