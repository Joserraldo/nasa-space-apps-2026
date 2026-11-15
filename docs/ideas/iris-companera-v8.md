# Iris compañera en el mundo abierto v8 (propuesta de agentes)

> **Estado:** propuesta del rol agentes (José), 14 nov 2026. **Aprueba:** Camilo (diseño) las reglas; María Paula (ui) la representación. Hasta que lo aprueben, el código vive solo en `agents/` y ui decide si lo usa.
> **Base:** referencias de Pau v8 (rama `feat/ui-referencias-v8`: `README.md` §3, `PLAN-IMPLEMENTACION-JEZERO.md` §2-3, `APLICACION.md`), los 8 pasos de `MISION_JEZERO` y lo que Iris ya hace en `agents/` (`iris-guia.ts`, `iris.ts`, `iris-pregunta.ts`).

## Por qué

En las láminas v8, Iris es un **rover solar de cuatro ruedas** que acompaña al niño desde el inicio por una base abierta con 10 lugares (`mesa`, `taller`, `sensor`, `habitat`, cinco anclajes de módulo y `banco`). Hoy Iris solo habla: dice a qué experta llamar (tutorial) o insinúa el área (pistas). En un mundo donde se camina, falta decir **adónde ir**. Si no, el niño se pierde y explorar le esconde las decisiones, que es justo el riesgo que Pau marca en su §3.

## Las 6 mecánicas

| # | Mecánica | Qué hace el niño | Qué hace Iris | Regla que no se rompe |
|---|---|---|---|---|
| M1 | **Sígueme** | Camina detrás de Iris o usa la lista de lugares | Elige un **destino** (`LugarId`) y una línea corta que dice por qué ir allí | Iris **nunca** ejecuta una `Action`; llegar al lugar no da recursos ni protección |
| M2 | **Destino por paso** | Avanza por los 8 pasos de Jezero | El destino sale del paso actual (tabla abajo) | Es una sugerencia: caminar sigue libre y ningún lugar se bloquea |
| M3 | **Urgencia manda** | Ve un medidor bajo (< 30) | Si hay un recurso en peligro fuera de la tormenta, Iris cambia el destino al lugar de la experta que lo resuelve | Mismo umbral y orden que `areaUrgente` (tormenta > energía > blindaje > soporte) |
| M4 | **Andamio que se retira** | Juega mejor | `tutorial`: nombra lugar y experta y traza ruta. `pistas`: solo mira hacia el área, sin nombre ni ruta. `offline`: se queda en su dock (Pau lo pone en la estación de Ingeniería, que agentes asume que es el `taller`) | El nivel lo decide el motor (`iaBase`); agentes solo lo lee |
| M5 | **Iris se equivoca (guionado)** | En el paso 6 compara lo que dice Iris con el medidor | La falla sigue siendo la de `iris.ts` (`numero_falso` primero). Cuando se revela, el destino pasa a `taller` para repararla con la Ingeniera | La falla la decide el código con la semilla, nunca el modelo |
| M6 | **Bienvenida (briefing)** | Paso 1, al entrar a la base | 3 líneas que se pueden saltar: objetivo, tres medidores y "pregúntale a una experta" | Sin cifras; se puede omitir y llevar al mismo punto |

### M2: destino por paso de Jezero

| Paso (`meta`) | Destino | Experta | Por qué ahí (lo deduce agentes del plan de Pau, §2: propósito de cada `LugarId`) |
|---|---|---|---|
| 1 `satelite_suelto` | `mesa` | — | La mesa agrupa órbita, ruta y sitio |
| 2 `ruta_dibujada` | `mesa` | — | Mismo centro de planificación |
| 3 `sitio_elegido` | `mesa` | — | Comparar sitios y criterios |
| 4 `modulos_colocados` | `taller` | Ingeniera | Energía y costo de cada módulo antes de confirmar |
| 5 `tormenta_llega` | `sensor` | Meteoróloga | Lectura del evento y fuente histórica |
| 6 `consejo_opuesto` | `habitat` | Doctora | Comparar refugio, escudo nivel 2 o aguantar |
| 7 `telemetria_enviada` | `mesa` | — | La consola de enlace base, **no** el módulo `antena` ("Dos precauciones de integración", punto 2, en `PLAN-IMPLEMENTACION-JEZERO.md`: no exigir que la antena se haya construido) |
| 8 `fin` | `mesa` | — | Cierre y cadena de causas |

**Orden de prioridad:** Iris averiada y ya revelada → `taller` · urgencia (M3) → lugar de la experta · paso (M2).
**Lugar de cada área (M3):** energía → `taller` (Ingeniera) · blindaje → `habitat` (Doctora) · soporte vital → `habitat` (Doctora). En tormenta, el paso ya manda (5 → `sensor`, 6 → `habitat`).

## Qué queda fuera, a propósito

- **Bajar de nivel a Iris por buen juego** (`rachaAciertos`): es regla del motor y de diseño. Se propone a Camilo y Jaime y no lo toca agentes.
- **Recompensa por proximidad:** ninguna. Pau lo pide explícito ("inspeccionar no construye ni concede protección por proximidad").
- **Nuevos `LugarId` (almacén, espacio común):** Pau dice que necesitarían un cambio de contrato. Iris solo usa los 10 que ya existen.
- **Misiones fuera de Jezero:** primero Jezero. Las voces de las otras 4 ya están en sus PRs.

## Contrato con ui (sin tocar `contracts/`)

`agents` exporta `DestinoIris`, una copia exacta de los 10 `LugarId` de `ui/src/escena/mundo.ts` (rama local de Pau). Si ui cambia un id, falla un test de tipos en ui, no en el juego. Mover el tipo a `contracts/` sería mejor, pero requiere un issue `contrato`: queda como siguiente paso si Pau y Camilo lo aprueban.

```ts
type DestinoIris = "mesa" | "taller" | "sensor" | "habitat" | "panel_solar" | "escudo" | "reciclador_agua" | "invernadero" | "antena" | "banco"; // copia de LugarId
type GestoIris = "senalar" | "mirar" | "pedir_reparacion" | "explicar";
type CaraIris = "normal" | "error";
interface GuiaLugar { destino: DestinoIris; ruta: boolean; experto?: Expert; dialogo: Dialogo; gesto: GestoIris; cara: CaraIris }

function guiaIrisLugar(v: VistaAgente, paso: number, opts?: { averiaRevelada?: boolean }): GuiaLugar | null;
// null → Iris en su dock (offline) · ruta: true solo en tutorial · experto?: a quién consultar al llegar
// gesto: pedir_reparacion (avería revelada) · senalar (tutorial) · mirar (pistas) · cara: error solo con avería revelada
function briefingIris(): { dialogo: Dialogo; gesto: "explicar"; cara: "normal" }; // paso 1, omitible
```

## Cómo se prueba

`npx vitest run agents`: un caso por cada paso, la urgencia gana al paso, la avería gana a todo, `pistas` sin ruta ni nombre de lugar, `offline` → `null`, claves en `en` y `es` y frases cortas.

## Preguntas abiertas para María Paula (ui)

Las referencias v8 no lo dicen y agentes no lo decide:

1. **Dock:** ¿el dock de Iris en Ingeniería es el `LugarId` `taller`, o es otro punto?
2. **Movimiento:** ¿Iris va delante del niño, a su lado o lo espera en el destino? ¿A qué distancia?
3. **Gestos:** agentes entrega `senalar`, `mirar`, `pedir_reparacion` y `explicar`. ¿Faltan "inspeccionar", "confirmar" o "recuperación" de tu lista de gestos para Iris?
4. **Rostro:** agentes entrega `cara: "normal" | "error"`. ¿Quieres también "verificada" y "reparada" (fila P0 "Iris y punto de reparación")? Para eso, ui pasaría el estado de verificación en vez de `averiaRevelada`.
5. **Intro:** ¿el briefing de 3 líneas va en el paso 2 de tu recorrido (Briefing) o al entrar a la base?
