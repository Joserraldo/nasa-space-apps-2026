# D6 — Estilo visual
**Dueño:** rol 5 (ui) · **Fecha:** 2026-11-13 · **Estado:** propuesta

## Opciones
| Opción | A favor | En contra |
|---|---|---|
| Vector plano "cartoon geométrico" | Ligero (SVG), escalable, lo hacemos nosotros, pasa directo a low-poly 3D | Riesgo de verse genérico (se mitiga con la "firma" de `docs/ideas/marca.md` §1) |
| Pixel art | Barato de animar, encanto retro | Mal escalado en celular, choca con el 3D |
| Cartoon 2D ilustrado | El más bonito | Nadie ilustra; depende de IA generativa inconsistente |

## Elegida
Vector plano "cartoon geométrico": contorno de 3 px, sombras planas, paleta de 9 tokens (todos ≥ 4.5:1) y Atkinson Hyperlegible.

## Por qué
Es el único estilo que sirve a la vez para el 2D de P2 (respaldo) y el 3D low-poly de P3 sin rehacer arte. Sus assets son propios o CC0, y es legible para niños de 7 a 12 años.

## Consecuencias para cada rol
- **ui:** define tokens CSS y un set de retratos SVG reutilizable; todo asset se registra en `assets/LICENCIAS.md`.
- **diseño:** cierra nombres y frases de la tripulación (D7) con ui.
- **datos:** las imágenes reales de NASA van solo en tarjetas de fuente, citadas.
- **pitch:** el video usa la misma paleta y el logo elegido; sin logo de NASA.
