# Estado del Frente D (Daniel)

Actualizado: 16 nov 2026, iteración 9 del loop.

**Hecho**
- D2 (#350) y D4 (#371): fusionados. `media` de 15 a 35-36 fps sin GPU.
- D1 (#342, borrador): hábitat y antena con los pedidos de F3 corregidos. Espera la revisión de F3 y a C2.
- D5 parte 1 (#376): corredor de conexión como `exterior/01` en `activos/interiores/corredor.ts`, con zona caminable y entrada para A8. Vista previa `/escena.html?sala=corredor`. 6 draw calls, 1 878 triángulos.

- D5 parte 2 (rama `feat/frente-d-d5-taller`, depende de #376): taller como `estaciones/05` en `activos/interiores/taller.ts`, con puntos de uso y obstáculos para A8. Vista previa `/escena.html?sala=taller`. 5 draw calls, 1 642 triángulos.

**Sigue**
- D5 parte 3: hábitat (estaciones 06 a 08).

**Bloqueado**
- C2 sin PR (bloquea cerrar D1).
- A8 (José) conecta el corredor al juego; las puertas exteriores dependen de C2.
