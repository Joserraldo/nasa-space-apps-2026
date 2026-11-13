import type { Action } from "@solar-shield/contracts";
import { ENERGIA_POR_CANTIDAD } from "./a-accion.js";
import type { Dialogo } from "./dialogo.js";
import type { VistaAgente } from "./expertos.js";

/**
 * Paso 6 de la ruta dorada (#41): llega una tormenta real y dos expertos dan consejos opuestos,
 * cada uno con su dato. Ninguno es gratis: el refugio frena el trabajo y el soporte vital;
 * el escudo gasta energía. El jugador decide (los expertos nunca deciden por él).
 */
export interface EscenaTormenta {
  dialogos: Dialogo[];
  /** Las dos opciones en conflicto, en el orden en que se proponen. */
  opciones: [Action, Action];
}

export function escenaTormenta(v: VistaAgente): EscenaTormenta | null {
  const t = v.tormenta;
  if (!t) return null;
  const fecha = t.inicio.slice(0, 10);
  const medida = t.medicionMarte && t.medicionMarte.factor >= 1.5 ? Math.round(t.medicionMarte.factor) : null;
  const refugio: Action = { tipo: "refugiarse" };
  const escudo: Action = { tipo: "redistribuir_energia", hacia: "blindaje", cantidad: ENERGIA_POR_CANTIDAD.mucho };

  const meteorologa: Dialogo = {
    experto: "meteorologa",
    prioridad: "alerta",
    fuente: t.fuente,
    lineas: [
      { clave: "agentes.escena6.meteorologa.llega", vars: { fecha, nombreKey: `datos.tormenta.${t.id}.nombre` } },
      ...(t.marcoMarte ? [{ clave: `datos.marco.${t.marcoMarte}` }] : []),
    ],
  };
  // La Doctora cita lo que midió Curiosity (si hay medición); si no, solo el principio de protegerse.
  const doctora: Dialogo = {
    experto: "doctora",
    prioridad: "consejo",
    fuente: t.fuente,
    accion: refugio,
    lineas: [
      medida
        ? { clave: "agentes.escena6.doctora.medida", vars: { factor: medida } }
        : { clave: "agentes.escena6.doctora.sinMedida" },
      { clave: "agentes.escena6.doctora.costo" },
    ],
  };
  // La Ingeniera cita la energía del estado del juego: el escudo la gasta.
  const ingeniera: Dialogo = {
    experto: "ingeniera",
    prioridad: "consejo",
    accion: escudo,
    lineas: [
      { clave: "agentes.escena6.ingeniera.contra" },
      { clave: "agentes.escena6.ingeniera.costo", vars: { energia: Math.round(v.recursos.energia), gasto: ENERGIA_POR_CANTIDAD.mucho } },
    ],
  };
  const iris: Dialogo = { experto: "ia_base", prioridad: "charla", lineas: [{ clave: "agentes.escena6.elige" }] };

  return { dialogos: [meteorologa, doctora, ingeniera, iris], opciones: [refugio, escudo] };
}
