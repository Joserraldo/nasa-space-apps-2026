# Estado — rol 2 (Motor y simulación)
**Actualizado:** 2026-11-13 13:00 · **Rama:** feat/motor-contratos · **PR:** ver issue `contrato`

## Hecho (últimas iteraciones)
- Scaffold npm workspaces (`contracts`, `engine`), TypeScript estricto, Vitest.
- Borrador de contratos v0.1.0 en Zod: Seed, Site, Difficulty, Action (enum cerrado), ClassifierOutput, SpaceWeatherEvent, GameState.
- RNG determinista (FNV-1a + mulberry32) con estado en `GameState.rngEstado`; 10 tests en verde.
- Propuesta D3 en `docs/decisiones/D3-motor.md`.

## Qué sigue
- Aprobación del issue `contrato` por agentes y datos; ajustar campos que pidan.
- Generador de escenario por semilla (sitio, tormenta, averías, objetivo).
- `aplicarAccion(estado, accion)` con cola de efectos 1–3 ticks y registro de causas.

## Bloqueos
- Lista final de acciones y tabla de recursos de Jezero (rol diseño). Forma final de SpaceWeatherEvent (rol datos). Repo aún en FASE 0; código subido con OK del humano del rol.

Tokens: 🟢
