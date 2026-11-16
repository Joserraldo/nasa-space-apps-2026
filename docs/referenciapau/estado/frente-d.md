# Estado del Frente D (Daniel)

Actualizado: 15 nov 2026, iteración 5 del loop.

**Hecho**
- D1 (#342, borrador): corregidos los 4 pedidos de F3 (puerta del hábitat, plato de la antena). Espera la nueva revisión de F3 y a C2.
- D2 (#350): la cámara de sombra sigue al niño (`sistemas/sombraSol.ts`) y ahora hay sombra de contacto bajo cada personaje y bajo Iris (`sistemas/sombraContacto.ts`, 1 draw call, en las tres calidades; en `baja` es la única sombra).
- fps (headless sin GPU, PC cargada, alternando con y sin la sombra de contacto): `media` 10 a 11, `baja` 30 a 30; 47 a 48 draw calls.

**Sigue**
- D2 queda completo con esto; esperar revisión de #350 (el "Hecho cuando" pide video sin parpadeo: falta con GPU real).
- D4 (rendimiento): `media` sin GPU da unos 20 fps en una PC descargada; la meta es 30.

**Bloqueado**
- C2 sin PR (bloquea cerrar D1).
- Push forzado bloqueado en mi entorno: integro develop con merge.
