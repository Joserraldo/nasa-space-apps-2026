# Brief del frontend: escenario 3D (Daniel)

**Qué construís:** el mundo de Marte en Three.js `^0.160.0` procedural y su rendimiento. Es la parte con más trabajo del frontend: usá Codex con GPT-6.1 para segunda opinión en geometría y rendimiento, y subagentes Sonnet para replicar familias de piezas ya aprobadas.
**Tus archivos:** `ui/src/escena/escena3d.ts`, `EscenaBase.tsx`, `materiales.ts`, `liberar.ts`, `cielo.ts`, `soporte.ts`, `modelos.ts`, `escena.test.ts`, `ui/src/escena/activos/piezasComunes.ts`, `instancias.ts`, `terreno.ts`, `modulos.ts`, `estaciones.ts`.
**Leé:** [MARTE.md](../referenciapau/MARTE.md), [DISEÑO.md](../referenciapau/DISEÑO.md) §2–§3 y §7–§8, [APLICACION.md](../referenciapau/APLICACION.md) §1–§4 y §7–§8, [ESCENAS.md](../referenciapau/ESCENAS.md) §3.1–§3.3 (qué se ve, plano de la base y organización del exterior), [`mapa-base-jezero.svg`](../referenciapau/mapa-base-jezero.svg), láminas `mundo/01`, `mundo/02`, `piezas/01–10`, `exterior/01`, `exterior/02`, `exterior/03`.
**Rama:** desde `feat/ui-escenarios`, PR hacia `feat/ui-escenarios` ([FLUJO.md](../referenciapau/FLUJO.md) §2). **Archivos nuevos: empezá ya.** Los archivos que ya existen en el trabajo local de María Paula esperan a que lo suba ([FLUJO.md](../referenciapau/FLUJO.md) §2.1).
**Fuente visual única:** las láminas de `docs/referenciapau/referencias/` y [DISEÑO.md](../referenciapau/DISEÑO.md). El diseño anterior (prototipo, `estilos.css`, `mision.css`, tema oscuro, formas de hoy) **se borra** (FLUJO §2.2): no se toma nada de él.
**Cada PR:** solo tus archivos; menos de ~300 líneas; **ficha de fidelidad** ([FLUJO.md](../referenciapau/FLUJO.md) §7.1) con la captura al lado de la lámina canónica; salida de `npm run typecheck`, `npm test`, `npm run build` y `npm run e2e` (hasta que la CI cubra la rama); puerta de [APLICACION.md](../referenciapau/APLICACION.md) §10. Lo aprueba y fusiona María Paula.

## Tareas (en orden: primero lo más importante, los modelos y el escenario)

Empezá **ya** por los archivos nuevos (1 a 5); los que existen en el trabajo de María Paula (6 y 7) van cuando ella lo suba.

1. **Base técnica** (nuevos): `materiales.ts` (caché de geometrías y slots `SuitBase`, `Accent`, `Boots`, `Skin`, `Hair`, `Glass`, `Emissive`, `Rock`, `Plant`) y `liberar.ts`. HECHO: tests en verde y sin fugas al desmontar.
2. **Cielo y luz de Marte** (`cielo.ts`, MARTE.md §4–§5): cielo salmón y caramelo de día, halo junto al Sol, sombras lilas, niebla del color del horizonte. **Nunca el cielo azul de las láminas.** HECHO: captura comparada con `mundo/01` con el cielo corregido.
3. **Terreno de Jezero** (`activos/terreno.ts`) desde `data/terreno/jezero/elevacion.bin`, con rocas basálticas facetadas de cara superior más clara. HECHO: captura del terreno.
4. **Modelos del kit** (`activos/piezasComunes.ts`, `instancias.ts`, APLICACION §4): puerta, consola, caja, panel solar, depósito, antena, baliza, camino; una pieza maestra por familia, instanciada. HECHO: captura de cada pieza al lado de `piezas/01–08`.
5. **Los 5 módulos** (`activos/modulos.ts`): panel solar, reciclador, escudo, invernadero y antena, con estados ausente, instalando y funcionando; solo los 2 construidos se ven construidos. HECHO: las 10 parejas posibles revisadas.
6. **Borrar el diseño anterior** en `escena3d.ts`, `modelos.ts` y `EscenaBase.tsx` (FLUJO §2.2) y montar ahí lo anterior, con las props de `EscenaBase` acordadas con José. HECHO: ni rastro del prototipo y la escena nueva se ve en la app.
7. **Base compacta** sobre los `LUGARES` de Camilo. El **plano del exterior** sale de `exterior/03` y de ESCENAS §3.3: claro central, plataforma con nave arriba a la izquierda, grupo de energía a la izquierda, cúpula de control al centro unida por corredores (`exterior/01`), invernadero geodésico arriba a la derecha, refugio con regolito abajo a la izquierda y dos caminos en anillo con balizas; las posiciones exactas son las de `mapa-base-jezero.svg` y `LUGARES`. **Cómo se ve** desde la cámara de juego sale de `mundo/01`. HECHO: dos capturas en el PR, una cenital al lado de `exterior/03` y otra desde la cámara de juego al lado de `mundo/01`.
8. **Medición y degradación**, con fecha límite **dom 10:00** para la decisión de P3: draw calls, triángulos, DPR, 3D completo, liviano y 2D, en un celular y un PC viejo (`npm run dev -w ui -- --host`). HECHO: números en el PR y en `ui/ESTADO.md`.
9. Después de P4: estaciones (ESCENAS §4).

**Contratos:** leés `VistaEscena` (José) y `LUGARES` (Camilo); consumís las fábricas de personajes de María Paula. Nunca leés `GameState` directo ni calculás reglas.
**Además, tu rol de datos:** #162, #141, glosario y fuentes (prompt [datos.md](datos.md)). El DEM de Jezero es tuyo en `data/`: conocés su formato mejor que nadie.
**Meta:** escenario fiel a `mundo/01` con el cielo de Marte, dentro de 80 draw calls y 80 000 triángulos, antes de P3.
