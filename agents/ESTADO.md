# Estado — Frente B (tripulación viva, IA y jugador de prueba)
**Actualizado:** 15 nov 2026 · **Rama:** feat/agentes-contrato-conversacion · **Plan:** docs/referenciapau/PLAN-JUGABILIDAD.md §4

## Hecho
- B0: contrato de conversación en `agents/src/conversacion.ts` (`turno`, `pedidoAlModelo`, `validarClasificacion`, `recuerdosDe`, `MemoriaConversacion`), con 19 pruebas. Falta la revisión de José (A).

## Qué sigue
- B1: líneas cortas del globo por paso y por nivel de Iris (EN y ES, 2 renglones en 390 px).
- B2: la tripulación comenta los `Recuerdo` (llena `memoria.comentados`). Espera a B0 fusionado.
- B5: diario del jugador en cada encuentro.

## Bloqueos
- B3 en el mundo espera A6 (expertas en escena) y E2 (`[E] Talk`).
- El prompt del frente (`docs/referenciapau/prompts/`) vive en el PR #333, todavía sin fusionar.
