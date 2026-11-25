# Plan de QA independiente de Jezero (sustituye y precisa a H)

**Estado:** propuesta. **No se ejecuta ninguna prueba de implementación**: aún no hay implementación autorizada. Este plan define casos reproducibles y quién puede ejecutarlos.
**Conserva H** (`H-plan-qa.md`) como documento original; aquí se corrigen sus supuestos con lo aprendido en la entrega 0.

## 1. Regla de independencia (no negociable)

Una prueba es **independiente** solo si **quien la ejecuta no es quien escribió ni quien implementó el cambio que se prueba**, y si los criterios de aceptación estaban fijados **antes** de ejecutarla. Cualquier otra prueba se llama **verificación del autor** y nunca se presenta como independiente.

| Etiqueta | Quién | Valor |
|---|---|---|
| **IND** (independiente) | Codex, o una persona del equipo que no escribió el cambio, o un agente que no lo escribió | Puede cerrar un criterio de aceptación |
| **AUT** (verificación del autor) | Quien diseñó o implementó el cambio (hoy: Claude, que diseñó la propuesta y podría implementarla después) | Sirve para detectar errores temprano; **no cierra** un criterio |
| **CI** | El pipeline del repositorio (`Tipos y tests`, `E2E ruta dorada`) | Reproducible y automático; no sustituye la IND de comportamiento |

**Estado actual (hecho):** Codex **no está disponible** (su host de herramientas no arranca: `codex-code-mode-host: No such file or directory`). Todo lo medido hasta ahora en la entrega 0 por mí es **AUT**. DeepSeek revisó el diseño (auditoría de documentos y un barrido propio que coincidió con el mío); su revisión es **independiente de mi diseño**, pero no sustituye una prueba de implementación porque todavía no existe implementación.

## 2. Qué puede ejecutar el equipo mientras Codex no esté disponible

| Prueba | Ejecutor posible | Etiqueta | Nota |
|---|---|---|---|
| Barridos del motor (`barrido-*.test.ts.txt`) y comparación de CSV | Cualquiera con el repo | AUT si los corre quien los escribió; **IND** si los corre otra persona/agente con los scripts adjuntos | Son deterministas: mismos CSV = misma ejecución |
| `npm run typecheck`, `npm test`, `npm run e2e -- --workers=1` | CI o cualquiera | CI | Línea base ya verde en #449 y #454 |
| Pruebas de unidad de las piezas nuevas | Quien las implemente | AUT | Obligatorias, no suficientes |
| Revisión de código contra los criterios de aceptación | Un agente o persona que no implementó | **IND** | Puede hacerla DeepSeek **si no escribió ese cambio** |
| Capturas manuales en 3 tamaños | Santiago o María Paula | **IND** si no implementaron | La evidencia visual de Crew (turno 0) ya existe como AUT |
| Sesión con niños reales | Equipo/familias | IND | **No sustituible por Playwright** (ver sección 7) |

**Qué NO se puede declarar independiente ahora:** cualquier prueba ejecutada por mí (barridos, captura de Crew, `queEsSi`, línea base de filtraciones). **Esas mediciones son útiles como línea base, y se rotulan AUT en el informe.**

## 3. Línea base ya medida (AUT, reproducible)

Ejecutada sobre `origin/feat/agentes-p04-aviso-tormenta` (`4a949ad`), semilla dorada `jezero-2024-05-20`, idioma inglés.

| ID | Qué | Resultado actual | Cómo reproducirlo |
|---|---|---|---|
| **BL-1** | Crew muestra a Iris dañada antes de la revelación | **Sí** ("Iris is damaged by radiation" en "Turn 0") | `evidencia-crew-iris.spec.ts.txt` (cópiese a `tests/e2e/` y `npx playwright test`) + captura `evidencia-crew-iris-turno0.png` |
| **BL-2** | El taller ofrece reparar a Iris antes de la revelación | **Sí**: `usoDelLugar("taller", partidaDorada())` = `{tipo:"reparar",equipo:"ia_base"}` con `averiaIrisRevelada = false` | Prueba de unidad de 5 líneas (ver sección 5, caso `LEAK-2`) |
| **BL-3** | `averiaIrisRevelada` | Turno 0 `false`, turno 3 `true`; `pasoDeLaBase` devuelve 4 y 7 | idem |
| **BL-4** | Dosis visible en la UI | **No**: ningún archivo de `ui/` lee `dosisMSv`/`dosisMaxima` | `git grep -n "dosisMSv\|dosisMaxima" origin/develop -- ui` (0) |
| **BL-5** | Plazo visible | **No**: `ui.tick` = "Turn {tick}" sin límite | `ui/i18n/en.json`, clave `ui.tick` |
| **BL-6** | Equilibrio del dilema | Refugio 37/40, escudo 16/40, aguantar 5/40 (telemetría en el turno 3) | `barrido-entrega0.test.ts.txt` → `barrido-entrega0.csv` |
| **BL-7** | Momentos de las protecciones | `refugio@2` 24/24; `refugio@1` 4/24; `escudo2@3` 12/24 (solo con panel); combos: menor dosis, menos energía | `barrido-tiempos-entrega0.test.ts.txt` → `barrido-tiempos-entrega0.csv` |
| **BL-8** | Proyección de dosis a 2 turnos con `queEsSi` | Igual al resultado real (2,20 / 2,70 / 4,24) | prueba de 15 líneas (ver `ENG-PROY-1`) |

## 4. Reglas de reproducibilidad (válidas para todos los casos)

1. **Estado inicial determinista:** `partidaDorada()` o `partidaDeMision(mision, semilla)`. Nada de `Math.random`.
2. **Árbol:** indicar siempre el SHA exacto probado y confirmar con `git rev-parse HEAD`.
3. **Entorno:** `npm ci` en un worktree limpio; node ≥ 22 (`package.json`).
4. **Reloj de la UI:** `page.clock.install()` y `fastForward(4000)` por turno, como en `ruta-dorada.spec.ts`. El intervalo de la UI es de 4 s por turno a 1×.
5. **Calidad gráfica baja** (`arrancarEnCalidadBaja`) y viewport explícito; sin GPU, la caminata 3D es lenta: **pausar el reloj antes de caminar** (patrón existente en la e2e).
6. **Evidencia:** cada caso guarda su CSV o captura en una carpeta con el SHA y la fecha; nada de "pasó/falló" sin artefacto.
7. **Criterio antes que ejecución:** el resultado esperado de cada caso está **escrito aquí** antes de correrlo; si el resultado difiere, se informa la diferencia, no se ajusta el criterio.
8. **Limpieza:** worktrees y procesos descartables se eliminan al terminar y se declara qué se dejó.
9. **Sin balance:** ninguna prueba cambia valores de `design/` ni `missions/`.

## 5. Casos de prueba reproducibles

Prefijos: **ENG** (motor, vitest), **LEAK** (filtraciones de Iris), **UI** (Playwright), **A11Y**, **MULTI** (multimisión), **TXT** (texto y honestidad). "Cuándo" indica si puede correrse hoy (HOY) o tras implementar (TRAS).

### 5.1 Motor y datos (HOY, deterministas)
| ID | Cuándo | Precondición | Pasos | Esperado (criterio fijo) |
|---|---|---|---|---|
| **ENG-EQ-1** | HOY | SHA de #449; scripts adjuntos | Correr `barrido-entrega0.test.ts.txt`, comparar con `barrido-entrega0.csv` | CSV idéntico byte a byte; refugio 37/40, escudo 16/40, aguantar 5/40 con telemetría en el turno 3 |
| **ENG-EQ-2** | HOY | idem | Correr `barrido-tiempos-entrega0.test.ts.txt` | CSV idéntico; `refugio@1` = 4/24; `escudo2@3` = 12/24 |
| **ENG-PROY-1** | HOY | Turno 3, dorada, panel + escudo, `cerca-de-perseverance` | Para cada opción: `dosisMaximaTripulacion(queEsSi(estado, accion, mision))` y compararla con la dosis real tras 2 `avanzarTick` | Iguales en las tres opciones (2,20 / 2,70 / 4,24); `queEsSi` **no** muta el estado original |
| **ENG-PROY-2** | HOY | Misiones sin `limiteDosisMSv` (4 misiones) | Correr `queEsSi` con cada opción en cada misión | No lanza; devuelve dosis finita |
| **ENG-PROY-3** | HOY | 5 semillas distintas (no la dorada) | Repetir ENG-PROY-1 | Anotar si la proyección sigue igualando el resultado real; **si no, la etiqueta "estimación" es obligatoria** y se documenta el margen |
| **ENG-IRIS-1** | HOY | Partida dorada con Iris dañada revelada | Pedirle a Iris cada intención; aplicar su `accion` si trae una; medir recursos y dosis | Registrar la consecuencia real de obedecerla (hoy **no medida**: decide la pregunta pendiente de §2 de SPEC_V2) |
| **ENG-FIN-1** | HOY | Dorada, sin enviar telemetría, con refugio | Jugar hasta el turno 10 | Registrar la causa terminal real (`dosis`, `energía` o `plazo`); **H D3 afirmaba "plazo" sin medirlo** |
| **ENG-AZAR-1** | TRAS | Partida con mala suerte activa | Barrido con semillas ≥ 20 | Informe de si el refugio sigue dominando con azar |

### 5.2 Filtraciones de Iris (línea base HOY, criterio TRAS)
| ID | Cuándo | Pasos | Esperado hoy (BL) | Esperado tras implementar |
|---|---|---|---|---|
| **LEAK-1** | HOY / TRAS | Dorada → módulos → base → pausar → hablar con la Meteoróloga → abrir **Crew** (turno 0) | El panel contiene "Iris is damaged by radiation" | No contiene "damaged", "broken", "Repair" ni un icono de aviso; sí lo contiene después de la tormenta |
| **LEAK-2** | HOY / TRAS | `usoDelLugar("taller", estado)` en el turno 0 | Devuelve `accion = {tipo:"reparar",equipo:"ia_base"}` | `accion === null` y la consulta es la Ingeniera; desde la tormenta, `accion` es reparar |
| **LEAK-3** | HOY / TRAS | En la pantalla de tormenta, preguntar a Iris una cosa inocente ("hello") | Aparece "may be giving bad advice" | No aparece; solo aparece cuando la respuesta trae `falla` |
| **LEAK-4** | TRAS | Buscar en el DOM de toda la partida antes de la tormenta | — | Ninguna de las cadenas: "damaged", "broken", "bad advice", "Repair Iris" |
| **LEAK-5** | TRAS | Tormenta → Iris con glitch → comparar | — | La lectura falsa difiere ≥ 20 puntos del medidor visible en el HUD; la Ingeniera cita los dos valores |

### 5.3 Aviso, reloj y plazo (TRAS)
| ID | Pasos | Esperado |
|---|---|---|
| **UI-AVISO-1** | Entrar a `modulos`; esperar ≤ 3 s sin pulsar nada | Diálogo de la Meteoróloga con fuente y `prioridad alerta`; `estado` del motor igual al de antes |
| **UI-AVISO-2** | Colocar un módulo antes y otro después del aviso | El aviso aparece **antes** del primer módulo |
| **UI-AVISO-3** | Aviso → guardar → "Continue" | El aviso **no** se repite; el botón Crew es visible |
| **UI-RELOJ-1** | Pulsar "Base ready. Start the clock!" y avanzar 1 turno de reloj simulado | Turno 1; **no** existe un segundo control "Start the clock" en `base` |
| **UI-RELOJ-2** | Pausar, esperar 10 s de reloj | El turno no cambia |
| **UI-PLAZO-1** | Base viva | El HUD muestra "Turn n of 10" (límite leído de la misión) |
| **UI-PLAZO-2** | Llega la tormenta sin enviar telemetría | El objetivo del HUD es enviarla y resalta la consola |
| **UI-PLAZO-3** | Enviar la telemetría con `tick + retraso > límite` | Aviso de margen visible antes de confirmar |

### 5.4 Dosis, tasa y proyección (TRAS)
| ID | Pasos | Esperado |
|---|---|---|
| **UI-DOSIS-1** | Llega la tormenta sin hablar con la Doctora | El dosímetro es visible |
| **UI-DOSIS-2** | Comparar el valor del DOM con `dosisMaximaTripulacion` en cada turno | Iguales; un decimal como máximo |
| **UI-DOSIS-3** | Refugiarse; mirar la tasa | La tasa baja respecto a la del turno anterior sin protección; "Protected: n turns" decrece cada turno |
| **UI-PROY-1** | Panel "Compare your plan" de cada opción | Muestra dosis proyectada junto a los costos; rótulo "Estimate for the next 2 turns" presente; valor = `dosisMaximaTripulacion(queEsSi(...))` |
| **UI-PROY-2** | "Decision recorded" | Muestra dosis **real** antes y después |
| **UI-PROY-3** | Misión sin `limiteDosisMSv` | Sin NaN ni barra; solo valor y tasa |
| **UI-FIN-1** | Derrota por dosis | El final dice la dosis alcanzada, el límite de entrenamiento y la causa |

### 5.5 Texto, honestidad y i18n (TRAS)
| ID | Pasos | Esperado |
|---|---|---|
| **TXT-1** | Buscar "budget" y "presupuesto" en la UI y los textos | Ninguna aparición; solo "training limit" / "límite de entrenamiento" |
| **TXT-2** | Leer toda cifra de NASA en pantalla | Tiene fuente, fecha de consulta y "curated, not live" |
| **TXT-3** | Buscar texto que sugiera que 4 mSv es la línea real de peligro | Ninguno |
| **TXT-4** | Revisar `pronostico.preparar` | No recomienda una opción concreta |
| **TXT-5** | Modo español | Ninguna cadena visible en inglés; paridad de claves |
| **TXT-6** | `agentes.iris.verificar.accion_peligrosa` | No afirma una causalidad que el motor no tiene |

### 5.6 Multimisión e independencia (TRAS)
| ID | Pasos | Esperado |
|---|---|---|
| **MULTI-1** | `git grep MISION_JEZERO` en las piezas nuevas | 0 resultados |
| **MULTI-2** | Jugar cada una de las 5 misiones hasta el final por el reductor | Termina; la pantalla de tormenta muestra **todas** las opciones de esa misión (Luna visible: 4) |
| **MULTI-3** | Empezar por una misión distinta de Jezero | No exige haber jugado Jezero; no hay bandera de "completada" ni desbloqueo |
| **MULTI-4** | Misión sin `limiteDosisMSv` | El dosímetro no rompe |

### 5.7 Accesibilidad y tamaños (TRAS)
| ID | Esperado |
|---|---|
| **A11Y-1** | Teclado: `Esc`, `[E]`, foco visible; el dosímetro tiene `aria-live` educado |
| **A11Y-2** | Valor siempre en texto además del color; contraste según los tokens de `ui/02` |
| **UI-VP-1** | Viewports 1024×683, 1280×720, 1920×1080, 390×844: sin scroll del documento y sin solapar el HUD |
| **UI-3D-1** | Sin WebGL (respaldo 2D): la partida completa funciona |

## 6. Escenarios para Codex (cuando vuelva a estar disponible)

Los seis perfiles de H se mantienen, pero **con criterios que dependen del estado y no de impresiones**. Cada uno se ejecuta con el SHA acordado, en inglés y en español.

| Perfil | Comportamiento reproducible | Criterio fijo | Observables |
|---|---|---|---|
| **P1 7–8 años** | Sigue solo la píldora de objetivo; no abre "Why?" ni fuentes; cierra textos largos | Puede **terminar** sin abrir ninguna capa extra; si pierde, la causa y la pista son visibles sin leer más de una línea | Tiempo al primer `[E]`; si completó |
| **P2 9–10 años** | Abre "Why?"; habla con las tres antes del turno 3 | La capa 2 no repite la capa 1; el dosímetro y la Doctora dan la misma cifra | Coincidencia de cifras |
| **P3 11–12 años** | Abre fuentes, glosario y proyecciones | Toda cifra proyectada lleva "Estimate"; toda cifra de NASA lleva fuente | Cifras sin fuente = 0 |
| **P4 Explorador** | Recorre todo, tarda; deja el reloj parado en módulos | El reloj parado no consume turnos ni recursos; el estado al arrancar es idéntico al de quien arrancó de inmediato | Igualdad de estado |
| **P5 Errores** | P5a pasivo, P5b aguantar, P5c escudo sin energía, P5d obedece a Iris | Cada derrota muestra causa exacta y una pista accionable; **P5d se mide primero (ENG-IRIS-1)** | Causa terminal vs esperada |
| **P6 Eficiente** | Panel + escudo, aviso, verifica a Iris, refugio, telemetría al llegar la tormenta | Gana; el final reconoce sus decisiones | Contenido del final |

**Qué debe entregar Codex:** informe por caso con SHA, entorno, comandos, artefactos (CSV/capturas), resultado vs criterio, y **lista de lo que no pudo verificar**. Nunca "todo OK" sin artefactos.

## 7. Qué NO se prueba aquí (y por qué)
- **Aprendizaje real de niños.** Playwright simula conductas, no comprensión. Los seis perfiles son **proxies de conducta**. El único modo de saber si funciona es una sesión con niños de 7–12 años, con consentimiento y sin guardar audio (regla del proyecto). **Queda como bloqueo abierto** (sección 5 de la revisión).
- Rendimiento 3D en celular físico (pendiente ya anotado por Daniel).
- Equilibrio con mala suerte aleatoria y otras dificultades (caso `ENG-AZAR-1`, TRAS).

## 8. Criterio de salida
La implementación solo se considera aceptada cuando: **(a)** todos los casos TRAS están ejecutados por un ejecutor **IND**; **(b)** el CI está verde con `--workers=1`; **(c)** los CSV de equilibrio se regeneraron tras la última modificación y se comparan con la línea base; **(d)** no hay cambios en `design/` ni `missions/` sin aprobación escrita; **(e)** los casos HOY se re-ejecutaron por una persona o agente distinto de quien los escribió, **o** se declara explícitamente que siguen siendo AUT.

---

# Revisión 3 (D19 aprobado con condiciones)

**Qué cambia:** se precisa **quién** puede ser el evaluador independiente, se añaden casos medidos en esta ronda y se separa la validación con niños en su propio protocolo (`PROTOCOLO_VALIDACION_NINOS.md`). Lo anterior se conserva.

## R3.1 Regla operativa de independencia
- **Implementadores** de una fase: quienes escriban su código o su contenido (por ahora **no designados**; Santiago los asigna).
- **Evaluador independiente (IND):** **un integrante del equipo que no haya implementado los cambios evaluados**, o Codex cuando esté disponible. La independencia se evalúa **fase por fase**: quien implementó la fase 3 puede ser evaluador de la fase 5, pero **no** de la 3.
- **Un agente (incluido yo, DeepSeek o Codex) que haya escrito el cambio no es IND de ese cambio.** Yo diseñé la propuesta y puedo llegar a implementar fases: **mis mediciones siguen siendo AUT** y así se rotulan.
- **Codex:** pendiente de disponibilidad (su host de herramientas no arranca). **No se bloquea el proyecto por esto:** mientras tanto, el evaluador es una persona designada por Santiago que cumpla la regla anterior.
- **Entrega de la evidencia:** el implementador entrega el SHA y los comandos; **el evaluador ejecuta por su cuenta** y escribe el informe sin que el implementador lo revise antes (el implementador puede **responder** después).

## R3.2 Casos añadidos (resultados esperados fijados antes de ejecutar)
| ID | Cuándo | Qué | Esperado |
|---|---|---|---|
| **ENG-PROY-4** | HOY | `dosisMaximaTripulacion(queEsSi(estado, accion, mision))` vs dosis real tras `RETRASO_POR_DIFICULTAD[dificultad].max` turnos (6 semillas × 4 sitios × 4 pares × 3 opciones) con `proyeccion-vs-real-entrega0.test.ts.txt` | 287 de 288 iguales; 1 difiere en 0,04 |
| **ENG-PROY-5** | HOY | Misma comparación para energía, soporte y blindaje | 9, 48 y 4 diferencias respectivamente (el soporte siempre −10 por el invernadero apagado); **sirve para fundamentar que la UI no los muestra** |
| **ENG-COSTO-1** | HOY | `costoDe(accion).inmediato.energia` frente al cambio real de energía al confirmar cada opción del dilema | 144 de 144 iguales |
| **ENG-TASA-1** | HOY | Incremento real de dosis por turno vs `dosisDelTurno` previa | Diferencias hasta 0,04 por turno; **la tasa de la UI es la observada** |
| **ENG-HORIZ-1** | HOY | `RETRASO_POR_DIFICULTAD[*].max` | fácil 1, media 2, difícil 3, hardcore 3; el rótulo "next {n} turns" lee `n` |
| **ENG-IRIS-1** | HOY | `iris-obediencia-entrega0.test.ts.txt` | Ver `ESTUDIO_OBEDIENCIA_IRIS.md`: la acción peligrosa no es ejecutable (0/64); creer la lectura falsa y no actuar pierde (4,19 y 4,71 mSv); corregir en el turno 4 aún gana |
| **ENG-ESC-1** | HOY | `escenarios-palanca2-entrega0.test.ts.txt` → CSV | CSV idéntico; S2 aguantar 8/8; S1 refugio 8/8; S5 con panel: refugio 9/12, escudo 2 12/12 |
| **SCI-1** | HOY | Recalcular `fondo`, media del 20 may y factor desde `data/raw/2024-05/RAD.json` | fondo 4,10; media 79,68; factor 19,45; máximo de muestra 304; dosis absorbida extra en 12 h ≈ 1.226 µGy |
| **TXT-7** | TRAS | Buscar en el DOM "{factor} times" presentado como dosis de la tripulación | Ninguno; "measured" solo para lo que midió el rover |
| **TXT-8** | TRAS | Buscar "4 mSv" presentado como recomendación médica o umbral real | Ninguno |
| **UI-EST-1** | TRAS | Toda cifra proyectada lleva "Estimate for the next {n} turns" con `n` leído de la dificultad | Presente; ninguna proyección de energía, soporte o blindaje en pantalla |

## R3.3 Qué puede ejecutar el equipo mientras Codex no esté disponible
| Prueba | Quién | Etiqueta |
|---|---|---|
| Los casos **HOY** de esta revisión y de la sección 5 | Cualquier integrante que no los haya escrito (hay scripts y CSV adjuntos) | **IND** |
| Comprobación de la pila integrada (`REVISION_ENTREGA_0.md`, sección B.6) | Quien integra (CI) y un segundo integrante que revise | CI + IND |
| Auditoría posterior de #410 resuelta | Un integrante que **no** la resolvió | IND |
| Casos **TRAS** | Evaluador designado por Santiago, **no** implementador | IND |
| Sesión con niños | Según `PROTOCOLO_VALIDACION_NINOS.md`, **solo cuando se cumplan sus condiciones** | IND |

## R3.4 Entrega que debe producir el evaluador independiente
Informe por caso: SHA y entorno; comandos; artefactos (CSV, capturas); resultado vs criterio; **lista de lo que no pudo verificar**; declaración de independencia ("no escribí ni implementé el cambio evaluado"). Nunca "todo OK" sin artefactos.
