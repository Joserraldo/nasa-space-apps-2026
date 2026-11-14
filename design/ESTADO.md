# Estado — diseño de juego y misiones
**Actualizado:** 13 nov 2026, 23:25 · **Rama:** feat/diseno-mision1 (apilada sobre #86) · **PR:** #89 · **Responsables:** Santiago y Camilo
**Tokens:** 🟢

## Hecho (misión 1, #88)
- (1) `eventoPolvo` y `dilemaPaso6` en `missions/src/jezero.ts`, con textos en/es y pruebas (#89). Se mantienen los 4 sitios y los criterios medidos (plano/luz/blindaje): no hay dato de hielo en Jezero → decisión pendiente de Santiago.

- (2) `MODULOS` según el #88 §3: consumo de ⚡ como costo único (plan B): reciclador −1, invernadero −3, escudo −3, antena −1 (orden por kW de ARES). `COSTOS_ACCION` ya movía ≥2 medidores en todas: sin cambios. Consumo por tick pedido a motor en #90. 215/215 pruebas.

- (3) #77 resuelto en #84 · (4) textos de la cadena de causas: hechos en #85 (`design/i18n`).
- (4) Tarjetas de ciencia (7) y pregunta final del paso 8 en `jezero.ts` + textos en/es. 5 tarjetas y la pregunta sin fuente: no se muestran; pedido a datos en #93. 218/218 pruebas.

- (5) `missions/test/parejas.test.ts`: las 10 parejas con la semilla dorada hasta 3 ticks de tormenta. Ninguna gana gratis ni domina a las demás. 222/222 pruebas. Pendiente que Jaime la revise (usa su API).

## Hallazgo de balance (no corregido: decide diseño con Jaime)
- Si el jugador NO hace nada en la tormenta, el blindaje llega a 0 en 7 de 10 parejas (fin de partida en el tick 5-6). Solo las parejas con escudo quedan en 8-12. La tormenta quita ~60 de blindaje en 3 ticks: o se baja el daño, o el dilema del paso 6 es obligatorio para sobrevivir (puede ser lo que se quiere).

## Qué sigue
- Goal de #56 cubierto en lo que es de diseño. Falta: decisión "hielo" (Santiago), fuentes de tarjetas (#93), consumo por tick (#90), revisión de Jaime.

## Números de ARES (CamiloM21/ares-mission-trainer, leídos el 13 nov)
- Potencia (kW): panel 8 (11,6 ampliado), base 2,4, electrólisis 2,2, invernadero 2,8, reciclador 1,2 — `src/model.js:144-149`. Relación útil: invernadero gasta más que nada; reciclador la mitad que electrólisis.
- Polvo: rendimiento × (1 − polvo × 0,78); tormenta de polvo 0,84 → 34 % — `src/model.js:142,217`. Paneles sin limpiar: 0,24.
- Refugio con blindaje deja pasar 3,5 % de la radiación; sin blindaje 25 % — `src/model.js:281-282`.
- Simulacro: refugio + blindaje + oxígeno ON + **invernadero OFF** 15 s — `src/model.js:218-230`.
- **Constantes reales de ARES SIN fuente en el código** (gravedad 3,73, irradiancia 586,2 W/m², 610 Pa, −63 °C) — `src/model.js:12-15`. El #88 dice "NSSDCA": verificar con Daniel antes de usarlas.

## Bloqueos
- Decisión "hielo" (Santiago). Orden de merge: #86 → #89; #84 y #85 aparte.
