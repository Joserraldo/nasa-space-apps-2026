# Estado: juego (src/game, src/audio, data/story)
Actualizado: 26 nov 2026 · Santiago · Rama: `feat/ui-audio-colonia`.
## Hecho
- Puente al motor (`motor.ts`), idioma EN/ES y contrato de textos de B1 (`docs/CLAVES-UI.md`).
- Adaptador motor → HUD, diálogo, pausa y tarjeta de capítulo, con tests.
- Guion de C1 y C2 (`data/story/`) con validación, e HISTORIA.md al día.
- Intro: 7 tomas (`data/shots/intro.json`), guion y contenedor 3D; sin choques y vistas en navegador.
- Audio: mezclador de 3 canales, voz del navegador, música y efectos generados.
- CI instala también la raíz antes de comprobar colonia-marte.
## Qué sigue / bloqueos
- `/play`: conectar el audio, la pestaña oculta y la pausa.
- La tripulación no está en NW-16 (B6) y la alarma casi no se nota: se resuelve con retratos y un tinte en `/play`.
- Retratos de Iris y Control (B2): hoy son provisionales. La tarjeta de capítulo aún no tiene vista.
- B1: falta `SettingsState.language` y que los componentes reciban sus textos.
