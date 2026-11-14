import { CONFIDENCE_THRESHOLD, type ClassifierOutput, type Expert, type GameState } from "@solar-shield/contracts";
import { clasificarConAtajos } from "./atajos.js";
import type { Dialogo, ReferenciaDosis } from "./dialogo.js";
import { vistaVisible } from "./director.js";
import { responder } from "./expertos.js";
import { irisDanada } from "./iris.js";

/**
 * Una sola entrada para el panel de tripulación de ui (#59): botón de experto o texto libre
 * → un Dialogo. ui no arma ClassifierOutput ni decide nada: solo pinta lo que vuelve.
 */

/** Pregunta por defecto al tocar el botón de un experto. */
export const PREGUNTA_DEL_BOTON: Record<Expert | "ia_base", ClassifierOutput["accion"]> = {
  ingeniera: "estado_energia",
  doctora: "estado_salud",
  meteorologa: "pronostico",
  matematico: "que_pasa_si",
  control_mision: "ayuda",
  ia_base: "ayuda",
};

export function preguntaDelBoton(experto: Expert | "ia_base"): ClassifierOutput {
  return { version: "0", experto, accion: PREGUNTA_DEL_BOTON[experto], parametros: {}, confianza: 1, fuente: "boton" };
}

export type Entrada = { texto: string } | { experto: Expert | "ia_base" };

export interface OpcionesConversar {
  /** `tormentaActiva(estado)` del motor: antes del paso 5 nadie habla de la tormenta. */
  tormentaActiva: boolean;
  dosisMarte?: ReferenciaDosis;
  /** Veces que Iris ya falló en la partida (la 1.ª es el número falso). */
  vecesFallaIris?: number;
}

export function conversar(entrada: Entrada, estado: GameState, o: OpcionesConversar): Dialogo {
  const v = vistaVisible(estado, o.tormentaActiva);
  // Texto que nadie entiende → aclaración con botones (confianza 0), nunca un silencio.
  const salida =
    "texto" in entrada
      ? clasificarConAtajos(entrada.texto) ?? { version: "0", experto: "ia_base", accion: "fuera_de_tema", parametros: {}, confianza: 0, fuente: "regex" }
      : preguntaDelBoton(entrada.experto);
  // A Iris dañada no se le puede creer: cualquier cosa que se le pida a ella sale con su falla.
  if (salida.experto === "ia_base" && v.iaBase === "danada" && salida.confianza >= CONFIDENCE_THRESHOLD && salida.accion !== "saludo" && salida.accion !== "fuera_de_tema") {
    return irisDanada(v, o.vecesFallaIris ?? 0);
  }
  return responder(salida, v, o.dosisMarte ? { dosisMarte: o.dosisMarte } : {});
}
