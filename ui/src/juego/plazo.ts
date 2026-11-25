import type { GameState } from "@solar-shield/contracts";
import { aplicarAccion, puedeAplicar, telemetriaPendiente, tormentaActiva } from "@solar-shield/engine";
import type { Mision } from "@solar-shield/missions";

/**
 * El plazo de la telemetría en el HUD: el turno máximo de la misión y, si enviarla ahora sirviera,
 * el turno en que llegaría la respuesta de la Tierra. El retraso lo decide el motor: aquí se aplica
 * la acción sobre una copia y se lee el efecto pendiente, sin repetir sus números.
 */
export interface DatosPlazo {
  limite: number;
  llegadaSiEnvia?: number | undefined;
}

export function plazoTelemetria(estado: GameState, mision: Mision): DatosPlazo {
  const limite = mision.fin.tickLimite;
  // Si ya se envió (aunque aún esté en camino o ya haya llegado), no se promete otra llegada.
  const yaEnviada = estado.causas.some((c) => c.accion?.tipo === "enviar_telemetria");
  let llegadaSiEnvia: number | undefined;
  if (
    tormentaActiva(estado, mision) &&
    !telemetriaPendiente(estado) &&
    !yaEnviada &&
    estado.resultado === "en_curso" &&
    puedeAplicar(estado, { tipo: "enviar_telemetria" }, mision).ok
  ) {
    llegadaSiEnvia = telemetriaPendiente(aplicarAccion(estado, { tipo: "enviar_telemetria" }, mision))?.llegaEnTick ?? undefined;
  }
  return { limite, llegadaSiEnvia };
}
