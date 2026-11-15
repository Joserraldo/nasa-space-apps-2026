import type { GameState } from "@solar-shield/contracts";
import { MISION_JEZERO, type Mision } from "@solar-shield/missions";
import { aplicarAccion, aplicarEfecto, modulosColocados } from "./acciones.js";

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
  const s = aplicarAccion(estado, opcion.accion, mision);
  if (s === estado || !opcion.extra) return s;
  if (opcion.extraSiTiene && !modulosColocados(estado).includes(opcion.extraSiTiene)) return s;
  return aplicarEfecto(s, opcion.extra, "causa.apagar_invernadero", `dilema-${opcion.id}`);
}
