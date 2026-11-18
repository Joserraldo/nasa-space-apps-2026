# Auditoría independiente del dilema de tormenta de Jezero

**Cierre: 18 nov 2026 · Santiago dirige; Camilo transmite · Codex Maestro coordina.**

## Resumen ejecutivo

**Recomendación explícita: A provisional — mantener para Jezero una ruta segura bien explicada.** No significa que refugiarse garantice ganar ni que el dilema esté equilibrado.
Se conserva la evidencia anterior: 56 pruebas aprobadas y control P0.6 de 120 casos repetibles; sus salidas se verificaron sin volver a ejecutar las pruebas.
Refugio gana 37/40, escudo 16/40 y aguantar 5/40 en ese calendario. La cobertura de victorias favorece al refugio, pero no demuestra dominancia de Pareto en todas las consecuencias.

Los tres scripts originales, cinco documentos de control y CSV de Santiago no se localizaron en las fuentes delimitadas de §3.
**Los tres barridos no se ejecutaron y la comparación por celda sigue bloqueada.** P0.6 no los sustituye.
El código permite que salir interrumpa el refugio y conserve el escudo; no demuestra las «cuatro celdas» ni exige salir en Jezero.
`eventoPolvo.rendimientoPanel` no tiene consumidor en el motor: cambiar ese dato no activa una economía de panel sucio/limpieza.
Hay problemas verificables de anticipación y explicación de derrotas; por eso A exige explicación y revisión de sus dueños, sin implementar nada aquí.

## 1. Código evaluado y continuidad

| Referencia | SHA exacto / condición |
| --- | --- |
| `origin/develop`, después del `git fetch origin` de esta continuación | `cf48c72524e71ed657bfc39ff43ef7e430cdb075` |
| Base pedida para los tres barridos: `origin/feat/agentes-p04-aviso-tormenta` | `4a949ad1bbab57cee3de80a5b4bf838ef5194cdd` |
| P0.1, dosis acumulada; ancestro comprobado de develop | `24b8ef0127cd5dc0590e74782c89329dfe5b6ce7` |
| P0.2, límite de dosis; ancestro comprobado | `ce73b4f7f22b7daeb1e8d0f95dcefa2be86bddb9` |
| P0.3/P0.6, protección y victoria; ancestro comprobado, [#445](https://github.com/Joserraldo/nasa-space-apps-2026/pull/445) | `f6fec1611f22e95c2f50bf60f4cfbea9f6fdf703` |
| Test P0.6 disponible | `engine/src/jezero-victoria.test.ts`, blob `6bdd6c54f593aeed9f9b8db01dbc5d69f36d4b26` |
| Test ruta ganable disponible | `engine/src/ganable.test.ts`, blob `6c2019854c96b6e8dce09e7edb24aaa400180813` |
| Rama de la entrega existente y conservada | `feat/diseno-auditoria-tormenta-20261118` |

Las tres comprobaciones `git merge-base --is-ancestor` devolvieron 0. P0.1–P0.3 y P0.6 están integrados.
Los árboles Git de `engine/`, `design/`, `missions/`, `contracts/` y `data/` son idénticos entre ambas bases; la rama de aviso cambia agentes y paquetes.
Esto permite trasladar las conclusiones de lectura de esos cinco directorios; no atribuye a `4a949ad1…` los experimentos que no se ejecutaron allí.
[#449](https://github.com/Joserraldo/nasa-space-apps-2026/pull/449), cuya cabeza es esa rama, sigue abierto: su aviso no se presenta como integrado en develop.

Se comprobaron CLAUDE raíz, PLAN, reglas, instrucciones/estado/DECISIONES de diseño, contratos, COMO-TRABAJAMOS, cabecera de ORQUESTACION y LOOP.
La auditoría continúa en su worktree con FASE 1. El checkout principal antiguo, su FASE y su rama no se cambiaron.
El informe anterior se preservó antes de editarlo; no se rehízo la investigación desde cero ni se ejecutó el loop de rebase.

## 2. Metodología, agentes e independencia

| Agente | Trabajo realmente realizado | Aislamiento y límite |
| --- | --- | --- |
| Codex Maestro | Revalidó refs, procedencia de pruebas, JSON de 120 filas, fuentes, hipótesis e integración | Único escritor de este informe y ESTADO; worktree `auditoria-tormenta` |
| Claude Code Pro | Intención, decisiones, P0.6, cinco misiones y alternativas | CLI con autenticación `claude.ai`/Pro comprobada; `auditoria-claude`, herramientas solo lectura; terminó correctamente |
| OpenCode + DeepSeek | Búsqueda de los tres originales, documentos y CSV en worktrees/respaldos | `auditoria-opencode`, modelo gratuito `opencode/deepseek-v4.1-flash-free`; no produjo barridos |
| Codex nativo, apoyo | Radiación, contratos, polvo/panel, dependencia exterior e información previa | `auditoria-review`, solo lectura; no ejecutó pruebas |
| Scout-nasa | Referencias, comentarios y posibles adjuntos de GitHub, aprobaciones y estado de PR | Conectores de lectura; sin shell ni publicaciones |
| Reviewer-nasa | Revisión independiente final | Solo lectura; resultado se registra en §12 |

Las investigaciones de diseño, localización y código se ejecutaron en paralelo; Scout investigó fuentes remotas independientemente.
Claude completó esta continuación; no hubo agotamiento ni reasignación necesaria. No se activaron créditos de Warp, otro proveedor ni facturación API.
OpenCode tenía herramienta shell, pero su perfil con permiso `ask` la rechazó en modo no interactivo; siguió mediante lectura/glob/grep hasta el límite de pasos.
Maestro completó las comprobaciones Git pendientes. No se modificó su configuración ni se insistió en llamadas repetidas.

**Condición IND:** no se asigna IND a ninguna de las tres reproducciones, porque no ocurrieron y no se conocen los bytes de los originales.
OpenCode no escribió scripts; sus búsquedas y el estado limpio lo respaldan, pero eso no acredita una corrida independiente inexistente.
Las suites anteriores son originales del repositorio sin editar; el control del apéndice es una derivación nueva y explícita de P0.6, no un original de Santiago.
No se cambiaron semillas, recursos, resultados ni parámetros del motor para obtener coincidencias.

Archivo temporal de continuidad: `%TEMP%/solar-shield-auditoria-cierre-20261118/`.
Incluye copia del informe/ESTADO anteriores, `evidencia-anterior.json` (invocación, extracto de salida de pruebas y JSON completo de control), salida de Claude y salida recuperada de OpenCode.
SHA-256 de `evidencia-anterior.json`: `2645f2e1dd13fde4ba6af6789b6b965c66379bbf6a894ace0c00af508265c8f4`.
La salida de las 56 pruebas se observó en el turno anterior, chunk `2bd2d1`; no existía un JUnit persistente: el archivo temporal conserva el extracto de ese registro, no una ejecución nueva.

## 3. Búsqueda delimitada de originales

Se buscaron los documentos en el orden solicitado. Ninguno pudo leerse; se conserva su condición de fuente ausente, sin reconstruir contenido.

| Insumo exacto de `docs/ideas/jezero-expedicion/` | Resultado |
| --- | --- |
| `REVISION_ENTREGA_0.md`, incluidas Actualización 3 y Confirmación de condiciones | No localizado |
| `DILEMA_TORMENTA_V2.md` | No localizado |
| `DILEMA_TORMENTA_V3_ESCENARIOS.md` | No localizado |
| `ESTUDIO_OBEDIENCIA_IRIS.md` | No localizado |
| `PLAN_QA_INDEPENDIENTE.md` | No localizado |
| `barrido-entrega0.test.ts.txt` | No localizado |
| `barrido-tiempos-entrega0.test.ts.txt` | No localizado |
| `escenarios-palanca2-entrega0.test.ts.txt` | No localizado |

Alcance comprobado:
- Archivos del worktree de auditoría, principal y los demás worktrees registrados; rutas exactas bajo `docs/ideas/` y búsquedas de nombres en `build/`, incluidos respaldos/recuperaciones.
- Árboles de ambas bases fijadas y `origin/main`; historial `--all` pertinente y objetos alcanzables de todas las refs locales/remotas. Cero coincidencias por los nombres del expediente/barridos.
- Inventario de **279 referencias** en `referencias-inspeccionadas.txt` temporal; SHA-256 `6c6aa95ea33526aa4a3ef15bc6199ffb614597dc6916994aa5fd4a2c271859cc`.
- Rutas externas conocidas `%TEMP%/solar-shield-frente-c-C1`, `solar-shield-frente-c-c2` y `~/.codex/solar-shield/evidence`: sin coincidencias de los nombres/CSV buscados.
- GitHub: búsquedas exactas, referencias/comentarios de #114, #196, #445, #449, #450, #455, #456 y #410. #455/#456 citan documentos, pero no ofrecen comentarios ni adjuntos recuperables.
- Lectura remota de REVISION y del primer script al SHA `4a949ad1…`: 404; búsqueda anterior de V2 en develop: 404.

Esto acredita ausencia en las fuentes inspeccionadas; no inexistencia en otro clon, archivo no publicado o máquina de Santiago.
No se creó otro worktree experimental: sin scripts no había una ejecución válida que justificara crearlo o retargetear un worktree existente.
`data/scripts/jezero-descargar.ts` y `jezero-curar.ts` son el pipeline de terreno; no sustituyen los barridos.

## 4. Evidencia experimental y coincidencias de CSV

### Evidencia anterior verificada y reutilizada

Las 56 pruebas aprobadas fueron: radiación 13, P0.3/P0.6 8, ruta ganable 9, límite de dosis 5 y misiones reales 21.
Se preservó su invocación programática Vitest 2.1.9/Node 22.23.5, con caché desactivada y alias al worktree evaluado; no se repitieron.
No equivalen a suite completa, typecheck, build, E2E ni playtest.

Maestro volvió a contar las **120 filas de salida ya conservadas**, sin simular otra vez: coinciden con los totales del JSON y con #445.
La corrida anterior repitió los 120 casos y comprobó igualdad de resultado, tick, recursos, dosis y RNG.

| Opción | #445 | Control P0.6 conservado | Coincidencia agregada |
| --- | --- | --- | --- |
| Refugio y apagar invernadero | 37/40 | 37/40 | Sí |
| Escudo nivel 2 | 16/40 | 16/40 | Sí |
| Aguantar | 5/40 | 5/40 | Sí |

En los 40 contextos emparejados, las victorias de escudo y aguantar son subconjuntos de las del refugio.
Refugio tiene 21 victorias exclusivas frente a escudo y 32 frente a aguantar; ninguno gana donde refugio pierde.
Escudo y aguantar tienen, entre sí, 15 y 4 victorias exclusivas. **Estas cuatro no verifican las cuatro celdas de la hipótesis exterior:** pertenecen a otro contraste.
Las tres derrotas del refugio en esta matriz terminan por energía, con invernadero/antena en tres sitios; «ruta segura» no significa victoria garantizada.

La mayor cobertura no implica dominancia de Pareto. Ejemplo conservado: llanura-central, panel/escudo, envío en 4; ambas opciones ganan en 6:

| Opción | Energía | Soporte vital | Blindaje | Dosis máxima del modelo (mSv aproximados) |
| --- | --- | --- | --- | --- |
| Refugio | 25 | 55 | 38 | 2,573 |
| Escudo nivel 2 | 12 | 61 | 46 | 3,135 |

Refugio mejora energía y dosis; escudo mejora soporte vital y blindaje. Son resultados del modelo educativo, no mediciones físicas.

### Tres barridos originales: tabla de coincidencias

| Script original solicitado | SHA de ejecución previsto | Hash original / copia | CSV original / reproducido | Diferencias por celda | Estado |
| --- | --- | --- | --- | --- | --- |
| `barrido-entrega0.test.ts.txt` | `4a949ad1…`, **no ejecutado** | No disponibles | No disponibles / no generado | No determinables | **BLOQUEADO** |
| `barrido-tiempos-entrega0.test.ts.txt` | Mismo, **no ejecutado** | No disponibles | No disponibles / no generado | No determinables | **BLOQUEADO** |
| `escenarios-palanca2-entrega0.test.ts.txt` | Mismo, **no ejecutado** | No disponibles | No disponibles / no generado | No determinables | **BLOQUEADO** |

Se desconocen parámetros originales, nombres/esquema de los CSV, tamaño de rejilla y reglas de comparación. No se asignan hashes, cero diferencias ni porcentajes de coincidencia inventados.
Para reproducirlos faltan sus bytes, procedencia/SHA y CSV de referencia. Deben copiarse sin cambiar contenido y compararse SHA-256 antes/después en entorno temporal.

### Hipótesis de Santiago: veredicto limitado a evidencia

| Hipótesis | Verificado | Lo que no queda probado |
| --- | --- | --- |
| 37/16/5 | Sí, en P0.6 conservado, una semilla/calendario | No es probabilidad de éxito de jugadores ni rejilla exhaustiva |
| Con factor 0,9–2,3 aguantar puede ser razonable | Los cocientes existen en el catálogo; el motor los consume | No se reprodujo la rejilla que demuestra viabilidad, conveniencia o comprensión |
| Panel + salida obligatoria favorece al escudo | Salir cancela refugio; el escudo sigue activo dentro de su duración | No se compararon sus resultados ni se probó obligación/beneficio de salir |
| Diferenciación solo en cuatro celdas | Sin evidencia original recuperable | No confirmar el número, denominador, condiciones ni robustez |
| El mecanismo existe pero no está activado en Jezero | Sí para cancelación del refugio; no hay objetivo exterior | No confundir ese mecanismo con polvo/producción persistente, que no están implementados |

## 5. Intención de diseño: #114, #196, D8, DECISIONES y P0.6

**#114:** Santiago [aprobó tres ticks, 3–5](https://github.com/Joserraldo/nasa-space-apps-2026/issues/114#issuecomment-6884368837).
Su [diagnóstico previo](https://github.com/Joserraldo/nasa-space-apps-2026/issues/114#issuecomment-6883910090), sobre `932f51e14a69e8b42d0f0ec425b07cca60402f1e`, describía 720 recorridos hipotéticos con correcciones en memoria.
No se repitieron ni se confunden con el motor actual: allí ambos módulos se colocaban en tick 0; P0.6 usa un `paso` por módulo.
Las secuencias integradas de `ganable.test.ts` pasan en la evidencia conservada; no se vuelven a afirmar todas las cifras históricas como mediciones actuales.

**#196:** la [aprobación es provisional](https://github.com/Joserraldo/nasa-space-apps-2026/issues/196#issuecomment-6889442656): orden de cinco misiones, desbloqueo con victoria/derrota condicionado a integración, alternativas neutrales y media/10 ticks para Marte norte y Luna visible.
Exige consecuencias visibles; en Luna visible la telemetría no debe ganar anticipadamente. El perfil lunar posterior de Camilo sigue siendo experimental.

**D8:** [el catálogo](../decisiones/D8-tormentas.md) distingue observado/modelado/escenario y elige `2024-05-20-marte`.
Curiosity/RAD corresponde a Gale: no convertirlo en medición local de Jezero ni usar Kp terrestre como medición marciana.
Los JSON curados incluyen fuentes [RadLab/NASA](https://visualization.osdr.nasa.gov/radlab/) y [DONKI](https://ccmc.gsfc.nasa.gov/tools/DONKI/); esta auditoría verificó su contenido en el repositorio, no recalculó las series físicas.
El factor 0,9 de `2024-05-14-x87.json` está etiquetado modelado/RAD sin aumento; no acredita una tormenta superficial débil detectada. El 2,3 está en `2017-09-10-x82.json`, observado según D8.
`orbita.ts:63` limita 0,9 a señal de daño cero; `radiacion.ts:79` lo usa directamente en dosis. Ese tratamiento del modelo no demuestra validez física.
Tres ticks, límite de juego de 4 mSv y factores de protección no son umbrales sanitarios ni constantes NASA. La simplificación absorbida/equivalente está declarada y [#456](https://github.com/Joserraldo/nasa-space-apps-2026/issues/456) mantiene preguntas abiertas.

**DECISIONES:** [DD-01–DD-09](../../design/DECISIONES.md) separan aprobaciones de hipótesis; no aprueban el refugio dominante ni las nuevas propuestas.
DD-06 describe un cierre antiguo de 30 ticks; no reemplaza `Mision.fin` actual. DD-07–09 siguen pendientes: no se modifican batería, mazo ni contratos aquí.

Respuestas a las cinco preguntas:
1. **P0.6 prueba un mínimo:** `jezero-victoria.test.ts:130–160` exige `0 < victorias < 40` por opción en 4 sitios × 10 parejas × 3 opciones, con calendario fijo. El rótulo «equilibrio/todas las estrategias» excede lo demostrado. PLAN y el comentario de acciones piden costos y compromisos; esa intención general es más amplia que la aserción.
2. **No se encontró aprobación para que el refugio dominara.** #445 publica tasas desiguales, pero eso no ordena dominancia contextual. [#455](https://github.com/Joserraldo/nasa-space-apps-2026/issues/455), de Santiago, critica después el sesgo de consejo hacia refugio.
3. **Cumplimiento parcial:** duración y puertas mecánicas mínimas sí; no queda certificado el criterio más amplio de decisiones no dominadas. Luna visible además contradice una condición explícita de #196.
4. **Anticipación parcial:** costos y extras son visibles, pero el «¿Y si…?» no proyecta supervivencia completa ni presupuesto de dosis (§6).
5. **Hay una vía verificable a derrota mal explicada:** el motor registra exceso de dosis, pero el resumen/final de develop lo omite (§6). Comprensión real por niños no se probó.

## 6. Motor, contratos e información al jugador

- **Polvo/panel:** `EventoPolvo` declara rendimiento, limpieza y persistencia (`missions/src/jezero.ts:97–110`), pero engine no consume `eventoPolvo`, `rendimientoPanel` ni `enSemillaDorada`.
  El panel entrega un beneficio puntual al colocarlo (`acciones.ts:75–76`); `CONSUMO_MODULO_POR_TICK` está vacío. El polvo aleatorio solo aplica deltas puntuales (`acciones.ts:290–295`), sin suciedad persistente ni restauración al limpiar.
- **Exterior:** el motor cobra su costo/beneficio genérico; no usa `objetivo` para restaurar un panel. `enRefugio` mira la última decisión de entrar/salir (`radiacion.ts:42–51`); `factorEscudo` funciona independientemente (`:58–68`). No hay actividad exterior en `objetivoCumplido` (`acciones.ts:302–309`).
- **Contratos:** `GameState` ya contiene tormenta, dosis por tripulante, equipos, causas y pendientes; no estado persistente de polvo, tarea exterior o almacenamiento de energía de la base. Existe `orbita.bateriaPct`, pero corresponde a la órbita, no a una batería de la base. `Action.salida_exterior` ya permite objetivo de equipo. Seleccionar otro evento no requiere necesariamente un contrato nuevo; un estado nuevo persistente sí necesita revisión de sus dueños.
- **Antes de decidir:** `PantallaTormenta.tsx:150–156` calcula costos/extra según módulos colocados. `QueSi.tsx:18` solo aplica una acción; `agents/src/que-pasa-si.ts:41–56` compara recursos/pendientes, sin avanzar reloj ni proyectar dosis/plazo. La Doctora puede informar dosis actual (`expertos.ts:52–54`), pero eso no es pronóstico del desenlace.
- **Discrepancia narrativa:** `agents/src/escenas.ts:86` decide mencionar sacrificio del invernadero por `equipos.invernadero === "ok"`; `escenario.ts:58–60` inicializa equipos aunque no se construyan. El extra real exige `modulosColocados` (`dilema.ts:15`). Puede anunciarse un sacrificio inexistente.
- **Después de perder:** `acciones.ts:358–365` prioriza recurso cero → exceso de dosis → objetivo → plazo. La causa de dosis es de sistema sin delta; `resumen.ts:52–56` excluye sistema y solo destaca deltas negativos. `PantallaFinal.tsx:120–146` lista decisión/mala suerte y para sistema solo dibuja una barra. La causa terminal no se explica allí, incluso con recursos positivos. [#454](https://github.com/Joserraldo/nasa-space-apps-2026/pull/454) propone corregirlo, pero sigue abierto y no se cuenta como resuelto.

Ninguno de estos hallazgos se arregló en esta entrega.

## 7. Alternativas de investigación: alcance, responsables y riesgos

Se estudian las dos propuestas de §7 de la orden de Camilo por su nombre, para reservar las letras A/B a la recomendación final de §10: **A = conservar ruta segura; B = investigar cambios**.

### Variar la tormenta por partida

| Alcance | Archivos o mecanismo | Responsable / dependencia |
| --- | --- | --- |
| Datos existentes | `Mision.tormentaId` en `missions/src/jezero.ts`; `partidaDeMision` (`engine/src/dorada.ts:28–38`) ya acepta otro ID curado | Camilo propone variantes y textos/tarjetas; Daniel valida eventos y marcos; Santiago aprueba |
| Lo que no logra un dato escalar | Cambiar un `tormentaId` constante cambia todas esas partidas, no sortea por semilla | Definir catálogo elegible, cuándo se elige y cómo conservar la demo |
| Selección existente | `crearPartida` (`escenario.ts:45–50`) sortea una lista, pero `partidaDeMision` le pasa una lista de un solo evento | Jaime puede conectar selección reproducible; no afirmar que ya la haga la ruta dorada |
| Diseño y presentación | `design/src/recursos.ts` contiene duración/protecciones educativas; `missions/src/textos.ts` y tarjetas incluyen evento canónico | No hace falta cambiar números para un primer estudio. José/Paula deben mostrar ID, fuente, lugar y peligro antes de elegir |
| Contratos | `GameState.tormenta` puede guardar el evento seleccionado; un campo de catálogo en `Mision` sería otra modificación de datos/API | Jaime + Camilo; contratos públicos solo si el diseño concreto lo requiere |

Riesgos: romper la semilla dorada/D8, aplicar textos de mayo a otro evento, mezclar modelo/observación o convertir una tormenta sin aumento en una falsa medición.
Un evento menor podría volver viables todas las opciones sin crear decisiones estratégicamente distintas; variar intensidad no demuestra por sí solo un dilema.
No extender esa política automáticamente a Luna/nave ni alterar las otras cuatro misiones.

Validación propuesta, no ejecutada: mantener una celda canónica intacta y comparar la rejilla completa por evento elegible, sitio, módulos/orden, semilla y tiempos originales.
Comparar decisiones emparejadas, dosis/recursos/plazo y motivos de fallo; no buscar porcentajes iguales. El niño debe poder distinguir el riesgo antes de decidir, con fuente y alcance geográfico.

### Dar un motivo para salir durante la tormenta

| Alcance | Archivos o mecanismo | Responsable / dependencia |
| --- | --- | --- |
| Solo datos, con límites | Opciones/`extra` de `Mision.dilemaPaso6` pueden usar `salida_exterior`; se pueden proponer textos/costos existentes en `missions/src/jezero.ts` y `textos.ts` | Camilo/Santiago. Esto permite una opción, no crea obligación exterior ni producción persistente |
| Regla de diseño | Definir para qué salir, en qué ventana, beneficio/sacrificio y consecuencias posteriores; preservar tres recursos | Camilo con Santiago; `design/src/recursos.ts` solo tras aprobación futura, sin cifras nuevas en esta auditoría |
| Motor necesario si se usa polvo | Consumo de `eventoPolvo`, producción real, estado de suciedad, limpieza por objetivo y calendario en `engine/src/acciones.ts`; posible apoyo en `dorada.ts`/`radiacion.ts` | Jaime. Cambiar solo `rendimientoPanel` no basta |
| Persistencia/objetivo | Si hay tarea completada o polvo persistente, revisar `Mision` y `contracts/src/game-state.ts`; no existe campo actual que lo certifique | Jaime + Camilo; issue contrato con dueños motor/agentes/datos si se amplía GameState |
| Comunicación | Avisar tarea, plazo y costo radiológico antes del dilema; explicación terminal y efectos posteriores | José/Paula, con Daniel para ciencia; evitar convertirlo en un cuarto medidor |

Riesgos: salida que anula refugio desde el turno siguiente, consumo que agota energía tras superar la tormenta, beneficios retrasados que llegan después de perder y doble cobro/cancelación al limpiar.
Una EVA guionada no es automáticamente una decisión no dominada: puede ser una receta única distinta. También puede romper la ruta canónica y propagar reglas de polvo a Luna/micrometeoritos sin sentido.
La ausencia de consumo de `enSemillaDorada` en el motor impide tratar ese campo como un interruptor real de activación.

Validación propuesta: ejecutar los tres originales intactos antes de ampliarlos; después comparar con/sin actividad exterior, mismos parámetros y horizontes, registrando tarea cumplida, dosis, energía y pendientes.
Replicar las supuestas cuatro celdas y sus vecinas en toda la rejilla; separar ventaja en éxito de Pareto y sensibilidad al calendario.
Cambios de protocolo posteriores deben declararse como otro experimento, nunca adaptarse para reproducir cifras deseadas.

## 8. Las cinco misiones: identidad frente a implementación

| Misión / objetivo | Peligros e identidad estratégica | Exterior | Implementado / propuesto |
| --- | --- | --- | --- |
| Jezero, `jezero-dorada`, explorar | `2024-05-20-marte`; proteger tripulación y comunicar tras la tormenta; refugio/comida frente a escudo | Limpiar panel propuesto, opcional; no requisito de victoria | Telemetría tras tormenta, límite de juego 4, costos y extra condicional sí. Polvo persistente/producción/obligación exterior no |
| Marte polo norte, explorar | Misma tormenta; identidad de batería, escarcha y noche polar | Limpieza propuesta en datos, no obligatoria | Telemetría, costos por misión y dilemas neutrales sí; noche, almacenamiento de batería y reducción por escarcha no |
| Luna polo sur, explorar | Evento `2017-09-10-x82`; hielo frente a refugio; micrometeorito | Terminar expedición al hielo es una opción real del dilema | Compensación atómica de la salida hacia soporte vital en `dilema.ts` y tests de hielo; no requisito de fin ni daño persistente sobre panel |
| Luna lado visible, reportar Tierra | Evento `2024-05-10-gannon`; noche/batería/antena | Datos proponen reparación exterior o reparación; no tarea obligatoria consumida | Fin sigue `telemetria_llega`, contradice amanecer de #196; `AVERIA_ANTENA_LUNA_VISIBLE` sin consumidor en el motor (sí tiene tests de datos). Noche/amanecer/antena funcional pendientes |
| Outpost sorpresa, reportar Tierra | Evento `2024-05-10-gannon`; nave, provisiones, zona protegida y comunicaciones | Limpieza de panel en datos, sin obligación real | Selección/costos y retraso de comunicaciones sí; protección continua por zona y evento sobre panel no |

Fuentes: `missions/src/{jezero,marte-polo-norte,luna-polo-sur,luna-lado-visible,outpost-sorpresa}.ts` y funciones del motor de §6.
Todas tienen límite 10 en los datos; solo Jezero tiene límite de dosis. Los 10 de Marte norte/Luna visible siguen provisionales.
Las 21 pruebas conservadas de `misiones-reales.test.ts` cubren reglas disponibles de Marte norte/Luna sur/Outpost, no Luna visible ni la campaña completa.
[#410](https://github.com/Joserraldo/nasa-space-apps-2026/pull/410) sigue abierto: no presentar la UI de cinco misiones como integrada por ese PR.
Los estados antiguos de NIVELES/PRUEBAS-MECANICAS no sustituyen inspeccionar el código actual; en particular Jezero ya no gana en 5 por telemetría.

## 9. Interpretación crítica y criterios de éxito

No se busca igualdad de tasas. Una opción necesita una justificación comprensible y consecuencias anticipables; una opción segura puede ser válida si cuesta y enseña una restricción real.
A la vez, no debe llamarse «equilibrio demostrado» a un test que admite 37/16/5 y no compara contextos exclusivos ni objetivos múltiples.
La lectura más fuerte respaldada es: **P0.6 hace importar la protección; no certifica un dilema genuino ni demuestra intención de una receta dominante.**

La hipótesis exterior es plausible por código, pero no activada como necesidad. La afirmación de cuatro celdas sigue sin sustento recuperado.
La hipótesis de eventos menores no se acepta ni se refuta por sus factores: falta medir desenlaces y utilidad; un cociente menor que uno tampoco acredita una tormenta observada más suave.
La recomendación de conservar una ruta segura se basa en alcance/riesgo actuales, no en afirmar que las ideas de Santiago hayan fracasado.

Una evaluación posterior debe congelar protocolo y cruzar sitios, pares/orden, semillas, eventos y tiempos declarados; conservar causas, pendientes y dosis junto con recursos.
Debe definir dominancia antes de ver resultados, comparar en horizontes compatibles y explicar el motivo terminal.
Después requiere comprobar que el niño anticipa el sacrificio y entiende la derrota; no hay evidencia de ese playtest en esta auditoría.

## 10. Recomendación final: **A provisional**

**Mantener para Jezero una ruta de referencia segura y bien explicada; posponer el trabajo adicional de cambios de datos/motor hasta recuperar los originales y una decisión de Santiago.**
Motivos: la protección actual sí está integrada/probada; los barridos adicionales no están disponibles; la palanca polvo/exterior exige trabajo sustancial que no es un cambio aislado de datos.
Conservarla no equivale a aprobar balance definitivo, ocultar alternativas ni recomendar refugio para todos los estados: 37/40 deja fallos energéticos explicables.

Dependencias de explicación, sin implementarlas aquí:
- Camilo propone textos de misión: tripulación, costo contextual y presupuesto de entrenamiento; Santiago decide.
- José revisa neutralidad del aviso y la discrepancia del invernadero (#455); Paula/José hacen visible la causa terminal y la información previa. #454 sigue pendiente.
- Jaime confirma la semántica y el alcance declarado de P0.6; Daniel revisa las afirmaciones físicas de #456.
- Si Santiago exige decisiones con ventajas contextuales distintas, autoriza una investigación B acotada, recuperando primero los originales y definiendo aceptación por no dominancia/anticipación/explicación, no por tasas iguales.

La elección es provisional por la falta de tres barridos, CSV, documentación de condiciones y pruebas de comprensión. No afirma que variar tormentas o exigir salir ya esté demostrado.

## 11. Lo que no pudo verificarse

1. Contenido de los cinco documentos de §3, especialmente Actualización 3 y Confirmación de condiciones; solo se conocen sus referencias.
2. Bytes, procedencia/SHA, hashes, semillas, parámetros y condiciones de los tres scripts originales.
3. CSV originales y esquema/nombres; CSV reproducidos inexistentes; comparación fila/celda, orden, tolerancia y discrepancias.
4. Resultados de tormentas menores, salida obligatoria con panel y las supuestas cuatro celdas; tampoco su robustez en rejilla completa.
5. Los 720 diagnósticos históricos de #114, los 420 casos anunciados en #445 o el perfil lunar experimental; no se repitieron.
6. Exactitud física del cociente ×19,4/ventana de «pico» y su uso en dosis equivalente; la revisión científica abierta no se reemplaza con tests.
7. Suite completa actual, typecheck, build, E2E, despliegue y comprensión/accesibilidad con niños; las pruebas anteriores no equivalen a esos controles.
8. Comportamiento de propuestas/PR abiertos como si estuvieran integrados; se distingue la base de motor de la de aviso.

## 12. Entrega y restricciones

Solo se actualizan permanentemente este informe y `design/ESTADO.md`, máximo 15 líneas.
Los insumos adicionales se preservan en el directorio temporal de §2; no hay pruebas copiadas ni CSV inventados en el diff.
Sin cambios en balance, misiones, engine/ui/agents/assets/contracts/data curada o scripts originales; sin merge/rebase/force push ni modificación del checkout principal.
Los 17 worktrees anteriores y sus 28 archivos con cambios locales se comparan con el inventario inicial; los colaboradores permanecen limpios.
La entrega se conserva/publica desde la rama propia indicada en §1 hacia develop, sin fusionar. Commit y PR se informan al entregar.

**Revisión final:** el perfil `reviewer-nasa` de OpenCode, sesión `ses_e1009b274ffeFKhSS6yDLYApma`, confirmó los hallazgos de motor y pidió precisar letras, batería orbital y consumidor de antena; las precisiones quedaron incorporadas. El reviewer nativo comprobó además el hash y recontó las 120 filas sin simular. Sin errores materiales pendientes en el documento; los defectos del producto siguen documentados, no implementados. Ningún reviewer ejecutó barridos ni autorizó fusión.

## Apéndice: control P0.6 anterior, conservado para reproducibilidad

Este código de auditoría lee el SHA fijo y transpila en memoria, sin parches ni escritura de archivos. No es ninguno de los tres originales ausentes.
Se conserva como método de la evidencia previa; no se ejecutó otra vez en esta continuación ni reemplaza los barridos solicitados.
Requiere dependencias locales ya instaladas y un worktree cuyo HEAD sea exactamente `cf48c72524e71ed657bfc39ff43ef7e430cdb075`; el commit documental de entrega cambia el HEAD de esta rama. Pasar por stdin a Node con un here-string PowerShell desde un worktree de esa base, conservando este código intacto.

```js
const cp=require("node:child_process"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const ts=require("C:/Users/lilia/OneDrive/Desktop/ranajoNasa/nasa-space-apps-2026/node_modules/typescript/lib/typescript.js");
const REF="cf48c72524e71ed657bfc39ff43ef7e430cdb075";
const git=(...a)=>cp.execFileSync("git",a,{encoding:"utf8",windowsHide:true,maxBuffer:16*1024*1024});
assert.equal(git("rev-parse","HEAD").trim(),REF);
assert.equal(git("rev-parse",REF+":engine/src/jezero-victoria.test.ts").trim(),"6bdd6c54f593aeed9f9b8db01dbc5d69f36d4b26");
const files=new Set(git("ls-tree","-r","--name-only",REF).trim().split(/\r?\n/)),cache=new Map();
function resolve(request,parent){if(request.startsWith("@solar-shield/"))return request.slice(14)+"/src/index.ts";if(!request.startsWith("."))return null;const b=path.posix.normalize(path.posix.join(path.posix.dirname(parent),request));return [b,b.replace(/\.js$/,".ts"),b+".ts",b+".json",b+"/index.ts"].find(x=>files.has(x))??(()=>{throw Error(request+" from "+parent)})();}
function load(p){if(cache.has(p))return cache.get(p).exports;const mod={exports:{}};cache.set(p,mod);const src=git("show",REF+":"+p);if(p.endsWith(".json")){mod.exports=JSON.parse(src);return mod.exports;}const js=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;vm.runInThisContext("(function(require,module,exports){"+js+"\n})",{filename:REF+":"+p})(r=>{const target=resolve(r,p);return target?load(target):require(r)},mod,mod.exports);return mod.exports;}
const eng=load("engine/src/index.ts"),m=load("missions/src/jezero.ts").MISION_JEZERO;
const dose=load("engine/src/radiacion.ts").dosisMaximaTripulacion;
function run(){let rows=[];for(const site of m.sitiosCandidatos)for(let i=0;i<m.modulosDisponibles.length;i++)for(let j=i+1;j<m.modulosDisponibles.length;j++)for(const option of m.dilemaPaso6.opciones){let s=eng.aterrizar(eng.partidaDorada(),site.id,m);for(const modulo of [m.modulosDisponibles[i],m.modulosDisponibles[j]])s=eng.paso(s,{tipo:"colocar_modulo",modulo},m);while(s.tick<m.tickTormenta&&s.resultado==="en_curso")s=eng.avanzarTick(s,m);s=eng.elegirDilema(s,option.id,m);s=eng.avanzarTick(s,m);s=eng.aplicarAccion(s,{tipo:"enviar_telemetria"},m);while(s.resultado==="en_curso"&&s.tick<m.fin.tickLimite)s=eng.avanzarTick(s,m);rows.push({site:site.id,modules:[m.modulosDisponibles[i],m.modulosDisponibles[j]],option:option.id,result:s.resultado,tick:s.tick,resources:s.recursos,dose:dose(s),rng:s.rngEstado});}return rows;}
const rows=run();assert.equal(rows.length,120);assert.deepEqual(run(),rows);
const totals=Object.fromEntries(m.dilemaPaso6.opciones.map(o=>[o.id,rows.filter(r=>r.option===o.id&&r.result==="exito").length]));
const winSets=Object.fromEntries(m.dilemaPaso6.opciones.map(o=>[o.id,new Set(rows.filter(r=>r.option===o.id&&r.result==="exito").map(r=>r.site+"/"+r.modules.join("+")))]));
const comparisons=[];for(const a of Object.keys(winSets))for(const b of Object.keys(winSets))if(a!==b)comparisons.push({a,b,aOnly:[...winSets[a]].filter(x=>!winSets[b].has(x)).length,bOnly:[...winSets[b]].filter(x=>!winSets[a].has(x)).length});
console.log(JSON.stringify({sha:REF,testBlob:"6bdd6c54f593aeed9f9b8db01dbc5d69f36d4b26",method:"control derivado literal de P0.6; NO barrido original ausente ni CSV",rows:rows.length,determinism:"120 filas iguales al repetir",totals,comparisons,results:rows}));
```
