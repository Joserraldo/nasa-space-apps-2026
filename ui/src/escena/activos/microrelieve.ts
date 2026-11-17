/**
 * Microrrelieve del claro de la base (Etapa BC, ronda 2): ondulaciones de 10-50 cm, ondas de viento
 * orientadas y montículos chicos. Es parte de la misma función de altura que dibuja el terreno
 * (`relieve.ts`) y la física lo sigue (`Terreno.relieve` de `fisica.ts`): nada flota ni se hunde.
 *
 * Referencias (regla 11 de `docs/referenciapau/exterior/00-comun.md`), en `ss-referencias`:
 * - Ondulaciones y montículos: `occupy-mars-2`, primer plano (el suelo cerca del rover no es plano).
 * - Ondas de viento: `occupy-mars-2`, primer plano (ondas paralelas en la arena) y `surviving-mars-8`.
 *
 * Donde se apoya la base el suelo queda en y = 0: bajo edificios, módulos, decorado, banco, caminos,
 * plaza, balizas y los puntos de uso de cada lugar, con una transición de ~1 m. Esa máscara es una
 * rejilla que se calcula una sola vez.
 */
import { CAMINO, CAMINOS, PLAZA, TRONCAL } from "./caminos";
import { DECORADO, distanciaAHuella, huellasBase } from "./baseExterior";
import { huellasModulos } from "./modulosArmados";
import { BANCO, LUGARES } from "../mundo";
import { fbm, ruido } from "./relieve";

/** Amplitudes (m) y escalas. [E] */
export const MICRORRELIEVE = {
  ondulacion: { alto: 0.22, onda: 7 },
  viento: { alto: 0.07, onda: 2.3, direccion: [0.8, 0.6] as const },
  monticulo: { alto: 0.4, celda: 6.5, probabilidad: 0.4, radio: [1, 2.4] as const },
  /** Distancia (m) a una pieza de la base desde la que el microrrelieve vale entero. */
  transicion: 1.1,
  /** Se apaga entre estos radios (afuera mandan las dunas y las mesetas de la zona). */
  fin: [55, 75] as const,
  semilla: 3141,
} as const;

const ss = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function hash(ix: number, iz: number, s: number): number {
  let h = Math.imul(ix | 0, 2654435761) ^ Math.imul(iz | 0, 1597334677) ^ Math.imul(s | 0, 3812015801);
  h = Math.imul(h ^ (h >>> 15), 2246822519);
  h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}

/** Microrrelieve sin máscara (m). */
export function microrrelieveLibre(x: number, z: number): number {
  const M = MICRORRELIEVE;
  const s = M.semilla;
  // Ondulación ancha.
  let h = (fbm(x / M.ondulacion.onda, z / M.ondulacion.onda, 3, s) - 0.5) * 2 * M.ondulacion.alto;
  // Ondas de viento: perfil asimétrico (lomo suave a barlovento, cara corta a sotavento), en parches.
  const [dx, dz] = M.viento.direccion;
  const fase = (x * dx + z * dz) / M.viento.onda + 1.5 * ruido(x / 9, z / 9, s + 1);
  const f = fase - Math.floor(fase);
  const perfil = f < 0.75 ? f / 0.75 : (1 - f) / 0.25;
  h += (perfil - 0.5) * M.viento.alto * ss(0.35, 0.7, ruido(x / 11 + 3, z / 11 - 2, s + 2));
  // Montículos: uno al azar por celda, gaussiano.
  const m = M.monticulo;
  const cx = Math.floor(x / m.celda), cz = Math.floor(z / m.celda);
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      const ix = cx + i, iz = cz + j;
      if (hash(ix, iz, s + 3) > m.probabilidad) continue;
      const px = (ix + hash(ix, iz, s + 4)) * m.celda, pz = (iz + hash(ix, iz, s + 5)) * m.celda;
      const r = m.radio[0] + (m.radio[1] - m.radio[0]) * hash(ix, iz, s + 6);
      const d2 = ((x - px) ** 2 + (z - pz) ** 2) / (r * r);
      if (d2 < 4) h += m.alto * (0.5 + 0.5 * hash(ix, iz, s + 7)) * Math.exp(-d2 * 1.6);
    }
  }
  return h;
}

// ---------------------------------------------------------------------------------------------
// Máscara de la base
// ---------------------------------------------------------------------------------------------

/** Rejilla de la máscara: lado (m, centrada en el origen) y celdas por lado. */
const REJILLA = { lado: 72, n: 192 } as const;
let mascara: Float32Array | null = null;

function distanciaSegmento(x: number, z: number, a: readonly [number, number], b: readonly [number, number]): number {
  const dx = b[0] - a[0], dz = b[1] - a[1];
  const l2 = dx * dx + dz * dz || 1e-9;
  const u = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / l2));
  return Math.hypot(x - a[0] - dx * u, z - a[1] - dz * u);
}

/** Distancia (m) a la pieza de la base más cercana (0 encima). */
export function distanciaABase(x: number, z: number): number {
  let d = Infinity;
  for (const tramo of CAMINOS) {
    const semiancho = (TRONCAL.includes(tramo) ? CAMINO.anchoTroncal : CAMINO.ancho) / 2 + 0.35;
    for (let i = 1; i < tramo.length; i++) d = Math.min(d, distanciaSegmento(x, z, tramo[i - 1]!, tramo[i]!) - semiancho);
  }
  d = Math.min(d, Math.hypot(Math.max(PLAZA.x0 - x, 0, x - PLAZA.x1), Math.max(PLAZA.z0 - z, 0, z - PLAZA.z1)) - 0.3);
  d = Math.min(d, Math.hypot(Math.max(BANCO.x0 - x, 0, x - BANCO.x1), Math.max(BANCO.zBajo - z, 0, z - BANCO.zFondo)) - 0.3);
  for (const h of [...huellasBase(), ...huellasModulos()]) d = Math.min(d, distanciaAHuella(h, x, z) - 0.4);
  for (const o of DECORADO) d = Math.min(d, Math.hypot(x - o.x, z - o.z) - o.radio);
  for (const l of LUGARES) d = Math.min(d, Math.hypot(x - l.x, z - l.z) - 1.2);
  return Math.max(0, d);
}

function rejillaMascara(): Float32Array {
  if (mascara) return mascara;
  const { lado, n } = REJILLA;
  const m = new Float32Array(n * n);
  for (let f = 0; f < n; f++) {
    for (let c = 0; c < n; c++) {
      const x = (c / (n - 1) - 0.5) * lado, z = (f / (n - 1) - 0.5) * lado;
      m[f * n + c] = ss(0, MICRORRELIEVE.transicion, distanciaABase(x, z));
    }
  }
  return (mascara = m);
}

/** Máscara bilineal: 0 sobre la base, 1 en suelo libre. Fuera de la rejilla, 1. */
export function mascaraBase(x: number, z: number): number {
  const { lado, n } = REJILLA;
  const u = (x / lado + 0.5) * (n - 1), v = (z / lado + 0.5) * (n - 1);
  if (u < 0 || v < 0 || u > n - 1 || v > n - 1) return 1;
  const m = rejillaMascara();
  const c = Math.min(n - 2, Math.floor(u)), f = Math.min(n - 2, Math.floor(v));
  const fu = u - c, fv = v - f;
  const a = m[f * n + c]!, b = m[f * n + c + 1]!, d = m[(f + 1) * n + c]!, e = m[(f + 1) * n + c + 1]!;
  return a + (b - a) * fu + (d - a) * fv + (a - b - d + e) * fu * fv;
}

/** Microrrelieve del claro (m sobre el suelo de la base): el que dibuja el terreno y sigue la física. */
export function microrrelieve(x: number, z: number): number {
  const r = Math.hypot(x, z);
  const fin = 1 - ss(MICRORRELIEVE.fin[0], MICRORRELIEVE.fin[1], r);
  if (fin <= 0) return 0;
  const k = mascaraBase(x, z) * fin;
  return k <= 0 ? 0 : microrrelieveLibre(x, z) * k;
}
