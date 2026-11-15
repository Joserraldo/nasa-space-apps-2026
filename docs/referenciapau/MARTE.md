# MARTE: análisis del escenario real y cómo se traduce al estilo

**Para qué sirve:** que el exterior del juego sea Marte de verdad (cráter Jezero) dibujado con la estética facetada de [DISEÑO.md](DISEÑO.md). **La física y la geografía las pone Marte; la forma y la paleta las pone el estilo v8.**
**Regla de oro:** si una lámina contradice un dato de esta página, gana el dato, pero se expresa con las formas y colores de la familia v8.

Cada dato lleva su fuente y su estado: **[V]** verificado contra la fuente citada el 14 nov 2026; **[R]** ya registrado en el repo por el rol datos; **[C]** cálculo propio a partir de datos [V]; **[E]** decisión de estilo (no es un dato, es cómo lo dibujamos).

---

## 1. Datos físicos de Marte

Fuente principal: [NASA NSSDC, Mars Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html).

| Dato | Valor | Estado |
| --- | --- | --- |
| Gravedad superficial | 3,73 m/s² (0,38 de la Tierra) | [V] [R] `ui/src/escena/fisica.ts` |
| Presión en superficie | 6,36 mbar (entre 4,0 y 8,7 según estación); menos del 1 % de la terrestre | [V] |
| Densidad del aire | ~0,016 kg/m³ (la Tierra: ~1,2) | [V] |
| Composición | CO₂ 95,1 %, N₂ 2,59 %, Ar 1,94 % | [V] |
| Irradiancia solar | 586,2 W/m² (la Tierra: ~1361): el Sol da ~43 % de la luz | [V] y [C] |
| Temperatura media | ~214 K (-59 °C); en Viking 1, de -89 °C a -31 °C en un día | [V] |
| Viento | 2–7 m/s en verano, 17–30 m/s en tormentas de polvo (sitios Viking) | [V] |
| Duración del día (sol) | 24,66 h | [V] |
| Horizonte para el ojo a 1,5 m | ~3,2 km (en la Tierra ~4,4 km): el horizonte se ve más cerca | [C] `d = sqrt(2 R h)`, R = 3389,5 km |

## 2. Jezero, el lugar del juego

| Dato | Valor | Estado |
| --- | --- | --- |
| Tamaño y ubicación | Cráter de impacto de ~45 km, 18,4° N, 77,7° E, región de Nili Fossae | [V] [NASA Science](https://science.nasa.gov/resource/perseverance-explores-the-jezero-crater-delta/) |
| Historia | Antiguo lago con un delta en abanico en el lado oeste, formado hace ~3500 millones de años | [V] [JPL](https://www.jpl.nasa.gov/news/nasas-perseverance-rover-deciphers-ancient-history-of-martian-lake/) |
| Rocas del fondo | Lavas y rocas ígneas ricas en olivino (formaciones Séítah y Máaz) bajo sedimentos; carbonatos en el borde oeste | [V] [NASA NTRS, Sun et al. 2023](https://ntrs.nasa.gov/api/citations/20230016431/downloads/Sun%20et%20al%202023%20JGR%20Planets%20Jezero%20Campaign.pdf) |
| Relieve del juego | DEM de NASA Mars Trek (MOLA + HRSC), rejilla 280 x 280, ~289 m/px, de -3093 m a -501 m, caja 76,9–78,3° E / 17,7–19,1° N | [R] `data/terreno/jezero/jezero.json` |
| Imágenes de contexto | Sombreado y teselas CTX | [R] `data/terreno/jezero/sombreado.jpg`, `ctx/` |
| Perseverance | El rover de NASA explora Jezero desde 2021 (uno de los sitios candidatos del juego es "cerca de Perseverance") | [R] `missions/src/jezero.ts` |

## 3. Del dato a la regla visual

| Dato real | Qué significa a la vista | Regla para el juego | Estado |
| --- | --- | --- | --- |
| Polvo de óxido de hierro en el aire | El cielo de día es amarillo anaranjado, no azul | Cielo diurno caramelo o salmón pastel (§4). **Nunca azul de día.** | [V] [E] |
| El polvo dispersa el azul hacia adelante | Hay un halo azulado alrededor del Sol, muy visible al atardecer | Halo azul pálido pequeño junto al Sol; atardecer con azul cerca del Sol y ámbar en el resto (al revés que en la Tierra) | [V] [E] |
| Crepúsculo largo por polvo alto | Después de ponerse el Sol queda luz hasta ~2 h | El ambiente "atardecer exterior" es una luz larga y suave, no un corte a noche | [V] [E] |
| 43 % de luz solar y Sol más pequeño | Sol más blanco y chico; el cielo aporta mucha luz difusa cálida | Luz principal cálida pero contenida; luz de cielo (hemisférica) cálida y alta. Se compensa con exposición: el marfil no puede verse gris | [V] [C] [E] |
| Aire muy fino (1 % de presión) | Sombras de bordes bastante definidos, rellenas por el resplandor del polvo | Sombras nítidas pero **teñidas de lila o ciruela**, nunca negras | [V] [E] |
| Perspectiva atmosférica por polvo | Lo lejano se desatura y se aclara | Cordilleras lejanas lilas y claras, niebla del color del horizonte | [E] |
| Horizonte más cerca (~3,2 km) | El suelo "se curva" antes; las montañas del borde quedan bajas | El borde del cráter es una **cresta baja y lejana**, no montañas altas en primer plano. La cordillera morada de `mundo/01` se baja y se aleja | [C] [E] |
| Gravedad 0,38 g | Todo cae más lento y salta más alto | Saltos y caídas usan `GRAVEDAD_MARTE`. Pasos con flotación leve, sin rebotes de dibujo animado | [V] [R] |
| Aire 75 veces menos denso | El viento empuja poco; no hay humo que se arremoline | Antenas, cables y banderas no flamean. El polvo que levantan pies o ruedas sale en arco bajo y cae; nada de nubes esponjosas de humo | [V] [C] [E] |
| Sin agua líquida en superficie, -59 °C de media | Nada crece afuera; no hay charcos | Cero vegetación, agua o hielo líquido al aire libre. Plantas solo en invernadero presurizado | [V] [E] |
| Fondo de cráter con lavas y olivino; delta sedimentario al oeste | Rocas oscuras angulosas sobre un suelo más claro de polvo y arena | Rocas basálticas facetadas, caras laterales oscuras (`roca-basalto`) y **cara superior más clara por el polvo depositado**. Ondas de arena pequeñas. Ninguna forma que parezca construida | [V] [E] |
| Polvo que se deposita en todo | Los paneles pierden energía con polvo (InSight se apagó así) | Equipo exterior con polvo en las superficies horizontales; un panel sucio se ve distinto solo si el motor lo marca (evento de polvo) | [R] `fuente.jpl.insight` [E] |
| Radiación alta en superficie (sin campo magnético global y aire fino) | Es la razón de ser del juego | El refugio es un módulo cubierto de regolito; la protección real la decide el motor, nunca la geometría | [R] `docs/science/` [E] |

## 4. Cielo (reemplaza el azul de las láminas `mundo/`)

**Propuesta de estilo [E], a calibrar en la cámara del juego y aprobar por María Paula.** Mantiene la suavidad pastel del atlas con el color real de Marte.

| Ambiente | Cénit | Horizonte | Junto al Sol | Niebla |
| --- | --- | --- | --- | --- |
| **Día en Marte** (por defecto) | `#D9A38A` salmón pastel | `#F2CDB0` caramelo claro | Halo pequeño `#DCE6EC` | Igual al horizonte |
| **Atardecer exterior** | `#7A5A80` ciruela suave | `#E8A27A` ámbar | Halo azul `#8FB6D9` más grande | Ámbar desaturado |
| **Alerta / tormenta solar** | Mismo cielo del momento | — | — | La alerta va en la UI y en luces locales ámbar; **el cielo no cambia por una tormenta solar** (las partículas no se ven) |

Notas:
- Una tormenta **solar** (radiación) no oscurece el cielo. Una tormenta **de polvo** sí (cielo más opaco y ocre, sol tenue). El juego solo muestra polvo cuando el motor activa el evento de polvo.
- Estrellas visibles solo de noche o en el crepúsculo avanzado; el juego transcurre de día por defecto.

## 5. Luz recomendada (punto de partida, se mide en pantalla)

| Luz | Dirección y color | Notas |
| --- | --- | --- |
| Direccional (Sol) | Arriba a la izquierda, blanco cálido | Una sola, con sombras `mapSize <= 1024` (512 o sin sombras en calidad baja). |
| Hemisférica | Cielo: color del horizonte · Suelo: `regolito-medio` | Aporta el rebote cálido del polvo. Más peso relativo que en un exterior terrestre. |
| Puntuales | Solo pantallas, balizas, faros de Iris | Máximo 1–2 activas. |
| Tone mapping | `ACESFilmicToneMapping`, exposición de partida 1,06 (la del código actual) | Calibrar exposición y cámara juntas hasta que el marfil `#F3EEE5` lea marfil. |

## 6. Lo que la lámina muestra y Marte no permite

| En la lámina | Corrección |
| --- | --- |
| Cielo azul intenso de día (`mundo/01`, `mundo/02`) | Cielo de §4. |
| Cordillera morada alta y cercana | Borde del cráter bajo y lejano, desaturado. |
| Árboles fuera del comedor (versión descartada) | Ya retirado: exterior árido. |
| Rocas con formas de arco o estatua (lámina de entorno original) | Solo rocas naturales pequeñas y medianas. |

## 7. Lo que no se afirma

- Las distancias y medidas de la base (puertas, pasillos, separación entre módulos) son **medidas de producción del juego**, no estándares de ingeniería de NASA.
- El relieve decorativo cercano (montículos, piedras) es inventado y no se presenta como dato de Mars Trek. Solo el relieve general sale del DEM.
- La dosis de radiación de tormenta usada en el juego se midió en el cráter **Gale** (RAD/Curiosity), no en Jezero. La UI lo aclara.
- Los colores del cielo son una interpretación de estilo de fotografías reales, no una medición colorimétrica.
