# B. Documento de diseño: "Jezero: la primera expedición"

**Estado:** propuesta. Nada de esto está implementado. Se apoya en el canon de [`docs/referenciapau/HISTORIA.md`](../../referenciapau/HISTORIA.md) (dueña: María Paula) y no lo reemplaza: lo que añado va marcado **NUEVO**.
**Regla de lectura:** cada elemento dice si es **EXISTE** (ya en código), **CONECTAR** (existe, falta enlazarlo) o **NUEVO** (hay que construirlo).

## 1. Principio de diseño

> El niño aprende porque necesita entender el mundo para resolver el problema que tiene delante.

Consecuencias de diseño, todas compatibles con el motor actual:
1. **Ninguna mecánica se explica antes de que haga falta.** Cada una entra como respuesta a una pregunta que la historia acaba de plantear.
2. **Una idea por intervención.** Una línea de ≤ 12 palabras; si el niño quiere más, pide "¿por qué?" (capa 2) o "la fuente" (capa 3). Nunca un muro.
3. **El mundo responde a las acciones.** Un medidor se mueve, una experta reacciona, el entorno cambia. Se enseña con consecuencias, no con ventanas.
4. **Se aprende a ser un buen astronauta, no a pulsar botones:** mirar antes de elegir, preguntar, verificar, decidir con costos.

## 2. La expedición

**Título del niño (EN, base):** *Jezero: Your First Expedition.* **NUEVO** (hoy el nombre es "Base in Jezero Crater, Mars").

**Contexto.** Solar Shield es un programa de entrenamiento para astronautas junior (canon). Tu nave llega a la órbita de Marte sobre el cráter Jezero. Los datos de la misión son reales; la base es un entrenamiento.

**Objetivo científico (NUEVO, una sola frase para el niño):**
> *"Can a small crew stay safe through a real solar storm, and tell Earth about it?"*

Por qué esta frase y no otra: **es exactamente lo que el motor ya premia** (sobrevivir la tormenta con la tripulación dentro del presupuesto y que la telemetría llegue a la Tierra). No inventa una meta nueva. Y es verdad científica y educativa: los astronautas reales viven con el clima espacial.

**Por qué Jezero:** es un antiguo lecho de lago con un delta (está en el glosario con fuente: *"Delta: a fan of dirt a river leaves when it reaches a lake. Jezero had one long ago."*). Cualquier afirmación nueva sobre Jezero necesita su tarjeta del rol de datos (`bloquea:datos`); en este diseño solo uso lo que ya está en `data/i18n` y en las tarjetas de misión.

**Situación inicial:** estás en la nave, en órbita. Todavía no sabes que el Sol está a punto de lanzar una nube. El niño no sabe nada de la tormenta hasta el Momento D.

**Personajes y responsabilidades** (por rol, sin nombres propios, decisión D7):

| Personaje | Aporta | Pregunta que contesta | Lo que NO hace |
|---|---|---|---|
| **Ingeniera** | Energía, módulos, reparaciones | ¿Cuánto cuesta y de dónde sale la energía? | No decide por el niño; no habla de radiación |
| **Doctora de radiación** | Dosis, refugio, salud | ¿Cuánta radiación recibimos y cómo se evita? | No habla de energía ni de averías |
| **Meteoróloga solar** | El Sol, tormentas, polvo, fuentes | ¿Qué viene, cuándo, y cómo lo sabemos? | No dice qué hacer: dice qué pasa |
| **Iris** | Guía, compañera, verificación | ¿Dónde voy ahora? | No decide; en la tormenta se calla |
| **Control de Misión** (la Tierra) | Mensaje con retraso | ¿Sigue viva la base? | No aparece en persona: es la respuesta a la telemetría |
| *Matemático* | "¿Y si…?" | — | **Se queda fuera de Jezero** (decisión pendiente, ver README D3) |

**Conflicto principal:** una tormenta solar real viene hacia la base. La Doctora quiere refugio; la Ingeniera, escudo; ambas tienen razón y ambas cuestan. Mientras, Iris empieza a fallar justo cuando más se la necesita.

**Descubrimientos (lo que el niño *averigua*, no lo que lee):**
1. Cada sitio gana algo y pierde algo (sitios).
2. Cada módulo cuesta ahora y ayuda después (energía).
3. La radiación no se ve, pero se puede contar (dosis).
4. Un número que contradice el medidor merece una pregunta (Iris).
5. Preparar antes da más opciones después (la preparación decide el menú de la tormenta: **verificado en el motor**, sección 6 del diagnóstico).

**Cierre narrativo:** Control de Misión responde (con retraso, porque la luz tarda). Iris, reparada, habla última. El final resume qué pasó, qué decisiones pesaron, y qué probar distinto.

## 3. Evaluación de la estructura A–F contra el motor

El brief pidió comprobarla, no adoptarla. Resultado:

| Momento | ¿Encaja con el motor real? | Dónde vive hoy | Ajuste que propongo |
|---|---|---|---|
| **A. Llegada** | Sí | Intro + órbita + llegada | Iris como compañera ya en órbita; el objetivo se dice aquí (**NUEVO**: 3 líneas) |
| **B. Exploración** | **Sí, pero en dos mitades** | B1: pasos 1–3 (satélite, sitios, con datos reales). B2: caminar la base 3D | Reconocer que "explorar" ocurre dos veces: desde arriba con datos y a pie. No obligar a nada en B2 |
| **C. Preparación** | Sí | Paso 4 (módulos) | **El orden cambia:** la advertencia de la tormenta (D) debe llegar *antes* de elegir módulos, no después |
| **D. Ciencia y preparación** | **Hueco real** | No existe: entre módulos y tormenta hay ~12 s de reloj | Es el momento más importante a construir. Ver sección 5 |
| **E. Tormenta** | Sí | `PantallaTormenta` | Hacer visible la dosis; sin cambiar reglas |
| **F. Resolución** | Parcial | `PantallaFinal` | Añadir "qué probar distinto" |

**Decisión de estructura (propuesta):** reordenar la *presentación*, no el motor. La tormenta ya está en el estado desde el turno 0; el motor no necesita cambiar para que la Meteoróloga la anuncie **al empezar el paso 4** (con el reloj parado), en lugar de al turno 3.

## 4. Momento por momento

Cada tabla responde: objetivo, lo que sabe / lo que no sabe, acción disponible, evento que empuja, respuesta del mundo, aprendizaje, condición para avanzar, errores y recuperación.

### A. Llegada (órbita → llegada)  · tipo: descubrimiento + calma
| | |
|---|---|
| Objetivo del jugador | Mirar Marte y entender "dónde estoy y qué hago" |
| Sabe | Es una misión de entrenamiento; hay tres medidores (viñeta 4 de la intro) |
| Todavía no sabe | Que habrá una tormenta; para qué sirve cada experta |
| Acción disponible | Mirar el satélite, leer los consejos de la tripulación, *Continue* (**EXISTE**) |
| Evento que empuja | Iris dice el objetivo en 3 líneas (**NUEVO**, texto en C) |
| Respuesta del mundo | Los consejos de las tres expertas son 3 voces distintas sobre el mismo satélite (**EXISTE**, `consejosSatelite`) |
| Aprendizaje | Batería, señal y escudo como analogía; "mira antes de elegir" |
| Para avanzar | *Continue* |
| Error / recuperación | No hay error posible; el ritmo es del niño |

### B1. Exploración desde arriba (sitios)  · tipo: descubrimiento + decisión
| | |
|---|---|
| Objetivo | Elegir dónde aterrizar |
| Sabe | Cuatro sitios y tres criterios (plano, luz, refugio natural) con puntaje |
| No sabe | **Que la elección afectará a la tormenta** |
| Acción | Tocar un sitio, leer el "por qué cuesta" y aterrizar (**EXISTE**, `PantallaSitio`) |
| Evento | Cada experta defiende un criterio (`consejosAterrizaje`, **EXISTE**) |
| Respuesta | El aterrizaje cobra costo ahora y a veces paga después (**EXISTE**) |
| Aprendizaje | "Los lugares son distintos y ninguno es perfecto" |
| Para avanzar | Aterrizar |
| Error / recuperación | Un mal sitio no es derrota: es un costo (−12 ⚡ en el peor caso) que se compensa en el paso 4 |

### Llegada → B2. Primer paseo  · tipo: calma + exploración
| | |
|---|---|
| Objetivo | Conocer la base |
| Sabe | Hay un taller, un hábitat, un sensor, una mesa y anclajes de módulos |
| No sabe | Qué hace cada lugar |
| Acción | Caminar, `[E]` en un lugar o persona (**EXISTE**) |
| Evento | La tarjeta "Your crew is ready / Explore the base" (**EXISTE**) e Iris marca el objetivo en el HUD (**EXISTE**) |
| Respuesta | Cada lugar abre una consulta con su experta (**EXISTE**, `usoDelLugar`) |
| Aprendizaje | Los lugares tienen funciones; las personas también |
| Para avanzar | Ir al taller (objetivo de Iris) |
| Error | Perderse: la píldora del HUD y el mapa siempre dicen adónde ir |

### C. Preparar la base  · tipo: decisión + construcción
| | |
|---|---|
| Objetivo | Construir 2 módulos con sentido |
| Sabe | Cada módulo cuesta ⚡ −6 🫁 −3 ahora y ayuda después; **y (NUEVO) sabe que viene una tormenta** (D) |
| No sabe | Cómo va a pesar cada módulo en la tormenta |
| Acción | Elegir 2 de 5 (**EXISTE**); consultar a la Ingeniera (**EXISTE**) |
| Evento | La advertencia de D llega **antes** de colocar |
| Respuesta | Los medidores se mueven; los beneficios llegan 1–2 turnos después (**EXISTE**) |
| Aprendizaje | Energía, soporte vital y blindaje como consecuencia de lo que construyo |
| Para avanzar | Colocar 2 módulos |
| Error / recuperación | Un par "débil" (por ejemplo reciclador + invernadero) no es derrota: cierra opciones. En la tormenta el escudo costará más de lo que puedes pagar y el refugio seguirá disponible. **Verificado en el motor.** |

### D. Ciencia y preparación: "El círculo de la tripulación"  · tipo: descubrimiento + tensión creciente (NUEVO como momento, EXISTE como piezas)
Concepto: antes de que arranque el reloj, **la tripulación se reúne** y cada una dice lo suyo. El reloj sigue parado. El niño puede caminar y preguntar a su ritmo.

| | |
|---|---|
| Objetivo | Entender qué viene y decidir cómo prepararse |
| Sabe | Hay una nube solar real que sale del Sol (Meteoróloga, con fuente DONKI); la radiación no se ve pero se cuenta (Doctora); el escudo cuesta energía (Ingeniera) |
| No sabe | Qué opción es mejor: no la hay obvia |
| Acción | Hablar con las tres; ver el **dosímetro** (NUEVO, ver F); pulsar "Start the clock" cuando quiera |
| Evento | La Meteoróloga irrumpe con su alerta (**CONECTAR**: ya existe `pronostico.viene` + `pronostico.preparar`, falta dispararlo solo) |
| Respuesta | Aparece el dosímetro y la píldora "Storm: coming" (**NUEVO**, sin recursos nuevos: lee `dosisMSv`) |
| Aprendizaje | Pronóstico con fuente; dosis; presupuesto; "preparar antes" |
| Para avanzar | "Start the clock" (el niño, no el sistema) |
| Error / recuperación | Si no habla con nadie, Iris insiste una vez y calla; no se castiga. La tormenta llegará igual y la escena de la tormenta repite lo esencial |

### E. Tormenta  · tipo: tensión + decisión
| | |
|---|---|
| Objetivo | Proteger a la tripulación con lo que hay |
| Sabe | Lo de D, más lo que preparó en C |
| No sabe | Qué mide el motor *ahora*: dosis subiendo |
| Acción | Elegir experta → comparar el plan → verificar la advertencia → confirmar (**EXISTE**, 4 paneles) |
| Evento | El juego se pausa; la Meteoróloga, la Doctora y la Ingeniera hablan; **Iris falla** y da un número que contradice el medidor (**EXISTE**, solo en la pila) |
| Respuesta | El panel muestra costos del motor; el dosímetro sube cada turno |
| Aprendizaje | Cada opción cuesta; verificar una lectura dudosa; la preparación abre o cierra opciones |
| Para avanzar | Confirmar una opción (o "aguantar") |
| Error / recuperación | Aguantar es una opción válida pero cara (en la prueba, siempre pierde por dosis). Iris dañada **nunca ejecuta nada sola** (solo propone, con costos visibles) |

### F. Resolución  · tipo: satisfacción + reflexión
| | |
|---|---|
| Objetivo | Entender qué pasó y poder intentarlo distinto |
| Sabe | Que el resultado es consecuencia de decisiones y de mala suerte |
| Acción | Leer causas, abrir la fuente de cada dato, responder la pregunta final (nunca bloquea), "Play again" |
| Evento | Control de Misión responde (con retraso) |
| Respuesta | Iris habla última; cada experta cierra con *una* frase propia (**NUEVO**, texto en C) |
| Aprendizaje | Cadena causa→efecto; "qué probar distinto" (**NUEVO**, función pura por reglas) |
| Para avanzar | Repetir o cambiar de misión |
| Error | La derrota se presenta como **rescate de entrenamiento** (canon) con la causa exacta y una pista, no como "Game Over" |

## 5. El Momento D, justificado

Es el único cambio **de fondo** de este diseño, y por eso lo explico:

- **Problema real:** hoy el reloj arranca al entrar en la base y la tormenta llega al turno 3, ~12 s después. El pronóstico (P0.4) solo se oye si el niño pregunta. La tormenta "aparece sin preparación narrativa" (el brief lo prohíbe).
- **Solución sin tocar reglas:** el estado ya contiene la tormenta desde el turno 0. Solo hay que (1) **anunciarla al principio del paso 4, con el reloj parado**, y (2) **dejar que el niño decida cuándo arranca el reloj**. El motor no cambia; cambia la orquestación de la interfaz.
- **Por qué no cambiar `tickTormenta` o el límite:** son reglas ya aprobadas (#196) y ajustadas con simulaciones. No las toco. Si Camilo y Jaime quisieran más margen, es un cambio aparte con su propia simulación.
- **Por qué mejora el aprendizaje:** convierte el paso 4 en una decisión informada (el niño elige panel porque sabe que el escudo gasta energía) y hace que la preparación pese.

## 6. Ritmo

| Momento | Tipo | Duración objetivo | Reloj |
|---|---|---|---|
| A Llegada | calma, descubrimiento | ~45 s | parado |
| B1 Sitios | descubrimiento, decisión | ~60 s | parado |
| Llegada y B2 paseo | calma, exploración | ~45 s | parado |
| C Módulos | decisión | ~60 s | parado |
| **D Círculo de la tripulación** | descubrimiento, tensión que crece | ~60–90 s | **parado** (el niño lo arranca) |
| E Tormenta (turnos 3–5) | **tensión máxima** | ~40 s de reloj + decisión pausada | corre, con pausa en la decisión |
| Respuesta de la Tierra (2 turnos) | descanso con ansiedad | ~8 s | corre |
| F Final | satisfacción, reflexión | ~60 s | fin |

Total objetivo: **6 a 8 minutos** para quien explora; 3 a 4 para quien sigue a Iris. (Los tiempos son metas de diseño para medir con Codex, no mediciones.)

**Evitar quedarse sin saber qué hacer:** la píldora de objetivo del HUD ya existe y siempre dice el siguiente lugar (`objetivoDeLaBase`). Regla nueva (**NUEVO**): si pasan ~20 s sin acción, Iris repite el objetivo **una vez** y calla (`ticksSinAccion` ya existe para la IA adaptativa; esto es solo UI de tiempo real).

## 7. Tres edades, una experiencia

No hay selector de edad ni tres modos. Cada intervención tiene **tres capas**, la misma para todos; cada niño llega hasta donde quiere:

| Capa | Qué es | Cómo se abre | Lo usa sobre todo |
|---|---|---|---|
| **1. Ver y hacer** | Una línea corta + un medidor que se mueve o una experta que reacciona | Automática | 7–8 |
| **2. Entender por qué** | La razón en una frase con analogía | Chip "Why?" / botón de curiosidad (**EXISTE**: `renderOpcionesCharla`, `curiosidadDe`) | 9–10 |
| **3. Comprobar y nombrar** | Cifra real, fuente NASA, palabra del glosario | "Check the source" y glosario (**EXISTE**: `TarjetaFuente`, `Glosario`) | 11–12 |

Detalle por mecánica en [D-mapa-aprendizaje.md](D-mapa-aprendizaje.md).

## 8. IRIS y los especialistas (resumen; guion completo en C)

- **Iris habla** para orientar (dónde ir), celebrar un descubrimiento y acompañar una derrota. **Calla** durante la decisión de la tormenta (solo "tú eliges") y cuando hay un panel abierto.
- **Iris dañada, bien presentada:** primero **se gana la confianza** con lecturas ciertas (**NUEVO**, ver C); luego falla de forma **comprobable** (el número difiere ≥ 20 puntos del medidor que siempre está en pantalla); **nunca ejecuta una acción**; el niño puede ganar ignorándola por completo; al repararla, no se la regaña. La lección: *"hasta una computadora se equivoca; mira el medidor".*
- **Los especialistas no repiten información:** Ingeniera = *cuánto*; Doctora = *por qué importa y cuánta radiación*; Meteoróloga = *qué viene y de dónde sale el dato*. Ninguna es un botón de bonificación: en la tormenta se contradicen y ambas tienen razón.

## 9. Lo que este diseño NO hace (restricciones cumplidas)
- No elimina mecánicas; no cambia reglas del motor ni números de balance.
- No añade recursos. El **dosímetro** muestra un valor que ya existe en el estado (`tripulacion[].dosisMSv`) frente a un límite que ya existe en la misión (`limiteDosisMSv`); **no es un recurso nuevo** (el niño no lo gasta ni lo administra), es una ventana a una regla que hoy está oculta. Necesita aprobación explícita igualmente.
- No inventa progresión: no hay XP, desbloqueos ni niveles nuevos.
- No toca `ui/`, `assets/` ni `missions/`: todo lo que implica ellos va a F y G como especificación.
- Las otras cuatro misiones siguen siendo independientes (sección 7 del README y E-tabla).
