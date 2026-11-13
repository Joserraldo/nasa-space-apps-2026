# Estado — rol 2 (Motor y simulación)
**Actualizado:** 2026-11-13 14:50 · **Rama:** feat/motor-adaptativo · **PR:** adaptativo → develop (#21, #29, #30 ya en develop)

## Hecho (últimas iteraciones)
- P1: contratos v0.2.0 (#29) con lo pedido por datos y agentes en #17. En develop.
- P2: escenario por semilla, aplicarAccion con cola de efectos y causas (#21); órbita por tick, daño en Marte por medición RAD y puntaje de sitio 3 criterios (#30). En develop.
- P3: IA de la base adaptativa por reglas del estado (racha, errores, quietud, radiación con umbral por dificultad); `reparar ia_base`; reto del día por fecha (`reto-AAAA-MM-DD`, siempre Jezero); región por semilla. 48 tests en verde.
- Nuevo campo `GameState.rendimiento` (racha, errores, ticks quieto), anotado en #17.

## Qué sigue
- Conectar `eventosCurados` de @solar-shield/data en el reto del día (#23 ya está en develop).
- Resumen de fin de partida para la pantalla "cadena de causas" (decisión vs mala suerte) e insignias.
- Revisar números de design/ con diseño; congelar antes de dom 13:00.

## Bloqueos
- OK de agentes en #17 para cerrar contratos. Sin bloqueos de código.

Tokens: 🟢
