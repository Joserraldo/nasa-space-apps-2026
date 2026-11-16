# Estado del Frente D (Daniel)

Actualizado: 15 nov 2026, iteración 6 del loop.

**Hecho**
- D1 (#342, borrador): hábitat y antena con los pedidos de F3 corregidos. Espera la revisión de F3 y a C2.
- D2 (#350): sombra del Sol que sigue al niño y sombra de contacto. Espera revisión.
- D4 (rama `feat/frente-d-d4-rendimiento`): `media` pasa a DPR 1, sin antialias y sombra simple (`BasicShadowMap`, sistema `sistemas/filtroSombra.ts`). Sin GPU, escala 1,25, PC descargada, alternando: `media` de 15 a 35-36 fps; `alta` 14-15 sin cambio; `baja` 60.

**Sigue**
- D5: corredor de conexión como `exterior/01` (interior propio; José lo conecta en A8).

**Bloqueado**
- C2 sin PR (bloquea cerrar D1).
- Push forzado bloqueado en mi entorno: integro develop con merge.
