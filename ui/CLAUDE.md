# Rol 5: Frontend, voz, arte y accesibilidad
**Humano responsable:** María Paula (`Paulasaah`)
**Slug de ramas:** `ui` → `feat/ui-<tema>`
**Etiqueta de issues:** `rol:ui`
**Posees:** `/ui`, `/assets`
**No toques:** todo lo demás (abre issue `bloquea:<rol>`).
**Contratos que consumes:** `GameState`, `ClassifierOutput`, tarjetas de fuente
**Contratos que produces:** Jugable con teclado y solo texto; es/en; sin errores en consola; captura en el PR.
**Definición de "hecho":** - Moodboard y referencias de interfaces para niños; propuesta de estilo visual (D6).
- Propuestas de nombre del juego, logo y tripulantes (D1, D7) con rol 1.
- Checklist de accesibilidad (contraste, tamaño, lectura, daltonismo).
- Entregable: `docs/ideas/marca.md`.

## Fase 0 (ahora, solo documentos — nada de código del juego)
1. Esqueleto React + Vite + TS (PLAN §13; PixiJS solo para la escena animada) e i18n es/en desde el primer commit.
2. HUD de los 3 recursos (energía, soporte vital, blindaje).
3. Panel de tripulación: botones por experto + caja de texto (siempre funcionan).
4. Voz con Web Speech API detrás de un interruptor (Chrome/Edge); sin guardar audio.
5. Pantalla de "cadena de causas" y tarjeta de ciencia al final.
6. Trabaja contra mocks de `/data/mock` y un `GameState` de ejemplo.

## Tareas de arranque (Fase 1, el día que empieza el hackathon)


## Notas / decisiones que afectan este rol
- **Dirección visual única vigente (14 nov 2026):** [`docs/referenciapau/README.md`](../docs/referenciapau/README.md). Antes de tocar `ui/` o `assets/`, leé la fila de tu tarea en su tabla "Qué leer según la tarea".
- **Reglas duras:** la referencia manda (fidelidad, no reinterpretación); todo se construye con código (Three.js `^0.160.0` procedural, DOM/CSS), sin GLB ni WebGPU ni librerías nuevas; Marte realista ([`MARTE.md`](../docs/referenciapau/MARTE.md)); el motor manda sobre toda animación ([`MECANICAS.md`](../docs/referenciapau/MECANICAS.md) §5); cada PR visual pasa la puerta de [`APLICACION.md`](../docs/referenciapau/APLICACION.md) §10.
- **Descartes que no vuelven:** capibara, atlas `v2`–`v5` y `v7`, `polyfork.ts`, `ui/public/models/*.glb`, entradas crudas de la ampliación, tema oscuro del prototipo.
