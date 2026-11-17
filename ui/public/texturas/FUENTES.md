# Texture sources

Ambience assets of the outdoor scene, loaded by default (`?texturas=0` turns them off).

| File | Source | License |
|---|---|---|
| `marte/suelo_*.webp` | Poly Haven `terrain_red_01` (https://polyhaven.com/a/terrain_red_01) | CC0 |
| `marte/roca_*.webp`, `luna/roca_*.webp` | Poly Haven `rock_boulder_dry` (https://polyhaven.com/a/rock_boulder_dry) | CC0 |
| `luna/suelo_*.webp` | Poly Haven `moon_dusted_02` (https://polyhaven.com/a/moon_dusted_02) | CC0 |

Processing (2026-11-16): 1k JPG reduced to 512 px WebP. `*_normal` is the OpenGL normal (`nor_gl`); `*_arm` packs AO (R), roughness (G), metal (B). `*_detalle` is the color map turned grayscale and remapped to 0.88-1.0: it only adds a soft grain and never changes the game palette.

The slab and block rock shapes (`activos/rocasVariadas.ts`) are built in code; no external mesh is used.
