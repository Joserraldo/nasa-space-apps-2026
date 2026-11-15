# Submission form: draft answers · Formulario de entrega: borradores

> **Borrador actualizado el 15 nov (mañana) contra `develop` y `feat/ui-escenarios` — un segundo humano lo revisa antes de enviar.** Lo escribió un agente de apoyo a pedido de Santiago; José (dueño de `pitch/`) debe revisarlo.

The form fields are not confirmed (the Submission Guide is not in the repo). **Before sending, check every sentence against the build that is actually deployed on submission day.** This draft only describes what exists today: one playable mission (Mars, Jezero crater, one fixed "golden" scenario), the experts, Iris, the real storm, the chain of causes. Anything else is under "Future work (not in this version)". Items marked **POR VERIFICAR** need a human check.

---

# ENGLISH

## Project title
Solar Shield

Subtitle: **POR VERIFICAR** (the Spanish subtitle is still undecided; see `docs/ORQUESTACION.md`). Also **POR VERIFICAR:** that the name does not clash with an existing game or brand.

## Challenge
Build a Junior Astronaut Mission Trainer.

## Short summary (about 50 words)
Solar Shield is a browser game where kids 7 to 12 build and defend a Mars base at Jezero crater. A real May 2024 solar storm, whose radiation rise Curiosity measured on Mars, forces trade-offs between power, life support and shielding. Experts advise; the base AI, Iris, can fail.

## Long description (about 300 words)
Solar Shield puts a child in charge of an outpost at Jezero crater on Mars. There are only three resources: power, life support (air, water, food) and shielding. Every action helps one meter and costs another, so no choice is free.

The star of the game is a real solar storm. The child flies a satellite, chooses a landing site among real candidate sites in Jezero (each scored on three criteria, and none wins them all), places modules, and then a storm arrives with its true NASA ID and date. The game pauses and shows a source card: which dataset, which event, when it was downloaded. The storm of 20 May 2024 is the one the RAD instrument on the Curiosity rover measured on the Martian surface: that day, its daily average was about 19 times higher than on a normal day (4.1 to 79.7 µGy/h).

The child talks to a crew of original expert characters, named by their role: an Engineer, a Radiation Doctor and a Space Weather expert (a "What if?" Mathematician answers hypotheticals). The child types a short phrase or uses buttons. The experts sometimes disagree, and that disagreement is the trade-off: following one piece of advice costs something, and so does ignoring it. The experts are ordinary code that reads the game state and NASA data and answers with prepared sentences; they never make numbers up.

The base AI, Iris, guides the child. Radiation damages electronics, so Iris starts to make mistakes, such as giving a number that does not match the gauge. Her mistakes are scripted by rules, so the lesson is controlled. The child learns something real astronauts do: check the instruments and know whom to trust when technology fails. The child also sends a report to Earth and waits through the real Mars-Earth message delay (about 3 to 22 minutes one way, computed from NASA distances and the speed of light).

Failing never ends in a plain "Game over": the child sees a chain of causes (what was a decision, what was bad luck) and a science card. The game engine can build different scenarios from different seeds (tested), but this version plays one fixed scenario.

The game runs in the browser with no download and no account, in English and Spanish. The submitted build classifies the child's phrase with keyword and regex shortcuts; it does not call a language model (**POR VERIFICAR** on submission day). No audio is recorded. All NASA data are real but curated and static, never shown as live. Unofficial project, not endorsed by NASA.

## How it meets the challenge
- **Real decisions** about life support, radiation shielding, power budgeting, food (inside life support) and communication delay (telemetry to Earth), with no free option.
- **Ages 7 to 12:** simple words, terms explained in context (an in-game glossary).
- **No download, no account;** source credits inside the game (credits screen and source cards).
- **Consequences tied to real space weather:** a real DONKI storm and a real Mars radiation measurement.
- **Failing is safe:** chain of causes and a science card instead of a plain "Game over". Replayability today is limited to the one scenario; seeds and more missions are future work.
- **Short explanation of NASA datasets:** an in-game page, "NASA data we used and why" (see `datos-nasa.md`).
- **POR VERIFICAR:** that food production and the communication delay are visible in the deployed build.

## How it uses NASA data
- **DONKI (NASA CCMC):** 8 real storms from 2017 and 2024 with their event IDs (flares, CMEs, energetic particles, geomagnetic storms). They drive the storm event. WSA-ENLIL runs give a modeled arrival at Mars, always called "a calculation".
- **OSDR RadLab (RAD, Curiosity; HERA, Artemis I):** radiation actually measured on Mars and inside Orion, in µGy/h (detector units, never converted to the mSv used for people).
- **Mars Trek:** real elevation, shaded relief and imagery of Jezero; slope, sunlight and shielding scores are derived by us and labeled so.
- **Reference doses for people (mSv/day)** for Mars (NASA, Reitz 2016), and for the Moon and the ISS (Zhang 2020, China's Chang'e-4, not NASA).
- **OSDR studies** (food, bones, muscle, immune system, radiation) as end-of-game science cards; **NSSDC Mars fact sheet** for gravity, axis tilt and distances to Earth.
- Curated for the extra missions that are not playable yet: Moon Trek and LRO data (Moon near side and south pole), Mars Trek polar elevation (Mars north pole), and food cards from the Canadian Space Agency (a challenge partner, not NASA).
- All data are curated and static (downloaded 13-15 November 2026); each card names the source and date. Details: `datos-nasa.md`.

## Tools and technology
TypeScript across the project; a pure TypeScript game engine that runs in the browser; Zod to validate data and the classifier output; Vitest unit tests and Playwright end-to-end tests in CI; React and Vite for the interface; Three.js (procedural, no external 3D models) for the 3D scene (**POR VERIFICAR:** how much of the 3D scene is merged and visible in the submitted build); Cloudflare Workers for the site and API, with D1 for optional accounts (**POR VERIFICAR:** whether login is reachable from the screen). Confirm the final stack and versions in `atribuciones.md`. Built with AI coding agents (Claude Code, OpenCode, Codex) under human review; see `ia-uso.md`.

## Future work (not in this version)
- Play the other four missions. Their data and texts exist (Moon near side, Moon south pole, Mars north pole, surprise outpost) but they are not playable.
- Choose a mission and a seed from the screen, so a class can compare strategies on the same scenario and different seeds give different storms, sites and breakdowns.
- Draw a satellite route over Jezero.
- Voice input and output (none in this version).
- A language-model phrase classifier: built and tested behind a Worker, but not enabled; reopen it with a faster model and test with more children's phrases.
- A teacher view: class codes (teachers, never children, would have accounts).
- Optional "Sun today" banner from live data, hidden whenever the API fails.
- More storms from the DONKI catalog and more science cards.

## Links
Game: **POR VERIFICAR** (production https://nasa-space-apps-2026.santiago031541.workers.dev serves `main`; decide which URL is submitted and re-test it) · Video: **POR VERIFICAR** (see `../ENTREGA.md`) · Repository: https://github.com/Joserraldo/nasa-space-apps-2026 (public) · Project license: **POR VERIFICAR** (no `LICENSE` file yet).

---

# ESPAÑOL

## Título del proyecto
Solar Shield

Subtítulo: **POR VERIFICAR** (aún sin decidir). También **POR VERIFICAR:** que el nombre no choque con otro juego o marca.

## Reto
Build a Junior Astronaut Mission Trainer (Construye un entrenador de misiones para jóvenes astronautas).

## Resumen corto
Solar Shield es un juego web donde niños de 7 a 12 años construyen y defienden una base en Marte, en el cráter Jezero. Una tormenta solar real de mayo de 2024, cuya subida de radiación midió Curiosity en Marte, obliga a decidir entre energía, soporte vital y blindaje. Los expertos aconsejan; Iris, la IA de la base, puede fallar.

## Descripción larga
Solar Shield pone a un niño al mando de un puesto avanzado en el cráter Jezero, en Marte. Solo hay tres recursos: energía, soporte vital (aire, agua y comida) y blindaje. Cada acción ayuda a un medidor y le cuesta a otro, así que ninguna decisión es gratis.

La estrella del juego es una tormenta solar real. El niño vuela un satélite, elige dónde aterrizar entre sitios candidatos reales de Jezero (cada uno puntuado en tres criterios, y ninguno gana en todos), coloca módulos y llega una tormenta con su ID y fecha verdaderos de NASA. El juego se pausa y muestra una tarjeta de fuente: qué conjunto de datos, qué evento y cuándo se descargó. La tormenta del 20 de mayo de 2024 es la que el instrumento RAD del rover Curiosity midió en la superficie de Marte: ese día, su media diaria fue unas 19 veces mayor que en un día normal (de 4,1 a 79,7 µGy/h).

El niño habla con una tripulación de personajes expertos originales, llamados por su rol: una Ingeniera, una Doctora de radiación y una Meteoróloga solar (un Matemático del "¿Y si…?" responde hipótesis). El niño escribe una frase corta o usa botones. A veces los expertos no están de acuerdo, y ese desacuerdo es el trade-off: seguir un consejo cuesta algo y no seguirlo también. Los expertos son código que lee el estado del juego y los datos de NASA y responde con frases preparadas; nunca inventan números.

Iris, la IA de la base, guía al niño. La radiación daña la electrónica, así que Iris empieza a equivocarse, por ejemplo dando un número que no coincide con el medidor. Sus errores los guionan reglas, así que la lección es controlada. El niño aprende algo que hacen los astronautas de verdad: revisar los instrumentos y saber en quién confiar cuando falla la tecnología. También envía un reporte a la Tierra y espera el retraso real de los mensajes Marte–Tierra (de unos 3 a 22 minutos en un sentido, calculado con distancias de NASA y la velocidad de la luz).

Fallar nunca termina en un simple "Game over": el niño ve una cadena de causas (qué fue decisión y qué fue mala suerte) y una tarjeta de ciencia. El motor puede construir escenarios distintos con semillas distintas (probado), pero esta versión juega un escenario fijo.

El juego corre en el navegador, sin descarga ni cuenta, en inglés y español. La versión entregada clasifica la frase del niño con atajos de palabras y regex; no llama a un modelo de lenguaje (**POR VERIFICAR** el día de la entrega). No se graba audio. Todos los datos de NASA son reales pero curados y estáticos, nunca presentados como "en vivo". Proyecto no oficial, no avalado por NASA.

## Cómo responde al reto
- **Decisiones reales** sobre soporte vital, blindaje contra la radiación, presupuesto de energía, comida (dentro del soporte vital) y retraso de comunicaciones (telemetría a la Tierra), sin opción gratis.
- **Edades 7 a 12:** palabras simples, términos explicados en contexto (un glosario dentro del juego).
- **Sin descarga ni cuenta;** créditos de las fuentes dentro del juego (pantalla de créditos y tarjetas de fuente).
- **Consecuencias ligadas al clima espacial real:** una tormenta real de DONKI y una medición real de radiación en Marte.
- **Fallar es seguro:** cadena de causas y tarjeta de ciencia en lugar de un simple "Game over". La rejugabilidad hoy se limita a un escenario; las semillas y más misiones son trabajo futuro.
- **Explicación corta de los datos de NASA:** una página dentro del juego, "Datos de NASA usados y por qué" (ver `datos-nasa.md`).
- **POR VERIFICAR:** que la producción de comida y el retraso de comunicaciones se vean en la versión desplegada.

## Cómo usa los datos de NASA
- **DONKI (NASA CCMC):** 8 tormentas reales de 2017 y 2024 con sus IDs (fulguraciones, nubes solares, partículas, tormentas magnéticas). Mueven el evento de tormenta. Las corridas WSA-ENLIL dan una llegada a Marte *modelada*, siempre llamada "un cálculo".
- **OSDR RadLab (RAD de Curiosity; HERA de Artemis I):** radiación realmente medida en Marte y dentro de Orión, en µGy/h (unidades del detector, nunca convertidas a los mSv que se usan para personas).
- **Mars Trek:** altura, relieve sombreado e imagen reales de Jezero; pendiente, luz y blindaje los derivamos nosotros y se marcan como derivados.
- **Dosis de referencia para personas (mSv/día):** Marte (NASA, Reitz 2016), Luna e ISS (Zhang 2020, misión Chang'e-4 de China, no NASA).
- **Estudios OSDR** (comida, huesos, músculo, defensas, radiación) como tarjetas de ciencia; **ficha de Marte de NSSDC** para gravedad, inclinación del eje y distancias a la Tierra.
- Curados para las misiones extra que aún no se pueden jugar: Moon Trek y LRO (Luna lado visible y polo sur), altura polar de Mars Trek (polo norte de Marte) y tarjetas de comida de la Agencia Espacial Canadiense (socia del reto, no NASA).
- Todo es curado y estático (descargado del 13 al 15 de noviembre de 2026); cada tarjeta nombra la fuente y la fecha. Detalle: `datos-nasa.md`.

## Herramientas y tecnología
TypeScript en todo el proyecto; un motor de juego en TypeScript puro que corre en el navegador; Zod para validar datos y la salida del clasificador; Vitest para pruebas unitarias y Playwright para pruebas de extremo a extremo en CI; React y Vite para la interfaz; Three.js (procedural, sin modelos 3D externos) para la escena 3D (**POR VERIFICAR:** cuánto de la escena 3D está fusionado y visible en la versión entregada); Cloudflare Workers para el sitio y la API, con D1 para cuentas opcionales (**POR VERIFICAR:** si el login se alcanza desde la pantalla). Confirmar la pila final y versiones en `atribuciones.md`. Hecho con agentes de código (Claude Code, OpenCode, Codex) bajo revisión humana; ver `ia-uso.md`.

## Trabajo futuro (no está en esta versión)
- Jugar las otras cuatro misiones. Sus datos y textos existen (Luna lado visible, Luna polo sur, Marte polo norte, outpost sorpresa) pero no se pueden jugar.
- Elegir misión y semilla desde la pantalla, para que una clase compare estrategias sobre el mismo escenario y semillas distintas den tormentas, sitios y averías distintos.
- Dibujar la ruta de un satélite sobre Jezero.
- Entrada y salida de voz (no hay en esta versión).
- Un clasificador de frases con modelo de lenguaje: hecho y probado detrás de un Worker, pero no activado; reabrirlo con un modelo más rápido y probar con más frases de niños.
- Vista para docentes: códigos de salón (cuentas solo de docentes, nunca de niños).
- Banner opcional "El Sol hoy" con datos en vivo, oculto cuando la API falle.
- Más tormentas del catálogo DONKI y más tarjetas de ciencia.

## Enlaces
Juego: **POR VERIFICAR** (producción https://nasa-space-apps-2026.santiago031541.workers.dev sirve `main`; decidir qué URL se entrega y probarla de nuevo) · Video: **POR VERIFICAR** (ver `../ENTREGA.md`) · Repositorio: https://github.com/Joserraldo/nasa-space-apps-2026 (público) · Licencia del proyecto: **POR VERIFICAR** (aún no hay archivo `LICENSE`).
