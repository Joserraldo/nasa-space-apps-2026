# Misión `outpost_sorpresa`: la nave en el espacio profundo

**Rol que propone:** datos (Daniel) · **Dueños de la misión:** diseño (Santiago y Camilo) · **Estado:** propuesta · **Fecha:** 2026-11-14
**Sitio del contrato:** `outpost_sorpresa` (`contracts/src/seed.ts`, PLAN §2.5: "Luna polo sur, Luna lado visible, Marte cráter Jezero, Marte polo norte, 'outpost' sorpresa").
**Destino:** `missions/src/outpost.ts` + `design/src/recursos.ts`. Este documento no toca esas carpetas: allí lo implementa diseño.
**Regla de cifras:** cada número de NASA lleva **[V]** y fuente en la tabla final (§12). Todo lo demás es **valor de juego** (0-100) y no se presenta como dato. Datos estáticos = "datos reales curados, no en vivo".

## 1. Qué es el outpost sorpresa y por qué enseña algo distinto

El PLAN solo dice "outpost sorpresa". Propuesta: **la sorpresa es que no hay suelo**. El niño espera aterrizar y descubre que su puesto avanzado es **una nave en el espacio profundo, de camino a la Luna**, como la nave Orion de Artemis I.

Por qué esta y no otra:
- **Lo dicen los datos que ya tenemos.** RadLab (OSDR, lista oficial) tiene la radiación medida **dentro de Orion** en Artemis I: instrumento `Artemis-I-HERA-HSU1`, `spacecraft = "Orion"`, `trajectory = "Lunar flyby"` [V, consulta a RadLab del 2026-11-14]. Y tiene **CRaTER** (LRO), que midió las tormentas curadas **en órbita lunar** (PR #95).
- **Enseña lo que los otros 4 sitios no enseñan.** En Jezero y en la Luna el niño puede usar el suelo para protegerse (regolito, cráteres). En la nave no hay suelo: **la única protección es lo que llevas contigo**. La lección: *más cosas alrededor de ti = más protección*, y por eso los astronautas arman un refugio con sus propias provisiones.
- **Tiene un número real que compara "en camino" contra "en el suelo"**, con el mismo instrumento y la misma unidad: el detector RAD midió **1,84 ± 0,3 mSv/día durante el viaje a Marte** y **0,64 ± 0,12 mSv/día en la superficie de Marte** [V, Reitz et al. 2016, ya usada en `radiacion.json`]. En el viaje recibió unas **2,9 veces más** por día (cálculo nuestro: 1,84 / 0,64).
- **Encaja con el reto** ("Junior Astronaut Mission Trainer"): el enunciado nombra los datos de Artemis.

Lo que **no** afirmamos (sin fuente): por qué el viaje da más dosis que la superficie (la explicación del planeta y la atmósfera es física estándar, pero no tiene cita [V] en `fuentes.md`), ni la causa del pico de Artemis I del 16 nov 2022.

## 2. Las 3 zonas de la nave (paso 3: "¿dónde vive la tripulación?")

En vez de 3 sitios de aterrizaje, el niño elige **la zona de la nave donde se instala la tripulación**. Tres criterios; **ninguna zona gana en los tres** (valores de juego, no de NASA):

| Zona | 🛡️ Protección (cosas alrededor) | 🫁 Espacio para trabajar y comer | 📡 Cerca de controles y antena | Qué pierde |
|---|---|---|---|---|
| `cabina` (ventanas y controles) | baja | alta | alta | Protección |
| `centro` (donde se guardan las provisiones) | alta | baja | media | Espacio: todo está lleno de bolsas |
| `fondo` (junto al escudo térmico) | alta | media | baja | Lejos de los controles: cada orden cuesta ⚡ |

De dónde sale la idea (no las cifras): NASA explica que en Orion el fondo, donde van el escudo térmico y el módulo de servicio, da más protección, y que el refugio se arma en la parte central con las bolsas de provisiones (**fuente fuera de la lista oficial — requiere aprobación de Daniel**, ver §12). Si no se aprueba, las zonas quedan como **valor de juego** sin tarjeta de fuente.

Efecto de elegir (valor de juego, para que diseño ajuste): `cabina` 🛡️-8 · `centro` 🫁-6 · `fondo` ⚡-6, con su `porQueKey`.

## 3. Módulos (paso 4: elige 2 de 5)

Montar cualquiera cuesta lo de `COSTOS_ACCION.colocar_modulo` (⚡-6 🫁-3). Solo se usan valores de `Equipment` que ya existen: **no cambia el contrato**. Sin `invernadero` (no cabe una huerta en una nave pequeña; valor de diseño, no dato).

| Módulo (`Equipment`) | Beneficio (valor de juego) | Costo | Lección (con fuente o sin cifra) |
|---|---|---|---|
| `panel_solar` | ⚡ +14 | se apaga a la mitad si lo golpea un micrometeorito (§7) | La nave vive de la luz del Sol (sin cifra) |
| `bateria` | ⚡ +8 | ojo DD-07: su +2 de 🛡️ no tiene sentido físico; proponemos quitarlo aquí | Guardar energía para la tormenta |
| `reciclador_agua` | 🫁 +12 | ⚡ -1 | El agua se recicla, no aparece de la nada |
| `escudo` (pared de bolsas de agua y comida) | 🛡️ +14 | ⚡ -3 y, en el paso 6, usa provisiones (🫁) | Más masa alrededor = más protección (NASA, fuera de lista) |
| `antena` | 🛡️ +4 🫁 +3 (aviso temprano) | ⚡ -1 | Desde la Luna la señal tarda ~1,3 s (cálculo con NSSDC) |

Prueba para diseño (con Jaime): con la semilla dorada del outpost, simular las **10 parejas**; ninguna debe pasar la tormenta sin perder algo.

## 4. La misión, paso a paso (8 pasos, ~2-3 min)

Arranque actual en `design/src/recursos.ts`: ⚡60 🫁60 🛡️60, consumo ⚡-3 🫁-3 🛡️-2 por tick (valores de juego; bien para una nave: todo es más justo).

| Paso | Qué pasa | Decisión del niño (con costo) | Quién habla | Dato con fuente |
|---|---|---|---|---|
| 1 | **La sorpresa:** "¡No hay suelo! Tu puesto avanzado es una nave camino a la Luna" | — | Iris (nivel 1) presenta la nave | Tarjeta: Orion llevó un medidor de radiación en Artemis I (RadLab `Artemis-I-HERA-HSU1`) [V] |
| 2 | Orientar la nave | Paneles hacia el Sol (⚡ sube, 📡 baja) o antena hacia la Tierra (al revés) | Ingeniera vs Control de Misión | — (valor de juego) |
| 3 | 3 zonas de la nave (§2) | Ninguna gana en los tres criterios | Doctora (protección), Ingeniera (controles), Iris (espacio) | Idea del refugio central y del fondo protegido (NASA, fuera de lista) |
| 4 | Instala 2 de 5 módulos (§3) | Cada uno mueve 2 medidores | Ingeniera recomienda `panel_solar`; Doctora, `escudo` | — |
| 4b | *Mala suerte:* micrometeorito en un panel (PLAN §2.5) | Salida exterior a repararlo (🛡️ -12 🫁 -5) o seguir con media energía | Ingeniera | — (evento de juego, sin cifra) |
| 5 | Llega la **tormenta real de mayo de 2024** → pausa + tarjeta de fuente | — | Meteoróloga lee la cadena de DONKI: llamarada X2.2 → nube a 1330 km/s → partículas (SEP) → tormenta Kp 9 | DONKI [V]; CRaTER en órbita lunar: 5,2 → 1082,5 µGy/h (×206) [V, PR #95] |
| 6 | **Dilema del refugio** (§6) | Refugio con provisiones / subir escudo / aguantar | Doctora vs Ingeniera; Iris (dañada) lee mal 🛡️ | NASA: el refugio se arma en menos de 1 hora y se puede estar hasta 24 h (fuera de lista) |
| 7 | Telemetría a la Tierra; la respuesta llega en **1 tick** (no 3, ver §10) | Enviar ahora (⚡ -5) o esperar a que pase la tormenta | Control de Misión | Luz Tierra–Luna ≈ 1,3 s (cálculo con NSSDC, PR #95) |
| 8 | Cadena de causas + tarjeta de ciencia (§8) | — | Iris resume | RAD: 1,84 mSv/día en viaje vs 0,64 en Marte [V] |

**Fin:** gana si llega al paso 8 con los 3 medidores > 0. Si algo llega a 0, **rescate de entrenamiento**: cadena de causas y se reintenta el día (como Jezero). Objetivo sugerido del mazo: `reportar_tierra`.

## 5. La tormenta elegida y por qué

**Principal: `2024-05-10-gannon`** (ya curada en `data/curated/`).
- Cadena DONKI completa [V]: FLR `2024-05-09T08:45:00-FLR-001` (X2.2) → CME `2024-05-09T09:24:00-CME-001` (1330 km/s) → **SEP `2024-05-10T13:35:00-SEP-001`** → GST `2024-05-10T15:00:00-GST-001` (Kp 9).
- **Tiene SEP**, que es la parte de la tormenta que importa en una nave: las partículas. La Meteoróloga puede decir "primero llegan las partículas, después la tormenta magnética en la Tierra" (orden de las fases en DONKI, sin inventar horas de llegada a la nave).
- **CRaTER la vio en el espacio cerca de la Luna con el fondo limpio**: media diaria de 5,2 a **1082,5 µGy/h** el 11 may, **×206,3**, `fondoTranquilo: true` [V, PR #95]. Es la mejor medición real que tenemos de "una tormenta fuera de la Tierra, sin suelo debajo protegiéndote".
- Hay que decirlo bien: CRaTER mide **en órbita lunar, no dentro de una nave tripulada** ni en el suelo. La nave del juego "imagina" que vive esa tormenta (mismo sentido que `marcoMarte: "escenario"`).

**Alterna (semillas no doradas): `2017-09-10-x82`.** CRaTER: media diaria de 19 481,6 µGy/h el 11 sep [V], pero el fondo ya traía la tormenta del 6 sep (`fondoTranquilo: false`), así que su factor (×27) sale bajo y **no se muestra como "veces más"**. Útil para la Meteoróloga dramática: "¡una tormenta encima de otra!".

**Por qué no Artemis I como tormenta:** en el viaje de Orion (16 nov–11 dic 2022) no hay una tormenta curada. Después del primer día, el máximo diario de HERA no pasa de 124,09 µGy/h y la mediana de crucero es 16,68 µGy/h [V]. Sirve como **"un día tranquilo dentro de una nave real"** (paso 1 y tarjeta final), no como tormenta. El pico de 8012,58 µGy/h del 16 nov a las 07:27 [V] **no se usa en el texto para niños** mientras su causa siga NO VERIFICADA.

**Choque con las misiones de la Luna:** PR #95 recomienda Gannon también para la Luna. Si diseño quiere que no se repita, la semilla elige la alterna para el outpost cuando la misión anterior fue lunar.

## 6. Dilema central (sin receta)

Llega la tormenta. Tres caminos y **ninguno es gratis**:
- **Doctora:** "¡Armemos el refugio ya! Apilamos las bolsas de agua y comida a nuestro alrededor." → `refugiarse`: 🛡️ sube con retraso, pero 🫁 baja (las provisiones quedan tapadas y nadie trabaja), y si la zona es `cabina`, cuesta más.
- **Ingeniera:** "Si escondemos todo, nadie vigila los paneles. Mejor subo el escudo con energía." → `subir_escudo`: mucha ⚡; si hubo micrometeorito, puede no alcanzar.
- **Aguantar:** no gasta ahora, pero el 🛡️ baja durante la tormenta y el costo llega 2 ticks después.
- **Iris (dañada)** dice un número de 🛡️ que no coincide con el medidor. El niño aprende a verificar con la Doctora.

No hay texto de ayuda con la respuesta. El Matemático ("¿y si...?") muestra el costo de cada camino antes de elegir.

## 7. Mala suerte

- **Micrometeorito en un panel** (PLAN §2.5): `panel_solar` rinde la mitad. Reparar = `salida_exterior` (🛡️ -12 🫁 -5; salir de la nave en plena tormenta es peor). Sin cifras de NASA: evento de juego.
- **Antena desalineada** (solo dificultad alta): la telemetría del paso 7 tarda 1 tick extra.
- La semilla dorada del outpost **no** trae mala suerte, para que la demo sea estable.

## 8. Final: cadena de causas y tarjeta de ciencia

**Cadena de causas** (ejemplo): "Elegiste la cabina (decisión) → el escudo empezó bajo → llegó la tormenta real de mayo de 2024 (dato) → armaste el refugio (decisión) → perdiste provisiones pero la tripulación quedó protegida". La mala suerte (micrometeorito) se marca aparte: "esto fue mala suerte, y así se resolvía".

**Tarjeta de ciencia** (3 opciones, nunca bloquea, siempre explica):
- Pregunta: "A robot called RAD measured radiation on the way to Mars and on Mars's ground. Where did it measure more each day?"
- Opciones: (a) On the way, inside the spaceship ✔ · (b) On Mars's ground · (c) The same in both.
- Explicación: "On the way: about 1.84 mSv per day. On the ground: about 0.64. That is almost 3 times more in space!" + tarjeta de fuente (Reitz et al. 2016).

## 9. Textos visibles sugeridos (inglés primero, español después)

| Clave i18n | en | es |
|---|---|---|
| `mision.outpost.nombre` | Surprise Outpost: the deep-space ship | Puesto sorpresa: la nave del espacio profundo |
| `mision.outpost.sorpresa` | Surprise! There is no ground here. Your outpost is a spaceship on its way to the Moon. | ¡Sorpresa! Aquí no hay suelo. Tu puesto avanzado es una nave camino a la Luna. |
| `mision.outpost.leccion` | In space there is no ground to hide behind. Your best shield is what you carry with you. | En el espacio no hay suelo para esconderse. Tu mejor escudo es lo que llevas contigo. |
| `mision.outpost.zona.cabina` | Cabin: lots of room and close to the controls, but thin walls. | Cabina: mucho espacio y cerca de los controles, pero paredes delgadas. |
| `mision.outpost.zona.centro` | Middle: packed with supply bags that protect you, but very little room. | Centro: lleno de bolsas de provisiones que te protegen, pero casi sin espacio. |
| `mision.outpost.zona.fondo` | Bottom: next to the heat shield, well protected, but far from the controls. | Fondo: junto al escudo térmico, bien protegido, pero lejos de los controles. |
| `mision.outpost.dilema.doctora` | Let's build the shelter now! We stack the water and food bags around us. | ¡Armemos el refugio ya! Apilamos las bolsas de agua y comida a nuestro alrededor. |
| `mision.outpost.dilema.ingeniera` | If we hide everything, nobody watches the panels. I can raise the shield with power. | Si escondemos todo, nadie vigila los paneles. Puedo subir el escudo con energía. |
| `mision.outpost.mala_suerte.micrometeorito` | A tiny space rock hit a solar panel! It now makes only half the power. | ¡Una piedrita espacial golpeó un panel solar! Ahora da solo la mitad de energía. |
| `mision.outpost.tormenta.crater` | Near the Moon, a NASA instrument measured about 206 times more radiation than before this storm. | Cerca de la Luna, un instrumento de NASA midió unas 206 veces más radiación que antes de esta tormenta. |
| `mision.outpost.orion.calma` | A real spaceship, Orion, carried a radiation meter around the Moon in 2022. Most days were calm. | Una nave real, Orion, llevó un medidor de radiación alrededor de la Luna en 2022. Casi todos los días fueron tranquilos. |
| `mision.outpost.ciencia.pregunta` | RAD measured radiation on the way to Mars and on Mars's ground. Where did it measure more each day? | RAD midió la radiación en el viaje a Marte y en el suelo de Marte. ¿Dónde midió más cada día? |
| `mision.outpost.ciencia.explica` | On the way: about 1.84 mSv per day. On the ground: about 0.64. Almost 3 times more in space! | En el viaje: unos 1,84 mSv por día. En el suelo: unos 0,64. ¡Casi 3 veces más en el espacio! |
| `mision.outpost.datos_curados` | Real data, saved ahead of time. Not live. | Datos reales guardados antes. No es en vivo. |

Las cifras en el texto salen de `data/` por interpolación (`{{factor}}`), no se escriben a mano en el i18n final; aquí van escritas solo para leerlas.

## 10. Qué le toca a cada rol

- **diseño (Santiago, Camilo):** `missions/src/outpost.ts` con §2-§7 (zonas en vez de sitios de terreno, `eventoMicrometeorito`, `dilemaPaso6`); revisar `RETRASO_COMUNICACIONES.outpost_sorpresa` (hoy 3 ticks, más que Marte; si la nave va a la Luna, la luz tarda ~1,3 s: proponemos **1 tick**, o justificar 3 como "antena desalineada"); decidir si quitar el +2 🛡️ de `bateria` (DD-07); costos de `refugiarse` específicos del outpost.
- **motor (Jaime):** que `meta: "sitio_elegido"` acepte una zona sin `data/terreno/`; evento de micrometeorito (rendimiento de `panel_solar` × 0,5); que `refugiarse` pueda costar distinto por sitio si diseño lo pide.
- **agentes (José):** líneas del paso 3, 5 y 6; la Doctora cita CRaTER **diciendo "en órbita lunar"** y nunca dice mSv para µGy; la Meteoróloga lee las 4 fases de Gannon.
- **datos (Daniel):** (1) fusionar PR #95 (CRaTER) o la misión no tiene la medición de la tormenta; (2) añadir a `radiacion.json` la referencia `marte-crucero` (1,84 ± 0,3 mSv/día, misma cita que `marte-superficie`); (3) tarjeta de fuente `fuente.hera` para Artemis I con `spacecraft: Orion`; (4) aprobar o descartar la página de NASA del refugio de Orion; (5) buscar en la lista oficial una fuente del "por qué" (planeta y atmósfera) o dejarlo fuera.
- **ui (María Paula):** la revelación del paso 1 (no hay suelo); dibujo de la nave por dentro con 3 zonas; sin logo de NASA; sello "datos reales curados, no en vivo".

## 11. Riesgos

- **Contrato (propuesta de issue `contrato`, no se cambia aquí):** `SpaceWeatherPhase.observadoEn` solo admite `Sol | Tierra | Marte`, y la medición de la tormenta vive en `medicionMarte`/`marcoMarte`. Para el outpost (y la Luna) haría falta algo como `medicionSitio` con `lugar: "orbita_lunar" | "nave"` y `marco` genérico. **Plan B sin cambio:** la medición CRaTER se lee de `data/ciencia/luna.json` con `medicionLuna(id)` (PR #95) y la tormenta usa `marcoMarte: "escenario"` como hoy.
- **PR #95 sin fusionar:** sin él, el paso 5 solo muestra DONKI (sin el ×206).
- **Mezclar unidades:** CRaTER y HERA son µGy/h (absorbida); RAD de §8 es mSv/día (equivalente). Nunca en la misma frase ni convertidos. Tampoco comparar CRaTER con HERA: instrumentos y años distintos.
- **Fuentes fuera de la lista oficial** (página NASA del refugio de Orion; elib.dlr.de del DLR): si Daniel no las aprueba, el refugio queda como mecánica de juego sin tarjeta y la tarjeta final se reemplaza por la de Artemis I (solo RadLab).
- **Decir de más:** no afirmar la causa del pico de Artemis I, ni cuánto protegió el refugio en Artemis I (una nota secundaria dice "la mitad": NO VERIFICADO), ni las fechas exactas del crucero de RAD.
- **Tiempo de demo:** el outpost no es la ruta dorada; entra solo cuando Jezero se juegue en pantalla (`data/CLAUDE.md`, tarea 5 en pausa).

## 12. Cifras y su fuente

| Cifra | Estado | Fuente |
|---|---|---|
| Artemis I, HERA-HSU1: `spacecraft = Orion`, `trajectory = Lunar flyby`, `celestial_body = Moon` | [V] consulta del 2026-11-14 | https://visualization.osdr.nasa.gov/radlab/api/?instrument_id=Artemis-I-HERA-HSU1&spacecraft=Orion&timestamp>=2022-11-20T00:00&timestamp<2022-11-20T00:02&format=json |
| Artemis I: datos del 2022-11-16T06:51 al 2022-12-11T16:58, 36 583 muestras, µGy/h (absorbida) | [V] | `data/ciencia/artemis.json` · https://visualization.osdr.nasa.gov/radlab/api/?instrument_id=Artemis-I-HERA-HSU1&absorbed_dose_rate>0&format=json |
| Artemis I: mediana de crucero 16,68 µGy/h | [V] | igual que arriba |
| Artemis I: pico 8012,58 µGy/h el 2022-11-16T07:27 (~480 veces la mediana) | [V] la cifra (reconsultada el 2026-11-14) · **causa NO VERIFICADO** | igual que arriba |
| Artemis I: máximo diario después del 16 nov ≤ 124,09 µGy/h (28 nov) | [V] | `data/ciencia/artemis.json` |
| Gannon: FLR X2.2 `2024-05-09T08:45:00-FLR-001` | [V] | https://ccmc.gsfc.nasa.gov/DONKI/view/FLR/30605/-1 |
| Gannon: CME `2024-05-09T09:24:00-CME-001`, 1330 km/s | [V] | https://ccmc.gsfc.nasa.gov/DONKI/view/CME/30619/-1 |
| Gannon: SEP `2024-05-10T13:35:00-SEP-001` | [V] | https://ccmc.gsfc.nasa.gov/DONKI/view/SEP/30677/-1 |
| Gannon: GST `2024-05-10T15:00:00-GST-001`, Kp 9 (Kp de NOAA) | [V] | https://ccmc.gsfc.nasa.gov/DONKI/view/GST/30693/-1 |
| CRaTER (órbita lunar), Gannon: 5,2 → 1082,5 µGy/h, ×206,3, fondo limpio | [V] (PR #95, sin fusionar) | https://visualization.osdr.nasa.gov/radlab/api/?instrument_id=CRaTER-D1D2&timestamp>=2024-05-04T09:13&timestamp<2024-05-12T09:13&absorbed_dose_rate>0&format=json |
| CRaTER, X8.2 de 2017: 19 481,6 µGy/h el 11 sep; factor ×27 **no se muestra** (fondo contaminado) | [V] (PR #95) | https://visualization.osdr.nasa.gov/radlab/api/?instrument_id=CRaTER-D1D2&timestamp>=2017-09-05T16:06&timestamp<2017-09-13T16:06&absorbed_dose_rate>0&format=json |
| X8.2: FLR `2017-09-10T15:35:00-FLR-001`, CME 2650 km/s, SEP `2017-09-10T16:25:00-SEP-001` | [V] | https://ccmc.gsfc.nasa.gov/DONKI/view/FLR/13098/-1 · https://ccmc.gsfc.nasa.gov/DONKI/view/SEP/13101/-1 |
| RAD en el viaje a Marte: 1,84 ± 0,3 mSv/día (equivalente) | [V] texto del resumen, revisado el 2026-11-14 · **fuente fuera de la lista oficial — requiere aprobación de Daniel** (es la misma página que ya usa `radiacion.json`) | https://elib.dlr.de/106090/ |
| RAD en la superficie de Marte: 0,64 ± 0,12 mSv/día (7 ago 2012 – 1 jun 2013) | [V] (ya en `radiacion.json`) · misma nota de fuente | https://elib.dlr.de/106090/ |
| "Unas 2,9 veces más en el viaje" | cálculo nuestro (1,84 / 0,64) | — |
| Fechas exactas del crucero de RAD | **NO VERIFICADO** | — |
| Distancia media Tierra–Luna 384 400 km → luz ≈ 1,3 s | [V] NSSDC + cálculo (PR #95) | https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html |
| Refugio de Orion: bolsas de provisiones en la parte central; el fondo (escudo térmico y módulo de servicio) protege más; se arma en menos de 1 hora; hasta 24 h dentro | [V] leído el 2026-11-14 (página del 22 sep 2016, actualizada el 26 jul 2023; plan previo al vuelo) · **fuente fuera de la lista oficial — requiere aprobación de Daniel** | https://www.nasa.gov/missions/artemis/orion/scientists-and-engineers-evaluate-orion-radiation-protection-plan/ |
| En Artemis I, el sensor del refugio midió "la mitad" que el de la cabina | **NO VERIFICADO** (solo fuentes secundarias) | — |
| Por qué el viaje da más dosis que el suelo (planeta y atmósfera bloquean) | **NO VERIFICADO** como cita | — |
| Zonas, módulos, costos y medidores (0-100) | valor de juego, no de NASA | `design/src/recursos.ts` |
