# Brief del frontend: interfaz, el sistema facetado (Jaime)

**Qué construís:** todas las piezas de interfaz v8 que José monta en las pantallas, y las pantallas de datos.
**Tus archivos:** `ui/src/componentes/base/**`, `ui/src/estilos/**` (reemplaza `estilos.css` y `mision.css`), `ui/public/**`, `TarjetaFuente.tsx`, `Glosario.tsx`, `DatosUsados.tsx`, `Portada.tsx`, `Intro.tsx`, `Carga.tsx`, `Iconos.tsx`, `LogoSolarShield.tsx`, `RetratoIris.tsx`.
**Leé:** [DISEÑO.md](../referenciapau/DISEÑO.md) §2, §5, §6 y §8, [APLICACION.md](../referenciapau/APLICACION.md) §5 y §7, [REFERENCIAS.md](../referenciapau/REFERENCIAS.md) §2 y §4, [HISTORIA.md](../referenciapau/HISTORIA.md) §3 (texto de la intro), láminas `ui/00–04`, `inicio/01–03`, `personajes/02, 04, 06, 07, 09`.
**Rama:** desde `feat/ui-escenarios`, PR hacia `feat/ui-escenarios` ([FLUJO.md](../referenciapau/FLUJO.md) §2). **No empezar** hasta que María Paula suba su trabajo local a esa rama (FLUJO §5, fase 0).
**Cada PR:** solo tus archivos; menos de ~300 líneas; captura al lado de la lámina; salida de `npm run typecheck`, `npm test`, `npm run build` y `npm run e2e` (hasta que la CI cubra la rama); puerta de [APLICACION.md](../referenciapau/APLICACION.md) §10. Lo aprueba y fusiona María Paula.

## Tareas (en orden)

1. **Tokens CSS** (DISEÑO §2.1): marfil, lila, ciruela, cian, chaflán, sombra, espaciado, tipografía de 18–20 px, duraciones y curvas. HECHO: el tema oscuro ya no se usa en ninguna pantalla nueva.
2. **`FacetButton`** con todos los estados de `ui/02` y `ui/03` (normal, hover, pressed, focus fuera del recorte, disabled con motivo, selected, busy) y áreas de 44 x 44 px. HECHO: captura de todos los estados al lado de la lámina.
3. **`ResourcePlaque`** (tres separados, valor real, delta y causa), **`CostRow`**, **`PendingEffect`**, mensajes y **`ConfirmarAccion`** (props de APLICACION §5, acordadas con José). HECHO: José los puede montar sin tocar tus archivos.
4. **Retratos de diálogo** en SVG facetado del niño, las 3 expertas e Iris con las 8 expresiones. HECHO: misma identidad que los modelos 3D de María Paula.
5. **Portada DOM** (logo oficial, `Start mission`, `Continue`, `Settings`, preferencias), **intro** en 4 tarjetas con el texto de HISTORIA §3 y **carga** con indicador indeterminado. HECHO: captura comparada con `inicio/01–03`.
6. **Datos en pantalla:** `TarjetaFuente` con identificador, fecha y "datos reales, no en vivo"; `DatosUsados` (con las funciones del #162 de Daniel); `Glosario` con los términos en contexto. HECHO: pantalla final con datos y fuentes.
7. Al final, si sobra tiempo antes de P4: audio y voz ([front-audio.md](front-audio.md)).

**Contratos:** textos siempre por clave i18n (las claves nuevas se las pedís a José); props de APLICACION §5.
**Además, tu rol de motor:** revisar el uso del motor en los PRs de pantalla, prueba de dos semillas para P3 y #152 (prompt [motor.md](motor.md)). Armaste el esqueleto de ui (#68): estos componentes reemplazan esa primera versión con la familia v8.
**Meta:** todas las piezas v8 listas y montadas por José antes del punto de control de P4.
