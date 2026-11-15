# Brief del frontend: escenario 3D (Daniel)

**Qué construís:** el mundo de Marte en Three.js `^0.160.0` procedural y su rendimiento. Es la parte con más trabajo del frontend: usá Codex con GPT-6.1 para segunda opinión en geometría y rendimiento, y subagentes Sonnet para replicar familias de piezas ya aprobadas.
**Tus archivos:** `ui/src/escena/escena3d.ts`, `EscenaBase.tsx`, `materiales.ts`, `liberar.ts`, `cielo.ts`, `soporte.ts`, `modelos.ts`, `escena.test.ts`, `ui/src/escena/activos/piezasComunes.ts`, `instancias.ts`, `terreno.ts`, `modulos.ts`, `estaciones.ts`.
**Leé:** [MARTE.md](../referenciapau/MARTE.md), [DISEÑO.md](../referenciapau/DISEÑO.md) §2–§3 y §7–§8, [APLICACION.md](../referenciapau/APLICACION.md) §1–§4 y §7–§8, [ESCENAS.md](../referenciapau/ESCENAS.md) §3.1, láminas `mundo/01`, `mundo/02`, `piezas/01–10`, `exterior/02`, `exterior/03`.
**Rama:** desde `feat/ui-escenarios`, PR hacia `feat/ui-escenarios` ([FLUJO.md](../referenciapau/FLUJO.md) §2). **No empezar** hasta que María Paula suba su trabajo local a esa rama (FLUJO §5, fase 0).
**Fuente visual única:** las láminas de `docs/referenciapau/referencias/` y [DISEÑO.md](../referenciapau/DISEÑO.md). Del prototipo descartado y del esqueleto actual de ui (`estilos.css`, `mision.css`, tema oscuro, formas de hoy) no se toma nada visual.
**Cada PR:** solo tus archivos; menos de ~300 líneas; captura al lado de la lámina; salida de `npm run typecheck`, `npm test`, `npm run build` y `npm run e2e` (hasta que la CI cubra la rama); puerta de [APLICACION.md](../referenciapau/APLICACION.md) §10. Lo aprueba y fusiona María Paula.

## Tareas (en orden)

1. **Base técnica:** `materiales.ts` (caché de geometrías y slots `SuitBase`, `Accent`, `Boots`, `Skin`, `Hair`, `Glass`, `Emissive`, `Rock`, `Plant`) y `liberar.ts` (dueño explícito, resistente a `StrictMode`). HECHO: tests en verde y sin fugas al desmontar.
2. **Cielo y luz de Marte** (`cielo.ts`, MARTE.md §4–§5): cielo salmón y caramelo de día, halo junto al Sol, sombras lilas, niebla del color del horizonte. **Nunca el cielo azul de las láminas.** HECHO: captura comparada con `mundo/01` con el cielo corregido.
3. **Props de `EscenaBase`** acordadas con José (FLUJO §3). HECHO: contrato fusionado.
4. **Medición y degradación:** draw calls, triángulos, DPR, 3D completo, liviano y 2D; medir en un celular y un PC viejo (`npm run dev -w ui -- --host`). HECHO: números en el PR y en `ui/ESTADO.md` para la decisión de P3.
5. **Terreno de Jezero** desde `data/terreno/jezero/elevacion.bin` y rocas basálticas facetadas con la cara de arriba más clara. HECHO: captura del terreno con la base.
6. **Kit de piezas** (APLICACION §4): puerta, consola, caja, panel solar, depósito, antena, baliza, camino. HECHO: una pieza maestra por familia, instanciada.
7. **Base compacta** sobre los `LUGARES` de Camilo, como `mundo/01`. HECHO: captura desde la cámara de juego al lado de la lámina.
8. **Los 5 módulos** detrás de `crearModulo`: solo los 2 construidos se ven construidos; ausente, instalando y funcionando. HECHO: las 10 parejas posibles revisadas en desarrollo.
9. Después de P4: estaciones (ESCENAS §4).

**Contratos:** leés `VistaEscena` (José) y `LUGARES` (Camilo); consumís las fábricas de personajes de María Paula. Nunca leés `GameState` directo ni calculás reglas.
**Además, tu rol de datos:** #162, #141, glosario y fuentes (prompt [datos.md](datos.md)). El DEM de Jezero es tuyo en `data/`: conocés su formato mejor que nadie.
**Meta:** escenario fiel a `mundo/01` con el cielo de Marte, dentro de 80 draw calls y 80 000 triángulos, antes de P3.
