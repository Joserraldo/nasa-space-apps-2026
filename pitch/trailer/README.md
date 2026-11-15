# Trailer de Solar Shield (59 s, 1920×1080, 30 fps)

Versión corta del video oficial de 2 min ([`../guion-video.md`](../guion-video.md)). Dos cortes: **inglés** (idioma base) y **español**. Hecho con [HyperFrames](https://hyperframes.heygen.com) (HTML renderizado a video, determinista y cuadro a cuadro).

Dueño: `infra`. Los videos renderizados (`out/*.mp4`) y los medios generados (`assets/`) **no** se suben al repo: se regeneran con los scripts de abajo.

## Estructura

| Tiempo | Escena | Archivo | Qué se ve |
|---|---|---|---|
| 0:00–0:15 | Intro **cinemática 3D** | `compositions/intro.html` | La base en Marte al amanecer, el astronauta e Iris. Llega la tormenta, las partículas golpean, se enciende el escudo y la pantalla de Iris falla. Etiqueta fija **"Cinematic" / "Cinemática"**. |
| 0:15–0:49 | **Juego real** | `compositions/juego.html` | Capturas del juego de verdad (`ui/`) siguiendo la ruta dorada: satélite, aterrizaje, módulos, tormenta del 20 may 2024 con su tarjeta de fuente DONKI, expertos que se contradicen, Iris dañada y la Ingeniera que verifica el medidor. Etiqueta **"Real gameplay" / "Juego real"**. |
| 0:49–0:59 | Cierre | `compositions/cierre.html` | Nombre, frase del pitch (PLAN.md §1) y atribución: "Data: NASA DONKI (CCMC) · NASA OSDR RadLab (Curiosity RAD) · NASA Mars Trek" y "Unofficial project, not endorsed by NASA". Sin logo de NASA. |

`index.html` es la raíz (inglés). La versión en español la genera `render.mjs` en `out/proyecto-es/`: copia el proyecto y solo cambia `<html lang>`, la etiqueta "Cinemática" y las pistas de voz. Las escenas leen el idioma de `<html lang>`.

## Guion (locución, narrador adulto)

El texto vive en [`guion.json`](guion.json) (lo lee `voces.mjs`). Una línea por escena:

| Id | Inglés | Español |
|---|---|---|
| intro | Imagine you run a base on Mars. A real solar storm is coming. And the computer that helps you is about to get confused. | Imagina que diriges una base en Marte. Viene una tormenta solar real. Y la computadora que te ayuda está a punto de confundirse. |
| juego1 | In Solar Shield, kids launch a satellite, choose where to land and build a base. Every choice has a cost. | En Solar Shield, los niños lanzan un satélite, eligen dónde aterrizar y arman su base. Todo tiene un costo. |
| juego2 | Then a real storm arrives: May twentieth, twenty twenty-four, from NASA's DONKI records. Curated real data, not live. | Luego llega una tormenta real: el 20 de mayo de 2024, del registro DONKI de la NASA. Datos reales curados, no en vivo. |
| juego3 | The crew are experts, and they disagree. The Doctor says take shelter. The Engineer says power the shield. | Los expertos no se ponen de acuerdo. La Doctora dice refugio. La Ingeniera, energía al escudo. |
| juego4 | And radiation scrambles Iris. She says everything is perfect. It isn't. So kids check the meter, and decide. | Y la radiación confunde a Iris. Dice que todo está perfecto. No lo está. El niño revisa el medidor y decide. |
| cierre | Solar Shield. Learn who to trust when technology fails. | Solar Shield. Aprende en quién confiar cuando la tecnología falla. |

Revisado contra las reglas de `guion-video.md`: el evento es "datos reales curados, no en vivo"; no se muestra un destello como causa del evento (la intro es una cinemática simulada y lo dice); sin Kp ni microgravedad en Marte; sin logo de NASA; personajes originales.

## Cómo regenerar todo

Desde la raíz del repo, con `npm ci` hecho. Necesitas `ffmpeg` y `ffprobe` en el PATH (o en `$FFMPEG` / `$FFPROBE`).

1. Capturas del juego real (con la ui corriendo, p. ej. `npm --prefix ui run dev -- --port 5180`):

   ```bash
   node pitch/trailer/capturar.mjs http://127.0.0.1:5180
   ```

2. Voces (edge-tts por defecto; `EDGE_TTS` apunta al binario si no está en el PATH):

   ```bash
   node pitch/trailer/voces.mjs
   ```

   Si cambian las duraciones, ajusta los `data-start` de las `<audio id="vo-*">` en `index.html` (las duraciones quedan en `assets/voces/duraciones.json`).

3. Música y efectos (síntesis de ffmpeg):

   ```bash
   node pitch/trailer/musica.mjs
   ```

4. Render (inglés y español; `--calidad draft` para iterar):

   ```bash
   node pitch/trailer/render.mjs en,es
   ```

Para editar a mano: `cd pitch/trailer && npx hyperframes preview` (abre el Studio de HyperFrames) y `npx hyperframes check`.

## Voces

- **Proveedor por defecto: edge-tts** (voces neurales de Microsoft, sin clave): `en-US-AndrewNeural` (inglés) y `es-CO-GonzaloNeural` (español). Son voces sintéticas de adulto. **No se graba ni se usa voz de niños.**
- **ElevenLabs (opcional):** `node pitch/trailer/voces.mjs --proveedor elevenlabs`. La clave se lee solo de `ELEVENLABS_API_KEY` (entorno o `.env` de la raíz, que está en `.gitignore`); nunca se imprime ni se escribe. **Estado:** el `.env` de la raíz no tiene esa clave hoy, así que este proveedor no se ha probado y las pistas actuales son de edge-tts. Si se usa: solo con la cuenta de José y dentro de los créditos gratis. El plan gratuito de ElevenLabs exige atribución: agregar "Voice: ElevenLabs (elevenlabs.io)" en los créditos del video y en este README, y confirmar las condiciones vigentes en su página antes de publicar. El id de voz está en `guion.json` (`voces.elevenlabs`).
- edge-tts necesita una versión reciente (la 7.x funciona; versiones viejas reciben 403 del servicio).

## Música y efectos

Toda la música y los efectos se **generan** con síntesis de ffmpeg en [`musica.mjs`](musica.mjs) (osciladores y ruido, sin samples): un pad en La menor con pulso grave, viento de la tormenta, golpe del escudo, pitidos de falla de Iris y un clic de interfaz. No hay material de terceros, así que no requiere licencia ni atribución.

## Fuentes y créditos

- Datos que aparecen en pantalla: NASA CCMC **DONKI** (evento `2024-05-20T05:36:00-CME-001`), **NASA OSDR RadLab** (Curiosity RAD) y **NASA Mars Trek**, tal como los muestra el juego en sus tarjetas de fuente. Datos curados, no en vivo.
- 3D: [Three.js](https://threejs.org) r160 (MIT) y [GSAP](https://gsap.com) 3.15, cargados por CDN (jsDelivr) en el render. Modelos hechos con código a partir del prototipo de FASE 0 (`docs/referencias/3d/`, commit 745427c, retirado el 14 nov por D6; la dirección visual vigente está en `docs/referenciapau/`); las partículas de la tormenta son simuladas.
- Tipografías: Outfit y Nunito (incluidas en HyperFrames, SIL OFL).
- Proyecto no oficial, no avalado por NASA. Sin logo de NASA.

## Decisiones

- **El 3D no se hace pasar por el juego.** La intro lleva la etiqueta "Cinematic" todo el tiempo y el juego, "Real gameplay". El juego es 2D (decisión D3).
- **Capturas fijas con acercamiento** en lugar de grabación en tiempo real: son nítidas a 1080p y deterministas. `capturar.mjs` sigue los mismos pasos que `tests/e2e/ruta-dorada.spec.ts` (semilla dorada, reloj simulado) y toma cada pantalla en inglés y en español.
- **Una sola raíz** (`index.html`): HyperFrames no admite dos raíces en un proyecto, así que el español se genera en una copia al renderizar.
- **Contorno cartoon** con la técnica de casco invertido (cada malla se duplica con caras traseras engrosadas) y **bloom suave** (`UnrealBloomPass`, umbral alto) para acercarse al render de referencia.
- **Determinismo:** cada cuadro de la intro es función del tiempo de la escena; las partículas tienen trayectorias analíticas precalculadas (choque rayo-esfera con el escudo) y todo azar usa semilla fija.

## Pendiente / observado

- En las tarjetas de fuente del juego aparece texto en español dentro de la versión en inglés ("radiación en Marte: RAD de MSL Curiosity (NASA) vía OSDR RadLab"). Es del juego, no del trailer; se ve en las capturas.
- En la ruta dorada actual la partida termina en "The base could not hold"; el trailer no muestra el final para no confundir.
