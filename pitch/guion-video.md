# Guion del video de 2 minutos — Solar Shield

**Actualizado el 15 nov (mañana)** por un agente de apoyo a pedido de Santiago, contra lo que existe de verdad en `origin/develop` y `origin/feat/ui-escenarios` · Dueño: José (`pitch/`) · Base: ruta dorada (issue #41, 8 pasos) · Criterios y segundos: [criterios.md](criterios.md) · Entrega: [ENTREGA.md](ENTREGA.md)

Formato según `docs/ORQUESTACION.md`: grabación **real** del juego + narración de un **adulto** del equipo + títulos y gráficas de datos NASA + subtítulos EN/ES. **NO CONFIRMADO:** duración y formato oficiales del video (`docs/reglas.md`). Si el límite resulta menor, el corte corto es: gancho + pasos 4, 5, 6 y cierre.

## Qué es verdad hoy (la locución solo dice esto)

| Tema | Hecho | Fuente en el repo |
|---|---|---|
| Un solo juego jugable | **Una misión jugable: Marte, cráter Jezero, con la semilla dorada.** La pantalla llama a `partidaDorada()`; no hay selector de misión ni de semilla en la interfaz | `ui/src/App.tsx` |
| Otras 4 misiones | Luna lado visible, Luna polo sur, Marte polo norte y outpost sorpresa existen **como datos** en `missions/src/` (con fuentes y textos). **No se pueden jugar.** En el video no se presentan como jugables | `missions/src/`, #153–#156 |
| 3D | El juego va en 3D por decisión de Santiago (PR #244). El escenario 3D de Daniel (Three.js procedural, D6) está en PRs abiertos (#237, #239, #247–#257). **Por confirmar a las 13:00 qué parte está fusionada y montada en la pantalla de la base.** Hoy las pantallas de órbita, sitio, módulos, tormenta y final son interfaz 2D (DOM) | PRs abiertos, D6 |
| Iris | Es un **rover** en el mundo 3D (D6 y ORQUESTACION). Sigue siendo la IA de la base. Sus fallos son **guionados por reglas**, no del modelo. Mostrar el rover solo si el 3D está montado; si no, decir "Iris, the base AI" sin mostrar rover | D6, `docs/ia-uso.md` |
| Tripulación | Por su **rol**, sin nombres propios (D7): Engineer, Radiation Doctor, Space Weather expert; el "What if?" Mathematician existe como experto en código | D7 |
| Pasos 1–2 | El satélite orbita y muestra Batería, Señal y Escudo. **No hay dibujo de ruta sobre Jezero** (era el plan; no existe). No decirlo | `ui/src/pantallas/Satelite.tsx` |
| IA en el juego | La frase escrita se resuelve con **atajos y regex** (EN/ES) y botones. La pantalla **no llama** al clasificador con modelo (D4: sin modelo por ahora). El Worker `/api/clasificar` existe y está probado. **No hay voz** en la interfaz | `agents/`, D4, `ui/src` |
| Semillas | El motor genera escenarios distintos por semilla y se puede ganar y perder con cada una (prueba #221), pero **la interfaz solo juega la semilla dorada** | #221 |
| Sin conexión | **Por confirmar.** No hay service worker ni manifiesto. El motor corre en el navegador y las fuentes se sirven locales, así que tras cargar la página debería seguir funcionando con la red apagada; probarlo antes de decirlo | `ui/src/estilos/tokens.css` |

Reglas del guion (revisadas contra `docs/science/revision-agentes.md`):
- El inglés es el idioma base del video; subtítulos en español. La versión en español está abajo.
- Todo dato es **real y curado, no en vivo** (evento del 20 may 2024, consultado el 2026-11-13).
- Sin microgravedad en Marte, sin culpar síntomas a la radiación, sin Kp en Marte.
- El destello (luz, llega rápido) no es la nube de partículas (llega después).
- Personas: mSv/día. Detector: µGy/h. Nunca se convierten ni se mezclan.
- Sin logo de NASA. Personajes originales, sin referencias a franquicias.
- Sin menores en cámara ni voz de menores (términos legales, `docs/reglas.md`): narra un adulto y se graba solo la pantalla.

## Tabla de tiempos

Los tramos son los mismos de `criterios.md`.

| Tiempo | En pantalla (paso de la ruta dorada) | Locución (EN) | Rótulos en pantalla | Criterio |
|---|---|---|---|---|
| 0:00–0:10 | Gancho: portada y primera pantalla de la misión de Jezero; si el 3D está montado, base con el rover Iris | "Imagine you run a base on Mars. A real solar storm from May 2024 is on its way to your base. And the computer that helps you is about to get confused." | "Solar Shield" · "For ages 7–12 · In your browser · No download, no account" | Presentación |
| 0:10–0:22 | Pasos 1–2: la órbita del satélite con Batería, Señal y Escudo; luego la lista de sitios candidatos de Jezero | "Kids start by flying a satellite around Mars. Battery, signal and shield are limited, so even this has a cost." | "NASA Mars Trek terrain data, curated" | Validez, Relevancia |
| 0:22–0:40 | Pasos 3–4: sitios candidatos de Jezero con 3 criterios (ninguno gana en todo); aterriza y coloca 2 módulos, cada uno mueve 2 medidores (**decisión con costo antes de 0:40**) | "Then they choose a real landing site in Jezero crater and place modules. Every choice helps one meter and hurts another. Nothing is free." | "Every choice has a cost" · "Jezero crater: NASA Mars Trek" | Impacto, Relevancia |
| 0:40–0:55 | Paso 5: llega la tormenta, pausa y tarjeta de fuente (DONKI, ID, fecha). Gráfica del detector de Curiosity | "Then the storm arrives. It is real: May twentieth, twenty twenty-four, with its NASA DONKI record on screen. That day, the daily average measured by the RAD detector on Curiosity was about nineteen times higher than on a normal day. This is curated real data, not live." | "Data: NASA CCMC DONKI · 2024-05-20T05:36:00-CME-001" · "Curiosity RAD, NASA OSDR RadLab · detector units: µGy/h" · "Curated real data, not live" | Validez |
| 0:55–1:17 | Paso 6: Doctora ("refugio") e Ingeniera ("escudo") se contradicen, cada una con su dato. Se escribe una frase en el cuadro de texto de la tripulación (o se pulsa un botón) y aparece la etiqueta JSON (recuadro gráfico en edición) | "The crew are experts, and they disagree. The Doctor says take shelter. The Engineer says raise the shield. Each one shows its data. The AI only sorts a kid's words into a short label. The experts are code, so no number is ever invented." | "AI only classifies → strict JSON" · "Experts = code + NASA data" · "Doses for people: mSv/day" | Creatividad, Validez |
| 1:17–1:35 | Paso 6 (Iris): Iris, dañada, da un número que no coincide con el medidor; el niño mira el medidor y llama a la Ingeniera, que la repara | "Then radiation scrambles Iris, the base AI. She gives a number that doesn't match the meter. The kid checks the meter, asks the Engineer, and fixes her. The lesson: don't just obey a machine. Verify." | "Iris is confused by radiation" · "Check the meter" | Creatividad, Impacto |
| 1:35–1:47 | Paso 7: el jugador decide y envía telemetría; la barra de envío tarda en llegar | "Next, the kid decides and sends a report to Earth. A message to Earth takes from about 3 to 22 minutes, even at the speed of light." | "Mars–Earth delay: 3–22 min (NASA NSSDC distances + speed of light)" | Relevancia |
| 1:47–1:55 | Paso 8: cadena de causas (decisión vs. mala suerte), tarjeta de ciencia; cambio rápido EN → ES con el selector de idioma | "At the end, the game shows what caused what: your choices, or bad luck. It works in English and Spanish." | "Your choice vs. bad luck" · "EN / ES" | Impacto, Relevancia |
| 1:55–2:00 | Cierre: título, créditos con la lista de datos usados y atribución. Si la prueba de la red apagada sale bien, un plano corto de eso | "Solar Shield. Learn who to trust when technology fails." (+ solo si se probó: "It even works without internet.") | "Solar Shield" · "Unofficial project, not endorsed by NASA" · "Data: NASA (DONKI, OSDR RadLab, Mars Trek)" | Presentación |

Cambios frente al guion del 13 nov: se quitó "dibujan una ruta sobre Jezero" (no existe), "every game is different" (la interfaz solo juega la semilla dorada), "turns a kid's words" pasó a "sorts" y "It even works without internet" quedó condicionada a probarla.

## Locución en inglés (texto corrido)

Imagine you run a base on Mars. A real solar storm from May 2024 is on its way to your base. And the computer that helps you is about to get confused.

Kids start by flying a satellite around Mars. Battery, signal and shield are limited, so even this has a cost.

Then they choose a real landing site in Jezero crater and place modules. Every choice helps one meter and hurts another. Nothing is free.

Then the storm arrives. It is real: May twentieth, twenty twenty-four, with its NASA DONKI record on screen. That day, the daily average measured by the RAD detector on Curiosity was about nineteen times higher than on a normal day. This is curated real data, not live.

The crew are experts, and they disagree. The Doctor says take shelter. The Engineer says raise the shield. Each one shows its data. The AI only sorts a kid's words into a short label. The experts are code, so no number is ever invented.

Then radiation scrambles Iris, the base AI. She gives a number that doesn't match the meter. The kid checks the meter, asks the Engineer, and fixes her. The lesson: don't just obey a machine. Verify.

Next, the kid decides and sends a report to Earth. A message to Earth takes from about 3 to 22 minutes, even at the speed of light.

At the end, the game shows what caused what: your choices, or bad luck. It works in English and Spanish.

Solar Shield. Learn who to trust when technology fails.

(Última frase opcional, solo si se probó sin conexión: "It even works without internet.")

## Locución en español

Imagina que diriges una base en Marte. Se acerca a tu base una tormenta solar real de mayo de 2024. Y la computadora que te ayuda está a punto de confundirse.

Los niños empiezan volando un satélite alrededor de Marte. La batería, la señal y el escudo son limitados, así que hasta esto tiene un costo.

Luego eligen un sitio de aterrizaje real en el cráter Jezero y colocan módulos. Cada decisión ayuda a un medidor y perjudica a otro. Nada es gratis.

Entonces llega la tormenta. Es real: el veinte de mayo de dos mil veinticuatro, con su registro de DONKI, de la NASA, en pantalla. Ese día, la media diaria que midió el detector RAD de Curiosity fue unas diecinueve veces mayor que en un día normal. Son datos reales curados, no en vivo.

La tripulación son expertos, y no se ponen de acuerdo. La Doctora dice que hay que refugiarse. La Ingeniera dice que hay que subir el escudo. Cada una muestra su dato. La IA solo clasifica las palabras del niño en una etiqueta corta. Los expertos son código, así que ningún número se inventa.

Después la radiación confunde a Iris, la IA de la base. Ella da un número que no coincide con el medidor. El niño revisa el medidor, llama a la Ingeniera y la repara. La lección: no obedezcas a una máquina sin más. Verifica.

Luego el niño decide y envía un reporte a la Tierra. Un mensaje a la Tierra tarda de unos 3 a 22 minutos, aun a la velocidad de la luz.

Al final, el juego muestra qué causó qué: tus decisiones o la mala suerte. Funciona en inglés y en español.

Solar Shield. Aprende en quién confiar cuando la tecnología falla.

(Última frase opcional, solo si se probó sin conexión: "Incluso funciona sin internet.")

## Lista de tomas para la grabación (dom 15, 13:00–17:00)

Reglas de grabación: 1920×1080, navegador a pantalla completa, sin marcadores ni pestañas ajenas, idioma EN para el corte base y ES para el otro corte. Se graba **sin audio** del juego y la voz va después. Un adulto del equipo juega (nunca un menor). Cada toma se graba 2 veces.

**Previews.** Se graba sobre el build congelado de las 13:00. Orden de preferencia:
1. **Escenarios** (rediseño v8 y 3D): https://nasa-space-apps-2026-escenarios.santiago031541.workers.dev. Usarlo si a las 13:00 ya trae la base 3D montada (PRs #237 y #247 fusionados) y no hay errores en los pasos 1–8.
2. **Develop**: https://nasa-space-apps-2026-preview.santiago031541.workers.dev. Es la ruta dorada completa en pantallas 2D y es el respaldo seguro.
3. Producción (`main`, versión de las 11:40 del sáb): https://nasa-space-apps-2026.santiago031541.workers.dev, solo como último respaldo.

Antes de la toma 1, abrir el preview elegido en una ventana nueva y jugar la ruta completa una vez (ensayo). Anotar la hora y el commit del build en `ENTREGA.md`.

| # | Segundo del video | Pantalla y qué hacer en el juego | Notas de edición |
|---|---|---|---|
| T1 | 0:00–0:10 | Portada ("Solar Shield") y paso a la intro/carga; si el 3D está montado, 3 s de la base con Iris | Rótulos "Solar Shield" y "For ages 7–12 · In your browser · No download, no account". No mostrar láminas de `docs/referenciapau/` como capturas |
| T2 | 0:10–0:22 | Pasos 1–2, órbita: dejar que corra 4 s con Batería, Señal y Escudo visibles y pulsar "Continuar" | Rótulo "NASA Mars Trek terrain data, curated" aparece en la toma siguiente |
| T3 | 0:22–0:32 | Paso 3: lista de sitios de Jezero con 3 criterios; el cursor recorre las barras de dos sitios y se elige uno | Dejar visible la tarjeta de fuente del terreno si existe |
| T4 | 0:32–0:40 | Paso 4: colocar 2 módulos (por ejemplo panel solar y escudo) con los medidores visibles antes y después | Rótulo "Every choice has a cost". Cumple "decisión con costo antes de 0:40" |
| T5 | 0:40–0:55 | Paso 5: dejar correr la base hasta que llegue la tormenta; el juego se pausa. Mantener la tarjeta de fuente quieta 3 s con el ID y la fecha legibles | Intercalar el gráfico editado de Curiosity RAD (4,1 → 79,7 µGy/h, `data/curated/2024-05-20-marte.json`). Rótulos DONKI, RAD y "Curated real data, not live" |
| T6 | 0:55–1:08 | Paso 6: aparece el dilema; abrir a la Doctora ("shelter") y a la Ingeniera ("shield"), acercar al dato de cada una | Recuadro de rótulo "Experts = code + NASA data" |
| T7 | 1:08–1:17 | En el panel de tripulación, escribir una frase corta (por ejemplo "more shield please") o pulsar un botón y mostrar la respuesta | Recuadro gráfico con el JSON de ejemplo `{experto, accion, parametros, confianza}`; es un gráfico, **no** una captura del Worker. Rótulo "AI only classifies → strict JSON" |
| T8 | 1:17–1:35 | Iris falla (pregunta o aviso con un número que no coincide con el medidor); señalar el medidor; llamar a la Ingeniera y ver la reparación | Si el 3D está montado, 2 s del rover. Si no, no mostrar rover |
| T9 | 1:35–1:47 | Paso 7: elegir la salida del dilema y enviar telemetría; dejar ver la barra de envío | Rótulo "Mars–Earth delay: 3–22 min". Acelerar la espera en edición, sin cortar el texto del rótulo |
| T10 | 1:47–1:55 | Paso 8: pantalla final con cadena de causas y tarjeta de ciencia; luego cambiar el selector a Español y volver a mostrar la pantalla | Corte rápido EN → ES |
| T11 | 1:55–2:00 | Créditos con "datos usados" y atribución. **Opcional:** después de cargar la página, apagar el wifi y pulsar un botón (solo si funciona en la prueba) | Rótulos "Unofficial project, not endorsed by NASA" y "Data: NASA (DONKI, OSDR RadLab, Mars Trek)". Sin logo de NASA |

Cobertura por si una toma falla:
- Si el juego se atasca en un paso, cargar de nuevo y repetir solo esa toma; el estado de la semilla dorada es el mismo siempre.
- Si T8 no se ve claro, usar la grabación de prueba de la mañana.
- Si no queda tiempo de grabar en español, el corte en español usa el mismo video con subtítulos y la locución ES.

## Qué demuestra cada criterio

| Criterio | Dónde en el video |
|---|---|
| Impacto | 0:22–0:40 (decisiones con costo, niños de 7–12, sin descarga ni cuenta) y 1:47 (cadena de causas) |
| Creatividad | 1:17–1:35 (Iris se confunde, el niño verifica) y 0:55 (la IA solo clasifica) |
| Validez | 0:40–0:55 (DONKI con ID y fecha, Curiosity RAD, "no en vivo") |
| Relevancia | 0:10–0:40 (ninguna opción gratis), 1:35 (retraso de comunicaciones), 1:47 (cadena de causas, EN/ES) |
| Presentación | Gancho 0:00, decisión con costo antes de 0:40 (menos de 60 s), EN/ES, cierre con atribución |

## Checklist de revisión

- [ ] Evento DONKI con ID y fecha a la vista (0:40).
- [ ] Medición de Curiosity RAD con fuente (OSDR RadLab) y unidad µGy/h; ninguna cifra en mSv junto a ella.
- [ ] "El modelo solo clasifica a JSON; los expertos son código" dicho y mostrado (0:55).
- [ ] Iris falla y el niño verifica con el medidor (1:17).
- [ ] Retraso Marte–Tierra "3–22 min" con su fuente (NSSDC + velocidad de la luz) en el rótulo (1:35); nunca "4–24 min". Cifra en `data/src/comunicaciones.ts`.
- [ ] EN/ES visibles (1:47).
- [ ] "Funciona sin internet" solo si se probó (1:55); si no, quitar la frase.
- [ ] No se dice ni se muestra: dibujo de ruta, selector de misión, las otras 4 misiones como jugables, voz, semillas elegibles.
- [ ] "Proyecto no oficial, no avalado por NASA"; sin logo de NASA.
- [ ] Ninguna palabra "live" / "en vivo" salvo en "not live" / "no en vivo".
- [ ] Nada de microgravedad en Marte; sin síntomas atribuidos a radiación; sin Kp en Marte.
- [ ] Si se menciona el destello: es luz y llega rápido; la nube de partículas llega después. El evento del 20 may 2024 en DONKI es una CME de la cara oculta sin llamarada registrada: no mostrar un destello como su causa.
- [ ] Ningún menor en cámara ni su voz.

## Plan de grabación

| Cuándo | Qué | Quién |
|---|---|---|
| **Dom 15, 13:00** | **Congelar funciones** (build congelado). Desde aquí solo se arreglan errores. | todos |
| Dom 15, 13:00–17:00 | **Grabación final** con la lista de tomas de arriba, semilla dorada, en inglés (idioma base) y un corte en español. | `infra` + narrador |
| Dom 15, 17:00–19:00 | Edición, subtítulos EN/ES, revisión por una segunda persona (ciencia y atribuciones). | `infra` + `datos` |
| **Dom 15, antes de las 20:00** | **Enviar** el formulario (cierra a las 23:59). Dejar margen para un reenvío. | `infra` |

Los pasos con hora, responsable y enlace están en [ENTREGA.md](ENTREGA.md).

### Plan B si una pantalla no está lista
- **No mostrar las láminas de `docs/referenciapau/referencias/` como si fueran capturas del juego:** son arte conceptual de referencia. Si alguna aparece, rotularla "concept art".
- Si el mock trae datos inventados (IDs `MOCK-`), **no** mostrarlo en el plano de la tormenta: usar el gráfico editado con los datos reales de `data/curated/2024-05-20-marte.json`.
- Si el 3D no está montado: grabar en el preview de develop (pantallas 2D), sin rover, y la locución no cambia ("Iris, the base AI").
- Si el Worker del clasificador no está desplegado o no hay modelo: es lo normal hoy; la locución sigue siendo cierta, el modelo solo clasifica y el juego funciona sin él.
- Si no alcanza el tiempo para grabar sobre el build congelado: usar la grabación de prueba de la mañana como video de respaldo.
- El tráiler de `trailer/` usa capturas de la interfaz anterior; si se publica, regenerarlas con `capturar.mjs` sobre el build final o no usarlo como "juego real".

## No verificado en el repo (no inventar)

- Duración y formato oficiales del video, criterios oficiales 2026 y política de IA (`docs/reglas.md`).
- Cuánto del 3D (escenario, personajes, Iris rover) está fusionado y visible en el build de las 13:00.
- Las frases exactas de la Doctora, la Ingeniera e Iris salen de `agents/i18n/`; revisar la locución contra el texto final tras el congelado.
- La cifra "unas 19 veces" sale de `data/curated/2024-05-20-marte.json` (fondo 4,1 → 79,7 µGy/h, factor 19,4) y de `docs/science/datos-usados.md`.
- Funcionamiento sin conexión (no hay service worker).
- Nombre del narrador y música (si hay, de licencia libre; sin definir).
