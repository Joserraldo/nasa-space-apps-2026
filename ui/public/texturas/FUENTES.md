# Texture and sky sources

Experimental ambience assets (branch `feat/frente-f-texturas-suelo`), loaded only behind `?texturas=1`, `?sol=1` and `?mundo=<id>`.

| File | Source | License |
|---|---|---|
| `marte/suelo_*.webp` | Poly Haven `terrain_red_01` (https://polyhaven.com/a/terrain_red_01) | CC0 |
| `marte/roca_*.webp`, `luna/roca_*.webp` | Poly Haven `rock_boulder_dry` (https://polyhaven.com/a/rock_boulder_dry) | CC0 |
| `luna/suelo_*.webp` | Poly Haven `moon_dusted_02` (https://polyhaven.com/a/moon_dusted_02) | CC0 |
| `cielo/estrellas.json` | NASA SVS 4851, "Deep Star Maps 2020" (https://svs.gsfc.nasa.gov/4851), `starmap_2020_4k.exr` | NASA media, public domain; credit NASA/Goddard Space Flight Center Scientific Visualization Studio |

Processing (2026-11-16):

- Poly Haven maps: 1k JPG reduced to 512 px WebP. `*_normal` is the OpenGL normal (`nor_gl`); `*_arm` packs AO (R), roughness (G), metal (B). `*_detalle` is the color map turned grayscale and remapped to 0.88-1.0: it only adds a soft grain and never changes the game palette.
- Star map: the 1500 brightest local peaks of the 4k EXR, by flux in a 7x7 window. Each star stores its direction, a logarithmic brightness (0-1) and its color. It is drawn as points over the palette sky, not as a photo.
- Earth, Phobos and Deimos are drawn in code as faceted low-poly bodies in palette colors; no photo textures are used.
