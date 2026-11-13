/**
 * Escala de `intensidad` (0–1) del contrato. ESCALA DEL EQUIPO, no es una medición:
 * transforma valores reales de DONKI con reglas fijas y documentadas en
 * docs/science/intensidad.md. Ningún número se inventa: si falta el dato, no aporta.
 *
 *  - FLR: flujo GOES en escala logarítmica. C1 = 0, X10 = 1 (X1 ≈ 0,67; M1 ≈ 0,33).
 *  - CME: velocidad lineal. 300 km/s = 0, 2500 km/s = 1.
 *  - GST: Kp / 9.
 *  - SEP: DONKI no da magnitud → no aporta.
 *  Evento = máximo de sus fases.
 */
import type { Fase } from "./tormenta";

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

const BASE_GOES: Record<string, number> = { A: 1e-8, B: 1e-7, C: 1e-6, M: 1e-5, X: 1e-4 };

/** Flujo pico en W/m² a partir de la clase GOES ("X8.7" → 8.7e-4). */
export function flujoGoes(clase: string): number {
  const m = /^([ABCMX])(\d+(?:\.\d+)?)$/.exec(clase);
  if (!m) throw new Error(`clase GOES inválida: ${clase}`);
  return BASE_GOES[m[1]] * Number(m[2]);
}

export const intensidadFulguracion = (clase: string) =>
  clamp01((Math.log10(flujoGoes(clase)) + 6) / 3);
export const intensidadCme = (kmS: number) => clamp01((kmS - 300) / 2200);
export const intensidadKp = (kp: number) => clamp01(kp / 9);

export function intensidadFase(f: Fase): number | null {
  if (f.tipo === "FLR" && f.claseGoes) return intensidadFulguracion(f.claseGoes);
  if (f.tipo === "CME" && f.velocidadKmS) return intensidadCme(f.velocidadKmS);
  if (f.tipo === "GST" && f.kpMax !== undefined) return intensidadKp(f.kpMax);
  return null;
}

/** Redondeo a 2 decimales para que sea estable y legible. */
export const redondear = (x: number) => Math.round(x * 100) / 100;
