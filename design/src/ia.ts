import type { Difficulty } from "@solar-shield/contracts";

/**
 * Umbrales de la IA de la base (PLAN §2.4 y §2.6). Solo datos; las reglas viven en engine/ia.ts.
 * Todo se calcula desde el estado: nada de azar fuera de la semilla.
 */
export const IA = {
  /** Recurso por encima de este valor cuenta como "sano" para la racha. */
  umbralSano: 40,
  /** Recurso por debajo de este valor cuenta como error. */
  umbralPeligro: 25,
  /** Racha de ticks sanos para que la IA suba un nivel (se apaga antes si el niño acierta). */
  aciertosParaSubir: 4,
  /** Errores recientes para que la IA baje un nivel ("se repara" y ayuda). */
  erroresParaBajar: 2,
  /** Ticks sin decidir para que la IA baje un nivel. */
  ticksQuietoParaBajar: 3,
  /** Cada cuántos ticks se perdona un error. */
  ticksParaOlvidarError: 4,
} as const;

/** Blindaje por debajo del cual la radiación daña la IA durante una tormenta. Fácil: casi nunca. */
export const BLINDAJE_DANA_IA: Record<Difficulty, number> = {
  facil: 5,
  media: 20,
  dificil: 35,
  hardcore: 45,
};
