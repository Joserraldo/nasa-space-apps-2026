# Colonia en Marte: entrega para integración (Santiago)

Capa visual del juego: colonia en Three.js low poly sci-fi, salas interiores, tripulación, Iris y la UI infantil (HUD, pausa, diálogo, ajustes). Este documento explica qué hay, cómo correrlo y dónde se conectan la historia, la intro, el audio y las mecánicas, que son la parte de Santiago.

## 1. Correrlo

Se necesita Node 22 o más. Este proyecto es una app Vite **independiente**, con su propio `package.json`: no forma parte de los workspaces del monorepo.

```bash
cd colonia-marte
npm install
npm run dev          # http://127.0.0.1:5190
npm run build        # vite build
npx tsc --noEmit     # tipos
npx vitest run       # 153 tests
npm run validate:pieces
```

Versiones fijadas: `three` 0.187.0, `vite` 8.3.8, `typescript` 7.0.2.

## 2. Rutas para revisar

| Ruta | Qué muestra |
|---|---|
| `/hud-preview` | **Juego de muestra**: comedor con el HUD completo. Tocar el dispensador abre el diálogo y el botón de pausa abre la pausa y los ajustes. Parámetros: `?pause=1`, `?dialogue=short\|medium\|long\|labels\|sentence`, `?settings=sound\|play\|grownups` |
| `/exterior-pilot` | Colonia exterior en Jezero (`?view=1` panorámica, `?view=2` a la altura de los ojos) |
| `/room/canteen`, `/room/nw-01` ... `/room/nw-16` | Salas interiores armadas desde un layout JSON |
| `/crew` | Tripulación: Tess, Nia, Vera, Teo y el traje EVA |
| `/environment` | Terreno, cielo y ambientes `AMB-01` a `AMB-08` |
| `/catalog`, `/materials`, `/ui` | Catálogo de piezas, materiales y kit de UI |

## 3. Estructura

| Carpeta | Contenido |
|---|---|
| `src/kit/` | Registro de piezas por ID (`docs/INVENTARIO.md`), primitivas y piezas de arquitectura, mobiliario, exterior, tripulación e Iris |
| `src/catalog/layout.ts` + `data/layouts/rooms/*.json` | Salas definidas como datos (celdas, piezas, puertas y vistas de cámara) |
| `src/environment/`, `data/environments.json` | Terreno, biomas y presets de ambiente |
| `src/camera/` + `data/shots/` | **Reproductor de tomas** (Catmull-Rom, easing, cortes y fundidos). Es la base para la intro |
| `src/navigation/` | Modos de cámara, caminar con teclado y joystick virtual |
| `src/ui/` | Kit atómico de UI: `atoms/`, `molecules/` y `organisms/`, con `UIRegistry` |
| `src/ui/state/settings.ts` | Estado de ajustes puro, con persistencia en `localStorage` (`colonia.settings.v1`) |
| `public/models/characters/` | GLB de la tripulación (Quaternius, ver `CREDITS.md`) |
| `docs/` | Plan, diseño de juego, inventario, decisiones y restricciones visuales aprobadas o rechazadas |

## 4. Dónde se conecta lo de Santiago

| Tema | Punto de conexión que ya existe | Qué falta |
|---|---|---|
| **Intro y primer momento** | `src/camera/player.ts` reproduce una secuencia JSON de tomas (`data/shots/ws0-demo.json` es el ejemplo; esquema en `src/camera/schema.ts`). Las salas de la nave (NW-15 puente, NW-16 sala común) son el escenario de la intro (`docs/DISENO-JUEGO.md` §3.3) | El guion de las 7 tomas y `data/shots/intro.json` (T7.7), con la música y los efectos sincronizados |
| **Historia y capítulos** | `docs/DISENO-JUEGO.md` §4: la campaña C1 a C5 más el Final. El diálogo de la tripulación recibe `CrewDialogueState` (`src/ui/organisms/crew-dialogue.ts`): hablante, línea, `voiceLine` y de 1 a 3 respuestas con ícono. El texto largo se pagina solo | Los guiones por capítulo y el árbol de decisiones. La tarjeta de capítulo y el menú principal están en curso (Codex, fase 1) |
| **Música y efectos** | `SettingsState.music`, `.voice` y `.sound` (de 0 a 4) ya se guardan; `onPreview("voice")` se dispara al cambiar el volumen de las voces. Todo texto de la UI lleva `data-voice-line` con su línea de voz (regla R1) | **No hay motor de audio.** Hay que conectar un mezclador que lea esos tres volúmenes y reproduzca `data-voice-line` |
| **Mecánicas** | El HUD recibe su estado desde afuera (`createGameHud(state, onUse, onPause)`): energía, aire y escudo como medidores, objetivo y paso, zona y mapa. `effectiveDifficulty(settings)` devuelve easy, medium, hard o hardcore | La simulación (energía, comida, radiación, retraso de comunicaciones) y la lógica de cada capítulo |
| **Dificultad** | `settings.difficulty` más `settings.hardcore`. Regla del diseño: sin números en Easy (R2) | Aplicarla en la simulación |

Reglas para niños de 7 a 10 años que la UI ya respeta (`docs/DISENO-JUEGO.md` R1 a R10):

- todo texto tiene voz;
- 2 o 3 opciones por pantalla;
- íconos antes que texto;
- botones de al menos 64 px (48 en celular);
- en Easy no hay números.

## 5. Estado

**Verificado** en esta rama: build, tipos, 153/153 tests y validate:pieces en salida 0. Además se abrieron en Chromium, con ventana visible y sin errores de consola, `/exterior-pilot`, `/room/nw-14`, `/room/nw-15`, `/hud-preview`, `/hud-preview?settings=play` y `/crew`.

**Sigue en curso, en otras ramas que se vuelven a entregar:**

- Carbon: correcciones de NW-14 y del suelo; salas NW-16, NW-17, NW-12, NW-09, NW-08 y NX-04.
- Codex: corrección de la selección en Ajustes, menú principal, carga, tarjeta de capítulo; después, mapa de la colonia, avisos, glosario, pantalla final y chat opcional.

**No verificado / pendiente:**

- audio (no hay motor);
- animaciones del traje EVA;
- jugador personalizable CH-10;
- escena completa por capítulo y transición exterior-interior por la esclusa (WS8);
- rendimiento en un celular físico.

**Defecto conocido:** en Ajustes, sobre la losa clara, la opción elegida se lee al revés (clara contra negra). La corrección está encargada.

## 6. Créditos y licencias

Ver `CREDITS.md`. El paquete de mujeres de Quaternius es **CC-BY**: la atribución tiene que aparecer en el juego, y ya está en Ajustes, en Grown-ups, en Credits. Los demás paquetes usados son CC0. Las fuentes Chakra Petch y Exo 2 son OFL.

Las imágenes de referencia de los videos (`docs/referencias/`) **no se incluyen** en esta entrega pública. Las capturas de `docs/capturas/` que comparan con esas referencias tampoco.
