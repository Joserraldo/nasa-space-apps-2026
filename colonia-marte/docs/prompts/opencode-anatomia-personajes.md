# Encargo para OpenCode: rehacer el personaje base con anatomía y topología correctas

## Por qué

María Paula **rechazó** la base A y Tess: "no se respeta como tal la anatomía". Es la tercera ronda rechazada sobre el personaje (ver `docs/restricciones-visuales.md`). **Cambio de estrategia obligatorio:** se deja de armar el cuerpo con primitivas ensambladas por código y se parte de una malla anatómica de topología continua.

## Reglas

- Carpeta `C:\Users\mpaul\Documents\colonia-marte-visual`, rama `ws2-env-crew`. **Sin comandos de git que escriban.** No toques `docs/referencias/`, la UI ni `C:\Users\mpaul\Documents\colonia-marte-visual-carbon`.
- Leé y seguí `C:/Users/mpaul/.agents/skills/blender-reference-modeling/SKILL.md` antes de modelar.
- Sin aprobaciones intermedias. Al final, parás: **no hagas Nia, Vera ni Teo** hasta que María Paula apruebe la base.

## Guía de topología (provista por María Paula)

- `_work/ref-anatomia/source/lowpoly_male_base_mesh-TPOSE.fbx` (484 vértices, 436 quads, 68 triángulos, 4 n-gons; importa acostado: corregí el eje).
- Es la **base de flujo de aristas**: malla única y continua, quads, loops concéntricos en hombro, codo, muñeca, cadera, rodilla y tobillo, pelvis con flujo hacia las piernas, manos con dedos. Estudiala (renders de frente, perfil, wireframe) antes de modelar.
- Podés partir de ella (retopología, ajuste de proporciones) o reconstruir con el mismo flujo. Anotá en el informe cuál elegiste y la licencia/origen que figure en el archivo, si figura.

## Referencias de estilo (mandan sobre la guía)

- `docs/referencias/v1/v1-t039.90.jpg` y los demás fotogramas de personajes en `docs/referencias/` (buscá todos los que muestran tripulación). Medí proporciones **sobre las referencias** (altura en cabezas, ancho de hombros, largo de brazos y piernas, tamaño de manos y pies), no las inventes.
- Estilo A low-poly facetado, cabeza grande estilizada, franja de ojos embutida, cuello alto, insignia chevron, botas oscuras (todas las restricciones previas de `docs/restricciones-visuales.md` siguen vigentes).
- La anatomía tiene que leerse: clavículas y trapecio, deltoides, pecho, cintura, cadera, glúteos, rodillas, pantorrillas, tobillos, manos con pulgar opuesto y dedos agrupados. El traje va **sobre** el cuerpo, no reemplaza la anatomía.

## Técnica

- Malla única y manifold (salvo pelo y accesorios separados), sin n-gons en zonas de deformación, loops de soporte en articulaciones (mínimo 3 por codo y rodilla).
- Mismo esqueleto de 22 huesos (adaptá posiciones), pesos suaves; render de deformación: codo y rodilla a 90 grados, brazo arriba, sentado.
- Presupuesto: 3.000 a 6.000 triángulos por personaje.
- Pipeline existente (`tools/blender/run.ps1`, `validate.py`); regenerá `public/models/characters/base-a.glb` y Tess (`tess.glb`) sobre la nueva base.
- Corregí además: el atlas del juego no reconoce `skin_warm_umber` y asigna `warning` a la fila emisiva; agregá el tono a la paleta/adaptador para que Tess se vea bien en `/crew`.

## Entregables

- `docs/capturas/c4-guia-topologia.png` (la guía FBX: frente, perfil, wireframe).
- `docs/capturas/c4-base-reference-sheet.png`: frente, perfil, tres cuartos y **wireframe**, junto a las referencias, con las proporciones medidas anotadas.
- `docs/capturas/c4-deformacion.png` (codo, rodilla, brazo arriba, sentado).
- `docs/capturas/c4-tess-reference-sheet.png` y `docs/capturas/c4-crew.jpg` (captura de `/crew` en el navegador).
- `npm run build`, `npx tsc --noEmit`, `npx vitest run`, `npm run validate:pieces` y `validate.py` en salida 0.
- Informe `docs/capturas/correcciones-4-informe.md` con tabla de proporciones (referencia vs modelo), conteos de topología y sección **NO VERIFICADO**.
