# Revisión de la Entrega 0 — Jezero: la primera expedición

**Fecha:** 18 nov 2026 · **Coordina:** Claude Code · **Decide:** Santiago · **Estado:** auditorías consolidadas. **Implementación NO autorizada.**
No se modificó código de producto, `ui/`, `assets/`, `missions/` ni `contracts/`; no hay commits, push, merges, rebases ni cambios de bases de PR. Los ocho documentos originales **no se reescribieron**: sus errores se corrigen aquí (sección 2). Archivos auxiliares en esta carpeta: `barrido-entrega0.csv`, `barrido-entrega0.test.ts.txt`, `evidencia-crew-iris-turno0.png`, `evidencia-crew-iris.spec.ts.txt`.

> **Actualización 3 (ejecución de las decisiones de Santiago):** la sección final **"Actualización 3"** registra el orden de integración aprobado, las verificaciones completadas, las solicitudes enviadas (#455 y #456), los resultados de las investigaciones (proyecciones, Iris, escenarios del dilema, ciencia) y los bloqueos que quedan. **Su tabla de decisiones sustituye a la de la sección D de la actualización 2.** Documentos nuevos: `SPEC_V2_ADENDA_3.md`, `PROPUESTA_RESOLUCION_410.md`, `ESTUDIO_OBEDIENCIA_IRIS.md`, `DILEMA_TORMENTA_V3_ESCENARIOS.md`, `VALIDACION_CIENTIFICA_RADIACION.md`, `PROTOCOLO_VALIDACION_NINOS.md` y la "Revisión 3" de `PLAN_QA_INDEPENDIENTE.md`.

> **Actualización 2 (cierre de la entrega 0):** al final de este documento hay una sección nueva, **"Cierre de la Entrega 0 — actualización 2"**, con la auditoría de integración completada, las decisiones por estado y los bloqueos. Documentos nuevos: `SPEC_V2_JEZERO.md`, `DILEMA_TORMENTA_V2.md`, `PLAN_QA_INDEPENDIENTE.md`. Las secciones 1–12 de abajo son la **primera versión y se conservan sin cambios**; donde la actualización 2 las corrige, lo dice expresamente.

## 1. Resumen ejecutivo

1. **Corrijo un error mío grave (A §1 y README):** dije que P0.1–P0.6 no estaban en `develop`. Era falso: usé el `develop` **local**, desactualizado (`7acc683`). En `origin/develop` (`cf48c72`) ya están **P0.1, P0.2, P0.3 y P0.6** (#443, #444, #445, fusionados el 17 nov). Siguen fuera **P0.4 y P0.5** (PR #449 abierto, que ya contiene #450) y **QA-445** (PR #454 abierto). Ambos están limpios, con CI verde y sin conflicto entre sí ni con `develop`.
2. **El dilema NO está equilibrado: el refugio es la estrategia dominante.** Mi barrido de 640 corridas y el de DeepSeek (120) coinciden al decimal: con telemetría en el turno 3, **refugio 37/40, escudo 16/40, aguantar 5/40**. No hay ni una sola situación en que el escudo gane y el refugio pierda (0 de 160). Cuando ambos ganan, el refugio termina con menos dosis y mucha más energía. Lo dejo sin suavizar (sección 8).
3. **El Momento D tiene un fallo de concepto en mi propio diseño:** mis documentos se contradicen sobre *cuándo* avisa la Meteoróloga (antes o después de elegir módulos). Solo funciona **antes**. Además "Start the clock" **ya existe**: el problema no es la ausencia del botón, sino que al pulsarlo el reloj corre de inmediato (12 s hasta la tormenta). Mi propuesta de "añadir otra pausa" duplicaría ese botón.
4. **El dosímetro, tal como lo propuse, no enseña lo esencial:** mostraría un acumulado que sigue subiendo aunque el niño se refugie, así que el refugio parece no servir. Hay que mostrar la **tasa** por turno y la **proyección por opción**. Verifiqué que la proyección **ya es posible sin tocar el motor** con `queEsSi` (sección 5).
5. **El spoiler de Iris está confirmado en navegador real** (turno 0: el panel Crew dice "Iris is damaged by radiation") y hay **otras dos filtraciones** que yo no vi (el botón del taller y el aviso de la pantalla de tormenta).
6. **Codex no estuvo disponible** (su host de herramientas no arranca). El Agente C no existe como auditor independiente: sus tareas las hice yo y lo señalo donde importa.

## 2. Revisión de los ocho documentos: errores y correcciones

Cada fila fue verificada contra el código. "Fuente" = quién lo detectó. **Todas estas correcciones se proponen como errata; no edité los originales.**

| # | Documento | Afirmación original | Realidad verificada | Fuente |
|---|---|---|---|---|
| E1 | A §1, README | P0.1–P0.6 no están en `develop` | P0.1–P0.3 y P0.6 sí están en `origin/develop` (`cf48c72`); mi `develop` local estaba viejo | B + yo (`merge-base --is-ancestor`) |
| E2 | A §1 fila 2 | La rama `agentes-p04` contiene P0.1–P0.3 y P0.6 "apilados" | Esos entran por `develop`; la rama solo aporta P0.4 y P0.5 | B |
| E3 | F §6.1, README D5, G entrega 0(b) | "Fusionar la pila #443–#450" | Quedan solo **#449 (con #450 dentro)** y **#454** | B |
| E4 | A §1 | La rama donde estás tiene "tarjeta guía, radio…" y es la base de la experimental | La experimental (`cf4b756`) **no** está sobre #410–#415 y no tiene PR propio; es una línea paralela de 5 commits sobre `cefd3ab` | B |
| E5 | A §5 | "El retraso se ve solo en Decision recorded" | `CostRow` ya muestra "Helps later" antes de decidir (`Piezas.tsx:90`, `ConfirmarAccion.tsx:47`) | DeepSeek, verificado por mí |
| E6 | README #3, A §4 | "Iris nunca gana confianza antes de fallar" | Con `averiaRevelada:false` Iris se presenta fiable; lo que **falta es una cifra comprobable**. La frase correcta es "nunca da un número verificable" | DeepSeek |
| E7 | **F C4** | "`lecturaIris` hoy da lectura falsa aunque no esté revelada" | **Incorrecto.** `lecturaIris` está definida en `agents/src/iris.ts:68` pero **ningún código de producción la llama** (solo un test). Antes de la revelación, `conversar` usa `sinAveriaVisible` y Iris responde solo `ayuda/saludo/repetir/fueraDeTema`. Para dar una lectura cierta hay que **crear la rama**, no corregir un flujo | B + yo (`git grep`) |
| E8 | F C3, README | El spoiler de Iris está en 1 línea | Hay **3 superficies**: `PantallaBase.tsx:438` (píldora en Crew), `lugares.ts:38` (el taller ofrece "Repair Iris" desde el turno 0, y una e2e depende de ello) y `PantallaTormenta.tsx:124` (aviso de mala consejera antes de revelar) | B + DeepSeek |
| E9 | B/F "revelación en el paso 6" | La avería se revela en el paso 6 | `pasoDeLaBase` solo devuelve 4, 7 u 8: la revelación coincide con la llegada de la tormenta (turno 3) | B + yo (leí `lugares.ts`) |
| E10 | README, F §0 | "Solo tres piezas nuevas" | Son tres nuevas + seis conexiones + **una rama nueva de lógica de Iris** (E7) | DeepSeek |
| E11 | F §0 | Pantallas que importan `MISION_JEZERO`: 4 | Son al menos 9, y **el reductor aplica reglas de Jezero a todo** (`aterrizar`, `elegirDilema`, `avanzarTick` sin `mision`) | B + DeepSeek |
| E12 | README, F §0 | "El dosímetro es reutilizable en cualquier misión" | Solo Jezero define `limiteDosisMSv`; las otras 4 lo dejan `undefined` (y se acumula dosis sin límite ni medidor) | B + DeepSeek |
| E13 | B §8 | "Los especialistas no repiten información" | La Meteoróloga y la Doctora citan el mismo "×factor"; la Meteoróloga dice qué hacer (`pronostico.preparar`), pese a que B §2 se lo prohíbe | DeepSeek |
| E14 | B §4 D / E §1 | El "círculo" tras los módulos | **Contradicción interna:** B/F dicen "al empezar el paso 4"; C §D1 dice "al terminar de colocar". El aprendizaje solo existe si el aviso va **antes** de elegir | DeepSeek |
| E15 | C §F9 | Pista "send the message earlier" | La telemetría **no se puede enviar antes del turno 3** (`lugares.ts:28`, `PantallaBase` `opcionesDe`): la pista es inaccionable | DeepSeek, verificado en código |
| E16 | G entrega 2 | "La ruta dorada se actualiza para pulsar 'Start the clock'" | Ya lo pulsa. Lo que cambia es que la base empiece pausada y obliga a sustituir `Pause` por `Resume` en e2e y capturas | B |
| E17 | G entrega 0 | "Correr el barrido" | Existe un barrido en `jezero-victoria.test.ts`, pero solo afirma "gana alguna vez / no gana siempre"; **no cuenta ni mide márgenes** | DeepSeek |
| E18 | README identidad | Polo Norte "(no implementada aún)" | Existe como datos exportados; lo no implementado es la noche polar | B |
| E19 | C (citas EN) | Líneas entre comillas | Algunas son paráfrasis de las claves reales; las claves `[EXISTE]` sí existen pero **el texto citado debe copiarse literal** | B |
| E20 | C `accion_peligrosa` (texto existente) | — | El texto dice que quitar energía "del escudo" deja entrar la radiación, pero la acción real es `redistribuir_energia` hacia soporte vital y **no toca el blindaje**: enseña una causalidad falsa | DeepSeek, verificado en `costoDe` |
| E21 | Doctora, `salud.estado` | "El tripulante con más dosis" | `acumularDosis` suma lo mismo a todos: nunca hay uno con más dosis | DeepSeek, verificado en `radiacion.ts` |

**Aciertos confirmados (no hay que rehacerlos):** recursos y costos citados, `tickTormenta: 3`, tormenta de 3 turnos, límite 4 mSv, orden de fin (recurso > dosis > victoria > plazo), dosis ≈1,36–1,38 mSv por turno expuesto a blindaje 57, el panel Crew oculto hasta la primera conversación.

## 3. Resultado de cada auditoría delegada

| Agente | Quién | Estado | Aporte principal |
|---|---|---|---|
| **A** Diseño y experiencia | DeepSeek (`deepseek-v4.1-flash-free`, solo lectura) | ✅ Completó | 15 contradicciones, 10 recomendaciones; hallazgos nuevos: ventana post-tormenta, aviso antes/después, tasa vs acumulado, dosis proyectada, "aguantar" como espantapájaros, multimisión |
| **B** Arquitectura | Agente independiente (solo lectura) | ✅ Completó | Mapa de ramas/PR/SHAs, conflictos con `merge-tree`, dosis sin tocar contratos, reloj, spoilers, errata |
| **C** QA y simulación | Codex | ❌ **No disponible** (`codex-code-mode-host: No such file or directory`); no produjo nada | Lo reemplacé: barrido + prueba visual hechos por mí (secciones 5 y 8). **No es independiente**, y lo marco |

**Cómo verifiqué a los agentes (no los acepté tal cual):** repetí por mi cuenta (a) el barrido de equilibrio (coincide con DeepSeek en 37/40, 16/40, 5/40 y en que el refugio solo pierde con `invernadero+antena`, por energía), (b) los ancestros de commits y estados de PR (coinciden con B), (c) la existencia de `lecturaIris` en producción (B tiene razón, yo no), (d) el spoiler de Crew en navegador (confirmado), (e) la viabilidad de la proyección con `queEsSi` (nueva, ver §5). **No verifiqué** por mi cuenta: los conflictos de `merge-tree`, la afirmación de B sobre `capturar.mjs`/`movimiento.mjs`, la inflación física del ×19,4 (hipótesis de DeepSeek) ni el "dos spoilers" de `PantallaTormenta.tsx:124`.

**Dónde discrepan los auditores:** B dice que "Start the clock" ya existe y DeepSeek propone "pausar tras Decision recorded"; no se contradicen (el primero es antes de la base, el segundo es después de la tormenta). **Sin contradicciones sustantivas** entre ellos; sí entre ellos y mis documentos (sección 2).

## 4. Matriz: hechos comprobados, hipótesis y decisiones pendientes

| Tema | Hecho comprobado | Hipótesis (no verificada) | Pendiente de Santiago |
|---|---|---|---|
| P0 en develop | P0.1–P0.3, P0.6 en `origin/develop`; P0.4+P0.5 en #449 (abierto); QA-445 en #454 (abierto) | — | **D5** orden de fusión |
| Reloj | Corre solo desde `fase==="base"`; tormenta en 12 s; "Start the clock" ya existe | Que iniciar la base pausada baste para dar tiempo | **D2** |
| Dosis en la UI | Está en `GameState`; exportada por `engine`; la UI **no la lee** en ningún sitio | — | **D1** (forma) |
| Dosis por opción | `queEsSi` ya proyecta la dosis a 2 turnos y coincide con el resultado real | Que 2 turnos basten para que el niño entienda | **D8** |
| Iris/Crew | Spoiler visto en turno 0 (captura); 3 filtraciones en código | Que corregir `lugares.ts:38` obligue a cambiar una e2e (sí, B lo afirma) | **D7** |
| Equilibrio | Refugio 37/40; escudo 16/40; aguantar 5/40; refugio solo pierde sin generación | Que el ×19,4 sobreestime la tormenta real (DeepSeek) | **D9** |
| Multimisión | El reductor aplica Jezero a todo; solo Jezero tiene límite de dosis | — | **D10** |
| Plazo | No se muestra; la telemetría solo se envía desde el turno 3 | — | **D11** |
| Codex | No disponible | — | Reintentar cuando funcione |

## 5. Validación técnica del dosímetro

**¿Se puede mostrar sin modificar contratos?** **Sí (hecho).**
- Valor: `dosisMaximaTripulacion(estado)` (`engine/src/radiacion.ts`; `engine/src/index.ts` ya hace `export * from "./radiacion.js"`).
- Límite: `mision.limiteDosisMSv` (opcional; **solo Jezero lo define**, valor 4).
- `GameState.tripulacion[].dosisMSv` ya está en `contracts/src/game-state.ts:25`. Cero cambios en `contracts/`.
- La UI hoy **no lee** `dosisMSv` ni `dosisMaxima` en ningún archivo (`git grep` en `ui/`: 0 resultados).

**Riesgos técnicos verificados:**
1. Una misión sin `limiteDosisMSv` rompe un dosímetro ingenuo (`valor/límite` = NaN/Infinity). Debe aceptar `limite?` y, sin límite, mostrar solo el valor o no mostrarse.
2. La dosis se acumula en las 5 misiones, pero solo Jezero tiene límite: en la Luna se acumulan varios mSv sin medidor ni consecuencia (DeepSeek; coherente con `REFERENCIA_FONDO_DOSIS`).
3. Hoy la UI recibe la misión por imports directos de `MISION_JEZERO` en ≥ 9 archivos; el dosímetro debe recibir `mision` por props.

**¿Enseña el concepto de radiación?** **No, en la forma propuesta (A/F N1). Cambios recomendados, ordenados por efecto:**
1. **Mostrar la tasa, no solo el acumulado.** Tras refugiarse, el acumulado sigue subiendo; un niño de 7 años concluye que "no sirvió". Hace falta "+0,4 este turno" frente a "+1,4".
2. **Mostrar la dosis proyectada por opción en el panel "Compare your plan".** Hoy ese panel muestra energía, soporte y blindaje, pero **no la única magnitud que puede hacer perder**. **Verificado por mí en el motor:** con la partida dorada en el turno 3, `queEsSi(estado, accion)` ya devuelve `refugio 2,20 / escudo 2,70 / aguantar 4,24`, y esos valores **coinciden exactamente** con el resultado real tras dos turnos. **No hace falta función nueva en el motor ni tocar reglas.** Limitación: la proyección es a 2 turnos (`RETRASO_POR_DIFICULTAD.max`), no a toda la tormenta.
3. **Aparecer de forma incondicional al llegar la tormenta**, no solo si el niño habla con la Doctora (lugar opcional): hoy se puede perder por dosis sin haberlo visto.
4. **Un decimal como máximo** (o pasos visuales) para 7–8 años.
5. **Mostrar la dosis alcanzada en el final** (`resumen.ts` no la incluye).

**¿Es honesto el "4 mSv"?** Solo a medias. Hechos: es un valor de juego (lo dice el código); la causa de derrota no dice el número; "presupuesto" sugiere administrarlo, y el niño no puede. Recomendación (para aprobar): llamarlo **"límite de entrenamiento"**, decir que **no es la línea de peligro real**, y no citar una referencia de carrera sin tarjeta de datos (`bloquea:datos`). **Hipótesis de DeepSeek, sin verificar:** aplicar el factor 19,4 (pico/fondo en horas) a turnos enteros infla la dosis de la tormenta; lo correcto sería decir "durante unas horas". Requiere al rol de datos.

**Calibración (hecho medido):** con blindaje ~57, cada turno expuesto suma ≈1,36 mSv; tres turnos ≈ 4,1. El límite 4 hace que el resultado sea casi un **interruptor** (2 turnos protegidos ganan, 3 expuestos pierden). Una dosis continua que enseñe gradación necesitaría resultados intermedios; con las reglas actuales, no los hay. No propongo cambiarlas.

## 6. Validación del Momento D

**Veredicto: el concepto es válido, mi especificación era incorrecta en tres puntos.**

1. **"Start the clock" ya existe** (`ui.paso.4.listo`, `PantallaModulos.tsx:193-207`) y es el botón que da el niño. Añadir una segunda pausa en `base` duplicaría esa barrera (hecho, B). **Corrección:** poner la alerta y el diálogo de la tripulación **dentro de la fase `modulos`**, donde el reloj ya está parado, y hacer que "Start the clock" sea el cierre natural. Alternativa mínima (B): iniciar `base` con `pausar(estado,true)` y derivar el CTA de `pausado && tick===0`, **no** de un flag de React, para que sobreviva a "Continue" (el guardado conserva `pausado`).
2. **El aviso debe ir antes de elegir módulos** (resuelve E14). Si va después, el niño construye a ciegas y D pierde su razón.
3. **El círculo debe acortarse.** 11 intervenciones consecutivas (≈33 s de guion) rompen mi regla "una idea por intervención" justo en el pico de ansiedad (DeepSeek). Recomendación: tres líneas de la Meteoróloga, una de la Doctora (con el dosímetro), una de la Ingeniera; Iris casi muda.

**Dependencias verificadas:** el aviso de P0.4 (`pronostico.viene`) **solo existe en #449** (no en `develop`). La insistencia de Iris ~20 s **no puede usar `ticksSinAccion`** (no avanza con el reloj parado y en Jezero la rama adaptativa ni se ejecuta): hace falta un temporizador de interfaz.

**Qué rompería (B):** `tests/e2e/ruta-dorada.spec.ts:141`, `derrota-repetir-continuar.spec.ts:44,157`, `tests/capturas/capturar.mjs:128`, `movimiento.mjs:86`. Hay que actualizarlos en el mismo PR. `reductor.test.ts` y `guardado.test.ts` toleran la pausa.

**Hueco nuevo que mi diseño no cubría (DeepSeek, verificado en código):** **la ventana después de la tormenta.** La telemetría no puede enviarse antes del turno 3; tras "Decision recorded" el reloj vuelve a 4 s/turno, el niño debe caminar hasta la mesa y confirmar antes del turno 10, y **el plazo no se muestra en ninguna parte**. Se puede perder por plazo sin saber que había plazo. Esto es tan importante como D y no estaba en mi plan.

## 7. Diagnóstico de Iris

| Hecho | Detalle | Evidencia |
|---|---|---|
| Iris está dañada desde el turno 0 en el motor | `iaInicial: "danada"` | `engine/src/dorada.ts:36` |
| Se revela en la práctica al llegar la tormenta | `pasoDeLaBase` solo da 4, 7 u 8; `averiaIrisRevelada` exige ≥ 6 | `lugares.ts:58-70` |
| **Filtración 1 (confirmada en navegador)** | El panel Crew dice "Iris is damaged by radiation" en el turno 0 | `PantallaBase.tsx:438`; captura `evidencia-crew-iris-turno0.png` (prueba `Turn 0`) |
| Filtración 2 (código) | El taller ofrece "Repair Iris" (⚡−10 🫁−4) desde el turno 0; una e2e depende de ello | `lugares.ts:35-40` (el propio comentario lo admite) |
| Filtración 3 (código) | Las respuestas de Iris en la tormenta llevan "may be giving bad advice" antes de revelar | `PantallaTormenta.tsx:124` |
| Iris nunca da un número comprobable antes de fallar | `lecturaIris` existe pero no se usa en producción | `agents/src/iris.ts:68`, `git grep` |
| La lección de verificar es opcional y casi inofensiva | La falla solo sale si el niño le pregunta a Iris; su propuesta peligrosa es `redistribuir_energia` hacia soporte vital (no toca el blindaje); además pide confirmación con costos | `conversar.ts`, `iris.ts:103`, `costoDe` |
| `dialogosDelPaso` no se usa | Código muerto en la UI | `git grep` → 0 |
| `PreguntaDeIris` nunca aparece en Jezero | Solo en nivel "pistas" y Jezero arranca "danada" | `iris-pregunta.ts:40` |

**Lectura (hipótesis razonada):** el niño aprende "Iris está rota" (un hecho), no "verifica los números" (un hábito); y como obedecer a Iris no tiene consecuencia observable, la señal de dominio que definí en D §1 no puede medirse. **P5d (H) debe medirse antes de escribir el guion**, no después. **Qué haría falta:** corregir las tres filtraciones (la del taller toca una e2e); crear la rama de lectura cierta (no "corregir" un flujo); decidir si Iris debe tener una consecuencia observable cuando se la obedece; corregir el texto `accion_peligrosa`.

## 8. Resultados del barrido de equilibrio

**Método (reproducible):** `barrido-entrega0.test.ts.txt` (para copiar a `engine/src/` en un árbol de `origin/feat/agentes-p04-aviso-tormenta`; el árbol usado tiene P0.1–P0.6 completos). 4 sitios × 10 parejas de módulos × 4 decisiones (refugio y apagar invernadero, subir escudo nivel 2, aguantar, no decidir) × telemetría enviada en los turnos 3, 4, 5 y 6 = **640 corridas**, solo con la API pública del motor. Salida: `barrido-entrega0.csv`. Un segundo barrido independiente de DeepSeek (120 corridas, telemetría fija) **coincide**.

**Victorias (telemetría en el turno 3, 40 corridas por opción):**

| Opción | Victorias | Cómo pierde |
|---|---|---|
| Refugio y apagar invernadero | **37/40** | 3 derrotas, todas con `invernadero+antena` (sin generación): **energía a 0**, con dosis baja (2,2–2,4) |
| Subir escudo nivel 2 | 16/40 | Todas las derrotas por **energía a 0**: el escudo solo es viable con `panel_solar` |
| Aguantar | 5/40 | Por dosis; las 5 victorias con dosis 3,7–3,9 (al borde) y solo en los dos sitios con más refugio natural |
| No decidir | 5/40 | Igual que aguantar |

**Con las cuatro latencias de telemetría (640 corridas):** refugio 113/160, escudo 58/160, aguantar y no decidir 10/160. Enviar tarde cuesta: telemetría en turno 3 → 63/160 victorias globales; en turno 6 → 26/160.

**¿Hay estrategia dominante? Sí: el refugio.** Datos:
- **Escenarios donde el escudo gana y el refugio pierde: 0 de 160.** Escenarios donde el refugio gana y el escudo pierde: 55. Ambos ganan: 58.
- En los 58 donde ambos ganan, el refugio es mejor en casi todo: **dosis media 2,52 vs 3,04; energía final media 20,9 vs 8,5**. El escudo solo deja **más blindaje** (49,3 vs 41,3).
- **El costo del refugio ("apagar el invernadero", −10 soporte vital) nunca decide el resultado:** el soporte vital final con invernadero oscila entre 47 y 57 y nunca llega a cero.
- El escudo nunca es la mejor elección si hay una alternativa mejor: no existe ningún par de módulos ni sitio donde le convenga.
- "Aguantar" (nadie la defiende en el dilema) gana por margen mínimo y en condiciones concretas: no es una estrategia real, es una trampa.

**Qué decide de verdad el resultado:** **haber construido un panel solar** (energía), no la radiación. Los pares con `panel_solar` ganan 28–35 de 64; los que no, 2–17 de 64. La lección que se aprende hoy es "construye un panel y refúgiate".

**Información que recibe el jugador antes de decidir** (hecho, código): el panel "Compare your plan" muestra costo inmediato y beneficio retrasado de energía, soporte y blindaje; **no muestra el efecto sobre la dosis**, que es lo que decide el resultado. Un niño no puede deducir que el refugio domina. Tampoco sabe que el escudo falla sin energía hasta que le pasa.

**Conclusión sin maquillaje:** con las reglas actuales **el dilema del paso 6 no es un dilema equilibrado**; es una pregunta con una respuesta correcta (refugio) y una trampa. El test del repo pasa porque solo exige "cada opción gana alguna vez". **No lo suavizo ni lo "arreglo" aquí:** cambiar balance es decisión de diseño y motor (Camilo y Jaime), con aprobación tuya. Presento palancas medibles en la decisión D9.

**Limitaciones de la muestra:** un solo ordenamiento de módulos; telemetría siempre enviada tras la tormenta (nunca se probó "no enviar"); una sola semilla (la dorada) y dificultad media; sin eventos de mala suerte aleatorios (la semilla dorada no los tiene en este tramo); sin la variante de apagar invernadero separada; sin acciones adicionales en la tormenta (reparar a Iris, esperar, salir al exterior). **Lo que no puedo afirmar:** que el refugio sea dominante con mala suerte aleatoria o con otras dificultades.

## 9. Mapa de integración P0 (solo planificación)

Estado verificado el 18 nov. **No se ejecutó nada.**

| PR | Estado | Base | SHA cabeza | Merge | Archivos |
|---|---|---|---|---|---|
| #443 P0.1 | **Fusionado** 17 nov | develop | `24b8ef0` | `d6389b2` | `design/src/recursos.ts`, `engine/src/{acciones,index,radiacion}.ts`, `radiacion.test.ts` |
| #444 P0.2 | **Fusionado** | develop | `ce73b4f` | `2a9976b` | `design/i18n/{en,es}.json`, `engine/src/acciones.ts`, `limite-radiacion.test.ts`, `missions/src/jezero.ts` |
| #445 P0.3+P0.6 | **Fusionado** | develop | `f6fec16` | `cf48c72` (= `origin/develop`) | `design/src/recursos.ts`, `acciones.ts`, `radiacion.ts`, `jezero-victoria.test.ts`, `misiones-reales.test.ts`, `missions/src/jezero.ts` |
| #450 P0.5 | Fusionado **en la rama de #449**, no en develop | `feat/agentes-p04-aviso-tormenta` | `a1e9d8c` | `4a949ad` | `agents/{i18n,src/{conversar,iris,iris-mision.test},package.json,tsconfig.json}`, `package-lock.json` |
| **#449 P0.4 (+#450)** | **Abierto**, limpio, CI verde | develop | `4a949ad` (commits `e26a1bb`, `a1e9d8c`, merge `4a949ad`) | — | `agents/*` (incl. `expertos.ts`, `iris-acompana.ts`), `package-lock.json` |
| **#454 QA-445** | **Abierto**, limpio, CI verde | develop | `798cd95` | — | `design/i18n/*`, `engine/src/resumen.ts`, `resumen-causa-terminal.test.ts`, `ui/i18n/*`, `PantallaFinal.tsx`, `final-causa-terminal.test.tsx` |

**Dependencias entre commits (B):** #449 y #454 **no se tocan entre sí** (sin archivos en común; `merge-tree` limpio en los dos órdenes y contra `develop`). #449 depende de `develop` solo por el tipo `Mision.averiaIris` (ya en develop). #449 añade la dependencia workspace `@solar-shield/missions` en `agents/` (cambia el lockfile → `npm ci` limpio antes de probar). `ResumenPartida.causaTerminal` es un campo nuevo obligatorio; solo `PantallaFinal` lo consume.

**Conflictos conocidos (B, no verificados por mí):** la rama experimental choca con `develop` en 6 archivos de UI (`ui/i18n/{en,es}.json`, `App.tsx`, `PantallaBase.tsx`, `PantallaFinal.tsx`, `final.css`), por #420 y #430, **no por P0**. `feat/ui-escenarios` choca con `develop` en 3 archivos y tiene 117 commits que `develop` no tiene.

**Orden recomendado (hipótesis razonada de B, que comparto):**
1. **#454 primero.** Toca `engine` y `ui` mínimamente, es un solo commit, y es la dependencia dura de la pista de reintento (entrega 6).
2. **#449** (ya incluye #450; **no** fusionar #450 aparte). Es autocontenido en `agents/`; el único efecto transversal es el lockfile.
3. Entregas de G (UI) sobre `develop` ya actualizado.
4. La rama experimental y la pila #410–#415 al final, con sus 6 conflictos ya conocidos.

**Pruebas tras cada integración** (comandos del `package.json` raíz):
- Tras #454: `npm ci && npm run typecheck && npx vitest run engine/src/resumen-causa-terminal.test.ts ui/src/pantallas/final-causa-terminal.test.tsx && npm test`; luego `npm run e2e -- tests/e2e/derrota-repetir-continuar.spec.ts`.
- Tras #449: `npm ci` (el lockfile cambió), `npm run typecheck`, `npx vitest run agents/src/aviso-tormenta.test.ts agents/src/iris-mision.test.ts agents/src/conversar.test.ts`, `npm test`; luego `ruta-dorada.spec.ts`.
- Tras ambos: `npm test`, `npm run typecheck` y `npm run e2e -- --workers=1` completos (igual que la CI).

**Criterios de "pila integrada y estable":** `origin/develop` contiene `4a949ad` y `798cd95` (o sus equivalentes por squash); typecheck verde; `npm test` completo verde (incluidos `jezero-victoria.test.ts`, `iris-mision.test.ts`, `resumen-causa-terminal.test.ts`); e2e completo verde con `--workers=1`; la ruta dorada gana por la ruta protegida y pierde pasiva; la pantalla final de una derrota por dosis muestra "The crew took too much radiation…". **Nota:** si se hace squash de #449, P0.4 y P0.5 quedan en un solo commit; decidirlo antes de fusionar.

## 10. Riesgos y dependencias

1. **Dependencia dura:** #449 (aviso de la Meteoróloga y lectura de Iris) y #454 (causa terminal) antes de cualquier entrega que las use.
2. **Alcance multimisión (hecho):** el reductor aplica Jezero a todo y solo Jezero tiene límite de dosis. Prometer "reutilizable" sin parametrizar el reductor y `PantallaTormenta` no se cumple.
3. **Pantalla de tormenta cableada a Jezero:** `OPCIONES = MISION_JEZERO.dilemaPaso6.opciones` a nivel de módulo; Luna visible tiene cuatro opciones (DeepSeek).
4. **El dilema no es genuino** (sección 8); construir un dosímetro y un guion sobre él enseña "elige refugio".
5. **Tres spoilers de Iris** que pertenecen a la interfaz de María Paula; uno obliga a cambiar una e2e.
6. **e2e y capturas** deben actualizarse en el mismo PR que cualquier cambio de reloj.
7. **Codex no disponible:** la validación visual y de flujos con Playwright que prevé H sigue pendiente; la hice solo para el spoiler de Crew.
8. **Hipótesis física sin verificar:** posible sobreestimación de la tormenta (×19,4 aplicado a turnos enteros).
9. **Estado de María Paula:** solo conozco `ui/ESTADO.md`; cualquier cambio de pantalla debe consultarse con ella antes.

## 11. Plan de implementación por fases (propuesta; nada autorizado)

Reemplaza el orden de G con lo aprendido. Entregas pequeñas, cada una verificable.

| Fase | Contenido | Depende de | Dueño sugerido |
|---|---|---|---|
| **0 (ya)** | Esta revisión; decisiones D1–D11 | — | Santiago |
| **1** | Fusionar #454 y luego #449 | D5 | Jaime / Santiago |
| **2** | Cerrar las tres filtraciones de Iris (incluye adaptar la e2e "seguir a Iris") | 1 | Paula |
| **3** | Aviso de la Meteoróloga **antes de los módulos**, dentro de `modulos`; "Start the clock" como cierre; base iniciada con CTA derivado del estado; actualizar e2e y capturas | 1, D2 | Paula + José |
| **4** | Dosímetro con tasa y visible desde que llega la tormenta; sin límite → solo valor | 1, D1, D10 | Paula |
| **5** | Dosis proyectada por opción en "Compare your plan" usando `queEsSi` (sin tocar el motor) | 4, D8 | Paula + José |
| **6** | Ventana post-tormenta: objetivo "Send telemetry" en el HUD y plazo visible | D11 | Paula |
| **7** | Decisión sobre el dilema (D9): medir con la rejilla completa; solo después, si se aprueba, ajustar | D9 | Camilo + Jaime |
| **8** | Lectura cierta de Iris (rama nueva) y consecuencia observable de obedecerla | 2, 7 | José |
| **9** | Pista de reintento, dosis en el final, guion EN y luego ES | 1, 7 | José + Paula |
| **10** | QA Playwright con los 6 perfiles (cuando Codex funcione, o por quien se designe) | 3–9 | Codex u otro |

## 12. Criterios de aceptación verificables

Cada criterio se comprueba con una acción concreta; ninguno depende de opinión.

1. **Integración P0:** `git merge-base --is-ancestor 4a949ad origin/develop` y `798cd95` devuelven éxito; typecheck, `npm test` y e2e (`--workers=1`) en verde.
2. **Iris sin filtraciones:** en el turno 0, ni el panel Crew, ni el taller, ni la respuesta de Iris en la tormenta contienen "damaged", "Repair Iris" o "bad advice" **antes** de la revelación; después de la revelación, sí. Prueba e2e con captura.
3. **Aviso antes de los módulos:** en `modulos`, antes de colocar el primer módulo, aparece el diálogo de la Meteoróloga con fuente (`prioridad alerta`); el estado del motor no cambia.
4. **Reloj:** tras "Start the clock" el turno sigue en 0 hasta el primer intervalo de 4 s (si se adopta base pausada, el CTA existe también tras "Continue" de una partida guardada).
5. **Dosímetro:** el valor del DOM coincide con `dosisMaximaTripulacion` en cada turno; muestra la tasa del turno; aparece al llegar la tormenta aunque no se hable con la Doctora; sin `limiteDosisMSv` no produce NaN ni barra.
6. **Proyección por opción:** el valor mostrado para cada opción coincide con `dosisMaximaTripulacion(queEsSi(estado, accion))`; y con el resultado real tras 2 turnos (ya verificado en una corrida, a repetir en la prueba).
7. **Dilema:** un informe (CSV) con la rejilla completa y recuentos; criterio a fijar por Santiago (por ejemplo, ninguna opción gana en más del X % ni pierde en ninguna combinación razonable). **Hoy no se cumple.**
8. **Plazo:** el turno límite y el turno de llegada de la respuesta son visibles; el HUD cambia el objetivo a "Send telemetry" al llegar la tormenta.
9. **Final:** una derrota muestra la causa exacta, la dosis alcanzada (si la hubo) y **una pista accionable** (que el niño pueda ejecutar con el reloj corriendo).
10. **Multimisión:** ninguna pieza nueva importa `MISION_JEZERO`; una misión sin `limiteDosisMSv` y una con cuatro opciones de dilema no rompen.
11. **i18n:** ninguna cadena visible fuera de i18n; EN completo antes que ES; paridad de claves.
12. **Honestidad científica:** cada cifra de NASA con fuente, fecha y "curated, not live"; el límite se llama "límite de entrenamiento" y no sugiere que 4 mSv sea el umbral de peligro.

## Decisiones que necesito de Santiago (aprobar o rechazar cada una)

D1–D4 y D6 ya tenían aprobación conceptual; D5 sigue abierta. Las nuevas surgen de las auditorías.

| # | Decisión | Recomendación | Consecuencia si no |
|---|---|---|---|
| **D5** | Orden de integración | **#454 → #449 (sin fusionar #450 aparte)** → UI. Decidir si #449 se hace squash | Cualquier fase UI se bloquea |
| **D2'** | Momento D corregido: aviso **antes de los módulos**, dentro de `modulos`, y no añadir una segunda pausa; círculo recortado | Sí | El aprendizaje de "preparar" no existe |
| **D7** | Cerrar las tres filtraciones de Iris (toca una e2e) | Sí, antes del resto | El niño aprende "Iris está rota", no "verifica" |
| **D8** | Mostrar dosis **proyectada por opción** con `queEsSi` (sin tocar el motor) y la **tasa** en el dosímetro | Sí | El dosímetro no informa la decisión |
| **D9** | **Equilibrio del dilema.** El refugio domina (37/40) | **Primero decidir la intención:** (a) aceptar "refugio es la respuesta correcta de un tutorial" y reformular el brief y el texto; o (b) pedir a Camilo/Jaime palancas de balance (costo real del refugio, utilidad del escudo, "aguantar" como opción con sentido), con rejilla completa y aprobación tuya. **Yo no cambio números.** Mi voto: (b) | El criterio "decisiones sin respuesta obvia" del brief no se cumple |
| **D10** | **Multimisión:** parametrizar `mision` en el reductor y `PantallaTormenta`, o declarar Jezero como tutorial y las otras cuatro sin dosis ni aviso | Parametrizar; si no, decirlo explícitamente | Se promete reutilización y se cablea Jezero |
| **D11** | **Ventana post-tormenta y plazo visible** | Sí; es tan importante como el Momento D | Se puede perder por plazo sin saber que había plazo |
| **D12** | Texto del límite: "límite de entrenamiento", no "presupuesto"; dosis en el final; verificar con datos si el ×19,4 se aplicó a turnos enteros | Sí | Se enseña un límite falso como real |
| **D13** | Reintentar la validación con **Codex** cuando su host funcione, o designar a otra persona/agente | Reintentar | La QA visual queda en mi prueba aislada |

## Estado de cierre

Auditorías consolidadas; incertidumbres anotadas; equilibrio medido (y no es equilibrado); integración P0 con orden justificable; decisiones presentadas. **Me detengo aquí.** No implemento, no fusiono, no avanzo a ninguna fase. Espero tu aprobación o rechazo punto por punto.

---

# Cierre de la Entrega 0 — actualización 2

**Fecha:** 18 nov 2026 · **Estado:** diseño consolidado para aprobación final. **Implementación NO autorizada.** Sin cambios de código, de `ui/`, `assets/`, `missions/`, `contracts/`, ramas, PR ni commits; sin cambios de balance; sin P0.7 ni P1.

## A. Registro de cambios de esta actualización

| Qué | Dónde |
|---|---|
| Especificación v2 (aviso antes de módulos, reloj existente, revelación progresiva de Iris, tres filtraciones, tasa y dosis proyectada estimada, plazo visible, "límite de entrenamiento", cinco misiones independientes) | `SPEC_V2_JEZERO.md` |
| Rediseño conceptual del dilema, con segunda tanda de mediciones (momento de actuar y combinaciones) | `DILEMA_TORMENTA_V2.md`, `barrido-tiempos-entrega0.csv` y `.test.ts.txt` |
| Plan de QA con regla de independencia, casos reproducibles y línea base | `PLAN_QA_INDEPENDIENTE.md` |
| Auditoría de integración completada con `merge-tree` (sección B) | este documento |
| **Documentos A–H originales** | **Intactos.** `SPEC_V2` y `PLAN_QA_INDEPENDIENTE` indican qué superan |

**Correcciones a lo que dije en la primera versión de esta revisión:**
- En §9 dije que no había verificado por mi cuenta los conflictos de `merge-tree`. **Ahora sí los verifiqué** para #449, #454 y el estado actual de `develop` (sección B). Sigue **sin verificarse** el resto de la matriz de conflictos de B (`feat/ui-escenarios`, #441, #442, #446–#452).
- En §6 dije que la pausa de base era una opción de implementación. **La v2 la descarta como recomendación**: "Start the clock" existe y alcanza.
- En §8 dije que el escudo "solo deja más blindaje". La segunda tanda de mediciones muestra además que **donde es viable, supera al refugio en salud final de la base (12 de 12)** y que **la combinación escudo + refugio logra la menor dosis**. El refugio sigue dominando la supervivencia; esto matiza que el escudo no está dominado en todas las métricas (`DILEMA_TORMENTA_V2.md` §1).

## B. Auditoría de integración P0 (completada; solo lectura)

Estado el 18 nov: `origin/develop` = `cf48c72`; #449 = `4a949ad`; #454 = `798cd95`. **No se cambió ninguna base, rama ni PR.**

### B.1 Qué commits contiene cada PR (verificado con `gh`)
| PR | Estado | Base | Commits |
|---|---|---|---|
| #443 | Fusionado | develop | `24b8ef0` P0.1 |
| #444 | Fusionado | develop | `ce73b4f` P0.2 |
| #445 | Fusionado | develop | `f6fec16` P0.3+P0.6 |
| #450 | Fusionado **en la rama de #449** | `feat/agentes-p04-aviso-tormenta` | `a1e9d8c` P0.5 |
| #449 | **Abierto** | develop | `e26a1bb` P0.4 · `a1e9d8c` P0.5 · `4a949ad` (merge de #450) |
| #454 | **Abierto** | develop | `798cd95` QA-445 |

Relaciones: #450 está **dentro** de #449 (no se fusiona aparte). #443–#445 ya son ancestros de `origin/develop` (`24b8ef0`, `ce73b4f`, `f6fec16`). #449 y #454 **no tienen archivos en común** (`comm -12` vacío).

### B.2 Comprobaciones `merge-tree` ejecutadas (sin tocar el árbol de trabajo)
| Combinación | Resultado |
|---|---|
| merge-base #449↔develop | `f6fec16` (la rama parte del último commit de #445, no del merge) |
| merge-base #454↔develop | `cf48c72` (parte del `develop` actual) |
| develop + #449 | **Limpio** (árbol `e7fa39f`) |
| develop + #454 | **Limpio** |
| #449 + #454 | **Limpio** (árbol `1f80e6c`) |
| develop + #454, luego + #449 (secuencial) | **Limpio** |
| develop + #449, luego + #454 (secuencial) | **Limpio** |
| **develop + #410** | **CONFLICTO** en `ui/src/App.tsx` y `ui/src/pantallas/PantallaBase.tsx` |
| #449 + #410 · #454 + #410 · (develop + #449 + #454) + #410 | **CONFLICTO en los mismos 2 archivos**: P0 **no añade** conflictos nuevos |

**Causa del conflicto de #410 (HECHO):** el merge-base de #410 es `cefd3ab`; desde entonces `develop` incorporó #417 (Iris no se delata), #419 (datos NASA en pantalla), #420 (login) y #430 (portada/menú) sobre `App.tsx` y `PantallaBase.tsx`. **No depende de P0.**

**CI (HECHO):** #449 y #454 con `Tipos y tests`, `E2E ruta dorada` y `GitGuardian` en verde.

### B.3 Hallazgo que cambia D5: la parametrización multimisión ya existe en otra pila
- **#410** ("UI multi-misión 1/6", Frente E, Santiago): el reductor guarda `misionId` y se lo pasa al motor; las pantallas leen `misionActiva()` (variable de módulo que `App` fija en cada render; el PR dice "Atajo a revisar"). Es **exactamente lo que D10 necesita**.
- Estado: **abierto, base `develop`, `CONFLICTING`**. Toca `App.tsx`, `reductor.ts`, `PantallaBase.tsx`, `PantallaFinal.tsx`, `PantallaModulos.tsx`, `PantallaTormenta.tsx`, `lugares.ts` (los **mismos** archivos que tocan las fases 2–6 de la v2).
- #411–#415 están apilados sobre #410 (`MERGEABLE/CLEAN` cada uno contra el anterior): mundo por misión, selector, tarjeta guía, radio, extras. **No son necesarios** para la v2; solo #410.
- **#410 conserva las tres filtraciones de Iris** (verificado en su árbol: `PantallaBase` línea 421 `ui.iris.estado.${estado.iaBase}` y `lugares.ts` línea 38 `iaBase === "danada"`).
- **#432** (`feat/frente-f-entrar-base`, base `feat/frente-f-pasillo`) toca `PantallaModulos.tsx`; está en otra pila (frente F).

### B.4 Orden de integración recomendado (con evidencia)
1. **#454.** Un solo commit, independiente, limpio, CI verde. Habilita la dosis alcanzada y la pista de reintento en el final.
2. **#449 (con #450 dentro).** Limpio contra develop y contra #454 **en ambos órdenes** (verificado): el orden 1↔2 es indiferente para el contenido; elijo #454 primero porque es la más pequeña y toca `engine`. Cambia el lockfile → `npm ci` limpio antes de probar. Habilita el aviso de la Meteoróloga (fase 3).
3. **#410 sola** (sin #411–#415), rebasada sobre `develop` actualizado, resolviendo los 2 conflictos de UI. **Antes de las fases de UI de la v2**, porque (a) las piezas v2 deben leer `mision` (condición D10) y #410 ya lo implementa, (b) toca los mismos 7 archivos: si las fases de UI van primero, **cada una chocará con #410**; si #410 va primero, solo hay que adaptarse una vez. Dueño sugerido: Santiago (Frente E).
4. **Fases de UI de la v2** (SPEC_V2 §9, fases 2–6).
5. **#411–#415 y la rama experimental**, al final y **solo si Santiago decide** que forman parte del producto (no son necesarias para la v2).

**Alternativa evaluada y descartada:** hacer las fases de UI antes de #410. Funciona técnicamente, pero duplica la resolución de conflictos y deja a las piezas nuevas cableadas a `MISION_JEZERO` (viola D10).

### B.5 Método de fusión (decisión pendiente)
- #443–#445 entraron con **commits de merge** ("Merge pull request #…") en `origin/develop`.
- #449 trae **un merge commit interno** (`4a949ad`, el de #450). Con *squash*, P0.4 y P0.5 quedan en **un solo commit**; con *merge commit*, se conservan los tres. La elección es de Santiago; la integración es limpia con cualquiera.

### B.6 Pruebas tras cada paso
- Tras #454: `npm ci && npm run typecheck && npx vitest run engine/src/resumen-causa-terminal.test.ts ui/src/pantallas/final-causa-terminal.test.tsx && npm test` y `npm run e2e -- tests/e2e/derrota-repetir-continuar.spec.ts`.
- Tras #449: `npm ci`, `npm run typecheck`, `npx vitest run agents/src/aviso-tormenta.test.ts agents/src/iris-mision.test.ts agents/src/conversar.test.ts`, `npm test`, luego `ruta-dorada.spec.ts`.
- Tras #410 rebasada: `npm run typecheck`, `npm test` completo (incluye `humo-misiones.test.ts`), e2e completo con `--workers=1`, y juego de las 5 misiones por el reductor.
- Tras cada paso: `git merge-base --is-ancestor <sha> origin/develop`.

### B.7 Criterios de "pila integrada y estable"
`origin/develop` contiene `798cd95` y `4a949ad` (o sus equivalentes por squash); #410 en `develop` sin conflictos pendientes; typecheck verde; `npm test` completo verde; e2e completo (`--workers=1`) verde; la ruta dorada gana con refugio y pierde pasiva; una derrota por dosis muestra "The crew took too much radiation…" y la causa terminal; `git grep MISION_JEZERO` en `ui/src/pantallas` y `ui/src/App.tsx` ya no depende de Jezero fijo.

## C. Lo que sigue sin verificar (y por qué)

| Pendiente | Por qué sigue abierto |
|---|---|
| Matriz de conflictos de `feat/ui-escenarios`, #441, #442, #446–#452 (de B) | Solo la verificó el agente de arquitectura |
| Qué pasa al resolver los 2 conflictos de #410 | No se intentó (sería rebase) |
| Proyección con otras semillas y con mala suerte (`ENG-PROY-3`, `ENG-AZAR-1`) | No medido |
| Causa terminal de "no enviar telemetría" (`ENG-FIN-1`); H D3 afirmaba "plazo" sin medirlo | No medido |
| Consecuencia real de obedecer a Iris (`ENG-IRIS-1`) | No medido |
| Si el ×19,4 sobreestima la tormenta real | Hipótesis de DeepSeek; requiere al rol de datos |
| Repetir refugio (`refugio@3+refugio@5` 17/24): causa | No analizada |
| Validación pedagógica real con niños | No sustituible por simulación |
| QA con Codex | **No disponible** |

## D. Decisiones por estado

**Nota:** Santiago indicó que D2', D7, D8, D9, D10, D11, D12 y D13 están aprobadas conceptualmente "con las condiciones establecidas en sus decisiones". **El texto de esas condiciones no me fue transmitido**; aquí registro como condiciones **las que sí constan en sus instrucciones** (no cambiar valores numéricos, no manipular resultados, no autorizar la implementación, cinco misiones independientes, Jezero recomendada). **Santiago debe confirmar o corregir esta columna.**

| ID | Decisión | Estado | Condiciones / observaciones |
|---|---|---|---|
| D1 | Dosímetro informativo, no un recurso | **Aprobado** | Ampliado por D8 (tasa y proyección). No es un recurso |
| D2' | Aviso meteorológico **antes** de elegir módulos; reutilizar el reloj existente | **Aprobado con condiciones** | Sin segunda pausa; implementación no autorizada. El texto `pronostico.preparar` se corrige aparte (D14) |
| D3 | El Matemático fuera de Jezero | **Aprobado** | La dosis proyectada **no** es el Matemático |
| D4 | Pasos 1–2 sin decisiones artificiales | **Aprobado** | — |
| **D5** | Orden de integración de P0 | **Pendiente** | Verificación técnica **completada** (§B); falta que Santiago elija orden y método. **Propuesta:** #454 → #449 → #410 sola → UI v2 |
| D6 | `NIVELES.md` = orden sugerido, sin desbloqueo | **Aprobado** | Jezero = introducción recomendada |
| D7 | Cerrar las tres filtraciones de Iris | **Aprobado con condiciones** | Tocan `PantallaBase`, `lugares.ts`, `PantallaTormenta` y obligan a adaptar la e2e "seguir a Iris". **No incluye** la "consecuencia observable de obedecer a Iris" (ver D16) |
| D8 | Tasa de radiación y dosis proyectada | **Aprobado con condiciones** | **Estimada**, con rótulo "Estimate for the next 2 turns", calculada con `queEsSi` ya existente; sin función nueva en el motor |
| D9 | Rediseño conceptual del dilema | **Aprobado con condiciones** | **Solo conceptual:** sin cambiar valores, sin ajustar resultados. Palanca 1 (información) alineada con D8. Palancas 2 y 3 → pendientes (D18) |
| D10 | Parametrizar por `mision` | **Aprobado con condiciones** | Depende de la posición de #410 (D17). Las piezas nuevas no importan `MISION_JEZERO` |
| D11 | Ventana post-tormenta y plazo visible | **Aprobado con condiciones** | Solo interfaz; valores ya existentes (`tickLimite`, `telemetriaPendiente`, `RETRASO_COMUNICACIONES`) |
| D12 | "Límite de entrenamiento"; dosis en el final | **Aprobado con condiciones** | Término único en todo el producto. Una referencia real de carrera exige tarjeta de datos (`bloquea:datos`); la hipótesis del ×19,4 sigue sin verificar |
| D13 | Reintentar con Codex | **Aprobado** | Mientras tanto rige la regla de independencia (`PLAN_QA_INDEPENDIENTE.md` §1) |
| D14 | Cambiar el contenido de `agentes.meteorologa.pronostico.preparar` (hoy recomienda el refugio) a una frase neutra | **Pendiente** | Es un cambio de contenido en agents (José), no de reglas |
| D15 | Alcance de la proyección: solo dosis, o también energía y blindaje | **Pendiente** | Mi recomendación: las tres, porque así el escudo muestra su ventaja y su costo |
| D16 | Consecuencia observable de obedecer a Iris dañada | **Pendiente** | Hoy obedecerla no tiene consecuencia que enseñe; primero medir (`ENG-IRIS-1`) |
| D17 | Posición de #410 en el orden de integración | **Pendiente** | Mi recomendación: antes de las fases de UI (§B.4). Dueño: Santiago |
| D18 | Palanca 2 (necesidad exterior durante la tormenta; requiere trabajo del motor) y Palanca 3 (valores) | **Pendiente** (palanca 3: **no autorizada**) | Se decide **después** de la palanca 1, con rejilla completa y métricas fijadas antes |
| D19 | Sesión con niños reales para validar aprendizaje | **Pendiente** | Única forma de validar la pedagogía |
| D20 | Método de fusión de #449 (squash o merge commit) | **Pendiente** | Parte de D5 |
| — | Implementación de cualquier fase | **No autorizada** | Esperando aprobación explícita |
| — | Cambios de balance | **No autorizados** | Fuera de alcance salvo aprobación escrita |
| — | P0.7, P1 | **No autorizados** | — |

**No aprobado:** ninguna decisión ha sido rechazada por Santiago. Lo marcado "no autorizado" es alcance excluido, no un rechazo.

## E. Bloqueos concretos que requieren decisión de Santiago

1. **D5 + D17 + D20 — orden y método de integración.** Propuesta: **#454 → #449 → #410 sola (rebasada) → fases de UI**. Falta que decidas el orden, si #410 va antes de la UI, y si #449 se fusiona por squash o con merge commit. **Sin esto no puede empezar ninguna fase.**
2. **Quién resuelve los 2 conflictos de #410** (`App.tsx`, `PantallaBase.tsx`) y cuándo. Es tu Frente E; yo no puedo rebasar. **Bloquea D10.**
3. **D14 — texto de `pronostico.preparar`.** ¿Autorizas pedir a José una frase neutra en #449? Hoy empuja al refugio, justo en el dilema que quieres hacer genuino.
4. **D15 — alcance de la proyección:** ¿solo dosis, o dosis + energía + blindaje?
5. **D16 — consecuencia de obedecer a Iris:** ¿lo medimos primero (`ENG-IRIS-1`, sin cambiar nada) y decides después?
6. **D18 — Palanca 2 del dilema** (hacer que la tormenta coincida con una necesidad exterior, p. ej. polvo o antena). Requiere **trabajo del motor** (no existe código que aplique `rendimientoPanel`). ¿La exploramos como propuesta, o te basta con la Palanca 1 y aceptar que Jezero tenga una respuesta segura bien explicada?
7. **Definición de éxito del dilema:** ¿apruebas los criterios C1–C5 de `DILEMA_TORMENTA_V2.md` §4, y en especial **declarar la métrica antes de medir** (supervivencia, salud final de la base, dosis, energía)?
8. **D19 — sesión con niños reales.** ¿Quién y cuándo? Sin esto, la eficacia pedagógica es una hipótesis.
9. **Quién ejecuta la QA independiente** mientras Codex no esté disponible (persona o agente que no haya escrito el cambio), o si esperamos a Codex.
10. **Confirmación de las condiciones:** que las condiciones que registré en la sección D coinciden con las tuyas.
11. **Verificación de datos** (rol de datos, `bloquea:datos`): si el ×19,4 se aplicó a turnos enteros y si se puede citar una referencia real para el "límite de entrenamiento".

## Estado de cierre
La entrega 0 queda **consolidada**: integración auditada con evidencia, equilibrio medido (y no equilibrado), identidades estratégicas definidas sin cambiar números, plan de QA con regla de independencia, y decisiones por estado. **Me detengo aquí.** No implemento, no fusiono, no rebaso, no cambio balance y no avanzo a la siguiente fase. Espero tu aprobación explícita.

---

# Actualización 3 — ejecución de las decisiones de Santiago

**Fecha:** 18 nov 2026 · **Estado:** diseño aprobado con condiciones. **Implementación NO autorizada.** En esta ronda **no** se modificó código de producto, `ui/`, `assets/`, `missions/` ni `contracts/`; no hubo commits, push, merges ni rebases; no se tocaron ramas ni PR; no se cambió ningún número de balance; no se inició P0.7, P1 ni el tutorial. **Lo único que salió del repositorio local son dos issues** (#455 y #456), pedidos por Santiago.

## A. Registro de cambios y correcciones propias

| Qué | Dónde |
|---|---|
| Adenda a la especificación: cuatro magnitudes (tasa, dosis proyectada, coste energético, protección del escudo) con su verificación | `SPEC_V2_ADENDA_3.md` (sustituye a `SPEC_V2_JEZERO.md` §4) |
| Propuesta de resolución de los conflictos de #410, para su propietario | `PROPUESTA_RESOLUCION_410.md` |
| Estudio de obediencia a Iris dañada | `ESTUDIO_OBEDIENCIA_IRIS.md` + `iris-obediencia-entrega0.test.ts.txt` |
| Escenarios de la Palanca 2 con eventos reales | `DILEMA_TORMENTA_V3_ESCENARIOS.md` + `escenarios-palanca2-entrega0.csv` y `.test.ts.txt` |
| Proyección frente a resultado real | `proyeccion-vs-real-entrega0.csv` y `.test.ts.txt` |
| Validación científica del ×19,4 y del límite | `VALIDACION_CIENTIFICA_RADIACION.md` |
| Protocolo de validación con niños (borrador, **sin sesión organizada**) | `PROTOCOLO_VALIDACION_NINOS.md` |
| Plan de QA con regla de independencia ampliada | `PLAN_QA_INDEPENDIENTE.md`, "Revisión 3" |
| Documentos A–H, `SPEC_V2_JEZERO.md`, `DILEMA_TORMENTA_V2.md` | **Intactos** |

**Errores míos que esta ronda corrige (se registran, no se ocultan):**
1. **"El factor ×19,4 es pico/fondo"** (afirmación mía y de varios documentos, incluida la sección 5 de la primera versión de esta revisión). **Es el cociente entre dos medias** (la media de las muestras del 20 may desde las 05:36 UTC y la media de los 5 días previos). El pico de una muestra es 304 µGy/h. Verificado en `data/scripts/curar.ts` y recalculado sobre `data/raw/2024-05/RAD.json`.
2. **"Con 'dos turnos' se proyecta la dosis"** (SPEC_V2 §4.2): el horizonte depende de la dificultad (fácil 1, media 2, difícil 3, hardcore 3).
3. **"La proyección de `queEsSi` sirve para energía, soporte y blindaje"** (implícito en SPEC_V2 §4.2 y en DILEMA V2): no coincide con el resultado real en el soporte vital (48/288, siempre −10, por el invernadero apagado) ni, con eventos de mala suerte, en energía y blindaje (9 y 4). Solo la **dosis** (287/288) y el **coste inmediato** (`costoDe`, 144/144) están respaldados.
4. **Escenarios con "3 casos"** de escudo ganando y refugio perdiendo (borrador de mi análisis): es **una sola situación** repetida en tres tormentas equivalentes. Corregido en `DILEMA_TORMENTA_V3_ESCENARIOS.md`.

## B. Integración P0 y Frente E (orden aprobado)

**Orden aprobado:** 1) #454 → 2) #449 (con #450, **merge commit**, trazabilidad) → 3) #410 como integración independiente → 4) fases de UI de Jezero v2.
**Nadie ejecuta merges todavía.** Esta sección documenta la comprobación previa.

### B.1 Verificación previa (18 nov, tras `git fetch`; sin tocar ramas)
| Comprobación | Resultado |
|---|---|
| `origin/develop` | `cf48c72` (incluye `24b8ef0`, `ce73b4f`, `f6fec16`) |
| #454 | Abierto, base `develop`, cabeza `798cd95`, `MERGEABLE/CLEAN`; `Tipos y tests`, `E2E ruta dorada` y `GitGuardian` en verde |
| #449 | Abierto, base `develop`, cabeza `4a949ad` (`e26a1bb`, `a1e9d8c` y el merge `4a949ad`), `MERGEABLE/CLEAN`; mismos tres checks en verde |
| #450 | Fusionado **dentro de la rama de #449** (`a1e9d8c`); no se fusiona aparte |
| `develop` contiene `4a949ad` / `798cd95` | **No** (esperado) |
| `merge-tree`: develop + #449 · develop + #454 · #449 + #454 | **Limpios los tres** (y en ambos órdenes secuenciales, comprobado en la ronda anterior) |
| #410 | Abierto, base `develop`, cabeza `834b055`, **`CONFLICTING/DIRTY`**, CI verde |

**Nota sobre una falsa alarma mía:** una primera pasada de esta ronda mostró "CONFLICTO" en las tres combinaciones; fue un **error de mi script** (`zsh` no divide una variable sin comillas y `merge-tree` recibía un solo argumento). Repetido con argumentos separados: los tres limpios.

### B.2 Conflictos de #410 (`App.tsx`, `PantallaBase.tsx`)
Identificados desde el árbol que escribe `merge-tree` (sin tocar ninguna rama): **3 hunks** (2 en `App.tsx`: imports y estado/guardado; 1 en `PantallaBase.tsx`: llamada a la conversación). **Causa:** #417, #419, #420 y #430 en `develop`, **no P0** (confirmado con `(develop + #449 + #454) + #410`: mismos dos archivos y solo ellos).
**Propuesta de resolución:** en `PROPUESTA_RESOLUCION_410.md` (hunk por hunk, con lo que hay que conservar de cada lado y los riesgos semánticos: `misionId` en el guardado de cuentas, `averiaRevelada` que no debe perderse, no duplicar el guardado local). **No se rebasó ni se modificó la rama.** **El propietario de #410 ejecuta la resolución; después la audita una persona o agente que no la haya resuelto** (lista de 9 comprobaciones en la propuesta).

### B.3 Criterio de integración estable (sin cambios respecto a B.7 de la actualización 2)
`origin/develop` contiene `798cd95` y `4a949ad`; #410 sin conflictos pendientes; typecheck, `npm test` y e2e (`--workers=1`) verdes; una derrota por dosis muestra su causa terminal; `git grep MISION_JEZERO` ya no cablea la partida a Jezero en las pantallas principales.

## C. Verificaciones completadas en esta ronda

| # | Qué se verificó | Resultado | Etiqueta |
|---|---|---|---|
| V1 | Pre-integración (SHA, PR limpios, CI, merge-tree) | Ver B.1 | Verificación del autor, reproducible con `gh`/`git` |
| V2 | Proyección con `queEsSi` vs resultado real | **Dosis 287/288**; soporte 48 distintos (−10 invernadero); energía 9 y blindaje 4 distintos (eventos aleatorios). `costoDe` energía **144/144**. `dosisDelTurno` ≠ incremento real hasta 0,04. Horizonte: fácil 1, media 2, difícil 3, hardcore 3 | AUT |
| V3 | Qué pasa al obedecer a Iris | La acción peligrosa **no es ejecutable** (0/64); creer la lectura falsa y no actuar **pierde** (4,19 y 4,71 mSv); corregir en el mismo turno o un turno tarde **gana**; reparar a Iris sin generación puede costar la partida | AUT |
| V4 | Escenarios con eventos reales (640 corridas) | Tormenta **débil** (×0,9 a ×2,3): todos ganan y **aguantar deja la mayor energía**; tormenta **fuerte**: refugio domina; con **panel + necesidad exterior** el escudo 2 y el combo ganan 12/12 y el refugio 9/12 (4 celdas distintas) | AUT |
| V5 | Ciencia del ×19,4 | Es un cociente de **medias**; fondo 4,10; media 79,68; factor 19,45; máximo de muestra 304; dosis absorbida extra en 12 h ≈ 1.226 µGy | **Verificado por mí en el repo** |
| V6 | Revisión científica por un agente de solo lectura con búsqueda web | Reconstrucción, fuentes y textos (ver `VALIDACION_CIENTIFICA_RADIACION.md`); **cifras de Hassler 2014 no verificadas** | Agente independiente de mi diseño, **sin respuesta aún del responsable de datos** |

**Ninguna de V1–V5 es una validación independiente de implementación**: las ejecutó el agente que diseñó la propuesta y que podría implementarla. **Una medición no es una prueba independiente.**

## D. Resultados por tema (resumen; detalle en los documentos nuevos)

### D.1 Meteoróloga (D14) — solicitud enviada
Issue **#455** a José (`rol:agentes`, `bloquea:agentes`): una frase neutral en inglés para `agentes.meteorologa.pronostico.preparar` que **informe del riesgo sin recomendar refugio, escudo ni esperar**; **no se redactó ni se implementó el texto**. José decide si el cambio va en #449 o en un PR aparte. **Pendiente de respuesta.**

### D.2 Dosímetro y proyecciones (D15 aprobado con condiciones)
`SPEC_V2_ADENDA_3.md` §1 diferencia **cuatro magnitudes**: tasa (observada, exacta), dosis proyectada (con `queEsSi`, 287/288, rotulada "Estimate for the next {n} turns"), coste energético (`costoDe`, 144/144, ya visible en `CostRow`) y protección del escudo (diferencia de dosis proyectada frente a aguantar + blindaje retrasado de `costoDe` + estado activo con `enRefugio`/`factorEscudo`). **Regla derivada:** la UI **no** muestra energía, soporte ni blindaje proyectados (no verificados, y podrían anticipar un evento aleatorio) **ni** calcula "turnos de protección que quedan" (copiaría la regla del motor). Una función hermana de `queEsSi` que aplique el `extra` del dilema sería un cambio de motor y **no se propone sin aprobación**.

### D.3 Iris (D7 aprobado; D16 como investigación)
Las tres filtraciones, con su condición de aparición, están en `SPEC_V2_ADENDA_3.md` §2: **L1** al abrir Crew; **L2** al llegar al taller (acción `reparar` desde el turno 0); **L3** al hablar con Iris en la pantalla de tormenta. El estudio de obediencia está en `ESTUDIO_OBEDIENCIA_IRIS.md`. **Hallazgo:** obedecer a Iris dañada hoy **no ejecuta nada** (la acción propuesta se rechaza por energía y el daño por creer el número es por omisión), la discrepancia es visible en el HUD, y hay recuperación amplia. Repararla cuesta ⚡−10 🫁−4 y puede costar la partida sin generación. **No se decide ningún cambio.**

### D.4 Equilibrio de la tormenta (D18 aprobado para investigar la Palanca 2)
`DILEMA_TORMENTA_V3_ESCENARIOS.md`. **Conclusión:** con eventos reales y acciones existentes, la diferenciación estratégica **existe en el motor** (aguantar razonable con tormenta débil; escudo al menos tan bueno como el refugio con panel y necesidad exterior), pero **no se activa en Jezero** y activarla requiere **cambios de datos y de motor** (variar la tormenta por partida; implementar el polvo o un evento que obligue a salir), que **la métrica de éxito no autoriza hoy**. **Alternativa presentada:** mantener una **estrategia segura bien explicada** en Jezero ("el refugio es la respuesta segura cuando la tormenta es fuerte; el escudo mejora si tienes energía; aguantar solo es sensato cuando el dato dice que la tormenta es débil") y reservar los dilemas más ricos para otras misiones o una fase posterior.

### D.5 Cinco misiones independientes
Sin cambios respecto a D6: Jezero es **introducción recomendada**, sin desbloqueos obligatorios ni capítulos dependientes. Condición D10: las piezas nuevas leen `mision` y no cablean Jezero.

### D.6 Validación independiente (D19 aprobado con condiciones)
`PLAN_QA_INDEPENDIENTE.md` "Revisión 3": regla de independencia **por fase** (quien implementó una fase no es IND de ella), casos HOY reproducibles con CSV y scripts, **Codex pendiente de disponibilidad**, y qué puede ejecutar el equipo mientras tanto. `PROTOCOLO_VALIDACION_NINOS.md`: borrador con consentimiento de padres o tutores, supervisión adulta, actividad adecuada a la edad, **minimización de datos (sin audio, sin nombres, sin imagen)** y medición de comprensión y aprendizaje. **No se organiza ninguna sesión** hasta cumplir sus siete condiciones.

### D.7 Validación científica
`VALIDACION_CIENTIFICA_RADIACION.md`. **Hechos reproducidos por mí:** ver V5. **No verificado:** magnitud exacta de `absorbed_dose_rate`, discrepancia de fondos (≈ 98 µGy/día frente a lo publicado), factor de calidad, rango de error de mezclar un fondo equivalente con un cociente de tasas absorbidas. **El límite de 4 mSv se presenta siempre como "límite de entrenamiento", regla de juego, y nunca como recomendación médica ni umbral real para astronautas.** Solicitud al responsable de datos: issue **#456** (`rol:datos`, `bloquea:datos`). **Pendiente de respuesta.**

## E. Decisiones: estado actual (sustituye a la tabla de la actualización 2)

**Nota:** las "condiciones" que Santiago estableció en sus decisiones **no me fueron transmitidas en su texto**. Registro como condiciones las que constan en sus instrucciones. **Santiago debe confirmar o corregir esta columna.**

### E.1 Aprobadas
| ID | Decisión |
|---|---|
| D1 | Dosímetro informativo, no un recurso |
| D3 | El Matemático queda fuera de Jezero |
| D4 | Pasos 1–2 sin decisiones artificiales |
| D6 | `NIVELES.md` = orden pedagógico sugerido, sin desbloqueo |
| D7 | Cerrar las tres filtraciones de Iris |
| D13 | Reintentar con Codex cuando esté disponible |
| D14 | Frase neutral de la Meteoróloga (solicitada en #455) |
| D5 (orden y método) | #454 → #449 (con #450, **merge commit**) → #410 independiente → UI v2 |
| D17, D20 | Posición de #410 y método de fusión de #449: **resueltas** por el orden anterior |

### E.2 Aprobadas con condiciones
| ID | Decisión | Condiciones |
|---|---|---|
| D2' | Aviso meteorológico **antes** de elegir módulos, reutilizando el reloj existente | Sin segunda pausa; implementación no autorizada; depende de #449 y de la frase de D14 |
| D8 / D15 | Tasa y proyecciones | **Estimadas**, con `queEsSi`; sin duplicar lógica del motor; sin presentar predicciones no verificadas (→ solo dosis y costos; ver D.2) |
| D9 / D18 | Dilema: rediseño conceptual e investigación de la Palanca 2 | Sin cambiar números; sin manipular resultados; métrica de éxito: decisiones no dominadas, justificación comprensible, información previa, sin derrotas inexplicables; **si exige tocar sustancialmente el motor, alternativa segura bien explicada** |
| D10 | Parametrizar por `mision` | Depende de que #410 esté integrada y auditada |
| D11 | Plazo de telemetría visible | Solo interfaz; datos existentes |
| D12 | "Límite de entrenamiento"; dosis en el final | Término único; **4 mSv nunca como recomendación médica**; referencias reales solo con tarjeta de datos |
| D16 | Obediencia a Iris | **Aprobada solo como investigación** (completada); ningún cambio decidido |
| D19 | Validación independiente y con niños | Evaluador que **no haya implementado**; protocolo con consentimiento y protección; **sin organizar la sesión** hasta cumplir las condiciones |

### E.3 Pendientes
| ID | Tema | Quién decide | Observación |
|---|---|---|---|
| D21 | Exactitud de la dosis proyectada: aceptar `queEsSi` (287/288, rotulada estimación) o autorizar una función hermana en el motor que aplique el `extra` del dilema | Santiago + Jaime | Recomendación: aceptar `queEsSi` ahora |
| D22 | ¿Se quiere una consecuencia observable de obedecer a Iris? (el estudio muestra que hoy no la hay) | Santiago | Y corregir el texto `agentes.iris.verificar.accion_peligrosa` (contenido de agents, José) |
| D23 | Dilema: (a) aceptar la **estrategia segura bien explicada** en Jezero o (b) autorizar investigar cambios mínimos de **datos/motor** (variar la tormenta por partida; polvo o evento de salida) | Santiago + Camilo + Jaime | No se cambia ningún valor en ningún caso |
| D24 | Corregir el texto de los documentos y del brief que afirman "decisiones sin respuesta obvia" para Jezero | Santiago | Los originales se conservan; se registra la corrección |
| D25 | Quién ejecuta la QA independiente mientras Codex no esté disponible | Santiago | Persona que no haya implementado la fase evaluada |
| D26 | Sesión con niños: responsable adulto, revisión legal y ética, lugar, fecha | Santiago / institución | **No se organiza** hasta cumplir las siete condiciones del protocolo |
| D27 | Respuesta de datos a #456 y decisión de producto sobre si los números del juego se calibran con la dosis real | Daniel / Santiago | Hoy no se cambia ningún número |

### E.4 No aprobadas
Ninguna decisión ha sido rechazada por Santiago. **Fuera de alcance y no autorizadas:** implementación de cualquier fase, cambios de balance, P0.7, P1, inicio del tutorial.

## F. Evidencia pendiente
| Pendiente | Por qué |
|---|---|
| Respuesta de José (#455) y de Daniel (#456) | Solicitudes enviadas, sin respuesta |
| Resolución de los conflictos de #410 y su auditoría | La ejecuta el propietario; la audita otra persona |
| Cifras de Hassler 2014 y Reitz 2016 (absorbida, equivalente, Q) y magnitud de `absorbed_dose_rate` | Requiere abrir los PDF (datos) |
| Proyección con más semillas y con mala suerte (más allá de las 6 usadas) | No medido |
| Qué pasa si se corrige a Iris **dos** turnos tarde, y la rotación de formas de falla con otras semillas | No medido |
| Causa terminal de "no enviar telemetría" (`ENG-FIN-1`) | No medido |
| Matriz de conflictos de `feat/ui-escenarios`, #441, #442, #446–#452 | Solo la verificó el agente de arquitectura |
| QA con Codex y sesión real con niños | Codex no disponible; sesión sin organizar |
| Repetir los barridos por una persona distinta | Para que sean IND |

## G. Responsables
| Tema | Responsable |
|---|---|
| Integración #454 → #449 | Quien fusiona (decide Santiago); CI verifica |
| #410: ejecutar la resolución | **Santiago** (propietario, Frente E); auditoría posterior: un integrante que no la resolvió |
| Frase neutral de la Meteoróloga (#455) | **José** (`Joserraldo`, agentes) |
| Revisión científica (#456) y confirmación de fuentes | **Daniel** (`Daniverd15`, datos y ciencia) |
| Motor: función hermana de `queEsSi`, polvo, variar la tormenta (solo si se aprueban) | **Jaime** (`JaimeMrF`) |
| Misiones y balance (solo si se aprueban) | **Camilo** (`CamiloM21`) y Santiago |
| Fases de UI (filtraciones, aviso, dosímetro, plazo) | **María Paula** (`Paulasaah`) con los demás, tras la integración |
| QA independiente | Persona designada por Santiago (que no implemente la fase); Codex cuando esté disponible |
| Protocolo con niños | Responsable adulto designado por Santiago |
| Coordinación, diseño, especificación y auditoría | Claude |

## H. Bloqueos que requieren decisión de Santiago
1. **Confirmar las condiciones** de la sección E.2 (no me llegó su texto).
2. **Autorizar la ejecución de las integraciones** (#454, luego #449 con merge commit) por quien corresponda; **yo no ejecuto merges**.
3. **#410:** que el propietario ejecute la resolución propuesta y designar a quien la audita.
4. **D21:** exactitud de la dosis proyectada (`queEsSi` con rótulo de estimación, o función hermana en el motor).
5. **D22:** ¿consecuencia observable de obedecer a Iris, sí o no? Y autorizar a José a corregir el texto `accion_peligrosa`.
6. **D23:** dilema — **estrategia segura bien explicada** para Jezero, o investigar cambios mínimos de datos/motor (variar la tormenta o implementar el polvo).
7. **D24:** autorizar la corrección de los textos que prometen "decisiones sin respuesta obvia".
8. **D25:** designar al evaluador independiente mientras Codex no esté disponible.
9. **D26:** designar al responsable adulto y la revisión legal y ética antes de pensar en una sesión con niños.
10. **#455 y #456:** esperar las respuestas de José y de Daniel antes de las fases 3 y de cualquier texto científico.

## Estado de cierre
Esta ronda queda **ejecutada y documentada**: pre-integración verificada, propuesta de resolución de #410 entregada, solicitudes a José y Daniel enviadas, proyecciones, obediencia a Iris y escenarios medidos, protocolo con niños preparado (sin sesión), validación científica con hechos reproducidos y lo no verificado marcado. **Me detengo aquí.** No implemento, no fusiono, no rebaso, no cambio balance y no avanzo a la siguiente fase. Espero tu aprobación explícita.

---

# Confirmación de condiciones por Santiago (18 nov 2026)

Santiago confirmó formalmente las condiciones. **Esto cierra el bloqueo 1 de la sección H de la actualización 3** y sustituye la nota de la sección E ("las condiciones no me fueron transmitidas"). **No autoriza merges, rebases ni cambios de ramas; los propietarios ejecutan sus integraciones y Claude prepara y audita cada paso.**

| Decisión | Condición confirmada (texto de Santiago, resumido) | Estado en el diseño |
|---|---|---|
| D2' | Aviso meteorológico antes de seleccionar módulos; reutilizar "Start the clock" | Coincide con `SPEC_V2_JEZERO.md` §1 |
| D7 | Corregir las tres filtraciones de Iris con revelación progresiva | Coincide con `SPEC_V2_JEZERO.md` §2–§3 y `SPEC_V2_ADENDA_3.md` §2 |
| D8/D15 | Tasa y proyección de radiación a dos turnos con `queEsSi`; **energía y blindaje solo si están respaldados** | Coincide: hoy **solo dosis y costes** están respaldados; energía, soporte y blindaje proyectados **no** lo están (ver Adenda 3 §1.2). "Dos turnos" es el horizonte de dificultad media (el de Jezero); el rótulo lee `n` de la dificultad |
| D9/D18 | Investigar la segunda palanca sin alterar números; no buscar porcentajes iguales | Investigación hecha (`DILEMA_TORMENTA_V3_ESCENARIOS.md`); sin cambios de valores |
| D10 | Mantener las cinco misiones independientes | Sin desbloqueos; piezas nuevas leen `mision` |
| D11 | Hacer visible el plazo de telemetría | `SPEC_V2_JEZERO.md` §5 |
| D12 | "Límite de entrenamiento", no umbral médico real | Término único; ver `VALIDACION_CIENTIFICA_RADIACION.md` §5 |
| D13/D19 | QA independiente y validación educativa con niños bajo condiciones adecuadas | `PLAN_QA_INDEPENDIENTE.md` (Revisión 3) y `PROTOCOLO_VALIDACION_NINOS.md`; sin sesión organizada |
| D14 | Solicitar a José una frase meteorológica neutral | Enviada (#455); sin respuesta |
| D16 | Medir las consecuencias de obedecer a Iris antes de decidir cambios | `ESTUDIO_OBEDIENCIA_IRIS.md`; ningún cambio decidido |
| Verificación científica | Verificar el factor ×19,4 y el límite | `VALIDACION_CIENTIFICA_RADIACION.md`; solicitud a datos enviada (#456) |

**Orden de integración confirmado:** #454 → #449 (con #450, merge commit) → #410 por su propietario → fases de UI.

**Aclaración de numeración:** Santiago rotuló la verificación científica como "D20". En mis documentos **D20** designaba el método de fusión de #449 (ya resuelto: merge commit). Para no mezclar, desde ahora la verificación científica se cita como **"Verificación científica (D20 de Santiago)"** y el método de fusión queda cerrado dentro de D5.

**Estado conservado.** Sin tareas repetidas. Quedan **pendientes de las decisiones D21–D26 que Santiago entregará** (exactitud de la proyección; consecuencia observable de obedecer a Iris; dilema; corrección de los textos que prometen "sin respuesta obvia"; evaluador independiente; sesión con niños) y de las respuestas a #455 y #456.
