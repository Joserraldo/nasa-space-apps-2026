# Encargo de UI: auditoría de calidad, idioma (B1), `update(state)` (B5) y caminar (B4)

Carpeta `colonia-marte-visual-ui`, rama `ui-kids`, puerto 5192. Sin commits: el revisor commitea. Siguen vigentes todas las reglas de `docs/prompts/codex-ui-ajustes.md` (sección 4) y `codex-ui-completa.md`. Leer la skill `modern-web-guidance` (guías de accesibilidad, i18n y diálogos) antes de tocar código.

La fase 1 fue **aprobada** por María Paula (está en `docs/restricciones-visuales.md`). Aun así, ella ve **errores de letras no centradas, de accesibilidad y de ubicación de objetos**. Esta ronda los corrige **en toda la UI** y deja un chequeo automático para que no vuelvan.

## 1. Defectos encontrados por el revisor (corregir todos)

Medidos en Chromium o vistos en las capturas de `docs/capturas/`:

1. **Margen interno insuficiente en las opciones de Ajustes.** En celular (812x375) con Big text, en Play, "Easy", "Medium" y "Hard" quedan con **5 px** de margen izquierdo y derecho: el texto toca el borde. Mínimo **10 px** a cada lado en todo botón, con y sin Big text. Si no entra, la fila de opciones pasa debajo de la etiqueta, en lugar de comprimir.
2. **"JOYSTICK SIDE" se parte en dos líneas** en celular y queda desalineada con sus botones. Las etiquetas de fila no se cortan ni desalinean: la etiqueta y su control comparten la línea base, o la etiqueta va arriba del control.
3. **Tarjetas de capítulo en lugares distintos.** En escritorio, la de inicio queda a la derecha y la de capítulo completo a la izquierda del centro. Las dos van **centradas en la ventana**, en el mismo lugar, con el mismo ancho.
4. **La tarjeta del capítulo en el menú cruza la diagonal de la losa** en celular: se monta sobre el borde. Tiene que quedar entera del lado de la escena, con margen.
5. **La puerta de adultos en celular** se ve chica y aislada: el anillo y el texto "Hold for 3 seconds" ocupan poco y dejan un vacío grande. El botón de mantener presionado mide al menos 64 px de alto en escritorio y 48 en celular, y va centrado en el panel con una línea que explique para qué es ("For grown-ups"), con su voz.
6. **Contraste sobre fondo desenfocado.** Las etiquetas pequeñas en gris claro sobre la escena borrosa ("CURRENT STATUS" en la pausa, en celular) tienen que medir al menos **4.5:1 contra los píxeles reales del fondo**, no contra el token. Si no llegan, se les pone un fondo o se sube el tono.
7. **Barra de carga sin progreso visible** en celular con Big text: la barra se ve llena o vacía sin indicador. Revisar que el progreso, determinado o indeterminado, se vea en los cuatro casos.

## 2. Auditoría automática nueva: `tools/audit-ui.mjs`

Un solo script que recorre **todas** las pantallas: HUD, pausa, diálogo (todas las muestras), Ajustes (las tres pestañas, la puerta, la confirmación y los créditos), menú (con y sin progreso), carga y las dos tarjetas de capítulo. Corre en 1280x720 y 812x375, con y sin Big text, en Chromium con ventana visible y la ventana al frente (`page.bringToFront()`). Por cada pantalla mide e imprime PASS o FAIL:

- **Centrado:** en cada botón y cada pastilla con texto, el centro vertical del texto queda a 2 px o menos del centro del botón. El margen interno, a 10 px o más por lado. En los centrados, el centro horizontal a 2 px o menos.
- **Sin recortes:** `scrollWidth <= clientWidth` y `scrollHeight <= clientHeight` en todo texto, salvo los paneles con desplazamiento declarado.
- **Ubicación:** ningún componente se solapa con otro, salvo los que están pensados uno dentro del otro. Todo queda dentro de la ventana con al menos el margen `--ui-hud-margin`. Los modales y tarjetas van centrados (diferencia de 4 px o menos).
- **Objetivo táctil:** 64 px en escritorio y 48 en celular, en todo lo que se toca.
- **Accesibilidad con axe-core:** agregar `@axe-core/playwright` como dependencia de desarrollo **con versión exacta** (verificar en npm la versión estable actual antes de fijarla, y anotarla). La meta es cero violaciones `serious` o `critical`. Las `moderate` se listan en el informe con su justificación o arreglo.
- **Contraste real:** para cada texto, el contraste contra la mediana de los píxeles del fondo detrás de su caja, tomados de la captura de pantalla con el texto oculto. Mínimo 4.5:1 en texto normal y 3:1 en texto grande (24 px o más, o 18.66 px en negrita o más).
- **Foco:** recorrer con Tab cada pantalla. El orden sigue el visual, el anillo de foco es visible en cada parada y no hay trampas de foco fuera de los diálogos.

Guardar una hoja de contacto por tamaño: `docs/capturas/ui-auditoria-{desktop,mobile}.jpg`, con todas las pantallas. Un chequeo que falla no se debilita para que pase: se corrige la pantalla.

## 3. B1: idioma en Ajustes y textos por parámetro (pedido de Santiago)

**Usar el contrato que Santiago ya publicó**, no inventar claves propias: `docs/CLAVES-UI-santiago.md`, copia de `colonia-marte/docs/CLAVES-UI.md` de su PR #463.

- El campo es `SettingsState.language: "en" | "es"`, con `"en"` por defecto, porque así lo lee ya su juego. No uses `locale`.
- Las claves son las suyas (`componente.hud.pausa`, `componente.pausa.opciones`, `componente.ajustes.titulo`...). Las que terminan en `.voz` son solo para `data-voice-line`, y `{name}`, `{label}`, `{value}`, `{title}` y `{author}` se reemplazan al mostrar.
- Cada organismo recibe un objeto `strings: Record<string, string>` (clave a texto) por parámetro: el que devuelve su `textosDeComponentes(idioma)`. No queda **ningún texto fijo** en los componentes.
- Para las vistas de prueba de esta rama, sin su `src/game/` todavía, crea `src/ui/i18n/strings.en.ts` y `strings.es.ts` con **exactamente** esas claves y esos valores, en español neutro. Hace falta un test que compare las claves con `docs/CLAVES-UI-santiago.md` y falle si sobra o falta alguna.
- Si un componente necesita un texto que no está en el contrato (por ejemplo, de la carga o de las tarjetas de capítulo: el contrato reserva `componente.carga.*`), agrégalo con el mismo prefijo `componente.` y lístalo en `docs/ui-i18n-contrato.md` como **claves nuevas para que Santiago las sume** a sus JSON.
- **Ajustes, pestaña Play:** una fila nueva, **Language**, con English y Español y el mismo control de elección. Para no pasar de 3 filas (R6), "Joystick side" se mueve a Grown-ups, que queda con 4 filas en este orden: Hardcore, Joystick side, Reset progress, Credits. Como es la zona de adultos, detrás de la puerta, ahí se acepta. Anotarlo en Decisiones.
- `lang` en `<html>` sigue el idioma.
- Big text y los chequeos de recorte tienen que pasar también en español, que es más largo.

## 4. B5: `update(state)` en el HUD

`createGameHud` devuelve además `update(partial: Partial<GameHudState>)`, que actualiza solo lo que cambió (medidores, objetivo, paso, zona y mapa) **sin recrear el DOM**: mismos nodos, sin perder el foco, sin parpadeo. Las regiones que cambian por sí solas usan `aria-live="polite"`, solo donde aporta (el objetivo y el paso), para no saturar al lector de pantalla. Tests: los nodos se conservan y `update` con el mismo estado no toca el DOM.

## 5. B4: caminar por toda la sala

`src/navigation/mode-controller.ts` limita x y z a −1..7, y NW-15 mide 12 x 8 m. Los límites tienen que salir del **layout de cada sala** (celdas de `data/layouts/rooms/*.json`), con un margen de pared. Tests: en NW-15 se puede llegar a las cuatro esquinas sin atravesar paredes, y en el comedor se mantiene el comportamiento actual.

## 6. Entrega

Informe `docs/capturas/ui-auditoria-informe.md`:
- **VERIFICADO**, con la salida de `audit-ui.mjs` y de todos los `tools/capture-*.mjs`, build, tsc, vitest y validate:pieces;
- **NO VERIFICADO**;
- **Decisiones**.

Capturas antes y después de cada defecto de la sección 1. Sin commits; detenerse al terminar.
