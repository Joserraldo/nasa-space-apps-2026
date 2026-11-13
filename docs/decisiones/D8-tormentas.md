# D8 — Catálogo de tormentas reales
**Dueño:** datos (Daniel) · **Fecha:** 2026-11-13 · **Estado:** propuesta

Contexto: la rebanada vertical es en Marte (Jezero). Una tormenta "real" tiene que ser honesta con el lugar donde se observó.

## Lo que ya sabemos [V] (llamadas reales a DONKI del 13 nov, ver `docs/science/fuentes.md` §0)
- Mayo 2024: GST `2024-05-10T15:00:00-GST-001`, Kp 9 (Kp de NOAA, **mide la Tierra**). FLR X8.7 `2024-05-14T16:46:00-FLR-001`.
- Las simulaciones WSA-ENLIL de DONKI del 8–10 y del 20–22 may 2024 **no listan a Marte** en `impactList`: solo sondas (STEREO A, Parker, Lucy, Psyche, Juno, Solar Orbiter, OSIRIS-APEX).
- DONKI no tiene ninguna fulguración X entre el 20 y el 21 may 2024 (la más fuerte es M1.9). La "X12 del lado oculto" que circula **NO VERIFICADO**: no se usa.

## Opciones para la tormenta de la ruta dorada
| Opción | A favor | En contra |
|---|---|---|
| A. Mayo 2024 como **escenario** ("esta tormenta real pasó cerca de la Tierra; imaginamos que llega a tu base") | Ya está [V], la más famosa, con muchas fotos | No se observó en Marte: hay que decirlo en la tarjeta |
| B. Septiembre 2017 como **observada en Marte** | Si se verifica, es real también en Marte (RAD y MAVEN, de memoria) | IDs de DONKI y efecto en Marte **NO VERIFICADO** todavía |
| C. Solo fulguración X8.7 del 14 may 2024 | Contraste: "un destello enorme no siempre trae tormenta" | Sin CME ni partículas hacia nosotros: poca acción para el paso 5 |

## Elegida (propuesta)
**B si se verifica antes de P2 (sáb 22:00); si no, A con `marsFraming: "scenario"`.** C entra al catálogo para la variabilidad (P3).

## Por qué
Criterio de validez: el jurado ve un ID y una fecha reales. Presentar un Kp de la Tierra como efecto en Marte sería un error científico.

## Consecuencias para cada rol
- **motor:** sortea la tormenta de `data/curated/index.json`. La semilla dorada fija la elegida.
- **agentes:** la Meteoróloga no dice "Kp" en Marte. Con `scenario`, dice "esta tormenta real pasó en la Tierra en…".
- **ui:** la tarjeta muestra el ID, la fecha, la etiqueta "datos reales curados, no en vivo" y, si aplica, "escenario".
- **mecanicas:** el e2e de la semilla dorada valida que aparezcan el ID y la fecha.
