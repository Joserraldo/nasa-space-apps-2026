# Encargo para OpenCode: C5, cara, pelo y botas (base A y Tess)

María Paula aprobó el cuerpo anatómico de C4 (topología, proporciones). **No toques la topología del cuerpo, el rig ni las proporciones.** Corregí solo esto, comparando contra `docs/referencias/v1/v1-t039.90.jpg`, `v1-t045.20.jpg` y `v1-t018.50.jpg`:

1. **Cara legible.** Hoy es oscura y sin rasgos. En la referencia se leen: franja de cejas/ojos negra embutida y bien contrastada, nariz facetada en cuña, pómulos y mandíbula estrecha por planos, orejas. La piel no debe quedar en sombra: revisá normales, tono de piel y la luz de la hoja. Medí el contraste ojos/piel en la referencia y en el render.
2. **Pelo por masas, no casco.** La referencia tiene mechones facetados con volumen, separación del cráneo, flequillo y nuca definidos. Base A: masas como en `v1-t039.90` (rodete/mechones superiores). **Tess: rodete alto y pelo castaño** como en `v1-t018.50`.
3. **Botas sólidas.** Quitá el hueco bajo el talón (se lee como taco). Suela plana continua, puntera ancha, caña que abraza la pantorrilla, tobillo sin estrangular.
4. Tamaño de cabeza: se mantiene (4,6 cabezas es coherente con `v1-t018.50`).

## Reglas
- Rama `ws2-env-crew`, sin escribir en git, sin aprobaciones intermedias, sin tocar UI, `docs/referencias/` ni el worktree de Carbon. No hagas Nia, Vera ni Teo.
- Relée `docs/restricciones-visuales.md` (todas siguen vigentes).

## Entregables
- `docs/capturas/c5-base-reference-sheet.png`, `c5-tess-reference-sheet.png` (mismo formato de C4) y un **primer plano de cara** de cada uno junto a `v1-t039.90.jpg`: `c5-caras.png`.
- `c5-crew.jpg` en el navegador.
- build, tsc, vitest, validate:pieces y `validate.py` en salida 0.
- Informe `docs/capturas/correcciones-5-informe.md` con **NO VERIFICADO**.
