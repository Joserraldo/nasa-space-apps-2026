/**
 * Frontera entre la pantalla (Santiago: pantallas/, componentes/, juego/) y el mundo 3D (María Paula:
 * escena/). Contrato del bloque 0 de `docs/referenciapau/PLAN-JUGABILIDAD.md` §3.
 *
 * Reglas:
 * - Lo escribe solo el dueño de `escena/`. La pantalla lo importa y no lo edita: si necesita algo,
 *   lo pide como cambio a este archivo.
 * - Todo es aditivo y opcional: sin estas props, `EscenaBase` se comporta como antes.
 * - La escena nunca decide reglas: no cobra, no da recursos y no avanza la misión (MECANICAS §5).
 *   Avisa lo que hay al alcance y anima lo que la pantalla le pide.
 */
import type { CaraIris as CaraIrisGuia, GestoIris } from "@solar-shield/agents";
import type { Expresion } from "./personajes/cabeza";
import type { IdPersonaje } from "./personajes/fichas";
import type { CaraIris as CaraIrisModelo } from "./personajes/iris";
import type { LugarObjetivo } from "./vista";

/** Quién puede estar en escena, hablar o tener retrato. */
export type ActorId = IdPersonaje | "iris";

/** Dónde está el niño. Cada sala es su propia vista 3D (presupuesto de draw calls por vista). */
export type SalaId = "exterior" | "taller" | "habitat";

/** Lo que hay al alcance del niño. Una sola vía para el `[E]`: un aviso y un manejador. */
export type Interactivo =
  | Readonly<{ tipo: "lugar"; lugar: LugarObjetivo }>
  | Readonly<{ tipo: "actor"; actor: ActorId }>
  | Readonly<{ tipo: "puerta"; sala: SalaId; entrar: boolean }>;

/** Destino que la escena marca en el mundo: haz de luz, ruta en el piso y flecha en el borde. */
export type ObjetivoEscena = Readonly<{
  lugar: LugarObjetivo;
  /** `true` en el nivel `tutorial` de Iris (traza la ruta); `false` en `pistas` (solo el haz). */
  ruta: boolean;
}>;

/** Lo que Iris hace en el mundo. Tipos de `guiaIrisLugar` (@solar-shield/agents). */
export type IrisEscena = Readonly<{ gesto: GestoIris; cara: CaraIrisGuia }>;

/** Globo sobre un actor. El texto llega ya traducido: la escena solo lo ancla y lo muestra. */
export type GloboEscena = Readonly<{ actor: ActorId; texto: string }>;

/** Lo que la pantalla le pide a la escena (props nuevas de `EscenaBase`). */
export interface PedidoEscena {
  /** Destino de Iris. Reemplaza a `vista.lugarObjetivo`, que la escena no lee y se retira en la tarea S2. */
  objetivo?: ObjetivoEscena | null | undefined;
  /** Gesto y cara de Iris. `null`: Iris sin guía (nivel `offline`). */
  iris?: IrisEscena | null | undefined;
  /** Línea corta sobre el actor que habla. `null`: sin globo. */
  globo?: GloboEscena | null | undefined;
  /** Quién habla en el diálogo abierto: gira hacia el niño y gesticula. */
  hablando?: ActorId | null | undefined;
  /** Sala donde está el niño. La pantalla es dueña: la cambia al usar una `puerta`. Por defecto `exterior`. */
  sala?: SalaId | undefined;
}

/** Lo que la escena avisa (callbacks nuevos de `EscenaBase`). */
export interface AvisosEscena {
  /**
   * Cambió lo que hay al alcance (lugar, actor o puerta), o `null`. Se emite al montar y en cada
   * cambio. Convive con `onLugarCercano`, que queda por compatibilidad.
   */
  onInteractivo?: ((cerca: Interactivo | null) => void) | undefined;
}

/** El lugar al alcance como `Interactivo`. */
export function interactivoDeLugar(lugar: LugarObjetivo | null): Interactivo | null {
  return lugar ? { tipo: "lugar", lugar } : null;
}

/** La cara de la guía de Iris (`normal` | `error`) en la pantalla del rover. */
export function caraIrisModelo(cara: CaraIrisGuia): CaraIrisModelo {
  return cara === "error" ? "error" : "atenta";
}

// --- Retratos: los personajes de la alternativa B pre-renderizados a PNG (tarea P5) ---

/** Caras que se exportan como retrato. Las bocas de habla son cuadros de animación, no retratos. */
export const CARAS_RETRATO_PERSONA = ["neutral", "feliz", "pensando", "preocupado"] as const satisfies readonly Expresion[];
export const CARAS_RETRATO_IRIS = ["atenta", "feliz", "pensando", "error", "apagada"] as const satisfies readonly CaraIrisModelo[];

export type CaraRetratoPersona = (typeof CARAS_RETRATO_PERSONA)[number];
export type CaraRetratoIris = (typeof CARAS_RETRATO_IRIS)[number];
export type CaraRetrato = CaraRetratoPersona | CaraRetratoIris;

/**
 * Ruta del retrato dentro de `ui/public/`, sin barra inicial: la pantalla le antepone
 * `import.meta.env.BASE_URL`. El guion `tests/capturas/retratos.mjs` escribe exactamente estas rutas.
 */
export function rutaRetrato(actor: "iris", cara: CaraRetratoIris): string;
export function rutaRetrato(actor: IdPersonaje, cara: CaraRetratoPersona): string;
export function rutaRetrato(actor: ActorId, cara: CaraRetrato): string {
  return `retratos/${actor}-${cara}.png`;
}
