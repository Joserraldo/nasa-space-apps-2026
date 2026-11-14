---
name: solar-shield-game-balance
description: Cambiar números de balance de Solar Shield (recursos, costos, módulos, eventos, dificultad). Usar antes de tocar design/src o missions/src.
---

1. Los números viven solo en `design/src/*.ts` y `missions/src/*.ts`, como datos. Nada de lógica ahí y ningún número en `engine/`.
2. Regla de oro: cada acción mueve al menos dos medidores, uno para bien y otro para mal. Ninguna opción es gratis ni domina a las demás.
3. Solo tres recursos: energía, soporte vital (incluye comida) y blindaje.
4. Antes de cambiar un número, mira si está aprobado en `design/DECISIONES.md`. Si no lo está, propónlo ahí como pendiente y pregunta; no lo des por decidido.
5. Después de cada cambio: `npm run typecheck && npx vitest run engine missions`. Si falla `engine/src/dorada.test.ts`, rompiste la partida de la demo: para y coordina con motor.
6. Niveles de módulo, averías o acciones nuevas tocan `contracts/`: issue `contrato` primero.
