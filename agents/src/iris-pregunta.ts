import type { BaseAiLevel } from "@solar-shield/contracts";
import type { Dialogo } from "./dialogo.js";

/**
 * Pregunta de Iris en nivel 2 (pistas), inspirada en los quizzes de ARES (CamiloM21/ares-mission-trainer).
 * Nunca bloquea: el niño puede saltarla, y responda lo que responda Iris explica el porqué.
 * No da puntos ni quita recursos: solo enseña a relacionar el problema con el sistema.
 */
export type TemaPregunta = "panel_solar" | "reciclador_agua" | "invernadero" | "escudo" | "tormenta";

export interface PreguntaIris {
  tema: TemaPregunta;
  dialogo: Dialogo;
  /** Claves i18n de las 3 opciones, en el orden en que se muestran. */
  opcionesKeys: [string, string, string];
  /** Índice de la opción correcta (varía por tema para que no sea siempre la primera). */
  correcta: 0 | 1 | 2;
  /** Siempre se puede saltar. */
  saltable: true;
}

const CORRECTA: Record<TemaPregunta, 0 | 1 | 2> = {
  panel_solar: 1,
  reciclador_agua: 0,
  invernadero: 2,
  escudo: 1,
  tormenta: 0,
};

export function preguntaIris(tema: TemaPregunta, nivel: BaseAiLevel): PreguntaIris | null {
  if (nivel !== "pistas") return null;
  const base = `agentes.iris.pregunta.${tema}`;
  return {
    tema,
    dialogo: { experto: "ia_base", prioridad: "charla", lineas: [{ clave: `${base}.texto` }] },
    opcionesKeys: [`${base}.a`, `${base}.b`, `${base}.c`],
    correcta: CORRECTA[tema],
    saltable: true,
  };
}

/** Respuesta de Iris: dice si acertó (sin regañar) y siempre explica. `null` = el niño la saltó. */
export function responderPreguntaIris(p: PreguntaIris, elegida: 0 | 1 | 2 | null): Dialogo {
  const base = `agentes.iris.pregunta.${p.tema}`;
  const veredicto = elegida === null ? "agentes.iris.pregunta.saltada" : elegida === p.correcta ? "agentes.iris.pregunta.bien" : "agentes.iris.pregunta.casi";
  return { experto: "ia_base", prioridad: "charla", lineas: [{ clave: veredicto }, { clave: `${base}.porque` }] };
}
