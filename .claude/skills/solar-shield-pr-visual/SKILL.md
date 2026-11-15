---
name: solar-shield-pr-visual
description: Preparar un PR del frontend v8 de Solar Shield que cambia algo visible (escena 3D, personajes, interfaz, mapa). Usar antes de abrir o actualizar el PR hacia feat/ui-escenarios.
---

Fuente: `docs/referenciapau/FLUJO.md` §4 (lámina de cada pieza) y §7.1 (ficha), `APLICACION.md` §8 y §10, `DISEÑO.md` §2 y §8. Si este archivo y esos documentos chocan, mandan los documentos.

## 1. Lámina canónica

1. Buscá la pieza en la tabla de `FLUJO.md` §4 y anotá su lámina. Si la pieza no tiene lámina, no se inventa: parás y preguntás a María Paula.
2. Medí la lámina:
   ```bash
   node -e "const b=require('fs').readFileSync(process.argv[1]);console.log(b.readUInt32BE(16)+'x'+b.readUInt32BE(20))" docs/referenciapau/referencias/<carpeta>/<archivo>.png
   ```

## 2. Captura con el mismo encuadre

1. `npm run dev -w ui` y esperá a que responda `http://localhost:5173/`.
2. Pantallas a las que se llega con la URL (portada):
   ```bash
   npx playwright screenshot --viewport-size "<ancho>,<alto>" --wait-for-timeout 1500 http://localhost:5173/ captura.png
   ```
3. Pantallas que necesitan jugar hasta ahí (base, diálogo, tormenta): misma ventana de `<ancho>x<alto>`, misma cámara que la lámina, y captura del navegador. No se recorta para disimular diferencias.
4. Las dos imágenes van al PR, una al lado de la otra.
5. Si el PR toca una pantalla, sumá las capturas en celular: `--viewport-size "844,390"` (horizontal) y `--viewport-size "390,844"` (vertical), y revisá la fila de esa pantalla en ESCENAS §2.7. Si toca controles táctiles, probalo además en un celular real.

## 3. Ficha de fidelidad

Copiá el bloque de `FLUJO.md` §7.1 en la descripción del PR y llenalo. Lo que no coincide se escribe; no se omite.

- **Silueta primero.** Si no coincide, no se pasa a materiales ni estados (`FLUJO.md` §6, paso 3).
- **Colores:** solo los tokens de `DISEÑO.md` §2. Un hex suelto en el diff es un error.
- **Única desviación libre:** el cielo de Marte (`MARTE.md`) en lugar del azul de `mundo/01` y `mundo/02`.
- **Prohibidos de `DISEÑO.md` §8**, incluidos los emojis y el aspecto genérico de plantilla o de IA. Si la lámina no lo muestra, no va.

## 4. Números de la escena (solo si tocaste `ui/src/escena/`)

1. Leé `renderer.info` **después** de `render()`: los contadores se reinician al empezar cada `render()`.
2. Escribí en el PR `calls`, `triangles`, `memory.geometries` y `memory.textures` de la vista. Tope: 80 draw calls y 80 000 triángulos (`APLICACION.md` §8).
3. Montá y desmontá la escena dos veces: `memory.geometries` y `memory.textures` vuelven al valor inicial. Si no vuelven, hay una fuga.

## 5. Puerta

```bash
npm run typecheck
npm test
npm run build
npm run e2e
```

Pegá la salida real. Hasta que la CI cubra `feat/ui-escenarios`, esta salida es la única prueba. Además: teclado, EN y ES, `prefers-reduced-motion` y respaldo 2D (`APLICACION.md` §10).

## 6. No decir "listo" sin evidencia

Cada afirmación del PR va con su captura, su número o su salida. Lo que no se probó se escribe como "no verificado".
