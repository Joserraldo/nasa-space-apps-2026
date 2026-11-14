# Estado — diseño de juego y misiones
**Actualizado:** 13 nov 2026, 23:00 · **Rama:** feat/diseno-mision1 (apilada sobre #86) · **PR:** #89 · **Responsables:** Santiago y Camilo
**Tokens:** 🟢

## Hecho (misión 1, #88)
- (1) `eventoPolvo` y `dilemaPaso6` en `missions/src/jezero.ts`, con textos en/es y pruebas (#89). Se mantienen los 4 sitios y los criterios medidos (plano/luz/blindaje): no hay dato de hielo en Jezero → decisión pendiente de Santiago.

- (2) `MODULOS` según el #88 §3: consumo de ⚡ como costo único (plan B): reciclador −1, invernadero −3, escudo −3, antena −1 (orden por kW de ARES). `COSTOS_ACCION` ya movía ≥2 medidores en todas: sin cambios. Consumo por tick pedido a motor en #90. 215/215 pruebas.

## Qué sigue
- (3) #77 ya resuelto en #84 · (4) textos de causas y tarjetas de ciencia · (5) prueba de las 10 parejas con Jaime.

## Números de ARES (CamiloM21/ares-mission-trainer, leídos el 13 nov)
- Potencia (kW): panel 8 (11,6 ampliado), base 2,4, electrólisis 2,2, invernadero 2,8, reciclador 1,2 — `src/model.js:144-149`. Relación útil: invernadero gasta más que nada; reciclador la mitad que electrólisis.
- Polvo: rendimiento × (1 − polvo × 0,78); tormenta de polvo 0,84 → 34 % — `src/model.js:142,217`. Paneles sin limpiar: 0,24.
- Refugio con blindaje deja pasar 3,5 % de la radiación; sin blindaje 25 % — `src/model.js:281-282`.
- Simulacro: refugio + blindaje + oxígeno ON + **invernadero OFF** 15 s — `src/model.js:218-230`.
- **Constantes reales de ARES SIN fuente en el código** (gravedad 3,73, irradiancia 586,2 W/m², 610 Pa, −63 °C) — `src/model.js:12-15`. El #88 dice "NSSDCA": verificar con Daniel antes de usarlas.

## Bloqueos
- Decisión "hielo" (Santiago). Orden de merge: #86 → #89; #84 y #85 aparte.
