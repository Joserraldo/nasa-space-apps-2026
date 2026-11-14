# Estado — diseño de juego y misiones
Actualizado: 14 nov 2026 · Camilo · Rama: `feat/diseno-duracion-tormenta` · PR #135.
Tokens: 🟢

## Hecho
- #134 ya incorporó la constante única de tres ticks y las pruebas integradas en `engine/src/ganable.test.ts`.
- #135 conserva esa declaración de develop y actualiza documentación, sin copiar pruebas a `missions/test/`.
- #138 (tarjetas científicas) integrado intacto; no se modifican sus archivos de misiones.
- Validación local: typecheck OK; suite 307/307 (incluye ganable); dorada + missions 28/28; diff limpio. CI/E2E se revisan aparte.

## Qué sigue / decisiones abiertas
- #139 incorpora `puedeAplicar`, pero no `elegirDilema`; #140 se cerró afirmando que lo sustituía. Coordinar con motor.
- Definir cierre por `tickLimite: 10` y confirmar umbral de rechazo de acciones; aquí no se cambian números.
- Copia de pruebas a misiones solo si se acuerda; DD-08 y DD-09 siguen pendientes. Sin loops.
