# A. Diagnóstico de la experiencia actual de Jezero

**Fecha:** 18 nov 2026 · **Autor:** Claude (dirección técnica y de experiencia) · **Estado:** propuesta para revisión de Santiago. No se implementó nada.
**Método:** leí el código, no los PR descritos. Todo lo de esta página sale de un árbol de trabajo real y de una simulación del motor que corrí yo (sección 6).

## 1. Qué código estoy llamando "real" (importante)

Hay **cuatro verdades distintas** en el repo y no se pueden mezclar:

| Rama / commit | Qué tiene | Qué NO tiene |
|---|---|---|
| `develop` (`7acc683`) | Motor base, 5 misiones como datos, UI v8 con mundo 3D, Iris acompañante | **Nada de P0.1–P0.6** (ni dosis, ni límite, ni victoria tras la tormenta) |
| `origin/feat/agentes-p04-aviso-tormenta` (`4a949ad`) | P0.1, P0.2, P0.3, P0.6 (motor), P0.4 y P0.5 (agentes), apilados como PR #443→#450 | La corrección QA-445 (causa terminal en la pantalla final) |
| `fix/motor-qa445-causa-terminal` (`798cd95`) | P0.1–P0.3, P0.6 + `causaTerminal` en el resumen y en `PantallaFinal` | P0.4 y P0.5 (agentes) |
| `feat/frente-e-misiones-experimental` (la rama donde estás) | Selector de misión, tarjeta guía de 8 pasos, canal de radio de la tripulación, tema de mundo por misión | **Nada de P0.x** (verifiqué con `git merge-base --is-ancestor`: los 5 commits P0 no son ancestros de HEAD) |

**Consecuencia:** ninguna rama contiene todo. Los P0 son una pila de PR apilados que todavía no entró a `develop`. Cualquier diseño que dependa de la radiación, del límite de dosis o del aviso de la Meteoróloga **solo existe una vez que esa pila se fusione**. El plan de implementación (G) lo trata como dependencia 0.

La rama experimental no es oficial (su propio código dice `EXPERIMENTAL`). La uso como evidencia de lo que es técnicamente posible (por ejemplo, un canal de radio proactivo), no como estado del producto.

## 2. Cómo empieza hoy una partida (flujo real, fase por fase)

`ui/src/App.tsx` y `ui/src/juego/reductor.ts`:

1. **Portada** → **Intro de 4 viñetas** ("A new training mission begins" … "Explore. Ask. Decide.") → **Carga** (1,8 s, con un consejo).
2. **Órbita** (`fase satelite`, pasos 1–2). Pantalla con Marte, tres placas (batería, señal, escudo del satélite), consejo de la Ingeniera y botón *Continue*.
3. **Elegir sitio** (`fase sitio`, paso 3). Mapa real de Jezero (Mars Trek) con 4 sitios, tres criterios (plano, luz, refugio natural), puntaje y costo de aterrizaje.
4. **Llegada** (2,5 s, "Arriving at Jezero") → **Módulos** (`fase modulos`, paso 4) en el mundo 3D, con la tarjeta "Your crew is ready / Explore the base". El reloj **todavía no corre**.
5. **Base** (`fase base`): al pulsar listo, **el reloj corre solo, 1 turno cada 4 s**. El niño camina por la base 3D, habla con la tripulación, actúa.
6. **Tormenta**: en el turno 3 (`tickTormenta: 3`) el juego se pausa y abre el panel de decisión (Ingeniera / Doctora / Meteoróloga, comparar plan, verificar, decisión registrada).
7. **Base** otra vez: telemetría (paso 7), espera de la respuesta (2 turnos).
8. **Final**: causas por decisión y mala suerte, tarjetas de ciencia con fuente, pregunta final de Iris, insignias.

## 3. Cómo se desarrolla Jezero (misión, eventos, decisiones, recursos)

- **Misión** (`missions/src/jezero.ts`): 8 pasos, 4 sitios, elegir 2 de 5 módulos, avería de Iris guionada, dilema del paso 6, tormenta `2024-05-20-marte`, límite de 10 turnos.
- **Recursos** (3, `design/src/recursos.ts`): energía 70, soporte vital 80, blindaje 60. Consumo pasivo −3 / −2 / −1 por turno. Los beneficios de las acciones llegan **1–2 turnos después**; los costos, de inmediato.
- **Eventos reales en la partida dorada:** aterrizaje, 2 módulos, tormenta (turnos 3, 4, 5), avería revelada de Iris, telemetría con retraso de 2 turnos. El **polvo en los paneles** existe como dato y no sale en la semilla dorada.
- **Decisiones del niño:** sitio, 2 módulos, consultas, esperar / refugiarse / subir escudo / salir al exterior / reparar a Iris / enviar telemetría, y el dilema (refugio y apagar invernadero, subir escudo nivel 2, aguantar).
- **Especialistas** (D7: sin nombre propio, solo rol): Ingeniera, Doctora de radiación y Meteoróloga están `disponible`. El **Matemático** y **Control de Misión** existen en el contrato y en `agents/`, pero `crearPartida` los marca `disponible: false`: no aparecen en el panel de Crew de Jezero.
- **Tormenta:** está en el estado desde el turno 0. Hace daño solo dentro de su ventana (`DURACION_TORMENTA_TICKS = 3`, turnos 3–5). `novedades()` detecta el momento en que llega y la UI pausa.
- **Radiación (P0.1, solo en la pila):** `engine/src/radiacion.ts` calcula dosis por turno = fondo del sitio (0,64 mSv/día de RAD, ÷6 turnos por día) × multiplicador de la tormenta (**19,4**, el factor medido por RAD) × (1 − 0,6 × blindaje/100) × refugio (×0,3 durante 2 turnos) × escudo (−25 % por nivel durante 2 turnos). Los valores de blindaje, refugio y escudo son **parámetros educativos de juego, no datos físicos** (el propio código lo dice).
- **Victoria y derrota** (`avanzarTick`, pila P0): derrota si un recurso llega a 0 > derrota si la dosis máxima supera **4 mSv** (valor de juego, no umbral de salud) > victoria si la telemetría ya llegó **y** la tormenta terminó > derrota si se acaba el plazo (turno 10).
- **Resultado:** `PantallaFinal` con causas, tarjetas de ciencia con fuente y pregunta final. La causa terminal ("por qué terminó") solo está en `798cd95`.

## 4. IRIS hoy

- Arranca **dañada en el estado** (`iaInicial: "danada"`) pero **oculta** al niño hasta el paso de revelación (#401). Antes, `guiaIrisLugar` y `conversar` la tratan como tutorial.
- Guía con objetivo en el HUD ("Ask the Engineer at the workshop") y resalta el lugar en la escena y el mapa.
- Con la avería revelada: lee un medidor **mal** (blindaje, +20 puntos; si no cabe en 100, −20) y la Ingeniera lo verifica, comparando los dos valores, y propone reparar (P0.5, solo en la pila).
- Reparar a Iris (`repararIa`): cuesta ⚡ −10, 🫁 −4, ella vuelve a nivel "pistas". Queda la causa `ia.reparada` y la insignia "mecánica".

## 5. Matriz: mecánica, estado real, dónde aparece, qué aprende, problema

Leyenda: ✅ implementado y conectado · 🟡 implementado pero oculto, desconectado o incompleto · 🔴 no existe · 🧪 solo en la rama experimental.

| Mecánica | Estado real | Dónde aparece | Qué aprende el jugador | Problema |
|---|---|---|---|---|
| Objetivo científico de la misión | 🔴 | Ningún lugar lo dice | Nada: el niño sabe "hay una base", no "qué descubrimos ni para qué" | La intro cuenta "una misión de entrenamiento" pero no por qué Jezero ni qué se busca |
| Explorar el entorno (mundo 3D, `[E]`, mapa) | ✅ | `PantallaBase`, `MundoBase`, `Mapa` | Que hay lugares distintos con una experta o una acción cada uno | El botón **Crew** está oculto hasta la primera conversación (`hudVisible`): se descubre solo si el niño sigue el objetivo de Iris |
| Observar con el satélite (pasos 1–2) | 🟡 | `PantallaOrbita` | Batería, señal y escudo del satélite como analogía | "Draw the satellite's path" (`ruta_dibujada`) **no es una acción**: es solo *Continue*. `ajustar_orbita` existe en el motor y no se ofrece. No hay decisión |
| Los 3 recursos y sus costos | ✅ | HUD, `ConfirmarAccion`, `CostRow` | Todo cuesta y llega con retraso | El retraso se ve en "Decision recorded", no antes de decidir |
| Elegir sitio con compensaciones | ✅ | `PantallaSitio` | Cada sitio gana y pierde algo | Falta el *por qué importa*: no se conecta con la tormenta |
| Construir 2 de 5 módulos | ✅ | `PantallaModulos`, `costoDe`, tarjetas de ciencia | Energía, soporte vital y blindaje vía módulos | Se elige **sin saber que viene una tormenta**: pesa menos de lo que debería |
| Consultar especialistas | ✅ | Crew, `[E]` en lugares, chips y campo de texto | Quién sabe qué | Las 3 expertas tienen funciones, pero nada empuja a consultarlas **antes** de la tormenta |
| Pronóstico de tormenta (P0.4) | 🟡 | `conversar` + `iris-acompana` (solo en la pila) | Que hay una tormenta real con fuente | Solo habla si el niño **pregunta** o va al taller. Con 12 s de reloj antes del turno 3, la mayoría lo oye tarde o nunca |
| Radiación y dosis (P0.1–P0.2) | 🟡 | Solo en el motor y en la frase de la Doctora | Casi nada | **No hay medidor de dosis en la UI.** El niño puede perder por una regla que no ve (límite 4 mSv). Grave para el criterio 8 |
| Refugio y escudo contra la dosis (P0.6) | 🟡 | Motor (`factorEscudo`, `enRefugio`) | Que proteger importa | Sin medidor de dosis no se puede ver el efecto de proteger |
| Dilema de la tormenta (paso 6) | ✅ | `PantallaTormenta` (elegir, comparar, verificar, registrar) | Dos expertas no coinciden; todo cuesta | Ver sección 6: con mis corridas, el refugio ganó siempre. Riesgo de "respuesta obvia" |
| Iris dañada (P0.5) | 🟡 | `iris.ts`, `conversar.ts` (solo en la pila) | Verificar antes de obedecer | Nunca se **gana la confianza** de Iris antes: no dice ningún número cierto. Además el panel Crew muestra "Iris is damaged by radiation" **desde el principio** (`PantallaBase.tsx:438`, lee `estado.iaBase` sin pasar por `averiaIrisRevelada`): spoiler a verificar en navegador |
| Preguntas de Iris nivel 2 | 🔴 en Jezero | `PreguntaDeIris` | — | Solo pinta en nivel "pistas"; Jezero arranca en "danada": **nunca aparece** |
| Telemetría y retraso Tierra–Marte | ✅ | `PantallaBase`, `datos.comunicaciones.retraso` | La luz tarda (3–22 min, NSSDC) | Se envía "porque es el paso 7", sin razón narrativa |
| Cadena de causas (decisión vs mala suerte) | ✅ | `PantallaFinal` | Qué pesó | No dice **qué probar distinto**. `causaTerminal` solo en `798cd95` |
| Pregunta final y tarjetas de ciencia | ✅ | `PantallaFinal` | Ciencia con fuente | Llega tarde: toda la ciencia se concentra al final |
| Matemático "¿y si…?" | 🟡 | `queEsSi`, `QueSi.tsx` (solo en el evento de polvo) | Simular antes de decidir | Fuera del panel de Crew de Jezero (`disponible: false`) |
| Polvo en los paneles | 🟡 | Datos + `Polvo.tsx` | Salir cuesta protección | Fuera de la semilla dorada: nadie lo juega |
| Guía de 8 pasos, radio de la tripulación | 🧪 | Rama experimental | Qué toca ahora y avisos proactivos | No oficial; el radio muestra que el aviso proactivo es posible |

## 6. Lo que medí yo en el motor (reproducible)

Corrí una prueba descartable sobre el árbol de `origin/feat/agentes-p04-aviso-tormenta` (semilla dorada, sitio `cerca-de-perseverance`, telemetría enviada en el turno 3 salvo la última fila). **No corrí la suite completa de pruebas.** Los números salen del motor, no de la mano.

| Estrategia | Módulos | Resultado | Dosis máx. | Por qué |
|---|---|---|---|---|
| Pasivo (no decide en la tormenta) | cualquiera | **Pierde** (turno 5) | 4,17 a 4,71 | Pasa el límite de 4 mSv |
| Aguantar | cualquiera | **Pierde** (turno 5) | 4,12 a 4,66 | Igual que el pasivo |
| Refugio y apagar invernadero | los 4 pares probados | **Gana** (turno 6) | 2,19 a 2,49 | La dosis baja de golpe |
| Subir escudo nivel 2 | panel + escudo, panel + antena | **Gana** | 2,73 / 2,86 | Hay energía para pagarlo |
| Subir escudo nivel 2 | reciclador + invernadero, escudo + invernadero | **Pierde** (turno 5) | 2,88 / 2,52 | **Energía llega a 0** antes de terminar |
| Telemetría tardía (turno 6), panel + escudo, subir escudo | — | Gana en turno 8 con energía 3 | 2,91 | Casi se queda sin energía |

**Lecturas:**
1. **Cada turno de tormenta sin protección suma ≈ 1,4 mSv** con blindaje 57. Con un presupuesto de 4, el niño puede pagar ~2 turnos expuestos. Es una regla simple y enseñable… si se ve.
2. **La preparación sí decide las opciones**: el escudo solo es viable si el niño construyó un panel (energía). Eso es una buena lección de causa y efecto entre el paso 4 y el 6.
3. **El refugio ganó 4 de 4.** La prueba del repo (`jezero-victoria.test.ts`) afirma que ninguna opción gana siempre; mi muestra es pequeña (16 corridas, 1 sitio, 4 pares) y no la contradice con certeza, pero apunta a que el refugio puede ser la respuesta obvia. Recomiendo que Camilo y Codex corran las 10 parejas × 4 sitios × 3 opciones antes de afirmar que el dilema es genuino. No propongo cambiar números: la regla de este trabajo prohíbe tocar reglas científicas existentes.
4. **Tiempo real:** el niño dispone de ~12 s de reloj entre "empezar la base" y la llegada de la tormenta (3 turnos × 4 s a 1×). Es el hueco narrativo más grande del diseño actual.

## 7. Qué funciona, qué falta, qué está desconectado

**Funciona:** la estructura de 8 pasos; las compensaciones reales de sitios y módulos; la tormenta real con tarjeta de fuente; las personalidades de los expertos; el mundo 3D con objetivo de Iris; el final con causas; el motor determinista y probado.

**Falta (no existe):** un propósito científico dicho al niño; una razón narrativa para la tormenta; un medidor de dosis; una decisión real en los pasos 1–2; una explicación de "qué probar distinto" al perder.

**Está desconectado:** pronóstico P0.4 sin disparador proactivo; preguntas de Iris nivel 2 (inalcanzables); Matemático; polvo; confianza previa en Iris; el estado de Iris visible en el panel Crew antes de tiempo.

**Qué está desarrollando Paula (P0.x y UI):** el estado de `ui/ESTADO.md` (15 nov) indica que Paula tiene personajes 3D (#328, plan de dos personas con Haiku/Opus/Fable), y que Daniel, Camilo, José y Jaime tienen cada uno su parte del escenario, la ubicación, la integración y la interfaz. **Yo no conozco su estado actual más allá de esos archivos**; antes de proponerle cambios a una pantalla hay que preguntarle a ella.

## 8. Dos cosas que debo señalar como riesgo de mi propio diagnóstico
- Lo de "spoiler de Iris en el panel Crew" y "Crew oculto hasta la primera conversación" lo deduje leyendo código; no lo vi en un navegador. Codex debe confirmarlo con Playwright (plan H).
- `docs/referenciapau/NIVELES.md` §2 propone una **campaña ordenada** con desbloqueo. Eso choca con el requisito de que las otras cuatro misiones sean independientes. Es una propuesta pendiente de aprobación, no una regla, y la rama experimental ya ofrece las 5 misiones desde un selector. Recomiendo que NIVELES se lea como "orden sugerido", no como compuerta (decisión de Santiago, ver README).
