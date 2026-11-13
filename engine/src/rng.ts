import type { Seed } from "@solar-shield/contracts";

/**
 * RNG determinista por semilla. Sin Math.random ni Date.now.
 * El estado es un entero sin signo de 32 bits que vive en GameState.rngEstado,
 * así cada paso del motor es una función pura (estado, ...) -> estado.
 */

/** Hash FNV-1a de 32 bits: convierte la semilla de texto en el estado inicial. */
export function hashSeed(seed: Seed): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  // Evita el estado 0, que degenera en mulberry32.
  return h === 0 ? 0x9e3779b9 : h;
}

export interface RngStep {
  /** Valor en [0, 1). */
  valor: number;
  /** Nuevo estado a guardar en GameState.rngEstado. */
  estado: number;
}

/** mulberry32: un paso. Devuelve el valor y el estado siguiente. */
export function siguiente(estado: number): RngStep {
  let t = (estado + 0x6d2b79f5) >>> 0;
  const nuevoEstado = t;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const valor = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { valor, estado: nuevoEstado };
}

/** Entero en [min, max], ambos incluidos. */
export function enteroEntre(estado: number, min: number, max: number): RngStep & { entero: number } {
  const paso = siguiente(estado);
  const entero = min + Math.floor(paso.valor * (max - min + 1));
  return { ...paso, entero };
}

/** Elige un elemento de una lista no vacía. */
export function elegir<T>(estado: number, lista: readonly T[]): RngStep & { elegido: T } {
  if (lista.length === 0) throw new Error("elegir: lista vacía");
  const paso = enteroEntre(estado, 0, lista.length - 1);
  return { valor: paso.valor, estado: paso.estado, elegido: lista[paso.entero] as T };
}
