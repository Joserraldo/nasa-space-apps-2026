# Encargo para OpenCode: Tess Q3, base de Quaternius sin alterar

## Decisión de María Paula (manda sobre todo lo anterior)

"Que use como base los modelos que ya tenemos, porque se están alterando mucho y se está volviendo peor todo."

Se acabaron las modificaciones de malla. Ver la última línea de `docs/restricciones-visuales.md`.

## Qué hacer

1. Partí del modelo **original** `_work/ref-quaternius/umw/Sci Fi Character/SciFi.fbx`, no de Q1 ni de Q2. Descartá los cambios de proporciones, cabeza, pelo, manos y botas.
2. **Prohibido editar la geometría**: nada de escalar huesos o regiones, esculpir, agregar ni quitar caras.
3. **Permitido:**
   - Recolorear los materiales con colores de `palette.json`: mono oscuro con acentos **ámbar** (Tess es la ingeniera), piel y pelo castaño rojizo.
   - Intercambiar partes enteras (cabeza, pelo, torso, piernas) con otros modelos de `_work/ref-quaternius/umw/` o `umm/`, si alguna se acerca más a la referencia `docs/referencias/v1/v1-t018.50.jpg`. Explicá en el informe qué intercambiaste y por qué.
   - Conservar los 79 huesos y las 24 animaciones tal cual.
4. Exportá `public/models/characters/tess.glb`. Si el pipeline o los tests exigen proporciones o conteos que el modelo original no cumple, ajustá **los tests**, no el modelo, y anotalo.
5. `CREDITS.md` debe seguir con la atribución CC-BY.

## Entregables

- `docs/capturas/q3-tess.png`: frente, tres cuartos, perfil y espalda junto a `v1-t018.50.jpg`, más el original de Quaternius sin recolorear para comparar.
- `docs/capturas/q3-tess-crew.jpg` desde `/crew?character=tess`.
- build, tsc, vitest y validate:pieces en salida 0.
- Informe corto `docs/capturas/q3-tess-informe.md` con **NO VERIFICADO**.
- Reglas de siempre: sin escribir en git, sin aprobaciones intermedias, sin tocar UI, `docs/referencias/` ni otros worktrees. No hagas otros personajes.
