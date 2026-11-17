/**
 * Relieve de Jezero para la Etapa BC (rebanada realista): una función de altura y la malla que la dibuja.
 *
 * - Base: el DEM real (`data/terreno/jezero/`) con el claro aplanado, interpolado bilineal (sin facetas).
 *   Fuera del claro su desnivel se amplifica, así la pared del cráter sigue la topografía real.
 * - Encima, solo fuera del claro: mesetas escalonadas (umbrales de ruido: cada escalón es un estrato),
 *   erosión "ridged multifractal" en los bordes, el borde del cráter como pared continua, una capa
 *   lejana más alta y dunas suaves en el llano. Todo es decorado: no es dato de NASA (MARTE §8).
 * - Malla: anillos concéntricos en bandas. Cerca, celdas de ~1,5-2,5 m; lejos, de ~8-12 m. Cada banda
 *   lleva un faldón hacia abajo en sus bordes, que tapa las grietas entre bandas de distinta resolución.
 *   Las normales salen de la función de altura (diferencias finitas): sin costuras entre bandas.
 *
 * La misma función coloca rocas y piedritas, así nada flota ni se hunde de más.
 */
import * as THREE from "three";
import { marco, type MarcoTerreno, type OpcionesMalla, type Rejilla } from "./terrenoDatos";
import { microrrelieve } from "./microrelieve";

// ---------------------------------------------------------------------------------------------
// Ruido determinista (sin dependencias)
// ---------------------------------------------------------------------------------------------

function hash(ix: number, iz: number, semilla: number): number {
  let h = Math.imul(ix | 0, 374761393) ^ Math.imul(iz | 0, 668265263) ^ Math.imul(semilla | 0, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Ruido de valor 2D suavizado, en [0, 1]. */
export function ruido(x: number, z: number, semilla: number): number {
  const ix = Math.floor(x), iz = Math.floor(z);
  const fx = x - ix, fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx), uz = fz * fz * (3 - 2 * fz);
  const a = hash(ix, iz, semilla), b = hash(ix + 1, iz, semilla);
  const c = hash(ix, iz + 1, semilla), d = hash(ix + 1, iz + 1, semilla);
  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}

/** Suma de octavas normalizada a [0, 1]. */
export function fbm(x: number, z: number, octavas: number, semilla: number): number {
  let suma = 0, amp = 0.5, total = 0, f = 1;
  for (let o = 0; o < octavas; o++) {
    suma += amp * ruido(x * f + o * 17.3, z * f - o * 9.1, semilla + o);
    total += amp;
    amp *= 0.5;
    f *= 2.03;
  }
  return suma / total;
}

/**
 * Ridged multifractal (Musgrave): crestas afiladas donde el ruido cruza su media; cada octava pesa según
 * la anterior, así las cárcavas se ramifican. En [0, 1].
 */
export function ridged(x: number, z: number, octavas: number, semilla: number): number {
  let suma = 0, peso = 1, amp = 0.5, total = 0, f = 1;
  for (let o = 0; o < octavas; o++) {
    let n = 1 - Math.abs(2 * ruido(x * f + o * 31.7, z * f + o * 11.3, semilla + 101 * o) - 1);
    n *= n * peso;
    peso = Math.min(1, n * 2);
    suma += n * amp;
    total += amp;
    amp *= 0.5;
    f *= 2.1;
  }
  return suma / total;
}

const ss = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Terrazas: cornisa casi llana y escalón empinado al final de cada `paso`. */
export function terraza(v: number, paso: number, mezcla = 0.75): number {
  if (v <= 0) return v;
  const k = v / paso;
  const f = k - Math.floor(k);
  return v + (paso * (Math.floor(k) + f * f * f * f) - v) * mezcla;
}

// ---------------------------------------------------------------------------------------------
// Función de altura
// ---------------------------------------------------------------------------------------------

/**
 * Zona de trabajo (regla 10 de `docs/referenciapau/exterior/00-comun.md`): una vista con horizonte, con su
 * base y su terreno. El relieve nuevo solo existe en este sector; fuera, el mapa queda como en `develop`
 * (DEM y cordillera) hasta que la zona se apruebe y se extienda. Rumbo = acimut `atan2(z, x)` hacia donde
 * mira la vista de la zona (cámara de tercera persona girada 3,85 rad desde el inicio: hacia +X +Z).
 */
export const ZONA = { rumbo: 0.86, apertura: 1.05, transicion: 0.35 } as const;

/** Diferencia angular en [0, π]. */
function difAngulo(a: number, b: number): number {
  return Math.abs((((a - b) % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI) - Math.PI);
}

/** 1 dentro del sector de la zona, 0 fuera, con transición suave. */
export function mascaraZona(x: number, z: number): number {
  return 1 - ss(ZONA.apertura, ZONA.apertura + ZONA.transicion, difAngulo(Math.atan2(z, x), ZONA.rumbo));
}

/** El acimut `a` cae en la zona o en su transición (más `margen`). */
export function anguloEnZona(a: number, margen = 0): boolean {
  return difAngulo(a, ZONA.rumbo) < ZONA.apertura + ZONA.transicion + margen;
}

/**
 * Parámetros del relieve (u ≈ m). Distancias desde el centro de la base. [E] calibrado contra las
 * referencias con `comparar_referencia.py`. Referencia de cada término (regla 11), hojas de
 * `C:/Users/mpaul/Documents/ss-referencias/`:
 * - Base: DEM real de Jezero (`data/terreno/jezero/`; anexo de misiones: "usarlo para el horizonte").
 * - Mesetas escalonadas y cárcavas: `occupy-mars-2` (badlands con estratos y cárcavas en el plano medio).
 * - Borde del cráter: `surviving-mars-8` (pared que se alza detrás del llano de la base).
 * - Capa lejana: `surviving-mars-8` y `occupy-mars-2` (último plano que se funde con la bruma).
 * - Dunas: `surviving-mars-8` (dunas suaves en el llano alrededor de la base).
 */
export const RELIEVE = {
  /** Desde aquí aparece relieve procedural (el claro jugable termina en `CLARO.borde` = 46). */
  inicio: 52,
  /** Amplificación del desnivel real del DEM fuera del claro (de 1 a 1 + `amplificar`). */
  amplificar: 0.6,
  /** Mesetas: umbral del ruido cerca y lejos (más alto = menos mesetas), alto de cada estrato. */
  mesetas: { umbralCerca: 0.57, umbralLejos: 0.5, estratos: [2.6, 2.2, 1.9, 1.6], separacion: 0.05, filo: 0.035 },
  /** Borde del cráter: radio medio, variación y alto. */
  borde: { radio: 175, variacion: 30, alto: 9, altoExtra: 8, paso: 2.6 },
  /** Capa lejana (tercer plano): radio y alto. */
  lejana: { radio: 320, alto: 20, altoExtra: 16, paso: 4.5 },
  /** Dunas del llano: amplitud y longitud de onda. */
  dunas: { alto: 0.5, onda: 9 },
  /** Talud al pie de las mesetas: alto relativo al primer estrato y ancho en unidades del ruido. */
  talud: { alto: 0.55, ancho: 0.07 },
  /** Detalle de media escala en lo alto: amplitud (m) y longitud de onda (m) cerca. */
  medio: { alto: 2.2, onda: 19 },
  semilla: 1958,
} as const;

/** Muestra bilineal (suave) de la rejilla, en unidades de mundo del marco de `alturaEnMundo`. */
function bilineal(r: Rejilla, m: MarcoTerreno, x: number, z: number): number {
  const u = Math.min(r.ancho - 1.001, Math.max(0, (x - m.x0) / m.paso));
  const v = Math.min(r.alto - 1.001, Math.max(0, (z - m.z0) / m.paso));
  const c = Math.floor(u), f = Math.floor(v);
  const fu = u - c, fv = v - f;
  const h = (ff: number, cc: number) => ((r.alturas[ff * r.ancho + cc] ?? m.hCentro) - m.hCentro) * m.escalaY;
  const a = h(f, c), b = h(f, c + 1), d = h(f + 1, c), e = h(f + 1, c + 1);
  return a + (b - a) * fu + (d - a) * fv + (a - b - d + e) * fu * fv;
}

/** Pesos de la B-spline cúbica uniforme (suman 1). */
function pesosBspline(t: number): [number, number, number, number] {
  const t2 = t * t, t3 = t2 * t;
  return [(1 - 3 * t + 3 * t2 - t3) / 6, (4 - 6 * t2 + 3 * t3) / 6, (1 + 3 * t + 3 * t2 - 3 * t3) / 6, t3 / 6];
}

/**
 * Muestra B-spline cúbica: sin las aristas rectas de las celdas del DEM (4,3 u) que la bilineal deja ver
 * al amplificar el desnivel. Suaviza un poco los picos, que es lo que se busca a esta escala.
 */
function bspline(r: Rejilla, m: MarcoTerreno, x: number, z: number): number {
  const u = Math.min(r.ancho - 1.001, Math.max(0, (x - m.x0) / m.paso));
  const v = Math.min(r.alto - 1.001, Math.max(0, (z - m.z0) / m.paso));
  const c = Math.floor(u), f = Math.floor(v);
  const wu = pesosBspline(u - c), wv = pesosBspline(v - f);
  let suma = 0;
  for (let j = 0; j < 4; j++) {
    const ff = Math.min(r.alto - 1, Math.max(0, f + j - 1));
    let fila = 0;
    for (let i = 0; i < 4; i++) {
      const cc = Math.min(r.ancho - 1, Math.max(0, c + i - 1));
      fila += wu[i]! * (r.alturas[ff * r.ancho + cc] ?? m.hCentro);
    }
    suma += wv[j]! * fila;
  }
  return (suma - m.hCentro) * m.escalaY;
}

export type FuncionAltura = (x: number, z: number) => number;

/**
 * Altura del relieve en (x, z), en el mismo marco que `alturaEnMundo(claro, ...)`: dentro del claro
 * coincide con él (llano a la altura del centro). `claro` es la rejilla ya aplanada (`aplanarClaro`).
 */
export function funcionRelieve(claro: Rejilla, malla: OpcionesMalla): FuncionAltura {
  const m = marco(claro, malla);
  const h0 = bilineal(claro, m, 0, 0);
  const R = RELIEVE;
  const s = R.semilla;
  return (x, z) => {
    const r = Math.hypot(x, z);
    const lineal = bilineal(claro, m, x, z);
    // Microrrelieve del claro (10-50 cm, 0 donde se apoya la base): el mismo que sigue la física.
    const micro = microrrelieve(x, z);
    if (r < R.inicio - 6) return lineal + micro;
    // Fuera de la zona, el DEM como estaba (bilineal, sin relieve nuevo).
    const zona = mascaraZona(x, z);
    if (zona <= 0) return lineal + micro;
    // Cerca del claro manda la bilineal (llano exacto); afuera, la B-spline.
    const base = lineal + (bspline(claro, m, x, z) - lineal) * ss(R.inicio - 6, R.inicio + 6, r) * zona;
    let h = h0 + (base - h0) * (1 + R.amplificar * ss(60, 150, r) * zona);
    const h1 = h;
    const fuera = ss(R.inicio, R.inicio + 30, r);
    // El detalle crece con la distancia: lejos las celdas de la malla son de 5-14 m.
    const k = 1 + Math.max(0, r - 120) / 110;
    // Deformación de dominio: bordes de mesetas sinuosos, no circulares.
    const wx = x + 22 * (fbm(x / 95, z / 95, 3, s) - 0.5);
    const wz = z + 22 * (fbm(x / 95 + 7.1, z / 95 - 3.3, 3, s + 1) - 0.5);
    const erosion = ridged(wx / (24 * k), wz / (24 * k), r > 260 ? 2 : 3, s + 2);
    // Mesetas escalonadas: cada umbral superado suma un estrato con su escalón.
    const me = R.mesetas;
    const n = fbm(wx / (60 * k), wz / (60 * k), r > 200 ? 3 : 4, s + 3) + (erosion - 0.5) * 0.09;
    const umbral = me.umbralCerca + (me.umbralLejos - me.umbralCerca) * ss(60, 210, r);
    const escala = 1 + 1.2 * ss(80, 230, r);
    let mesetas = 0;
    me.estratos.forEach((alto, k) => {
      const t = umbral + k * me.separacion;
      mesetas += alto * ss(t, t + me.filo, n);
    });
    // Talud: rampa cóncava de derrubios al pie del primer escalón (`occupy-mars-2`, pie de los badlands).
    const talud = me.estratos[0]! * R.talud.alto * ss(umbral - R.talud.ancho, umbral + me.filo * 0.3, n) ** 1.6;
    h += fuera * Math.max(mesetas, talud) * escala;
    // Borde del cráter: pared continua, radio y alto variables según el ángulo (sin costura en ±π).
    const a = Math.atan2(z, x);
    const ca = Math.cos(a) * 2.3 + 5, sa = Math.sin(a) * 2.3 + 5;
    const b = R.borde;
    const radioBorde = b.radio + b.variacion * (fbm(ca, sa, 3, s + 4) - 0.5) * 2;
    const pared = ss(radioBorde - 26, radioBorde + 14, r + (erosion - 0.5) * 18) * (b.alto + b.altoExtra * fbm(ca + 3, sa, 3, s + 5));
    h += terraza(pared, b.paso);
    const l = R.lejana;
    const lejana = ss(l.radio - 40, l.radio + 30, r + 30 * (fbm(ca - 2, sa + 1, 3, s + 6) - 0.5)) * (l.alto + l.altoExtra * fbm(x / 160, z / 160, 3, s + 7));
    h += terraza(lejana, l.paso, 0.45);
    // Cárcavas: la erosión baja el terreno en lo alto (donde ya hay pared o meseta).
    h -= erosion * erosion * 3.5 * ss(3, 14, h - h0) * fuera * (1 - ss(250, 330, r));
    // Detalle de media escala en lo alto (crestas y lomos de 15-30 m), sin depender de la pendiente:
    // las laderas suaves también lo tienen (`surviving-mars-8`, laderas con lomos y canaletas).
    const md = R.medio;
    h += (ridged(x / (md.onda * k), z / (md.onda * k), 2, s + 10) - 0.35) * md.alto * k * ss(1.5, 7, h - h0) * fuera;
    // Dunas suaves en el llano entre el claro y las mesetas.
    const d = R.dunas;
    const llano = ss(40, 62, r) * (1 - ss(120, 170, r));
    h += llano * d.alto * Math.sin((x * 0.8 + z * 0.6) / d.onda * Math.PI * 2 + 4 * fbm(x / 30, z / 30, 2, s + 8)) * fbm(x / 45, z / 45, 2, s + 9);
    return h1 + (h - h1) * zona + micro;
  };
}

/** Normal de la superficie por diferencias centradas. */
export function normalRelieve(altura: FuncionAltura, x: number, z: number, e = 0.6): [number, number, number] {
  const dx = (altura(x + e, z) - altura(x - e, z)) / (2 * e);
  const dz = (altura(x, z + e) - altura(x, z - e)) / (2 * e);
  const l = Math.hypot(dx, 1, dz);
  return [-dx / l, 1 / l, -dz / l];
}

// ---------------------------------------------------------------------------------------------
// Malla radial en bandas
// ---------------------------------------------------------------------------------------------

export interface Banda {
  r0: number;
  r1: number;
  /** Divisiones por vuelta. */
  segmentos: number;
  /** Separación radial entre anillos al inicio y al final de la banda. */
  paso0: number;
  paso1: number;
  /** Solo en el sector de la zona (franja abierta), no la vuelta entera. */
  soloZona?: boolean;
}

/** Bandas de la malla: más densas donde la cámara de juego mira el terreno de cerca. [E] */
export const BANDAS: readonly Banda[] = [
  // Claro: celdas de ~0,7-1 m para que se dibuje el microrrelieve (ondas de 2,3 m, montículos de 1-2,4 m).
  { r0: 0, r1: 14, segmentos: 128, paso0: 1.2, paso1: 0.7 },
  { r0: 14, r1: 46, segmentos: 288, paso0: 0.7, paso1: 0.95 },
  { r0: 46, r1: 135, segmentos: 256, paso0: 1.4, paso1: 2.6 },
  { r0: 135, r1: 270, segmentos: 320, paso0: 2.8, paso1: 4.4 },
  // Tercer plano: solo en la zona (fuera, la cordillera de `develop` cierra el horizonte).
  { r0: 270, r1: 520, segmentos: 256, paso0: 7, paso1: 14, soloZona: true },
];

/** Profundidad de los faldones entre bandas. */
const FALDON = 3;

export interface MallaRelieve {
  posiciones: Float32Array;
  normales: Float32Array;
  indices: Uint32Array;
  triangulos: number;
}

function radiosDe(b: Banda): number[] {
  const radios = [b.r0];
  let r = b.r0;
  while (r < b.r1 - 1e-6) {
    const t = (r - b.r0) / (b.r1 - b.r0);
    r = Math.min(b.r1, r + b.paso0 + (b.paso1 - b.paso0) * t);
    radios.push(r);
  }
  return radios;
}

/** Malla de anillos concéntricos con altura y normales de `altura`. Una sola geometría indexada. */
export function mallaRelieve(altura: FuncionAltura, bandas: readonly Banda[] = BANDAS): MallaRelieve {
  const pos: number[] = [];
  const nor: number[] = [];
  const idx: number[] = [];
  bandas.forEach((b, ib) => {
    // Vuelta entera (cerrada) o franja abierta sobre el sector de la zona, con un margen.
    const arco = b.soloZona ? 2 * (ZONA.apertura + ZONA.transicion + 0.1) : Math.PI * 2;
    const a0 = b.soloZona ? ZONA.rumbo - arco / 2 : 0;
    const S = b.soloZona ? Math.ceil((b.segmentos * arco) / (Math.PI * 2)) : b.segmentos;
    const V = b.soloZona ? S + 1 : S;
    const radios = radiosDe(b);
    const anillos: { r: number; dy: number }[] = radios.map((r) => ({ r, dy: 0 }));
    // Faldones: un anillo extra bajo cada borde compartido con otra banda.
    if (ib > 0) anillos.unshift({ r: radios[0]!, dy: -FALDON });
    if (ib < bandas.length - 1) anillos.push({ r: radios[radios.length - 1]!, dy: -FALDON });
    const desde = pos.length / 3;
    for (const { r, dy } of anillos) {
      for (let s = 0; s < V; s++) {
        const a = a0 + (s / S) * arco;
        const x = Math.cos(a) * Math.max(r, 1e-3), z = Math.sin(a) * Math.max(r, 1e-3);
        pos.push(x, altura(x, z) + dy, z);
        nor.push(...normalRelieve(altura, x, z));
      }
    }
    for (let k = 0; k < anillos.length - 1; k++) {
      for (let s = 0; s < S; s++) {
        const a = desde + k * V + s, bb = desde + k * V + ((s + 1) % V);
        const c = a + V, d = bb + V;
        // Cara hacia arriba (+y): de adentro hacia afuera, sentido antihorario visto desde arriba.
        idx.push(a, bb, c, bb, d, c);
      }
    }
  });
  return { posiciones: new Float32Array(pos), normales: new Float32Array(nor), indices: new Uint32Array(idx), triangulos: idx.length / 3 };
}

// ---------------------------------------------------------------------------------------------
// Luz horneada
// ---------------------------------------------------------------------------------------------

/** Rejilla de alturas para hornear: lado (m) y paso (m). Solo se recorre al cargar el terreno. [E] */
export const HORNEADO = { lado: 1040, paso: 4, inicio: 26, distanciaSombra: 320, radioOclusion: 36 } as const;

/** Alturas de la función muestreadas en una rejilla regular, con lectura bilineal. */
function rejillaAlturas(altura: FuncionAltura): (x: number, z: number) => number {
  const { lado, paso } = HORNEADO;
  const n = Math.round(lado / paso) + 1;
  const h = new Float32Array(n * n);
  const x0 = -lado / 2;
  for (let f = 0; f < n; f++) for (let c = 0; c < n; c++) h[f * n + c] = altura(x0 + c * paso, x0 + f * paso);
  return (x, z) => {
    const u = Math.min(n - 1.001, Math.max(0, (x - x0) / paso)), v = Math.min(n - 1.001, Math.max(0, (z - x0) / paso));
    const c = Math.floor(u), f = Math.floor(v), fu = u - c, fv = v - f;
    const a = h[f * n + c]!, b = h[f * n + c + 1]!, d = h[(f + 1) * n + c]!, e = h[(f + 1) * n + c + 1]!;
    return a + (b - a) * fu + (d - a) * fv + (a - b - d + e) * fu * fv;
  };
}

/**
 * Hornea, por vértice, (sombra del sol, oclusión, talud) en [0, 1], una sola vez al cargar:
 * - Sombra: rayo hacia el sol sobre la rejilla; penumbra suave según cuánto pasa por encima del relieve.
 * - Oclusión: horizonte en 8 direcciones hasta `radioOclusion` m.
 * - Talud: suelo poco inclinado con una pared que sube a menos de 9 m (pie de mesetas y del borde).
 * Solo en la zona y fuera del claro: cerca manda el mapa de sombras en tiempo real.
 */
export function hornearLuz(altura: FuncionAltura, posiciones: Float32Array, normales: Float32Array, sol: readonly [number, number, number]): Float32Array {
  const H = HORNEADO;
  const salida = new Float32Array(posiciones.length).fill(1);
  const leer = rejillaAlturas(altura);
  const ls = Math.hypot(sol[0], sol[1], sol[2]) || 1;
  const sx = sol[0] / ls, sy = sol[1] / ls, sz = sol[2] / ls;
  const dirs = Array.from({ length: 8 }, (_, i) => [Math.cos((i / 8) * Math.PI * 2), Math.sin((i / 8) * Math.PI * 2)] as const);
  for (let i = 0; i < posiciones.length / 3; i++) {
    const x = posiciones[i * 3]!, y = posiciones[i * 3 + 1]!, z = posiciones[i * 3 + 2]!;
    salida[i * 3 + 2] = 0;
    const r = Math.hypot(x, z);
    if (r < H.inicio || mascaraZona(x, z) <= 0) continue;
    // Sombra del sol.
    let luz = 1;
    for (let t = 2; t < H.distanciaSombra; t *= 1.12) {
      const encima = y + 0.4 + t * sy - leer(x + t * sx, z + t * sz);
      luz = Math.min(luz, Math.max(0, Math.min(1, 0.5 + encima / (0.06 * t + 0.5))));
      if (luz <= 0) break;
    }
    // Oclusión por el horizonte cercano.
    let ocl = 0, subida = 0;
    for (const [dx, dz] of dirs) {
      let seno = 0;
      for (let t = 3; t <= H.radioOclusion; t *= 1.6) {
        const dh = leer(x + dx * t, z + dz * t) - y;
        seno = Math.max(seno, dh / Math.hypot(dh, t));
        if (t <= 9) subida = Math.max(subida, dh);
      }
      ocl += Math.max(0, seno);
    }
    const ny = normales[i * 3 + 1]!;
    salida[i * 3] = 0.06 + 0.94 * luz;
    salida[i * 3 + 1] = 1 - 0.8 * Math.min(1, (ocl / dirs.length) * 1.4);
    salida[i * 3 + 2] = ss(1.5, 5, subida) * ss(0.65, 0.85, ny);
  }
  return salida;
}

/** Geometría Three del relieve, con color de vértice de respaldo (calidad baja, sin texturas) y luz horneada. */
export function geometriaRelieve(
  altura: FuncionAltura,
  suelo: number,
  colores: { regolito: THREE.Color; roca: THREE.Color; polvo: THREE.Color },
  sol: readonly [number, number, number],
): THREE.BufferGeometry {
  const m = mallaRelieve(altura);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(m.posiciones, 3));
  geo.setAttribute("normal", new THREE.BufferAttribute(m.normales, 3));
  geo.setIndex(new THREE.BufferAttribute(m.indices, 1));
  geo.setAttribute("horneado", new THREE.BufferAttribute(hornearLuz(altura, m.posiciones, m.normales, sol), 3));
  const col = new Float32Array(m.posiciones.length);
  const c = new THREE.Color();
  for (let i = 0; i < m.posiciones.length / 3; i++) {
    const ny = m.normales[i * 3 + 1]!;
    const y = m.posiciones[i * 3 + 1]! - suelo;
    const roca = ss(0.72, 0.9, 1 - ny + 0.35);
    const polvo = ss(0.9, 0.97, ny) * ss(2, 6, y);
    c.copy(colores.regolito).lerp(colores.roca, roca).lerp(colores.polvo, polvo * 0.6);
    col.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  geo.computeBoundingSphere();
  return geo;
}
