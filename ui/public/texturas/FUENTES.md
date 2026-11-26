# Sources of texture and sky data

| File | Source | License |
|---|---|---|
| `cielo/estrellas.json` | NASA SVS 4851, "Deep Star Maps 2020" (https://svs.gsfc.nasa.gov/4851), `starmap_2020_4k.exr` | NASA media, public domain; credit NASA/Goddard Space Flight Center Scientific Visualization Studio |

Processing (2026-11-16): the 1500 brightest local peaks of the 4k map, as unit vectors in J2000 equatorial coordinates (y = sin(dec), atan2(z, x) = 270° - RA, checked against seven bright stars on 2026-11-17), log brightness 0-1 and RGB. The scene merges peaks closer than 0.6° (one star spread over several pixels) and draws them as points, never as a photo.
