# Estado — Frente C
**Actualizado:** 15 nov 2026 · **Rama:** `feat/frente-c-C2-distribucion` · **PR:** [#374](https://github.com/Joserraldo/nasa-space-apps-2026/pull/374), borrador

## Hecho
- C1 fusionado por #336; las observaciones de Paulasaah quedaron integradas.
- C2: sensor y su anclaje trasladados al este en `mundo.ts`; se conservan los diez `LugarId`.
- #374 abierto tras el primer commit `e649242` para mostrar el avance y solicitar revisión de Paula.
- Capturas E6 generadas en 1440×900, 1024×683, 844×390 y 390×844; emulación, no prueba física.

## Validación
- Typecheck y build de UI: pasaron. Vitest: 126 archivos, 946 pruebas pasaron.
- E2E: 4/5 pasaron; la ruta dorada agotó 90 s esperando «Repair Iris».
- E6 renderizó el mundo 3D en Playwright; consola sin errores en las cuatro capturas.

## Sigue / bloqueado
- Capturas comparativas temporales: `C:/Users/lilia/AppData/Local/Temp/solar-shield-frente-c-c2/`.
- Faltan aprobación visual de María Paula y redistribuir edificios exteriores con Frente D.
- Mover hábitat a z positivo falló el encuadre de tercera persona; se conservó su posición actual.
- Tokens: 🟡
