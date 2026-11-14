import type { Seed, SpaceWeatherEvent } from "@solar-shield/contracts";
import { eventosCurados } from "@solar-shield/data";
import { crearPartida, type OpcionesPartida } from "./escenario.js";
import { elegir, hashSeed } from "./rng.js";
import type { CandidatoSitio } from "./sitio.js";

const FECHA_ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Semilla del reto del día. La fecha la pasa la UI (nunca Date.now aquí). */
export function semillaDelDia(fechaISO: string): Seed {
  if (!FECHA_ISO.test(fechaISO)) throw new Error("fecha inválida, se espera AAAA-MM-DD");
  return `reto-${fechaISO}`;
}

/**
 * Reto del día: misma fecha, mismo escenario para todo un salón. Siempre en Jezero (ruta dorada),
 * dificultad media. Por defecto sortea una tormenta real del catálogo curado de data/.
 */
export function retoDelDia(
  fechaISO: string,
  tormentas: readonly SpaceWeatherEvent[] = eventosCurados as readonly SpaceWeatherEvent[],
  extra: OpcionesPartida = {},
) {
  return crearPartida(semillaDelDia(fechaISO), { sitio: "marte_jezero", dificultad: "media", tormentas, ...extra });
}

/** Región (sitio candidato dentro del lugar) sorteada por semilla: cada partida aterriza en otro punto. */
export function regionPorSemilla(seed: Seed, candidatos: readonly CandidatoSitio[]): CandidatoSitio {
  return elegir(hashSeed(`${seed}#region`), candidatos).elegido;
}
