/**
 * Física espacial de la escena: contactos, pendiente y caída. Pura (sin three ni DOM) para probarla
 * sin navegador. NO calcula energía, soporte vital, blindaje ni resultado: eso es del motor.
 */

/**
 * Gravedad en la superficie de Marte, m/s². Fuente: NASA NSSDC, Mars Fact Sheet
 * (docs/science/fuentes.md, verificado por datos el 13 nov 2026).
 */
export const GRAVEDAD_MARTE = 3.73;
/** La misma ficha da la gravedad de Marte como 0,380 veces la de la Tierra; de ahí sale la terrestre. */
export const RELACION_MARTE_TIERRA = 0.38;
export const GRAVEDAD_TIERRA = GRAVEDAD_MARTE / RELACION_MARTE_TIERRA;
export const FUENTE_GRAVEDAD = {
  url: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html",
  consultadoEl: "2026-11-13",
} as const;

/** Paso fijo de la física. Es otro reloj que el tick de recursos del motor. */
export const PASO_FISICO = 1 / 60;
export const MAX_SUBPASOS = 5;
/** Escalón más alto que el personaje sube sin rampa, en metros. */
export const ESCALON_MAX = 0.3;
const REBOTE = 0.2;
const VEL_MIN_REBOTE = 0.9;

export interface Circulo {
  x: number;
  z: number;
  r: number;
}
/** Segmento sobre el eje X con radio: la forma del hábitat (un cilindro acostado). */
export interface Capsula {
  x0: number;
  x1: number;
  z: number;
  r: number;
}
/** Tramo inclinado: sube de 0 a `alto` entre zBajo y zAlto. */
export interface Rampa {
  x0: number;
  x1: number;
  zBajo: number;
  zAlto: number;
  alto: number;
}
export interface Plataforma {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  alto: number;
}
export interface Terreno {
  circulos: readonly Circulo[];
  capsulas: readonly Capsula[];
  rampas: readonly Rampa[];
  plataformas: readonly Plataforma[];
  /** Radio de la zona jugable, centrada en el origen. */
  limite: number;
}

function entre(v: number, a: number, b: number): boolean {
  return v >= Math.min(a, b) && v <= Math.max(a, b);
}

/** Altura del suelo en un punto: plano, rampa o plataforma. */
export function alturaSuelo(x: number, z: number, t: Pick<Terreno, "rampas" | "plataformas">): number {
  let h = 0;
  for (const p of t.plataformas) {
    if (entre(x, p.x0, p.x1) && entre(z, p.z0, p.z1)) h = Math.max(h, p.alto);
  }
  for (const r of t.rampas) {
    if (entre(x, r.x0, r.x1) && entre(z, r.zBajo, r.zAlto)) {
      h = Math.max(h, r.alto * ((z - r.zBajo) / (r.zAlto - r.zBajo)));
    }
  }
  return h;
}

/** Saca un punto de los obstáculos sólidos y lo mantiene dentro de la zona jugable. */
export function resolver(p: { x: number; z: number }, radio: number, t: Terreno, extra: readonly Circulo[] = []): void {
  const empujar = (cx: number, cz: number, cr: number) => {
    const dx = p.x - cx;
    const dz = p.z - cz;
    const d = Math.hypot(dx, dz);
    const m = cr + radio;
    if (d < m && d > 1e-4) {
      p.x = cx + (dx / d) * m;
      p.z = cz + (dz / d) * m;
    }
  };
  for (const c of t.circulos) empujar(c.x, c.z, c.r);
  for (const c of extra) empujar(c.x, c.z, c.r);
  for (const c of t.capsulas) empujar(Math.max(c.x0, Math.min(c.x1, p.x)), c.z, c.r);
  const l = Math.hypot(p.x, p.z);
  if (l > t.limite) {
    p.x *= t.limite / l;
    p.z *= t.limite / l;
  }
}

export interface Caida {
  y: number;
  vy: number;
  apoyado: boolean;
}

/**
 * Un paso de caída libre con contacto contra el suelo (Euler semi-implícito, sin aire).
 * Vale igual para la caja y para el personaje; `g` decide en qué mundo cae.
 */
export function pasoCaida(c: Caida, suelo: number, g: number, dt: number, rebota = false): Caida {
  if (c.apoyado && c.y <= suelo + 1e-6) return { y: suelo, vy: 0, apoyado: true };
  const vy = c.vy - g * dt;
  const y = c.y + vy * dt;
  if (y > suelo) return { y, vy, apoyado: false };
  if (rebota && -vy > VEL_MIN_REBOTE) return { y: suelo, vy: -vy * REBOTE, apoyado: false };
  return { y: suelo, vy: 0, apoyado: true };
}

export interface Cuerpo extends Caida {
  x: number;
  z: number;
}

/**
 * Mueve al personaje: avanza, resuelve contactos, sube pendientes y escalones bajos, no atraviesa
 * bordes altos y cae con la gravedad de Marte si se queda sin suelo.
 */
export function moverPersonaje(
  c: Cuerpo,
  vx: number,
  vz: number,
  dt: number,
  t: Terreno,
  radio: number,
  extra: readonly Circulo[] = [],
): Cuerpo {
  const intento = (dx: number, dz: number): { x: number; z: number } | null => {
    const p = { x: c.x + dx, z: c.z + dz };
    resolver(p, radio, t, extra);
    return alturaSuelo(p.x, p.z, t) - c.y > ESCALON_MAX ? null : p;
  };
  const dx = vx * dt;
  const dz = vz * dt;
  // Si un borde alto corta el paso, desliza por el eje que sí está libre.
  const p = intento(dx, dz) ?? intento(dx, 0) ?? intento(0, dz) ?? { x: c.x, z: c.z };
  const suelo = alturaSuelo(p.x, p.z, t);
  if (c.y <= suelo + 1e-6) return { x: p.x, z: p.z, y: suelo, vy: 0, apoyado: true };
  const caida = pasoCaida({ y: c.y, vy: c.vy, apoyado: false }, suelo, GRAVEDAD_MARTE, dt);
  return { x: p.x, z: p.z, ...caida };
}

/** Cuántos pasos fijos caben en este fotograma. Limita el salto al volver de una pestaña inactiva. */
export function subpasos(acumulado: number, dt: number): { pasos: number; resto: number } {
  const total = acumulado + Math.min(Math.max(dt, 0), 0.1);
  const pasos = Math.min(MAX_SUBPASOS, Math.floor(total / PASO_FISICO + 1e-9));
  const resto = pasos === MAX_SUBPASOS ? 0 : total - pasos * PASO_FISICO;
  return { pasos, resto };
}

/** Tiempo teórico de caída desde `altura` sin aire: t = raíz(2h / g). */
export function tiempoDeCaida(altura: number, g: number): number {
  return Math.sqrt((2 * Math.max(0, altura)) / g);
}
