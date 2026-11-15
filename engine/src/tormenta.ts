import type { GameState } from "@solar-shield/contracts";
import { DURACION_TORMENTA_TICKS } from "@solar-shield/design";
import { MISION_JEZERO, type Mision } from "@solar-shield/missions";

/**
 * ¿La tormenta está haciendo daño en este tick? (#113)
 * Empieza cuando se revela (mision.tickTormenta) y dura DURACION_TORMENTA_TICKS (design/).
 * Antes de revelarse no cobra nada; después de la ventana, tampoco.
 */
export function tormentaEnCurso(estado: Pick<GameState, "tormenta" | "tick">, mision: Pick<Mision, "tickTormenta"> = MISION_JEZERO): boolean {
  if (estado.tormenta === null) return false;
  const inicio = mision.tickTormenta;
  return estado.tick >= inicio && estado.tick < inicio + DURACION_TORMENTA_TICKS;
}
