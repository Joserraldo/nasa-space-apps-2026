import type { GameState } from "@solar-shield/contracts";
import { DURACION_TORMENTA_TICKS } from "@solar-shield/design";
import { MISION_JEZERO } from "@solar-shield/missions";

/**
 * ¿La tormenta está haciendo daño en este tick? (#113)
 * Empieza cuando se revela (MISION_JEZERO.tickTormenta) y dura DURACION_TORMENTA_TICKS (design/).
 * Antes de revelarse no cobra nada; después de la ventana, tampoco.
 */
export function tormentaEnCurso(estado: Pick<GameState, "tormenta" | "tick">): boolean {
  if (estado.tormenta === null) return false;
  const inicio = MISION_JEZERO.tickTormenta;
  return estado.tick >= inicio && estado.tick < inicio + DURACION_TORMENTA_TICKS;
}
