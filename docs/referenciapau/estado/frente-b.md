# Estado — Frente B (tripulación viva, IA y jugador de prueba)
**Actualizado:** 15 nov 2026

## Hecho
- B0: contrato de conversación en `agents/src/conversacion.ts`, con pruebas. PR #334 listo para revisión: CI en verde, falta la revisión de José (frente A).

## Sigue
- En curso, cada una en su rama y con PR borrador: B1 (líneas del globo), B2 (la tripulación recuerda, depende de #334), B3 (conversación en el mundo, lado de agentes y Worker, depende de #334), B4 (datos de Marte con fuente) y B5 (diario del jugador, encuentro 1).

## Bloqueado
- B6 (niveles de Iris en su comportamiento) espera A2 fusionada: su "hecho cuando" son capturas en la escena.
- B3 en el mundo espera A6 (expertas en escena) y E2 (`[E] Talk`); mientras tanto, el campo `Ask your crew...`.
- Evaluación con el modelo real: sin clave en esta máquina.
