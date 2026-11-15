# Brief del frontend: interfaz, el sistema facetado (Jaime)

**Qué construís:** la interfaz **de las láminas v8** (`ui/00` a `ui/04`, `inicio/01` a `inicio/03`, `personajes/07` y el HUD de `mundo/01`), **desde cero**, replicando su forma, paleta y composición según [DISEÑO.md](../referenciapau/DISEÑO.md) §5–§6. José monta tus piezas en las pantallas.

> **Del esqueleto actual de ui (#68) no se toma nada visual:** ni `estilos.css`, ni `mision.css`, ni el tema oscuro, ni la forma de los componentes que hay hoy. Están descartados ([APLICACION.md](../referenciapau/APLICACION.md) §1, [DISEÑO.md](../referenciapau/DISEÑO.md) §8). La única guía visual son las láminas y DISEÑO.md. Si algo de hoy se parece a la lámina, igual se rehace con los tokens v8.
**Tus archivos:** `ui/src/componentes/base/**`, `ui/src/estilos/**` (reemplaza `estilos.css` y `mision.css`), `ui/public/**`, `TarjetaFuente.tsx`, `Glosario.tsx`, `DatosUsados.tsx`, `Portada.tsx`, `Intro.tsx`, `Carga.tsx`, `Iconos.tsx`, `LogoSolarShield.tsx`, `RetratoIris.tsx`.
**Leé:** [DISEÑO.md](../referenciapau/DISEÑO.md) §2, §5, §6 y §8, [APLICACION.md](../referenciapau/APLICACION.md) §5 y §7, [REFERENCIAS.md](../referenciapau/REFERENCIAS.md) §2 y §4, [HISTORIA.md](../referenciapau/HISTORIA.md) §3 (texto de la intro), láminas `ui/00–04`, `inicio/01–03`, `personajes/02, 04, 06, 07, 09`.
**Rama:** desde `feat/ui-escenarios`, PR hacia `feat/ui-escenarios` ([FLUJO.md](../referenciapau/FLUJO.md) §2). **Todo se escribe nuevo, desde ya:** nadie trabaja sobre el preview desplegado ni re-estiliza archivos viejos ([FLUJO.md](../referenciapau/FLUJO.md) §2.3). La subida de María Paula fue solo lógica (#184, #197).
**Fuente visual única:** las láminas de `docs/referenciapau/referencias/` y [DISEÑO.md](../referenciapau/DISEÑO.md). El diseño anterior (prototipo, `estilos.css`, `mision.css`, tema oscuro, formas de hoy) **se borra** (FLUJO §2.2): no se toma nada de él.
**Cada PR:** solo tus archivos; menos de ~300 líneas; **ficha de fidelidad** ([FLUJO.md](../referenciapau/FLUJO.md) §7.1) con la captura al lado de la lámina canónica (skill `solar-shield-pr-visual`); salida de `npm run typecheck`, `npm test`, `npm run build` y `npm run e2e` (hasta que la CI cubra la rama); puerta de [APLICACION.md](../referenciapau/APLICACION.md) §10. Lo aprueba y fusiona María Paula.

## Tareas (en orden)

Empezá ya por los archivos nuevos (tokens, `componentes/base/`, portada DOM, intro, carga).

0. **Borrar el diseño anterior** en cuanto tus tokens estén listos: `ui/src/estilos.css` completo (`mision.css` nunca se subió), reemplazados por `ui/src/estilos/` con los tokens v8 (FLUJO §2.2). HECHO: la app compila sin esos archivos y sin el tema oscuro.
1. **Tokens y tipografía** (DISEÑO §2.1, §2.1.1 y §2.4): `ui/src/estilos/tokens.ts` con todos los hex de DISEÑO §2 (también los de trajes y entorno, que usa el 3D), `tokens.css` con las mismas variables y un test que compara los dos; chaflán, sombra, espaciado, duraciones y curvas; Nunito y Nunito Italic servidas desde `ui/public/fuentes/` con su `OFL.txt`. Es contrato (FLUJO §3): va primero porque lo usan todos. HECHO: test de tokens en verde, la fuente carga sin red y el tema oscuro no se usa en ninguna pantalla nueva.
2. **`FacetButton`** con todos los estados de `ui/02` y `ui/03` (normal, hover, pressed, focus fuera del recorte, disabled con motivo, selected, busy) y áreas de 44 x 44 px. HECHO: captura de todos los estados al lado de la lámina.
3. **`ResourcePlaque`** (tres separados, valor real, delta y causa), **`CostRow`**, **`PendingEffect`**, mensajes y **`ConfirmarAccion`** (props de APLICACION §5, acordadas con José). HECHO: José los puede montar sin tocar tus archivos.
4. **Retratos de diálogo** en SVG facetado del niño, las 3 expertas e Iris con las 8 expresiones. HECHO: misma identidad que los modelos 3D de María Paula.
5. **Portada DOM** (logo oficial, `Start mission`, `Continue`, `Settings`, preferencias), **intro** en 4 tarjetas con el texto de HISTORIA §3 y **carga** con indicador indeterminado. HECHO: captura comparada con `inicio/01–03`.
6. **Datos en pantalla:** `TarjetaFuente` con identificador, fecha y "datos reales, no en vivo"; `DatosUsados` (con las funciones del #162 de Daniel); `Glosario` con los términos en contexto. HECHO: pantalla final con datos y fuentes.
7. **Responsive** (ESCENAS §2.7): cada componente probado en 1024 x 683, 844 x 390 y 390 x 844, con texto de 16 px como mínimo en celular y márgenes `env(safe-area-inset-*)`. Los controles táctiles los arma Camilo con tu `FacetButton`. HECHO: tres capturas por componente en su PR.
7. Al final, si sobra tiempo antes de P4: audio y voz ([front-audio.md](front-audio.md)).

**Contratos:** textos siempre por clave i18n; las claves nuevas las agregás vos en tu PR, en `ui/i18n/en.json` y `es.json`, bajo tu prefijo (FLUJO §1.1); props de APLICACION §5.
**Además, tu rol de motor:** revisar el uso del motor en los PRs de pantalla, prueba de dos semillas para P3 y #152 (prompt [motor.md](motor.md)).
**Meta:** todas las piezas, fieles a sus láminas y aprobadas por María Paula una por una, montadas por José antes del punto de control de P4.
