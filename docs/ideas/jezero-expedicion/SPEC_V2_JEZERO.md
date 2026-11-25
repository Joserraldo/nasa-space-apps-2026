# Especificación v2 de Jezero (consolida y corrige B, C, D, E, F, G, H)

**Estado:** propuesta para aprobación final. **Implementación NO autorizada.** Los documentos A–H originales se **conservan intactos**; este documento los **supera donde se indica** (tabla de cambios, sección 0). Nada aquí modifica código, `ui/`, `assets/`, `missions/` ni `contracts/`, ni propone cambiar valores numéricos.
**Fecha:** 18 nov 2026 · **Autor:** Claude · **Base técnica verificada:** `origin/develop` = `cf48c72`, #449 = `4a949ad`, #454 = `798cd95`.

**Convenciones.** **EXISTE** = ya en el código (con ruta). **CONECTAR** = existe, falta enlazarlo. **NUEVO** = hay que construirlo. **HECHO** = comprobado por mí o por un auditor y verificado. **HIPÓTESIS** = no verificado.

## 0. Qué cambia respecto a los documentos originales

| Original | Decía | v2 dice | Motivo |
|---|---|---|---|
| B §3, §4-D, §5; F C1–C2; G entrega 2 | Un "círculo" tras los módulos y una **segunda pausa** al entrar en `base` | **Aviso meteorológico antes de elegir módulos**, dentro de `modulos` (donde el reloj ya está parado) y **"Start the clock" existente** como cierre. No hay segunda pausa | "Start the clock" ya existe (`ui.paso.4.listo`); el aviso solo enseña si llega antes de decidir (E14 de la revisión) |
| C §D (11 líneas) | Círculo largo | Aviso corto de 5 intervenciones (sección 1.3) | Carga cognitiva en el pico (auditoría de diseño) |
| F C4; C §D9 | `lecturaIris` "hoy da lectura falsa" | `lecturaIris` **no se usa en producción**: la lectura cierta es una rama **nueva** de `conversar` | `git grep`: solo definida y probada |
| README #3; F C3 | El spoiler de Iris está en 1 línea | **Tres superficies**, con su corrección y su gate común (sección 3) | Confirmado en código y en navegador |
| F N1 | Dosímetro con `dosis / límite`, condicionado a la Doctora | **Tasa por turno + dosis proyectada por opción**, visible desde que llega la tormenta | Verificado: el acumulado solo no enseña que el refugio sirve |
| F §3 "motor no cambia" y G entrega 5 | "No mostrar dosis estimada" | **Sí se muestra, marcada como estimación**, calculada con `queEsSi` ya exportado por el motor | Verificado: coincide exacto con el resultado real a 2 turnos |
| C §F9 | Pista "send the message earlier" | La telemetría solo se puede enviar desde que llega la tormenta; el plazo pasa a ser visible y la pista dice "send it as soon as the storm arrives" | `lugares.ts` / `opcionesDe` |
| C D6; README; F N1 | "Training budget / presupuesto" | **"Límite de entrenamiento"** en todo el producto | Decisión D12 |
| README (reutilizable por cualquier misión) | Genérico | Condiciones de reutilización explícitas (sección 7) | Solo Jezero define `limiteDosisMSv`; el reductor no pasa `mision` en `develop` |
| README/NIVELES | Campaña ordenada | **Jezero = introducción recomendada, sin desbloqueos obligatorios** | D6 |

**Qué se conserva de los originales sin cambios:** la premisa y el título de la expedición (B §2), la evaluación A–F (B §3) salvo C/D, las tres capas por edad (B §7, D §2), los tres tipos de personaje y sus preguntas (B §2), el mapa de aprendizaje (D §1, con las filas de radiación y verificar actualizadas aquí), y la lista de lo que NO se construye (F §3, salvo el matiz del Matemático, sección 6).

## 1. El aviso meteorológico antes de elegir módulos (Momento D v2)

### 1.1 Secuencia
`Llegada` → `modulos` (reloj parado, **EXISTE**: el intervalo solo se arma con `enBase && !pausado`, `App.tsx:146-150`) → **aviso (NUEVO como disparador)** → el niño elige 2 módulos sabiendo que viene una tormenta → **"Start the clock" (EXISTE, `PantallaModulos.tsx:193-207`)** → `base` con el reloj corriendo → tormenta (turno 3) → decisión.

### 1.2 Cómo se dispara (CONECTAR)
- Al montar `PantallaModulos`, **una sola vez por partida**, pedir `conversar({ experto: "meteorologa" }, estado, { tormentaActiva: false, averiaRevelada: false, dosisMarte })`. Con #449 la respuesta trae `prioridad: "alerta"`, la fuente DONKI y, desde el estado, el nombre y la fecha de la tormenta real.
- **Sin #449 no sale** (`pronostico.viene` solo existe en esa rama): dependencia dura.
- Debe contar como "primera conversación" para el HUD progresivo (`onProgreso({ conversado: true })`, ya existe en `PantallaBase`/`PantallaTormenta`) para que el botón **Crew** aparezca. Así el niño que se enteró de la tormenta puede ir a Crew sin caminar al sensor.
- La condición "ya se avisó" se **deriva del estado/partida guardada**, no de un flag local de React (para que "Continue" no la repita ni la pierda). HIPÓTESIS de implementación: una bandera en el estado de UI que se guarda con el resto (`serializarProgreso` ya guarda la fase y el estado).

### 1.3 Guion v2 (reemplaza C §D; inglés original; sin traducciones definitivas)

| # | Quién | Línea EN | Intención (ES) | Estado |
|---|---|---|---|---|
| D1 | Meteoróloga | "My sensor just spotted a solar cloud leaving the Sun!" | El evento que dispara la historia | NUEVO (dato real: CME de DONKI) |
| D2 | Meteoróloga | "It's a real storm: {name}. It happened on {date}." | Nombre y fecha reales, con fuente | EXISTE (`agentes.meteorologa.pronostico.viene`, #449) |
| D3 | Meteoróloga | "A solar cloud can take days to arrive. This one is coming." | Por qué hay tiempo de prepararse | NUEVO; hecho del glosario *Solar cloud* |
| D4 | Doctora | "You can't see radiation, so I count it." | Idea central de la dosis | EXISTE en espíritu (`agentes.doctora.salud.noSeSiente`) |
| D5 | Ingeniera | "A shield uses energy. Panels make it." | Une la elección de módulos con la tormenta | NUEVO |
| — | Iris | Casi muda: solo recuerda *Start the clock* al final | Evita saturar | EXISTE (`ui.paso.4.listo`) |

**Corrección de contenido existente que se debe pedir a quien es dueño de #449 (José):** `agentes.meteorologa.pronostico.preparar` hoy dice *"the shelter protects the crew best, and the shield helps too but uses energy"*. Eso (a) dice qué hacer, cuando la Meteoróloga solo debe decir **qué pasa** (B §2), y (b) **inclina al niño hacia el refugio** justo en el dilema que se quiere hacer genuino (`DILEMA_TORMENTA_V2.md`). Propuesta de intención, texto por definir en inglés: "Both a shelter and a shield can help. They cost different things." Es un cambio de contenido, no de reglas.

### 1.4 Reloj: reutilizar lo existente (HECHO)
- No se añade ninguna pausa nueva ni barrera en `base`. "Start the clock" ya es la decisión del niño.
- Tras pulsarlo, el reloj corre de inmediato y la tormenta llega en 3 turnos (12 s a 1×). Con el aviso previo, el niño ya sabe qué viene. Las acciones de preparación están en el panel **Crew** (refugiarse, subir escudo, `opcionesDe` en `PantallaBase`), sin tener que caminar.
- Si más adelante se quisiera más margen, hay una opción **sin cambiar el motor**: iniciar `base` con `pausar(estado, true)` y derivar un CTA de `pausado && tick === 0` (no de un flag). **No se recomienda ahora**; implica cambiar `ruta-dorada.spec.ts:141`, `derrota-repetir-continuar.spec.ts:44,157`, `capturar.mjs:128` y `movimiento.mjs:86`.
- **Insistencia de Iris (~20 s sin acción):** requiere un temporizador de interfaz en tiempo real; `ticksSinAccion` **no sirve** (no avanza con el reloj parado y en Jezero la rama adaptativa de Iris no se ejecuta).

## 2. Revelación progresiva de Iris

**Principio:** el niño descubre que Iris se equivoca **comparando un número con un medidor**, no leyéndolo en una etiqueta.

| Etapa | Cuándo (estado) | Qué ve y oye el niño | Qué NO ve |
|---|---|---|---|
| **S0 Iris sana** | `modulos` y `base` antes de la tormenta | Iris guía como tutorial. **Una lectura cierta** ("Shield is at {valor}%"), igual al medidor del HUD | Ninguna palabra "damaged", "broken", "Repair Iris", "bad advice" |
| **S1 Confianza** | Primera pregunta a Iris, o el objetivo de Iris, antes de la tormenta | La lectura cierta se repite si pregunta; el niño ve que coincide con el medidor | La acción reparar |
| **S2 Revelación** | Llega la tormenta (`tormentaActiva`) | Glitch (`agentes.iris.falla.glitch`) y **una lectura falsa de ≥ 20 puntos** del medidor, a la vista en el HUD. Ahora sí puede aparecer el aviso de mala consejera | — |
| **S3 Verificación** | Después del glitch | La Ingeniera compara "Iris dijo {dicho}%, el medidor dice {real}%" (`agentes.iris.verificar.numero`). Aparece **reparar** (taller y panel Crew) | — |
| **S4 Reparada** | `repararIa` (⚡−10 🫁−4) | Iris vuelve en "pistas", agradece sin culpa (línea NUEVA E12) | — |

**Fuente única del estado de revelación (CONECTAR):** una sola función (`averiaIrisRevelada(estado, mision)`, hoy en `ui/src/pantallas/lugares.ts:68-70`) que todas las superficies consultan. **HECHO (corrección a mis docs):** la función hoy depende de `pasoDeLaBase(estado) >= pasoRevelacion (6)`, pero `pasoDeLaBase` solo devuelve 4, 7 u 8; en la práctica se revela cuando llega la tormenta. La v2 lo dice explícitamente: **revelación = llegada de la tormenta**, derivada de `tormentaActiva(estado, mision)`. Medido: en el turno 0 devuelve `false`, en el turno 3 `true`.

**Lectura cierta (NUEVO, no CONECTAR):** `lecturaIris` (`agents/src/iris.ts:68`) existe pero no se llama en producción. Antes de la revelación `conversar` usa `sinAveriaVisible` y Iris solo responde `ayuda / saludo / repetir / fueraDeTema`. Hay que añadir en `conversar` la rama "`ia_base` con `averiaRevelada === false` → lectura cierta" y las claves de texto. Dueño: agents.

**Consecuencia observable de obedecer a Iris:** **PENDIENTE de decisión de Santiago.** Hoy la falla solo sale si el niño le pregunta a Iris, y su propuesta peligrosa (`redistribuir_energia` hacia soporte vital, ⚡−54 con cantidad 50) pide confirmación con costos visibles: obedecerla no tiene consecuencia observable que enseñe. **Debe medirse antes de escribir el guion** (caso `ENG-IRIS-1` del plan de QA independiente). Además el texto existente `agentes.iris.verificar.accion_peligrosa` dice que quitar energía "del escudo" deja entrar la radiación, y la acción real **no toca el blindaje**: enseña una causalidad falsa y debe corregirse.

## 3. Las tres filtraciones que deben desaparecer

Todas pertenecen a la interfaz (María Paula); el cambio es pequeño pero toca una e2e. **Línea base medida hoy** (rama de #449, partida dorada, turno 0).

| # | Superficie | Hoy (HECHO) | Objetivo v2 | Prueba |
|---|---|---|---|---|
| **L1** | Panel Crew, `PantallaBase.tsx:438` | Muestra `ui.iris.estado.${estado.iaBase}` sin pasar por `averiaIrisRevelada`: dice **"Iris is damaged by radiation"** desde el turno 0. **Confirmado en navegador** (captura `evidencia-crew-iris-turno0.png`, "Turn 0") | Antes de S2 muestra el estado de un Iris sana (p. ej. `ui.iris.estado.tutorial`); desde S2, el real | e2e con captura y búsqueda de texto |
| **L2** | Taller, `lugares.ts:35-40` (`usoDelLugar`) | Con `iaBase === "danada"` ofrece **`reparar` a Iris** aunque la avería no esté revelada. **Medido:** en el turno 0 `usoDelLugar("taller")` devuelve `{tipo:"reparar", equipo:"ia_base"}` con `averiaIrisRevelada = false`. El HUD dice "Ask the Engineer" y la tecla `[E]` dice "Repair Iris": mensaje partido y un gasto de ⚡−10 🫁−4 sin motivo | Antes de S2 el taller solo consulta a la Ingeniera; desde S3 ofrece reparar | prueba de unidad + e2e |
| **L3** | Pantalla de tormenta, `PantallaTormenta.tsx:124` | **Cualquier** respuesta de Iris (aunque sea un saludo) lleva `ui.tormenta.irisAviso` ("may be giving bad advice…"). Esa pantalla **es** la revelación, pero el aviso adelanta la conclusión antes de que Iris haya fallado | El aviso aparece solo cuando la respuesta de Iris trae `falla` (ya existe el campo `Falla` en `DialogoIris`) | prueba de componente |

**Dependencia que obliga a tocar una prueba existente (HECHO, B):** `tests/e2e/ruta-dorada.spec.ts` y la e2e "seguir a Iris del paso 4 al 8" (`DESTINOS[0]`) dependen de que el taller ofrezca "Repair Iris" desde el principio (el propio comentario de `lugares.ts` lo admite). Corregir L2 obliga a cambiarlas **en el mismo PR**.

## 4. Tasa de radiación y dosis proyectada

### 4.1 De dónde sale cada valor (sin tocar contratos ni motor)
| Valor | Fuente | Estado |
|---|---|---|
| Dosis acumulada | `dosisMaximaTripulacion(estado)` (`engine/src/radiacion.ts`; exportada vía `engine/src/index.ts`). El contrato ya tiene `tripulacion[].dosisMSv` | EXISTE |
| **Tasa del turno** | Diferencia de `dosisMaximaTripulacion` entre dos estados consecutivos de la UI (o `dosisDelTurno(estado, mision)`, función pura exportada) | EXISTE (cálculo de UI, sin lógica nueva) |
| Límite | `mision.limiteDosisMSv` (opcional; **solo Jezero lo define**, valor 4) | EXISTE |
| **Dosis proyectada por opción** | `dosisMaximaTripulacion(queEsSi(estado, accion, mision))` | EXISTE |

### 4.2 La proyección es una estimación (HECHO + condiciones)
- **Procede de la lógica existente del motor.** `queEsSi(estado, accion, mision)` aplica la acción y avanza el motor tantos turnos como el retraso máximo de la dificultad (`RETRASO_POR_DIFICULTAD.max`), sin tocar el estado real. **No es una función nueva ni una segunda implementación de la regla.**
- **Verificación realizada** (partida dorada, turno 3, panel + escudo, cerca de Perseverance): dosis proyectada a 2 turnos con `queEsSi` vs. dosis real tras 2 turnos de juego: refugio **2,20 = 2,20**, escudo **2,70 = 2,70**, aguantar **4,24 = 4,24**. Coinciden.
- **Por qué es "estimada" y debe decirlo en pantalla:**
  1. Horizonte de **2 turnos**, no toda la tormenta (la ventana es de 3 y la misión sigue hasta el turno 10).
  2. No incluye eventos de mala suerte que el motor pueda sortear después (la proyección usa el mismo estado de azar: HIPÓTESIS, no verificada con semillas distintas).
  3. Supone que no se toman más acciones.
  4. La propia dosis es una aproximación educativa del motor (parámetros de blindaje, refugio y escudo declarados "educativos, no datos físicos" en `design/src/recursos.ts`).
- Rotulado propuesto: "Estimate for the next 2 turns" (EN base). **No se muestra ninguna cifra sin ese rótulo.**
- **Alcance de la proyección:** además de la dosis, `queEsSi` devuelve el estado completo; la UI **puede** mostrar también energía, soporte y blindaje proyectados. Decisión pendiente (B6 de la revisión).

### 4.3 Presentación (propuesta de comportamiento; la forma visual es de María Paula)
- Dosímetro visible **desde que llega la tormenta**, no condicionado a hablar con la Doctora (hoy se puede perder por dosis sin haberlo visto).
- Muestra: **dosis actual** y **límite de entrenamiento**, **tasa de este turno** ("+0,4 este turno") y, mientras dure, "Protegido: N turnos" (los valores `DURACION_REFUGIO_TICKS` y `DURACION_ESCUDO_TICKS` ya existen en `design/`).
- **Un decimal como máximo** (o pasos visuales) para 7–8 años; el valor siempre en texto además del color; `aria-live` educado.
- Sin `limiteDosisMSv` (las otras 4 misiones): solo la dosis y la tasa, sin barra ni porcentaje (evita NaN/Infinity).
- En "Compare your plan": dosis proyectada de **esa** opción junto a sus costos.
- En "Decision recorded": dosis antes y después, con la **real**.
- En el final (QA-445 y `resumen.ts`): dosis alcanzada y límite, cuando la causa de derrota sea la dosis.

### 4.4 Honestidad científica del límite
- Nombre: **límite de entrenamiento**, en todo el producto (guion, HUD, final, README, docs). El texto dice que **es una regla del entrenamiento y no la línea de peligro real**. No se cita una cifra de carrera de astronautas sin una tarjeta con fuente del rol de datos (`bloquea:datos`).
- **HIPÓTESIS pendiente (rol de datos):** el motor aplica el factor 19,4 (cociente pico/fondo medido en µGy/h) a turnos completos (1/6 de día cada uno). Si es una sobreestimación, la tarjeta de ciencia y la línea de la Doctora deben decir "durante unas horas", no "ese día ×19". No se cambia ningún número mientras no se verifique.

## 5. Presentación visible del plazo de telemetría

**Problema HECHO:** `tickLimite` (10) solo existe en `engine/src/acciones.ts` y en la misión; el HUD pinta "Day / Turn n" (`ui.tick`: "Turn {tick}") sin límite. La telemetría **solo se puede enviar desde que llega la tormenta** (`opcionesDe` en `PantallaBase` y `usoDelLugar("mesa")` exigen `tormentaActiva`). Tras "Decision recorded" el reloj vuelve a 4 s/turno y el niño debe caminar hasta la mesa. Se puede perder por plazo sin haber sabido que había plazo.

**Especificación (solo interfaz, valores ya existentes):**
1. **Turno límite visible:** el HUD pasa de "Turn {n}" a "Turn {n} of {mision.fin.tickLimite}" (UI-only; el dato está en la misión).
2. **Objetivo del HUD** (`objetivoDeLaBase`): cuando `tormentaActiva(estado) && !telemetriaPendiente(estado)`, el objetivo es "Send telemetry to Earth" en la consola, con el lugar resaltado (el mecanismo de lugar resaltado ya existe).
3. **Llegada de la respuesta:** con la telemetría en camino, mostrar "Earth's answer arrives in {n} turns" (EXISTE: `ui.paso.7.llegando`) y, **nuevo**, el turno de llegada frente al turno límite.
4. **Aviso de margen:** si `tick + retraso > tickLimite` ya no puede llegar a tiempo, aviso claro (cálculo de UI a partir de `RETRASO_COMUNICACIONES[sitio]` o `mision.retrasoComunicacionesTicks`).
5. **Pista del final** corregida: "send it as soon as the storm arrives" (no "earlier").
- **Condición de aceptación:** ningún valor se inventa; todo sale de `mision.fin.tickLimite`, `telemetriaPendiente()` y `RETRASO_COMUNICACIONES`.

## 6. Matemático: matiz sobre D3
D3 (el Matemático queda fuera de Jezero) **se respeta**. La "dosis proyectada" **no es el Matemático**: no es un personaje ni una voz, es información del panel de decisión calculada con `queEsSi`. La implementación del Matemático (`atajos`, `QueSi.tsx`, `disponible: false`) no cambia.

## 7. Cinco misiones independientes (D6 respetado)
- **Jezero es la introducción recomendada.** No hay desbloqueos, ni bandera de "Jezero completada", ni misión que dependa de otra. `NIVELES.md` §2 se lee como **orden pedagógico sugerido**.
- **Condiciones para que las piezas nuevas no cableen Jezero** (criterios de aceptación en la sección 10):
  1. Reciben `mision` (por props) y no importan `MISION_JEZERO`.
  2. El dosímetro acepta `limiteDosisMSv` ausente.
  3. La pantalla de tormenta lee `mision.dilemaPaso6.opciones` en tiempo de ejecución (hoy, en `develop`: `OPCIONES = MISION_JEZERO.dilemaPaso6.opciones` a nivel de módulo; Luna visible tiene cuatro opciones y mostraría tres).
  4. El reductor pasa `mision` a `aterrizar`, `elegirDilema` y `avanzarTick` (HECHO, B: hoy `reductor.ts` usa Jezero por defecto).
- **HECHO (descubierto en la auditoría de integración):** la pila **#410–#415** ("UI multi-misión", Frente E) ya hace esa parametrización con `misionActiva()` (variable de módulo que `App` fija en cada render, "atajo a revisar" según su propia descripción) y `misionPorId(j.misionId)` en el reductor. **#410 está en conflicto con `develop`** en `ui/src/App.tsx` y `ui/src/pantallas/PantallaBase.tsx` (conflicto previo a P0, causado por #417, #419, #420, #430). Las piezas v2 deben construirse **sobre esa parametrización**, no en paralelo; ver orden de integración en `REVISION_ENTREGA_0.md`.
- **Habilidades, no reglas:** Jezero dramatiza lecturas de medidores, costos con retraso, consultar, verificar y enviar a tiempo. Las otras misiones cambian contexto (sin Sol, hielo, noche larga, sin suelo), no habilidades. Un niño que empieza por otra misión no encuentra una barrera; recibe, si se aprueba, un par de líneas de Iris por habilidad nueva, controladas por una bandera local, no por una misión completada.
- **Honestidad (DeepSeek, verificado):** las cinco comparten hoy el mismo esqueleto de 8 pasos, `tickTormenta: 3`, avería de Iris y dilema de tres opciones; sus mecánicas diferenciadoras (noche polar, amanecer lunar, hielo, "no hay suelo") **están sin implementar** en sus propios comentarios. La dosis se acumula en las cinco pero solo Jezero tiene límite. La v2 **no promete** que las otras cuatro enseñen dosis ni aviso; solo garantiza que las piezas nuevas no se lo impidan.

## 8. Mapa de archivos actualizado (por momento)

| Momento | Existe | Conectar | Nuevo |
|---|---|---|---|
| Aviso antes de módulos | `PantallaModulos`, `conversar`, `TarjetaFuente`, `ui.paso.4.listo` | Disparador único + marca de "primera conversación" (`PantallaModulos`, `App`) | Líneas D1, D3, D5 (agents i18n) |
| Reloj | `App.tsx:146-150`, `reductor.ts` (`pausa`, `fase`, `seguir`), HUD Pause/Resume | — | Temporizador de insistencia de Iris (UI) |
| Iris S0–S4 | `averiaIrisRevelada`, `sinAveriaVisible`, `irisDanada`, `verificarIris`, `repararIa` | Gate único; L1, L2, L3 | Rama "lectura cierta" en `conversar`; línea E12 |
| Dosímetro y tasa | `dosisMaximaTripulacion`, `dosisDelTurno`, `ProgresoHud` | — | Componente `Dosimetro` (props `{valor, tasa, limite?, protegidoTurnos?}`) |
| Dosis proyectada | `queEsSi`, `costoDe`, `puedeAplicar`, `PantallaTormenta` (`CostRow`) | Mostrarla en "Compare your plan" y en "Decision recorded" | Rótulo de estimación (i18n) |
| Plazo | `mision.fin.tickLimite`, `telemetriaPendiente`, `objetivoDeLaBase`, `ui.paso.7.llegando` | Objetivo de HUD y texto "of {límite}" | Aviso de margen (cálculo de UI) |
| Final | `resumen.ts`, `PantallaFinal` (#454) | Dosis alcanzada | `pistaDeReintento` (agents) |
| Multimisión | #410–#415 (`misionActiva`, `misionPorId`) | Reutilizar | Contexto de React en lugar de la variable de módulo (decisión de quien integre) |

## 9. Cambios al plan de implementación (sustituye el orden de G)
1. **Fase 1 — Integración** (sin código nuevo): #454, #449, y la posición de la pila #410–#415 (ver revisión).
2. **Fase 2 — Iris sin filtraciones** (L1, L2, L3 + e2e).
3. **Fase 3 — Aviso antes de módulos** (disparador + Crew + guion D1–D5 + texto neutro de `pronostico.preparar`).
4. **Fase 4 — Dosímetro con tasa** + límite de entrenamiento.
5. **Fase 5 — Dosis proyectada** en el panel de decisión y en "Decision recorded".
6. **Fase 6 — Plazo visible** y objetivo de telemetría.
7. **Fase 7 — Dilema:** primero la capa de información (ya cubierta por 4 y 5); cualquier otro cambio, solo según `DILEMA_TORMENTA_V2.md` y con aprobación.
8. **Fase 8 — Iris: lectura cierta y consecuencia observable** (esta última, pendiente de decisión).
9. **Fase 9 — Final:** dosis alcanzada, pista de reintento, guion EN y luego ES.
10. **Fase 10 — QA independiente** (`PLAN_QA_INDEPENDIENTE.md`).

## 10. Criterios de aceptación verificables (v2)
1. **Aviso:** en `modulos`, antes del primer módulo colocado, aparece el diálogo de la Meteoróloga con fuente y `prioridad: "alerta"`; `estado` del motor sin cambios; tras "Continue" de una partida guardada no se repite; el botón Crew es visible.
2. **Reloj:** tras "Start the clock" el turno es 0 hasta el primer intervalo de 4 s; no hay una segunda barrera de reloj en `base`.
3. **Iris:** en el turno 0, ni Crew, ni taller, ni la pantalla de tormenta contienen "damaged", "Repair Iris" ni "bad advice" **antes** de S2; después, sí. La lectura de Iris en S0–S1 es igual al medidor; en S2 difiere ≥ 20 puntos.
4. **Tasa y proyección:** el valor del DOM coincide con `dosisMaximaTripulacion` y la proyección de cada opción con `dosisMaximaTripulacion(queEsSi(estado, accion, mision))`; el rótulo "Estimate for the next 2 turns" está presente en toda cifra proyectada; el texto "límite de entrenamiento" es el único nombre usado (búsqueda por texto, sin "budget"/"presupuesto").
5. **Plazo:** el HUD muestra "Turn n of {tickLimite}"; con la tormenta activa y sin telemetría, el objetivo es enviarla; con `tick + retraso > tickLimite`, aviso de margen.
6. **Multimisión:** ninguna pieza nueva importa `MISION_JEZERO`; una misión sin `limiteDosisMSv` no produce NaN ni barra; una misión con cuatro opciones de dilema se pinta completa.
7. **Honestidad:** cada cifra de NASA con fuente, fecha de consulta y "curated, not live"; ningún texto sugiere que 4 mSv sea el umbral de peligro real.
8. **i18n:** nada visible fuera de i18n; inglés completo antes que español; paridad de claves.
9. **Sin cambios de balance:** el diff de `design/` y `missions/` está vacío salvo que Santiago apruebe lo contrario por escrito.
