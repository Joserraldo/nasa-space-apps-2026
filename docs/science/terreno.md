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
- La regla de luz de Jezero solo mira el horizonte; en el polo hay que añadir la latitud (el Sol nunca sube mucho). Para eso hace falta la inclinación del eje de Marte, que se verificará antes de usarla.
- El hielo no se ve en el DEM. Si se nombra, irá con su fuente (por verificar); si no, no se afirma.
