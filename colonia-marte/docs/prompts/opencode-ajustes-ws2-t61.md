# Encargo para OpenCode (gpt-6.2-sol, high): ajustes menores de WS2 y T6.1

## 0. Dónde y cómo trabajás

- Carpeta: `C:\Users\mpaul\Documents\colonia-marte-visual`, rama `ws2-env-crew`.
- **No ejecutes comandos de git que escriban** (commit, add, checkout, reset, stash, merge, push). El revisor hace los commits.
- No toques `C:\Users\mpaul\Documents\colonia-marte-visual-carbon` (allí trabaja otro agente).
- No borres ni modifiques `docs/referencias/`.
- Servidor de desarrollo: ya corre en el puerto 5190 (no lo arranques de nuevo).
- Sin emojis en código, comentarios ni documentos. Código y comentarios en inglés.

## 1. Leé primero

1. `docs/capturas/correcciones-2-revision.md` (pendientes P1 y P3)
2. `docs/restricciones-visuales.md`
3. `docs/DECISIONES.md` (DV-06 fija el suelo de Jezero; no lo cambies)
4. `src/environment/terrain.ts`, `src/environment/review.ts`
5. `tools/blender/mesh_builder.py`, `tools/blender/build_base.py`, `tools/blender/run.ps1`

## 2. Tareas

### P1. Hielo polar (gate WS2, corrección menor)

- Hoy el hielo se lee como arena beige porque la luz cálida del cielo lo tiñe. Referencia: `docs/referencias/v3/v3-t034.80.jpg`: hielo **blanco frío** (tono azulado muy leve), arena rojiza entre manchas.
- Corregí el tono para que el hielo se lea blanco frío bajo la iluminación del bioma polar (ajustá color base del hielo y/o la iluminación del preset polar; no cambies Jezero ni la noche).
- Los bordes de las manchas salen **escalonados** por la resolución de la máscara. Deben ser curvas limpias de borde duro (sin degradado ancho). Opciones válidas: máscara de mayor resolución con muestreo bilineal y umbral, o una función analítica evaluada por vértice/fragmento.
- Mantené la cobertura actual (hielo dominante).

### P3. Personaje base (gate T6.1, ajuste menor)

- Botas **oscuras** (gris carbón de la paleta), no blancas.
- Torso: estrechar levemente la cintura (silueta en V suave), sin perder el estilo low-poly facetado.
- Piernas: acortar un poco respecto del torso (proporción más compacta, estilo A).
- Regenerá el GLB y la hoja de referencia con el pipeline existente (`tools/blender/run.ps1`; Blender 5.3 headless).

## 3. Criterios de aceptación (se verifican)

- `npm run build`, `npx tsc --noEmit`, `npx vitest run` y `npm run validate:pieces` en salida 0.
- Capturas nuevas en `docs/capturas/`: `c3-polo-cerca.jpg`, `c3-polo-lejos.jpg` (desde `/environment` con el bioma polar) y `c3-personaje-reference-sheet.png`.
- En las capturas del polo el hielo se ve blanco frío y los bordes no muestran escalones.
- Jezero y noche sin cambios visibles (incluí `c3-jezero.jpg` para comparar).

## 4. Informe

Escribí `docs/capturas/correcciones-3-informe.md` con: archivos cambiados, comandos ejecutados con su salida resumida, capturas generadas, y una sección **NO VERIFICADO** con lo que no pudiste comprobar.
