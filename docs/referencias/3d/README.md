# Referencias 3D: modelos hechos solo con código

> **Esto es una referencia visual y técnica, no código del juego.** Se hizo en FASE 0 para responder una pregunta: ¿podemos tener 3D en Solar Shield sin descargar modelos (GLB)? No cambia la decisión [D3](../../decisiones/D3-motor.md) (React + PixiJS 2D). Si el equipo quiere 3D, se propone como decisión nueva en `docs/decisiones/` y el código se escribe en `ui/` cuando arranque la FASE 1.

## Cómo verlos

Doble clic en el archivo `.html` o ábrelo en Chrome. No necesitan instalar nada ni un servidor. Three.js se carga desde un CDN, así que hace falta internet.

| Archivo | Qué muestra | Controles |
|---|---|---|
| [`base-marte-jugable.html`](base-marte-jugable.html) | Prueba jugable: un astronauta camina por una base en Marte (hábitat, paneles solares, invernadero) con el robot guía **Iris**. Mini misión: limpiar paneles (energía 70 → 85), regar el invernadero (soporte vital 80 → 96) y "base lista". HUD con Power / Life Support / Shielding y selector EN/ES. | WASD o flechas para moverse, **E** para interactuar, **P** para pausar. En celular: arrastrar sobre la escena funciona como joystick. |
| [`observatorio-tormenta.html`](observatorio-tormenta.html) | Observatorio inspirado en el Chandra de NASA (estilizado, no es el modelo oficial), Marte y el Sol hechos con shaders, escudo con efecto Fresnel y tormenta solar de partículas que el escudo desvía. Incluye una tabla que compara código procedural, GLB de NASA y GLB propio. | Arrastrar para girar, rueda para hacer zoom, botones de escudo y tormenta. |

## Qué demuestran

- **0 KB de archivos 3D.** Todo sale de geometría primitiva de Three.js (cápsulas, esferas, cajas redondeadas, toros). Las texturas (celdas solares, manta dorada, cara de Iris) se dibujan en un `<canvas>` al cargar.
- **El 3D reacciona al juego sin trabajo extra:** el polvo de los paneles desaparece, las plantas crecen, el escudo brilla al recibir impactos y la puerta del parasol se cierra en la tormenta. Con un GLB habría que buscar nodos dentro del archivo.
- **Rendimiento:** la base de Marte tiene pocos miles de triángulos, con sombras suaves. Corre fluido en un portátil normal (el contador de FPS está en el demo del observatorio).
- **Bilingüe:** inglés base y español con el botón, siguiendo la regla del producto.

## Decisiones tomadas en estos prototipos

1. **Código para el mundo, no GLB.** Las piezas de la base son formas simples y tienen que cambiar con los medidores, así que el código da un estilo uniforme y permite animarlas fácil.
2. **GLB de NASA solo como "pieza de museo" (opcional).** Por ejemplo, en una tarjeta de fuente: se carga al abrirla, se comprime con `gltf-transform optimize` y se cita a NASA, sin dar a entender que NASA respalda el juego.
3. **Personajes chibi con formas simples.** El astronauta y Iris se ven bien con cápsulas y esferas. Para retratos expresivos en los diálogos conviene ilustración 2D.
4. **Cámara fija en tercera persona** que sigue al jugador. Es más fácil para niños de 7 a 12 años que una cámara libre.

## Si se lleva al juego (FASE 1), qué falta

- Pasar los textos al sistema de i18n del proyecto (aquí están en un diccionario dentro del archivo).
- Que los medidores salgan del `GameState` del motor, no de variables locales.
- Cargar Three.js (~150 KB comprimido) solo en la escena 3D, con import dinámico.
- Mantener la semilla: los demos usan un generador propio con semilla fija, nada de `Math.random` en lo que afecte la partida.
- Opcional, para acercarse al render de referencia: contorno tipo cartoon y bloom suave.

## Créditos

- Motor 3D: [Three.js](https://threejs.org) r160 (MIT), cargado desde jsDelivr.
- El observatorio se inspira en la página [Chandra X-ray Observatory 3D](https://science.nasa.gov/3d-resources/chandra-x-ray-observatory/) de NASA. El modelo está hecho a mano; no se usó el archivo de NASA.
- Las partículas de la tormenta son simuladas, no datos reales de DONKI.
- Personajes (astronauta, Iris) originales del equipo.
