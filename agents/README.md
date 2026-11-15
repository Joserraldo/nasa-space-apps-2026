# agents/ — tripulación de expertos e Iris

Paquete `@solar-shield/agents`. Dueño: rol agentes (José). El modelo de lenguaje **solo clasifica**; los expertos son código que lee el `GameState` y datos de `data/` y responde con claves i18n. Todo funciona **sin API**.

## Flujo
```
frase / botón ─► clasificarConAtajos(texto)  ── null ─► (modelo vía /api/clasificar) ─► ClassifierOutput
                                   │                                                      │
                                   └──────────────► responder(salida, vista, contexto) ◄──┘
                                                         │
                                                         ▼
                                     Dialogo { experto, prioridad, lineas, fuente?, accion? }
```

## API para ui y motor
| Función | Para qué |
|---|---|
| `clasificarConAtajos(texto)` | Regex en/es sin modelo. `null` = no se entendió → probar el modelo o mostrar botones. |
| `responder(salida, vista, { dosisMarte })` | Respuesta del experto. `dosisMarte = referenciaDosis("marte-superficie")` de `@solar-shield/data`. |
| `aAccion(salida)` | Intención → `Action` del motor (o `null` si es una consulta). |
| `escenaTormenta(vista, dilema?, medicion?)` | Paso 6 de la ruta dorada: 4 diálogos en orden y `opciones: [refugiarse, escudo]`. Con `dilema = MISION_JEZERO.dilemaPaso6.opciones`, cada experto propone la acción que defiende en la misión y "aguantar" es la tercera opción. Con invernadero `ok`, la Doctora nombra la comida de mañana (dilema del refugio). |
| `MedicionCitada { factor, lugar, fuente }` | Cifra de radiación de otro lugar para la Doctora (`lugar: "orbita_luna"` = CRaTER, #95). Sin `fuente` no hay cifra. La Meteoróloga cita el Kp solo si una fase GST se midió en la Tierra. |
| `escenaPolvo(vista, { insight })` | Paso 4b de la misión 1 (mala suerte): polvo en los paneles. `opciones: [salida_exterior panel_solar, esperar]`. El caso real de InSight solo se cita si datos pasa su `SourceCard`. |
| `preguntaIris(tema, nivel)` / `responderPreguntaIris(p, i \| null)` | Iris nivel 2: pregunta de 3 opciones que **nunca bloquea** (`saltable`). Siempre explica el porqué; `null` = el niño la saltó. |
| `irisDanada(vista, vez)` | Iris nivel 3: la 1.ª falla siempre es número falso; luego rota por semilla. Trae `falla`. |
| `verificarIris(falla, vista)` | La Ingeniera compara con el medidor y propone `reparar ia_base`. |

`vista` es `Pick<GameState, "recursos" | "tripulacion" | "tormenta" | "equipos">` (más `rngEstado` para Iris).

## Cómo pinta ui un `Dialogo`
- Cada `lineas[i]` es `{ clave, vars }`: traducir `clave` con i18n y rellenar `{var}`.
- Una variable cuyo nombre termina en `Key` es **otra clave** que también se traduce (ej. `nombreKey`, `equipoKey`).
- Claves `agentes.*` en `agents/i18n/{en,es}.json`; claves `datos.*` y `fuente.*` en `data/i18n`.
- `fuente` presente → mostrar la tarjeta de fuente (`SourceCard`). Ausente → la cifra es del estado del juego.
- `accion` presente → botón para que el jugador la confirme. **Agentes nunca aplica acciones.**
- `prioridad`: `alerta` interrumpe a `consejo`, y `consejo` a `charla`.

## Reglas
- El modelo nunca ve el estado ni produce números; las fallas de Iris las decide el código.
- Inglés es el idioma base; `en.json` y `es.json` tienen las mismas claves y variables (lo vigila un test).
- Ciencia revisada por datos (`docs/science/revision-agentes.md`): sin microgravedad en Marte, sin culpar síntomas a la radiación, sin Kp en Marte, nada "en vivo".

## Pruebas
`npm test` (desde la raíz). Las 30 frases de eval están en `src/atajos.test.ts`.

## Nombres de los expertos
- `agentes.titulo.<experto>`: para títulos y etiquetas ("Engineer" / "Ingeniera").
- `agentes.nombre.<experto>`: solo dentro de frases ("call **the Engineer**" / "llama **a la Ingeniera**"), por eso trae artículo y preposición.
- Para no mostrar la tormenta antes del paso 5, pasar a `responder` la vista de `vistaVisible(estado, tormentaActiva(estado))`.

## Matemático "¿Y si…?"
```ts
const despues = aplicarAccion(estado, accion); // copia: el motor es puro
const d = queSiMatematico(accion, estado.recursos, despues.recursos);
```
Agentes no simula: los números salen del motor y el Matemático solo dice qué sube y qué baja. Trae `accion` para que el jugador confirme.

Para comparar las opciones de una escena (paso 6, polvo 4b):
```ts
const d = compararOpciones(estado, escena.opciones.map((accion) => ({ accion, despues: aplicarAccion(estado, accion) })));
```
Por opción da una cabecera (`agentes.matematico.opcion` con `accionKey`), lo que cambia ya y lo que el motor dejó en `efectosPendientes` (`luegoSube` / `luegoBaja` con `ticks`). No trae `accion`: el jugador elige con los botones de la escena.

Usos limitados (`SIMULACIONES_POR_DIFICULTAD` en design/; el contador lo lleva ui):
```ts
const d = conAvisoUsos(queSiMatematico(accion, antes, despues), restantes); // restantes después de este uso; null = ilimitado
if (restantes === 0 /* ya antes de pedir */) mostrar(sinUsosMatematico());
```
Avisa con 2 o 1 usos restantes y cuando fue el último. Con 0 usos, ui no calcula y muestra `sinUsosMatematico()`.
## Panel de tripulación en una línea
```ts
const d = conversar({ texto } /* o { experto: "doctora" } */, estado, {
  tormentaActiva: tormentaActiva(estado),
  dosisMarte: referenciaDosis("marte-superficie"),
});
```
Hace todo: atajos/regex, botón → pregunta por defecto, esconde la tormenta antes del paso 5, aclaración si no se entiende e Iris dañada con su falla.

## Qué llama cada pantalla de ui (ruta dorada, #41 / #59)
Una línea por pantalla. `estado` es el `GameState` del motor; ui solo pinta `Dialogo` y pasa al motor la `accion` que el niño confirme.

| Pantalla (`ui/src/…`) | Llamada |
|---|---|
| `pantallas/Satelite.tsx` | `consejosSatelite(estado)` (ya conectado). |
| `pantallas/ElegirSitio.tsx` | `consejosAterrizaje(sitios)` con los `SitioCandidato` de la misión. |
| `componentes/Tripulacion.tsx` | `conversar({ texto } \| { experto }, estado, { tormentaActiva: tormentaActiva(estado), dosisMarte: referenciaDosis("marte-superficie"), vecesFallaIris })` — reemplaza `clasificarConAtajos` + `responder` + `PREGUNTA_POR_EXPERTO` (es `preguntaDelBoton`). |
| Paso 4b (polvo, pantalla nueva o aviso en la base) | `escenaPolvo(estado, { insight })` → pintar `dialogos` y dos botones con `opciones`; `null` = no hay panel, no mostrar nada. |
| `pantallas/Tormenta.tsx` | `escenaTormenta(estado, MISION_JEZERO.dilemaPaso6.opciones)` (de `@solar-shield/missions`) en vez de `escenaTormenta(estado)`. |
| Tormenta y polvo: botón "¿Y si…?" | `compararOpciones(estado, opciones.map((accion) => ({ accion, despues: aplicarAccion(copia(estado), accion) })))`. |
| Iris nivel 2 (al colocar un módulo o al revelarse la tormenta) | `preguntaIris(tema, estado.iaBase)` (solo devuelve pregunta con `"pistas"`; si no, `null`) → 3 botones + "saltar"; al elegir, `responderPreguntaIris(p, i)` o `responderPreguntaIris(p, null)`. Nunca bloquea. |
| Iris dañada (`Tormenta.tsx`) | `irisDanada(estado, vez)` y, al pulsar "verificar", `verificarIris(falla, estado)` (ya conectado). |

### Medición en órbita lunar (cuando entre #95)
Sin escribir cifras a mano; los ids están en `luna.mediciones` de `@solar-shield/data`:
```ts
import { luna, medicionLuna, fuenteCrater } from "@solar-shield/data";
const m = medicionLuna("<id de la tormenta>");
escenaTormenta(estado, dilema, m ? { factor: m.factor, lugar: "orbita_luna", fuente: fuenteCrater(m, luna.consultadoEl), fondoTranquilo: m.fondoTranquilo } : undefined);
```

## Misión Marte polo norte (#97, depende de que diseño la apruebe)
| Paso | Llamada |
|---|---|
| 3 (zonas, sin mapa) | `consejosZonasPoloNorte({ solMaxGrados, fuente })` con `solMaxGrados[z] = solMaxVerano(LATITUD_ZONA_POLO_NORTE[z])` y la fuente de `regionPoloNorte()` (data). Sin contexto, sin grados. |
| 4b (escarcha) | `escenaEscarcha(estado)`: igual que `escenaPolvo` (mismas `opciones`). |
| 6 (dilema de la batería) | `escenaTormentaPoloNorte(estado, dilema)`: la Doctora dice "medido lejos, en el cráter Gale"; la Ingeniera defiende la batería. Matemático: `compararOpciones` sin cambios. |
| 7 (noche polar) | `avisoNochePolar(estado)`: Ingeniera con la energía del estado e Iris con "el tiempo va rápido" (fuente NSSDC). |
| 8 (pregunta) | `preguntaIris("noche_polar", estado.iaBase)`. |
Con `fondoTranquilo: false` la Doctora dice "en órbita" **sin factor** (el fondo ya venía inflado).

## Misión Luna polo sur (#98, depende de que diseño la apruebe)
| Paso | Llamada |
|---|---|
| 3 (sitios) | `consejosAterrizaje(sitios)` sin cambios, con los cráteres de #126 y los puntajes que fije diseño. |
| 4b (micrometeorito) | `escenaMicrometeorito(estado)`: solo con `panel_solar` averiado; `opciones: [reparar panel_solar, esperar]`. |
| 6 (dilema del hielo) | `escenaTormentaLunaSur(estado, dilema, crater)` con la `MedicionCitada` de arriba (tormenta `TORMENTA_LUNA_POLO_SUR`). Matemático: `compararOpciones` sin cambios. |
| 7 (llamar a la Tierra) | `avisoControlLuna()`: "llega en más o menos un segundo" (NSSDC), propone `enviar_telemetria`. |
| Iris nivel 2 | `preguntaIris("mensaje_luna", estado.iaBase)`. |

## Iris compañera (mundo abierto v8)
Propuesta en `docs/ideas/iris-companera-v8.md` (aprueban Camilo y María Paula). Solo sugiere adónde ir: nunca aplica una `Action` y llegar al lugar no da nada.

| Momento (ui) | Llamada | Qué pinta ui |
|---|---|---|
| Paso 1, al entrar a la base (omitible) | `briefingIris()` | `{ dialogo, gesto: "explicar", cara: "normal" }`: 3 líneas sin cifras. |
| Cada vez que cambia el paso, un medidor o la avería | `guiaIrisLugar(estado, pasoActual, { averiaRevelada })` | `null` → Iris en su dock del taller (offline). Si no: mover a Iris hacia `destino` (`DestinoIris` = copia de `LugarId`). |
| `ruta` | — | `true` (tutorial) → trazar la ruta; `false` (pistas) → Iris solo mira hacia el área. |
| `gesto` / `cara` | — | `pedir_reparacion` + `error` con avería revelada; `senalar` en tutorial; `mirar` en pistas. Si no hay avería, `cara` es `normal`. |
| `experto` | — | A quién ofrecer al llegar (ausente en `mesa`). |

Prioridad: avería revelada → `taller` · recurso < 30 fuera de tormenta (energía → `taller`, blindaje y soporte → `habitat`) · paso (1-3, 7, 8 `mesa`; 4 `taller`; 5 `sensor`; 6 `habitat`). `"danada"` guía como tutorial; la falla numérica sigue en `irisDanada`.
## Misión Luna lado visible (#100, depende de que diseño la apruebe)
| Paso | Llamada |
|---|---|
| 3 (sitios Apolo) | `consejosAterrizaje(sitios)` sin cambios, con `terrenoLunaVisible` de #125 y los puntajes que fije diseño. |
| 4b (antena averiada) | `escenaAntena(estado)`: solo con `antena` averiada; `opciones: [reparar antena, esperar]`. |
| 5-6 (dilema de la batería de noche) | `escenaTormentaLunaVisible(estado, dilema, crater)` con la `MedicionCitada` de CRaTER (tormenta `TORMENTA_LUNA_VISIBLE`). Matemático: `compararOpciones`. |
| 7 (llamar a la Tierra) | `avisoControlLuna()` de la misión Luna polo sur. |
| 8 (una tormenta, tres lugares) | `tresLugares(estado, crater)`: Kp en la Tierra, RAD en Marte y CRaTER en órbita, cada uno con su fuente. Pregunta: `preguntaIris("luna_vs_marte", estado.iaBase)`. |

## Misión outpost sorpresa (#99, depende de que diseño la apruebe)
| Paso | Llamada |
|---|---|
| 1 (no hay suelo) | `sorpresaOutpost({ ...artemis.fuente, idFuente: artemis.instrumento })`. Sin la fuente, Iris no menciona Orion. |
| 3 (zonas de la nave) | `consejosZonasNave()`: Doctora `centro`, Ingeniera `cabina`, Iris `fondo`. Sin cifras. |
| 4b (micrometeorito) | `escenaMicrometeorito(estado)` de la misión Luna polo sur. |
| 6 (refugio con provisiones) | `escenaTormentaOutpost(estado, dilema, crater)` con la `MedicionCitada` de CRaTER (tormenta `TORMENTA_OUTPOST`). Matemático: `compararOpciones`. |
| 8 (pregunta) | `preguntaIris("viaje_marte", estado.iaBase, referenciaDosis("marte-crucero").fuente)`. Sin fuente devuelve `null`. |
