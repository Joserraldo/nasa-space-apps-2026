# Estado — Frente C
**Actualizado:** 16 nov 2026 · **Rama:** `feat/frente-c-C2-distribucion` · **PR:** [#374](https://github.com/Joserraldo/nasa-space-apps-2026/pull/374), borrador

## Hecho
- C1 fusionado por #336; las observaciones de Paulasaah quedaron integradas.
- C2: sensor/anclaje en el sector científico este; ramal peatonal nuevo del sensor al anillo exterior. Se conservan los diez `LugarId`.
- #374 abierto tras `e649242`; develop integrado por merge normal `48e8c0d` y cambios publicados.
- Capturas E6 en 1440×900, 1024×683, 844×390 y 390×844; emulación, no prueba física.
- La redistribución visual de torre, hábitat, enfermería, comedor, plataforma y refugio depende de las mallas/estaciones del Frente D; no se editaron esos archivos.

## Validación
- Typecheck: pasó. Vitest: 139 archivos, 1.038 pruebas pasaron. Build UI: pasó con aviso de chunk JS >500 kB.
- E2E: 5/5 pasaron, incluidos ruta dorada EN, derrota/reintento, idioma persistido y respaldo 2D con mapa.
- Pruebas focalizadas de lugares/rutas/física/solapes: 57/57 pasaron.
- CI remota del commit `48e8c0d`: pasó; CI del nuevo commit de rutas, pendiente tras publicación.
- E6 renderizó el mundo 3D en Playwright; consola sin errores en las cuatro capturas.

## Sigue / bloqueado
- Capturas comparativas previas: `C:/Users/lilia/AppData/Local/Temp/solar-shield-frente-c-c2/`; requieren actualización y carga al PR para revisión visual.
- Faltan aprobación visual de María Paula y redistribuir edificios exteriores con Frente D.
- Mover hábitat a z positivo falló el encuadre de tercera persona; se conservó su posición actual.
- Tokens: 🟡
