# Estado: juego (src/game, src/audio, data/story)
Actualizado: 26 nov 2026 · Santiago · Rama: `feat/ui-adaptador-colonia`.
## Hecho
- Puente al motor (`motor.ts`), idioma EN/ES y contrato de textos de B1 (`docs/CLAVES-UI.md`).
- Adaptador motor → HUD, diálogo, pausa y tarjeta de capítulo, con tests.
- CI instala también la raíz antes de comprobar colonia-marte.
## Qué sigue / bloqueos
- Historia, intro, audio y `/play`.
- Retratos de Iris y Control (B2): hoy son provisionales. La tarjeta de capítulo aún no tiene vista.
- B1: falta `SettingsState.language` y que los componentes reciban sus textos.
