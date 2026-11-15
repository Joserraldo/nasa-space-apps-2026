import type { Cause, Equipment, GameState, Resource } from "@solar-shield/contracts";
import { novedades } from "@solar-shield/engine";
import { MISION_JEZERO, type Mision } from "@solar-shield/missions";

/**
 * Contrato de eventos de feedback (FLUJO §3). Lo define integración (José); lo
 * consumen la interfaz (Jaime), la escena (Daniel) y los personajes (María Paula).
 *
 * Es la ÚNICA fuente para animar, sonar o mostrar deltas: nadie compara estados por
 * su cuenta. Sale de `novedades(antes, despues)` del motor y cada evento lleva un id
 * estable (mismo par de estados → mismos ids), así una animación no se repite al
 * volver a renderizar.
 */
export type EventoFeedback =
  | { id: string; tipo: "recurso"; recurso: Resource; delta: number }
  | { id: string; tipo: "causa"; causa: Cause }
  | { id: string; tipo: "efecto_llego"; causa: Cause }
  | { id: string; tipo: "averia"; equipo: Equipment }
  | { id: string; tipo: "tormenta_llego" }
  | { id: string; tipo: "ia_cambio"; de: GameState["iaBase"]; a: GameState["iaBase"] }
  | { id: string; tipo: "fin"; resultado: Exclude<GameState["resultado"], "en_curso"> };

export type TipoEvento = EventoFeedback["tipo"];

const RECURSOS: readonly Resource[] = ["energia", "soporte_vital", "blindaje"];

export function eventosDeTick(antes: GameState, despues: GameState, mision: Mision = MISION_JEZERO): EventoFeedback[] {
  const n = novedades(antes, despues, mision);
  const t = `t${despues.tick}`;
  const eventos: EventoFeedback[] = [];

  if (n.tormentaLlego) eventos.push({ id: `${t}-tormenta`, tipo: "tormenta_llego" });
  for (const equipo of n.averiasNuevas as Equipment[]) eventos.push({ id: `${t}-averia-${equipo}`, tipo: "averia", equipo });
  if (n.iaCambio) eventos.push({ id: `${t}-ia-${n.iaCambio.a}`, tipo: "ia_cambio", ...n.iaCambio });

  for (const recurso of RECURSOS) {
    const delta = despues.recursos[recurso] - antes.recursos[recurso];
    if (delta !== 0) eventos.push({ id: `${t}-recurso-${recurso}`, tipo: "recurso", recurso, delta });
  }

  // El índice absoluto de la causa en `estado.causas` no cambia nunca: sirve de id.
  n.causasNuevas.forEach((causa, i) => {
    const id = `causa-${antes.causas.length + i}`;
    eventos.push({ id, tipo: "causa", causa });
    if (n.efectosLlegaron.includes(causa)) eventos.push({ id: `${id}-llego`, tipo: "efecto_llego", causa });
  });

  if (n.termino && n.termino !== "en_curso") eventos.push({ id: `${t}-fin`, tipo: "fin", resultado: n.termino });
  return eventos;
}
