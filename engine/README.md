# engine/

Motor del juego: `GameState`, turnos por ticks, acciones con costo, efectos con retraso y generador por semilla. Funciones puras, sin texto visible (solo claves i18n) y sin `Math.random` ni `Date.now`.

Dueños: rol motor (Jaime y Camilo). Ver `engine/CLAUDE.md`.

## Uso desde ui (ruta dorada)

```ts
import { partidaDorada, paso, tormentaActiva, telemetriaPendiente, resumenPartida } from "@solar-shield/engine";

let s = partidaDorada();                                      // Jezero + tormenta 2024-05-20 + Iris dañada
s = paso(s, { tipo: "colocar_modulo", modulo: "panel_solar" }); // paso 4: cada módulo mueve 2 medidores
s = paso(s, { tipo: "colocar_modulo", modulo: "escudo" });
while (!tormentaActiva(s)) s = paso(s);                       // paso 5: ui pausa y muestra s.tormenta.fuente
s = paso(s, { tipo: "reparar", equipo: "ia_base" });          // paso 6-7: verificar con la Ingeniera
s = paso(s, { tipo: "enviar_telemetria" });                   // la respuesta tarda RETRASO_COMUNICACIONES ticks
telemetriaPendiente(s);                                       // { llegaEnTick, ticksRestantes } | null
const final = resumenPartida(s);                              // paso 8: cadena de causas, puntaje, insignias
```

- `paso(estado, accion?)` = `aplicarAccion` (si hay acción) + `avanzarTick`. Para pausar: `pausar(estado, true)`.
- **Pausa automática:** `const sig = conPausaAutomatica(s, paso(s))` deja `sig.pausado = true` si llegó la tormenta, hubo avería, mala suerte, cambió la IA o terminó la partida. `novedades(s, sig)` dice exactamente qué pasó para mostrarlo. Reanudar es `pausar(sig, false)`.
- `retoDelDia("AAAA-MM-DD")` sortea una tormenta real del catálogo curado de `data/`; misma fecha, misma partida para toda la clase.
- `queEsSi(estado, accion)` devuelve el estado hipotético para el Matemático sin tocar el real.
- Todo lo que cambia un recurso queda en `estado.causas` con `origen: decision | mala_suerte | sistema`.
- Las cifras de la tormenta vienen de `@solar-shield/data` con su `SourceCard`; el motor no inventa números.

## Mapa de archivos
| Archivo | Qué hace |
|---|---|
| `rng.ts` | FNV-1a + mulberry32; el estado del RNG vive en `GameState.rngEstado` |
| `escenario.ts` | `crearPartida(seed, opciones)`: sitio, objetivo, avería, sesgos, órbita |
| `acciones.ts` | `aplicarAccion`, `avanzarTick`, `queEsSi`, `pausar`; cola de efectos y causas |
| `orbita.ts` | Órbita por tick (sol/sombra, batería, señal, escudo) y `senalDeDano` (RAD en Marte) |
| `sitio.ts` | Puntaje de sitio con 3 criterios ponderados por objetivo |
| `ia.ts` | IA de la base adaptativa por reglas; daño por radiación; reparación |
| `reto.ts` | Reto del día por fecha; región por semilla |
| `resumen.ts` | Pantalla final: daño por origen, causas destacadas, puntaje, rango, insignias |
| `dorada.ts` | Semilla dorada congelada y API mínima para ui |

Los números viven en `design/` y la misión en `missions/`; aquí solo hay reglas.

## Reglas que ui no debe repetir (#113, #134)

```ts
import { aterrizar, puedeAplicar, aplicarAccion, elegirDilema, modulosColocados, puedeColocar } from "@solar-shield/engine";

s = aterrizar(s, sitioId);                 // paso 3: cobra el costo del sitio una sola vez
const p = puedeAplicar(s, accion);         // { ok: true } | { ok: false, motivo, recurso? }
if (p.ok) s = aplicarAccion(s, accion);    // rechazada → devuelve el MISMO objeto (s === antes)
s = elegirDilema(s, opcion.id);            // paso 6: acción + extra del invernadero si se construyó
```

- `motivo`: `"partida_terminada" | "sin_simulaciones" | "modulo_no_permitido" | "recursos_insuficientes"` (con `recurso` = el medidor que falta).
- El fin llega solo en `s.resultado` (`"exito"` cuando llega la telemetría con todo > 0; `"fallo"` si algo llega a 0).
- La tormenta solo hace daño en los ticks 3, 4 y 5 (`tormentaEnCurso(s)`).

## Varias misiones (#152)

`GameState` no guarda qué misión se juega (el contrato no cambia): quien integra pasa la misión en cada llamada. Todas estas funciones aceptan un último parámetro opcional `mision: Mision = MISION_JEZERO`, así que el código que no lo pasa sigue jugando Jezero: `aplicarAccion`, `puedeAplicar`, `puedeColocar`, `aterrizar`, `elegirDilema`, `avanzarTick`, `queEsSi`, `paso`, `tormentaActiva`, `tormentaEnCurso`, `novedades`, `conPausaAutomatica`.

```ts
import { partidaDeMision, aterrizar, paso, elegirDilema, tormentaActiva } from "@solar-shield/engine";

const mision = MISIONES_POR_ID[elegida];                 // cualquier `Mision` de @solar-shield/missions
let s = partidaDeMision(mision, "mi-semilla");           // sitio, dificultad, avería, objetivo y tormenta de la misión
s = aterrizar(s, mision.sitiosCandidatos[0].id, mision);
s = paso(s, { tipo: "colocar_modulo", modulo: mision.modulosDisponibles[0] }, mision);
tormentaActiva(s, mision);
```

`partidaDeMision` busca `mision.tormentaId` en el catálogo curado de `data/` y lanza error si no existe. `partidaDorada()` es `partidaDeMision(MISION_JEZERO)`.

- `Mision.fin.exitoCuando`: `"telemetria_llega"` (Jezero) o `{ tipo: "sobrevivir_hasta_tick", tick }` (gana al llegar a ese tick con todo > 0; el fallo por medidor en 0 se evalúa primero).
