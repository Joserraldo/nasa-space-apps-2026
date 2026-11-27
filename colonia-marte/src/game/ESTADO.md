# Estado: juego (src/game, src/audio, data/story)
Actualizado: 27 nov 2026 · Santiago · Rama: `feat/ui-conectar-colonia` · PR en cadena desde #462.
## Hecho
- `/play`: intro, tarjetas, C1 y C2 con el motor real, audio, pausa, ajustes y guardado.
- Voces EN/ES, música y efectos grabados (`public/audio`, 4,4 MB; la guía pedía ~2 MB).
- Conectado lo nuevo de la vista: idioma en Ajustes, menú principal, retratos 2D, colonia de C2.
- Volumen en curva perceptual y voz del navegador más lenta (reseña de #467).
- Si el navegador no lee una grabación (VS Code no reproduce AAC), usa su propia voz.
## Qué sigue / bloqueos
- Salas NW-12, NW-09 y NW-08 (faltan referencias), caminar (B4) y B6 (tripulación en NW-16).
- Tarjeta de capítulo de la vista: pide objetivos logrados y no tiene estado de derrota; se decide.
- El menú principal y los botones de la vista aún no tienen voz grabada (usan la del navegador).
- Reloj de Medium y Hard (A6), C3 a C5, pantalla final con causas, E2E en CI y prueba en celular.
