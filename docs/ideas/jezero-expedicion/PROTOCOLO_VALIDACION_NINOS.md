# Protocolo de validación con niños (D19, preparación)

**Estado:** **protocolo en borrador. No se organiza ninguna sesión real** hasta cumplir las condiciones de protección de la sección 1. Este documento no es asesoría legal ni ética: **la normativa aplicable (protección de menores y de datos personales del país de la sesión) debe revisarla la persona responsable de la institución o un asesor competente antes de aplicar nada.**
**Objetivo:** saber si un niño de 7 a 12 años **entiende** lo que el diseño pretende enseñar (costo ahora y beneficio después, radiación que no se ve pero se cuenta, verificar a Iris, leer una fuente) y **cuánto aprende**, sin recopilar más datos de los necesarios.

## 1. Condiciones previas obligatorias (la sesión no se organiza sin ellas)
| # | Condición | Quién la cumple | Evidencia |
|---|---|---|---|
| 1 | **Responsable adulto de la sesión** designado por nombre (no es el equipo de desarrollo del cambio evaluado) | Santiago | Nombre y rol por escrito |
| 2 | **Revisión de normativa y de ética** por una persona o comité competente | Santiago / institución | Visto bueno escrito |
| 3 | **Consentimiento informado** por escrito del padre, madre o tutor, **antes** de la sesión; **asentimiento** del niño en lenguaje adecuado | Responsable | Formularios firmados (ver sección 3) |
| 4 | **Un adulto presente** durante toda la sesión; los padres o tutores pueden estar presentes | Responsable | Registro de asistentes |
| 5 | **Versión de prueba estable** (la implementación aprobada y auditada; no una prueba de concepto) | Equipo | SHA y versión |
| 6 | **Lugar y equipo de prueba** preparados (sin cuentas personales de los niños; usar la modalidad de invitado) | Responsable | Lista de verificación |
| 7 | **Plan de datos** aprobado (sección 4) | Responsable | Documento |

## 2. Participantes y actividad
- **Edades 7–8, 9–10 y 11–12**, con pocos niños por rango (la muestra es **exploratoria**, no estadística).
- **Sesión corta** (propuesta: 20 a 30 minutos de juego más 10 de conversación), con pausas libres; el niño puede **parar en cualquier momento sin explicación** y sin consecuencias.
- **No se evalúa al niño: se evalúa el juego.** Se dice así a los niños y a los adultos.
- El adulto **no ayuda a decidir**; puede ayudar con la lectura si el niño lo pide (y se anota que ayudó), y **detiene la sesión** si el niño muestra malestar.
- Actividad **adecuada a la edad**: sin tiempo límite visible de presión; sin competencia entre niños; sin comparar resultados de niños concretos.

## 3. Consentimiento
**Para padres o tutores (contenido mínimo, a redactar y revisar por la institución):** quién organiza y por qué; qué se hace; cuánto dura; que es voluntario y que el niño puede parar; qué datos se recogen y cuáles **no**; quién los ve; cuánto se conservan; cómo pedir que se borren; contacto para dudas; que el juego **no es un producto de NASA** (aviso del proyecto). Firma con fecha.
**Para el niño (asentimiento):** lenguaje simple, sin presión ("Estamos probando un juego. Tú no estás siendo examinado. Puedes parar cuando quieras.").
**Regla del proyecto:** **no se graba audio de menores** (el audio, si se usara, se transcribe y se descarta donde se transcribe; en esta validación **no se usa audio**).

## 4. Datos: solo los necesarios
| Qué | Decisión | Por qué |
|---|---|---|
| Nombre y apellido del niño | **No** se recoge; se usa un **código** (p. ej. N01) | Minimización |
| Edad | **Solo el rango** (7–8, 9–10, 11–12) | Necesario para el análisis |
| Audio, video, foto, cara | **No** | Regla del proyecto y minimización |
| Pantalla | Si se graba la pantalla, **sin cara ni voz** y solo con consentimiento específico; si no hay necesidad, **no se graba** | Minimización |
| Datos del juego | Eventos anónimos (qué hizo, en qué orden, cuándo) vinculados al código | Medición |
| Respuestas | Anotadas por el observador con el código | Medición |
| Conservación | El mínimo posible; fecha de borrado fijada antes de empezar | Minimización |
| Quién accede | El equipo mínimo designado | Control |
**Los formularios firmados se guardan aparte de los datos de la sesión**, de modo que no se pueda unir un código con un nombre sin una razón y un permiso.

## 5. Qué se mide (comprensión y aprendizaje, sin examinar al niño)
Tres tipos de señales, **todas definidas antes de la sesión**:

| Tipo | Qué es | Ejemplos (de `D-mapa-aprendizaje.md` y el diseño) |
|---|---|---|
| **Conducta en el juego** (del estado del juego, anónima) | Qué hace sin que se lo pidan | ¿Habló con alguien **antes** de la tormenta? ¿Construyó panel y luego eligió escudo? ¿Verificó a Iris antes de que se lo propusieran? ¿Terminó dentro del límite de entrenamiento? ¿Cambió una decisión al repetir? |
| **Comprensión** (preguntas orales cortas del observador, sin presión, con ejemplos del juego) | Si explica con sus palabras | "¿Qué pasó con el número que dijo Iris?" "¿Por qué crees que el refugio ayudó (o no)?" "¿Qué significaba el número del contador de radiación?" |
| **Aprendizaje** (comparación antes/después de la sesión, mismo formato) | Si cambió lo que sabe | Tres preguntas de "¿qué harías?" con una situación parecida (no idéntica) antes y después; sin nota |
**Cuidados:** las preguntas **no se puntúan frente al niño**; se evita que el observador sugiera la respuesta; se anota si un adulto ayudó. Si un niño no lee bien, **la lectura en voz alta por el observador** se anota como adaptación.
**Qué se analiza:** patrones por rango de edad y **qué parte del diseño confunde** (por ejemplo, si el niño cree que 4 es un valor real de peligro: **debe preguntarse**). No se ponen puntajes a los niños.

## 6. Preguntas de investigación (derivadas del diseño y de las dudas abiertas)
1. ¿El niño entiende que el contador de radiación **se acumula** y que el refugio y el escudo **reducen el ritmo**?
2. ¿Interpreta el "límite de entrenamiento" como una **regla del juego** y no como un umbral real?
3. ¿Entiende la **estimación** ("Estimate for the next N turns")? ¿La toma como promesa?
4. ¿Detecta que Iris se equivoca **comparando con el medidor**, o solo por el aviso?
5. ¿Qué hace cuando **no hay respuesta obvia** (si la hubiera)? ¿Le molesta o le interesa?
6. ¿Qué parte de las líneas de capa 1 le sobra o le falta?

## 7. Lo que este protocolo NO hace
No sustituye la revisión legal y ética. No define reclutamiento, lugar ni fecha. No decide quién conduce la sesión ni quién analiza (**Santiago** designa a una persona que **no haya implementado** los cambios evaluados). Y **no comienza hasta que las siete condiciones de la sección 1 estén cumplidas y firmadas.**
