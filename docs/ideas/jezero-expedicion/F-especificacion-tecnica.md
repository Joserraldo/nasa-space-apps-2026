# F. Especificación técnica

**Estado:** propuesta. **Nada se implementó.** Cada necesidad se clasifica como **EXISTE** (usar tal cual), **CONECTAR** (existe, falta enlazarlo) o **NUEVO** (hay que construirlo). Para cada una, dueño y por qué no se puede resolver con lo existente.

**Dueños** (`CODEOWNERS`, `ESTADO.md`): ui = María Paula (con Daniel, Camilo, José, Jaime por pieza); agents = José; engine = Jaime; design/missions = Camilo; data = Daniel. **No modifico `ui/`, `assets/` ni `missions/`**: esto es la especificación para quienes sí.

## 0. Principio de arquitectura

- **El motor no cambia.** Todas las reglas, cifras y resultados salen de `engine/`, `design/` y `missions/` tal cual.
- **No se duplica lógica.** La UI **lee** del motor (`dosisMaximaTripulacion`, `tormentaActiva`, `telemetriaPendiente`, `puedeAplicar`, `costoDe`); `agents/` produce **diálogos** (`Dialogo` = claves i18n + variables); la UI los pinta.
- **Las nuevas piezas leen `mision`, no `MISION_JEZERO`.** Hoy muchas pantallas importan `MISION_JEZERO` directo (`lugares.ts`, `PantallaBase.tsx`, `App.tsx`, `PantallaTormenta.tsx`). Si las nuevas piezas lo repiten, las otras cuatro misiones no podrán reutilizar el tutorial. La rama experimental resolvió esto con un atajo (`misionActiva()`); lo limpio es pasar `mision` como prop. **Condición de aceptación de G.**

## 1. Funcionalidad que EXISTE y se usa sin cambios

| Pieza | Archivo | Para qué la usa el diseño |
|---|---|---|
| Intro de 4 viñetas, carga | `ui/src/componentes/Intro.tsx`, `Carga.tsx` | A |
| Órbita con 3 voces | `PantallaOrbita.tsx`, `agents/src/fases.ts` (`consejosSatelite`) | A |
| Elegir sitio con datos reales | `PantallaSitio.tsx`, `agents/src/aterrizaje.ts`, `data/terreno/jezero/` | B1 |
| Llegada y "Ready to explore" | `Llegada.tsx`, `ListoParaExplorar.tsx`, `TarjetaDelFlujo.tsx` | Llegada |
| Mundo 3D, `[E]`, objetivo de Iris, mapa | `PantallaBase.tsx`, `MundoBase.tsx`, `lugares.ts` (`objetivoDeLaBase`, `usoDelLugar`) | B2 |
| Módulos con costos | `PantallaModulos.tsx`, `engine` (`costoDe`, `puedeAplicar`, `puedeColocar`) | C |
| Conversación con la tripulación | `agents/src/conversacion.ts`, `conversar.ts`, `expertos.ts`; UI: `hablar()` en `PantallaBase` | B2, D, E |
| Curiosidades con fuente | `agents/src/curiosidades-marte.ts`, `renderOpcionesCharla` | Capas 2 y 3 |
| Tarjeta de fuente y glosario | `TarjetaFuente.tsx`, `Glosario.tsx`, `data/i18n` (*Solar cloud, Dose, Shielding, Delta…*) | Capa 3 |
| Tormenta y dilema (4 paneles) | `PantallaTormenta.tsx`, `agents/src/escenas.ts`, `engine/src/dilema.ts` | E |
| Iris dañada + verificación (P0.5) | `agents/src/iris.ts` (`irisDanada`, `verificarIris`, `lecturaFalsa`) | E |
| Radiación (P0.1–P0.2, P0.6) | `engine/src/radiacion.ts` (`dosisDelTurno`, `acumularDosis`, `dosisMaximaTripulacion`, `enRefugio`, `factorEscudo`) | D, E |
| Victoria tras tormenta (P0.3) | `engine/src/acciones.ts` (`objetivoCumplido`) | F |
| Final con causas, ciencia y pregunta | `PantallaFinal.tsx`, `engine/src/resumen.ts` | F |
| Causa terminal (QA-445) | `resumen.ts` (`causaTerminal`), `PantallaFinal` | F |

## 2. Funcionalidad que necesita CONEXIÓN (existe, falta enlazarla)

| # | Qué | Dónde | Por qué hace falta | Dueño |
|---|---|---|---|---|
| **C1** | Disparar el aviso de la Meteoróloga (`pronostico.viene` + `pronostico.preparar`) **al empezar el paso 4**, sin esperar a que el niño pregunte | `PantallaModulos`/`App` llama a `conversar({experto:"meteorologa"}, estado, {tormentaActiva:false})`; el resultado ya trae `prioridad: "alerta"` y la fuente | Hoy P0.4 solo habla si se pregunta; D1–D3 necesitan que llegue sola | José (agents) + Paula (ui) |
| **C2** | Arrancar la fase `base` **con `pausado: true`** hasta que el niño pulse "Start the clock" | `reductor.ts` (`fase`→`base`) usando `pausar()` del motor; `App.tsx` | Hoy el reloj corre desde el primer instante: la tormenta llega en ~12 s | Paula/José (ui) |
| **C3** | Que el panel Crew **no muestre** "Iris is damaged by radiation" antes de la revelación | `PantallaBase.tsx:438` debe pasar por `averiaIrisRevelada(estado)` | Spoiler detectado por lectura de código (confirmar con Codex) | Paula (ui) |
| **C4** | Que `lecturaIris` / el diálogo de confianza respete `averiaRevelada=false` y diga la lectura **cierta** | `agents/src/iris.ts` (`lecturaIris`) hoy da lectura falsa si `iaBase === "danada"` aunque no esté revelada | D9: ganar la confianza antes de fallar | José (agents) |
| **C5** | Insistencia única de Iris tras ~20 s sin acción | Temporizador de UI; Iris ya tiene `ticksSinAccion` en el estado para la IA adaptativa, pero es de ticks de juego y el reloj está parado: se necesita tiempo real | Que nadie se quede sin saber qué hacer | Paula (ui) |
| **C6** | Pintar la pista de reintento (F9) en el final | `PantallaFinal.tsx` lee la función de N3 | F9 | Paula (ui) |

## 3. Funcionalidad NUEVA realmente necesaria

Solo tres piezas, cada una justificada:

### N1. Dosímetro (componente de UI)
- **Qué:** un indicador "☢ {dosis} / {límite}" (y una barra) que muestra `dosisMaximaTripulacion(estado)` frente a `mision.limiteDosisMSv`. Aparece en el HUD **cuando la Doctora lo presenta** (D6), mediante el mismo mecanismo de HUD progresivo que ya existe (`ProgresoHud` en `HudBase.tsx`).
- **Por qué es necesario:** sin él, el niño puede perder por una regla que no ve (diagnóstico A §5, fila "Radiación"). El criterio 8 ("la derrota enseña sin castigar arbitrariamente") exige que la causa sea visible **antes** de perder. No hay forma de resolverlo solo con texto, porque la dosis cambia cada turno.
- **Por qué no es un recurso nuevo:** el niño no lo gasta ni lo administra; es una ventana a `tripulacion[].dosisMSv` (ya en el contrato `GameState`, ya calculado por el motor) y a `limiteDosisMSv` (ya en la misión). Aun así se pide aprobación explícita (README D1).
- **Lectura honesta:** el límite es un **presupuesto de entrenamiento** (valor de juego del motor), **no** un umbral de salud. El texto de la Doctora y la tarjeta de ciencia lo dicen así. Si más adelante datos aporta una referencia con fuente, se cita en una tarjeta aparte.
- **Dueño:** Paula (ui). Datos que necesita del motor: ninguno nuevo; `engine/src/index.ts` ya hace `export * from "./radiacion.js"` (verificado en la pila), así que `dosisMaximaTripulacion` está disponible para la UI.
- **Accesibilidad:** valor en texto (no solo color), `aria-live` educado, contraste según los tokens de `ui/02`.

### N2. Texto de confianza de Iris y de reacción (contenido + una función pequeña)
- **Qué:** claves nuevas en `agents/i18n` (guion C: A1–A3, B1-5, C2–C4, D1, D3, D6, D8, D9, D11, E11, E12, F1–F10, y las dos reacciones de celebración) y, en `agents`, una función de lectura cierta (C4).
- **Por qué es necesario:** son líneas que no existen y la regla del proyecto exige i18n (inglés primero).
- **Dueño:** José. El contenido en español **se escribe después** de aprobar el inglés.

### N3. Pista de reintento (F9)
- **Qué:** función pura `pistaDeReintento(resumen: ResumenPartida): { claveI18n: string } | null` que mapea `causaTerminal` y la peor decisión a una clave de texto. Sin modelo. Es "el experto (código) responde".
- **Dónde vive:** `agents/` (voz y texto), leyendo el `ResumenPartida` que ya entrega `engine/`. **No** se pone en `engine/`: el motor no contiene texto visible.
- **Por qué es necesario:** hoy el final dice *qué* pasó pero no *qué probar*; sin eso la derrota no enseña (criterio 8).
- **Dueño:** José (agents) con Paula (pintar en el final).
- **Dependencia:** `causaTerminal` solo existe en `798cd95`.

### Lo que **no** se construye (y por qué)
- **Matemático en Jezero:** el contrato y `agents/` lo soportan (`queEsSi`, `QueSi.tsx`), pero `crearPartida` lo marca `disponible: false` y no hay lámina. Añadirlo carga la primera misión con una cuarta voz. Se deja a Santiago (README D3).
- **"Dibujar la ruta" del satélite (paso 2) y `ajustar_orbita`:** existen en el motor, no en la UI. No son necesarios para el aprendizaje del diseño; ponerlos exige una decisión y UI que hoy no hay. Se mantiene como "mirar y decidir con calma" (README D4).
- **Evento de polvo:** fuera de la semilla dorada; no se incluye en el flujo de introducción para no sumar una decisión más antes de la tormenta. Sigue disponible en otras misiones.
- **Cambios en `tickTormenta`, `limiteDosisMSv`, costos o consumos:** son reglas aprobadas (#196, #114). No se tocan.

## 4. Matriz momento → archivos

| Momento | Existe | Conectar | Nuevo |
|---|---|---|---|
| A Llegada | `PantallaOrbita`, `fases.ts`, `Intro` | — | Líneas A1–A3 (N2) |
| B1 Sitios | `PantallaSitio`, `aterrizaje.ts`, `data/terreno` | — | B1-5 (N2) |
| Llegada y B2 | `Llegada`, `ListoParaExplorar`, `PantallaBase`, `lugares.ts` | C3 | L3 (N2) |
| C Módulos | `PantallaModulos`, `costoDe`, tarjetas de ciencia | C1 | C2–C4 (N2) |
| **D Círculo** | `conversar`, `TarjetaFuente`, `Glosario`, `HudBase` (progresivo) | **C1, C2, C4, C5** | **N1 dosímetro**, D1, D3, D6, D8, D9, D11 (N2) |
| E Tormenta | `PantallaTormenta`, `escenas.ts`, `iris.ts`, `dilema.ts` | C4 | E11, E12 (N2) |
| F Final | `PantallaFinal`, `resumen.ts` | C6 | **N3 pista**, F1–F10 (N2) |

## 5. Contratos
- **`contracts/`:** no se cambia. `GameState`, `Action` y `ClassifierOutput` alcanzan. Si algún día se quisiera exponer el límite de dosis a la UI mediante el estado, sería un issue `contrato` aparte; por ahora la UI lo lee de la misión (`mision.limiteDosisMSv`).
- **i18n:** inglés base en `agents/i18n/en.json` y `ui/i18n/en.json`; español segundo (regla del proyecto). Pruebas de paridad ya existen (`missions/src/i18n.test.ts` y análogas).
- **Datos:** ninguna cifra nueva. Todo lo numérico sale del estado, de `medicionMarte` o de una tarjeta con fuente. Hechos nuevos de Jezero → issue `bloquea:datos`.

## 6. Riesgos técnicos
1. **Dependencia 0:** sin la fusión de la pila P0 (#443–#450 y QA-445) no hay dosis ni límite que mostrar. Orden de fusión por decidir (README D5).
2. **Rama experimental:** introduce `misionActiva()` y un canal de radio. No lo oficializo; si Santiago decide adoptarlo, N2 y C1 se vuelven más baratos (el canal de radio ya sabe "quién avisa y qué dice").
3. **Rendimiento:** el dosímetro cambia 1 vez por turno (4 s); no re-renderiza la escena.
4. **Reloj parado + `ticksSinAccion`:** cuidado de no usar el contador de ticks del motor para la insistencia de Iris (C5): no avanza con el reloj parado.
