# Encargo para Codex: terminar toda la UI del juego, en dos fases

## 0. Dónde se trabaja

Igual que en `docs/prompts/codex-ui-ajustes.md`, sección 0:

- carpeta `colonia-marte-visual-ui`, rama `ui-kids`, puerto 5192;
- sin commits;
- leer la skill `modern-web-guidance`;
- textos y código en inglés;
- sin emojis.

El trabajo de Ajustes ya está commiteado como checkpoint (`f527a6c`): se parte de ahí.

Siguen vigentes **todas** las reglas de las secciones 1, 3 y 4 de `codex-ui-ajustes.md`:

- se compone con el kit;
- solo se usan tokens;
- no se agregan colores nuevos;
- objetivos táctiles de 64 px en escritorio y 48 en celular;
- nada se corta a 1280x720 ni a 812x375, con y sin Big text;
- todo texto lleva `data-voice-line`;
- como máximo 3 opciones por pantalla (R6);
- contenedor separado de presentación;
- no se modifica el aspecto del HUD, la pausa y el diálogo aprobados.

Cada pantalla nueva entra en el registro con su ID `UI-<LAYER>-<NAME>`, con tests unitarios y con chequeos medidos en `tools/capture-*.mjs`, al mismo nivel que `capture-settings.mjs`.

## 1. Revisión de Ajustes (revisor, 2026-11-26)

Verificado: build, tsc, vitest **153/153**, validate:pieces, `capture-settings.mjs` **122/122 PASS**, `capture-hud.mjs` PASS, `capture-dialogue-matrix.mjs` ALL PASS. El paso de tamaños de letra a tokens con `--ui-hud-type-scale` está bien hecho: con escala 1 no cambia nada de lo aprobado. Big text se ve bien en el HUD y en el diálogo.

**Defecto que hay que corregir primero: sobre la losa clara, la selección se lee al revés.** La opción elegida (Easy, Off, Left y la pestaña activa) va clara con borde cian, y las no elegidas van en negro macizo. Sobre fondo claro, el bloque negro pesa más y un niño lee que están elegidas "Medium", "On" y "Right". Además, la pestaña Grown-ups activa se ve negra con subrayado, distinta de Sound y Play activas: es inconsistente.

El lenguaje aprobado de la pausa sobre la losa clara es este: **activo = barra oscura (`--ui-hud-panel-solid`) con glifo en acento; inactivo = transparente con texto oscuro**. Hay que aplicarlo así:

| Estado | Aspecto |
|---|---|
| Opción o pestaña **elegida** | Relleno oscuro `--ui-hud-panel-solid`, texto claro, borde de 2.5 px en `--ui-hud-accent` y un glifo nuevo `check` antes del texto (pista que no depende del color) |
| Opción o pestaña **no elegida** | Fondo transparente o el de la losa, contorno de 1.5 px en `--ui-hud-panel-solid`, texto oscuro |
| Hover | Solo el contorno pasa a acento |
| Foco de teclado | Anillo de acento visible por fuera, sin cambiar el relleno, para que el foco no se confunda con la selección |
| Botones de acción (menos, más, Back, Reset, Credits) | Contorno oscuro de 1.5 px y texto oscuro, sin relleno macizo. Así las acciones no compiten con los estados |
| Deshabilitado | Contorno y texto con `--ui-hud-ink-dim` o con la opacidad que ya use el kit. Nada de gris macizo |

Las tres pestañas usan exactamente la misma regla, sea cual sea la que tenga el foco.

Falta también la captura de la **puerta de adultos cerrada** y a mitad de carga: `ui-v3-settings-gate-{desktop,mobile}.png`.

## 2. Fase 1: corregir Ajustes y tres pantallas nuevas. Pausar al final

### 2.1 Corrección de Ajustes (sección 1)

Se recapturan las 6 capturas de Ajustes y se agrega la de la puerta. Hace falta un chequeo nuevo en el script: la opción con `aria-pressed="true"` tiene que tener un fondo más oscuro (menor luminancia) que las opciones con `aria-pressed="false"`, medido con `getComputedStyle`.

### 2.2 Menú principal (`UI-ORGANISM-MAIN-MENU`, ruta `/menu`)

Es lo primero que ve el niño. Usa el mismo lenguaje de losa diagonal que la pausa, sobre una escena real de fondo: la vista del puente de la nave o el exterior de la colonia, desenfocada como en la pausa.

- Título del juego en display grande. Nombre provisional: "MARS COLONY". Se lee de una constante para cambiarlo después.
- **Tres opciones como máximo:**
  - **Continue**, con el glifo `play`. Solo aparece si hay progreso guardado (`colonia.progress.`) y muestra el capítulo actual debajo, con su voz.
  - **New game**, con un glifo nuevo `rocket`.
  - **Settings**, con el glifo `gear`. Abre el mismo organismo de Ajustes.
- Sin progreso guardado, el menú muestra New game y Settings.
- La columna derecha lleva la tarjeta del capítulo actual (`createHudFrame` con pestaña), igual que la tarjeta de misión de la pausa.

### 2.3 Pantalla de carga (`UI-ORGANISM-LOADING`)

- Muestra un medidor de progreso real, conectado al `LoadingManager` de three si la ruta lo usa. Si no, el progreso es indeterminado y se anota.
- El glifo de Iris lleva una animación sutil, que respeta `prefers-reduced-motion`.
- Muestra **un dato de Marte por carga**, con voz y como máximo 12 palabras, sacado de una lista en `src/ui/content/mars-facts.ts`. Los datos se basan en `docs/MARTE.md`; no se inventa ninguno.
- Tiene que aparecer en menos de 100 ms y no puede causar saltos de layout cuando desaparece.

### 2.4 Tarjeta de capítulo (`UI-ORGANISM-CHAPTER-CARD`)

Tiene dos variantes con el mismo organismo:

- **Inicio de capítulo:** número y título (C1 "The journey" a C5 y Final, según la tabla 4.1 de `docs/DISENO-JUEGO.md`), qué se va a aprender en una frase con dibujo (R3) y un botón **Start**.
- **Capítulo completo:** las estrellas o los objetos logrados (sin números en Easy, R2), la frase "Your game is saved" con su voz (R7) y dos opciones: **Next chapter** y **Colony map**.

Los textos de los 6 capítulos van en `src/ui/content/chapters.ts`. Ninguna línea supera las 12 palabras.

**Pausar al terminar la Fase 1.** Entregar el informe `docs/capturas/codex-ui-fase1-informe.md` con la misma estructura de VERIFICADO, NO VERIFICADO y Decisiones, y capturas de cada pantalla a escritorio y celular, con y sin Big text. María Paula aprueba antes de seguir.

## 3. Fase 2 (solo después de la aprobación de la Fase 1)

### 3.1 Mapa de la colonia (`UI-ORGANISM-COLONY-MAP`, ítem "Colony map" de la pausa)

- Plano 2D de la colonia del capítulo actual, desde `data/layouts/colonies/`. Las salas son placas con chaflán y glifo, y se marca "You are here".
- **Tocar una sala te lleva a ella** (teletransporte, `DISENO-JUEGO.md` §"Recorrer caminando es lento"). Muestra una confirmación de una línea y llama `onTravel(roomId)`.
- Las salas que todavía no existen en ese capítulo no aparecen.
- **Respaldo de accesibilidad obligatorio:** una lista 2D de lugares con los mismos destinos, navegable con teclado y lector de pantalla. El repo exige esa lista.
- Si el plano tiene más de 3 salas, eso no rompe R6: es un mapa, no un menú. Pero cada sala tiene un objetivo táctil de 64 px y como máximo 1 o 2 palabras.

### 3.2 Avisos (`UI-MOLECULE-HUD-TOAST`)

- **Pista de Iris:** burbuja breve con el glifo de Iris y una línea con voz, que no tapa el centro de la pantalla. Se va sola, o antes si se toca. Como máximo una a la vez.
- **Recurso bajo:** se verifica que la batería, la burbuja y el escudo del HUD **parpadean** cuando bajan (§5.3). Si el kit no tiene ese estado, se agrega como estado del átomo, que respeta el movimiento reducido (sin parpadeo, con un contorno de advertencia `--ui-hud-warning`).

### 3.3 Palabra explicada (`UI-MOLECULE-TERM`, R10)

Las palabras "dose", "radiation", "sol" y "telemetry" aparecen subrayadas en el diálogo. Al tocarlas se abre una tarjeta pequeña con dibujo y una frase con voz. Hay que usar la Popover API si su soporte Baseline alcanza a los navegadores objetivo; verificarlo con la skill y anotarlo. Los textos van en `src/ui/content/glossary.ts` y se basan en `docs/MARTE.md`.

### 3.4 Pantalla final (`UI-ORGANISM-FINALE`, capítulo Final)

"Families arrive": repaso de los 5 objetivos que se aprendieron, con un ícono y una frase por objetivo, en forma de **cadena de causas** (lo que hiciste, lo que causó). Se presenta como una secuencia de tarjetas de a una o dos por vez, con Next, para no mostrar 5 bloques juntos (R6). Termina con **Play again** y **Main menu**.

### 3.5 Chat escrito opcional (`UI-ORGANISM-CREW-CHAT`, R9)

Desde el diálogo, un botón secundario "Type a question" abre un campo de texto con la lista de mensajes. Es **opcional** y nunca reemplaza las respuestas con ícono. Solo se hace la interfaz: el campo, el historial y el estado de "thinking". La respuesta es un callback `onAsk(text): Promise<string>` con una respuesta falsa en la vista de prueba. Se anota en NO VERIFICADO que no hay modelo conectado.

### 3.6 Pantallas dentro del mundo (T1.4)

`src/materials/screens.ts` ya tiene 8 tipos dibujados en canvas: `dispenser`, `terminal`, `colony-map`, `energy`, `communications`, `greenhouse`, `solar-alert` y `menu`. **Se revisan, no se rehacen.** Se alinean con la UI v3:

- mismas dos tonalidades más cian;
- glifos con el mismo trazo que `HUD_GLYPHS`;
- tipografía Chakra Petch / Exo 2 si el canvas las carga, y si no, el fallback documentado.

Hay que mantener el tamaño de la textura y la API. Se entrega una hoja comparando antes y después, `docs/capturas/ui-v3-pantallas-mundo.jpg`, y se verifica que el catálogo y las salas de Carbon que usan esas pantallas siguen funcionando (`npx vitest run` y una captura de `/room/nw-13`).

**Al terminar la Fase 2**, entregar `docs/capturas/codex-ui-fase2-informe.md` con la misma estructura y una **hoja de contacto con todas las pantallas** de la UI: `docs/capturas/ui-v3-todas-{desktop,mobile}.jpg`.

## 4. Verificación de cada fase

Correr y pegar la salida en el informe:

- `npm run build`, `npx tsc --noEmit`, `npx vitest run` y `npm run validate:pieces`;
- **todos** los `tools/capture-*.mjs`, los anteriores y los nuevos. Ningún script viejo puede pasar a FAIL.

Un chequeo que falla no se debilita para que pase: se corrige la pantalla o se explica en NO VERIFICADO.
