/** Dificultad de Ajustes hacia el motor, y las reglas que dependen de ella. */
import type { SettingsState } from "../ui/state/settings";
import { effectiveDifficulty } from "../ui/state/settings";
import type { Difficulty, Mision } from "./motor";

const MOTOR = { easy: "facil", medium: "media", hard: "dificil", hardcore: "hardcore" } as const;

export function dificultadDe(ajustes: SettingsState): Difficulty {
  return MOTOR[effectiveDifficulty(ajustes)];
}

/** La misión con la dificultad elegida; el motor no cambia. */
export function misionPara(mision: Mision, ajustes: SettingsState): Mision {
  return { ...mision, dificultad: dificultadDe(ajustes) };
}

/** R2: en Easy no se muestran números. */
export function muestraNumeros(ajustes: SettingsState): boolean {
  return effectiveDifficulty(ajustes) !== "easy";
}
