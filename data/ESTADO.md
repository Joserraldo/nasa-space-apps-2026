# Estado — rol 4 (Datos NASA y ciencia)
**Actualizado:** 2026-11-13 · **Rama:** feat/datos-mocks · **PR:** #16 · contrato #15

## Hecho
- Propuesta del contrato SpaceWeatherEvent v0.1.0 (Zod) en data/src y 3 mocks en data/mock. Las pruebas pasan.
- Llamadas reales a DONKI (CME, GST, SEP en api.nasa.gov; FLR en CCMC porque api.nasa.gov da 404). CORS `*` y límite de 2500/h.
- [V] Mayo 2024: GST 2024-05-10T15:00:00-GST-001 (Kp 9) y FLR X8.7 2024-05-14T16:46:00-FLR-001.

## Qué sigue
- Issue `contrato` para el motor y los agentes. Una llamada de muestra a OSDR search, RadLab y Mars Rover Photos.
- Pipeline DONKI → data/curated (mayo 2024 primero).

## Bloqueos / no verificado
- Contrato sin aprobar. No existen el issue RUTA DORADA ni docs/ORQUESTACION.md.
- Sin verificar: oct 2024 y sep 2017, dosis (Chang'e-4/RAD).

Tokens: 🟢
