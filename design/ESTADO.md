# Estado — diseño de juego y misiones
Actualizado: 14 nov 2026 · Responsable: Camilo · Rama: `feat/diseno-duracion-tormenta`.
Tokens: 🟢

## Hecho
- Dato aprobado: `DURACION_TORMENTA_TICKS = 3` en `recursos.ts`, exportado por `@solar-shield/design`.
- [Aprobación de Santiago en #114](https://github.com/Joserraldo/nasa-space-apps-2026/issues/114#issuecomment-6884368837): daño en 3, 4 y 5; desde 6 no.
- Especificaciones de victoria y fallo en `design/PRUEBAS-114.md`; aún no son pruebas integradas.
- Dependencias recuperadas con `npm ci`; manifiestos y lockfile sin cambios.
- Validación: typecheck OK; `npm test` 293/293; dorada + missions 27/27; `git diff --check` OK.

## Qué sigue / bloqueos
- Jaime (#113): consumir duración, aplicar aterrizaje, limitar módulos y cerrar por telemetría; después congelar las dos pruebas en `missions/test/`.
- Se conserva `tickLimite: 10`; sin cambios en motor, contratos, ui ni agentes. Sin loops automáticos.
