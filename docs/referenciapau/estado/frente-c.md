# Estado — Frente C
**Actualizado:** 16 nov 2026 · **Rama:** `feat/frente-c-C2-distribucion` · **PR:** [#374](https://github.com/Joserraldo/nasa-space-apps-2026/pull/374), borrador

## Hecho
- C1 fusionado por #336; las observaciones de Paulasaah quedaron integradas.
- C2: sensor y su anclaje trasladados al este en `mundo.ts`; se conservan los diez `LugarId`.
- #374 abierto tras `e649242`; develop integrado por merge normal `48e8c0d` y cambios publicados.
- Capturas E6 en 1440×900, 1024×683, 844×390 y 390×844; emulación, no prueba física.

## Validación
- Typecheck y build UI tras el merge: pasaron. Vitest: 139 archivos, 1.037 pruebas pasaron.
- E2E antes del merge: 4/5; ruta dorada agotó 90 s esperando «Repair Iris». No repetido tras el merge.
- CI remota del commit `48e8c0d`: en curso.
- E6 renderizó el mundo 3D en Playwright; consola sin errores en las cuatro capturas.

## Sigue / bloqueado
- Capturas comparativas temporales: `C:/Users/lilia/AppData/Local/Temp/solar-shield-frente-c-c2/`.
- Faltan aprobación visual de María Paula y redistribuir edificios exteriores con Frente D.
- Mover hábitat a z positivo falló el encuadre de tercera persona; se conservó su posición actual.
- Tokens: 🟡
