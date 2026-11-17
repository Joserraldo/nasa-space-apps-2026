# Sources of texture and sky data

| File | Source | License |
|---|---|---|
| `cielo/estrellas.json` | NASA SVS 4851, "Deep Star Maps 2020" (https://svs.gsfc.nasa.gov/4851), `starmap_2020_4k.exr` | NASA media, public domain; credit NASA/Goddard Space Flight Center Scientific Visualization Studio |

Processing (2026-11-16): the 1500 brightest local peaks of the 4k map, as unit vectors in J2000 equatorial coordinates (y = sin(dec), atan2(z, x) = 270° - RA, checked against seven bright stars on 2026-11-17), log brightness 0-1 and RGB. The scene merges peaks closer than 0.6° (one star spread over several pixels) and draws them as points, never as a photo.
| `marte/suelo_color.webp`, `marte/suelo_normal.webp` | Poly Haven `terrain_red_01` (https://polyhaven.com/a/terrain_red_01) | CC0 |
| `marte/arena_normal.webp` | Poly Haven `red_sand` (https://polyhaven.com/a/red_sand) | CC0 |
| `marte/roca_color.webp`, `marte/roca_normal.webp` | Poly Haven `rock_boulder_dry` (https://polyhaven.com/a/rock_boulder_dry) | CC0 |

Mars ground and rock maps (downloaded 2026-11-16 with the public Poly Haven API, 512 px WebP; color at quality 82, normals OpenGL at 90). The terrain shader uses the color maps only as grain and divides by their measured mean, so the palette comes from the game, not from the photo.
