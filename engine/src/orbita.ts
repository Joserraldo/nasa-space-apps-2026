import type { GameState, Orbit } from "@solar-shield/contracts";
import { ORBITA } from "@solar-shield/design";

function pct(v: number): number {
  return Math.max(0, Math.min(100, v));
}

/** Ticks por vuelta según la altura (más alto, más lento). */
export function ticksPorVuelta(alturaKm: number): number {
  return ORBITA.ticksPorVueltaBase + Math.floor(Math.max(0, alturaKm - 300) / ORBITA.kmPorTickExtra);
}

/** ¿En este tick el satélite está al sol? Mitad de la vuelta sí, mitad no. Determinista por tick. */
export function alSol(tick: number, alturaKm: number): boolean {
  const vuelta = ticksPorVuelta(alturaKm);
  return tick % vuelta < Math.ceil(vuelta / 2);
}

/** Franja de contacto 0-1: depende de la altura y de dónde va en la vuelta. */
export function franjaEn(tick: number, alturaKm: number): number {
  const vuelta = ticksPorVuelta(alturaKm);
  const fase = (tick % vuelta) / vuelta; // 0..1
  const ancho = Math.min(1, ORBITA.franjaBase + (alturaKm - 300) * ORBITA.franjaPorKm);
  // Contacto pleno en el centro de la pasada, cae hacia los extremos.
  const distanciaAlCentro = Math.abs(fase - 0.5) * 2; // 0 centro, 1 extremos
  return Math.max(0, Math.min(1, ancho * (1 - distanciaAlCentro)));
}

/**
 * Un tick de órbita. Puro. La tormenta desgasta el escudo; la antena averiada baja la señal;
 * la órbita baja pierde altura por arrastre.
 */
export function avanzarOrbita(
  orbita: Orbit,
  tick: number,
  intensidadTormenta: number,
  antenaAveriada: boolean,
): Orbit {
  let alturaKm = orbita.alturaKm;
  if (alturaKm < ORBITA.arrastreBajoKm) alturaKm = Math.max(ORBITA.alturaMinKm, alturaKm - ORBITA.arrastreKmPorTick);

  const franja = franjaEn(tick, alturaKm);
  const bateriaPct = pct(orbita.bateriaPct + (alSol(tick, alturaKm) ? ORBITA.cargaSolPct : -ORBITA.gastoSombraPct));
  const senalPct = pct(franja * 100 - (antenaAveriada ? ORBITA.castigoAntenaAveriadaPct : 0));
  const escudoPct = pct(orbita.escudoPct - intensidadTormenta * ORBITA.desgastePorIntensidadPct);

  return { alturaKm, franja, bateriaPct, senalPct, escudoPct };
}

/** Cambia la altura dentro de los límites. Usado por la acción ajustar_orbita. */
export function ajustarAltura(orbita: Orbit, deltaKm: number): Orbit {
  const alturaKm = Math.max(ORBITA.alturaMinKm, Math.min(ORBITA.alturaMaxKm, orbita.alturaKm + deltaKm));
  return { ...orbita, alturaKm };
}

/** Señal de daño de la tormenta sobre la base, 0-1. En Marte, si RAD lo midió, manda la medición. */
export function senalDeDano(estado: Pick<GameState, "tormenta" | "sitio">): number {
  const t = estado.tormenta;
  if (!t) return 0;
  const enMarte = estado.sitio === "marte_jezero" || estado.sitio === "marte_polo_norte";
  if (enMarte && t.medicionMarte) {
    // factor = pico/fondo medido por RAD. ×1.5 apenas se nota; ×20 es tormenta fuerte.
    return Math.max(0, Math.min(1, Math.log10(t.medicionMarte.factor) / Math.log10(20)));
  }
  return t.intensidad;
}
