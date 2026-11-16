# Estado del Frente D (Daniel)

Actualizado: 15 nov 2026, iteración 3 del loop.

**Hecho**
- D1 (#342, borrador): hábitat y antena fieles a `mundo/01`. Espera a C2 y la aprobación de María Paula.
- D2 (parte 1, rama `feat/frente-d-d2-sombras`): la cámara de sombra sigue al niño (sistema `escena/sistemas/sombraSol.ts`), ajustada a la grilla de píxeles; caja de 32 m en `media` en vez de 80 m (píxel de sombra 6 cm en vez de 16 cm); rango de profundidad 100 a 200 y sesgo -0,0003.
- fps sin GPU (headless, `?modulos=todos`): antes alta 20, media 20, baja 60; después alta 20, media 21, baja 60. 47 draw calls en ambos.

**Sigue**
- D2 parte 2: sombra de contacto de personajes (que nadie flote) y calidad de sombra por nivel.
- D4 (rendimiento): `media` sin GPU da 20 fps; la meta es 30.

**Bloqueado**
- C2 sin PR (bloquea cerrar D1).
- Push forzado bloqueado en mi entorno: integro develop con merge.
