# Estado del frente F (María Paula): UI visual, retratos B y fidelidad

**Actualizado:** 15 nov 2026, iteración 4 del loop (y revisión de animaciones a pedido de María Paula).

**Hecho**
- F2 (#341) y F4 (#343) fusionados en `develop`. Sobre develop: typecheck sin errores, 923 pruebas, build y los dos guiones de capturas en los 4 tamaños.
- `tests/capturas/tarjetas.mjs` mide la tarjeta cuando termina la entrada (a 1440x900 salía corrida 24 px y daba un falso "fuera de la ventana").
- Animaciones de F2 y F4 revisadas con impeccable (animate), frontend-design y review-animations (ui-skills): tarjeta con transiciones que se pueden interrumpir, salida con desaceleración y contenido escalonado; aviso `[E]` en 120 ms. Botones táctiles: borde en todas las aristas, sin resaltado azul al tocar, salto apretado en lila.
- F3, D1 (#342): hábitat no aprobado todavía (vano octogonal hundido con marco y las dos franjas cian de la puerta); antena aprobada con dos ajustes (plato más inclinado al cielo e interior lila). Evidencia en `evidencias/frente-f-f3-d1`.

- Placas de la órbita (#351): grilla como `ui/05` y nombre visible en celular (la regla del HUD que lo escondía ahora vale solo en `.hud-placas`).

**Sigue**
- Volver a revisar D1 cuando Daniel corrija; C2 y C3 cuando abran PR. El loop está parado (regla 9).
- #335 (E1): Santiago tiene la propuesta para usar la tarjeta de F2 como presentación.

**Bloqueado / en pausa**
- F1 y F6 en pausa: llevan al niño B y María Paula pidió esperar su idea de personajes.
- #323 (borrador, cambios pedidos): no es del frente F; decide un humano si se cierra.
