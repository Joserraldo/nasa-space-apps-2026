import type { Paleta } from "./fichas.js";
import { puntoAnillo, type Anillo, type V3 } from "./malla.js";
import type { Pesos, Superficie } from "./superficie.js";

/**
 * Cabeza B. Unidades locales: altos de cráneo (AC), origen en el centro del cráneo, mentón en -0,5.
 *
 * La cabeza es una malla cerrada de 16 x 9 con sombreado suave. Cada anillo tiene centro propio:
 * el mentón y la mandíbula van adelantados y la nuca atrasada, que es lo que separa esta forma
 * de un huevo o de una caja. Frente, sien, pómulo, mejilla y mentón son filas de la tabla.
 */

/** [y, medio ancho, z del frente, z de atrás, z del centro, exponente (2 = elipse, más = más lleno)]. */
type Fila = [y: number, w: number, zF: number, zB: number, cz: number, n: number];

export interface FormaCabeza {
  filas: Fila[];
  /** Mezcla de rubor por [fila, columna] (columna 0 = centro de la cara, 16 por vuelta). */
  rubor: Array<[fila: number, columna: number, cantidad: number]>;
  oreja: { y: number; z: number; alto: number; fondo: number; sale: number };
  nariz: { y: number; ancho: number; alto: number; sale: number };
}

export const CABEZA_ADULTA: FormaCabeza = {
  filas: [
    [-0.5, 0.11, 0.33, 0.12, 0.22, 2.0], // punta del mentón
    [-0.44, 0.235, 0.395, -0.02, 0.16, 2.2], // mentón
    [-0.34, 0.32, 0.425, -0.18, 0.08, 2.4], // mandíbula y boca
    [-0.2, 0.385, 0.44, -0.35, 0.0, 2.5], // mejilla
    [-0.05, 0.4, 0.435, -0.44, -0.02, 2.5], // pómulo y ojos
    [0.12, 0.395, 0.43, -0.48, -0.03, 2.4], // sien y ceja
    [0.28, 0.36, 0.395, -0.47, -0.04, 2.3], // frente
    [0.4, 0.28, 0.31, -0.39, -0.04, 2.2],
    [0.47, 0.16, 0.18, -0.25, -0.04, 2.0],
  ],
  rubor: [
    [3, 2, 0.34],
    [3, 1, 0.14],
    [3, 3, 0.16],
    [2, 2, 0.14],
  ],
  oreja: { y: -0.07, z: -0.06, alto: 0.105, fondo: 0.072, sale: 0.075 },
  nariz: { y: -0.2, ancho: 0.05, alto: 0.044, sale: 0.058 },
};

/**
 * Niño: cráneo más ancho y redondo (1,07 del adulto, como en la ficha A), mejillas llenas y bajas,
 * mentón corto, orejas grandes y nariz de botón. El rubor es más marcado.
 */
export const CABEZA_NINO: FormaCabeza = {
  filas: [
    [-0.5, 0.12, 0.3, 0.08, 0.19, 2.0],
    [-0.45, 0.26, 0.385, -0.06, 0.14, 2.2],
    [-0.35, 0.36, 0.43, -0.22, 0.07, 2.5],
    [-0.21, 0.42, 0.45, -0.37, 0.0, 2.6],
    [-0.06, 0.425, 0.445, -0.45, -0.02, 2.5],
    [0.12, 0.41, 0.44, -0.49, -0.03, 2.4],
    [0.28, 0.37, 0.4, -0.47, -0.04, 2.3],
    [0.4, 0.285, 0.31, -0.39, -0.04, 2.2],
    [0.47, 0.16, 0.18, -0.25, -0.04, 2.0],
  ],
  rubor: [
    [3, 2, 0.42],
    [3, 1, 0.18],
    [3, 3, 0.2],
    [2, 2, 0.2],
  ],
  oreja: { y: -0.09, z: -0.06, alto: 0.125, fondo: 0.085, sale: 0.095 },
  nariz: { y: -0.215, ancho: 0.046, alto: 0.04, sale: 0.05 },
};

/** Meteoróloga: la cabeza adulta con la mandíbula algo más fina, pómulo marcado y nariz un punto mayor. */
export const CABEZA_METEOROLOGA: FormaCabeza = {
  filas: [
    [-0.5, 0.105, 0.33, 0.12, 0.22, 2.0],
    [-0.44, 0.225, 0.395, -0.02, 0.16, 2.2],
    [-0.34, 0.308, 0.425, -0.18, 0.08, 2.4],
    [-0.2, 0.378, 0.44, -0.35, 0.0, 2.5],
    [-0.05, 0.4, 0.437, -0.44, -0.02, 2.5],
    [0.12, 0.395, 0.43, -0.48, -0.03, 2.4],
    [0.28, 0.36, 0.395, -0.47, -0.04, 2.3],
    [0.4, 0.28, 0.31, -0.39, -0.04, 2.2],
    [0.47, 0.16, 0.18, -0.25, -0.04, 2.0],
  ],
  rubor: [
    [3, 2, 0.3],
    [3, 1, 0.12],
    [3, 3, 0.14],
    [2, 2, 0.1],
  ],
  oreja: { y: -0.07, z: -0.06, alto: 0.105, fondo: 0.072, sale: 0.075 },
  nariz: { y: -0.2, ancho: 0.052, alto: 0.048, sale: 0.064 },
};

const SEG = 16;
const RUBOR = 0xe9746c;

function mezclaColor(a: number, b: number, k: number): number {
  const canal = (d: number) => Math.round(((a >> d) & 255) + (((b >> d) & 255) - ((a >> d) & 255)) * k);
  return (canal(16) << 16) | (canal(8) << 8) | canal(0);
}

const anilloFila = (f: Fila): Anillo => ({ y: f[0], rx: f[1], rz: f[2] - f[4], rzB: f[4] - f[3], cz: f[4], n: f[5] });

/** Sección del cráneo a la altura `y`, interpolando la tabla. */
export function seccion(forma: FormaCabeza, y: number): Anillo {
  const t = forma.filas;
  if (y <= t[0]![0]) return anilloFila(t[0]!);
  for (let i = 1; i < t.length; i++) {
    if (y <= t[i]![0]) {
      const a = t[i - 1]!;
      const b = t[i]!;
      const k = (y - a[0]) / (b[0] - a[0]);
      return anilloFila(a.map((v, j) => v + (b[j]! - v) * k) as Fila);
    }
  }
  return anilloFila(t[t.length - 1]!);
}

type AMundo = (p: V3) => V3;

export function construirCabezaB(s: Superficie, c: Paleta, forma: FormaCabeza, aMundo: AMundo, W: Pesos): void {
  s.etiqueta = "cara";
  const anillos = forma.filas.map((f) =>
    s.anillo(
      Array.from({ length: SEG }, (_, i) => aMundo(puntoAnillo(anilloFila(f), (i * 2 * Math.PI) / SEG))),
      W,
    ),
  );
  for (let i = 0; i < anillos.length - 1; i++) s.puente(anillos[i]!, anillos[i + 1]!, c.piel, { suave: true });
  const base = forma.filas[0]!;
  const cima = forma.filas[forma.filas.length - 1]!;
  s.abanico(anillos[0]!, aMundo([0, base[0] - 0.018, base[4]]), W, c.piel, { suave: true });
  s.abanico(anillos[anillos.length - 1]!, aMundo([0, cima[0] + 0.03, cima[4]]), W, c.piel, { suave: true });
  for (const [fila, col, k] of forma.rubor) {
    const color = mezclaColor(c.piel, RUBOR, k);
    s.tenir(anillos[fila]![col]!, color);
    s.tenir(anillos[fila]![SEG - col]!, color);
  }

  // Orejas: tres contornos en C, hundidos en el costado para que nazcan de la cabeza.
  s.etiqueta = "oreja";
  const o = forma.oreja;
  const ancho = seccion(forma, o.y).rx;
  for (const lado of [1, -1]) {
    const contorno = (x: number, k: number, dz: number): number[] =>
      s.anillo(
        (
          [
            [0.95, 0.15],
            [0.55, 0.9],
            [-0.35, 0.85],
            [-1, 0.1],
            [-0.5, -0.8],
            [0.6, -0.75],
          ] as Array<[number, number]>
        ).map(([py, pz]): V3 => aMundo([lado * x, o.y + py * o.alto * k, o.z + dz + pz * o.fondo * k])),
        W,
      );
    const a = contorno(ancho - 0.06, 1, 0.02);
    const b = contorno(ancho + o.sale * 0.62, 1, -0.012);
    const d = contorno(ancho + o.sale, 0.6, -0.03);
    s.puente(a, b, c.piel, { suave: true });
    s.puente(b, d, c.piel, { suave: true });
    s.abanico(d, aMundo([lado * (ancho + o.sale * 0.9), o.y, o.z - 0.03]), W, c.pielSombra, { suave: true });
    s.cara(a, c.piel);
  }

  // Nariz: botón de dos niveles hundido en la cara; con normales suaves se lee como un bulto, no una pirámide.
  s.etiqueta = "nariz";
  const n = forma.nariz;
  const zCara = puntoAnillo(seccion(forma, n.y), 0)[2];
  const rosa = mezclaColor(c.piel, RUBOR, 0.12);
  const hexagono = (k: number, z: number): number[] =>
    s.anillo(
      Array.from({ length: 6 }, (_, i): V3 => {
        const t = (i * Math.PI) / 3;
        return aMundo([Math.sin(t) * n.ancho * k, n.y + Math.cos(t) * n.alto * k, z]);
      }),
      W,
    );
  const r0 = hexagono(1, zCara - 0.03);
  const r1 = hexagono(0.6, zCara + n.sale * 0.7);
  s.puente(r0, r1, rosa, { suave: true });
  s.abanico(r1, aMundo([0, n.y, zCara + n.sale]), W, rosa, { suave: true });
  s.cara(r0, rosa);
}

export interface FormaPelo {
  /**
   * Por columna: [grados desde el frente (+ = izquierda del personaje), y de la línea del pelo, grosor, avance en z,
   * volumen extra sobre la línea del pelo (opcional)].
   */
  columnas: Array<[grados: number, linea: number, grosor: number, avance: number, volumen?: number]>;
  cima: { x: number; y: number; z: number; rx: number; rz: number };
  mono?: { c: V3; r: V3 };
}

/**
 * Doctora: raya a su izquierda, masa barrida hacia su derecha que cubre media frente, sienes
 * tapadas hasta la oreja, nuca baja y moño. Diez columnas y cuatro niveles: planos grandes.
 */
export const PELO_DOCTORA: FormaPelo = {
  columnas: [
    [18, 0.33, 1.13, 0.012],
    [54, 0.13, 1.15, 0.01],
    [90, 0.0, 1.14, 0],
    [126, -0.2, 1.14, 0],
    [162, -0.36, 1.13, 0],
    [198, -0.36, 1.13, 0],
    [234, -0.2, 1.14, 0],
    [270, 0.0, 1.14, 0],
    [306, 0.1, 1.15, 0.008],
    [342, 0.23, 1.15, 0.016],
  ],
  cima: { x: 0.02, y: 0.56, z: -0.04, rx: 0.29, rz: 0.31 },
  mono: { c: [-0.02, -0.26, -0.5], r: [0.2, 0.19, 0.19] },
};

/**
 * Niño: pelo corto, redondo y esponjado; flequillo alto con un leve remolino a su izquierda,
 * patilla corta delante de la oreja y orejas a la vista. Doce columnas.
 */
export const PELO_NINO: FormaPelo = {
  columnas: [
    [15, 0.31, 1.13, 0.034, 0.06],
    [45, 0.2, 1.17, 0.022, 0.07],
    [75, 0.15, 1.21, 0, 0.08],
    [105, 0.08, 1.22, 0, 0.08],
    [135, -0.2, 1.2, 0, 0.07],
    [165, -0.3, 1.18, 0, 0.06],
    [195, -0.3, 1.18, 0, 0.06],
    [225, -0.2, 1.2, 0, 0.07],
    [255, 0.08, 1.22, 0, 0.08],
    [285, 0.14, 1.21, 0, 0.08],
    [315, 0.27, 1.17, 0.02, 0.07],
    [345, 0.22, 1.14, 0.036, 0.06],
  ],
  cima: { x: 0.02, y: 0.58, z: -0.03, rx: 0.31, rz: 0.33 },
};

/**
 * Meteoróloga: pelo plateado corto con volumen. Raya a su izquierda y onda grande barrida hacia
 * su derecha que baja sobre media frente; sienes despejadas (orejas a la vista) y nuca corta.
 */
export const PELO_METEOROLOGA: FormaPelo = {
  columnas: [
    [15, 0.38, 1.12, 0.01, 0.02],
    [45, 0.3, 1.13, 0.008, 0],
    [75, 0.12, 1.12, 0, 0],
    [105, 0.04, 1.12, 0, 0],
    [135, -0.22, 1.14, 0, 0.02],
    [165, -0.34, 1.13, 0, 0.03],
    [195, -0.34, 1.13, 0, 0.03],
    [225, -0.22, 1.14, 0, 0.03],
    [255, 0.03, 1.13, 0, 0.02],
    [285, 0.06, 1.14, 0.012, 0.04],
    [315, 0.22, 1.17, 0.034, 0.1],
    [345, 0.27, 1.15, 0.034, 0.11],
  ],
  cima: { x: -0.07, y: 0.585, z: -0.01, rx: 0.3, rz: 0.31 },
};

/**
 * Ingeniera: melena ondulada al mentón que tapa las orejas, raya a su izquierda y flequillo
 * barrido hacia su derecha. Los costados caen rectos desde la sien y enmarcan la cara.
 */
export const PELO_INGENIERA: FormaPelo = {
  columnas: [
    [15, 0.31, 1.13, 0.012, 0.03],
    [45, 0.12, 1.16, 0.02, 0.06],
    [75, -0.4, 1.2, 0.006, 0.08],
    [105, -0.45, 1.21, 0, 0.08],
    [135, -0.46, 1.19, 0, 0.07],
    [165, -0.46, 1.17, 0, 0.06],
    [195, -0.46, 1.17, 0, 0.06],
    [225, -0.46, 1.19, 0, 0.07],
    [255, -0.45, 1.21, 0, 0.08],
    [285, -0.4, 1.2, 0.006, 0.08],
    [315, 0.19, 1.17, 0.03, 0.09],
    [345, 0.24, 1.15, 0.034, 0.09],
  ],
  cima: { x: -0.03, y: 0.575, z: -0.03, rx: 0.3, rz: 0.31 },
};

export function construirPeloB(s: Superficie, color: number, forma: FormaCabeza, pelo: FormaPelo, aMundo: AMundo, W: Pesos): void {
  s.etiqueta = "pelo";
  const TOPE = 0.5;
  const sobre = (grados: number, y: number, g: number, avance: number): V3 => {
    // Bajo la mejilla el pelo cae recto: se toma la sección de la mejilla, no la del mentón.
    // Arriba tampoco se sigue el cráneo, que se cierra rápido: el pelo conserva el ancho de la sien y hace cúpula.
    const a = seccion(forma, Math.max(-0.2, Math.min(0.2, y)));
    const p = puntoAnillo(a, grados * (Math.PI / 180));
    const cz = a.cz ?? 0;
    return [p[0] * g, y, cz + (p[2] - cz) * g + avance];
  };
  const nivel = (k: number, extra: number, canto = false): number[] =>
    s.anillo(
      pelo.columnas.map(([grados, linea, grosor, avance, volumen]) =>
        aMundo(canto ? sobre(grados, linea + 0.02, 0.95, 0) : sobre(grados, linea + (TOPE - linea) * k, grosor + extra + (k > 0 ? (volumen ?? 0) : 0), avance * (1 - k))),
      ),
      W,
    );
  const canto = nivel(0, 0, true);
  const borde = nivel(0, 0);
  const medio = nivel(0.36, 0.045);
  const alto = nivel(0.7, 0.03);
  const cm = pelo.cima;
  const corona = s.anillo(
    pelo.columnas.map(([grados]): V3 => {
      const t = grados * (Math.PI / 180);
      return aMundo([cm.x + Math.sin(t) * cm.rx, cm.y, cm.z + Math.cos(t) * cm.rz]);
    }),
    W,
  );
  s.puente(canto, borde, color);
  s.puente(borde, medio, color);
  s.puente(medio, alto, color);
  s.puente(alto, corona, color);
  s.abanico(corona, aMundo([cm.x, cm.y + 0.03, cm.z]), W, color);
  if (pelo.mono) {
    const e = aMundo([1, 0, 0])[0] - aMundo([0, 0, 0])[0];
    s.esferoide(aMundo(pelo.mono.c), [pelo.mono.r[0] * e, pelo.mono.r[1] * e, pelo.mono.r[2] * e], W, color);
  }
}

export interface Gafas {
  x: number;
  y: number;
  radio: number;
  grosor: number;
}

/** Montura octogonal maciza (toro de cuatro bucles), puente y patillas. `zCara` da la profundidad de la piel. */
export function construirGafasB(s: Superficie, g: Gafas, forma: FormaCabeza, zCara: (x: number, y: number) => number, aMundo: AMundo, W: Pesos): void {
  s.etiqueta = "gafas";
  const color = 0xf6e6dc;
  const z0 = zCara(g.x, g.y) + 0.058;
  const giro = 0.3;
  for (const lado of [1, -1]) {
    const pt = (i: number, r: number, dz: number): V3 => {
      const t = Math.PI / 8 + (i * Math.PI) / 4;
      const lx = Math.cos(t) * r;
      // Cada lente gira hacia la sien para seguir la cara.
      return aMundo([lado * (g.x + lx * Math.cos(giro)), g.y + Math.sin(t) * r, z0 + dz - lx * Math.sin(giro)]);
    };
    const lazo = (r: number, dz: number) => s.anillo(Array.from({ length: 8 }, (_, i) => pt(i, r, dz)), W);
    const lazos = [lazo(g.radio, 0), lazo(g.radio - g.grosor, 0), lazo(g.radio - g.grosor, -0.03), lazo(g.radio, -0.03)];
    for (let i = 0; i < 4; i++) s.puente(lazos[i]!, lazos[(i + 1) % 4]!, color);
    // Patilla hasta la oreja.
    const xo = seccion(forma, g.y).rx + 0.02;
    const x0 = g.x + g.radio * Math.cos(giro) - 0.01;
    const za = z0 - g.radio * Math.sin(giro) - 0.015;
    const tramo = (x: number, z: number) =>
      s.anillo(
        [
          [lado * x, g.y + 0.012, z],
          [lado * (x + 0.014), g.y + 0.012, z],
          [lado * (x + 0.014), g.y - 0.012, z],
          [lado * x, g.y - 0.012, z],
        ].map((p) => aMundo(p as V3)),
        W,
      );
    const p0 = tramo(x0, za);
    const p1 = tramo(xo, forma.oreja.z + 0.04);
    s.puente(p0, p1, color);
    s.cara(p0, color);
    s.cara(p1, color);
  }
  const xi = g.x - (g.radio - g.grosor * 0.5) * Math.cos(giro);
  const zi = z0 + (g.radio - g.grosor * 0.5) * Math.sin(giro) - 0.015;
  const e = aMundo([1, 0, 0])[0] - aMundo([0, 0, 0])[0];
  s.caja(aMundo([0, g.y + 0.02, zi]), [xi * e, 0.016 * e, 0.012 * e], W, color, 0.3);
}
