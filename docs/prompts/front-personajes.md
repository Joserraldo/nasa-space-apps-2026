# Brief del frontend: dirección visual y personajes (María Paula)

**Qué construís:** los personajes 3D y la portada 3D, y aprobás la fidelidad visual de todo el frontend.
**Tus archivos:** `ui/src/escena/activos/astronautas.ts`, `ui/src/escena/activos/iris.ts`, `ui/src/escena/activos/portada.ts`, `ui/src/escena/guia.ts`.
**Leé:** [DISEÑO.md](../referenciapau/DISEÑO.md) §3–§4 y §6, [APLICACION.md](../referenciapau/APLICACION.md) §3 y §7, [NIVELES.md](../referenciapau/NIVELES.md) §5, láminas `personajes/00–10`, `inicio/01`, `inicio/capas/*`, `mundo/01`.
**Rama:** desde `feat/ui-escenarios`, PR hacia `feat/ui-escenarios` ([FLUJO.md](../referenciapau/FLUJO.md) §2). **Archivos nuevos: empezá ya.** Los archivos que ya existen en el trabajo local de María Paula esperan a que lo suba ([FLUJO.md](../referenciapau/FLUJO.md) §2.1).
**Fuente visual única:** las láminas de `docs/referenciapau/referencias/` y [DISEÑO.md](../referenciapau/DISEÑO.md). El diseño anterior (prototipo, `estilos.css`, `mision.css`, tema oscuro, formas de hoy) **se borra** (FLUJO §2.2): no se toma nada de él.
**Cada PR:** solo tus archivos; menos de ~300 líneas; **ficha de fidelidad** ([FLUJO.md](../referenciapau/FLUJO.md) §7.1) con la captura al lado de la lámina canónica (skill `solar-shield-pr-visual`); salida de `npm run typecheck`, `npm test`, `npm run build` y `npm run e2e` (hasta que la CI cubra la rama); puerta de [APLICACION.md](../referenciapau/APLICACION.md) §10. Lo aprueba y fusiona María Paula.

## Tareas (en orden)

0. **Subir tu trabajo local** tal como está (la lógica se conserva; el diseño anterior lo borran Jaime, José y Daniel justo después, FLUJO §2.2) de `feat/ui-escena-3d` a `feat/ui-escenarios` en PRs atómicos (primero los archivos nuevos de `escena/` y `componentes/`, después los cambios de pantallas). Es la base de los archivos que ya existen; mientras tanto los demás avanzan en archivos nuevos. HECHO: `git status` limpio en tu checkout y PRs fusionados en `feat/ui-escenarios`.
1. **Niño astronauta** (`personajes/08`, `09`, `10`, `inicio/capas/astronauta`): proporción infantil propia, visor transparente, pivotes `Root > Rig > ...`, gestos idle, walk, wave, inspect, kneel, talk. HECHO: captura en los 4 ambientes de luz de `personajes/10`.
2. **Iris rover** (`mundo/01`, `inicio/02`, `personajes/07`): 4 ruedas con pivote, panel en el techo, pantalla con ojos en canvas, los cuatro niveles de NIVELES §5 visibles (cara `error` y gesto `pedir_reparacion` cuando está dañada). Movimiento de guía en `guia.ts` con el destino de `guiaIrisLugar` que le pasa José. HECHO: captura de Iris normal y dañada al lado de la lámina.
3. **Ingeniera 3D** (`personajes/01`, `02`): misma familia de traje, acento naranja, tableta y llave en la mano. HECHO: junto al niño en la base, como `mundo/01`.
4. **Portada 3D** (`inicio/01`, capas): niño flotando con cable, nave, planeta y asteroide, en el mismo renderer; Jaime pone el menú en DOM encima. HECHO: captura comparada con la lámina.
5. Doctora y Meteoróloga 3D solo si el presupuesto medido alcanza; si no, después de P4.
6. **Aprobar la fidelidad** de cada PR de `ui/` contra su lámina y fusionarlo en `feat/ui-escenarios`.

**Contratos:** respetás las firmas `crearAstronauta`, `crearExpertos`, `crearIris` y los tipos `ModeloAstronauta`, `ModeloExperto`, `ModeloIris` que consume `escena3d.ts` (Daniel). Los materiales y slots los da Daniel en `materiales.ts`; si necesitás uno nuevo, se lo pedís.
**Meta:** niño, Iris e Ingeniera fieles a las láminas e integrados en la base antes de P3.
