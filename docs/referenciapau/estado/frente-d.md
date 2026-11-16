# Estado del Frente D (Daniel)

Actualizado: 16 nov 2026, iteración 12 del loop.

**Hecho**
- D2 (#350), D4 (#371), D5 corredor (#376) y D5 taller (#381): fusionados.
- D1 (#342, borrador): hábitat y antena con los pedidos de F3 corregidos. Espera la revisión de F3 y a C2.
- D5 hábitat (#388): descanso, comedor y enfermería como `estaciones/06` y `07` en `activos/interiores/habitat.ts`. Vista previa `/escena.html?sala=habitat`. 6 draw calls, unos 1 500 triángulos.

**Sigue**
- Unificar `tinte` y la caja de sala del taller con `interiores/comun.ts` (PR chico aparte).
- D3 (día y atardecer con `cicloDia.ts`).

**Bloqueado**
- C2 sin PR (bloquea cerrar D1).
- A8 (José) conecta las salas al juego; las puertas exteriores dependen de C2.
