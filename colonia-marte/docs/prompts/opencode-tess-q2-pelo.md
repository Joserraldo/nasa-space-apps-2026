# Encargo para OpenCode: Tess Q2, solo el pelo

## Contexto

María Paula rechazó la Tess de Q1 (ver la última línea de `docs/restricciones-visuales.md`). Ahora se trabaja **por partes, una a la vez, con su visto bueno en cada una**. Esta ronda es **solo el pelo**. No toques cara, cuerpo, ropa, botas, rig ni animaciones.

## Reglas

- Rama `ws2-env-crew`, sin escribir en git, sin aprobaciones intermedias, sin tocar UI, `docs/referencias/` ni otros worktrees.
- Partí de `docs/capturas/q1-tess.blend` y `tools/blender/build_tess_q1.py`.

## Qué tiene que tener el pelo (medilo en la referencia)

Referencias: `docs/referencias/v1/v1-t018.50.jpg` (principal; recortá la cabeza y ampliala) y `v1-t045.20.jpg` (otra tripulante con el mismo tipo de peinado de masas).

1. **Mechón diagonal grande**: una masa ancha que nace en la raya de un costado, cruza la frente en diagonal tapando buena parte de ella y cae por delante de una oreja hasta la altura del mentón. Es el rasgo que más identifica a Tess.
2. **Volumen**: el pelo se separa claramente del cráneo (no es un casquete pegado); la silueta de la cabeza con pelo es bastante más ancha que la cara, como en la referencia.
3. **Rodete grande** alto y atrás, del tamaño que muestra la referencia (medí su diámetro relativo al ancho de la cara), con una banda de unión.
4. **Masas grandes y pocas facetas**: 5 a 8 masas facetadas con planos amplios, sin facetas chicas ni ruido. Color castaño rojizo de la referencia (agregalo a `palette.json` si no existe), con sombreado plano.
5. Pesado al hueso de la cabeza; que no atraviese la cara ni el cuello en la animación de marcha.

## Entregable (una sola lámina)

`docs/capturas/q2-tess-pelo.png`: la cabeza de la referencia ampliada a la izquierda, y el modelo a la misma escala de cara en **frente, tres cuartos (mismo ángulo que la referencia), perfil y espalda**. Anotá en la lámina el ancho de la silueta con pelo y el diámetro del rodete, cada uno dividido por el ancho de la cara, en la referencia y en el modelo.

Además: actualizá `public/models/characters/tess.glb`, corré build, tsc, vitest y validate:pieces (salida 0) y escribí un informe corto `docs/capturas/q2-tess-informe.md` con **NO VERIFICADO**. Después parás.
