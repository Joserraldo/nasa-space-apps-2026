# Estado: juego (src/game, src/audio, data/story)
Actualizado: 26 nov 2026 · Santiago · Rama: `feat/ui-play-colonia` · PR en cadena #462 a #468.
## Hecho
- `/play`: intro, tarjetas, C1 y C2 con el motor real, audio, pausa, ajustes y guardado.
- Idioma EN/ES, adaptador, guion, intro y mezclador (PRs #463 a #467).
## Qué sigue / bloqueos
- B1: textos de los componentes y `SettingsState.language` (hoy se guarda en `colonia.idioma`).
- B2 (retratos de Iris y Control), B6 (tripulación en NW-16), pantallas de menú, carga y capítulo.
- Medium y Hard van por turnos: falta decidir el reloj (A6).
- Falta E2E en CI, pantalla final con la cadena de causas y prueba en celular físico.
