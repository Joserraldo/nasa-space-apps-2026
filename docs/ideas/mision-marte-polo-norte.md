# Misión Marte, polo norte (`marte_polo_norte`): "Sin Sol, ¿de dónde sale la energía?"

**Rol que propone:** datos (Daniel) · **Dueños de la misión:** diseño (Santiago y Camilo) · **Estado:** propuesta · **Fecha:** 2026-11-14
**Base:** el modelo de la misión 1 (`docs/ideas/mision-1-ares-mejorada.md` en `feat/agentes-mision1-ares`), `missions/src/jezero.ts`, `design/src/recursos.ts` y `data/src/region.ts` (`regionPoloNorte()`).
**Destino:** un futuro `missions/src/polo-norte.ts` (lo escribe diseño). Este documento no toca `missions/`, `design/`, `engine/`, `agents/`, `ui/` ni `contracts/`.
**Convención:** [V] = verificado en una fuente con URL (tabla §12). **NO VERIFICADO** = no se usa como dato hasta comprobarlo. "Valor de juego" = número del equipo, no de NASA.

## 1. Por qué esta misión enseña algo distinto a Jezero

| | Jezero (misión 1) | Polo norte (esta) |
|---|---|---|
| Pregunta | ¿Dónde aterrizo y cómo aguanto la tormenta? | **Sin Sol, ¿de dónde sale la energía?** |
| Recurso que aprieta | ⚡ por el polvo (mala suerte) | ⚡ por la **geometría**: el Sol está bajo en verano y no sale en la noche polar |
| Mapa | Sí (Mars Trek, terreno real) | **No** (plan B: Mars Trek no exporta la elevación polar, `docs/science/terreno.md`). Las zonas se describen por latitud |
| Módulo estrella | `panel_solar` | `bateria`: guardar energía **antes** de que llegue la oscuridad |
| Dilema | Refugio + apagar invernadero vs escudo | Gastar la batería **ahora** (escudo) vs **guardarla** para la noche polar |
| Idea de ciencia | El suelo y las paredes protegen | El eje inclinado (25,19° [V]) hace que cerca del polo haya días sin Sol y días en que no se pone |

La lección que se lleva el niño: **la energía del Sol hay que guardarla cuando la hay, porque en el polo llega una temporada en que el Sol no sale.** Es causa y efecto puro, sin cifras inventadas: todo sale de la inclinación del eje [V] y de la irradiancia [V], con cálculos que hace el código.

## 2. Lo que sabemos, lo que calculamos y lo que no afirmamos

- **Medido o publicado [V]:** inclinación del eje 25,19°; irradiancia solar en Marte 586,2 W/m² frente a 1361,0 en la Tierra (0,431 veces); gravedad 3,73 m/s²; día de 24,6597 h; año de 686,980 días terrestres (NSSDC). La tormenta del 20 may 2024 medida por RAD: 4,1 → 79,7 µGy/h de media diaria (×19,4, dosis **absorbida**, OSDR RadLab).
- **Aparte, no es la tormenta [V]:** dosis de fondo en la superficie 0,64 ± 0,12 mSv/día (RAD, dosis equivalente): es el **fondo de un día tranquilo, no la tormenta**. No se pone junto a las cifras en µGy/h.
- **Calculado por código [derivado del equipo]:** altura máxima del Sol en pleno verano = 90° − latitud + 25,19°; hay noche polar (y día sin noche en verano) a partir de 90° − 25,19° = **64,81° N**. Ya está en `regionPoloNorte()` para 82° N (Sol máximo ≈ 33,2°).
- **Fuera de la lista oficial del reto, requiere aprobación de Daniel:** la capa polar norte permanente es sobre todo **hielo de agua**; en otoño e invierno parte del dióxido de carbono del aire se congela sobre el suelo ("hielo seco") (§12, filas F1–F3).
- **NO afirmamos:** cuánto dura la noche polar en días (falta calcularlo por código, §10), temperaturas del polo, dosis en el polo, dónde termina la capa de hielo, ni nada del terreno (no hay DEM polar usable).
- **RAD está en el cráter Gale, no en el polo.** Cualquier texto de la tormenta debe decir dónde se midió (§6).

## 3. Zonas candidatas (paso 3), sin mapa

No hay sitios con coordenadas ni terreno: el niño elige una **franja de latitud**. Los dos primeros criterios salen por código de datos verificados; el tercero es un valor de juego declarado como tal.

| Zona (`id` sugerido) | Latitud | ☀️ Luz: Sol máximo en verano (derivado) | 🧊 Hielo cerca (valor de juego) | 📦 Depósito de carga (valor de juego) |
|---|---|---|---|---|
| `borde-sur` | 70° N | **45,2°** (la que más luz tiene) | lejos | medio |
| `franja-media` | 76° N | 39,2° | medio | **cerca** (llega la carga de la nave) |
| `junto-al-casquete` | 82° N | 33,2° (la que menos luz tiene) | **cerca** | lejos |

- **Ninguna gana en los tres.** La de más luz tiene el hielo lejos; la del hielo tiene poca luz; la del depósito no destaca en lo demás.
- Las tres están por encima de 64,81° N, así que **las tres tienen noche polar**. Cuanto más al norte, más larga (la duración exacta queda pendiente de cálculo, §10; mientras tanto, solo "más larga / más corta").
- "Hielo cerca" no es una distancia medida: es un orden (cuanto más al norte, más cerca del casquete). El texto visible solo puede decir que el casquete es de hielo de agua si Daniel aprueba la fuente F1.
- Costo de aterrizar (propuesta, valores de juego, misma forma que `SitioCandidato`):

| Zona | Inmediato | Retrasado | Por qué cuesta esto |
|---|---|---|---|
| `borde-sur` | ⚡ -3 🫁 -4 | ⚡ +6 | Más Sol para los paneles, pero ir a buscar hielo gasta tiempo y aire |
| `franja-media` | ⚡ -5 | 🫁 +4 | La carga del depósito trae provisiones; ni mucha luz ni mucho hielo |
| `junto-al-casquete` | ⚡ -8 | 🫁 +8 | El agua está al lado, pero los paneles casi no rinden |

## 4. Módulos (paso 4): elige 2 de 5

Montar cualquiera cuesta `COSTOS_ACCION.colocar_modulo` (⚡ -6 🫁 -3). Beneficio con retraso (1-2 ticks). Valores de juego.

| Módulo (`Equipment`) | Beneficio | Costo extra | Qué cambia en el polo | Lección |
|---|---|---|---|---|
| `panel_solar` | ⚡ +14 × factor de luz de la zona | rinde **0** en la noche polar | Propuesta: factor = seno de la altura del Sol de la zona (70° N ≈ 0,71; 76° N ≈ 0,63; 82° N ≈ 0,55), cálculo del equipo | Un panel recibe menos energía si el Sol está bajito |
| `bateria` | guarda la ⚡ que sobra y la devuelve en la noche polar | ⚡ -2 al montarla | **Módulo clave** de esta misión. Hoy `MODULOS.bateria` da ⚡ +8 🛡️ +2 y el +2 de blindaje no tiene sentido físico (DD-07): proponemos quitarlo para esta misión | La energía se guarda cuando hay Sol |
| `reciclador_agua` | 🫁 +12 (+4 extra en `junto-al-casquete`) | ⚡ -2 | Derretir hielo y limpiar el agua gasta electricidad | El agua no aparece de la nada: cuesta energía |
| `escudo` | 🛡️ +14 | ⚡ -3 | Igual que en Jezero | Una capa de material frena parte de la radiación |
| `invernadero` | 🫁 +10 | ⚡ -4 (más que en Jezero: necesita luz artificial) | Tentador pero caro en el polo | Las plantas necesitan luz; sin Sol, la luz hay que pagarla |

Prueba que diseño debe pasar (con motor): con la semilla dorada del polo, simular las 10 parejas y comprobar que **ninguna** llega al final sin perder algo. Pareja esperada como "buena pero no gratis": `panel_solar` + `bateria` (llega a la noche con energía, pero sin escudo sufre en la tormenta).

## 5. La misión paso a paso (8 pasos, ~2-3 min)

Arranque (ya en `design/src/recursos.ts`): ⚡55 🫁80 🛡️65, consumo ⚡ -4 🫁 -2 🛡️ -1 por tick. Las estaciones van **comprimidas**: un año de Marte dura 686,980 días terrestres [V]; en la partida pasan en pocos ticks, y el texto lo dice.

| Paso | Qué pasa | Decisión del niño (con costo) | Quién habla | Dato y fuente |
|---|---|---|---|---|
| 1 | La nave suelta el satélite sobre el polo. Es el final del verano: el Sol da vueltas bajito por el cielo y no se pone | — | Iris (nivel 1) presenta a la tripulación | Día sin noche en verano a partir de 64,81° N (derivado de la inclinación 25,19° [V] NSSDC) |
| 2 | El satélite tiene que cargar su batería antes de bajar | **Dar una vuelta más cargando** (⚡ +8 con retraso, 🫁 -4: la tripulación espera) o **bajar ya** (sin costo extra, sin carga extra) | Ingeniera ("cada rayo cuenta") | Irradiancia 586,2 W/m², 0,431 veces la de la Tierra [V] NSSDC |
| 3 | 3 zonas por latitud con 3 criterios (§3). **Sin mapa**: la ui muestra un esquema del Sol bajito sobre cada franja | Elegir zona; ninguna gana en los tres | Ingeniera (luz), Doctora (agua para la tripulación), Meteoróloga (la noche llega antes cuanto más al norte) | Altura del Sol por latitud: derivado [V inclinación] |
| 4 | Aterriza y elige **2 de 5 módulos** (§4) | Cada módulo mueve 2 medidores | Ingeniera recomienda `bateria`; Doctora, `escudo` | — (valores de juego) |
| 4b | *Mala suerte (no en la semilla dorada):* escarcha sobre los paneles: el panel rinde la mitad | **Quitarla** (`salida_exterior` sobre `panel_solar`: 🛡️ -12 🫁 -5) o aguantar | Ingeniera | Tarjeta: "en otoño e invierno parte del aire de Marte se congela sobre el suelo" (fuente F2, **fuera de la lista, requiere aprobación de Daniel**). Que la escarcha tape paneles es escenario de juego |
| 5 | Llega la tormenta real del 20 may 2024 → pausa + tarjeta de fuente | — | Meteoróloga lee el evento | CME `2024-05-20T05:36:00-CME-001` [V DONKI]; RAD midió ×19,4 **en el cráter Gale, no en el polo** [V RadLab] |
| 6 | **Dilema de la batería** (§7). Iris (dañada) dice que la batería está llena; el medidor ⚡ dice otra cosa | Refugiarse / subir escudo con la batería / aguantar | Doctora vs Ingeniera; Iris equivocada | Solo la tormenta en µGy/h: RAD midió 4,1 → 79,7 µGy/h de media diaria (dosis absorbida, en Gale) [V RadLab]. Sin el 0,64 mSv/día aquí |
| 7 | **Empieza la noche polar:** el Sol deja de salir y `panel_solar` da 0. Envía telemetría a la Tierra; la respuesta tarda 2 ticks | Enviar ahora (⚡ -5 🫁 -1, gasta batería) o esperar | Control de Misión (con retraso) | Noche polar a partir de 64,81° N (derivado); retraso Marte–Tierra 3–22,3 min en un sentido (calculado de las distancias NSSDC [V], `feat/datos-comunicaciones`) |
| 8 | Cadena de causas + tarjeta de ciencia + pregunta de 3 opciones que nunca bloquea | — | Iris resume | §9 |

**Fin:** gana si llega al paso 8 con los 3 medidores > 0. Si uno llega a 0, **rescate de entrenamiento** (como Jezero): cadena de causas y reintentar.

## 6. La tormenta elegida y por qué

**`2024-05-20-marte`** (ya en `data/curated`, es la ruta dorada).
- Es **la que más subió en Marte** de nuestro catálogo (×19,4): RAD (Curiosity) vio la dosis absorbida subir de 4,1 a 79,7 µGy/h de media diaria [V, OSDR RadLab]. `marcoMarte: "observado"`. **También se midió la del 10 sep 2017** (`2017-09-10-x82`, ×2,3, también `observado`).
- Reusar la misma tormenta que Jezero tiene una ventaja didáctica: el niño ve **el mismo evento** desde otro lugar y entiende que lo que cambia es la base, no el Sol.
- **Lo que hay que decir siempre:** se midió en el cráter Gale, donde está Curiosity, no en el polo. Clave sugerida `mision.polo_norte.tormenta.donde` (§8).
- **Corrección al encargo:** el encargo decía que la simulación ENLIL la modela llegando a Marte. En nuestros datos crudos (`data/raw/2024-05/WSAEnlilSimulations.json`, consulta hasta el 2024-05-21) las corridas con esa CME (`WSA-ENLIL/31037/1` y `31038/1`) **no** incluyen a Marte en `impactList`: solo Solar Orbiter y Juno. Por eso el archivo curado no tiene `llegadaMarte`. Que una corrida posterior la mande a Marte: **NO VERIFICADO**.
- Unidades: RAD en RadLab da dosis **absorbida** (µGy/h). En la tarjeta de la tormenta y en el dilema van **solo µGy/h**. El 0,64 mSv/día (dosis equivalente) es otra magnitud: si aparece, va aparte y con la etiqueta "fondo de un día tranquilo, no la tormenta". No se convierten una en otra.

## 7. Dilema central (paso 6), sin receta

La tormenta llega cuando la base ya está guardando energía para la oscuridad.
- **Doctora:** "¡Subamos el escudo! La radiación sube mucho con esta tormenta."
- **Ingeniera:** "Si gastamos la batería en el escudo, no nos queda para la noche polar, y ahí el panel no da nada."
- **Iris (dañada):** "La batería está al 100 %." (lee ⚡ con +20 de error; la Ingeniera la verifica y la arregla).

| Opción | Acción | Qué gana | Qué pierde | La defiende |
|---|---|---|---|---|
| `refugiarse` | `refugiarse` | 🛡️ +12 con retraso, guarda la batería | 🫁 -6 ⚡ -3: la tripulación se aprieta | Doctora (plan B) |
| `escudo_con_bateria` | `subir_escudo` nivel 1 | 🛡️ +10 | ⚡ -8 justo antes de la noche polar | Doctora |
| `guardar_bateria` | `esperar` | ⚡ casi intacta para el paso 7 | 🛡️ sufre toda la tormenta | Ingeniera |

Ninguna es gratis. El texto nunca dice cuál es "la correcta": el Matemático puede simular con "¿y si…?".

## 8. Textos visibles (claves i18n sugeridas, inglés primero)

| Clave | en | es |
|---|---|---|
| `mision.polo_norte.nombre` | North Pole Base | Base del Polo Norte |
| `mision.polo_norte.paso1` | Summer is ending. The Sun circles low in the sky and never sets. | El verano se acaba. El Sol da vueltas bajito en el cielo y no se pone. |
| `mision.polo_norte.paso2` | Charge the battery before landing? | ¿Cargamos la batería antes de bajar? |
| `mision.polo_norte.paso3` | Pick a zone. Closer to the pole: more ice, less Sun. | Elige una zona. Más cerca del polo: más hielo, menos Sol. |
| `mision.polo_norte.zona.borde-sur.porque` | Lots of Sun for the panels, but the ice is far away. | Mucho Sol para los paneles, pero el hielo queda lejos. |
| `mision.polo_norte.zona.franja-media.porque` | Your supply drop lands here. Not much Sun, not much ice. | Aquí cae tu carga de provisiones. Ni mucho Sol ni mucho hielo. |
| `mision.polo_norte.zona.junto-al-casquete.porque` | Water is right next to you, but the panels barely work. | El agua está al lado, pero los paneles casi no funcionan. |
| `mision.polo_norte.escarcha` | Frost on the panels! They make half the energy. | ¡Escarcha en los paneles! Dan la mitad de energía. |
| `mision.polo_norte.tormenta.donde` | A real storm from May 20, 2024. The Curiosity rover measured it in Gale Crater, far from the pole. | Una tormenta real del 20 de mayo de 2024. El rover Curiosity la midió en el cráter Gale, lejos del polo. |
| `mision.polo_norte.dilema.pregunta` | Use the battery for the shield, or save it for the dark? | ¿Usamos la batería para el escudo o la guardamos para la oscuridad? |
| `mision.polo_norte.noche` | The polar night begins. The Sun won't rise for a long time. | Empieza la noche polar. El Sol no saldrá en mucho tiempo. |
| `mision.polo_norte.tiempo` | In the game, seasons go fast. A real year on Mars is almost two Earth years. | En el juego las estaciones pasan rápido. Un año de verdad en Marte dura casi dos años de la Tierra. |
| `mision.polo_norte.ciencia.eje` | Mars is tilted, like Earth. That's why near the pole there are days with no Sun at all. | Marte está inclinado, como la Tierra. Por eso cerca del polo hay días sin nada de Sol. |
| `mision.polo_norte.ciencia.bateria` | Solar energy must be saved while the Sun shines. | La energía del Sol hay que guardarla mientras brilla. |
| `mision.polo_norte.ciencia.hielo` ⚠️ F1 | The ice cap at Mars' north pole is mostly water ice. | El casquete del polo norte de Marte es sobre todo hielo de agua. |
| `mision.polo_norte.pregunta` | No Sun at the pole: where does the energy come from? | Sin Sol en el polo: ¿de dónde sale la energía? |
| `.pregunta.a` / `.b` / `.c` | From the ice / **From the battery we charged before** / From the storm | Del hielo / **De la batería que cargamos antes** / De la tormenta |
| `.pregunta.explicacion` | The panels only work with sunlight. What we saved before the night keeps the base going. | Los paneles solo funcionan con luz del Sol. Lo que guardamos antes de la noche mantiene la base. |

"Casi dos años" sale de 686,980 / 365,256 = 1,88 [V]. La tarjeta ⚠️ F1 no se muestra hasta que Daniel apruebe la fuente (`fuenteKey: null` mientras tanto).

## 9. Final: cadena de causas y tarjeta de ciencia

Cadena ejemplo (cada eslabón dice si fue **decisión** o **mala suerte**):
1. *Decisión:* elegiste `junto-al-casquete` → mucha agua, panel al 55 %.
2. *Decisión:* montaste `reciclador_agua` + `escudo`, sin batería.
3. *Mala suerte:* escarcha en los paneles (si salió).
4. *Tormenta real:* subiste el escudo con la energía que quedaba.
5. *Noche polar:* el panel dio 0 y no había batería → ⚡ llegó a 0 → rescate de entrenamiento.

Tarjeta de ciencia del paso 8: `mision.polo_norte.ciencia.eje` con fuente NSSDC (inclinación 25,19° [V]) y la marca "cálculo del equipo" para la altura del Sol. Etiqueta obligatoria: "datos reales curados, no en vivo".

## 10. Qué le toca a cada rol

- **diseño (Santiago, Camilo):** pasar §3–§7 a `missions/src/polo-norte.ts` y ajustar en `design/src/recursos.ts` los valores del polo (invernadero más caro, batería sin el +2 de 🛡️); textos `en`/`es` de §8; prueba de las 10 parejas con motor.
- **motor (Jaime):** factor de luz por zona sobre `panel_solar`; evento "noche polar" (panel = 0 desde un tick fijo); batería que guarda y devuelve energía (hoy `MODULOS` se aplica una sola vez).
- **agentes (José):** líneas de Ingeniera, Doctora y Meteoróloga para §3 y §7; Iris que lee mal la ⚡; nunca decir que RAD midió algo en el polo.
- **datos (Daniel), código pendiente en `data/`:**
  1. Extender `regionPoloNorte()` a las 3 latitudes (70, 76, 82° N) con `solMaxVeranoGrados` y el factor de luz (seno), con pruebas.
  2. **Duración de la noche polar por latitud** (fracción del año sin Sol), calculada con la inclinación y la órbita de NSSDC (excentricidad incluida). Hasta tenerla, nada de "X días".
  3. Tarjetas de fuente `en`/`es` para NSSDC (eje, irradiancia, año) y la de la tormenta con "medido en Gale".
  4. Decidir con Daniel si se aprueban F1–F3 (hielo de agua, CO₂ que se congela).
  5. (Opcional) reintentar el DEM polar de Mars Trek; si sale, las zonas pasan a ser sitios con terreno.
- **ui (María Paula):** esquema sin mapa (Sol bajo sobre 3 franjas), animación del Sol que deja de salir, tarjeta "medido en Gale".

## 11. Riesgos

- **Sin mapa:** puede sentirse menos "real" que Jezero. Mitigación: esquema del Sol y tarjeta de NSSDC; nunca dibujar un terreno inventado.
- **Contrato:** la zona por latitud no cabe en `SitioCandidato` (que apunta a `data/terreno/<id>`), y la noche polar y el factor de luz no existen en `GameState`. Si hacen falta campos nuevos, **propuesta de issue `contrato`** (no se cambia aquí). Plan B: la noche polar como evento guionado dentro de `missions/` y el factor de luz como tabla en `design/`.
- **Fuentes fuera de la lista (F1–F3):** si Daniel no las aprueba, se quita toda mención del hielo de agua y del CO₂; el criterio "hielo cerca" queda como valor de juego sin tarjeta, y la escarcha del 4b se cambia por otra mala suerte (p. ej. el polvo de Jezero).
- **Confusión de lugar:** que un texto diga "la tormenta en el polo subió ×19,4". Revisión de datos obligatoria en los textos de agentes.
- **Tiempo comprimido:** decirlo siempre (`mision.polo_norte.tiempo`), para no enseñar que la noche polar dura minutos.
- **Duplicar Jezero:** si diseño no tiene tiempo, esta misión puede salir solo como variante de semilla (misma tormenta, distinta zona y módulos).

## 12. Cifras y su fuente

| Cifra | Estado | Fuente |
|---|---|---|
| Inclinación del eje 25,19° | [V] | NASA NSSDC, ficha de Marte (act. 19 may 2025) https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html |
| Irradiancia 586,2 W/m² (Tierra 1361,0; 0,431) | [V] | NSSDC, misma URL |
| Gravedad 3,73 m/s² (0,380 veces la Tierra) | [V] | NSSDC, misma URL (no se usa en la misión) |
| Día de 24,6597 h | [V] | NSSDC, misma URL |
| Año de 686,980 días (1,881 veces la Tierra) | [V] | NSSDC, misma URL (consultada 2026-11-14) |
| Noche polar desde 64,81° N | derivado del [V] | 90 − 25,19, `data/src/region.ts` |
| Sol máximo en verano 45,2° / 39,2° / 33,2° (70/76/82° N) | derivado del [V] | 90 − lat + 25,19, `data/src/region.ts` |
| Factor de luz 0,71 / 0,63 / 0,55 | derivado (valor de juego) | seno de la altura del Sol; cálculo del equipo, pendiente de código |
| Duración de la noche polar en días | **NO VERIFICADO** (sin calcular) | pendiente, §10 |
| Tormenta: CME `2024-05-20T05:36:00-CME-001`, 1927 km/s | [V] | DONKI https://ccmc.gsfc.nasa.gov/DONKI/view/CME/31034/-1 (`data/curated/2024-05-20-marte.json`) |
| RAD: 4,1 → 79,7 µGy/h (×19,4; pico de muestra 304), dosis absorbida | [V] | OSDR RadLab `MSL-RAD-Surface` (URL en `data/curated/2024-05-20-marte.json`) |
| ENLIL manda la CME del 20 may 2024 a Marte | **NO VERIFICADO** (nuestros datos dicen que no) | `WSA-ENLIL/31037/1`, `31038/1` en `data/raw/2024-05` |
| Dosis de fondo 0,64 ± 0,12 mSv/día (2012-2013): **fondo de un día tranquilo, no la tormenta**; no va en la tarjeta de la tormenta ni en el dilema | [V] | Reitz et al. 2016, ICES2016 https://elib.dlr.de/106090/ (`data/ciencia/radiacion.json`) |
| Curiosity/RAD está en el cráter Gale | [V] para Gale (`docs/science/terreno.md`, `data/src/tormenta.ts`); "cerca del ecuador": **NO VERIFICADO** con URL | — |
| Retraso Marte–Tierra 3–22,3 min (un sentido) | [V] distancias, derivado el retraso | NSSDC, misma URL; `data/src/comunicaciones.ts` (rama `feat/datos-comunicaciones`) |
| F1: el casquete norte residual es sobre todo hielo de agua (el sur, sobre todo CO₂) | [V] **fuente fuera de la lista oficial — requiere aprobación de Daniel** | NASA Photojournal PIA06858 (2004) https://science.nasa.gov/photojournal/north-polar-cap/ |
| F2: en otoño e invierno ~30 % del CO₂ del aire se congela sobre el suelo | [V] **fuera de la lista — requiere aprobación de Daniel** | NASA/JPL, "Mars: Dry Ice and Dunes" (2013) https://www.jpl.nasa.gov/videos/mars-dry-ice-and-dunes/ |
| F3: capa estacional de hielo seco de "uno a dos pies" | [V] **fuera de la lista — requiere aprobación de Daniel**; no se usa en el texto para niños | misma URL que F2 |
| Escarcha que tapa los paneles | escenario de juego (no es un dato) | — |
| Temperaturas del polo | **NO VERIFICADO**, no se usan | — |
| Recursos 55/80/65, consumos, costos de módulos y zonas | valores de juego | `design/src/recursos.ts` y esta propuesta |
