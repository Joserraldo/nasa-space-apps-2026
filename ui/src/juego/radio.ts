import {
  avisoControlLuna,
  avisoNochePolar,
  escenaAntena,
  escenaMicrometeorito,
  sorpresaOutpost,
  tresLugares,
  vistaVisible,
  type Dialogo,
} from "@solar-shield/agents";
import type { Expert, GameState, Resource } from "@solar-shield/contracts";
import { telemetriaPendiente, tormentaActiva } from "@solar-shield/engine";
import type { Mision } from "@solar-shield/missions";
import { eventosDeTick } from "./eventos.js";

/**
 * EXPERIMENTAL: canal de radio de la tripulación. Decide QUIÉN avisa y QUÉ dice cuando pasa algo
 * importante entre dos estados del motor. Pura: misma entrada, mismos avisos.
 *
 * - Las voces propias de cada misión salen de agents/ (micrometeorito, antena, noche polar,
 *   Control lunar, sorpresa del Outpost, "una tormenta, tres lugares").
 * - Los avisos genéricos (avería, recurso bajo, efecto que llegó, Iris) son claves `ui.radio.*`
 *   con cifras del estado del juego, nunca inventadas.
 * - La tormenta en sí no pasa por aquí: tiene su propia pantalla con la escena de la misión.
 */

/** Por debajo de esto, el experto del recurso avisa (una vez, al cruzar el umbral). */
export const UMBRAL_BAJO = 30;

const EXPERTO_DE_RECURSO: Record<Resource, Expert> = {
  energia: "ingeniera",
  soporte_vital: "doctora",
  blindaje: "doctora",
};

const RECURSOS: readonly Resource[] = ["energia", "soporte_vital", "blindaje"];

/** Avisos al entrar a la base por primera vez (paso 4). */
export function avisosDeInicio(mision: Mision): Dialogo[] {
  if (mision.id === "outpost-sorpresa") return sorpresaOutpost();
  return [{ experto: "ia_base", prioridad: "charla", lineas: [{ clave: "ui.radio.inicio", vars: { misionKey: mision.nombreKey } }] }];
}

/** Avisos de un turno: compara el estado de antes con el de después. */
export function avisosDeRadio(antes: GameState, despues: GameState, mision: Mision): Dialogo[] {
  const avisos: Dialogo[] = [];
  const tormentaAntes = tormentaActiva(antes, mision);
  const tormentaAhora = tormentaActiva(despues, mision);
  const v = vistaVisible(despues, tormentaAhora);

  for (const e of eventosDeTick(antes, despues, mision)) {
    if (e.tipo === "averia") {
      // Voces propias de la misión; en Jezero y el polo norte, el polvo/escarcha del panel ya tiene su tarjeta.
      if (mision.id === "luna-polo-sur" && e.equipo === "panel_solar") avisos.push(...(escenaMicrometeorito(v)?.dialogos ?? []));
      else if (mision.id === "luna-lado-visible" && e.equipo === "antena") avisos.push(...(escenaAntena(v)?.dialogos ?? []));
      else if (e.equipo === "panel_solar" && mision.eventoPolvo) continue;
      else if (e.equipo !== "ia_base") {
        avisos.push({ experto: "ingeniera", prioridad: "alerta", lineas: [{ clave: "ui.radio.averia", vars: { equipoKey: `agentes.equipo.${e.equipo}` } }] });
      }
    } else if (e.tipo === "efecto_llego" && e.causa.recurso && (e.causa.delta ?? 0) > 0) {
      avisos.push({
        experto: EXPERTO_DE_RECURSO[e.causa.recurso],
        prioridad: "charla",
        lineas: [{ clave: "ui.radio.llego", vars: { recursoKey: `ui.recurso.${e.causa.recurso}`, delta: e.causa.delta ?? 0, causaKey: e.causa.descripcionKey } }],
      });
    } else if (e.tipo === "ia_cambio") {
      avisos.push({ experto: "ia_base", prioridad: e.a === "danada" ? "alerta" : "charla", lineas: [{ clave: `ui.radio.ia.${e.a}` }] });
    }
  }

  // Recurso que acaba de cruzar el umbral hacia abajo: avisa el experto de ese recurso.
  for (const r of RECURSOS) {
    const a = antes.recursos[r], d = despues.recursos[r];
    if (a >= UMBRAL_BAJO && d < UMBRAL_BAJO && d > 0) {
      avisos.push({ experto: EXPERTO_DE_RECURSO[r], prioridad: "alerta", lineas: [{ clave: `ui.radio.bajo.${r}`, vars: { valor: Math.round(d) } }] });
    }
  }

  // Se revela la tormenta: lo que toca después de decidir (paso 7) lo dice la voz de la misión.
  if (!tormentaAntes && tormentaAhora) {
    if (mision.id === "marte-polo-norte") avisos.push(...avisoNochePolar(v));
    else if (mision.id === "luna-polo-sur") avisos.push(avisoControlLuna());
    else if (mision.id !== "outpost-sorpresa") {
      avisos.push({ experto: "control_mision", prioridad: "consejo", accion: { tipo: "enviar_telemetria" }, lineas: [{ clave: "ui.radio.control.telemetria" }] });
    }
  }

  // Telemetría enviada: Control confirma y, en la Luna visible, la tormenta vista desde tres lugares.
  const tele = telemetriaPendiente(despues);
  if (!telemetriaPendiente(antes) && tele) {
    avisos.push({ experto: "control_mision", prioridad: "charla", lineas: [{ clave: "ui.radio.control.enviada", vars: { turnos: tele.ticksRestantes } }] });
    if (mision.id === "luna-lado-visible") avisos.push(...tresLugares(v));
  }
  return avisos;
}
