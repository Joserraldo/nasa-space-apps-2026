# Estado del Frente D (Daniel)

Actualizado: 16 nov 2026, iteración 11 del loop.

**Hecho**
- D2 (#350), D4 (#371) y D5 corredor (#376): fusionados.
- D1 (#342, borrador): hábitat y antena con los pedidos de F3 corregidos. Espera la revisión de F3 y a C2.
- D5 taller (#381): taller como `estaciones/05` en `activos/interiores/taller.ts`, con puntos de uso y obstáculos para A8. Vista previa `/escena.html?sala=taller`. 5 draw calls, 1 642 triángulos.

- D5 parte 3 (rama `feat/frente-d-d5-habitat`, depende de #381): hábitat como `estaciones/06` y `07` en `activos/interiores/habitat.ts` (litera, comedor, enfermería). Vista previa `/escena.html?sala=habitat`. 6 draw calls, unos 1 500 triángulos.

**Sigue**
- Después de fusionar #381: unificar `tinte` y la caja de sala del taller con `interiores/comun.ts`.
- D3 (día y atardecer con `cicloDia.ts`).

**Bloqueado**
- C2 sin PR (bloquea cerrar D1).
- A8 (José) conecta corredor y taller al juego; las puertas exteriores dependen de C2.
