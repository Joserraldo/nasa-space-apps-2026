# Estado del Frente D (Daniel)

Actualizado: 15 nov 2026, iteración 8 del loop.

**Hecho**
- D2 (#350): fusionado.
- D1 (#342, borrador): hábitat y antena con los pedidos de F3 corregidos. Espera la revisión de F3 y a C2.
- D4 (#371): `media` de 15 a 35-36 fps sin GPU (sombra simple, DPR 1, sin antialias). Capturas de `media` en los 4 tamaños.
- D5 parte 1 (rama `feat/frente-d-d5-corredor`): corredor de conexión como `exterior/01` en `activos/interiores/corredor.ts`, con zona caminable y entrada para A8. Vista previa `/escena.html?sala=corredor`. 6 draw calls, 1 878 triángulos.

**Sigue**
- D5 parte 2: taller (estación 05) y después hábitat (06 a 08).

**Bloqueado**
- C2 sin PR (bloquea cerrar D1).
- A8 (José) conecta el corredor al juego; las puertas exteriores dependen de C2.
