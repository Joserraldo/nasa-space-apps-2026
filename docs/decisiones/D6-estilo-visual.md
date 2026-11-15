# D6 — Estilo visual y render de la escena
**Dueño:** ui (María Paula, `Paulasaah`) · **Fecha:** 14 nov 2026 · **Estado:** aprobada por Santiago (14 nov)

## Opciones
| Opción | A favor | En contra |
|---|---|---|
| 2D con PixiJS en la escena (D3 original) | Liviano, simple | No alcanza la dirección visual aprobada (mundo abierto 3D, personajes facetados) |
| 3D con modelos GLB (Blender, Drei, Rapier) | Modelos ricos | Pipeline de assets y librerías nuevas que no caben en el plazo; pesados en celular |
| **3D procedural con Three.js `^0.160.0` + UI en DOM** | Todo en código, una sola dependencia, estilo uniforme, responde al `GameState`, respaldo 2D | Requiere modelar siluetas con cuidado |

## Elegida
**Atlas v8:** low-poly facetado marfil, lila, ciruela y cian sobre un Marte real (Jezero), construido con Three.js procedural (`WebGLRenderer`) y la interfaz en DOM/CSS. Fuente única: [`docs/referenciapau/README.md`](../referenciapau/README.md).

**Personajes (decidido por ui según las láminas):** el niño, la tripulación e Iris existen en 3D dentro del mundo (`mundo/01`, `inicio/02`); Iris es un rover de 4 ruedas. En las tarjetas de diálogo se muestra un retrato de la misma identidad (`ui/01`, `personajes/07`). Esto actualiza la decisión del 13 nov "retratos 2D animados sobre la escena 3D" de `docs/ORQUESTACION.md`.

**Láminas:** 55 curadas y comprimidas en `docs/referenciapau/referencias/`; el PDF del atlas queda fuera de git.

## Por qué
- Es una sola dependencia (`three ^0.160.0` y `@types/three`), ya agregada en la rama `feat/ui-escena-3d` (llega a `develop` con #142), y `WebGLRenderer` corre en equipos viejos.
- La dirección visual (55 láminas) ya está curada y documentada.
- El motor sigue mandando: la escena solo dibuja `GameState`.

## Consecuencias para cada rol
- **ui:** construye según `docs/referenciapau/`. Sin GLB, sin WebGPU, sin Drei ni Rapier, sin otra librería además de `three`. Respaldo 2D obligatorio.
- **motor, diseño, agentes, datos:** sin cambios de contrato. Ninguna regla se mueve a la escena.
- **orquestación:** donde `PLAN.md`, `docs/ORQUESTACION.md` y `D3-motor.md` dicen "PixiJS" para la escena, manda esta decisión. React + Vite + motor puro de D3 siguen igual. Pendiente que Santiago actualice esos tres documentos.
- **Quedan descartados y no vuelven:** `docs/referencias/3d/` (prototipo HTML), atlas v2–v5 y v7, capibara, `polyfork.ts`, GLB de `ui/public/models/`, el pipeline Blender → GLB y las propuestas con Drei, Rapier o Higgsfield.
