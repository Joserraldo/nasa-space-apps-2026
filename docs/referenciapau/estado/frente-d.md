# Estado del Frente D (Daniel)

Actualizado: 15 nov 2026, iteración 2 del loop.

**Hecho**
- D1 (mientras tanto, sin C2): hábitat más fiel a `mundo/01` y `exterior/03`: ventanas apaisadas, costillas que parten el casco en tramos, marco saliente de puerta y mejillas de escalera. Rama `feat/frente-d-d1-mallas`, PR en borrador.
- D1: antena como `mundo/01`: pedestal escalonado de dos pisos con ventilaciones y caseta en lugar del mástil fino, aro en el borde del plato y bola de alimentador más grande. Sin GPU (Playwright headless, `media`, vista de la antena): antes 29 fps, 27 draw calls, 48 023 triángulos; después 29 fps, 26 draw calls, 48 303 triángulos.
- Medido en calidad `media` (PC con GPU, vista previa `?modulos=todos&medir=1`): antes 165 fps, 47 draw calls, 52 467 triángulos; después 165 fps, 47 draw calls, 52 583 triángulos.

**Sigue**
- D1: torre de control y cápsula, una por iteración. A0 (#337) ya está en develop: D2, D3 y D4 quedan desbloqueadas.
- Ubicar los edificios cuando C2 esté fusionado.

**Bloqueado**
- D1 completo espera a C2 (redistribución de la base), que todavía no tiene PR.
- Falta la aprobación de María Paula (F3) de los pares lámina/captura.
- Vista general de la base sin GPU en `media`: 20 fps (meta de D4: 30).
