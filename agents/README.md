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
| `escenaTormenta(vista)` | Paso 6 de la ruta dorada: 4 diálogos en orden y `opciones: [refugiarse, escudo]`. Con invernadero `ok`, la Doctora nombra la comida de mañana (dilema del refugio). |
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
