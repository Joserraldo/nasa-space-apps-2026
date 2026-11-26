# Encargo para Codex: UI v3, una sola pantalla (HUD de juego) con nivel profesional

## 0. Dónde trabajás

- Carpeta `C:\Users\mpaul\Documents\colonia-marte-visual-ui`, rama `ui-kids`. Ya está puesta sobre `integration` (commit `74b0671`): tiene la tripulación, las salas, el exterior y el kit de UI de Carbon (`src/ui/`).
- `npm install`. Servidor en el puerto **5192**: `npx vite --host 127.0.0.1 --port 5192 --strictPort`.
- `.git` es de solo lectura para vos: no hagas commits. No toques otras carpetas ni `docs/referencias/` (salvo leer).
- Antes de tocar HTML/CSS/JS leé `C:/Users/mpaul/.agents/skills/modern-web-guidance/SKILL.md` y verificá Baseline de lo que uses.
- Textos de UI en inglés; código y comentarios en inglés; sin emojis.

## 1. Por qué esta ronda es distinta

Las dos versiones anteriores fueron **rechazadas** por María Paula: «no se ve profesional», «se ve cero profesional, busca referencias de UI» (ver `docs/restricciones-visuales.md`). Están archivadas fuera del repo; **no las retomes**. Esta vez hay referencias concretas y se entrega **una sola pantalla** para aprobar la dirección antes de hacer el resto.

## 2. Referencias (abrilas y miralas antes de escribir código)

En `docs/referencias/ui-polar/`:

- `hud-gameplay.jpg` y `hud-wireframe.jpg`: HUD de "Polar Sci-Fi Facility" (portafolio UI de C. Amorim, https://camorimcontact.wixsite.com/ui-ux/polar-sci-fi-facility).
- `pause-menu.jpg`: su menú de pausa (para la ronda siguiente; solo mirá el lenguaje).
- `figma-scifi-kit.png`: el "Sci-Fi UI Kit (Free)" de Figma en el que se basó el kit de Carbon.

Qué hace que se vean profesionales (eso es lo que hay que reproducir, **no copiar sus elementos**):

1. **Contención**: el centro de la pantalla queda libre; la UI vive en las esquinas, anclada a una grilla con márgenes iguales.
2. **Línea fina y doble**: marcos de 1 a 2 px, a veces doble línea con separación, corchetes en las esquinas, pestañas de título pegadas al marco, pequeñas marcas de regla y cruces de mira en los extremos (`figma-scifi-kit.png`).
3. **Dos tonos más un acento**: casi blanco y casi negro translúcido; un solo color de acento. Nada de gradientes ni de varios colores compitiendo.
4. **Jerarquía tipográfica fuerte**: un título en display ancho y pesado (Nippo del kit, en mayúsculas, con tracking), y texto de cuerpo limpio y legible.
5. **Formas con intención**: placas con un chaflán, anillos para medidores, ángulos diagonales repetidos con el mismo grado.
6. **Diegético donde se puede**: la acción se marca en el mundo con una línea guía hacia el objeto ("DOOR UNLOCKED / OPEN" en `hud-gameplay.jpg`).

## 3. Adaptación al juego (niños de 7 a 10, reglas R1 a R10 de `docs/DISENO-JUEGO.md`)

- **Acento cian** de `palette.json` (el del mundo); ámbar solo para avisos; rojo solo para peligro real. Contraste WCAG AA sobre la escena.
- **Escala**: texto de cuerpo de 20 px o más, títulos de 28 px o más, objetivos táctiles de 64 px. Profesional no significa chico: la referencia es fina pero grande en pantalla.
- **Ícono antes que texto** (R1) y gancho `voiceLine` en cada texto (solo el contrato, sin audio).
- **Recursos como objetos** (R2): medidores en anillo o barra segmentada para batería, aire y escudo, sin números por defecto.
- **Objetivo siempre visible** (R3): placa de objetivo arriba a la derecha con ícono y una frase.
- **Sin efectos de glitch ni estética de abandono** (la referencia los usa; acá no van).

## 4. La pantalla a entregar: HUD de juego sobre una escena real

Montalo sobre `/room/canteen` (y verificá que también funcione sobre `/exterior-pilot`), en una ruta nueva `/hud-preview` o con un interruptor en esas escenas. Elementos:

1. **Etiqueta de zona** (T7.5) abajo a la derecha, como la de los videos de referencia del juego (`docs/referencias/v1/v1-t021.50.jpg`): placa con chaflán, ícono en hexágono, nombre de la sala y barra de acento. Entrada y salida animadas cortas; respetá `prefers-reduced-motion`.
2. **Objetivo** arriba a la derecha: pestaña "OBJECTIVE", ícono, una frase.
3. **Recursos** abajo a la izquierda: anillo grande con ícono del personaje activo o de Iris y 2 o 3 medidores.
4. **Brújula o mini mapa** arriba a la izquierda con marco de doble línea y pestaña.
5. **Indicador de interacción diegético** sobre un objeto de la sala (por ejemplo un dispensador del comedor): marcador con línea guía y una acción ("TAP TO USE").
6. **Diálogo de tripulación** (opcional si te da el tiempo): placa inferior con retrato, nombre y 2 o 3 respuestas grandes (R6, R9).

Todo construido con el sistema de tokens y componentes de `src/ui/` (ajustá tokens: acento cian, escala, tipografía); componentes presentacionales sin estado de juego.

## 5. Entregables

- Capturas en `docs/capturas/`: `ui-v3-hud-canteen.png` y `ui-v3-hud-exterior.png` a 1280x720, `ui-v3-hud-mobile.png` a 812x375 (horizontal), y **`ui-v3-vs-referencia.png`**: tu HUD al lado de `hud-gameplay.jpg` en una sola imagen.
- Tests: contraste AA del acento y del texto sobre la escena, objetivos táctiles de 48 px o más, y que el centro de la pantalla (40 % central) quede libre de UI salvo el indicador diegético.
- `npm run build`, `npx tsc --noEmit`, `npx vitest run` y `npm run validate:pieces` en salida 0.
- Informe `docs/capturas/ui-v3-informe.md`: decisiones tomadas de cada referencia, comandos y salida, capturas, commits sugeridos y una sección **NO VERIFICADO**.

**Pará ahí.** No hagas el menú de pausa, el resto de pantallas ni las 8 pantallas del mundo hasta que María Paula apruebe este HUD.
