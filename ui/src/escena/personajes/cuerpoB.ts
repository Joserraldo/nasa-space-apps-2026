import type { Paleta } from "./fichas.js";
import { puntoAnillo, puntosAnillo, type V3 } from "./malla.js";
import { HUESOS, type NombreHueso } from "./personaje.js";
import type { Pesos, Superficie } from "./superficie.js";

/**
 * Propuesta B: el traje es UNA superficie cerrada. El tronco son anillos de 12 puntos; los brazos
 * salen de un hueco de seis vértices abierto en el costado y las piernas de partir el anillo de la
 * pelvis con un vértice de entrepierna. Codos y rodillas llevan tres anillos (antes, en, después)
 * con pesos 1 / 0,5 / 1, como en la guía de malla.
 *
 * Unidades: fracción de la altura total (suelo a tope del casco). +Z frente, +X izquierda del personaje.
 */

export const H = Object.fromEntries(HUESOS.map((n, i) => [n, i])) as Record<NombreHueso, number>;

export const peso = (a: NombreHueso, b?: NombreHueso, k = 0.5): Pesos =>
  b
    ? [
        [H[a], 1 - k],
        [H[b], k],
      ]
    : [[H[a], 1]];

/** Hueso sin lado ("muslo") que se resuelve a "musloI" o "musloD". */
type PesoLado = [string, string?, number?];

interface Seccion {
  y: number;
  rx: number;
  frente: number;
  espalda: number;
  n?: number;
  cz?: number;
  cx?: number;
}

export interface Silueta {
  casco: { y: number; z: number; rx: number; ry: number; rz: number };
  /** Centro del cráneo y alto de mentón a coronilla, sin pelo. */
  craneo: { y: number; alto: number };
  cuello: { y0: number; y1: number; r: number; z: number };
  tronco: Array<Seccion & { pesos: Pesos; banda?: "cinturon" }>;
  /** El hueco del brazo queda entre este anillo y el siguiente. */
  iAxila: number;
  entrepierna: V3;
  pierna: Array<Seccion & { pesos: PesoLado }>;
  bota: Array<Seccion & { pesos: PesoLado }>;
  hombro: V3;
  codo: V3;
  muneca: V3;
  brazo: { capa: number; deltoides: number; medio: number; preCodo: number; codo: number; antebrazo: number; muneca: number; puno: number };
  mano: { largo: number; ancho: number; grosor: number };
  cadera: V3;
  rodilla: V3;
  tobillo: V3;
  collar: { z: number; aros: Array<[y: number, r: number]> };
  /** Lazos de la placa: [x e y de arriba, x e y de abajo, medio fondo]. */
  hombrera: Array<[xa: number, ya: number, xb: number, yb: number, z: number]>;
  luz: { y: number; r: number };
  mochila: { y: number; medio: V3 };
  bolso: { desde: [number, number]; hasta: [number, number]; bolsa: [number, number] };
  antena: { x: number; yCaja: number; yBola: number; z: number };
  /** Escala de las piezas pequeñas del equipo (hebilla, bolsillo, antena). 1 = adulta. */
  equipo?: number;
}

/**
 * Adulta B. Canon inferido de la referencia de turnaround (recortada a medio muslo): unas 4,1
 * cabezas con pelo, hombros del ancho de la cabeza, cintura a 0,8 de los hombros, cadera igual
 * a los hombros. Las piernas no se ven en la referencia: su largo es una decisión, no una medida.
 */
export const ADULTA_B: Silueta = {
  casco: { y: 0.835, z: -0.015, rx: 0.2, ry: 0.17, rz: 0.212 },
  craneo: { y: 0.8245, alto: 0.265 },
  cuello: { y0: 0.666, y1: 0.732, r: 0.038, z: -0.014 },
  tronco: [
    { y: 0.397, rx: 0.1, frente: 0.064, espalda: 0.074, pesos: peso("pelvis") },
    { y: 0.436, rx: 0.104, frente: 0.068, espalda: 0.08, n: 2.5, pesos: peso("pelvis") },
    { y: 0.477, rx: 0.094, frente: 0.064, espalda: 0.068, pesos: peso("pelvis"), banda: "cinturon" },
    { y: 0.496, rx: 0.087, frente: 0.061, espalda: 0.062, pesos: peso("pelvis") },
    { y: 0.524, rx: 0.075, frente: 0.056, espalda: 0.054, pesos: peso("pelvis", "torso") },
    { y: 0.572, rx: 0.084, frente: 0.07, espalda: 0.06, pesos: peso("torso") },
    { y: 0.612, rx: 0.088, frente: 0.07, espalda: 0.064, pesos: peso("torso") },
    { y: 0.655, rx: 0.084, frente: 0.056, espalda: 0.058, pesos: peso("torso") },
    { y: 0.672, rx: 0.052, frente: 0.046, espalda: 0.046, n: 2.2, pesos: peso("torso") },
    { y: 0.683, rx: 0.036, frente: 0.034, espalda: 0.034, n: 2, pesos: peso("torso") },
  ],
  iAxila: 6,
  entrepierna: [0, 0.374, -0.004],
  pierna: [
    { cx: 0.057, y: 0.356, rx: 0.055, frente: 0.062, espalda: 0.064, pesos: ["muslo"] },
    { cx: 0.058, y: 0.288, rx: 0.05, frente: 0.055, espalda: 0.055, pesos: ["muslo"] },
    { cx: 0.058, y: 0.236, rx: 0.044, frente: 0.047, espalda: 0.047, pesos: ["muslo"] },
    { cx: 0.058, y: 0.207, rx: 0.044, frente: 0.051, espalda: 0.044, cz: 0.002, pesos: ["muslo", "espinilla", 0.5] },
    { cx: 0.058, y: 0.178, rx: 0.042, frente: 0.045, espalda: 0.046, pesos: ["espinilla"] },
    { cx: 0.058, y: 0.152, rx: 0.042, frente: 0.044, espalda: 0.05, pesos: ["espinilla"] },
  ],
  bota: [
    { cx: 0.058, y: 0.152, rx: 0.055, frente: 0.057, espalda: 0.061, n: 2.6, pesos: ["espinilla"] },
    { cx: 0.058, y: 0.072, rx: 0.05, frente: 0.053, espalda: 0.056, n: 2.6, pesos: ["espinilla", "pie", 0.5] },
    { cx: 0.058, y: 0.04, rx: 0.055, frente: 0.094, espalda: 0.058, n: 2.6, pesos: ["pie"] },
    { cx: 0.058, y: 0.012, rx: 0.057, frente: 0.114, espalda: 0.06, n: 2.8, pesos: ["pie"] },
    { cx: 0.058, y: 0, rx: 0.053, frente: 0.106, espalda: 0.056, n: 2.8, pesos: ["pie"] },
  ],
  hombro: [0.084, 0.639, 0],
  codo: [0.114, 0.52, 0],
  muneca: [0.139, 0.408, 0.012],
  brazo: { capa: 0.04, deltoides: 0.04, medio: 0.036, preCodo: 0.032, codo: 0.033, antebrazo: 0.034, muneca: 0.03, puno: 0.036 },
  mano: { largo: 0.086, ancho: 0.042, grosor: 0.03 },
  cadera: [0.057, 0.382, 0],
  rodilla: [0.058, 0.207, 0.002],
  tobillo: [0.058, 0.068, 0],
  collar: {
    z: -0.004,
    aros: [
      [0.652, 0.092],
      [0.66, 0.128],
      [0.69, 0.124],
      [0.696, 0.092],
    ],
  },
  hombrera: [
    [0.07, 0.676, 0.07, 0.656, 0.042],
    [0.108, 0.676, 0.102, 0.655, 0.054],
    [0.137, 0.652, 0.121, 0.64, 0.054],
    [0.146, 0.612, 0.13, 0.612, 0.046],
  ],
  luz: { y: 0.62, r: 0.024 },
  mochila: { y: 0.575, medio: [0.068, 0.074, 0.036] },
  bolso: { desde: [0.062, 0.662], hasta: [-0.072, 0.452], bolsa: [-0.07, 0.432] },
  antena: { x: -0.134, yCaja: 0.806, yBola: 0.912, z: -0.016 },
};

/**
 * Niño B. Mismas medidas que la ficha A (`NINO`): 2,4 cabezas, cráneo de 0,40 de la altura, casco
 * de 0,72 de ancho, cadera, rodilla y tobillo en su sitio. Cambia la construcción, no el canon:
 * tronco de anillos de 12, piernas cortas de tres anillos y botas, brazos desde el hueco del costado.
 */
export const NINO_B: Silueta = {
  casco: { y: 0.678, z: -0.015, rx: 0.36, ry: 0.32, rz: 0.355 },
  craneo: { y: 0.712, alto: 0.4 },
  cuello: { y0: 0.45, y1: 0.54, r: 0.055, z: -0.015 },
  tronco: [
    { y: 0.178, rx: 0.152, frente: 0.118, espalda: 0.124, pesos: peso("pelvis") },
    { y: 0.214, rx: 0.158, frente: 0.126, espalda: 0.132, n: 2.6, pesos: peso("pelvis") },
    { y: 0.243, rx: 0.156, frente: 0.126, espalda: 0.128, pesos: peso("pelvis"), banda: "cinturon" },
    { y: 0.264, rx: 0.152, frente: 0.124, espalda: 0.124, pesos: peso("pelvis") },
    { y: 0.29, rx: 0.147, frente: 0.121, espalda: 0.119, pesos: peso("pelvis", "torso") },
    { y: 0.332, rx: 0.151, frente: 0.128, espalda: 0.122, pesos: peso("torso") },
    { y: 0.372, rx: 0.149, frente: 0.122, espalda: 0.118, pesos: peso("torso") },
    { y: 0.426, rx: 0.138, frente: 0.098, espalda: 0.1, pesos: peso("torso") },
    { y: 0.45, rx: 0.086, frente: 0.074, espalda: 0.074, n: 2.2, pesos: peso("torso") },
    { y: 0.464, rx: 0.056, frente: 0.05, espalda: 0.05, n: 2, pesos: peso("torso") },
  ],
  iAxila: 6,
  entrepierna: [0, 0.152, -0.004],
  pierna: [
    { cx: 0.086, y: 0.152, rx: 0.074, frente: 0.086, espalda: 0.088, pesos: ["muslo"] },
    { cx: 0.088, y: 0.13, rx: 0.07, frente: 0.082, espalda: 0.078, cz: 0.002, pesos: ["muslo", "espinilla", 0.5] },
    { cx: 0.089, y: 0.11, rx: 0.066, frente: 0.074, espalda: 0.078, pesos: ["espinilla"] },
  ],
  bota: [
    { cx: 0.09, y: 0.11, rx: 0.08, frente: 0.088, espalda: 0.092, n: 2.6, pesos: ["espinilla"] },
    { cx: 0.09, y: 0.072, rx: 0.078, frente: 0.086, espalda: 0.088, n: 2.6, pesos: ["espinilla", "pie", 0.5] },
    { cx: 0.091, y: 0.038, rx: 0.084, frente: 0.142, espalda: 0.09, n: 2.6, pesos: ["pie"] },
    { cx: 0.091, y: 0.012, rx: 0.087, frente: 0.166, espalda: 0.092, n: 2.8, pesos: ["pie"] },
    { cx: 0.091, y: 0, rx: 0.082, frente: 0.156, espalda: 0.086, n: 2.8, pesos: ["pie"] },
  ],
  hombro: [0.146, 0.4, 0],
  codo: [0.186, 0.332, 0.006],
  muneca: [0.208, 0.264, 0.018],
  brazo: { capa: 0.054, deltoides: 0.054, medio: 0.05, preCodo: 0.046, codo: 0.047, antebrazo: 0.048, muneca: 0.044, puno: 0.052 },
  mano: { largo: 0.108, ancho: 0.062, grosor: 0.046 },
  cadera: [0.086, 0.185, 0],
  rodilla: [0.088, 0.13, 0.002],
  tobillo: [0.09, 0.08, 0],
  collar: {
    z: -0.006,
    aros: [
      [0.432, 0.19],
      [0.444, 0.252],
      [0.486, 0.246],
      [0.494, 0.19],
    ],
  },
  hombrera: [
    [0.122, 0.444, 0.122, 0.42, 0.06],
    [0.168, 0.444, 0.16, 0.418, 0.076],
    [0.212, 0.412, 0.19, 0.398, 0.08],
    [0.226, 0.352, 0.204, 0.354, 0.07],
  ],
  luz: { y: 0.345, r: 0.036 },
  mochila: { y: 0.325, medio: [0.112, 0.088, 0.046] },
  bolso: { desde: [0.1, 0.43], hasta: [-0.12, 0.25], bolsa: [-0.12, 0.22] },
  antena: { x: -0.218, yCaja: 0.7, yBola: 0.86, z: -0.02 },
  equipo: 1.5,
};

const resta = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cruz = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unidad = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
const mezcla = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const combina = (a: V3, ka: number, b: V3, kb: number): V3 => [a[0] * ka + b[0] * kb, a[1] * ka + b[1] * kb, a[2] * ka + b[2] * kb];
const RAD = Math.PI / 180;

const anilloDe = (r: Seccion) => ({ y: r.y, rx: r.rx, rz: r.frente, rzB: r.espalda, n: r.n ?? 2.4, cz: r.cz ?? 0, cx: r.cx ?? 0 });

export function construirTraje(s: Superficie, c: Paleta, d: Silueta): void {
  s.etiqueta = "traje";
  const N = 12;

  // Tronco: el vértice 0 de cada anillo mira al frente y el 6 a la espalda, sobre el plano de simetría.
  const tronco = d.tronco.map((r) => s.anillo(puntosAnillo(anilloDe(r), N, 0), r.pesos));
  for (let i = 0; i < tronco.length - 1; i++) {
    const color = d.tronco[i]!.banda === "cinturon" ? (c.cinturon ?? c.traje) : c.traje;
    if (i === d.iAxila) s.puente(tronco[i]!, tronco[i + 1]!, color, { omitir: (k) => k === 2 || k === 3 || k === 8 || k === 9 });
    else s.puente(tronco[i]!, tronco[i + 1]!, color);
  }
  const cima = d.tronco[d.tronco.length - 1]!;
  s.abanico(tronco[tronco.length - 1]!, [0, cima.y + 0.004, 0], cima.pesos, c.traje);

  const pelvis = tronco[0]!;
  const entrepierna = s.vertice(d.entrepierna, peso("pelvis"));

  for (const lado of [1, -1] as const) {
    const L = lado === 1 ? "I" : "D";
    const m = (p: V3): V3 => (lado === 1 ? p : [-p[0], p[1], p[2]]);
    const it = (i: number) => (lado === 1 ? i : (N - i) % N);
    const nombre = (b: string): NombreHueso => (b in H ? b : `${b}${L}`) as NombreHueso;
    const pesos = (w: PesoLado): Pesos => (w[1] ? peso(nombre(w[0]), nombre(w[1]), w[2] ?? 0.5) : peso(nombre(w[0])));

    // --- Pierna: medio anillo de la pelvis más la entrepierna forman el primer bucle de ocho.
    let bucle = [0, 1, 2, 3, 4, 5, 6].map((i) => pelvis[it(i)]!).concat(entrepierna);
    const anilloPierna = (r: Seccion & { pesos: PesoLado }): number[] =>
      s.anillo(
        Array.from({ length: 8 }, (_, k) => m(puntoAnillo(anilloDe(r), (-45 + 45 * k) * RAD))),
        pesos(r.pesos),
      );
    for (const r of d.pierna) {
      const siguiente = anilloPierna(r);
      s.puente(bucle, siguiente, c.traje);
      bucle = siguiente;
    }
    d.bota.forEach((r, i) => {
      const siguiente = anilloPierna(r);
      s.puente(bucle, siguiente, i === d.bota.length - 1 ? c.suela : c.bota);
      bucle = siguiente;
    });
    const suela = d.bota[d.bota.length - 1]!;
    s.abanico(bucle, m([suela.cx ?? 0, suela.y, (suela.frente - suela.espalda) * 0.4]), pesos(["pie"]), c.suela);

    // --- Brazo: el hueco del costado (seis vértices) es el primer anillo.
    const d1 = unidad(resta(d.codo, d.hombro));
    const d2 = unidad(resta(d.muneca, d.codo));
    const anilloBrazo = (centro: V3, eje: V3, rf: number, ro: number, w: Pesos): number[] => {
      const fuera = unidad(cruz([0, 0, 1], eje));
      const frente = cruz(eje, fuera);
      return s.anillo(
        Array.from({ length: 6 }, (_, k) => {
          const fi = (330 - 60 * k) * RAD;
          return m(combina(frente, rf * Math.cos(fi), fuera, ro * Math.sin(fi)).map((v, j) => v + centro[j]!) as V3);
        }),
        w,
      );
    };
    const axila = tronco[d.iAxila]!;
    const hombros = tronco[d.iAxila + 1]!;
    const altos = [4, 3, 2].map((i) => hombros[it(i)]!);
    for (const v of altos) s.pesar(v, peso("torso", nombre("brazo"), 0.3));
    let aro = [2, 3, 4].map((i) => axila[it(i)]!).concat(altos);
    const b = d.brazo;
    const B = nombre("brazo");
    const A = nombre("antebrazo");
    const M = nombre("mano");
    const tramos: Array<{ aro: number[]; color: number }> = [
      { aro: anilloBrazo(combina(d.hombro, 1, [0.004, -0.002, 0], 1), unidad(combina([1, 0, 0], 0.9, d1, 1)), b.capa, b.capa, peso("torso", B, 0.6)), color: c.traje },
      { aro: anilloBrazo(combina(d.hombro, 1, d1, 0.04), d1, b.deltoides, b.deltoides * 0.97, peso(B)), color: c.traje },
      { aro: anilloBrazo(mezcla(d.hombro, d.codo, 0.55), d1, b.medio, b.medio * 0.97, peso(B)), color: c.traje },
      { aro: anilloBrazo(mezcla(d.hombro, d.codo, 0.86), d1, b.preCodo, b.preCodo, peso(B)), color: c.traje },
      { aro: anilloBrazo(d.codo, unidad(combina(d1, 1, d2, 1)), b.codo, b.codo, peso(B, A)), color: c.traje },
      { aro: anilloBrazo(mezcla(d.codo, d.muneca, 0.14), d2, b.preCodo, b.preCodo, peso(A)), color: c.traje },
      { aro: anilloBrazo(mezcla(d.codo, d.muneca, 0.5), d2, b.antebrazo, b.antebrazo, peso(A)), color: c.traje },
      { aro: anilloBrazo(mezcla(d.codo, d.muneca, 0.8), d2, b.muneca, b.muneca, peso(A)), color: c.traje },
      // Puño marfil del guante: un escalón hacia fuera y una banda corta.
      { aro: anilloBrazo(mezcla(d.codo, d.muneca, 0.8), d2, b.puno, b.puno, peso(A)), color: c.equipo },
      { aro: anilloBrazo(mezcla(d.codo, d.muneca, 0.98), d2, b.puno, b.puno, peso(A)), color: c.equipo },
    ];
    for (const t of tramos) {
      s.puente(aro, t.aro, t.color);
      aro = t.aro;
    }
    // Mano: manopla aplanada (ancha de frente a espalda, fina hacia fuera) con el pulgar extruido.
    const g = d.mano;
    // La mano cuelga más vertical que el antebrazo y cierra hacia el muslo: sin eso parece una aleta.
    const dm = unidad(combina(d2, 0.45, [-0.12, -1, 0.06], 0.55));
    const en = (k: number): V3 => combina(d.muneca, 1, dm, g.largo * k);
    const muneca = anilloBrazo(en(0), d2, g.ancho * 0.76, g.grosor * 1.2, peso(A, M));
    s.puente(aro, muneca, c.guante);
    const palma = anilloBrazo(en(0.32), dm, g.ancho * 0.95, g.grosor, peso(M));
    s.puente(muneca, palma, c.guante);
    const nudillos = anilloBrazo(en(0.66), dm, g.ancho, g.grosor * 0.9, peso(M));
    const caras = s.puente(palma, nudillos, c.guante);
    const dedos = anilloBrazo(en(0.9), dm, g.ancho * 0.8, g.grosor * 0.74, peso(M));
    s.puente(nudillos, dedos, c.guante);
    const punta = anilloBrazo(en(1), dm, g.ancho * 0.45, g.grosor * 0.42, peso(M));
    s.puente(dedos, punta, c.guante);
    s.abanico(punta, m(en(1.04)), peso(M), c.guante);
    const fuera = unidad(cruz([0, 0, 1], dm));
    const frente = cruz(dm, fuera);
    s.extruir(caras[5]!, m(combina(frente, g.ancho * 0.55, dm, g.largo * 0.16)), 0.62);
  }
}

export interface OpcionesEquipo {
  bolso: boolean;
  emblema?: "sol" | "herramienta" | undefined;
  /** Segundo bolsillo en el cinturón, a su izquierda de la hebilla. */
  rinoneras?: boolean | undefined;
  /** Equipo de mano del rol; la tableta la llevan todos. Cada pieza cuelga de su hueso y `animar` la muestra por gesto. */
  herramienta?: "llave" | "catalejo" | undefined;
}

export function construirEquipo(s: Superficie, c: Paleta, d: Silueta, o: OpcionesEquipo): void {
  s.etiqueta = "equipo";
  const T = peso("torso");
  const P = peso("pelvis");
  const frente = s.sonda(["traje"], 1);
  const espalda = s.sonda(["traje"], -1);
  const zFrente = (x: number, y: number) => frente(x, y)?.z ?? 0.06;
  const zEspalda = (x: number, y: number) => espalda(x, y)?.z ?? -0.06;
  const e = d.equipo ?? 1;

  // Collar del casco: toro de cuatro aros, cerrado sobre sí mismo.
  const aros = d.collar.aros.map(([y, r]) =>
    s.anillo(
      Array.from({ length: 12 }, (_, k): V3 => {
        const t = ((k + 0.5) / 12) * 2 * Math.PI;
        return [Math.sin(t) * r, y, d.collar.z + Math.cos(t) * r];
      }),
      T,
    ),
  );
  for (let i = 0; i < aros.length; i++) s.puente(aros[i]!, aros[(i + 1) % aros.length]!, c.collar);

  // Hombreras: placa arqueada con grosor, del collar al deltoides.
  for (const lado of [1, -1] as const) {
    const B: NombreHueso = lado === 1 ? "brazoI" : "brazoD";
    const w = [T, peso("torso", B, 0.3), peso("torso", B, 0.6), peso(B)];
    const lazos = d.hombrera.map(([xa, ya, xb, yb, z], i) =>
      s.anillo(
        [
          [lado * xa, ya, z],
          [lado * xa, ya, -z],
          [lado * xb, yb, -z],
          [lado * xb, yb, z],
        ],
        w[i]!,
      ),
    );
    for (let i = 0; i < lazos.length - 1; i++) s.puente(lazos[i]!, lazos[i + 1]!, c.acento);
    s.cara(lazos[0]!, c.acento);
    s.cara(lazos[lazos.length - 1]!, c.acento);
  }

  // Luz del pecho, apoyada vértice a vértice sobre el traje.
  const disco = (r: number, sobre: number, color: number) => {
    const y = d.luz.y;
    const borde = s.anillo(
      Array.from({ length: 8 }, (_, k): V3 => {
        const t = Math.PI / 8 + (k * Math.PI) / 4;
        const x = Math.cos(t) * r;
        return [x, y + Math.sin(t) * r, zFrente(x, y + Math.sin(t) * r) + sobre];
      }),
      T,
    );
    s.abanico(borde, [0, y, zFrente(0, y) + sobre], T, color, { pista: [0, 0, 1] });
  };
  disco(d.luz.r, 0.004, 0xf7fbfb);
  disco(d.luz.r * 0.66, 0.007, 0x8fe6ee);

  if (o.emblema === "herramienta") {
    // Llave en Y de la ingeniera, bajo la luz del pecho: tres tiras apoyadas sobre el traje.
    const y = d.luz.y - d.luz.r * 2.3;
    const g = d.luz.r * 0.22;
    const tira = (x0: number, y0: number, x1: number, y1: number) => {
      const l = Math.hypot(x1 - x0, y1 - y0);
      const nx = (-(y1 - y0) / l) * g;
      const ny = ((x1 - x0) / l) * g;
      const v = (x: number, yy: number) => s.vertice([x, yy, zFrente(x, yy) + 0.004], T);
      s.cara([v(x0 - nx, y0 - ny), v(x1 - nx, y1 - ny), v(x1 + nx, y1 + ny), v(x0 + nx, y0 + ny)], c.acento, { pista: [0, 0, 1] });
    };
    const r = d.luz.r;
    tira(0, y - r * 0.95, 0, y + r * 0.05);
    tira(0, y - r * 0.05, -r * 0.72, y + r * 0.72);
    tira(0, y - r * 0.05, r * 0.72, y + r * 0.72);
  }
  if (o.emblema === "sol") {
    // Sol de la meteoróloga: disco y ocho rayos apoyados sobre el pecho, a su izquierda de la luz.
    const cx = d.luz.r * 2.15;
    const cy = d.luz.y - 0.001;
    const en = (r: number, t: number, sobre: number): V3 => {
      const x = cx + Math.cos(t) * r;
      const y = cy + Math.sin(t) * r;
      return [x, y, zFrente(x, y) + sobre];
    };
    const r0 = d.luz.r * 0.5;
    const nucleo = s.anillo(
      Array.from({ length: 8 }, (_, k) => en(r0, (k * Math.PI) / 4, 0.006)),
      T,
    );
    s.abanico(nucleo, [cx, cy, zFrente(cx, cy) + 0.006], T, 0xf9c23c, { pista: [0, 0, 1] });
    for (let k = 0; k < 8; k++) {
      const t = Math.PI / 8 + (k * Math.PI) / 4;
      s.cara([s.vertice(en(r0 * 1.25, t - 0.2, 0.004), T), s.vertice(en(r0 * 1.25, t + 0.2, 0.004), T), s.vertice(en(r0 * 2, t, 0.004), T)], 0xf59a2e, { pista: [0, 0, 1] });
    }
  }

  // Mochila con panel y cápsulas laterales.
  const mo = d.mochila;
  const zm = zEspalda(0, mo.y) - mo.medio[2] + 0.01;
  s.caja([0, mo.y, zm], mo.medio, T, c.mochila, 0.3);
  const zp = zm - mo.medio[2] - 0.002;
  s.cara(
    s.anillo(
      [
        [-mo.medio[0] * 0.5, mo.y - mo.medio[1] * 0.38, zp],
        [mo.medio[0] * 0.5, mo.y - mo.medio[1] * 0.38, zp],
        [mo.medio[0] * 0.5, mo.y + mo.medio[1] * 0.46, zp],
        [-mo.medio[0] * 0.5, mo.y + mo.medio[1] * 0.46, zp],
      ],
      T,
    ),
    c.panelMochila,
    { pista: [0, 0, -1] },
  );
  for (const lado of [1, -1]) s.caja([lado * (mo.medio[0] + 0.009), mo.y - 0.008, zm], [0.012, mo.medio[1] * 0.56, mo.medio[2] * 0.6], T, c.panelMochila, 0.35);

  // Hebilla y bolsillo del cinturón.
  const cinturon = d.tronco.find((r) => r.banda === "cinturon");
  if (cinturon) {
    const y = cinturon.y + 0.01;
    s.caja([0.014 * e, y, zFrente(0.014 * e, y) + 0.003], [0.016 * e, 0.011 * e, 0.006 * e], P, 0x9b8f9a, 0.3);
    s.caja([-0.05 * e, y - 0.004, zFrente(-0.05 * e, y) + 0.008], [0.021 * e, 0.023 * e, 0.012 * e], P, c.acento, 0.3);
    if (o.rinoneras) s.caja([0.06 * e, y - 0.004, zFrente(0.06 * e, y) + 0.008], [0.021 * e, 0.023 * e, 0.012 * e], P, c.acento, 0.3);
  }

  if (o.bolso) {
    // Bandolera: del hombro izquierdo a la cadera derecha, por delante y por detrás.
    const pasos = 7;
    const bo = d.bolso;
    const cintura = d.tronco.find((r) => r.pesos.length === 2)?.y ?? 0.5;
    for (const cara of [1, -1] as const) {
      const z = (x: number, y: number) => (cara === 1 ? zFrente(x, y) + 0.005 : zEspalda(x, y) - 0.005);
      const izq: number[] = [];
      const der: number[] = [];
      for (let k = 0; k <= pasos; k++) {
        const u = k / pasos;
        const x = bo.desde[0] + (bo.hasta[0] - bo.desde[0]) * u;
        const y = bo.desde[1] + (bo.hasta[1] - bo.desde[1]) * u;
        const w = y > cintura + 0.015 ? T : y > cintura - 0.015 ? peso("pelvis", "torso") : P;
        izq.push(s.vertice([x - 0.0105, y + 0.0075, z(x - 0.0105, y + 0.0075)], w));
        der.push(s.vertice([x + 0.0105, y - 0.0075, z(x + 0.0105, y - 0.0075)], w));
      }
      for (let k = 0; k < pasos; k++) s.cara([izq[k]!, izq[k + 1]!, der[k + 1]!, der[k]!], c.acento, { pista: [0, 0, cara] });
    }
    const cb: V3 = [bo.bolsa[0], bo.bolsa[1], zFrente(bo.bolsa[0], bo.bolsa[1]) + 0.019];
    s.caja(cb, [0.036, 0.04, 0.02], P, c.acento, 0.3);
    const ze = cb[2] + 0.0215;
    s.cara(
      s.anillo(
        [
          [cb[0] - 0.019, cb[1] + 0.022, ze],
          [cb[0] - 0.019, cb[1] - 0.004, ze],
          [cb[0], cb[1] - 0.026, ze],
          [cb[0] + 0.019, cb[1] - 0.004, ze],
          [cb[0] + 0.019, cb[1] + 0.022, ze],
        ],
        P,
      ),
      0xf6e6dc,
      { pista: [0, 0, 1] },
    );
  }

  // Equipo de mano en la muñeca derecha, mismas medidas que en la tripulación A.
  const mano: V3 = [-d.muneca[0], d.muneca[1], d.muneca[2]];
  s.caja([mano[0], mano[1] + 0.025 * e, mano[2] + 0.038 * e], [0.045 * e, 0.055 * e, 0.007 * e], peso("tableta"), c.equipo, 0.3, 0x30255f);
  if (o.herramienta === "llave") {
    const L = peso("llave");
    s.caja([mano[0], mano[1] + 0.025, mano[2] + 0.03], [0.008, 0.05, 0.007], L, c.panelMochila, 0.3);
    for (const x of [-0.014, 0.014]) s.caja([mano[0] + x, mano[1] + 0.075, mano[2] + 0.03], [0.008, 0.022, 0.007], L, c.panelMochila, 0.3);
  }
  if (o.herramienta === "catalejo") s.caja([mano[0], mano[1], mano[2] + 0.07], [0.018, 0.018, 0.075], peso("catalejo"), c.equipo, 0.3, 0x73d4e1);

  // Antena: auricular, varilla y bola, a la derecha del personaje.
  const a = d.antena;
  const C = peso("cabeza");
  s.caja([a.x, a.yCaja, a.z], [0.015 * e, 0.027 * e, 0.016 * e], C, c.equipo, 0.3);
  const yVarilla = (a.yCaja + 0.027 * e + a.yBola) / 2;
  s.caja([a.x, yVarilla, a.z], [0.0045 * e, (a.yBola - a.yCaja - 0.027 * e) / 2, 0.0045 * e], C, c.equipo, 0.3);
  s.bola([a.x, a.yBola + 0.008 * e, a.z], [0.017 * e, 0.017 * e, 0.017 * e], C, 0xfbeee6);
}
