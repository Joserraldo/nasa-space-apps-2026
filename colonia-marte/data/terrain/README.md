# Jezero DEM provenance

`jezero-elevation.bin` is an unchanged copy of the game's `data/terreno/jezero/elevacion.bin`.
`jezero.json` preserves its original metadata and source attribution; its image references are not copied.

- Source: NASA Mars Trek (JPL), MOLA (NASA) + HRSC (ESA/DLR).
- Original source URL: https://trek.nasa.gov/mars/
- Game curation date: 2026-11-13.
- Grid: 280 × 280, signed little-endian int16 elevations in meters, 289 m/pixel.
- Geographic bounds: 76.9–78.3° E, 17.7–19.1° N.
- Review origin: central plain, 77.7° E / 18.4° N.

The near field (0–800 m) is seeded procedural relief. DEM blending starts only in the far ring,
reaching full influence at 2.4 km. Horizontal distances retain the DEM's actual scale.
Far relief is vertically reduced to 25% for the low skyline and lowered by Mars curvature.
This is an artistic display of terrain, not a geographic navigation model.
The 3.2 km eye-level horizon is not the distance to the physical crater rim; distant peaks can remain visible.
