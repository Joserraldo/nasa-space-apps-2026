# Estado — rol 2 (Motor y simulación)
**Actualizado:** 2026-11-13 16:10 · **Rama:** feat/motor-ruta-dorada · **PR:** ruta dorada → develop (#21, #29, #30, #31, #32 ya en develop)

## Hecho (últimas iteraciones)
- P1-P3 completos y en develop: contratos v0.2.0, escenario, cola de efectos, órbita, puntaje de sitio, IA adaptativa, reto del día, resumen final.
- Ruta dorada (#41, tareas de motor): `SEMILLA_DORADA` congelada por snapshot (Jezero + tormenta 2024-05-20 medida por RAD + Iris dañada); `partidaDorada()` y `paso()` como API única para ui con ejemplo en `engine/README.md`; telemetría con retraso de comunicaciones por sitio (`enviar_telemetria`, `telemetriaPendiente`); misión de Jezero como datos en `missions/` (nuevo workspace) con test de que ningún módulo es gratis.
- Acciones nuevas en el contrato: `colocar_modulo` y `enviar_telemetria` (anotado en #17). 169 tests en verde en todo el monorepo.

## Qué sigue
- Explicarle el motor a Camilo (pendiente humano); Camilo arranca por `design/` y `missions/`.
- Acompañar a ui cuando conecte el HUD: ajustar la API si falta algo.
- Congelar números de design/ antes de dom 13:00.

## Bloqueos
- ninguno

Tokens: 🟢
