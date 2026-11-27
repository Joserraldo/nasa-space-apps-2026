# Estado — motor y simulación
Actualizado: 26 nov 2026 · Santiago · Rama: `feat/motor-viaje-marte` · PR hacia `feat/infra-integracion-colonia`.
## Hecho
- Misión `viaje-marte` (C1) con `decisionInicial` (refugio o escudo) y dilema de la tormenta (qué sacrificar).
- Motor: `elegirPlan` y `extraCausaKey`; `contracts/` sin cambios.
- Balance probado con zona × módulos × plan × sacrificio.
## Qué sigue / bloqueos
- Números de `viaje-marte` pendientes de aprobar (DD-10).
- El flujo del juego debe aplicar el plan cuando llega la tormenta (tick 3), no al elegirlo.
