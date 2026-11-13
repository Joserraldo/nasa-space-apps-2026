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
