# Submission form: draft answers · Formulario de entrega: borradores

> **Borrador — un segundo humano lo revisa antes de enviar.**

The form fields are not confirmed (the Submission Guide is not in the repo). These are the answers a form like this usually needs. **Before sending, check every sentence against the build that is actually deployed:** the game is still being built, and any feature listed here that is not in the final build must be deleted.

---

# ENGLISH

## Project title
Solar Shield

Subtitle: **POR VERIFICAR** (the Spanish subtitle is still undecided; see `docs/ORQUESTACION.md`). Also **POR VERIFICAR:** that the name does not clash with an existing game or brand.

## Challenge
Build a Junior Astronaut Mission Trainer.

## Short summary (49 words)
Solar Shield is a browser game where kids 7 to 12 build and defend a Mars base at Jezero crater. A real May 2024 solar storm, whose radiation rise Curiosity measured on Mars, forces trade-offs between power, life support and shielding. Experts advise; the base AI, Iris, can fail.

## Long description (about 300 words)
Solar Shield puts a child in charge of an outpost at Jezero crater on Mars. There are only three resources: power, life support (air, water, food) and shielding. Every action helps one meter and costs another, so no choice is free.

The star of the game is a real solar storm. The child chooses a landing site on a real map of Jezero, places modules, and then a storm arrives with its true NASA ID and date. The game pauses and shows a source card: which dataset, which event, when it was downloaded. The golden-path storm is the one of 20 May 2024, which the RAD instrument on the Curiosity rover measured on the Martian surface: about 19 times the usual radiation that day.

The child talks, by voice or text (or with buttons), to a crew of original expert characters: an Engineer, a Radiation Doctor and a Space Weather expert. They sometimes disagree, and that disagreement is the trade-off: following one piece of advice costs something, and so does ignoring it. The experts are ordinary code that reads the game state and NASA data and answers with prepared sentences; they never make numbers up.

At the start the base AI, Iris, guides the child. Radiation damages electronics, so Iris starts to make mistakes, such as giving a number that does not match the gauge. The child learns something real astronauts do: check the instruments and know whom to trust when technology fails.

Each game is built from a seed, so a classroom can compare strategies on the same scenario, and different seeds give different storms, sites and breakdowns. Failing never ends in a plain "Game over": the child sees a chain of causes (what was a decision, what was bad luck) and a science card.

The game runs in the browser with no download and no account, in English and Spanish. A small language model may only sort a child's phrase into a fixed label; the game works fully without it, and no audio is stored. All NASA data are real but curated and static, never shown as live. Unofficial project, not endorsed by NASA.

## How it meets the challenge
- **Real decisions** about life support, radiation shielding, power budgeting, food (inside life support) and communication delay, with no free option.
- **Ages 7 to 12:** simple words, terms explained in context, large buttons and text, keyboard play.
- **No download, no account;** source credits inside the tool.
- **Consequences tied to real space weather:** a real DONKI storm and a real Mars radiation measurement.
- **Replayable, and failing is safe:** seeds, chain of causes, science card.
- **Short explanation of NASA datasets:** an in-game page, "NASA data we used and why" (see `datos-nasa.md`).
- **POR VERIFICAR:** communication delay and food production must be visible in the final build (the challenge lists them; confirm the golden path shows them).

## How it uses NASA data
- **DONKI (NASA CCMC):** 8 real storms from 2017 and 2024 with their event IDs (flares, CMEs, energetic particles, geomagnetic storms). They drive the storm event. WSA-ENLIL runs give a modeled arrival at Mars, always called "a calculation".
- **OSDR RadLab (RAD, Curiosity; HERA, Artemis I):** radiation actually measured on Mars and inside Orion, in µGy/h (detector units, never converted to the mSv used for people).
- **Mars Trek:** real elevation, shaded relief and imagery of Jezero for the map; slope, sunlight and shielding scores are derived by us and labeled so.
- **Reference doses for people (mSv/day)** for Mars (NASA, Reitz 2016), and for the Moon and the ISS (Zhang 2020, China's Chang'e-4, not NASA).
- **OSDR studies** (food, bones, radiation) as end-of-game science cards; **NSSDC Mars fact sheet** for gravity and axis tilt.
- All data are curated and static (downloaded 2026-11-13); each card names the source and date. Details: `datos-nasa.md`.

## Tools and technology
TypeScript across the project; Zod to validate data and the classifier output; Vitest for tests; React and Vite for the interface; Cloudflare Pages and Workers for hosting and the optional classifier (**POR VERIFICAR:** confirm the final stack and versions in `atribuciones.md`); the browser's Web Speech API for optional voice; a small language model only as an optional phrase classifier. Built with AI coding agents (Claude Code, OpenCode, Codex) under human review; see `ia-uso.md`.

## Future work
- Add the Moon (south pole) and more Mars sites.
- Add the Mission Control expert, with a real communication delay.
- A teacher view: class codes so a whole class plays the same seed (teachers, never children, would have accounts).
- Reopen the model-based classifier with a faster model, and test with more children's phrases.
- Optional "Sun today" banner from live data, hidden whenever the API fails.
- More storms from the DONKI catalog and more science cards.

## Links
Game: **POR VERIFICAR** (public URL once deployed) · Video: **POR VERIFICAR** · Repository: **POR VERIFICAR** (the repo is private today; decide if it must be public) · Project license: **POR VERIFICAR**.

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

La estrella del juego es una tormenta solar real. El niño elige dónde aterrizar sobre un mapa real de Jezero, coloca módulos y llega una tormenta con su ID y fecha verdaderos de NASA. El juego se pausa y muestra una tarjeta de fuente: qué conjunto de datos, qué evento y cuándo se descargó. La tormenta de la ruta de demostración es la del 20 de mayo de 2024, que el instrumento RAD del rover Curiosity midió en la superficie de Marte: unas 19 veces la radiación normal ese día.

El niño habla, por voz o texto (o con botones), con una tripulación de personajes expertos originales: una Ingeniera, una Doctora de radiación y una Meteoróloga solar. A veces no están de acuerdo, y ese desacuerdo es el trade-off: seguir un consejo cuesta algo y no seguirlo también. Los expertos son código que lee el estado del juego y los datos de NASA y responde con frases preparadas; nunca inventan números.

Al principio Iris, la IA de la base, guía al niño. La radiación daña la electrónica, así que Iris empieza a equivocarse, por ejemplo dando un número que no coincide con el medidor. El niño aprende algo que hacen los astronautas de verdad: revisar los instrumentos y saber en quién confiar cuando falla la tecnología.

Cada partida nace de una semilla: un salón de clase puede comparar estrategias sobre el mismo escenario, y semillas distintas dan tormentas, sitios y averías distintos. Fallar nunca termina en un simple "Game over": el niño ve una cadena de causas (qué fue decisión y qué fue mala suerte) y una tarjeta de ciencia.

El juego corre en el navegador, sin descarga ni cuenta, en inglés y español. Un modelo de lenguaje pequeño solo puede clasificar la frase del niño en una etiqueta fija; el juego funciona completo sin él y no se guarda audio. Todos los datos de NASA son reales pero curados y estáticos, nunca presentados como "en vivo". Proyecto no oficial, no avalado por NASA.

## Cómo responde al reto
- **Decisiones reales** sobre soporte vital, blindaje contra la radiación, presupuesto de energía, comida (dentro del soporte vital) y retraso de comunicaciones, sin opción gratis.
- **Edades 7 a 12:** palabras simples, términos explicados en contexto, botones y texto grandes, juego con teclado.
- **Sin descarga ni cuenta;** créditos de las fuentes dentro de la herramienta.
- **Consecuencias ligadas al clima espacial real:** una tormenta real de DONKI y una medición real de radiación en Marte.
- **Rejugable y fallar es seguro:** semillas, cadena de causas, tarjeta de ciencia.
- **Explicación corta de los datos de NASA:** una página dentro del juego, "Datos de NASA usados y por qué" (ver `datos-nasa.md`).
- **POR VERIFICAR:** que el retraso de comunicaciones y la producción de comida se vean en la versión final (el reto los menciona).

## Cómo usa los datos de NASA
- **DONKI (NASA CCMC):** 8 tormentas reales de 2017 y 2024 con sus IDs (fulguraciones, nubes solares, partículas, tormentas magnéticas). Mueven el evento de tormenta. Las corridas WSA-ENLIL dan una llegada a Marte *modelada*, siempre llamada "un cálculo".
- **OSDR RadLab (RAD de Curiosity; HERA de Artemis I):** radiación realmente medida en Marte y dentro de Orión, en µGy/h (unidades del detector, nunca convertidas a los mSv que se usan para personas).
- **Mars Trek:** altura, relieve sombreado e imagen reales de Jezero para el mapa; pendiente, luz y blindaje los derivamos nosotros y se marcan como derivados.
- **Dosis de referencia para personas (mSv/día):** Marte (NASA, Reitz 2016), Luna e ISS (Zhang 2020, misión Chang'e-4 de China, no NASA).
- **Estudios OSDR** (comida, huesos, radiación) como tarjetas de ciencia; **ficha de Marte de NSSDC** para gravedad e inclinación del eje.
- Todo es curado y estático (descargado el 2026-11-13); cada tarjeta nombra la fuente y la fecha. Detalle: `datos-nasa.md`.

## Herramientas y tecnología
TypeScript en todo el proyecto; Zod para validar datos y la salida del clasificador; Vitest para pruebas; React y Vite para la interfaz; Cloudflare Pages y Workers para el sitio y el clasificador opcional (**POR VERIFICAR:** confirmar la pila final y versiones en `atribuciones.md`); Web Speech API del navegador para voz opcional; un modelo de lenguaje pequeño solo como clasificador opcional de frases. Hecho con agentes de código (Claude Code, OpenCode, Codex) bajo revisión humana; ver `ia-uso.md`.

## Trabajo futuro
- Añadir la Luna (polo sur) y más sitios de Marte.
- Añadir al experto Control de Misión, con retraso real de comunicaciones.
- Vista para docentes: códigos de salón para que toda una clase juegue la misma semilla (cuentas solo de docentes, nunca de niños).
- Reabrir el clasificador con modelo usando uno más rápido y probar con más frases de niños.
- Banner opcional "El Sol hoy" con datos en vivo, oculto cuando la API falle.
- Más tormentas del catálogo DONKI y más tarjetas de ciencia.

## Enlaces
Juego: **POR VERIFICAR** (URL pública al desplegar) · Video: **POR VERIFICAR** · Repositorio: **POR VERIFICAR** (hoy es privado; decidir si debe ser público) · Licencia del proyecto: **POR VERIFICAR**.
