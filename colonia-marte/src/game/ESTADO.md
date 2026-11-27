# Estado: juego (src/game, src/audio, data/story)
Actualizado: 26 nov 2026 · Santiago · Rama: `feat/ui-voces-colonia` · PR en cadena desde #462.
## Hecho
- `/play`: intro, tarjetas, C1 y C2 con el motor real, audio, pausa, ajustes y guardado.
- Idioma EN/ES, adaptador, guion, intro y mezclador (PRs #463 a #467).
- Voces EN/ES, música y efectos grabados (`public/audio`, 4,4 MB; la guía pedía ~2 MB).
## Qué sigue / bloqueos
- B1: textos de los componentes y `SettingsState.language` (hoy se guarda en `colonia.idioma`).
- B2 (retratos de Iris y Control), B6 (tripulación en NW-16), pantallas de menú, carga y capítulo.
- Medium y Hard van por turnos: falta decidir el reloj (A6).
- Falta E2E en CI, pantalla final con la cadena de causas y prueba en celular físico.
