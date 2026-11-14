# Misión Luna, lado visible: la tormenta llega al final de la noche larga

**Rol que propone:** datos (Daniel) · **Dueños de la misión:** diseño (Santiago y Camilo) · **Estado:** propuesta · **Fecha:** 2026-11-14
**Sitio del contrato:** `luna_lado_visible` (`contracts/src/seed.ts`). Recursos de partida ya en `design/src/recursos.ts`: ⚡75 🫁75 🛡️50, consumo −2/−2/−2, retraso de comunicaciones 1 tick.
**Destino:** un `missions/src/luna-visible.ts` con la misma forma que `jezero.ts` (`Mision`). Este documento no toca esa carpeta: allí lo implementa diseño.
**Convención:** [V] = comprobado en la fuente que se cita (tabla §10). **NO VERIFICADO** = no se puede mostrar al niño. "Valor de juego" = número de diseño, no de NASA. Todo dato es **dato real curado, no en vivo**.

## 1. Por qué esta misión enseña algo distinto

| | Jezero (Marte, misión 1) | Polo sur lunar (otra propuesta) | **Lado visible (esta)** |
|---|---|---|---|
| La Tierra en el cielo | No se ve | Baja en el horizonte o tapada | **Siempre arriba y casi quieta** (la Luna gira una vez por cada vuelta a la Tierra: 655,720 h ≈ 27,3217 días, NSSDC; cálculo) |
| Hablar con la Tierra | 3,0–22,3 min por mensaje | — | **≈1,3 s** (384 400 km a la velocidad de la luz; cálculo) |
| Luz | Día de 24,66 h | Luz rasante casi constante en cimas | **≈14,8 días de luz y ≈14,8 de noche** (periodo sinódico 29,53 días; cálculo) |
| Frío | — | Cráteres en sombra | **Noche de 95 K (≈ −178 °C)**; de día hasta 390 K (≈ 117 °C) |
| Lo que pasó de verdad | RAD midió la tormenta del 20 may 2024 | — | **La tormenta de mayo de 2024 llegó cuando el lado visible estaba de noche** (§5) |

**La idea central:** en la Luna la ayuda de la Tierra está a un segundo, pero cada llamada gasta energía, y la energía no vuelve hasta que salga el sol. Aquí el niño no aprende "esperar al mensaje" (eso es Marte): aprende a **repartir una batería que tiene que durar toda la noche**. Y aprende que una misma tormenta golpea distinto a la Tierra, a la Luna y a Marte.

## 2. La misión, paso a paso (8 pasos, ~2-3 min)

| Paso | Qué pasa | Decisión del niño (con costo) | Quién habla | Dato que se muestra (fuente) |
|---|---|---|---|---|
| 1 | La nave suelta el satélite. La Tierra aparece grande en la ventana | — | Iris (nivel 1) presenta a la tripulación | La Tierra siempre mira la misma cara de la Luna (NSSDC: rotación = vuelta; cálculo) |
| 2 | Dibuja la ruta. Es de noche abajo: el mapa se ve con el sombreado del relieve | Ruta corta (pasa sobre montañas: menos señal de la Tierra, valor de juego) o larga (⚡ extra) | Meteoróloga | Mapa LOLA de LRO (Moon Trek: **pendiente de aprobación de Daniel, fuente fuera de la lista**; plan B: dibujo marcado "no es mapa real") |
| 3 | 3 sitios candidatos con **plano**, **luz** y **blindaje** (§3) | Ninguno gana en los tres | Ingeniera (luz), Doctora (blindaje), Matemático (plano) | Pendiente y relieve: derivados a mano con LOLA (Moon Trek), **NO VERIFICADO (sin script)**. Hora del amanecer: cálculo con datos SVS. Ambas fuentes **pendientes de aprobación de Daniel** (fuera de la lista) |
| 4 | Aterriza y elige **2 de 5 módulos** (§4) | Cada uno mueve 2 medidores | Ingeniera recomienda batería; Doctora, escudo de regolito | "Enterrar la base bajo regolito da más blindaje" (Zhang et al. 2020) |
| 4b | *Mala suerte (no sale en la semilla dorada):* se avería la antena (§7) | **Reparar** con salida al exterior (cuesta 🛡️ y 🫁) o seguir sin Tierra | Ingeniera | — (avería de juego, sin cifra) |
| 5 | Llega la tormenta real de mayo de 2024 → pausa + tarjeta de fuente | — | Meteoróloga lee las fases de DONKI | FLR X2.2, CME 1330 km/s, SEP, Kp 9 en la Tierra (DONKI) |
| 6 | **Dilema de la batería** (§6). Iris (dañada) lee mal el blindaje | Refugio / subir escudo / aguantar / preguntar a la Tierra | Doctora vs Ingeniera; Iris equivocada | CRaTER, **en órbita alrededor de la Luna, no en el suelo**: la radiación subió ×206 (OSDR RadLab) |
| 7 | Envía telemetría; la respuesta llega en **1 tick** (en Jezero, 2) | Enviar ahora (cuesta ⚡ de una batería que no se recarga) o esperar al amanecer | Control de Misión (casi sin retraso) | ≈1,3 s Luna–Tierra vs 3,0–22,3 min Marte–Tierra (cálculo; #66) |
| 8 | Sale el sol. Cadena de causas + tarjeta de ciencia "una tormenta, tres lugares" + pregunta | — | Iris resume | Kp 9 **en la Tierra** (índice terrestre) · ×206,3 en órbita alrededor de la Luna, no en el suelo · Marte sin aumento (DONKI, RadLab) |

**Fin:** gana si llega al paso 8 (amanecer) con los 3 medidores > 0. Si alguno llega a 0: **rescate de entrenamiento**, cadena de causas y reintento, como en Jezero.

**Cómo se cuenta la noche (propuesta para diseño y motor):** del paso 2 al 7 es de noche y `panel_solar` no da energía. En el paso 8 amanece y el panel empieza a rendir. Así el panel no es inútil (gana la partida siguiente si se juega más días), pero no salva esta noche. Si motor no puede apagar el panel por hora, plan B en §9.

### Claves i18n de los pasos (inglés primero)

| Clave | en | es |
|---|---|---|
| `mision.lunaVisible.nombre` | Moon Base: The Long Night | Base lunar: la noche larga |
| `mision.lunaVisible.paso1` | Earth is right above you! It never moves far from that spot. | ¡La Tierra está justo arriba! Casi nunca se mueve de ahí. |
| `mision.lunaVisible.paso2` | It's night down there. Draw a path for the lander. | Allá abajo es de noche. Dibuja el camino del módulo. |
| `mision.lunaVisible.paso3` | Pick a place to land. Each one is good at something different. | Elige dónde aterrizar. Cada lugar es bueno en algo distinto. |
| `mision.lunaVisible.paso4` | Build 2 modules. Remember: no sunlight until morning! | Construye 2 módulos. Recuerda: ¡no hay sol hasta la mañana! |
| `mision.lunaVisible.paso5` | A real solar storm from May 2024 is coming! | ¡Llega una tormenta solar real de mayo de 2024! |
| `mision.lunaVisible.paso6` | The crew doesn't agree. What do we do? | La tripulación no se pone de acuerdo. ¿Qué hacemos? |
| `mision.lunaVisible.paso7` | Call Earth! On the Moon, the answer comes in about one second. | ¡Llama a la Tierra! Desde la Luna, la respuesta llega en un segundo, más o menos. |
| `mision.lunaVisible.paso8` | Sunrise! You made it through the night. | ¡Amanece! Aguantaron toda la noche. |

## 3. Sitios candidatos (paso 3)

Los tres son lugares donde aterrizaron misiones Apolo. La posición viene de la capa `CombinedNomenclature` de Moon Trek (pendiente de aprobación de Daniel, fuente fuera de la lista). El terreno se sacó del DEM global LOLA de 128 píxeles por grado (`LRO_LOLA_DEM_Global_128ppd_v04`, Moon Trek, unos 237 m por píxel), en un cuadro de 0,5° × 0,5° alrededor de cada sitio (64 × 64 píxeles). Es un cálculo del equipo hecho a mano, sin script en el repo todavía (§8). La hora del amanecer sale de los datos de fase y libración 2024 de NASA SVS: el sol sale cuando su punto debajo (subsolar) queda a menos de 90° del sitio. Es un horizonte plano de un sitio de una hora, sin montañas, y el SVS está fuera de la lista oficial (§10).

> **Pendiente de aprobación de Daniel (fuente fuera de la lista):** todo lo que sale de Moon Trek (posiciones y DEM de los Apolo), del SVS 5187 y del nomenclátor de USGS. Las pendientes y relieves son **NO VERIFICADO (sin script)**. **Plan B sin aprobación:** la misión funciona igual con **valores de juego** (plano/luz/blindaje como alto/medio/bajo, sin coordenadas, sin fechas de amanecer, sin altura de la Tierra en grados y sin mapa real).

| Id propuesto | Lugar (Moon Trek) | Plano | Luz después de la tormenta | Blindaje natural | La Tierra en el cielo* |
|---|---|---|---|---|---|
| `llanura-tranquilidad` | Junto al módulo del Apolo 11 (0,674° N, 23,473° E), en Mare Tranquillitatis | **Alto:** pendiente media 1,1°, relieve 270 m | **Alto:** amanece primero (13 may 2024, ~21:00 UT) | **Bajo:** llanura abierta, nada tapa el cielo | 71° de altura |
| `tierras-altas-descartes` | Junto al módulo del Apolo 16 (8,973° S, 15,501° E), cerca del cráter Descartes | **Medio:** pendiente media 3,7°, relieve 689 m | **Medio:** amanece el 14 may, ~13:00 UT | **Medio:** lomas y cráteres alrededor | 80°, casi encima |
| `borde-rima-hadley` | Junto al módulo del Apolo 15 (26,132° N, 3,633° E), entre Mons Hadley y Rima Hadley | **Bajo:** pendiente media 5,1° (el punto de aterrizaje tiene 0,9°), relieve 1497 m | **Bajo:** amanece el último (15 may, ~11:00 UT), y las montañas pueden retrasarlo (NO VERIFICADO) | **Alto:** montañas y el canal de la rima tapan parte del cielo | 57°, la más baja |

\* Altura de la Tierra sobre el horizonte el 11 may 2024 a las 12:00 UT: 90° menos el ángulo entre el sitio y el punto sub-Tierra del SVS (cálculo). La Tierra se mueve unos pocos grados en el mes (libración: el punto sub-Tierra pasó de 2,6° E a 6,1° E entre el 7 y el 11 de mayo, SVS). Sirve para el dibujo; no es un criterio.

**"Blindaje natural = relieve que tapa el cielo" es una regla de juego**, la misma de Jezero (`design/src/sitio.ts`), no una medición de dosis. Ninguna fuente dice cuánto protege una montaña lunar. **Ningún sitio gana en los tres:** Tranquilidad gana plano y luz pero pierde blindaje; Hadley gana blindaje y pierde los otros dos; Descartes es término medio.

| Clave | en | es |
|---|---|---|
| `mision.lunaVisible.sitio.llanura-tranquilidad.porque` | Flat and the Sun comes up here first, but there is nothing around to block the storm. Apollo 11 landed here! | Plano y aquí sale el sol primero, pero no hay nada alrededor que tape la tormenta. ¡Aquí aterrizó el Apolo 11! |
| `mision.lunaVisible.sitio.tierras-altas-descartes.porque` | Bumpy hills, a bit of everything. Earth is almost straight above you. Apollo 16 landed here! | Lomas con baches, un poco de todo. La Tierra queda casi encima. ¡Aquí aterrizó el Apolo 16! |
| `mision.lunaVisible.sitio.borde-rima-hadley.porque` | Big mountains block part of the sky, but landing is harder and the Sun comes up last. Apollo 15 landed here! | Grandes montañas tapan parte del cielo, pero aterrizar es más difícil y el sol sale de último. ¡Aquí aterrizó el Apolo 15! |

Costos de aterrizaje sugeridos (valores de juego, como en Jezero): Tranquilidad ⚡−3 🛡️−8; Descartes ⚡−6 🛡️−4 y luego 🫁+2; Hadley ⚡−10 🫁−2 y luego 🛡️+6. **Diferencia con Jezero:** aquí ningún sitio devuelve ⚡ con retraso, porque es de noche en todos.

## 4. Módulos (paso 4, elige 2 de 5)

Montar cualquiera cuesta `COSTOS_ACCION.colocar_modulo` (⚡−6 🫁−3). Beneficios = `MODULOS` actuales salvo donde se dice.

| Módulo (`Equipment`) | Beneficio | Costo | Por qué importa aquí | Tarjeta de ciencia (fuente) |
|---|---|---|---|---|
| `bateria` | ⚡ +8 que **sí** sirve de noche (sin 🛡️: criterio de DD-07) | ⚡ al montarla (base) | Es la única energía hasta el amanecer | La noche dura ≈14,8 días (NSSDC; cálculo). Cuánta batería necesita una base: NO VERIFICADO, no se dice |
| `panel_solar` | ⚡ +14, **pero solo desde el amanecer (paso 8)** | base | Trampa honesta: es el mejor módulo de Jezero y aquí no salva la noche | En la Luna llega tanta luz del Sol como a la Tierra: 1361,0 W/m² (NSSDC) |
| `escudo` | 🛡️ +14 | ⚡ −3 | Regolito apilado sobre la base | Las bases bajo capas de regolito tienen más blindaje (Zhang et al. 2020) |
| `antena` | Sin 🛡️ (una antena no blinda; mismo criterio que DD-07): aviso temprano de la tormenta (1 tick antes) y `enviar_telemetria` más barata (valores de juego) | ⚡ −1 | La Tierra se ve siempre, el aviso llega rápido | ≈1,3 s de retraso (cálculo NSSDC) |
| `reciclador_agua` | 🫁 +12 | ⚡ −1 | Agua y aire para toda la noche | "El agua se recicla" sin cifra; la tarjeta queda `fuenteKey: null` como en Jezero |

Se quita `invernadero` (sin luz durante 14 días, las plantas necesitarían lámparas: diseño decide; sin fuente, NO VERIFICADO). El +2 de 🛡️ de `bateria` (DD-07) **no tiene sentido físico**: se pide a diseño dejarlo en 0 para esta misión, igual que en las demás propuestas (polo norte, polo sur, outpost).

Prueba que diseño debe pasar (con Jaime): con la semilla dorada de esta misión, **ninguna de las 10 parejas pasa la tormenta sin perder algo**. Pareja tentadora a vigilar: `bateria` + `escudo`, que parece "la receta". Debe costar 🫁 (no hay reciclador) para que no lo sea.

## 5. La tormenta: Gannon, mayo de 2024 (`2024-05-10-gannon`)

Ya curada en `data/curated/2024-05-10-gannon.json` [V]. Fases (DONKI): FLR X2.2 `2024-05-09T08:45:00-FLR-001` (pico 09:13Z) → CME `2024-05-09T09:24:00-CME-001` a 1330 km/s → SEP `2024-05-10T13:35:00-SEP-001` (GOES, en la Tierra) → GST `2024-05-10T15:00:00-GST-001`, **Kp 9 en la Tierra** (índice terrestre de NOAA, no una medida en la Luna). Región activa 13664.

**Por qué esta y no otra:**
1. **Es la mejor medición lunar que tenemos.** CRaTER (LRO, NASA), **en órbita alrededor de la Luna, no en el suelo**: fondo 5,2 → media diaria **1082,5 µGy/h** el 11 may (×206,3; mayor muestra 1928,6), con **fondo tranquilo** (`data/ciencia/luna.json`, PR #95). La otra gran candidata, X8.2 del 10 sep 2017 (`pico` 19 481,6 µGy/h, la mayor media diaria), tiene `fondoTranquilo: false`, así que su factor no se muestra. Esa es la que ahora usa el polo sur (PR #98).
2. **Le pasó de noche al lado visible.** Según los datos SVS, el 11 may a las 12:00 UT el Sol estaba sobre la cara oculta (punto subsolar en 142,4° E) y la Luna tenía 3,36 días de edad. Los tres sitios estaban de noche y amanecieron entre el 13 y el 15 de mayo (§3). Esta coincidencia es real, no inventada para el juego. **Ojo:** la fuente es SVS, fuera de la lista oficial (§10).
3. **"Una tormenta, tres lugares".** La misma tormenta dio Kp 9 en la Tierra, ×206 en órbita alrededor de la Luna y **nada** en Marte (RAD: fondo 4,8 → 4,9, ×1,0, `medicionMarte` del mismo archivo). Desde el lado visible se ve la Tierra que también la estaba recibiendo.

**Cómo se dice (reglas):** la cifra de CRaTER es dosis **absorbida** (µGy/h) y se midió **en órbita, no en el suelo**. No se suma ni se compara con los mSv/día de la Doctora. Al niño se le da el factor ("unas 200 veces más que un día normal"), que no tiene unidad. La única dosis de superficie que existe (LND, Chang'e-4, **CNSA**, 1369 µSv/día) se midió **en la cara oculta** (cráter Von Kármán) y **sin tormentas solares** ("no SPE was observed", Zhang et al. 2020). Sirve de fondo "día normal", nunca como dosis de esta tormenta. El polo sur ya no usa Gannon: ahora usa la del 10 sep 2017 (PR #98), así que no hay choque.

| Clave | en | es |
|---|---|---|
| `mision.lunaVisible.tormenta.aviso` | Real data from May 2024 (curated, not live): a big storm hit Earth and the Moon. | Datos reales de mayo de 2024 (curados, no en vivo): una gran tormenta llegó a la Tierra y a la Luna. |
| `mision.lunaVisible.tormenta.crater` | A NASA spacecraft in orbit around the Moon, not on the ground, measured about 200 times more radiation than on a normal day. | Una nave de NASA en órbita alrededor de la Luna, no en el suelo, midió unas 200 veces más radiación que en un día normal. |

## 6. El dilema central (paso 6): ¿gastar la batería ahora o guardarla para la noche?

La tormenta llega a mitad de la noche. La batería es lo único que hay hasta el amanecer.

- **Doctora:** "Everyone into the shelter, and let's put the shield up! The radiation is way higher than normal." / "¡Todos al refugio y subamos el escudo! La radiación está mucho más alta de lo normal."
- **Ingeniera:** "If we spend the battery on the shield, we'll run out of heat before sunrise. The night here is super cold." / "Si gastamos la batería en el escudo, nos quedamos sin calefacción antes del amanecer. Aquí la noche es helada."
- **Iris (dañada):** lee el blindaje con 20 puntos de error (como en Jezero). El medidor real se ve en pantalla. Gana quien mira el medidor y no se fía de Iris.
- **Control de Misión:** contesta en 1 tick, pero llamar cuesta ⚡ (`enviar_telemetria`). Es la gran diferencia con Marte: aquí **puedes preguntar**, pero preguntar tampoco es gratis.

| Opción | Acción (contrato actual) | Lo que gana | Lo que pierde | La defiende |
|---|---|---|---|---|
| `refugio` | `refugiarse` | 🛡️ con retraso | 🫁 y algo de ⚡ | Doctora |
| `subir_escudo` | `subir_escudo` nivel 2 | Mucho 🛡️ | Mucha ⚡ de una batería sin recarga | Doctora (2ª) |
| `ahorrar_bateria` | `esperar` | ⚡ para la noche | 🛡️ baja durante la tormenta | Ingeniera |
| `preguntar_tierra` | `enviar_telemetria` | Consejo en 1 tick y 🛡️ +6 con retraso | ⚡ −5 ahora | nadie (lo descubre el niño) |

**Sin receta:** ningún texto de ayuda dice qué elegir. La cadena de causas del paso 8 explica lo que pasó, no lo que "debía" pasar. Lo que cuesta es justo lo que sigue el niño: la ⚡ ya no vuelve esta noche.

| Clave | en | es |
|---|---|---|
| `mision.lunaVisible.dilema.pregunta` | The storm is here and the Sun won't rise for days. What do we use the battery for? | La tormenta llegó y el sol no sale en varios días. ¿Para qué usamos la batería? |
| `mision.lunaVisible.dilema.refugio` | Go to the shelter | Ir al refugio |
| `mision.lunaVisible.dilema.escudo` | Put the shield up | Subir el escudo |
| `mision.lunaVisible.dilema.ahorrar` | Save the battery for the night | Guardar la batería para la noche |
| `mision.lunaVisible.dilema.tierra` | Ask Earth for advice | Pedir consejo a la Tierra |

## 7. Mala suerte (paso 4b, no sale en la semilla dorada)

**No se usa `mala_suerte.tormenta_polvo`.** En la Luna casi no hay atmósfera (presión de noche: 3 × 10⁻¹⁵ bar, NSSDC), así que una "tormenta de polvo" como la de Marte sería un error de ciencia. Propuesta: **la antena se avería** (un fallo de equipo, sin afirmación científica). Mientras esté rota, la ventaja de la misión, que la Tierra está a un segundo, desaparece: `enviar_telemetria` no responde. Se arregla con `salida_exterior` sobre `antena` (🛡️−12 🫁−5, y peor si la tormenta ya llegó) o con `reparar`. La lección es que la comunicación es un recurso que se cuida.

| Clave | en | es |
|---|---|---|
| `mision.lunaVisible.malaSuerte.antena` | Oh no, the antenna broke! We can't talk to Earth until someone fixes it. | ¡Oh, no, se dañó la antena! No podemos hablar con la Tierra hasta que alguien la arregle. |

## 8. Final: cadena de causas, tarjeta de ciencia y pregunta

**Cadena de causas (ejemplo):** "Elegiste Tranquilidad (amanece primero) → construiste panel + escudo → de noche el panel no dio nada (decisión) → la antena se dañó (mala suerte) → en la tormenta subiste el escudo → la batería llegó a 8 al amanecer". Cada eslabón se marca **decisión** o **mala suerte**, como en Jezero.

**Tarjeta de ciencia "Una tormenta, tres lugares"** (`fuenteKey`: `fuente.donki` + `fuente.crater` + `fuente.radlab`):

| Clave | en | es |
|---|---|---|
| `mision.lunaVisible.ciencia.tresLugares` | The same storm from May 2024: on Earth it reached Kp 9 (a number measured on Earth). In orbit around the Moon, not on the ground, radiation went up about 200 times. On Mars, almost nothing changed. Same storm, different places! | La misma tormenta de mayo de 2024: en la Tierra llegó a Kp 9 (un número que se mide en la Tierra). En órbita alrededor de la Luna, no en el suelo, la radiación subió unas 200 veces. En Marte casi no cambió nada. ¡Misma tormenta, lugares distintos! |
| `mision.lunaVisible.ciencia.noche` | A night on the Moon lasts about 15 Earth days, and it gets colder than −170 °C. | Una noche en la Luna dura unos 15 días de la Tierra y hace más frío que −170 °C. |
| `mision.lunaVisible.ciencia.regolito` | Moon dust and rocks (regolith) piled on top of a base can help block radiation. | El polvo y las piedras de la Luna (regolito) apilados encima de una base ayudan a frenar la radiación. |

Nota sobre "auroras" y "Kp 9 = lo más alto de la escala": que el Kp va de 0 a 9 **NO VERIFICADO** en las fuentes de la lista (es de NOAA). Si datos no lo comprueba antes, se usa la variante sin esa frase: "on Earth it was one of the strongest storms in years" / "en la Tierra fue una de las tormentas más fuertes en años", que también es NO VERIFICADO. Plan seguro (el que queda en la tabla de arriba): "on Earth it reached Kp 9" / "en la Tierra llegó a Kp 9", siempre como índice de la Tierra. Tampoco se afirma por qué Marte casi no la vio: como mucho "una explicación posible es…" (NO VERIFICADO).

**Pregunta final** (3 opciones, nunca bloquea):

| Clave | en | es |
|---|---|---|
| `mision.lunaVisible.pregunta` | Why can you get help from Earth almost right away on the Moon, but not on Mars? | ¿Por qué desde la Luna recibes ayuda de la Tierra casi al instante y desde Marte no? |
| `mision.lunaVisible.pregunta.a` ✅ | The Moon is much closer, so messages arrive in about a second. | La Luna está mucho más cerca: los mensajes llegan en un segundo, más o menos. |
| `mision.lunaVisible.pregunta.b` | Earth only listens to the Moon. | La Tierra solo escucha a la Luna. |
| `mision.lunaVisible.pregunta.c` | Radios on Mars are older. | Las radios de Marte son más viejas. |
| `mision.lunaVisible.pregunta.explicacion` | Messages travel at the speed of light. From the Moon that takes about 1.3 seconds; from Mars, 3 to 22 minutes. | Los mensajes viajan a la velocidad de la luz. Desde la Luna tardan unos 1,3 segundos; desde Marte, de 3 a 22 minutos. |

## 9. Qué le toca a cada rol, y riesgos

- **diseño (Santiago, Camilo):** pasar §2–§8 a una `Mision` nueva (`sitio: "luna_lado_visible"`, `objetivo: "reportar_tierra"`, `tormentaId: "2024-05-10-gannon"`, `modulosDisponibles: ["bateria","panel_solar","escudo","antena","reciclador_agua"]`). Ajustar costos y textos en/es, y simular las 10 parejas.
- **motor (Jaime):** "panel apagado hasta el amanecer". Dos caminos: un campo de misión `amanecerTick` (solo datos de `missions/`, sin cambio de contrato) que el motor lea para multiplicar `panel_solar` por 0 antes de ese tick, o el plan B de diseño (el beneficio retrasado del panel llega en el paso 8). La avería de antena bloquea `enviar_telemetria` (o la hace inútil) mientras `equipos.antena = "averiado"`.
- **agentes (José):** líneas de Doctora, Ingeniera y Control de Misión para §6. La Doctora habla de "veces más que un día normal", nunca en µGy ni mSv durante la tormenta, y siempre dice "en órbita alrededor de la Luna, no en el suelo". La Meteoróloga lee las 4 fases de DONKI y dice el Kp 9 siempre como "en la Tierra".
- **datos (Daniel), para implementarse:** (1) `data/terreno/luna-visible/` con DEM LOLA + sombreado de Moon Trek y los 3 sitios con `plano/luz/blindaje`, generados por script (rehacer por código el cálculo hecho a mano de §3). (2) Script que saque las horas de amanecer de `mooninfo_2024.json` del SVS, si Daniel aprueba la fuente; si no, la "luz" se vuelve relativa al relieve, sin fechas. (3) Tarjetas `fuente.crater`, `fuente.moonTrek`, `fuente.nssdcMoon` y `fuente.lnd` (CNSA) en en/es. (4) Exportar desde `@solar-shield/data` la medición CRaTER de Gannon (PR #95).
- **ui (María Paula):** la Tierra dibujada en el cielo, fija, con su altura por sitio. Etiqueta "datos reales curados, no en vivo" en la tormenta. Sin logo de NASA.

**Riesgos:**
- **Choque con el polo sur: resuelto.** Esta se queda con Gannon (la coincidencia con la noche del lado visible es exclusiva de esta misión) y el polo sur ahora usa la del 10 sep 2017 (PR #98), sin mostrar factor porque su fondo no es tranquilo. Gannon la comparte con el outpost (PR #99).
- **SVS, Moon Trek y USGS fuera de la lista oficial (pendientes de aprobación de Daniel):** sin aprobación, se pierden las fechas de amanecer, la "noche durante la tormenta" (§5.2), las coordenadas, las pendientes y la altura de la Tierra. **Plan B:** la misión sigue funcionando con valores de juego (noche como regla de juego, sitios alto/medio/bajo, sin mapa real).
- **Moon Trek no aparece con ese nombre en la lista** (solo "Mars Trek"). Es el mismo portal (`trek.nasa.gov`, JPL). Confirmar con Daniel. Los nombres (Mare Tranquillitatis, Rima Hadley…) vienen de su capa `CombinedNomenclature`, que enlaza al nomenclátor de USGS (fuera de la lista).
- **Contrato:** no hace falta tocar `contracts/`. Si motor prefiere una acción "apagar calefacción" para el dilema, es un issue `contrato`. Por ahora el calor se representa con ⚡.
- **La palabra "aurora"** solo se usa si datos verifica la fuente (§8).

## 10. Cifras y su fuente

| Cifra | Estado | Fuente |
|---|---|---|
| Gravedad lunar 1,62 m/s² (no se usa en la misión; disponible) | [V] | https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html (11 ene 2024) |
| Irradiancia solar 1361,0 W/m² (igual que la Tierra) | [V] | ídem |
| Periodo sinódico 29,53 días → ≈14,8 días de luz y ≈14,8 de noche | [V] + cálculo | ídem |
| Rotación 655,720 h = vuelta 27,3217 días → misma cara hacia la Tierra | [V] + cálculo | ídem |
| Temperatura en el ecuador 95–390 K (≈ −178 °C a 117 °C) | [V] + conversión | ídem |
| Distancia media 384 400 km → ≈1,3 s de retraso (1,28 s; c = 299 792,458 km/s, definición del SI) | [V] + cálculo | ídem |
| Presión de superficie de noche 3 × 10⁻¹⁵ bar | [V] | ídem |
| Retraso Marte–Tierra 3,0–22,3 min | [V] + cálculo | NSSDC; `data/src/comunicaciones.ts`, PR #65 / issue #66 |
| Gannon: FLR X2.2, CME 1330 km/s, SEP, GST con Kp 9 **en la Tierra** (índice terrestre), región 13664, IDs de §5 | [V] | `data/curated/2024-05-10-gannon.json`; https://ccmc.gsfc.nasa.gov/DONKI/view/GST/30693/-1 |
| CRaTER Gannon: fondo 5,2 → 1082,5 µGy/h (×206,3), muestra 1928,6, fondo tranquilo, **en órbita alrededor de la Luna, no en el suelo; dosis absorbida** | [V] | `data/ciencia/luna.json` (PR #95); https://visualization.osdr.nasa.gov/radlab/api/?instrument_id=CRaTER-D1D2&timestamp>=2024-05-04T09:13&timestamp<2024-05-12T09:13&absorbed_dose_rate>0&format=json |
| CRaTER 10 sep 2017: `pico` 19 481,6 µGy/h (la mayor media diaria, 11 sep), fondo no tranquilo → el ×27 no se muestra (la usa el polo sur, PR #98) | [V] | ídem, `2017-09-10-x82` |
| RAD Marte en Gannon: 4,8 → 4,9 µGy/h (×1,0) | [V] | `data/curated/2024-05-10-gannon.json` (`medicionMarte`), OSDR RadLab |
| LND Chang'e-4 (**CNSA**): 1369 µSv/día; ISS 731 µSv/día; cara oculta (Von Kármán); sin SPE en el periodo | [V] | Zhang et al. 2020, https://pmc.ncbi.nlm.nih.gov/articles/PMC7518862/ (ya usada en `data/ciencia/radiacion.json`) |
| "Bases enterradas bajo regolito tendrán más blindaje" (y más neutrones) | [V] | ídem |
| Posiciones Apolo 11 (0,674° N, 23,473° E), 15 (26,132° N, 3,633° E), 16 (8,973° S, 15,501° E) | **Pendiente de aprobación de Daniel (fuente fuera de la lista)**; sin ella, plan B con valores de juego | Moon Trek `CombinedNomenclature` y `ApolloNN_waypoints`: https://trek.nasa.gov/moon/trekarcgis/rest/services/CombinedNomenclature/MapServer — confirmar que Moon Trek cuenta como "Mars Trek" de la lista |
| Mare Tranquillitatis, Mons Hadley, Rima Hadley (tamaño 116 km en la capa), Descartes: nombres y posiciones | **Pendiente de aprobación de Daniel (fuente fuera de la lista)** | ídem; origen USGS Gazetteer (https://planetarynames.wr.usgs.gov) — **fuente fuera de la lista oficial — requiere aprobación de Daniel** |
| Pendiente media y relieve: 1,1° / 270 m; 3,7° / 689 m; 5,1° / 1497 m (centro de Hadley 0,9°) | **NO VERIFICADO (sin script)**, calculado a mano · DEM de Moon Trek: **pendiente de aprobación de Daniel (fuente fuera de la lista)** | DEM `LRO_LOLA_DEM_Global_128ppd_v04` de Moon Trek (`exportImage`, cuadros de 0,5°). Falta script en el repo |
| Amaneceres 13 may ~21:00, 14 may ~13:00, 15 may ~11:00 UT; noche en Apolo 11 del 29 abr 04:00 al 13 may 21:00 (≈14,7 días); Sol subsolar 142,4° E y edad 3,36 días el 11 may 12:00 UT | Cálculo sobre datos NASA · **pendiente de aprobación de Daniel (fuente fuera de la lista)** | NASA SVS 5187, https://svs.gsfc.nasa.gov/5187 (`mooninfo_2024.json`). Horizonte plano, resolución de 1 h |
| Altura de la Tierra 71° / 80° / 57°; libración del punto sub-Tierra 2,6° E → 6,1° E (7–11 may) | Cálculo sobre datos NASA · **pendiente de aprobación de Daniel (fuente fuera de la lista)** | ídem |
| Las montañas de Hadley retrasan el amanecer | **NO VERIFICADO** | — |
| Cuánto protege una montaña o una pared (blindaje natural) | **NO VERIFICADO** (regla de juego) | — |
| Que el Kp va de 0 a 9 y que hubo auroras | **NO VERIFICADO** | (sería NOAA, fuera de la lista) |
| Plantas sin luz 14 días / batería necesaria para una noche | **NO VERIFICADO** | — |
| Costos de sitios y módulos, ticks, error de Iris | Valor de juego | `design/src/recursos.ts` |
