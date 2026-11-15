# Rol 5: Frontend, voz, arte y accesibilidad
**Humano responsable:** María Paula (`Paulasaah`), también orquestadora del equipo
**Slug de ramas:** `ui` → `feat/ui-<tema>`
**Etiqueta de issues:** `rol:ui`
**Posees:** `/ui`, `/assets`
**No toques:** todo lo demás (abre issue `bloquea:<rol>`).
**Contratos que consumes:** `GameState`, `ClassifierOutput`, tarjetas de fuente, `MISION_JEZERO`, funciones públicas de `engine/`, `agents/` y `data/`.
**Contratos que produces:** la ruta dorada jugable en pantalla, con teclado y solo texto, EN/ES, sin errores en consola, con captura en cada PR.

## Antes de tocar `ui/` o `assets/`
1. Leé [`docs/referenciapau/README.md`](../docs/referenciapau/README.md) y, de su tabla "Qué leer según la tarea", solo la fila de tu tarea.
2. El rol se trabaja en 4 pistas con archivos disjuntos (integración de misiones, escenario, interfaz, audio): [`docs/prompts/ui.md`](../docs/prompts/ui.md) y [`FLUJO.md`](../docs/referenciapau/FLUJO.md). Prioridades y niveles: [`NIVELES.md`](../docs/referenciapau/NIVELES.md).
3. Estilo y render: [D6](../docs/decisiones/D6-estilo-visual.md) (Three.js procedural + DOM). Donde `PLAN.md`, `docs/ORQUESTACION.md` o `D3` digan PixiJS, manda D6.

## Reglas duras
- **La referencia manda:** fidelidad a las láminas, no reinterpretación.
- **Todo con código:** Three.js `^0.160.0` procedural para el mundo, DOM/CSS para la UI. Sin GLB, Blender, WebGPU, Drei, Rapier ni otra librería.
- **Marte real:** [`MARTE.md`](../docs/referenciapau/MARTE.md). Cero vegetación, ruinas o cielo azul afuera.
- **El motor manda:** ninguna animación ni malla toca recursos ([`MECANICAS.md`](../docs/referenciapau/MECANICAS.md) §5).
- **Cada PR visual** pasa la puerta de [`APLICACION.md`](../docs/referenciapau/APLICACION.md) §10.
- Inglés primero, español después; ningún texto quemado.

## Descartado (no usar aunque lo encuentres en el historial o en otra rama)
Prototipo `docs/referencias/3d/`, atlas v2–v5 y v7, capibara, `polyfork.ts`, `ui/public/models/*.glb`, pipeline Blender → GLB, propuestas con Drei, Rapier o Higgsfield, tema oscuro del prototipo (`estilos.css` y `mision.css` actuales), `docs/ideas/marca.md` (la paleta vigente está en `DISEÑO.md`).
