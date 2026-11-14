# Misión Luna polo sur (`luna_polo_sur`): hielo en la sombra, luz en las crestas

**Rol que propone:** datos (Daniel) · **Dueños de la misión:** diseño (Santiago y Camilo) · **Estado:** propuesta · **Fecha:** 2026-11-14
**Destino:** `missions/src/luna-polo-sur.ts` + `design/src/recursos.ts` (ya trae `luna_polo_sur`: ⚡65 🫁75 🛡️55, consumo ⚡-3 🫁-2 🛡️-2, retraso de comunicaciones 1 tick). Este documento no toca esas carpetas: allí lo implementa diseño.
**Modelo:** misma estructura que la misión 1 (`docs/ideas/mision-1-ares-mejorada.md`, PR #88). Tormenta y medición: PR #95 (`data/ciencia/luna.json`).

> Convención de cifras: **[V]** = verificado, con la URL en la tabla final (§12). **NO VERIFICADO** = no se usa en pantalla. **Valor de juego** = número de balance (0-100) que no es dato de NASA y nunca se presenta como tal. **Fuera de lista** = fuente de NASA que no está en la pestaña Resources del reto: requiere aprobación de Daniel antes de entrar a la UI.
> Ninguna cifra de este documento está "en vivo": todo es **datos reales curados, no en vivo**.

## 1. Por qué esta misión enseña algo distinto a Jezero

| Tema | Jezero (Marte) | Luna polo sur | Lección nueva |
|---|---|---|---|
| La misma tormenta (mayo 2024, "Gannon") | RAD en la superficie de Marte: fondo 4,8 → 4,9 µGy/h, factor **1,0** [V] | CRaTER en **órbita lunar**: fondo 5,2 → 1082,5 µGy/h, factor **206,3** [V] | Una tormenta no golpea igual en todas partes: depende de hacia dónde viaja la nube del Sol. *No* se explica por la atmósfera de Marte (ver §10) |
| Aire | Atmósfera delgada | Casi nada: presión de noche 3 × 10⁻¹⁵ bar [V] | En la Luna no hay "cobija de aire" alrededor de la base |
| Mensajes a la Tierra | 3–22 min (PR #65) | ≈ 1,3 s (cálculo con 384 400 km [V]) | Control de Misión responde casi al instante: verificar es barato, **y aun así cuesta energía** |
| Recurso clave | Luz y polvo | **Hielo en sombras que nunca reciben sol** vs. **luz en las crestas** (fuera de lista) | Lo que necesitas (agua) está justo donde no hay lo otro que necesitas (luz) |
| Gravedad | 3,73 m/s² [V] | 1,62 m/s², 0,165 de la Tierra [V] | (Solo tarjeta de ciencia; no mueve medidores) |
| Ciclo día-noche | 24,66 h [V] | 29,53 días (periodo sinódico) [V] | Las baterías importan más que en Marte |

**Mensaje central para el niño:** *"En la Luna el agua está escondida en la oscuridad y la energía vive en la luz. Tienes que elegir qué tener cerca."*

## 2. La misión, paso a paso (8 pasos, ~2-3 min)

Recursos 0-100 (`design/src/recursos.ts`). Arranca con ⚡65 🫁75 🛡️55 (valores de juego que ya están en develop). Objetivo sugerido (`MissionGoal`): `explorar`. Dificultad de la demo: `media`. Tormenta: `2024-05-10-gannon`.

| Paso | Qué pasa | Decisión del niño (con costo) | Quién habla | Dato científico (fuente) |
|---|---|---|---|---|
| 1 | La nave llega a la Luna; el satélite se suelta y orbita | — | Iris (nivel 1) presenta a la tripulación | Distancia media 384 400 km [V NSSDC] |
| 2 | El satélite pasa sobre el polo sur. Ve cráteres con sombra que nunca se va | **Pasada baja** sobre las sombras (más detalle de hielo, gasta ⚡ de batería) o **pasada alta** (barata, menos detalle: los criterios del paso 3 salen como "?") | Meteoróloga avisa de la actividad del Sol; Ingeniera cuida la batería | Regiones en sombra permanente con hielo de agua [fuera de lista, science.nasa.gov]. Mapa: **solo si se aprueba Moon Trek** (§10); si no, ilustración marcada "dibujo, no mapa real" |
| 3 | 4 sitios candidatos con 3 criterios: ☀️ **luz**, 🧊 **hielo cerca**, 🏔️ **terreno plano** | Ninguno gana en los tres (tabla §3) | Ingeniera (luz), Doctora (refugio, pendiente), Meteoróloga (sombras) | Las 13 regiones de Artemis III tienen sitios con sol continuo durante 6,5 días [fuera de lista, nasa.gov] |
| 4 | Aterriza y elige **2 de 5 módulos** | Ver §4; cada uno mueve 2 medidores | Ingeniera recomienda batería; Doctora, escudo | Un ciclo de día y noche dura 29,53 días terrestres [V NSSDC] |
| 4b | *Mala suerte (30 %):* ver §6 | Reparar o aguantar | Ingeniera | — |
| 5 | Llega la tormenta real de mayo 2024 → pausa + **dos** tarjetas de fuente (DONKI y CRaTER) | — | Meteoróloga lee el evento de DONKI; Doctora lee la cifra de CRaTER | Cadena DONKI: FLR X2.2 → CME 1330 km/s → SEP → GST Kp 9 [V]. CRaTER ×206,3 **en órbita** [V] |
| 6 | **Dilema del hielo** (§5): la expedición al cráter está a medio camino | Volver al refugio / terminar la expedición / subir escudo | Doctora vs Ingeniera; Iris dañada lee mal el medidor | Sin aire que frene: presión 3 × 10⁻¹⁵ bar [V NSSDC] (la relación aire→radiación es explicación, no cifra) |
| 7 | Envía telemetría a la Tierra; Control de Misión responde **en 1 tick** (en Marte eran 2) | Preguntar a Control ahora (cuesta ⚡) o decidir solo | Control de Misión (casi sin retraso) | Luz tarda ≈ 1,3 s Luna–Tierra (cálculo: 384 400 km ÷ velocidad de la luz) |
| 8 | Cadena de causas (decisión vs. mala suerte) + tarjeta de ciencia con 3 opciones, nunca bloquea | — | Iris resume | Ver §7 |

**Fin:** igual que Jezero (`exitoCuando: "telemetria_llega"`, `falloCuando: "recurso_en_cero"`, `tickLimite: 10`). Si algo llega a 0: **rescate de entrenamiento**, cadena de causas y reintentar el día. Nunca "Game Over".

### Textos del recorrido (inglés primero, español después)

| Clave sugerida | en | es |
|---|---|---|
| `mision.luna.nombre` | Moon South Pole | Polo sur de la Luna |
| `mision.luna.paso1` | Arrive at the Moon | Llegar a la Luna |
| `mision.luna.paso2` | Look for the shadows | Busca las sombras |
| `mision.luna.paso2.bajo` | Fly low: see the ice better, but use battery | Vuela bajo: ves mejor el hielo, pero gastas batería |
| `mision.luna.paso2.alto` | Fly high: save battery, but see less | Vuela alto: ahorras batería, pero ves menos |
| `mision.luna.paso3` | Pick a landing spot | Elige dónde aterrizar |
| `mision.luna.paso4` | Build your base | Arma tu base |
| `mision.luna.paso5` | A real solar storm is coming! | ¡Viene una tormenta solar real! |
| `mision.luna.paso6` | The ice trip: go on or go back? | El viaje al hielo: ¿seguir o volver? |
| `mision.luna.paso7` | Call Earth | Llama a la Tierra |
| `mision.luna.paso8` | What happened and why | Qué pasó y por qué |
| `mision.luna.intro` | Here, water hides in the dark and energy lives in the light. You must choose what to keep close. | Aquí el agua se esconde en la oscuridad y la energía vive en la luz. Tienes que elegir qué tener cerca. |

## 3. Sitios candidatos (paso 3)

Los criterios son **valores de juego** (bajo / medio / alto), no medidas. Los nombres son descriptivos e inventados por nosotros; **no** usamos nombres de las regiones de Artemis III salvo que Daniel apruebe la fuente (y aun así, sin decir "aquí aterrizará Artemis").

| Id sugerido | ☀️ Luz | 🧊 Hielo cerca | 🏔️ Plano | Costo de aterrizaje (`EfectoOpcion`, valor de juego) | Por qué cuesta eso |
|---|---|---|---|---|---|
| `cresta-soleada` | alto | bajo | medio | inmediato ⚡-3 🫁-6 · retrasado ⚡+6 | Mucho sol para los paneles, pero el hielo queda lejos: traer agua cuesta |
| `borde-del-crater-oscuro` | medio | alto | bajo | inmediato ⚡-8 🛡️-4 · retrasado 🫁+6 | El hielo está al lado, pero la pendiente hace difícil bajar y montar la base |
| `llanura-entre-crateres` | bajo | medio | alto | inmediato ⚡-4 🫁-2 · retrasado 🛡️+3 | Aterrizar es fácil, pero las colinas tapan el sol bajo buena parte del tiempo |
| `macizo-alto` | alto | medio | bajo | inmediato ⚡-10 🫁-3 · retrasado ⚡+4 🛡️+2 | Alto y soleado, con algo de hielo a la vista, pero llegar ahí es carísimo |

Prueba que diseño debe pasar (como en Jezero): **ningún sitio domina** a otro en los 3 criterios, y con la tormenta del paso 5 existe más de un sitio razonable.

| Clave | en | es |
|---|---|---|
| `mision.luna.sitio.cresta-soleada.nombre` | Sunny ridge | Cresta soleada |
| `mision.luna.sitio.cresta-soleada.porque` | Lots of sunlight for the panels, but the ice is far away. Bringing water costs energy and time. | Mucho sol para los paneles, pero el hielo está lejos. Traer agua cuesta energía y tiempo. |
| `mision.luna.sitio.borde-del-crater-oscuro.nombre` | Edge of the dark crater | Borde del cráter oscuro |
| `mision.luna.sitio.borde-del-crater-oscuro.porque` | The ice is right next to you, but the ground is steep. Landing is hard. | El hielo está al lado, pero el suelo está inclinado. Aterrizar es difícil. |
| `mision.luna.sitio.llanura-entre-crateres.nombre` | Plain between craters | Llanura entre cráteres |
| `mision.luna.sitio.llanura-entre-crateres.porque` | Easy and flat to land on, but hills hide the Sun for a long time. | Plana y fácil para aterrizar, pero las colinas tapan el Sol mucho rato. |
| `mision.luna.sitio.macizo-alto.nombre` | High mountain | Montaña alta |
| `mision.luna.sitio.macizo-alto.porque` | High and sunny, with some ice in sight, but getting there costs a lot. | Alta y soleada, con algo de hielo a la vista, pero llegar ahí cuesta mucho. |
| `mision.luna.criterio.luz` | Sunlight | Luz del Sol |
| `mision.luna.criterio.hielo` | Ice nearby | Hielo cerca |
| `mision.luna.criterio.plano` | Flat ground | Terreno plano |

## 4. Módulos (paso 4: elige 2 de 5)

Montar cualquiera cuesta lo de `COSTOS_ACCION.colocar_modulo` (⚡-6 🫁-3). El beneficio llega con retraso (1-2 ticks). Todos son `Equipment` que **ya existen** en el contrato: no hay que cambiarlo. Números = tabla `MODULOS` actual o propuesta (valor de juego).

| Módulo (`Equipment`) | Beneficio | Costo extra | Qué significa en la Luna | Lección (con fuente) |
|---|---|---|---|---|
| `panel_solar` | ⚡ +14 | rinde la mitad en `llanura-entre-crateres` (sombra) | Paneles de lado, porque el Sol está bajo en el polo (explicación; detalle NO VERIFICADO) | Llega la misma luz del Sol que a la Tierra: 1361,0 W/m² [V NSSDC] |
| `bateria` | ⚡ +8 🛡️ +2 | sin costo por tick (ya en `MODULOS`) | Guarda energía para cuando el sitio queda en sombra | Un ciclo día-noche dura 29,53 días [V NSSDC] |
| `reciclador_agua` | 🫁 +12 | ⚡ -2 por tick; +4 🫁 extra si el sitio tiene 🧊 alto | Derrite y limpia hielo del cráter, y recicla el agua | Hay hielo de agua en cráteres oscuros de los polos [fuera de lista] |
| `escudo` | 🛡️ +14 | ⚡ -3 por tick | Paredes cubiertas con tierra lunar | La superficie lunar recibe 1369 µSv/día de fondo (Chang'e-4, **CNSA**) [V] |
| `invernadero` | 🫁 +10 | ⚡ -2 por tick | Plantas con luz artificial | Material de producción de alimentos de la **CSA** (socio, no NASA): **NO VERIFICADO**, pendiente de leer |

`antena` no se ofrece en esta misión: en la Luna el retraso es de ≈1,3 s y la antena aporta poco. Eso también enseña algo (diseño decide si la deja como 6.ª opción).

**Prueba de diseño:** con 2 módulos, ninguna de las 10 parejas gana sin perder algo en la tormenta del paso 5 (semilla dorada; con Jaime).

| Clave | en | es |
|---|---|---|
| `mision.luna.modulo.bateria.porque` | The Sun can hide behind hills. A battery keeps energy for later. | El Sol se puede esconder detrás de las colinas. La batería guarda energía para después. |
| `mision.luna.modulo.reciclador_agua.porque` | It melts ice from the dark crater and cleans the water again and again. | Derrite hielo del cráter oscuro y limpia el agua una y otra vez. |
| `mision.luna.modulo.escudo.porque` | Moon dirt on the walls blocks part of the radiation. | La tierra lunar en las paredes bloquea parte de la radiación. |
| `mision.luna.modulo.panel_solar.porque` | The Moon gets as much sunlight as Earth, but here the Sun stays low in the sky. | A la Luna le llega tanta luz del Sol como a la Tierra, pero aquí el Sol se queda bajito en el cielo. |
| `mision.luna.modulo.invernadero.porque` | Plants make food and some air, but they need light and power. | Las plantas dan comida y algo de aire, pero necesitan luz y energía. |

> "El Sol se queda bajito en el cielo" del polo es una explicación geométrica (NO VERIFICADO con una fuente). Si Daniel no la aprueba, se usa la versión corta: "but here hills can hide the Sun" / "pero aquí las colinas pueden tapar el Sol".

## 5. La tormenta real elegida: `2024-05-10-gannon`

**Por qué esta y no otra:**
1. Es la única tormenta del catálogo con **fondo tranquilo** en CRaTER (`fondoTranquilo: true`): 5,2 → 1082,5 µGy/h de media diaria el 11 may 2024, factor **206,3** [V]. Las demás tienen el fondo contaminado (2017-09-10: ×27 con fondo inflado) o sin datos (octubre de 2024).
2. En Marte, RAD **no vio nada** (factor 1,0) [V]. Comparar las dos misiones enseña que el lugar importa.
3. Su cadena en DONKI está completa: FLR X2.2 (`2024-05-09T08:45:00-FLR-001`) → CME 1330 km/s (`2024-05-09T09:24:00-CME-001`) → SEP (`2024-05-10T13:35:00-SEP-001`) → GST Kp 9 (`2024-05-10T15:00:00-GST-001`, Kp de NOAA) [V].

**Cómo se dice bien (obligatorio):**
- CRaTER va en el **Lunar Reconnaissance Orbiter, en órbita alrededor de la Luna, no en la superficie**. La base del juego está en la superficie: la tarjeta dice "near the Moon / cerca de la Luna", nunca "en tu base".
- 1082,5 µGy/h es **dosis absorbida** (µGy). No se convierte a mSv ni se suma a `dosisMSv` del tripulante. La dosis de fondo en mSv/día de la superficie (1,369) es de **Chang'e-4 / LND, CNSA**, y se atribuye así.
- El pico de muestra (1928,6 µGy/h) existe en `luna.json`, pero para niños se usa la media diaria y el factor "unas 200 veces".
- Estado: "datos reales curados, no en vivo".

| Clave | en | es |
|---|---|---|
| `mision.luna.tormenta.aviso` | This storm really happened in May 2024. Near the Moon, radiation went up about 200 times! | Esta tormenta pasó de verdad en mayo de 2024. ¡Cerca de la Luna, la radiación subió unas 200 veces! |
| `mision.luna.tormenta.orbita` | A NASA spacecraft measured it while flying around the Moon, not on the ground. | Una nave de NASA la midió mientras volaba alrededor de la Luna, no en el suelo. |
| `mision.luna.tormenta.marte` | The same storm hardly changed anything on Mars. It was not heading that way. | La misma tormenta casi no cambió nada en Marte. No iba para allá. |

> `mision.luna.tormenta.marte`: "no iba para allá" es una **interpretación**, no una medición. Lo medido es el factor 1,0 de RAD. Si Daniel no la aprueba, se queda solo "hardly changed anything on Mars / casi no cambió nada en Marte".

## 6. Dilema central (paso 6), sin receta

Antes de la tormenta, el niño mandó a dos tripulantes al cráter oscuro a traer hielo (si eligió `reciclador_agua` o el sitio con 🧊 alto; si no, la misión le pide el viaje porque el 🫁 baja). Cuando llega la tormenta están a medio camino.

| Opción | Acción existente | Efecto (valor de juego) | Lo que se pierde |
|---|---|---|---|
| **Volver al refugio ya** | `refugiarse` | 🫁-6 ⚡-3 ya, 🛡️+12 después | El hielo no llega: 🫁 sigue bajando los próximos ticks |
| **Terminar la expedición** | `salida_exterior` (objetivo `reciclador_agua`) | 🛡️-12 🫁-5 ya; ⚡ +15 → propuesta: 🫁 en lugar de ⚡ (ver §10) | La tripulación queda expuesta durante el pico |
| **Subir el escudo y esperar** | `subir_escudo` nivel 2 | ⚡-16 ya, 🛡️+10 después (+20 si motor también multiplica el beneficio por el nivel) | Casi sin energía para la noche que viene |

Lo que dice cada uno (para agentes; José escribe la versión final):
- **Doctora:** "Back inside, now! The Moon has almost no air to slow radiation down." / "¡Adentro, ya! La Luna casi no tiene aire que frene la radiación."
- **Ingeniera:** "If they come back empty, we run out of water tomorrow." / "Si vuelven con las manos vacías, mañana nos quedamos sin agua."
- **Meteoróloga (dramática):** "This is one of the biggest storms in years!" / "¡Es de las tormentas más grandes en años!" (Kp 9 [V]; "más grande en años": NO VERIFICADO, que lo diga solo si datos lo confirma)
- **Iris (dañada, nivel 3):** lee 🛡️ con 20 puntos de error (`averiaIris.errorLectura: 20`, igual que Jezero): "Shield is fine, keep going!" / "¡El blindaje está bien, sigan!" mientras el medidor dice otra cosa.
- **Control de Misión:** contesta en **1 tick**. Es la gran diferencia con Marte: verificar es rápido, pero cuesta `enviar_telemetria` (⚡-5 🫁-1).

Ninguna opción es correcta siempre: depende del sitio y los módulos. La cadena de causas del paso 8 explica la que eligió.

## 7. Mala suerte (paso 4b, 30 %, nunca en la semilla dorada)

| Evento | Qué pasa (valor de juego) | Opciones | Fuente |
|---|---|---|---|
| **Micrometeorito** (ya en PLAN §2.5) | `panel_solar` queda `averiado`: rinde la mitad | `reparar` (⚡-10 🫁-4, 🛡️+8 después) o aguantar | Sin cifra; es un evento de juego. Frecuencia real: NO VERIFICADO, no se muestra |
| **Sombra de una colina** (solo `llanura-entre-crateres`) | Un tick sin ⚡ de paneles | Usar `bateria` si la tiene; si no, `redistribuir_energia` | Explicación, sin cifra |

Texto: `mision.luna.malasuerte.micrometeorito` — en: "A tiny space rock hit a solar panel! This was bad luck, not your choice." / es: "¡Una piedrita del espacio golpeó un panel solar! Esto fue mala suerte, no tu decisión."

## 8. Final: cadena de causas y tarjeta de ciencia

**Cadena de causas (ejemplo):** "You picked the sunny ridge (your choice) → the ice was far away → your crew was outside when the storm arrived (your choice) → the shield went down. The micrometeorite was bad luck." / "Elegiste la cresta soleada (tu decisión) → el hielo quedaba lejos → tu tripulación estaba afuera cuando llegó la tormenta (tu decisión) → bajó el blindaje. El micrometeorito fue mala suerte."

**Tarjeta de ciencia (3 opciones, nunca bloquea, siempre explica):**

| Clave | en | es |
|---|---|---|
| `mision.luna.ciencia.pregunta` | In May 2024, how much did radiation go up near the Moon? | En mayo de 2024, ¿cuánto subió la radiación cerca de la Luna? |
| `mision.luna.ciencia.op1` | About 2 times | Unas 2 veces |
| `mision.luna.ciencia.op2` | About 20 times | Unas 20 veces |
| `mision.luna.ciencia.op3` | About 200 times (correct) | Unas 200 veces (correcta) |
| `mision.luna.ciencia.explica` | The CRaTER instrument, on a NASA spacecraft flying around the Moon, measured about 200 times more than on a calm day. On Mars, the same storm hardly changed anything. Real curated data, not live. | El instrumento CRaTER, en una nave de NASA que vuela alrededor de la Luna, midió unas 200 veces más que en un día tranquilo. En Marte, la misma tormenta casi no cambió nada. Datos reales curados, no en vivo. |

Pregunta alternativa (nivel 2 de Iris): "How long does a message take from the Moon to Earth? About 1 second / About 1 hour / About 1 day" — "¿Cuánto tarda un mensaje de la Luna a la Tierra? Más o menos 1 segundo / 1 hora / 1 día" (cálculo con 384 400 km [V]).

## 9. Qué le toca a cada rol

- **diseño (Santiago, Camilo):** pasar §2–§7 a `missions/src/luna-polo-sur.ts` (4 sitios, 5 módulos sin `antena`, `tormentaId: "2024-05-10-gannon"`, dilema del paso 6) y ajustar números de `design/src/recursos.ts`; textos `en`/`es` de §2–§8 en el i18n de misiones; correr la prueba de las 10 parejas y de "ningún sitio domina".
- **motor (Jaime):** criterio 🧊 del sitio que modifica `reciclador_agua`; `panel_solar` a la mitad en sitios de luz baja; retraso de 1 tick para la Luna (ya en `RETRASO_COMUNICACIONES`).
- **agentes (José):** líneas de Doctora, Ingeniera, Meteoróloga, Iris y Control para los pasos 3, 5 y 6; la Doctora debe decir "cerca de la Luna, en órbita" al citar CRaTER y atribuir Chang'e-4 a CNSA.
- **datos (Daniel):** ver §11.
- **ui (María Paula):** dos tarjetas de fuente en el paso 5 (DONKI y CRaTER, con "en órbita, no en superficie"); mapa del polo **solo** si se aprueba Moon Trek; si no, ilustración marcada como dibujo.

## 10. Riesgos

- **`data/CLAUDE.md` pone "regiones nuevas" en pausa** hasta que la ruta dorada se juegue en pantalla. Esta misión es una propuesta; implementarla antes es decisión de Santiago.
- **Contrato (propuesta de issue `contrato`, no se cambia aquí):**
  - `SpaceWeatherEventSchema` solo tiene `marcoMarte` / `medicionMarte` / `observadoEn: "Sol" | "Tierra" | "Marte"`. Para la Luna haría falta `medicionLuna` opcional (forma de `MedicionLunaSchema` de `data/src/luna.ts`) y `"Luna"` en `observadoEn`. Mientras no exista, ui lee `luna.json` por fuera del evento con `fuenteCrater()`.
  - `salida_exterior` da ⚡+15 retrasado; la expedición al hielo debería dar 🫁. Opción sin contrato: diseño define el efecto por objetivo en su tabla (`objetivo: reciclador_agua` → 🫁).
- **Moon Trek no está confirmado como recurso oficial** (`docs/ORQUESTACION.md`). `trek.nasa.gov/moon/` carga, pero no se probó ningún servicio ni se descargó elevación del polo sur. Sin eso, el paso 2 no usa mapa real y los sitios del paso 3 no tienen coordenadas ni pendientes medidas (todo es valor de juego).
- **Fuentes fuera de lista:** el hielo en sombras permanentes, LCROSS y "sol continuo 6,5 días en las 13 regiones" vienen de science.nasa.gov y nasa.gov. Hasta que Daniel las apruebe, la UI solo puede decir los textos sin cifra y sin "according to NASA".
- **No comparar instrumentos distintos:** el fondo de CRaTER (5,2 µGy/h, órbita) y el de LND (13,2 µGy/h en silicio, superficie, CNSA) no se ponen lado a lado. Tampoco se dice que Marte "se salvó por su atmósfera": RAD no vio aumento, y la causa no está verificada.
- **Demo:** el paso 4b solo sale en semillas no doradas. La misión 1 sigue siendo la del video; esta entra por semilla.

## 11. Qué necesita datos (código) para implementarlo

1. Mergear PR #95 (`data/ciencia/luna.json`, `fuenteCrater()`, clave `fuente.crater`).
2. `retrasoLunaTierra()` junto al de Marte (PR #65): 384 400 km ÷ c ≈ 1,28 s, con la ficha NSSDC como fuente.
3. Tarjeta de fuente de la Luna en `en`/`es`: DONKI (`2024-05-10-gannon`) + CRaTER + "no en vivo"; `referenciaDosis("luna-superficie")` ya atribuye a CNSA.
4. Glosario nuevo (`datos.glosario.*`): *sombra permanente / permanent shadow*, *órbita / orbit*, *hielo de agua / water ice*, *dosis / dose*.
5. Si se aprueba Moon Trek: `data/terreno/luna-polo-sur/` con DEM y sombreado del polo y los 4 sitios con criterios calculados (como `jezero.json`).
6. Si se aprueban las fuentes de fuera de lista: añadirlas a `docs/science/fuentes.md` con [V] y fecha.

## 12. Cifras y su fuente

| Cifra | Estado | Fuente |
|---|---|---|
| Gravedad Luna 1,62 m/s² (0,165 de la Tierra) | [V] | https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html (11 ene 2024) |
| Irradiancia solar 1361,0 W/m² (igual a la Tierra) | [V] | misma ficha NSSDC |
| Periodo sinódico 29,53 días | [V] | misma ficha NSSDC |
| Temperatura 95–390 K en el ecuador | [V] (no se usa para el polo) | misma ficha NSSDC |
| Distancia 384 400 km (semieje 0,3844 × 10⁶ km) | [V] | misma ficha NSSDC |
| Presión superficial de noche 3 × 10⁻¹⁵ bar | [V] (consultado 2026-11-14) | misma ficha NSSDC |
| Retraso de luz Luna–Tierra ≈ 1,3 s | Cálculo con cifra [V] | 384 400 km ÷ 299 792 km/s |
| Gravedad Marte 3,73 m/s²; día 24,6597 h | [V] | https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html |
| CRaTER, Gannon: fondo 5,2 → 1082,5 µGy/h (11 may 2024), ×206,3, fondo tranquilo | [V] (órbita lunar, dosis absorbida) | https://visualization.osdr.nasa.gov/radlab/api/?instrument_id=CRaTER-D1D2&timestamp>=2024-05-04T09:13&timestamp<2024-05-12T09:13&absorbed_dose_rate>0&format=json (`data/ciencia/luna.json`, PR #95) |
| CRaTER, pico de muestra 1928,6 µGy/h | [V] (no se muestra a niños) | misma consulta |
| CRaTER, 2017-09-10: ×27 con fondo no tranquilo; octubre 2024 sin datos | [V] | `data/ciencia/luna.json` |
| RAD en Marte, Gannon: fondo 4,8 → 4,9 µGy/h, factor 1,0 | [V] | https://visualization.osdr.nasa.gov/radlab/api/?instrument_id=MSL-RAD-Surface&timestamp>=2024-05-03&timestamp<2024-05-26&absorbed_dose_rate>0&format=json (`data/curated/2024-05-10-gannon.json`) |
| FLR X2.2 `2024-05-09T08:45:00-FLR-001` | [V] | https://ccmc.gsfc.nasa.gov/DONKI/view/FLR/30605/-1 |
| CME 1330 km/s `2024-05-09T09:24:00-CME-001` | [V] | https://ccmc.gsfc.nasa.gov/DONKI/view/CME/30619/-1 |
| SEP `2024-05-10T13:35:00-SEP-001` | [V] | https://ccmc.gsfc.nasa.gov/DONKI/view/SEP/30677/-1 |
| GST Kp 9 `2024-05-10T15:00:00-GST-001` (Kp: NOAA) | [V] | https://ccmc.gsfc.nasa.gov/DONKI/view/GST/30693/-1 |
| Dosis de fondo en la superficie lunar 1369 µSv/día (1,369 mSv/día) | [V] — **CNSA** (Chang'e-4/LND), no NASA | Zhang et al. 2020, *Sci. Adv.* 6(39) eaaz1334, https://europepmc.org/article/PMC/PMC7518862 |
| LND 13,2 ± 1 µGy/h en silicio | [V] — CNSA (no se compara con CRaTER) | misma cita |
| Hielo de agua en regiones en sombra permanente de los polos | Fuera de lista — **requiere aprobación de Daniel** | https://science.nasa.gov/moon/moon-water-and-ices/ (consultado 2026-11-14) |
| LCROSS (2009) lanzó un proyectil a un cráter y se vieron granos de hielo de agua | Fuera de lista — requiere aprobación (porcentaje de agua: NO VERIFICADO) | misma página |
| 13 regiones candidatas de Artemis III a menos de 6° del polo sur, con sitios de sol continuo durante 6,5 días | Fuera de lista — requiere aprobación | https://www.nasa.gov/news-release/nasa-identifies-candidate-regions-for-landing-next-americans-on-moon/ (19 ago 2022) |
| Unos −173 °C en la oscuridad | Fuera de lista — requiere aprobación; no es específico de las sombras del polo | https://science.nasa.gov/moon/facts/ |
| Temperatura dentro de los cráteres en sombra del polo | **NO VERIFICADO** | — |
| El Sol se ve bajo en el horizonte del polo | **NO VERIFICADO** (explicación geométrica, sin fuente) | — |
| "Gannon, de las tormentas más grandes en años" | **NO VERIFICADO** (Kp 9 sí es [V]) | — |
| Por qué Marte no vio la tormenta de mayo 2024 | **NO VERIFICADO** (solo el factor 1,0 es [V]) | — |
| Frecuencia de micrometeoritos | **NO VERIFICADO** (no se muestra) | — |
| Material de producción de alimentos de la CSA | **NO VERIFICADO** (no leído) | CSA, socio del reto |
| Elevación y pendientes del polo sur (Moon Trek) | **NO VERIFICADO** (el portal carga; no se probó ningún servicio) | https://trek.nasa.gov/moon/ |
| Recursos iniciales, costos de sitios, módulos y acciones | Valor de juego (no es dato de NASA) | `design/src/recursos.ts` y esta propuesta |
