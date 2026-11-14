# Estado — rol 2 (Motor y simulación)
**Actualizado:** 2026-11-13 16:40 · **Rama:** feat/motor-novedades · **PR:** novedades → develop (#53 ya en develop)

## Hecho (últimas iteraciones)
- P1-P3 completos y en develop: contratos v0.2.0, escenario, cola de efectos, órbita, puntaje de sitio, IA adaptativa, reto del día, resumen final.
- Ruta dorada (#41, tareas de motor): `SEMILLA_DORADA` congelada por snapshot (Jezero + tormenta 2024-05-20 medida por RAD + Iris dañada); `partidaDorada()` y `paso()` como API única para ui con ejemplo en `engine/README.md`; telemetría con retraso de comunicaciones por sitio (`enviar_telemetria`, `telemetriaPendiente`); misión de Jezero como datos en `missions/` (nuevo workspace) con test de que ningún módulo es gratis.
- `novedades(antes, despues)` y `conPausaAutomatica` para que ui pause en tormenta, avería, mala suerte, cambio de IA y fin; `retoDelDia` usa `eventosCurados` de data/ por defecto (#57 completo). 187 tests en verde.

## Qué sigue
- Explicarle el motor a Camilo (pendiente humano); Camilo arranca por `design/` y `missions/`.
- Acompañar a ui cuando conecte el HUD: ajustar la API si falta algo. Revisar con diseño (Santiago/Camilo) los números de design/ y la misión en missions/.
- Congelar números de design/ antes de dom 13:00.

## Bloqueos
- ninguno

Tokens: 🟢
