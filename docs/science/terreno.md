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

## Marte, polo norte (`marte_polo_norte` del contrato): 4 sitios con mapa
**Fuente:** NASA Mars Trek, consultado el 2026-11-14. `npm run marte-norte:descargar` (sin clave, 1 petición cada ~2 s) y `npm run marte-norte:curar`. Salida: `data/terreno/marte-norte/` (224 KB). Export: `terrenoMarteNorte`.
- **Corrección (14 nov):** el 13 nov se anotó que el `exportImage` del DEM polar `_NP` daba error 400. **Era un error de uso:** falla si se le manda `bboxSR`/`imageSR`; sin ellos responde 200 [V]. Los intentos con el DEM equirectangular y el mezclado ya no hacen falta.
- **Servicio [V]:** `https://trek.nasa.gov/mars/trekarcgis/rest/services/mola128_mola64_merge_90Nto90S_SimpleC_clon0_NP/ImageServer/exportImage?bbox=xmin,ymin,xmax,ymax&size=160,160&format=bsq&pixelType=F32&f=image` (bbox en metros, sin bboxSR). DEM MOLA, metros, ~39 m/px nativo; recortes de 24 km a 150 m/px, guardados como Int16 LE. Rango visto en el casquete: −2359 a −1923 m (prueba 32×32).
- **Proyección [V]:** estereográfica polar norte, esfera Mars 2000 de radio 3 396 190 m, meridiano central 0, metros. `x = ρ·sin(lon)`, `y = −ρ·cos(lon)`, `ρ = 2R·tan((90−lat)/2)` (`proyectarPolarNorte` en `data/src/terreno.ts`). **Comprobación de signo:** identify en 7 puntos nombrados repartidos en todos los cuadrantes de longitud (26° a 312° E) dio la misma altura que el DEM global `Mars_MOLA_blend200ppx_HRSC_DEM_clon0dd_200mpp_lzw` en lat/lon (Louth −4815 vs −4838; Korolev −4517 vs −4521; Escorial −5514 vs −5512; Olympia Undae −4339 vs −4333; Abalos Scopuli −4543 vs −4531; Gemini Scopuli −4071 vs −4068; Chasma Boreale −4916 vs −4985). Con el signo de `y` al revés, los puntos caerían a cientos de km. Nota: la capa de nomenclatura `combinedNom_np` declara un radio de 3 376 200 m en su SR, pero el DEM usa 3 396 190 m y es el que se verificó.
- **Sitios [V posición]:** nombre y centro del nomenclátor de la UAI, capa `combinedNom_np` de Mars Trek (`.../services/combinedNom_np/MapServer/0/query`, campos `center_lat`, `center_lon`, `diameter`; todos "Adopted by IAU"). Elegidos para encajar con las franjas de la propuesta (`docs/ideas/mision-marte-polo-norte.md`, ~70°, ~76° y ~82° N). Longitudes este.
  | Sitio | Lat, lon | Altura medida | Pendiente 1,5 km | Relieve 24 km | Plano |
  |---|---|---|---|---|---|
  | Cráter Louth (36 km) | 70,188° N, 103,236° E | −4838 m | 3,0° | 1463 m | 0,70 |
  | Cráter Escorial (22 km) | 76,894° N, 304,960° E | −5515 m | 3,5° | 1143 m | 0,65 |
  | Dunas Olympia Undae (1508 km) | 81,164° N, 178,483° E | −4334 m | 1,8° | 105 m | 0,82 |
  | Cañón Chasma Boreale (460 km) | 82,541° N, 312,360° E | −4916 m | 0,6° | 193 m | 0,94 |
- **Derivado por el equipo:** pendiente media por diferencias centrales en radio de 1,5 km (igual que Jezero; la rejilla está en metros, sin corregir por la latitud); relieve = máximo − mínimo del recorte; plano = 1 − pendiente / 10°. Luz y blindaje: **sin fuente, quedan en `null`** (el horizonte local no basta: en el polo la luz depende de la latitud y de la inclinación del eje 25,19° [V] NSSDC, ver `regionPoloNorte()`).
- **Verificación independiente [V]:** identify en el centro de cada sitio, DEM polar vs DEM global: Louth 23 m, Escorial 2 m, Olympia Undae 6 m (≤ 50 m). **Chasma Boreale difiere 69 m** (−4916 polar, −4985 global; el global es casi plano alrededor, 9 puntos entre −4969 y −4994), por lo que supera el criterio de 50 m: son productos distintos (MOLA solo vs mezcla MOLA+HRSC). El DEM guardado difiere del identify polar ≤ 25 m (suavizado a 150 m/px).
- **NO VERIFICADO:** que el centro del nomenclátor sea un buen sitio de aterrizaje (es el centro del rasgo, no un lugar escogido); si el DEM polar y el global deberían coincidir mejor en Chasma Boreale; el hielo no se ve en el DEM y **no se afirma nada de él** (la fuente F1 de la propuesta sigue pendiente de aprobación). No hay sombreado ni imagen: no se descargó producto de Trek para el polo. No se cruzó con el nomenclátor de USGS.
- `regionPoloNorte()` (luz por latitud, sin mapa) se deja igual: sigue sirviendo para la luz; el terreno se lee aparte con `terrenoMarteNorte`.

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
- **NO VERIFICADO:** luz como criterio de puntaje (horizonte con montañas) y blindaje (regla de juego sin fuente). `puntajes.luz` y `blindaje` siguen en `null` y en `fuente.pendientes`. Tampoco se afirma dosis de radiación en la Luna.

### Luz en 2024 (NASA SVS 5187) — `data/terreno/luna-visible/luz-2024.json`, export `luzLunaVisible`
**Fuente [V]:** NASA Scientific Visualization Studio, "Moon Phase and Libration, 2024" (aprobado por Daniel), https://svs.gsfc.nasa.gov/5187/ , tabla `https://svs.gsfc.nasa.gov/vis/a000000/a005100/a005187/mooninfo_2024.txt` (8785 filas horarias, 2024-01-01 00:00 a 2025-01-01 00:00 UT; 1 MB, copiada en `data/raw/svs-5187/`). Consultado el 2026-11-14. Columnas usadas: `Slon` y `Slat` (longitud y latitud selenográficas del punto subsolar, este positivo). `npm run luna:luz --workspace data` (o `tsx scripts/luz-luna.ts`), sin red.
**Derivado por el equipo:** `sin(e) = sin φ · sin φs + cos φ · cos φs · cos(λ − λs)`, con interpolación lineal entre filas, horizonte plano, Sol puntual, sin montañas ni refracción. La hora de cada tormenta es la de su primera fase en `data/curated`.

| Tormenta (1ª fase, UT) | Tranquilidad | Descartes | Hadley |
|---|---|---|---|
| 2024-05-10 Gannon (05-09 09:13) | noche, −54,8°; amanece 05-13 20:48 | noche, −61,8°; 05-14 12:47 | noche, −59,2°; 05-15 10:48 |
| 2024-05-11 X5.8 (05-11 01:23) | noche, −34,4°; 05-13 20:48 | noche, −41,9°; 05-14 12:47 | noche, −46,1°; 05-15 10:48 |
| 2024-05-14 X8.7 (16:51) | día, 10,2°; atardece y amanece 06-12 08:03 | día, 2,0°; 06-13 00:11 | noche, −8,2°; 05-15 10:48 |
| 2024-05-20 CME (05:36) | día, 77,7° | día, 67,4° | día, 50,2° |
| 2024-10-03 X9.0 (12:18) | noche, −57,8°; 10-08 05:57 | noche, −64,3°; 10-08 21:33 | noche, −61,4°; 10-09 21:13 |
| 2024-10-10 (10-09 01:56) | día, 10,2° | día, 2,2° | noche, −8,8°; 10-09 21:13 |

(En las filas de día el "próximo amanecer" del JSON es el de después del siguiente atardecer, ~29 días más tarde.) Esto coincide con la propuesta (Tranquilidad amanece primero el 13 may ~21:00; Hadley el 15 may ~11:00), pero la tormenta de la ruta dorada (20 may, CME) llegó con el Sol alto en los 3 sitios; la afirmación "llegó de noche" de la propuesta NO coincide con esta tabla para el lado visible: el 11 may sí era de noche, el 20 may no.
**Verificación [V]:** Apolo 11, 2024-05-10 15:00 UT, fila cruda `Slon 153,133`, `Slat 0,927` → e = −39,64° calculado aparte en Python y en el código; los 12 amaneceres de 2024 de cada sitio están separados 29,2–29,9 días (mes sinódico 29,53); la elevación cambia ≤ 0,62°/hora.
**Por qué `luz` sigue `null`:** la fracción de horas con Sol en 2024 sale ≈ 0,49 en los 3 sitios (0,487 / 0,489 / 0,492): no distingue sitios, y el horizonte real (montañas de Hadley) no se calculó. Un puntaje con esos números sería inventado. **NO VERIFICADO:** efecto de montañas y de la libración del horizonte; el disco solar (0,25°) y la refracción nula en la Luna no se modelaron.

## Luna polo sur (Moon Trek): 6 cráteres
**Fuente:** NASA Moon Trek (aprobada por Daniel), consultado el 2026-11-14. `npm run luna-sur:descargar` (sin clave, 1 petición cada 2 s) y `npm run luna-sur:curar`. Salida: `data/terreno/luna-polo-sur/` (~200 KB, solo DEM; sin sombreado).
- **Elevación [V]:** `.../services/LRO_LOLA_DEM_SPole75_30mp_v04/ImageServer/exportImage` (30 m/px, proyección estereográfica polar sur `Moon2000_spole`, escala 1 en el polo, rango −7762 a 7027 m). Cuadro de 15,36 km (128×128 px de 120 m), recuadro en metros: `x = ρ·sin(lon)`, `y = ρ·cos(lon)`, `ρ = 2R·tan((90+lat)/2)`, R = 1 737 400 m (comprobado contra `identify` del servicio). Guardado como Int16 LE. Ojo: con `bboxSR`/`imageSR` explícitos el servicio devolvió HTTP 500; sin ellos (SR nativo) funciona.
- **Posición [V]:** capa `CombinedNomenclature/MapServer/0` (`LABEL`, `type='Crater, craters'`, campos `center_lat`, `center_lon`, `diameter`; nomenclátor IAU). No se cruzó con USGS.
- **Derivado por el equipo:** igual que luna-visible (pendiente media por diferencias centrales en radio de 1,5 km; relieve = máx − mín del cuadro; plano = 1 − pendiente / 10°).

| Sitio | Lat / Lon | Elevación | Pendiente | Relieve | Plano |
|---|---|---|---|---|---|
| Shackleton | −89,63° / 132,32° | −2635 m | 9,1° | 4173 m | 0,09 |
| Haworth | −87,20° / −7,49° | −3147 m | 9,2° | 2992 m | 0,08 |
| Faustini | −87,18° / 85,02° | −2713 m | 6,5° | 1095 m | 0,35 |
| Malapert | −84,80° / 12,31° | −1670 m | 14,3° | 3153 m | 0 |
| Nobile | −85,24° / 53,65° | 755 m | 9,0° | 1527 m | 0,10 |
| de Gerlache | −88,45° / −90,45° | −1868 m | 19,0° | 2028 m | 0 |

**Verificación independiente (`identify`, 2026-11-14):** polar vs JSON: −2639,5 / −3145,5 / −2711,5 / −1673 / 760 / −1878 m (diferencias ≤ 10 m); DEM global 128 ppd en la misma lat/lon: −2650 / −3106 / −2717 / −1683 / 756,5 / −1858,5 m (≤ 41 m).
- Son el **centro del cráter según el nomenclátor**, no un punto de aterrizaje: no son los nombres "cresta soleada / macizo alto…" de la propuesta #98 (esos eran descriptivos, sin coordenadas). Asignarlos a los 4 sitios del juego lo decide diseño.
- **NO VERIFICADO:** luz (Moon Trek no ofrece capa de iluminación media: se buscaron en los 279 servicios nombres con "illum/sun/light/avg/flux" sin resultado) y blindaje. Hielo, sombra y frío: ver la sección siguiente. Quedan `null` y en `fuente.pendientes`. El ClrShade global reproyectado al polo salió negro, por eso no hay sombreado.

### Hielo, sombra permanente y frío en los 6 cráteres (Moon Trek, 2026-11-14)
`npm run luna-sur:hielo` (sin clave, 1 petición/2 s) guarda `data/terreno/luna-polo-sur/hielo.json` (crudo + URLs); `luna-sur:curar` lo pasa a `hieloSombra` de cada sitio. Todo se consulta en el recuadro de 15,36 km ya usado.

| Capa (Moon Trek) | Qué es [V del servicio] | Qué NO sabemos |
|---|---|---|
| `PSR_SP/MapServer/0` | 164 **puntos** (centro de cada región en sombra permanente) con `PSR_ID`, `Area__km2_`, `Coverage__`, `Data_Quali`, `Lunar_Feat`. Los `Features_o` citan imágenes LROC NAC. | Instrumento/artículo: el servicio no lo declara (descripción y copyright vacíos). Parece derivado de LOLA/LROC, **NO VERIFICADO**. Qué significan `Coverage__` y `Data_Quali`: NO VERIFICADO (no se usan). |
| `SP_IceLoc_280m/MapServer/0` | 1119 puntos (lon, lat) a 280 m con "IceLoc" en el nombre. | Qué mide, instrumento y artículo: no declarados. No sabemos si es detección, modelo o estabilidad térmica. NO VERIFICADO; solo se dice "podría haber hielo". |
| `DIVINER_summer_/winter_Max_Temp_SP_below110K_240mp/ImageServer` | Ráster F32 (K) a 240 m: temperatura **máxima** de la estación, solo donde es < 110 K; el resto es "sin valor". El nombre indica el instrumento Diviner de LRO. | Cita (¿Paige et al. 2010, Science?) NO VERIFICADO; la capa no la da. "Máx. verano" = verano austral, no distingue "sin dato" de "no frío". |

**Método (derivado por el equipo):** PSR = cuántos centros de región caen en el recuadro (id, área de la región entera, que puede salirse). Hielo = cuántos puntos caen en el recuadro. Frío = fracción de píxeles del ráster con valor (< 110 K) y valor mínimo (este último es medido). 110 K = −163 °C. No hay fracción "en sombra" porque PSR_SP son puntos, no polígonos.

| Cráter | Centros PSR | Puntos de hielo | < 110 K verano / invierno | Mín. K verano / invierno |
|---|---|---|---|---|
| Shackleton | 1 (233,7 km²) | 36 | 81 % / 96 % | 81,3 / 53,5 |
| Haworth | 0 | 20 | 98 % / 100 % | 59,7 / 36,4 |
| Faustini | 1 (663,9 km²) | 9 | 100 % / 100 % | 56,7 / 43,5 |
| Malapert | 0 | 0 | 0 % / 3 % | — / 89,5 |
| Nobile | 0 | 0 | 0,3 % / 2,5 % | 93,9 / 73,1 |
| de Gerlache | 1 (243,3 km²) | 7 | 77 % / 100 % | 51,0 / 47,2 |

**Textos para niños (en/es, claves `datos.terreno.luna.*`)**: "Parts of this crater never see the Sun" solo si hay ≥ 1 centro PSR (Shackleton, Faustini, de Gerlache); "may be ice… scientists still need to check" solo si hay puntos de hielo (todos menos Malapert y Nobile); "colder than −163 °C, even in summer" solo si ≥ 1 % del recuadro (todos menos Malapert y Nobile). Haworth no tiene centro PSR en el recuadro aunque sea muy frío: no se afirma sombra permanente. Nunca "hay agua para beber".

**Verificación independiente (`returnCountOnly` y `identify`):** hielo 36 / 0 / 7 y PSR 1 / 0 / 1 coinciden para Shackleton / Malapert / de Gerlache; `identify` en el centro de Shackleton = 94,45 K (dentro de 81,3–110); malla 3×3 en de Gerlache: 6 de 9 con valor (87,2 … 63,8 K, todos ≥ 51 K) frente a 77 % del ráster (malla gruesa).
