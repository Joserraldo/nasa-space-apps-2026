# Encargo para Codex: pantalla de Ajustes completa, compuesta con el kit de UI aprobado

## 0. Dónde se trabaja

- Carpeta `C:\Users\mpaul\Documents\colonia-marte-visual-ui`, rama `ui-kids` (commit `e9e8bad`). No trabajar en otra carpeta.
- Ejecutar `npm install`. El servidor corre en el puerto **5192**: `npx vite --host 127.0.0.1 --port 5192 --strictPort`.
- `.git` es de solo lectura: no hacer commits; el revisor commitea después de revisar. Tampoco tocar `docs/referencias/` (solo leerlo).
- Antes de tocar HTML, CSS o JS, leer `C:/Users/mpaul/.agents/skills/modern-web-guidance/SKILL.md` y consultar las guías de diálogos, pestañas, formularios y movimiento reducido. Verificar el soporte Baseline de lo que se use.
- Textos de UI, código y comentarios en inglés. Sin emojis.

## 1. Por qué este encargo es distinto

Dos versiones de UI anteriores de Codex fueron rechazadas (`docs/restricciones-visuales.md`). Después, el HUD, la pausa y el diálogo se rehicieron dentro de un **kit atómico** que María Paula **aprobó**. Esta pantalla **no se diseña**: se **compone** con ese kit. Si algo parece necesitar un estilo nuevo, primero hay que buscar el átomo que ya lo resuelve.

Hay que leer antes de escribir código:

| Archivo | Para qué |
|---|---|
| `src/ui/foundation/tokens.css` | Única fuente de colores, tipografías, tamaños, márgenes y objetivo táctil (`--ui-hud-*`) |
| `src/ui/atoms/hud-atoms.ts` y `.css` | `createHudFrame`, `createHudTab`, `createHudMeter`, `createHudGlyph`, `HUD_GLYPHS`, `voiceText` |
| `src/ui/organisms/pause-menu.ts` y `.css` | **El modelo a seguir**: `<dialog>` nativo, losa diagonal, ítems grandes, columna derecha con tarjeta |
| `src/ui/organisms/crew-dialogue.ts` y `.css` | `createHudReply` (botón con chaflán, hover solo con contorno y foco relleno) |
| `src/scenes/hud-preview.ts` | Cómo se monta todo sobre el comedor; `?pause=1` y `?dialogue=` |
| `src/navigation/joystick.ts`, `mode-controller.ts` | El joystick virtual, para el ajuste de lado |
| `CREDITS.md` | Contenido de la sección Créditos (la licencia CC-BY de Quaternius **exige** mostrar la atribución) |
| `tools/capture-hud.mjs`, `tools/capture-dialogue-matrix.mjs` | Cómo se mide en el navegador real |
| `docs/DISENO-JUEGO.md`: tabla R1 a R10 y dificultades | Reglas para niños de 7 a 10 años. Dificultades fácil, media, difícil y hardcore |
| Capturas aprobadas `docs/capturas/ui-v3-pause-canteen.png`, `ui-v3-pause-mobile.png` | Cómo debe verse |

## 2. Qué incluye la pantalla

La pantalla se abre desde el ítem **Settings** del menú de pausa. Incluye todo lo que el juego necesita, pero respeta **R6, de 2 o 3 opciones por pantalla**: está dividida en **tres pestañas con un máximo de tres filas cada una**. Así el niño nunca ve más de tres decisiones a la vez.

### Pestaña 1: Sound (glifo `sound`)

| Fila | Glifo | Control | Efecto |
|---|---|---|---|
| Music | `music` | volumen de 0 a 4 | Se guarda. Todavía no hay motor de audio: se expone en el estado |
| Voices | `voice` | volumen de 0 a 4 | Se guarda. Al cambiarlo se llama `onPreview("voice")` para reproducir una línea de prueba (R1: la voz es lo que más usan) |
| Sounds | `sound` | volumen de 0 a 4 | Se guarda |

Control de volumen: botón menos, medidor de 5 celdas con `createHudMeter` (nivel / 4) y botón más. En el nivel 0 el medidor queda vacío y la etiqueta dice "Off", con su línea de voz. **Sin sliders**: arrastrar exige una motricidad fina que a los 7 años es desigual.

### Pestaña 2: Play (glifo `play`)

| Fila | Glifo | Control | Efecto |
|---|---|---|---|
| Challenge | `objective` | elección entre **Easy / Medium / Hard** | Se guarda como `difficulty`. Cada opción lleva una línea de voz que explica qué cambia ("Easy: no clock, no numbers"; "Medium: numbers appear"; "Hard: the clock runs"), según `DISENO-JUEGO.md` |
| Big text | `text` | elección **Off / On** | **Tiene que funcionar ahora**: con On, una clase en la raíz escala los tokens `--ui-hud-text-*` a 1.25 y todo el HUD, el diálogo, la pausa y los ajustes crecen sin romper el layout. Se verifica en el navegador |
| Joystick side | `tap` | elección **Left / Right** | **Tiene que funcionar ahora** en el joystick de `src/navigation/joystick.ts` si ya está montado en `hud-preview`. Si no lo está, se guarda y se anota en NO VERIFICADO |

Control de elección: un grupo de 2 o 3 botones con el estilo de `createHudReply`, en el que la opción elegida va rellena (`aria-pressed="true"`), igual que el foco del diálogo. No se usan `<select>` ni radios con el estilo nativo.

### Pestaña 3: Grown-ups (glifo `shield`)

Esta pestaña está detrás de una **puerta para adultos**: un botón "Hold for 3 seconds" con un anillo que se llena (`createHudRing`). Un niño de 7 años no lo activa por accidente y un adulto lo entiende sin leer mucho. Al soltar antes de tiempo, el anillo se vacía. Con movimiento reducido se muestra el progreso sin animación.

| Fila | Glifo | Control | Efecto |
|---|---|---|---|
| Hardcore mode | `battery` | elección **Off / On** | Se guarda. Es la cuarta dificultad, para 11 y 12 años (`DISENO-JUEGO.md`); está aquí para que un niño no la elija sin querer |
| Reset progress | `home` | botón que pide confirmación en un segundo paso, con dos opciones: "Keep my game" (con el foco por defecto) y "Erase everything" | Llama `onResetProgress()`. Borra solo claves de progreso; **nunca** los ajustes |
| Credits | `iris` | botón que abre un panel con desplazamiento | Lista lo que dice `CREDITS.md` desde un módulo de datos `src/ui/content/credits.ts`. Un test compara que cada autor y licencia de `CREDITS.md` aparece |

### Comunes a toda la pantalla

- **Back**, con glifo `back`, al pie. Back y Esc cierran Ajustes y **vuelven a la pausa con el foco en el ítem Settings**. Dentro de Créditos o de la confirmación, Esc vuelve primero a la pestaña.
- **Pestañas** con `role="tablist"`, `role="tab"`, `aria-selected` y `role="tabpanel"`; las flechas izquierda y derecha cambian de pestaña. Cada pestaña tiene glifo y texto. La activa se marca con la barra de acento, sin un color nuevo.
- **Columna derecha**, igual que en la pausa: palabra grande "SETTINGS", en el lugar de "PAUSED", y una tarjeta `createHudFrame` con pestaña que dice "Changes save by themselves", con su voz. En el celular esa tarjeta se oculta, como la de misión de la pausa.
- **Movimiento reducido**: no es un ajuste propio. Se sigue `prefers-reduced-motion` del sistema, como ya hace el kit. Se anota en el informe.
- Todo texto lleva `data-voice-line` (R1). Una línea tiene como máximo unas 12 palabras.

Glifos nuevos permitidos: `music`, `voice`, `sound`, `text`, `minus`, `plus` y `back`. Se agregan a `HUD_GLYPHS` con el mismo trazo que los existentes (viewBox, `stroke`, sin relleno). No se crean otros.

## 3. Arquitectura (contenedor separado de presentación)

- `src/ui/state/settings.ts`, con lógica pura y sin DOM:
  - `SettingsState { music: Level; voice: Level; sound: Level; difficulty: "easy" | "medium" | "hard"; hardcore: boolean; bigText: boolean; joystickSide: "left" | "right" }`, con `Level` de 0 a 4;
  - `DEFAULT_SETTINGS`: music 3, voice 4, sound 3, easy, sin hardcore, sin texto grande, joystick a la izquierda;
  - `effectiveDifficulty(state)`: devuelve `"hardcore"` cuando `hardcore` está activo;
  - `stepSetting(state, key, delta)`, que limita el volumen entre 0 y 4, y `setSetting(state, key, value)`, que valida; ambos devuelven un objeto nuevo;
  - `loadSettings(storage)` y `saveSettings(storage, state)`, con un `Storage` inyectado y la clave `colonia.settings.v1`. `loadSettings` tolera JSON roto, claves faltantes y valores fuera de rango: completa con los valores por defecto y nunca lanza errores. Las claves de progreso usan otro prefijo (`colonia.progress.`), así que `resetProgress(storage)` las borra sin tocar los ajustes.
- Moléculas presentacionales, cada una con su `.ts` y su `.css` en `src/ui/molecules/`, registradas:
  - `hud-stepper` (`UI-MOLECULE-HUD-STEPPER`): glifo, etiqueta, menos, medidor, más y `setLevel()`.
    - Los botones llevan `aria-label` ("Music quieter", "Music louder").
    - El botón menos se deshabilita en 0 y el más en 4.
    - El medidor lleva `role="meter"` con `aria-valuemin="0"`, `aria-valuemax="4"` y `aria-valuenow`.
  - `hud-choice` (`UI-MOLECULE-HUD-CHOICE`): glifo, etiqueta, de 2 a 3 opciones con `aria-pressed`, y `setValue()`.
  - `hud-hold-gate` (`UI-MOLECULE-HUD-HOLD-GATE`): botón de mantener presionado con un anillo. Funciona con puntero, táctil y teclado (mantener Espacio o Enter). Al completarse llama `onUnlock`.
- `src/ui/organisms/settings-menu.ts` y `.css` (`UI-ORGANISM-SETTINGS-MENU`):
  - `createSettingsMenu(state, { onChange, onPreview, onResetProgress, onBack })` devuelve `{ dialog, open(tab?), close(), setState() }`.
  - Es un `<dialog>` nativo con la misma losa y la misma transición de entrada y salida que la pausa (`@starting-style`, `allow-discrete`, `prefers-reduced-motion`).
  - **Se reutilizan las clases y la estructura de la pausa** donde sirvan. Si hace falta compartir estilos, se extraen a una clase común en lugar de duplicar CSS.
- `src/ui/index.ts`: registrar y exportar todo.
- `src/scenes/hud-preview.ts` actúa como **contenedor**:
  - carga el estado con `loadSettings(localStorage)`;
  - guarda en cada cambio;
  - aplica Big text y el lado del joystick;
  - abre Ajustes desde el ítem Settings de la pausa;
  - agrega `?settings=sound|play|grownups` para abrir directo en una pestaña.
- `pause-menu.ts` solo se modifica lo necesario para avisar que se eligió Settings sin cerrarse. Ya tiene `onChoose`: la pausa queda debajo y Ajustes se abre encima, en el top layer.

## 4. Reglas duras (cada una es motivo de rechazo)

1. Ningún valor de color, fuente o tamaño de texto escrito a mano en CSS: solo `var(--ui-hud-*)`. Las medidas de layout (gaps, paddings) pueden ser literales, como en la pausa.
2. Ningún componente nuevo si existe un átomo o molécula que sirve.
3. Ningún color nuevo, ningún gradiente decorativo, ninguna sombra fuera de las que ya usa el kit.
4. Objetivos táctiles de **al menos 64 px** en escritorio y **al menos 48 px** en celular (`max-height: 460px`), también con Big text activo.
5. Nada se corta ni se sale de la pantalla a 1280x720 ni a 812x375, con y sin Big text.
6. No se modifica el aspecto del HUD, de la pausa ni del diálogo, que están aprobados. Big text solo los escala.
7. Como máximo tres filas por pestaña y tres pestañas.

## 5. Verificación (obligatoria antes de entregar)

- **Tests unitarios** en un archivo nuevo `tests/unit/ui-settings.test.ts`. El shim del DOM no tiene `classList.toggle`, `getPropertyValue`, selectores compuestos ni `requestAnimationFrame`; usar `add` y `remove`, recorrer el árbol y proteger el uso de rAF. Deben cubrir:
  - `stepSetting` limita los valores en 0 y en 4, y `setSetting` rechaza valores inválidos;
  - `loadSettings` devuelve los valores por defecto con JSON roto, con claves faltantes y con valores fuera de rango;
  - ida y vuelta de guardar y cargar;
  - `resetProgress` no borra los ajustes;
  - `effectiveDifficulty`;
  - el stepper deshabilita sus extremos y actualiza `aria-valuenow`;
  - la elección actualiza `aria-pressed`;
  - la puerta no se desbloquea si se suelta antes de tiempo (con temporizador falso);
  - cada pestaña tiene como máximo tres filas;
  - todo texto visible tiene `data-voice-line`;
  - los créditos cubren `CREDITS.md`;
  - el registro contiene los cuatro IDs nuevos.
- **Navegador real**: un script nuevo `tools/capture-settings.mjs`, con el mismo estilo que `capture-hud.mjs` (Chromium con ventana visible, `--use-angle=d3d11`). A 1280x720 y a 812x375, y **en cada pestaña**, debe:
  - abrir la pausa, hacer clic en Settings y esperar a que terminen las transiciones;
  - medir que todos los botones cumplen el objetivo táctil;
  - medir que ningún texto queda cortado (`scrollWidth > clientWidth` o `scrollHeight > clientHeight` cuenta como fallo, salvo en el panel de Créditos, que tiene desplazamiento);
  - medir que todo el diálogo está dentro de la ventana;
  - comprobar que "Music louder" sube `aria-valuenow` y que el valor sobrevive a recargar la página;
  - comprobar que las flechas cambian de pestaña;
  - comprobar que la puerta de adultos se abre al mantener 3 s y no se abre al hacer un clic;
  - comprobar que "Reset progress" pide confirmación con el foco en "Keep my game";
  - activar Big text y **repetir las mediciones de tamaño y recorte en el HUD, el diálogo (`?dialogue=long`), la pausa y los ajustes**;
  - comprobar que Esc vuelve a la pausa con el foco en Settings;
  - comprobar que no hay errores de consola;
  - guardar `docs/capturas/ui-v3-settings-{sound,play,grownups}-{desktop,mobile}.png` y `ui-v3-bigtext-{hud,dialogue}-{desktop,mobile}.png`, e imprimir PASS o FAIL por chequeo.
- Correr y pegar la salida de `npm run build`, `npx tsc --noEmit`, `npx vitest run`, `npm run validate:pieces`, `node tools/capture-hud.mjs` (no puede romperse lo aprobado), `node tools/capture-dialogue-matrix.mjs` y `node tools/capture-settings.mjs`.

## 6. Entrega

- Informe en `docs/capturas/codex-ui-ajustes-informe.md` con tres secciones: **VERIFICADO** (comando y salida), **NO VERIFICADO** (por ejemplo, los volúmenes sin motor de audio y el joystick si no está montado) y **Decisiones** (qué átomo se reutilizó para cada parte y por qué).
- **Pausar al terminar esta pantalla.** No avanzar al menú principal ni a las pantallas dentro del mundo: primero la revisa el revisor y después María Paula.
