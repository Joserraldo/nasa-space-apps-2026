/**
 * Primitivas geométricas de anillos transversales (superelipses horizontales con frente y espalda
 * independientes) compartidas por cuerpo, cabeza y fichas de proporción.
 */

export type V3 = [number, number, number];

/** Sección transversal: superelipse horizontal con frente y espalda independientes. */
export interface Anillo {
  y: number;
  rx: number;
  rz: number;
  /** Radio hacia atrás (-Z). Si falta, igual a `rz`. */
  rzB?: number;
  cx?: number;
  cz?: number;
  /** Exponente de la superelipse: 2 = elipse, mayor = más cuadrada. */
  n?: number;
}

const potenciaConSigno = (v: number, e: number) => Math.sign(v) * Math.abs(v) ** e;

/** Punto del anillo en el ángulo `t` (0 = frente +Z, positivo hacia +X, la izquierda del personaje). */
export function puntoAnillo(a: Anillo, t: number): V3 {
  const e = 2 / (a.n ?? 2);
  const s = potenciaConSigno(Math.sin(t), e);
  const c = potenciaConSigno(Math.cos(t), e);
  return [(a.cx ?? 0) + a.rx * s, a.y, (a.cz ?? 0) + (c >= 0 ? a.rz : (a.rzB ?? a.rz)) * c];
}

export function puntosAnillo(a: Anillo, segmentos: number, fase = Math.PI / segmentos): V3[] {
  const p: V3[] = [];
  for (let i = 0; i < segmentos; i++) p.push(puntoAnillo(a, fase + (i * 2 * Math.PI) / segmentos));
  return p;
}
