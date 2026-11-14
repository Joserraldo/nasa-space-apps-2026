# Terreno de Jezero (Mars Trek): qué es medida y qué es derivado

**Fuente:** NASA Mars Trek (recurso oficial del reto), consultado el 2026-11-13. `npm run jezero:descargar` (sin clave) y `npm run jezero:curar`.

| Archivo en `data/terreno/jezero/` | Qué es | Origen |
|---|---|---|
| `elevacion.bin` | Altura del suelo en metros (Int16 LE, 280×280, ~289 m/px). Recuadro 76,9–78,3° E / 17,7–19,1° N | **Medida.** DEM `Mars_MOLA_blend200ppx_HRSC_DEM_clon0dd_200mpp_lzw` (MOLA de NASA + HRSC de ESA/DLR), exportado del ImageServer de Trek |
| `sombreado.jpg` | Relieve sombreado 1024×1024 del mismo recuadro | Producto de Trek `..._HRSC_Shade_...`: no lo calculamos nosotros |
| `ctx/*.png` | 25 teselas de la mosaico CTX de Jezero (nivel 9, ~80 m/px) | Producto de Trek `Jezero_CTX_BlockAdj_dd` (NASA/JPL/MSSS, MRO) |
| `jezero.json` | 4 sitios candidatos con pendiente, horizonte y puntajes | **Derivado por el equipo** (reglas abajo) |

## Reglas derivadas (`data/scripts/jezero-curar.ts`; las constantes se fijaron antes de ver los resultados)
- **Pendiente:** media de la pendiente por diferencias centrales en un radio de 1,5 km. **plano = 1 − pendiente / 10°.**
- **Horizonte:** altura angular media del terreno en 8 direcciones, hasta 15 km. **luz = 1 − horizonte / 10°.** Las paredes tapan el Sol al amanecer y al atardecer.
- **blindaje = 0,7 · profundidad relativa + 0,3 · horizonte / 10°.** Más abajo hay más aire encima, y las paredes tapan parte del cielo. Es una idea correcta en dirección (la atmósfera de Marte frena parte de la radiación), pero el número es del juego, no una dosis.
- **Sitios:** elegidos por el equipo. "Cerca de Perseverance" usa el centro del marcador oficial de Mars Trek, "Al pie de la pared sur" es donde el DEM empieza a subir a 77,75° E, y "Sobre el borde oeste" es el punto más alto del DEM a 18,45° N.

La tarjeta debe decir (clave `datos.terreno.derivado`): la altura es una medida real; inclinación, luz y blindaje son valores del juego calculados a partir de ella.

## Qué NO se afirma
- No se dan dosis de radiación por sitio. La dosis de referencia de Marte (RAD/Curiosity, en el cráter Gale) va aparte y con su cita.
- Las coordenadas exactas de aterrizaje de Perseverance no se citan: solo el marcador de Trek.

## Próxima región: polo norte de Marte (`marte_polo_norte` del contrato) — plan, aún sin datos
- [V 2026-11-13] Mars Trek publica el DEM MOLA en estereográfica polar norte: `trekarcgis/rest/services/mola128_mola64_merge_90Nto90S_SimpleC_clon0_NP/ImageServer` (S16, metros, SR "Mars_Npolar_Sphere_Polar", radio 3 396 190 m). Como la rejilla está en metros, la pendiente se calcula sin corregir la longitud.
- Recuadro: unos 250 km en el borde del casquete de hielo. Las coordenadas se fijan con el DEM.
- La regla de luz de Jezero solo mira el horizonte; en el polo hay que añadir la latitud. **Inclinación del eje de Marte: 25,19° [V]** (NASA NSSDC, ficha de Marte, actualizada el 19 may 2025, https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html). Altura máxima del Sol en pleno verano ≈ 90° − latitud + 25,19°.
- **Probado el 13 nov, sin éxito:**
  - El `exportImage` del servicio polar `_NP` devuelve error 400 con todos los formatos (bsq, tiff, png).
  - El DEM MOLA equirectangular (`mola128_mola64_merge...`) no tiene datos por encima de ~83,5° N (devuelve −32768), y entre 76 y 79° N, cerca de 120° O, da valores raros que no se usan.
  - El DEM mezclado MOLA+HRSC también da error para la franja 76–90° N.
- Segundo intento, también fallido: el DEM MOLA equirectangular no tiene datos por encima de ~82,5° N, y la fila de 82,4° N sale casi constante (≈ −2000 m), lo que parece un artefacto del borde. El DEM mezclado da error 400 en 80–83,4° N.
- **Plan B (implementado, `data/src/region.ts`):** polo norte **sin mapa ni sitios**. Solo una tarjeta con la luz por latitud (82° N de referencia): Sol máximo en verano ≈ 33,2°, y noche polar porque 82° > 64,81° (90 − 25,19). Son cálculos del equipo a partir de la inclinación [V]. **No se afirma nada del hielo** (sin fuente verificada).
- El hielo no se ve en el DEM. Si se nombra, irá con su fuente (por verificar); si no, no se afirma.

## Luna lado visible (Moon Trek): 3 sitios Apolo
**Fuente:** NASA Moon Trek (aprobada por Daniel; aparece en el catálogo oficial de api.nasa.gov), consultado el 2026-11-14. `npm run luna:descargar` (sin clave, 1 petición cada 2 s) y `npm run luna:curar`. Salida: `data/terreno/luna-visible/` (56 KB).
- **Posición [V]:** capa `https://trek.nasa.gov/moon/trekarcgis/rest/services/CombinedNomenclature/MapServer/0/query` (`Spacecraft = 'Apollo NN LM descent stage'`, campos `Lat_Y`, `Lon_X`). Apolo 11: 0,674° N, 23,473° E; Apolo 15: 26,132° N, 3,633° E; Apolo 16: 8,973° S, 15,501° E. Coinciden con la propuesta #100. No se cruzó con el nomenclátor de USGS.
- **Elevación [V]:** `.../services/LRO_LOLA_DEM_Global_128ppd_v04/ImageServer/exportImage` (`bboxSR=104903`, `pixelType=F32`, `format=bsq`), cuadro de 0,5° × 0,5° (64×64 px, ~237 m/px), guardado como Int16 LE en metros. Rango global del servicio: −9126 a 10767 m.
- **Sombreado:** `LRO_LOLA_ClrShade_Global_128ppd_v04` (producto de Trek, 256×256, no calculado por nosotros).
- **Derivado por el equipo:** pendiente media por diferencias centrales en radio de 1,5 km (igual que Jezero, radio de la Luna 1 737 400 m); relieve = máximo − mínimo del cuadro; plano = 1 − pendiente / 10°.

| Sitio | Elevación | Pendiente | Relieve |
|---|---|---|---|
| Tranquilidad (Apolo 11) | −1927 m | 1,0° | 270 m |
| Descartes (Apolo 16) | 12 m | 1,7° | 689 m |
| Rima Hadley (Apolo 15) | −1927 m | 0,9° | 1497 m |

Los relieves coinciden con los de la propuesta #100; las pendientes difieren de las de la propuesta (1,1° / 3,7° / 5,1°); el método de la propuesta no tenía script, así que no se pudo reproducir.
- **NO VERIFICADO:** luz (amanecer, horizonte; requeriría NASA SVS 5187 o el DEM más lejano) y blindaje (regla de juego sin fuente). Quedan en `null` y `fuente.pendientes`. Tampoco se afirma dosis de radiación en la Luna.
