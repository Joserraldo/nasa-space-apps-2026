# Diseño de juego: público, diagnóstico, historia, campaña y mecánicas

**Estado:** campaña, nombres y misiones lunares aparte **APROBADOS** por María
Paula el 2026-11-25 (`docs/DECISIONES.md`, DV-01 y DV-02). El resto sigue como
propuesta. Parte del repo `Joserraldo/nasa-space-apps-2026`, rama
`develop` (commit `cf48c72`, 2026-11-17), leído el 2026-11-25. Varias secciones
contradicen decisiones aprobadas del equipo (D6, D7, la campaña de
`NIVELES.md`); la sección 9 lista qué hay que aprobar y con quién.

**Regla que no se mueve:** si algo de aquí choca con el reto de NASA
(`docs/referenciapau/RETO.md` del repo), gana el reto.

---

## 1. Público objetivo

### 1.1 Quién es

| Dato | Valor | Fuente |
|---|---|---|
| Rango del reto | 7 a 12 años | Reto *Build a Junior Astronaut Mission Trainer* |
| Núcleo de diseño propuesto | **7 a 10 años** | Pedido del usuario |
| Cómo se cubre 11-12 | Dificultades media, difícil y hardcore, que ya existen en el motor | `PLAN.md` del repo §2.6 |
| Etapa cognitiva | Operaciones concretas (7-11): razona bien con objetos e imágenes, le cuesta lo abstracto e hipotético | Piaget, vía Simply Psychology |
| Lectura | Muy desigual a los 7-8; a los 9-10 lee frases cortas sin problema | NN/G; Springer (63 pautas para 6-8 años) |
| Qué juegan | Roblox y Minecraft lideran por amplio margen; sandbox y creativo es el género favorito | Childwise 2025 (Reino Unido, 3-12 años); Morning Consult (Gen Alpha) |
| Sus favoritos dentro de Roblox (7-12) | *Grow a Garden*, *Dress to Impress*, *Brookhaven*, *Blox Fruits*, *Adopt Me* | Childwise, verano 2025, vía Kidscreen |

### 1.2 Qué nos dice esa lista de favoritos

| Juego | Bucle que atrapa | Cómo lo traducimos (sin copiar nada de esos juegos) |
|---|---|---|
| *Grow a Garden* | Plantar, esperar, cosechar, mejorar | **Invernadero vivo**: cultivos que crecen entre capítulos. Cubre la "producción de comida" que hoy está floja en el reto |
| *Adopt Me* | Cuidar a alguien que depende de vos | **Iris** como compañera que se daña y hay que cuidar y reparar |
| *Dress to Impress* | Personalizar y mostrarse | Personalizar traje, casco y cuarto propio con lo que se gana |
| *Brookhaven* | Juego de rol en un pueblo que se recorre | **Colonia recorrible**: las acciones pasan en las salas, no en menús |
| Minecraft | Construir y ver crecer lo propio | **La colonia crece** capítulo a capítulo con lo que el niño decide construir |

### 1.3 Reglas de diseño que salen de la investigación

| # | Regla | Por qué |
|---|---|---|
| R1 | **Todo texto tiene voz.** Máximo ~12 palabras por línea, con icono. | A los 7-8 la lectura es muy desigual; las pautas para 6-8 piden carga de lectura baja y audio en cada instrucción |
| R2 | **Recursos como objetos, no como números.** Batería que se vacía, burbuja de aire y comida, escudo que se agrieta. Los números solo en dificultad media o más. | Operaciones concretas; en NN/G los niños vieron un número en pantalla y no lo conectaron con el objetivo, aun con audio |
| R3 | **El objetivo siempre visible**, dicho en una frase y con un dibujo. | NN/G: el fallo típico es explicar los controles y no cómo se gana |
| R4 | **Hacer en el lugar.** Para cosechar se va al invernadero; para reparar a Iris, al taller. | La retroalimentación dentro del mundo (diegética) subió la motivación de niños de 7-8 en un estudio de juego de matemáticas en RA; un botón que no se conecta con el fenómeno produce "dislocación" |
| R5 | **Retroalimentación inmediata y animada; fallar no castiga.** El "rescate de entrenamiento" del repo se mantiene. | Bucle explorar, probar, recibir respuesta, ajustar, reintentar; las pautas para 6-8 piden error sin penalización |
| R6 | **Pocas opciones por pantalla**: 2 o 3. | Memoria de trabajo menor que la de un adulto |
| R7 | **Capítulos de 10 a 15 minutos** con guardado automático. | Sesiones cortas en esta edad |
| R8 | **Historia al servicio de lo que se enseña.** Cada escena de historia termina en una decisión que enseña algo. | Los metaanálisis no se ponen de acuerdo sobre si la narrativa ayuda: una historia que distrae del contenido sube la carga cognitiva y empeora el aprendizaje |
| R9 | **Escribir no es obligatorio.** El chat con la tripulación queda como opción; lo principal es tocar al personaje y elegir entre 2 o 3 preguntas. | Teclear es lento y frustra a los 7-8 |
| R10 | **Explicar en contexto** "dosis", "radiación", "sol (día de Marte)", "telemetría". | Lo pide el reto; el glosario del repo existe pero no se muestra en pantalla |

### 1.4 Ideas erróneas que el juego puede corregir

- Muchos niños creen que **Marte es caliente** por su color, y que **el Sol no es una estrella** (Explorify, guía docente). El juego muestra -59 °C de media y llama al Sol "nuestra estrella".
- Ideas comunes sobre la radiación: que "se pega" y vuelve radiactivo lo que toca, o que cualquier radiación es letal (estudio con estudiantes de secundaria). El juego enseña dosis acumulada con una comparación: "como el sol en la piel".
- Que el viento solar es un viento fuerte como el de la Tierra (lista de ideas erróneas de astronomía universitaria). El juego lo muestra como partículas, no como ráfagas.

No encontré investigación específica sobre ideas erróneas de niños de primaria acerca de la radiación espacial: **revisado, sin hallazgos**.

---

## 2. Diagnóstico de lo que hay

Revisado sobre `develop`: `PLAN.md`, `docs/referenciapau/HISTORIA.md`, `RETO.md`,
`ESCENAS.md`, `MARTE.md`, `D6`, `D7`, `missions/src/*` y las capturas de
`ui/capturas/integracion-develop/` y `ui/capturas/ilustraciones/`.

### 2.1 Lo que está bien y se conserva

- **Base científica sólida**: tormenta real del 20 de mayo de 2024 medida por Curiosity, terreno real de Jezero (Mars Trek), fuentes visibles, "datos reales, no en vivo". `MARTE.md` es de un rigor poco común.
- **Iris que se daña y se equivoca**: enseña a verificar antes de obedecer. Es la idea más original del proyecto.
- **Expertas que no se ponen de acuerdo**: el trade-off se vuelve una conversación.
- **Fallar sin castigo** con la cadena de causas (decisión frente a mala suerte).
- **La portada** (`portada-1440x900.png`): ilustración fuerte, legible, con personaje simpático. Es el mejor activo visual del proyecto.
- El motor, las semillas, i18n inglés y español, los clasificadores seguros.

### 2.2 Problemas

| # | Problema | Evidencia | Impacto en 7-10 años |
|---|---|---|---|
| P1 | **La pantalla de juego parece un tablero de control, no un juego.** Escena 3D en el 58 % izquierdo y panel de botones con frases a la derecha. | `e6-1440x900.png` | El mundo es decorado; la acción pasa en botones |
| P2 | **Botones con frases largas** ("Spacewalk to fix the pan…", cortado) e instrucciones abstractas ("Pick an action to see what it costs now and what it brings later"). | `e6-1440x900.png` | Un niño de 7 no lo lee ni lo entiende |
| P3 | **Recursos como números** (Energy 55, Life support 74, Shielding 52, "+13 on the way") y controles de turno y velocidad. | `e6`, `e7` | Contradice R2; "on the way" (efecto diferido) es abstracto |
| P4 | **Campo de texto "Ask your crew…"** como forma principal de hablar con la tripulación. | `e6`, `e7` | Teclear frustra a esa edad |
| P5 | **La premisa no tiene meta emocional.** "Entrenamiento" y "proteger la base de una tormenta" no dicen *para qué*. | `HISTORIA.md` §1 | No hay razón para volver al día siguiente |
| P6 | **Personajes sin nombre** ("la Ingeniera", "la Doctora"). | `D7` | Los niños se apegan a personajes con nombre y rasgos; "la Doctora de radiación" no es alguien, es un cargo |
| P7 | **Las 5 misiones repiten la misma plantilla de 8 pasos** (satélite, sitio, 2 módulos, tormenta, dilema, telemetría, final). | `missions/src/textos.ts` | La segunda misión ya se siente igual a la primera |
| P8 | **Campaña dispersa**: 2 misiones en la Luna, 2 en Marte y una nave, sin hilo narrativo. Solo Jezero es jugable. | `HISTORIA.md` §6 | No hay colonia que crezca ni historia que avance |
| P9 | **Comida y retraso de comunicaciones flojos**, siendo 2 de los 5 objetivos del reto. | `RETO.md` §2.1 (marcados "Parcial") | Riesgo directo en la evaluación |
| P10 | **Escena procedural plana**: colores pastel sin oclusión ambiental ni profundidad, módulos de juguete, sin interiores reales. | `e6`, `e7` | No alcanza la estética de las referencias que le gustan al usuario |

---

## 3. Historia propuesta

### 3.1 Premisa en una frase

> **Las primeras familias de la Tierra llegan a Marte en 100 soles. Vos, la
> astronauta más joven, la tripulación y Iris tienen que dejar lista la primera
> colonia: con aire, comida, energía y un lugar seguro para cuando el Sol se enoje.**

Por qué funciona para 7-10:
- **Meta concreta y emocional**: preparar un hogar para familias (como la propia) que vienen en camino. Se entiende sin explicación.
- **Reloj amable**: los 100 soles avanzan entre capítulos; no hay presión de tiempo dentro de la partida.
- **Sin muertes ni violencia**: el riesgo es que la colonia no esté lista; si algo sale mal, la Tierra rescata y se reintenta (se mantiene el "rescate de entrenamiento").
- **Enseña "sol" como día de Marte** desde la premisa (R10).
- **Final que cierra**: la nave de las familias aterriza y la colonia se ilumina. Se ve todo lo que el niño construyó.

**Compatibilidad con el canon actual:** se mantiene que el jugador es astronauta
junior, la tripulación aconseja, el niño decide, Iris falla y la tormenta es real.
Cambia el *para qué*: de "entrenamiento" a "preparar la colonia". Si el equipo
prefiere conservar la palabra "entrenamiento", la premisa funciona igual como
"la misión de entrenamiento más importante: la colonia de verdad".

### 3.2 Personajes

| Personaje | Propuesta | Arco a lo largo de la campaña |
|---|---|---|
| **Vos** | Astronauta junior personalizable (traje, casco, cuarto) | De seguir a Iris a decidir sola o solo |
| **Iris** | Rover de 4 ruedas con cara en pantalla (se mantiene). Es **la compañera**: curiosa, un poco torpe, aprende con vos | Guía (C1), da pistas (C2-C3), se daña (C2, C4), queda desconectada y el niño decide solo (C5). Al final se repara del todo y "se gradúa" con vos |
| **Tess**, la Ingeniera | Energía y reparaciones. Ahorradora, cuenta tornillos en voz alta | Repara a Iris; arma el garaje y el rescate del rover |
| **Nia**, la Doctora | Radiación y salud. Sobreprotectora, pone curitas hasta a los robots | Diseña el refugio; defiende "refugiarse" en las tormentas |
| **Vera**, la Meteoróloga | Clima espacial. Dramática, les pone nombre de mascota a las llamaradas | Avisa las tormentas; protagoniza la tormenta de polvo |
| **Teo**, el Matemático | "¿Y si…?" Literal, solo da números | Se suma en C3 (como hoy: después de la rebanada vertical) |
| **Control de Misión** | La Tierra, con retraso | Se queda sin señal en C5 (conjunción solar) |

**Nombres propios (aprobado, DV-02):** Tess, Nia, Vera y Teo. La primera vez se
presentan con su rol ("Tess, the engineer"); después, solo por el nombre.

### 3.3 Intro (cinemática de 60 a 90 s, omitible)

Usa el sistema de cámara del plan visual (WS7). Cada toma es un JSON. La
**primera decisión con costo llega antes de los 60 s**, como pide `RETO.md` §5.

| Toma | Duración | Imagen | Voz / texto (una línea) | Escenario |
|---|---|---|---|---|
| 1 | 6 s | La Tierra pequeña y azul; una nave se aleja | "Some families are getting ready for a long trip…" | Espacio |
| 2 | 6 s | Dentro de la nave: la niña o el niño mirando por la ventana; Marte crece | "…and you go first." | Cabina de la nave |
| 3 | 8 s | Iris se enciende en la mesa redonda, saluda | "Hi! I'm Iris. I'll help you get the colony ready." | Sala común de la nave |
| 4 | 10 s | Paneo por la tripulación; cada una hace su gesto de personalidad | Una frase por persona: "Tess, the engineer", "Nia, the doctor", "Vera, the solar expert" | Sala común |
| 5 | 6 s | Mapa holográfico: Marte, un punto en Jezero, "100 sols" | "The families land in 100 sols. A sol is one day on Mars." | Mesa holográfica |
| 6 | 8 s | Alarma suave; la Meteoróloga señala el Sol | "Wait… the Sun is acting up!" | Sala común |
| 7 | — | **Primera decisión**: ¿refugio de la nave o escudo? Dos tarjetas con dibujo | (decisión con costo, ~45 s después de empezar) | Refugio o puente |

Después de la decisión empieza el Capítulo 1.

---

## 4. Campaña: una colonia, cinco capítulos

**Cambio propuesto:** la campaña pasa a ser **un solo viaje que termina en una
colonia en Marte**. Los datos y voces que el equipo ya hizo se reutilizan donde
encajan. Las dos misiones lunares salen de la campaña principal (sección 4.3).

El reto permite "base en la Luna **o** en Marte": una campaña solo en Marte lo cumple.

### 4.1 Los capítulos

| Cap. | Título | Objetivo del reto que enseña | Mecánica firma (lo nuevo de este capítulo) | Evento real de NASA | Iris | Reutiliza del repo |
|---|---|---|---|---|---|---|
| **C1** | **El viaje** | Blindaje contra radiación | Refugio de la nave: mover a la tripulación al refugio cuando llega la tormenta, sabiendo qué deja de funcionar | En el viaje a Marte, RAD de Curiosity midió casi 3 veces más radiación que en la superficie (ya está en `missions/src/textos.ts`) | Guía (nivel 1) | `outpost-sorpresa.ts` (la nave del espacio profundo) y sus voces |
| **C2** | **Llegada a Jezero** | Presupuesto de energía y soporte vital | Satélite, elegir sitio y primeros 2 módulos (los pasos actuales de Jezero) | Tormenta solar real del 20 de mayo de 2024 medida por Curiosity | Pistas; **se daña** en la tormenta (nivel 2-3) | `jezero.ts` completo, que es la única misión jugable hoy |
| **C3** | **Comida para todos** | **Producción de comida** | **Invernadero vivo**: plantar, regar con agua reciclada, cosechar; el agua y la luz salen de la energía. Los cultivos siguen creciendo en capítulos siguientes | En la Estación Espacial crecieron chiles durante 137 días y dieron 26 (ya citado en el repo, fuente OSDR) | Pistas (nivel 2) | Módulos invernadero y reciclador; tarjetas de ciencia ya escritas |
| **C4** | **La gran tormenta de polvo** | Energía y soporte vital bajo presión | **Racionar energía de noche y de día oscuro** (paneles casi sin luz) y **rescatar un rover** varado con el garaje y los vehículos | Tormenta global de 2018: el rover Opportunity perdió la luz para sus paneles y quedó en silencio el 10 de junio de 2018 | **Se daña** (nivel 3) | Evento `polvo` y mazo "rescatar un rover" de `PLAN.md` §2.5 |
| **C5** | **Silencio con la Tierra** | **Retraso de comunicaciones** | **Conjunción solar**: la Tierra no contesta durante dos semanas; antes hay que mandar datos y dejar planes. Expedición al hielo del polo norte para traer agua | La conjunción solar de Marte pausa los comandos de NASA unas dos semanas cada ~2 años; el casquete norte es hielo de agua todo el año | **Desconectada**: el niño decide solo (nivel 4). Al final se repara | `marte-polo-norte.ts` y sus voces; telemetría |
| **Final** | **Llegan las familias** | Repaso de los 5 objetivos | Recorrido por la colonia que construiste; cadena de causas de toda la campaña | — | Reparada | Pantalla final y cadena de causas |

### 4.2 Por qué este orden

- **Lo que se enseña crece de a poco**: un recurso primero (blindaje), después los tres, después comida, después todo bajo presión, y al final sin ayuda.
- **El retraso de comunicaciones crece con la historia**: segundos en la nave cerca de la Tierra, minutos en Jezero, dos semanas de silencio en la conjunción.
- **Iris sigue los 4 niveles** que el diseño ya tenía (`PLAN.md` §2.4), pero ahora repartidos en la campaña en vez de en una sola misión.
- **La colonia crece a la vista**: 2 módulos en C2, invernadero en C3, garaje y refugio en C4, comunicaciones y extracción de hielo en C5.

### 4.3 Qué pasa con las misiones lunares

`luna-polo-sur.ts` y `luna-lado-visible.ts` tienen datos y voces hechos
(`agents/src/voces-luna-*.ts`). Opciones:

| Opción | A favor | En contra |
|---|---|---|
| **A. Sacarlas de la campaña y dejarlas como "misiones extra"** después del final (recomendada) | La campaña principal queda en Marte y con hilo; no se tira trabajo | Hay que construir terreno lunar gris (sí lo cubre el kit de interiores) |
| B. Convertirlas en un prólogo lunar antes del viaje (tipo puerta de entrada Luna-Marte) | Muy fiel a la estrategia real de NASA "Moon to Mars" | La campaña se alarga y Marte llega tarde: los niños quieren Marte |
| C. Borrarlas | Menos trabajo | Se pierde trabajo del equipo |

### 4.4 Variaciones que se mantienen

Las semillas, los 4 sitios de Jezero, el sorteo de tormentas reales y la mala
suerte (micrometeorito, fallo de panel, fuga) siguen igual dentro de cada capítulo.

---

## 5. Mecánicas y UI

### 5.1 Pilares

1. **Explorar caminando**: la colonia se recorre en tercera persona. Cada sala es un lugar de acción (R4).
2. **Cuidar**: cultivos, Iris y tripulación dependen de vos.
3. **Decidir con costo**: toda acción mueve al menos dos recursos (regla del repo, se mantiene).
4. **Verificar**: Iris puede equivocarse; se compara con el medidor o con una experta.
5. **Coleccionar y personalizar**: muestras de rocas, cultivos cosechados e insignias; se usan para personalizar traje y cuarto.

### 5.2 De botón a lugar

| Acción de hoy (botón) | Propuesta (en el mundo) | Sala |
|---|---|---|
| Go to the shelter | Llevar a la tripulación al refugio; la puerta se cierra y el invernadero se apaga (se ve) | Refugio de radiación |
| Raise the shield | Subir la palanca del generador del escudo; la cúpula brilla | Sala de energía |
| Spacewalk to fix the panels | Pasar por la esclusa, ponerse el traje, limpiar los paneles afuera | Esclusa + exterior |
| Repair Iris | Llevar a Iris al taller; minijuego corto de reparación | Taller (servidores) |
| Send data to Earth | Apuntar la antena y enviar; ver el mensaje viajar y la espera | Comunicaciones |
| Wait a turn | Dormir en el cuarto; pasa un sol | Cuarto propio |

Respaldo: la lista de lugares en 2D que el repo ya exige se mantiene para
accesibilidad y equipos lentos.

### 5.3 HUD para 7-10

- **Tres objetos** en la esquina: batería (energía), burbuja (aire, agua y comida), escudo (blindaje). Se llenan y vacían; parpadean cuando bajan.
- **El objetivo actual** en una tarjeta con dibujo y una frase, siempre visible.
- **Sin turno ni velocidad** en dificultad fácil; el tiempo avanza con las acciones.
- **Tripulación**: tocar el retrato abre 2 o 3 preguntas con dibujo; el chat escrito queda como opción.
- Números visibles solo desde dificultad media.

### 5.4 Cambios de escenario y ambiente

| Momento | Ambiente | Regla científica (`MARTE.md`) |
|---|---|---|
| Espacio y nave | Negro con estrellas; interior blanco con LED cian | — |
| Jezero de día | Cielo caramelo, suelo óxido, sombras teñidas de lila | Nunca cielo azul de día |
| Atardecer | Halo azul junto al Sol, ámbar en el resto, crepúsculo largo | Atardecer azul cerca del Sol (NASA) |
| Tormenta solar | Base en alerta, luces interiores en ámbar, partículas cian en el cielo | La radiación no se "ve": se representa con un efecto simbólico y se dice que es simbólico |
| Tormenta de polvo | Cielo marrón oscuro, visibilidad corta, paneles cubiertos | Polvo que cae en arco bajo, sin nubes esponjosas |
| Polo norte | **Hielo blanco con manchas de suelo** (aquí sí entra la estética de nieve del video 3), cielo pálido, Sol bajo | El casquete norte es hielo de agua todo el año, con escarcha de CO₂ en invierno |
| Noche | Estrellas, la Tierra como un punto azul, luces de la colonia | — |

**Importante para lo visual:** la nieve del video de referencia 3 **solo es
correcta en el polo norte (C5)**. En Jezero (C2 a C4) el suelo es óxido y polvo,
sin nieve ni hielo, como exige `MARTE.md`. El cielo lavanda del video 3 tampoco
es correcto de día: se usa caramelo.

---

## 6. Salas necesarias por capítulo

IDs de `docs/INVENTARIO.md`. Las salas marcadas **nuevo** se agregan en la sección 7 del inventario.

| Sala | ID | C1 | C2 | C3 | C4 | C5 | Final |
|---|---|---|---|---|---|---|---|
| Cabina y puente de la nave | NW-15 (nuevo) | X | | | | | |
| Sala común de la nave con mesa holográfica | NW-16 (nuevo) | X | | | | | |
| Refugio de radiación de la nave | NW-17 (nuevo) | X | | | | | |
| Bahía del satélite | NW-18 (nuevo) | X | X | | | | |
| Esclusa | NW-05 | | X | X | X | X | X |
| Centro de mando | NW-12 | | X | X | X | X | X |
| Refugio de radiación de la colonia | NW-14 (nuevo) | | X | | X | | |
| Sala de energía y escudo | NW-09 | | X | | X | | |
| Taller y servidores (reparar a Iris) | NW-01 | | X | | X | X | |
| Comunicaciones (antena, telemetría) | NW-13 (nuevo) | | X | | | X | |
| Invernadero | NW-02 | | | X | X | X | X |
| Soporte vital (agua y oxígeno) | NW-08 | | | X | X | X | |
| Comedor | DN-* | | | X | | | X |
| Garaje de vehículos | NW-03 | | | | X | X | |
| Hangar y pista de aterrizaje | NW-04 | | X | | | | X |
| Vestidor EVA | NW-06 | | | | X | X | |
| Laboratorio (muestras de roca y hielo) | NW-10 | | | | | X | |
| Cuarto propio (personalizable) | AP-* | | | X | X | X | X |
| Enfermería | NW-07 | | | | X | | |
| Estación de hielo en el polo | NW-19 (nuevo) | | | | | X | |

---

## 7. Lo que cambia en el plan visual

1. **Escenarios exteriores**: Jezero (óxido, sin nieve) y polo norte (hielo). El terreno con nieve del video 3 pasa a ser solo del polo.
2. **Nave en tránsito** completa (C1): cabina, sala común, refugio y bahía del satélite, con el mismo kit de interiores.
3. **Salas nuevas** NW-13 a NW-19 (sección 7 de `INVENTARIO.md`).
4. **Estados de ambiente** por escena: día, atardecer, tormenta solar, tormenta de polvo, noche. Se implementan como presets de iluminación y postproceso.
5. **Iris** como asset propio (rover de 4 ruedas con pantalla de cara y expresiones), con estados sana, dañada y desconectada.
6. **Intro**: 7 tomas en `data/shots/intro.json`.
7. **Colonia que crece**: la escena exterior se arma por capítulo según lo que existe.

---

## 8. Riesgos

| Riesgo | Mitigación |
|---|---|
| La historia distrae de lo que se enseña (R8) | Toda escena de historia termina en una decisión; la cinemática es omitible |
| Cinco capítulos es mucho alcance | Rebanada vertical: intro + C2 (ya existe) + C3 (invernadero). C1, C4 y C5 después |
| Personalizar distrae | Solo con recompensas ganadas; nada de tienda ni dinero real |
| Recorrer caminando es lento | Teletransporte a una sala tocándola en el mapa de la colonia; la lista 2D sigue como respaldo |
| Contradice decisiones aprobadas | Sección 9 |

---

## 9. Decisiones que necesitan aprobación del equipo

El repo tiene decisiones aprobadas por Santiago (orquestador) que esta propuesta
cambia. Cada una necesita su documento `docs/decisiones/D<n>-*.md` y aprobación.

| # | Qué cambia | Decisión actual | Propuesta | Quién aprueba |
|---|---|---|---|---|
| 1 | Pipeline visual | D6: Three.js procedural `^0.160.0`, **sin GLB ni Blender** ("no vuelven") | **Resuelto en este proyecto (DV-03):** Three.js para todo, Blender solo para personajes humanos. María Paula indicó no aplicar D6 aquí | Para integrarlo al juego: avisar a Santiago |
| 2 | Nombres de la tripulación | D7: por rol, sin nombres | **Aprobado (DV-02):** Tess, Nia, Vera, Teo | Avisar a Camilo (diseño) |
| 3 | Campaña | 5 niveles: Jezero, polo norte, 2 lunares, nave | **Aprobado (DV-01):** una colonia en Marte en 5 capítulos; lunares aparte | Avisar a Camilo y Santiago |
| 4 | Premisa | Programa de entrenamiento | Preparar la colonia para la llegada de las familias | María Paula (dueña de `HISTORIA.md`) + Camilo |
| 5 | UI de juego | Panel de botones con texto y chat | Acción en el mundo, HUD de objetos, chat opcional | María Paula |
| 6 | Público núcleo | 7 a 12 | Núcleo 7 a 10, con 11-12 cubiertos por dificultad | Equipo (el reto sigue diciendo 7-12) |

---

## 10. Fuentes

Investigación (consultadas el 2026-11-25):
- [Piaget, etapa de operaciones concretas, Simply Psychology](https://www.simplypsychology.org/concrete-operational.html)
- [NN/G, Designing for Kids: Cognitive Considerations](https://www.nngroup.com/articles/kids-cognition/)
- [Springer, intervención cognitiva con juego para 6-8 años (63 pautas)](https://link.springer.com/article/10.1007/s42979-024-03042-6)
- [Designing for Kids: an ethical framework for digital play](https://matthewlarn.medium.com/designing-for-kids-creating-an-ethical-framework-for-digital-play-2fb83088c19b)
- [Game-Ace, cómo diseñar juegos de aprendizaje para niños](https://game-ace.com/blog/how-to-design-learning-games/)
- [Educators Technology, guía docente de PBS KIDS Games](https://www.educatorstechnology.com/2026/09/pbs-kids-games-review.html)
- [Clark, Tanner-Smith y Killingsworth 2016, Digital Games, Design, and Learning](https://journals.sagepub.com/doi/10.3102/0034654315582065)
- [Metaanálisis de aprendizaje con juegos digitales en la escuela (ResearchGate)](https://www.researchgate.net/publication/370659223_The_Effect_of_Digital_Game-Based_Learning_Interventions_on_Cognitive_Metacognitive_and_Affective-Motivational_Learning_Outcomes_in_School_A_Meta-Analysis)
- [Revisión y metaanálisis de aprendizaje con juegos en primera infancia (PMC)](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11018941/)
- [Narrative-Focused RPGs for young children (arXiv)](https://arxiv.org/pdf/2008.13749)
- [Six Scaffolds for Child-AI Interaction Design (arXiv)](https://arxiv.org/pdf/2504.08670)
- [Kidscreen, juegos favoritos de Roblox en niños (Childwise 2025)](https://kidscreen.com/2025/10/17/which-roblox-games-are-kids-favorites/)
- [Morning Consult, preferencias de juego de la Gen Alpha](https://pro.morningconsult.com/analysis/gen-alpha-gaming-preferences-devices-genres-research)
- [Juego de matemáticas en RA con retroalimentación diegética para 7-8 años](https://www.researchgate.net/publication/336716865_Turning_Your_Book_into_a_Game_Improving_Motivation_through_Tangible_Interaction_and_Diegetic_Feedback_in_an_AR_Mathematics_Game_for_Children)
- [Designing for Embodied Proximity (PMC)](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11575232/)
- [Learning with the Body: marco para juegos de aprendizaje corporal](https://www.researchgate.net/publication/351459811_Learning_with_the_Body_A_Design_Framework_for_Embodied_Learning_Games_and_Simulations)
- [Toca Boca, entrevista a Björn Jeffrey](https://funambulism.com/2014/02/28/interview-with-bjorn-jeffrey-ceo-of-toca-boca/)
- [Explorify, ideas erróneas de los niños sobre el espacio (PDF)](https://assets.ctfassets.net/pc40tpn1u6ef/1p58QpmBbQRFqyuC14iPuK/9a71f34c57fecc6f7823f4600de6de13/Children-s_misconceptions_about_space.pdf)
- [Ideas erróneas sobre radiactividad en secundaria (arXiv)](https://arxiv.org/pdf/2001.07746)
- [Ideas erróneas de astronomía universitaria (arXiv)](https://arxiv.org/pdf/1206.2302)

Ciencia de NASA:
- [Atardeceres en Marte, NASA Science](https://science.nasa.gov/solar-system/planets/mars/what-does-a-sunrise-sunset-look-like-on-mars/)
- [Cambios estacionales del casquete polar norte, NASA/Hubble](https://science.nasa.gov/asset/hubble/seasonal-changes-in-mars-north-polar-ice-cap/)
- [Qué es la conjunción solar de Marte, JPL](https://www.jpl.nasa.gov/news/whats-mars-solar-conjunction-and-why-does-it-matter/)
- [Fin de la misión de Opportunity, NASA Science](https://science.nasa.gov/missions/mer/nasas-opportunity-rover-mission-on-mars-comes-to-end/)
- [Opportunity durante la tormenta de polvo, JPL](https://www.jpl.nasa.gov/news/opportunity-hunkers-down-during-dust-storm/)
