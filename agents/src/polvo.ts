import type { Action, SourceCard } from "@solar-shield/contracts";
import type { Dialogo } from "./dialogo.js";
import type { VistaAgente } from "./expertos.js";

/**
 * Paso 4b de la misión 1 (docs/ideas/mision-1-ares-mejorada.md): mala suerte, polvo en los paneles.
 * Idea rescatada de ARES (limpiar paneles), pero ahora limpiar cuesta: salir de la base expone a
 * la tripulación. La Ingeniera quiere limpiar; la Doctora recuerda el costo; el niño decide.
 */
export interface ContextoPolvo {
  /** Fuente del caso real (InSight se apagó por polvo en sus paneles). La pasa datos; sin ella no se cita. */
  insight?: SourceCard;
}

export interface EscenaPolvo {
  dialogos: Dialogo[];
  /** Limpiar (salida exterior al panel) o aguantar con menos energía. */
  opciones: [Action, Action];
}

export function escenaPolvo(v: VistaAgente, c: ContextoPolvo = {}): EscenaPolvo | null {
  // Sin panel solar instalado no hay nada que limpiar.
  if (!("panel_solar" in v.equipos)) return null;
  const limpiar: Action = { tipo: "salida_exterior", objetivo: "panel_solar" };
  const aguantar: Action = { tipo: "esperar" };

  const ingeniera: Dialogo = {
    experto: "ingeniera",
    prioridad: "alerta",
    accion: limpiar,
    lineas: [
      { clave: "agentes.polvo.ingeniera.alerta", vars: { energia: Math.round(v.recursos.energia) } },
      { clave: "agentes.polvo.ingeniera.limpiar" },
    ],
  };
  const real: Dialogo | null = c.insight
    ? { experto: "ingeniera", prioridad: "charla", fuente: c.insight, lineas: [{ clave: "agentes.polvo.ingeniera.insight" }] }
    : null;
  // La Meteoróloga explica de dónde sale el polvo: ciencia general, sin cifras (no necesita tarjeta).
  const meteorologa: Dialogo = { experto: "meteorologa", prioridad: "charla", lineas: [{ clave: "agentes.polvo.meteorologa.viento" }] };
  const doctora: Dialogo = {
    experto: "doctora",
    prioridad: "consejo",
    accion: aguantar,
    lineas: [{ clave: "agentes.polvo.doctora.costo" }],
  };
  const iris: Dialogo = { experto: "ia_base", prioridad: "charla", lineas: [{ clave: "agentes.polvo.elige" }] };

  return { dialogos: [ingeniera, ...(real ? [real] : []), meteorologa, doctora, iris], opciones: [limpiar, aguantar] };
}
