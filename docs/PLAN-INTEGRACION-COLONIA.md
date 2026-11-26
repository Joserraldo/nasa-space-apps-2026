# Fase 1: plan para que `colonia-marte` reemplace a `ui/`

**Estado:** propuesta para aprobar. No incluye código del juego.
**Base:** `feat/ui-colonia-marte` en `6d71c00`. **Rama:** `feat/infra-integracion-colonia`.

## 0. Lo que hay que aprobar

| # | Decisión | Recomendación |
|---|---|---|
| A1 | Premisa: `docs/DISENO-JUEGO.md` (colonia, nombres) choca con `HISTORIA.md` (entrenamiento, sin nombres) | Usar DISENO-JUEGO (DV-01, DV-02) y actualizar HISTORIA |
| A2 | Edad: el diseño apunta a 7-10; el reto pide 7-12 | Textos para 7-10; 11-12 con Medium y Hard |
| A3 | C1 reutiliza la misión `outpost-sorpresa`, cuya nave va a la **Luna** | Crear `missions/src/viaje-marte.ts` (misma mecánica, textos de viaje a Marte) |
| A4 | `missions/`, `agents/`, `data/` e `engine/` no aparecen en el reparto | Quedan con Santiago; `contracts/` no cambia |
| A5 | Voz: `AUDIO.md` la apaga por defecto; Ajustes la trae en 4 y R1 pide voz en todo | Encendida, según Ajustes |
| A6 | Tiempo en Easy | El turno avanza con cada acción, sin reloj. Medium y Hard: reloj de 4 s como hoy |
| A7 | Cuenta con progreso y chat con IA (existen en `ui/`) | Portarlos al final; no retirar `ui/` sin decidirlo |
| A8 | Primer PR hacia `develop` | La capa visual con su CI (PR #461), para que los siguientes sean pequeños |

## 1. Migración

### 1.1 Qué se porta, qué se descarta

| Origen en `ui/src/` | Qué hace | Destino |
|---|---|---|
| `juego/reductor.ts` | Fases y llamadas al motor (`aterrizar`, `aplicarAccion`, `avanzarTick`, `elegirDilema`, pausa) | Portar a `src/game/flujo.ts`, con capítulos |
| `juego/eventos.ts` | Eventos únicos para animar y sonar, desde `novedades()` | Portar tal cual; alimenta HUD y audio |
| `juego/plazo.ts`, `calcularTasa` de `dosis.ts` | Plazo de telemetría y tasa de dosis | Portar (lógica pura) |
| `useDosimetro` de `dosis.ts` | Hook de React | Reescribir sin React |
| `juego/guardado.ts` | Partida en `localStorage`, validada | Portar con clave `colonia.progress.partida` |
| `juego/cuenta.ts`, `useProgresoCuenta.ts` | Progreso en la nube | Portar al final (A7) |
| `i18n.ts` (`traducir`) | EN base y ES de respaldo | Portar a `src/game/i18n.ts` |
| `juego/ajustes.ts` | Idioma, sonido, calidad, cámara | Lo cubre `SettingsState`; falta idioma (B1) |
| `juego/sonido.ts` | Notas con Web Audio | Reusar las secuencias en `src/audio/` |
| `juego/pedidoEscena.ts`, `orientacion.ts` | Guía de Iris en la escena; aviso de girar | Portar cuando haya recorrido por salas |
| `App.tsx` | Reloj, pausa automática, aviso al salir | Portar las reglas, no el componente |
| `componentes/Intro.tsx` | 4 viñetas en React | Descartar; la reemplaza la intro 3D |
| `componentes/`, `pantallas/`, `escena/` | Vista actual | Descartar al final. Antes, revisar uso de `agents`, fuentes de datos, glosario y créditos |

`engine/`, `missions/`, `agents/`, `data/`, `design/` y `contracts/` se siguen usando.

### 1.2 Orden (un PR por fila)

1. CI de colonia-marte estable y scripts raíz.
2. `src/game/`: puente al motor, i18n y adaptador, con tests.
3. Flujo, eventos, plazo y guardado.
4. Ruta `/play` con una sala y datos reales.
5. Audio.
6. Intro completa.
7. C1 completo y E2E de su ruta.
8. C2 a C5 y Final (uno por PR).
9. Cuenta y chat.
10. Retiro de `ui/` y `/` hacia `/play`, solo con la ruta dorada nueva en verde.

### 1.3 Entrada al monorepo

Probé las dos opciones en copias desechables:

| Opción | Resultado |
|---|---|
| **A. App independiente que importa el motor por ruta relativa (recomendada)** | `tsc`, un test que ejecuta `paso(partidaDorada())` y un build de Vite: correctos |
| B. Agregar `colonia-marte` a `workspaces` | **Rompe `tsc` de colonia-marte**: tipos de `three` duplicados (0.160 y 0.187). Sus 154 tests, su build y los chequeos del monorepo sí pasaron |

Con la opción A:

- **Un solo punto de importación:** `src/game/motor.ts` reexporta lo que se usa de `engine`, `missions` y `agents`. No toca `vite.config.ts` ni `tsconfig.json`.
- **Instalación:** primero `npm ci` en la raíz (el motor toma `zod` de ahí) y luego en `colonia-marte/`.
- **Typecheck:** script raíz `typecheck:colonia`; `typecheck` queda igual hasta el retiro.
- **Vitest:** el `include` raíz no cambia (raíz usa 2.1; colonia, 5.1). Script `test:colonia`. En el retiro se quitan los patrones `ui/**`.
- **CI:** job propio con `--testTimeout=30000`. En el PR #461 fallan en GitHub 3 tests de piezas 3D, los 3 por superar el límite de 5 s (`TestTimeoutError`).
- **Despliegue mientras `ui/` viva:** nuevo entorno `colonia` en `infra/worker/wrangler.jsonc` con assets `colonia-marte/dist` y base de datos de preview. Producción y preview actuales no cambian. No sirve una subcarpeta: la app usa rutas absolutas.
- **Retiro:** los assets principales pasan a `colonia-marte/dist`, `/` apunta a `/play`, se borra `ui/` y se reescriben los E2E de `tests/e2e/`.

## 2. Contrato entre el motor y la vista

```
engine/missions/agents -> src/game (flujo + adaptador) -> src/ui y escenas
        ^                                                      |
        +------------- controlador <-- callbacks de la vista --+
```

La vista no importa nada del motor. El adaptador son funciones puras `(estado, idioma, ajustes) -> estado de vista`.

### 2.1 HUD (`GameHudState`)

| Campo | Sale de |
|---|---|
| Power, `level` | `recursos.energia / 100` |
| Air, `level` | `recursos.soporte_vital / 100` |
| Shield, `level` | `recursos.blindaje / 100` |
| `tone` | `Warning` con 25 o menos (valor de juego por confirmar) |
| `ringLevel` (Iris) | `iaBase`: tutorial 1, pistas 0.66, danada 0.33, offline 0 |
| `objective.title`, `step` | `mision.pasos[n].tituloKey` y "paso n de N" |
| `zone`, `minimap`, `interaction` | Tabla de salas en `src/game/salas.ts` (sala actual y puntos de uso) |

Como el HUD no tiene `update`, al principio se vuelve a crear cuando cambia el estado y se repone el foco (B5).

### 2.2 Diálogo (`CrewDialogueState`)

| Experto del motor | Hablante | Retrato |
|---|---|---|
| `ingeniera` | Tess | `tess.png` |
| `doctora` | Nia | `nia.png` |
| `meteorologa` | Vera | `vera.png` |
| `matematico` (desde C3) | Teo | `teo.png` |
| `ia_base` | Iris | **falta** (B2) |
| `control_mision` | Mission Control | **falta** (B2) |

`line` y `voiceLine` salen de las claves de `agents` y `data/story/` traducidas. Máximo 3 respuestas; cada `id` es una intención cerrada que el controlador convierte en acción.

### 2.3 Dificultad

| `effectiveDifficulty` | Motor | Vista |
|---|---|---|
| `easy` | `facil` | Sin números, sin reloj |
| `medium` | `media` | Con números |
| `hard` | `dificil` | Con números |
| `hardcore` | `hardcore` | Efectos ocultos |

Se aplica al empezar un capítulo, pasando `{ ...mision, dificultad }` a `partidaDeMision`. El motor no cambia.

### 2.4 Acciones de la vista

| Vista | Motor |
|---|---|
| Elegir zona o sitio | `aterrizar` |
| Colocar módulo, usar objeto | `puedeAplicar`, luego `aplicarAccion` |
| Respuesta de un dilema | `elegirDilema` |
| Paso del tiempo | `avanzarTick` |
| Pausa | `pausar` |
| "¿Y si...?" | `queEsSi` |

Si el motor rechaza una acción, se muestra el motivo con texto y voz.

## 3. Intro (60 s más el tiempo de decidir)

Antes hay un botón **Start**: el navegador no deja sonar nada sin un toque. Siempre visible: **Skip**, que lleva a la decisión. La decisión llega a los **44 s**.

Cámaras: metros `[x, y, z]`, inicio → fin, derivadas de las vistas de cada sala. **Sin probar en pantalla.**

| # | s | Escena / ambiente | Cámara (posición; objetivo; fov) | Voz EN / ES | Música | Efecto |
|---|---|---|---|---|---|---|
| 1 | 6 | `/space` / AMB-01 | por definir con la escena (B3) | Families are heading to Mars. You go first! / Unas familias van a Marte. ¡Tú vas primero! | calma, entra | motor de la nave |
| 2 | 6 | NW-15 / AMB-02 | `[9.6,1.7,7.2]→[6,1.6,4.2]`; `[4.8,1.5,0.5]`; 58 | Look! That red dot is your new home. / ¡Mira! Ese punto rojo es tu nuevo hogar. | calma | pulso suave |
| 3 | 8 | NW-16 / AMB-02 | `[10.5,1.6,6.5]→[8.5,1.5,5]`; `[5.7,1.1,2.7]`; 56 | Hi! I'm Iris. Let's get the colony ready. / ¡Hola! Soy Iris. Preparemos la colonia. | calma | encendido de Iris |
| 4a | 3.5 | NW-16 / AMB-02 | `[3.2,1.7,7.2]→[4,1.6,6.2]`; Tess; 50 | Tess, the engineer. / Tess, la ingeniera. | calma | clic mecánico |
| 4b | 3.5 | NW-16 / AMB-02 | `[4,1.6,6.2]→[5.5,1.6,6]`; Nia; 50 | Nia, the doctor. / Nia, la doctora. | calma | tono suave |
| 4c | 3 | NW-16 / AMB-02 | `[5.5,1.6,6]→[7,1.6,5.8]`; Vera; 50 | Vera, the solar expert. / Vera, la experta del Sol. | calma | tono suave |
| 5 | 7 | NW-16, mesa / AMB-02 | `[7.5,2.4,5]→[7,2,4]`; `[6.85,1,2.35]`; 46 | Families land in 100 sols. A sol is a Mars day. / Llegan en 100 soles. Un sol es un día marciano. | curiosa | aparece el mapa |
| 6 | 7 | NW-16 / AMB-03 | `[3.2,1.7,7.2]→[5,1.6,5.5]`; `[6.8,1.4,2]`; 58 | Wait! A real solar storm is coming! / ¡Esperen! ¡Viene una tormenta solar real! | tensión | alerta de dos notas, una vez |
| D | espera | misma toma, detenida | | You decide: the shelter, or a stronger shield? / Tú decides: ¿refugio o escudo más fuerte? | tensión baja | confirmar |
| 7 | 8 | NW-14 / AMB-03 (provisional, B3) | `[5.2,1.6,5.5]→[4.6,1.5,4]`; `[4.1,1.3,0.9]`; 60 | según la elección (abajo) | tensión | gasto |
| 8 | 8 | NW-15 / AMB-02 | `[6,1.6,4.2]→[8,1.7,6]`; `[4.8,1.5,0]`; 56 | Every choice costs something. Chapter one: The Trip. / Cada decisión cuesta algo. Capítulo uno: El viaje. | calma | tarjeta de capítulo |

Tras elegir:

- **Refugio:** "Safer inside, but food and water are harder to reach." / "Más seguros adentro, pero cuesta alcanzar agua y comida." Motor: aire −6 y energía −3 ya; blindaje +12 después.
- **Escudo:** "The shield is stronger, but it eats lots of energy." / "El escudo es más fuerte, pero gasta mucha energía." Motor: energía −16 ya; blindaje +20 después.

Las dos tarjetas tienen ícono (`home`, `shield`) y voz. En pantalla durante la toma 6: "Real storm, May 2024. Not live." con la fuente (DONKI). La decisión se aplica a la partida de C1.

**Formato.** `src/camera/schema.ts` no admite campos extra, así que:

- `data/shots/intro.json`: solo cámara (`id`, `position`, `target`, `fov`, `duration`, `easing`, `environment`, `zone`, `transition`).
- `data/story/intro.json`: por `id` de toma, escena, clave de texto, música, efecto y el punto de decisión.
- El controlador detiene el reproductor al final de la toma 6. La toma 7 usa la misma cámara para ambas opciones.

## 4. Audio (`src/audio/`)

- Un `AudioContext` creado con el primer gesto y tres buses: `music`, `voice`, `sound`.
- Niveles de `SettingsState` (clave `colonia.settings.v1`): 0, 1, 2, 3, 4 equivalen a ganancia 0, 0.25, 0.5, 0.75, 1. Se actualizan en `onChange`; `onPreview("voice")` dice una frase.
- **Voz:** `speechSynthesis` lee el `data-voice-line` visible al aparecer y al tocarlo. Su volumen se fija por frase (no pasa por Web Audio). La música baja mientras habla. Sin voz del idioma, queda el texto.
- **Música y efectos:** generados con código, sin archivos. Si se agregan archivos: solo CC0, presupuesto total de unos 2 MB, una fila por archivo en `assets/LICENCIAS.md`.
- Pestaña oculta o pausa: silencio. Máximo 3 efectos a la vez. Nada se entiende solo con sonido.

| Evento (de `AUDIO.md`) | Sonido |
|---|---|
| Botón | clic suave |
| Acción aceptada / rechazada | tono afirmativo / neutro bajo |
| Gasto / beneficio | descenso / ascenso suave |
| Daño por evento | golpe sordo breve |
| Recurso bajo | aviso único al cruzar el umbral |
| Tormenta | dos notas, una vez |
| Iris dañada | interferencia corta |
| Módulo instalado / operativo | clic / tono de encendido |
| Telemetría enviada / recibida | pulso / tono de llegada |
| Pasos | opcional, muy bajo |

## 5. Capítulos

Estructura: `data/story/cN.json` (escenas, hablantes, claves, respuestas) y `data/story/i18n/{en,es}.json`. El progreso entre capítulos vive en `src/game/`; cada capítulo es una partida del motor.

| Cap. | Decisión que enseña | Estado del motor | Diálogo | Qué falta |
|---|---|---|---|---|
| **C1 El viaje** | Blindaje: refugio, escudo o aguantar, y qué cuesta | Zona (`aterrizar`), 2 módulos, dilema, telemetría | Vera avisa; Nia y Tess discrepan; Iris falla | Misión nueva (A3) con tormenta curada `2024-05-10-gannon` |
| **C2 Jezero** | Energía y soporte vital: sitio y 2 módulos | `MISION_JEZERO` completa | Voces actuales de `agents` | Solo adaptar |
| **C3 Comida** | Cultivar gasta energía y agua | Módulos `invernadero` y `reciclador_agua`; gana con `sobrevivir_hasta_tick` | Teo entra con "¿y si...?" | Misión nueva. El crecimiento de plantas es estado de campaña: el motor no tiene recurso comida |
| **C4 Tormenta de polvo** | Racionar energía; salir a limpiar cuesta | `eventoPolvo`, `redistribuir_energia`, `salida_exterior` | Vera y Tess; Iris dañada | Verificar que el polvo se pueda forzar por misión (hoy es azar). Rescatar el rover no es una acción: solo relato, o cambio de contrato |
| **C5 Silencio** | Mandar datos y planear antes de perder señal | `enviar_telemetria`, `retrasoComunicacionesTicks`; base en `marte-polo-norte` | Mission Control se calla; decide el niño | Escena del polo y textos de conjunción |
| **Final** | Cadena de causas: decisiones frente a mala suerte | `resumenPartida` de cada capítulo guardado | La tripulación recuerda 2 o 3 decisiones | Guardar el resumen por capítulo |

Reglas en todos: texto con voz, 2 o 3 opciones, ícono primero, sin números en Easy, dato de NASA con fuente y sin presentarlo como en vivo. Las cifras de `DISENO-JUEGO.md` §4.1 se verifican con su fuente antes de escribirlas en el juego.

## 6. Lo que hace falta de la vista (issues `bloquea:ui`, al aprobar)

| Id | Pedido | Bloquea | Mientras tanto |
|---|---|---|---|
| B1 | Idioma en Ajustes y textos de componentes recibidos por parámetro ("Options", "Next", "Pause", etiquetas) | Todo: el inglés y español son obligatorios | HUD y diálogo en dos idiomas solo en lo que llega por estado |
| B2 | Retratos de Iris y Mission Control | Intro y diálogos | Retrato provisional |
| B3 | Escena `/space` (Tierra y nave) y refugio de la nave NW-17 | Tomas 1 y 7 | NW-15 y NW-14 |
| B4 | Caminar: `mode-controller.ts` limita x y z a −1..7 y NW-15 mide 12 × 8 m | Recorrer salas | Cámaras fijas |
| B5 | `update(state)` en el HUD | Fluidez y accesibilidad | Recrear el HUD |
| B6 | Tripulación colocada en NW-16, con un gesto (el layout solo tiene a Iris) | Tomas 4a a 4c | Retratos sobre la toma |
| B7 | `mountInteriorRoom` con modo juego y `dispose` | Nada: haré un contenedor propio en `src/game/` | Importar piezas sin editarlas |

## 7. Riesgos

- **Idioma:** sin B1 el juego nuevo incumple la regla bilingüe; no se retira `ui/` antes.
- **Rendimiento en celular:** sin medir.
- **Alcance:** C3, C4 y C5 necesitan datos de misión nuevos. Si falta tiempo, publicar con C1 y C2.
- **Retiro de `ui/`:** hay PRs abiertos que tocan `ui/src`; revisarlos antes.

## 8. Verificado y no verificado

**Verificado el 26 nov 2026**

| Comprobación | Resultado |
|---|---|
| Monorepo (`npm run typecheck`, `npm test`, `npm run build`) | correctos; 1211 tests |
| colonia-marte (`tsc`, `vitest`, build) | correctos en local; 153 tests; 1 fallo intermitente en 1 de 4 corridas |
| Opciones A y B (§1.3) | probadas en copias desechables |
| CI del PR #461 | falla el job de colonia-marte |
| Costos del motor citados (§3) | calculados desde `design/src/recursos.ts` y las opciones del dilema |

**No verificado:** nada en el navegador; cámaras de la intro; voces del navegador; despliegue del entorno `colonia`; rendimiento en celular.
