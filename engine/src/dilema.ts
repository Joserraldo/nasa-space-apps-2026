import type { GameState } from "@solar-shield/contracts";
import { MISION_JEZERO, type Mision } from "@solar-shield/missions";
import { aplicarAccion, aplicarAccionConExtra, aplicarEfecto, costoDe, modulosColocados } from "./acciones.js";

/**
 * Paso 6: el jugador elige una salida del dilema (`mision.dilemaPaso6`, Jezero por defecto).
 * Aplica la acción de esa opción y, si la opción tiene un efecto extra (p. ej. apagar el
 * invernadero dentro de refugiarse, plan B del #88), lo aplica solo si se construyó el módulo
 * indicado. Opción desconocida o acción rechazada por el motor → el estado no cambia.
 * No es una Action del contrato: no cambia contracts/.
 */
export function elegirDilema(estado: GameState, opcionId: string, mision: Mision = MISION_JEZERO): GameState {
  const opcion = mision.dilemaPaso6.opciones.find((o) => o.id === opcionId);
  if (!opcion) return estado;
  const extra = !opcion.extraSiTiene || modulosColocados(estado).includes(opcion.extraSiTiene) ? opcion.extra : undefined;
  if (extra) {
    const base = costoDe(opcion.accion, mision);
    const compensa = (["energia", "soporte_vital", "blindaje"] as const)
      .some((r) => (base.retrasado[r] ?? 0) * (extra.retrasado[r] ?? 0) < 0);
    // Ej. hielo: +15 y -15 de energía se cancelan antes de entrar en la cola.
    // Los extras disjuntos de Jezero conservan su camino y el orden anterior del RNG.
    if (compensa) return aplicarAccionConExtra(estado, opcion.accion, extra, mision);
  }
  const s = aplicarAccion(estado, opcion.accion, mision);
  if (s === estado || !extra) return s;
  return aplicarEfecto(s, extra, "causa.apagar_invernadero", `dilema-${opcion.id}`);
}
