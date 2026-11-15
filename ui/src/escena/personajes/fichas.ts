import type { Anillo, V3 } from "./malla.js";

/**
 * Fichas de los cuatro tripulantes. Las proporciones salen de medir las hojas de referencia
 * (`assets/personajes/referencias/*-hoja.png`) fila a fila con `assets/personajes/herramientas/medir.py`
 * y se guardan como fracción de la altura total (suelo a tope del casco).
 *
 * Convención: +Z es el frente, +Y arriba, +X la IZQUIERDA del personaje.
 */

export type IdPersonaje = "ingeniera" | "doctora" | "meteorologa" | "nino";

export interface Proporciones {
  /** Cabezas por altura total; solo documenta el canon medido. */
  cabezas: number;
  casco: { y: number; rx: number; ry: number; rz: number };
  /** Centro del cráneo y su alto (mentón a coronilla, sin pelo). */
  craneo: { y: number; alto: number; ancho: number; mejillas: number };
  cuello: { y0: number; y1: number; r: number };
  collar: Array<{ y: number; r: number }>;
  pelvis: Anillo[];
  cinturon?: Anillo[];
  torso: Anillo[];
  hombro: V3;
  codo: V3;
  muneca: V3;
  radioBrazo: [number, number, number];
  mano: { largo: number; rx: number; rz: number };
  hombrera: { alto: number; rx: number; rz: number };
  muslo: Anillo[];
  rodilla: Anillo[];
  espinilla: Anillo[];
  bota: Anillo[];
  cadera: V3;
  articulacionRodilla: V3;
  tobillo: V3;
  mochila: { c: V3; medio: V3 };
  luz: { y: number; r: number };
  antena: { x: number; yCaja: number; yBola: number; z: number };
}

const lado = (cx: number, a: Omit<Anillo, "cx">): Anillo => ({ ...a, cx });

/** Adulta: 5,0 cabezas. Casco 0,38 de ancho; piernas 0,39; hombros 0,32 con hombreras. */
export const ADULTA: Proporciones = {
  cabezas: 5,
  casco: { y: 0.85, rx: 0.19, ry: 0.158, rz: 0.19 },
  craneo: { y: 0.872, alto: 0.225, ancho: 1.05, mejillas: 1.04 },
  cuello: { y0: 0.725, y1: 0.782, r: 0.031 },
  collar: [
    { y: 0.698, r: 0.112 },
    { y: 0.722, r: 0.136 },
    { y: 0.75, r: 0.13 },
    { y: 0.756, r: 0.098 },
  ],
  pelvis: [
    { y: 0.372, rx: 0.058, rz: 0.05, n: 2.4 },
    { y: 0.398, rx: 0.099, rz: 0.07, n: 2.6 },
    { y: 0.445, rx: 0.104, rz: 0.076, n: 2.8 },
    { y: 0.476, rx: 0.096, rz: 0.071, n: 2.8 },
  ],
  cinturon: [
    { y: 0.468, rx: 0.1, rz: 0.076, n: 3 },
    { y: 0.502, rx: 0.098, rz: 0.075, n: 3 },
    { y: 0.534, rx: 0.093, rz: 0.072, n: 3 },
  ],
  torso: [
    { y: 0.522, rx: 0.084, rz: 0.064, n: 2.8 },
    { y: 0.585, rx: 0.09, rz: 0.07, n: 2.8 },
    { y: 0.645, rx: 0.103, rz: 0.08, cz: 0.004, n: 2.8 },
    { y: 0.692, rx: 0.109, rz: 0.074, n: 2.8 },
    { y: 0.716, rx: 0.084, rz: 0.064, n: 2.6 },
    { y: 0.738, rx: 0.048, rz: 0.044, n: 2.2 },
  ],
  hombro: [0.122, 0.69, 0],
  codo: [0.141, 0.545, 0],
  muneca: [0.153, 0.425, 0.012],
  radioBrazo: [0.04, 0.035, 0.031],
  mano: { largo: 0.092, rx: 0.034, rz: 0.043 },
  hombrera: { alto: 0.06, rx: 0.052, rz: 0.058 },
  muslo: [
    lado(0.06, { y: 0.43, rx: 0.05, rz: 0.06, n: 2.6 }),
    lado(0.06, { y: 0.38, rx: 0.054, rz: 0.062, n: 2.6 }),
    lado(0.061, { y: 0.3, rx: 0.049, rz: 0.054, n: 2.6 }),
    lado(0.062, { y: 0.262, rx: 0.045, rz: 0.05, n: 2.6 }),
  ],
  rodilla: [
    lado(0.062, { y: 0.274, rx: 0.048, rz: 0.054, cz: 0.003, n: 2.8 }),
    lado(0.062, { y: 0.238, rx: 0.048, rz: 0.054, cz: 0.003, n: 2.8 }),
  ],
  espinilla: [
    lado(0.062, { y: 0.246, rx: 0.045, rz: 0.05, n: 2.6 }),
    lado(0.063, { y: 0.19, rx: 0.047, rz: 0.053, cz: -0.004, n: 2.6 }),
    lado(0.064, { y: 0.125, rx: 0.04, rz: 0.044, n: 2.6 }),
  ],
  bota: [
    lado(0.064, { y: 0.152, rx: 0.052, rz: 0.056, n: 2.8 }),
    lado(0.064, { y: 0.1, rx: 0.056, rz: 0.062, n: 2.8 }),
    lado(0.066, { y: 0.055, rx: 0.064, rz: 0.086, cz: 0.022, n: 3 }),
    lado(0.066, { y: 0.014, rx: 0.068, rz: 0.1, cz: 0.03, n: 3 }),
    lado(0.066, { y: 0, rx: 0.064, rz: 0.095, cz: 0.03, n: 3 }),
  ],
  cadera: [0.06, 0.4, 0],
  articulacionRodilla: [0.062, 0.256, 0.003],
  tobillo: [0.064, 0.125, 0],
  mochila: { c: [0, 0.6, -0.112], medio: [0.082, 0.095, 0.05] },
  luz: { y: 0.668, r: 0.027 },
  antena: { x: -0.16, yCaja: 0.84, yBola: 0.925, z: 0.035 },
};

/** Niño: 2,4 cabezas. Casco 0,72 de ancho; piernas 0,17; cuerpo corto y ancho. */
export const NINO: Proporciones = {
  cabezas: 2.4,
  casco: { y: 0.678, rx: 0.36, ry: 0.32, rz: 0.355 },
  craneo: { y: 0.712, alto: 0.4, ancho: 1.12, mejillas: 1.14 },
  cuello: { y0: 0.44, y1: 0.535, r: 0.05 },
  collar: [
    { y: 0.42, r: 0.2 },
    { y: 0.452, r: 0.262 },
    { y: 0.488, r: 0.25 },
    { y: 0.496, r: 0.19 },
  ],
  pelvis: [
    { y: 0.16, rx: 0.09, rz: 0.085, n: 2.4 },
    { y: 0.195, rx: 0.152, rz: 0.125, n: 2.8 },
    { y: 0.26, rx: 0.158, rz: 0.13, n: 2.8 },
  ],
  cinturon: [
    { y: 0.222, rx: 0.162, rz: 0.134, n: 3 },
    { y: 0.242, rx: 0.164, rz: 0.136, n: 3 },
    { y: 0.262, rx: 0.163, rz: 0.135, n: 3 },
  ],
  torso: [
    { y: 0.25, rx: 0.156, rz: 0.128, n: 2.8 },
    { y: 0.33, rx: 0.158, rz: 0.132, cz: 0.004, n: 2.8 },
    { y: 0.4, rx: 0.15, rz: 0.12, n: 2.8 },
    { y: 0.44, rx: 0.11, rz: 0.09, n: 2.6 },
    { y: 0.468, rx: 0.062, rz: 0.056, n: 2.2 },
  ],
  hombro: [0.166, 0.405, 0],
  codo: [0.206, 0.33, 0.008],
  muneca: [0.23, 0.268, 0.02],
  radioBrazo: [0.054, 0.05, 0.047],
  mano: { largo: 0.115, rx: 0.056, rz: 0.066 },
  hombrera: { alto: 0.062, rx: 0.066, rz: 0.072 },
  muslo: [
    lado(0.086, { y: 0.215, rx: 0.074, rz: 0.086, n: 2.6 }),
    lado(0.088, { y: 0.128, rx: 0.07, rz: 0.078, n: 2.6 }),
  ],
  rodilla: [],
  espinilla: [
    lado(0.088, { y: 0.134, rx: 0.068, rz: 0.076, n: 2.6 }),
    lado(0.09, { y: 0.08, rx: 0.064, rz: 0.07, n: 2.6 }),
  ],
  bota: [
    lado(0.09, { y: 0.108, rx: 0.078, rz: 0.086, n: 2.8 }),
    lado(0.09, { y: 0.072, rx: 0.082, rz: 0.092, n: 2.8 }),
    lado(0.092, { y: 0.036, rx: 0.088, rz: 0.122, cz: 0.03, n: 3 }),
    lado(0.092, { y: 0.01, rx: 0.09, rz: 0.136, cz: 0.04, n: 3 }),
    lado(0.092, { y: 0, rx: 0.086, rz: 0.13, cz: 0.04, n: 3 }),
  ],
  cadera: [0.086, 0.185, 0],
  articulacionRodilla: [0.088, 0.13, 0],
  tobillo: [0.09, 0.085, 0],
  mochila: { c: [0, 0.325, -0.168], medio: [0.118, 0.095, 0.05] },
  luz: { y: 0.34, r: 0.04 },
  antena: { x: -0.262, yCaja: 0.79, yBola: 0.93, z: 0.02 },
};

export interface Pelo {
  color: number;
  /** Línea del pelo: [grados desde el frente (+ = izquierda del personaje), y en altos de cráneo]. */
  linea: Array<[number, number]>;
  /** Niveles de arriba abajo, en altos de cráneo (0 = centro, 0,5 = coronilla). */
  niveles: number[];
  /** Grosor radial sobre el cráneo según ángulo (grados) y altura. */
  grosor: (grados: number, y: number) => number;
  /** Altura extra de la coronilla. */
  alza: number;
  ruido: number;
  segmentos: number;
  mono?: { c: V3; r: V3 };
}

export interface Rasgos {
  /** Posiciones en altos de cráneo, origen en el centro del cráneo. */
  ojoX: number;
  ojoY: number;
  ojoRx: number;
  ojoRy: number;
  cejaY: number;
  cejaAncho: number;
  bocaY: number;
  bocaAncho: number;
  narizY: number;
  orejaEscala: number;
}

export interface Paleta {
  piel: number;
  pielSombra: number;
  traje: number;
  trajeSombra: number;
  acento: number;
  guante: number;
  bota: number;
  suela: number;
  collar: number;
  mochila: number;
  panelMochila: number;
  cinturon?: number;
  equipo: number;
  ceja: number;
}

export interface Ficha {
  id: IdPersonaje;
  /** Altura en metros, suelo a tope del casco. */
  altura: number;
  proporciones: Proporciones;
  paleta: Paleta;
  pelo: Pelo;
  rasgos: Rasgos;
  gafas?: boolean;
  bolso?: boolean;
  rinoneras?: boolean;
  cinturonFino?: boolean;
  emblema: "herramienta" | "sol" | "ninguno";
  hombreras: boolean;
}

// Valores de `ui/src/estilos/tokens.ts` (DISEÑO §2.2). Al portar a la rama v8 se leen de ahí con `colorToken`.
const MARFIL = 0xfce6d6;
const MARFIL_SOMBRA = 0xe3c4bb;
const TURQUESA = 0x47aab5;
const NARANJA = 0xf88536;
const CIRUELA = 0x94478b;
const INDIGO = 0x675b95;
const INDIGO_OSCURO = 0x4d4474;
const EQUIPO = 0xf3e6dc;

const RASGOS_ADULTA: Rasgos = {
  ojoX: 0.172,
  ojoY: -0.03,
  ojoRx: 0.05,
  ojoRy: 0.1,
  cejaY: 0.15,
  cejaAncho: 0.18,
  bocaY: -0.275,
  bocaAncho: 0.27,
  narizY: -0.14,
  orejaEscala: 1,
};

/** Interpola una tabla [x, valor] ordenada por x. */
export function tabla(t: Array<[number, number]>, x: number): number {
  if (x <= t[0]![0]!) return t[0]![1]!;
  for (let i = 1; i < t.length; i++) {
    if (x <= t[i]![0]!) {
      const k = (x - t[i - 1]![0]!) / (t[i]![0]! - t[i - 1]![0]!);
      return t[i - 1]![1]! + (t[i]![1]! - t[i - 1]![1]!) * k;
    }
  }
  return t[t.length - 1]![1]!;
}

export const FICHAS: Record<IdPersonaje, Ficha> = {
  ingeniera: {
    id: "ingeniera",
    altura: 1.75,
    proporciones: ADULTA,
    paleta: {
      piel: 0xe38853,
      pielSombra: 0xc9713f,
      traje: MARFIL,
      trajeSombra: MARFIL_SOMBRA,
      acento: NARANJA,
      guante: TURQUESA,
      bota: INDIGO,
      suela: INDIGO_OSCURO,
      collar: TURQUESA,
      mochila: EQUIPO,
      panelMochila: NARANJA,
      cinturon: NARANJA,
      equipo: EQUIPO,
      ceja: 0x5e2a2c,
    },
    // Melena ondulada al mentón, flequillo barrido hacia su derecha, raya a su izquierda.
    pelo: {
      color: 0x823b35,
      linea: [
        [-180, -0.56],
        [-100, -0.56],
        [-74, -0.5],
        [-58, -0.06],
        [-40, 0.1],
        [-14, 0.2],
        [12, 0.3],
        [30, 0.26],
        [50, 0.04],
        [64, -0.46],
        [100, -0.56],
        [180, -0.56],
      ],
      niveles: [0.5, 0.4, 0.24, 0.06, -0.14, -0.32, -0.46, -0.56],
      grosor: (g, y) => {
        const costado = Math.min(1, Math.abs(g) / 60);
        const caida = y < 0.15 ? Math.min(1, (0.15 - y) / 0.4) : 0;
        const recoge = y < -0.44 ? (y + 0.44) * 1.4 : 0;
        return 1.07 + costado * (0.19 + caida * 0.3) + recoge;
      },
      alza: 0.06,
      ruido: 0.085,
      segmentos: 11,
    },
    rasgos: RASGOS_ADULTA,
    rinoneras: true,
    emblema: "herramienta",
    hombreras: true,
  },
  doctora: {
    id: "doctora",
    altura: 1.72,
    proporciones: ADULTA,
    paleta: {
      piel: 0xc87654,
      pielSombra: 0xae6243,
      traje: MARFIL,
      trajeSombra: MARFIL_SOMBRA,
      acento: TURQUESA,
      guante: TURQUESA,
      bota: INDIGO,
      suela: INDIGO_OSCURO,
      collar: TURQUESA,
      mochila: EQUIPO,
      panelMochila: TURQUESA,
      cinturon: 0xb9a7b4,
      equipo: EQUIPO,
      ceja: 0x3a2742,
    },
    // Pelo oscuro recogido con raya al medio y moño bajo en la nuca.
    pelo: {
      color: 0x533848,
      linea: [
        [-180, -0.36],
        [-120, -0.3],
        [-92, -0.16],
        [-76, 0.0],
        [-52, 0.14],
        [-24, 0.25],
        [0, 0.31],
        [24, 0.25],
        [52, 0.14],
        [76, 0.0],
        [92, -0.16],
        [120, -0.3],
        [180, -0.36],
      ],
      niveles: [0.5, 0.4, 0.26, 0.1, -0.06, -0.2, -0.36],
      grosor: (g, y) => 1.05 + Math.min(1, Math.abs(g) / 90) * 0.05 + (y > 0.3 ? 0.02 : 0),
      alza: 0.035,
      ruido: 0.025,
      segmentos: 14,
      mono: { c: [-0.13, -0.3, -0.47], r: [0.23, 0.21, 0.19] },
    },
    rasgos: RASGOS_ADULTA,
    gafas: true,
    bolso: true,
    cinturonFino: true,
    emblema: "ninguno",
    hombreras: true,
  },
  meteorologa: {
    id: "meteorologa",
    altura: 1.7,
    proporciones: ADULTA,
    paleta: {
      piel: 0xdd8c5c,
      pielSombra: 0xc27649,
      traje: MARFIL,
      trajeSombra: MARFIL_SOMBRA,
      acento: CIRUELA,
      guante: TURQUESA,
      bota: INDIGO,
      suela: INDIGO_OSCURO,
      collar: TURQUESA,
      mochila: CIRUELA,
      panelMochila: 0xa860a0,
      cinturon: 0xb9a7b4,
      equipo: EQUIPO,
      ceja: 0x6a5a66,
    },
    // Pelo gris corto, con volumen arriba y barrido hacia su derecha.
    pelo: {
      color: 0xc8b5bd,
      linea: [
        [-180, -0.38],
        [-128, -0.34],
        [-110, -0.12],
        [-94, 0.03],
        [-70, 0.05],
        [-46, 0.07],
        [-16, 0.2],
        [14, 0.36],
        [36, 0.35],
        [58, 0.2],
        [76, 0.05],
        [94, 0.03],
        [110, -0.12],
        [128, -0.34],
        [180, -0.38],
      ],
      niveles: [0.5, 0.42, 0.28, 0.12, -0.04, -0.2, -0.4],
      grosor: (g, y) => {
        const arriba = y > 0.05 ? Math.min(1, (y - 0.05) / 0.3) : 0;
        const barrido = g < 30 && g > -120 ? 0.14 : 0;
        return 1.07 + Math.min(1, Math.abs(g) / 80) * 0.07 + arriba * (0.1 + barrido);
      },
      alza: 0.2,
      ruido: 0.09,
      segmentos: 11,
    },
    rasgos: RASGOS_ADULTA,
    cinturonFino: true,
    emblema: "sol",
    hombreras: true,
  },
  nino: {
    id: "nino",
    altura: 1.18,
    proporciones: NINO,
    paleta: {
      piel: 0xd97b54,
      pielSombra: 0xbf6644,
      traje: MARFIL,
      trajeSombra: MARFIL_SOMBRA,
      acento: TURQUESA,
      guante: TURQUESA,
      bota: INDIGO,
      suela: INDIGO_OSCURO,
      collar: TURQUESA,
      mochila: EQUIPO,
      panelMochila: NARANJA,
      cinturon: 0xb9a7b4,
      equipo: EQUIPO,
      ceja: 0x3f2433,
    },
    // Pelo corto, redondo y esponjado; orejas a la vista.
    pelo: {
      color: 0x6e4250,
      linea: [
        [-180, -0.3],
        [-132, -0.28],
        [-114, -0.1],
        [-98, 0.12],
        [-78, 0.17],
        [-50, 0.19],
        [-30, 0.28],
        [-10, 0.2],
        [10, 0.21],
        [30, 0.29],
        [50, 0.2],
        [78, 0.17],
        [98, 0.12],
        [114, -0.1],
        [132, -0.28],
        [180, -0.3],
      ],
      niveles: [0.5, 0.42, 0.28, 0.12, -0.04, -0.18, -0.3],
      grosor: (g, y) => 1.045 + Math.min(1, Math.abs(g) / 60) * 0.235 + (y > 0.1 ? 0.05 : 0),
      alza: 0.13,
      ruido: 0.085,
      segmentos: 18,
    },
    rasgos: {
      ojoX: 0.2,
      ojoY: -0.09,
      ojoRx: 0.056,
      ojoRy: 0.105,
      cejaY: 0.095,
      cejaAncho: 0.15,
      bocaY: -0.3,
      bocaAncho: 0.28,
      narizY: -0.2,
      orejaEscala: 1.35,
    },
    cinturonFino: true,
    emblema: "ninguno",
    hombreras: true,
  },
};
