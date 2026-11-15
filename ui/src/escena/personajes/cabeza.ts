import * as THREE from "three";
import { tabla, type Ficha, type Pelo } from "./fichas.js";
import { azar, puntoAnillo, type Anillo, type ConstructorMalla, type V3 } from "./malla.js";

/**
 * Cabeza: cráneo continuo por secciones (no una esfera), orejas, nariz, pelo en casquete
 * con línea del pelo propia y rasgos pintados que cambian por expresión.
 *
 * Unidades locales: altos de cráneo (AC). Origen en el centro del cráneo, mentón en y = -0,5.
 */

/** Perfil del cráneo: [y, radio lateral, radio frontal, radio trasero]. */
const PERFIL: Array<[number, number, number, number]> = [
  [-0.5, 0.13, 0.19, 0.1],
  [-0.42, 0.25, 0.31, 0.22],
  [-0.28, 0.365, 0.385, 0.33],
  [-0.1, 0.43, 0.41, 0.42],
  [0.1, 0.44, 0.41, 0.46],
  [0.28, 0.4, 0.37, 0.45],
  [0.42, 0.28, 0.26, 0.33],
  [0.5, 0.1, 0.09, 0.12],
];
const N_CRANEO = 2.5;
const SEG_CRANEO = 10;

export interface Craneo {
  anillo(y: number): Anillo;
  /** Punto de la superficie en el ángulo `t` (radianes) y altura `y`, en AC. */
  punto(t: number, y: number): V3;
  /** Profundidad de la cara en (x, y): dónde apoyar ojos, cejas y boca. */
  frente(x: number, y: number): number;
}

export function crearCraneo(ancho: number, mejillas: number): Craneo {
  const col = (i: 1 | 2 | 3) => PERFIL.map((p): [number, number] => [p[0], p[i]]);
  const rx = col(1);
  const rf = col(2);
  const rb = col(3);
  const anillo = (y: number): Anillo => {
    const yy = Math.max(-0.5, Math.min(0.5, y));
    // Las mejillas ensanchan solo la mitad inferior: es lo que separa una cara infantil de una adulta.
    const baja = yy < 0 ? 1 + (mejillas - 1) * Math.min(1, -yy / 0.3) * (yy < -0.42 ? 0.5 : 1) : 1;
    return { y: yy, rx: tabla(rx, yy) * ancho * baja, rz: tabla(rf, yy), rzB: tabla(rb, yy), n: N_CRANEO };
  };
  return {
    anillo,
    punto: (t, y) => puntoAnillo(anillo(y), t),
    frente: (x, y) => {
      const a = anillo(y);
      const k = Math.min(0.999, Math.abs(x) / a.rx);
      // La cara es facetada: la cuerda queda por dentro de la curva, así que se resta la flecha.
      return a.rz * (1 - k ** N_CRANEO) ** (1 / N_CRANEO) * 0.985;
    },
  };
}

type Local = (p: V3) => V3;

export function construirCabeza(m: ConstructorMalla, f: Ficha, craneo: Craneo, aMundo: Local, hueso: number): void {
  const { paleta: c, rasgos: r } = f;

  // Cráneo.
  const anillos = PERFIL.map((p) => {
    const a = craneo.anillo(p[0]);
    const pts: V3[] = [];
    for (let i = 0; i < SEG_CRANEO; i++) pts.push(aMundo(puntoAnillo(a, Math.PI / SEG_CRANEO + (i * 2 * Math.PI) / SEG_CRANEO)));
    return pts;
  });
  m.loft(anillos, c.piel, hueso, { colorBanda: (i) => (i === 0 ? c.pielSombra : undefined) });

  // Nariz: cuña pequeña, la única faceta que sobresale de la cara.
  const zn = craneo.frente(0, r.narizY);
  const punta: V3 = [0, r.narizY - 0.04, zn + 0.085];
  const arriba: V3 = [0, r.narizY + 0.07, zn - 0.01];
  const izq: V3 = [0.058, r.narizY - 0.055, zn - 0.012];
  const der: V3 = [-0.058, r.narizY - 0.055, zn - 0.012];
  const centroNariz = aMundo([0, r.narizY, zn - 0.08]);
  m.tri(aMundo(arriba), aMundo(izq), aMundo(punta), c.piel, hueso, centroNariz);
  m.tri(aMundo(arriba), aMundo(punta), aMundo(der), c.piel, hueso, centroNariz);
  m.tri(aMundo(izq), aMundo(der), aMundo(punta), c.pielSombra, hueso, centroNariz);

  // Orejas: entre la línea de ojos y la base de la nariz.
  for (const s of [1, -1]) {
    const e = r.orejaEscala;
    const base = craneo.anillo(-0.08).rx;
    const centro: V3 = [s * (base + 0.012 * e), -0.09, -0.04];
    const forma = (x: number, k: number): V3[] =>
      [
        [0, 0.1, 0.02],
        [0, 0.06, 0.075],
        [0, -0.05, 0.06],
        [0, -0.1, 0.0],
        [0, -0.04, -0.06],
        [0, 0.07, -0.05],
      ].map((p): V3 => aMundo([centro[0] + s * x, centro[1] + p[1]! * e * k, centro[2] + p[2]! * e * k]));
    m.loft([forma(-0.05, 1), forma(0.03 * e, 1), forma(0.055 * e, 0.6)], c.piel, hueso, {
      tapaInicio: false,
      colorBanda: (i) => (i === 1 ? c.pielSombra : undefined),
    });
  }
}

/** Línea del pelo interpolada en grados, de -180 a 180. */
const lineaPelo = (p: Pelo, grados: number) => tabla(p.linea, grados);

export function construirPelo(m: ConstructorMalla, f: Ficha, craneo: Craneo, aMundo: Local, hueso: number): void {
  const p = f.pelo;
  const rnd = azar(f.id.length * 97 + 13);
  const seg = p.segmentos;
  const ruido: number[][] = p.niveles.map(() => Array.from({ length: seg }, () => 1 + (rnd() - 0.5) * 2 * p.ruido));
  const yBajo = Math.min(...p.linea.map((l) => l[1]));

  const vertice = (nivel: number, i: number, k = 1): V3 => {
    const t = ((i + 0.5) / seg) * 2 * Math.PI;
    const grados = ((((t * 180) / Math.PI + 180) % 360) + 360) % 360 - 180;
    const y = Math.max(p.niveles[nivel]!, lineaPelo(p, grados));
    // Bajo la mandíbula el pelo cae recto: se toma el radio de la mejilla, no el del mentón.
    const s = craneo.punto(t, Math.max(-0.26, y * 0.86));
    const g = p.grosor(grados, y) * ruido[nivel]![i]! * k;
    const sube = y > 0 ? p.alza * (y / 0.5) : 0;
    return aMundo([s[0] * g, y + sube, s[2] * g]);
  };

  const anillos: V3[][] = p.niveles.map((_, n) => Array.from({ length: seg }, (_, i) => vertice(n, i)));
  // Coronilla: un anillo pequeño y más alto redondea la cúpula en vez de dejar una tapa plana.
  const cima = aMundo([0, p.niveles[0]! + p.alza + 0.045, -0.02]);
  anillos.unshift(anillos[0]!.map((v): V3 => [cima[0] + (v[0] - cima[0]) * 0.4, cima[1], cima[2] + (v[2] - cima[2]) * 0.4]));
  m.loft(anillos, p.color, hueso, { tapaFin: false });

  // Cierre del borde: une el canto del pelo con el cráneo para que el flequillo tenga grosor.
  const ultimo = anillos.length - 1;
  const centro = aMundo([0, 0.1, 0]);
  const dentro = (i: number): V3 => {
    const t = ((i + 0.5) / seg) * 2 * Math.PI;
    const grados = ((((t * 180) / Math.PI + 180) % 360) + 360) % 360 - 180;
    const y = Math.max(yBajo, lineaPelo(p, grados));
    const s = craneo.punto(t, Math.max(-0.26, y * 0.86));
    return aMundo([s[0] * 0.9, y + 0.02, s[2] * 0.9]);
  };
  for (let i = 0; i < seg; i++) {
    const j = (i + 1) % seg;
    const a = anillos[ultimo]![i]!;
    const b = anillos[ultimo]![j]!;
    const bajo: V3 = [(a[0] + b[0]) / 2, Math.min(a[1], b[1]) - 1, (a[2] + b[2]) / 2];
    m.cuad(a, b, dentro(j), dentro(i), p.color, hueso, [centro[0], bajo[1] + 1.2, centro[2]]);
  }

  if (p.mono) {
    const cm = aMundo(p.mono.c);
    const o = aMundo([0, 0, 0]);
    const e = aMundo([1, 0, 0])[0] - o[0];
    m.bola(cm, [p.mono.r[0] * e, p.mono.r[1] * e, p.mono.r[2] * e], 1, p.color, hueso, 0.06);
  }
}

export function construirGafas(m: ConstructorMalla, f: Ficha, craneo: Craneo, aMundo: Local, hueso: number): void {
  const r = f.rasgos;
  const color = 0xf6e6dc;
  const z = craneo.frente(r.ojoX, r.ojoY) + 0.05;
  const radio = 0.132;
  const grosor = 0.04;
  for (const s of [1, -1]) {
    const cx = s * (r.ojoX + 0.012);
    const cy = r.ojoY + 0.005;
    const pt = (i: number, rad: number, dz: number): V3 => {
      const t = Math.PI / 8 + (i * Math.PI) / 4;
      return aMundo([cx + Math.cos(t) * rad, cy + Math.sin(t) * rad, z + dz - Math.abs(Math.cos(t) * rad + s * 0.02) * 0.12]);
    };
    const detras = aMundo([cx, cy, z - 1]);
    for (let i = 0; i < 8; i++) {
      m.cuad(pt(i, radio, 0), pt(i + 1, radio, 0), pt(i + 1, radio - grosor, 0), pt(i, radio - grosor, 0), color, hueso, detras);
      m.cuad(pt(i, radio, 0), pt(i + 1, radio, 0), pt(i + 1, radio, -0.03), pt(i, radio, -0.03), color, hueso, aMundo([cx, cy, z]));
    }
    // Patilla hasta la oreja.
    const xo = craneo.anillo(r.ojoY).rx;
    m.tubo(
      [
        { p: aMundo([s * (r.ojoX + radio), cy, z - 0.03]), rx: 0.004, rz: 0.004 },
        { p: aMundo([s * (xo + 0.03), cy - 0.01, -0.02]), rx: 0.004, rz: 0.004 },
      ],
      4,
      color,
      hueso,
    );
  }
  // Puente.
  m.cuad(
    aMundo([-(r.ojoX + 0.012 - radio), r.ojoY + 0.03, z]),
    aMundo([r.ojoX + 0.012 - radio, r.ojoY + 0.03, z]),
    aMundo([r.ojoX + 0.012 - radio, r.ojoY + 0.005, z]),
    aMundo([-(r.ojoX + 0.012 - radio), r.ojoY + 0.005, z]),
    color,
    hueso,
    aMundo([0, r.ojoY, z - 1]),
  );
}

// ---------------------------------------------------------------------------------------------
// Rostro: rasgos planos sobre la cara, una malla por expresión (una llamada de dibujo a la vez).
// ---------------------------------------------------------------------------------------------

export type Expresion = "neutral" | "feliz" | "pensando" | "preocupado" | "hablaCerrada" | "hablaAbierta" | "hablaRedonda" | "parpadeo";

export const EXPRESIONES: Expresion[] = [
  "neutral",
  "feliz",
  "pensando",
  "preocupado",
  "hablaCerrada",
  "hablaAbierta",
  "hablaRedonda",
  "parpadeo",
];

type Boca = "sonrisa" | "feliz" | "plana" | "triste" | "redonda" | "curiosa";

interface Gesto {
  boca: Boca;
  escalaBoca?: number;
  ojos: "abiertos" | "cerrados";
  mirada?: [number, number];
  /** [subida, giro] por ceja: izquierda del personaje, derecha. Giro positivo = punta interior arriba. */
  cejaI: [number, number];
  cejaD: [number, number];
}

const GESTOS: Record<Expresion, Gesto> = {
  neutral: { boca: "sonrisa", ojos: "abiertos", cejaI: [0, 0], cejaD: [0, 0] },
  feliz: { boca: "feliz", ojos: "abiertos", cejaI: [0.025, -0.05], cejaD: [0.025, -0.05] },
  pensando: { boca: "plana", ojos: "abiertos", mirada: [-0.012, 0.014], cejaI: [0.04, -0.12], cejaD: [-0.012, 0.16] },
  preocupado: { boca: "triste", ojos: "abiertos", cejaI: [0.02, 0.36], cejaD: [0.02, 0.36] },
  hablaCerrada: { boca: "sonrisa", ojos: "abiertos", cejaI: [0, 0], cejaD: [0, 0] },
  hablaAbierta: { boca: "feliz", escalaBoca: 0.82, ojos: "abiertos", cejaI: [0.015, -0.03], cejaD: [0.015, -0.03] },
  hablaRedonda: { boca: "redonda", ojos: "abiertos", cejaI: [0.02, 0], cejaD: [0.02, 0] },
  parpadeo: { boca: "sonrisa", ojos: "cerrados", cejaI: [-0.01, 0], cejaD: [-0.01, 0] },
};

const OJO = 0x1c1216;
const BRILLO = 0xffffff;
const BOCA_LINEA = 0x7a2a30;
const BOCA_FONDO = 0x5c1d2b;
const LENGUA = 0xf07a72;

type P2 = [number, number];

class Pintura {
  private pos: number[] = [];
  private col: number[] = [];
  private tmp = new THREE.Color();
  private v = new THREE.Vector3();

  /** Polígono convexo en el plano local, llevado a la cara con `m`; `capa` lo separa de lo que tiene debajo. */
  poligono(pts: P2[], color: number, m: THREE.Matrix4, capa = 0): void {
    this.tmp.setHex(color);
    const w = pts.map((p) => {
      this.v.set(p[0], p[1], capa * 0.004).applyMatrix4(m);
      return [this.v.x, this.v.y, this.v.z] as V3;
    });
    for (let i = 1; i < w.length - 1; i++) {
      for (const q of [w[0]!, w[i]!, w[i + 1]!]) {
        this.pos.push(q[0], q[1], q[2]);
        this.col.push(this.tmp.r, this.tmp.g, this.tmp.b);
      }
    }
  }

  /** Banda entre dos curvas muestreadas en los mismos x (sonrisas, párpados). */
  banda(arriba: P2[], abajo: P2[], color: number, m: THREE.Matrix4, capa = 0): void {
    for (let i = 0; i < arriba.length - 1; i++) this.poligono([abajo[i]!, abajo[i + 1]!, arriba[i + 1]!, arriba[i]!], color, m, capa);
  }

  geometria(): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(this.col, 3));
    return g;
  }
}

const elipse = (rx: number, ry: number, lados: number, cx = 0, cy = 0): P2[] =>
  Array.from({ length: lados }, (_, i): P2 => {
    const t = (i * 2 * Math.PI) / lados;
    return [cx + Math.cos(t) * rx, cy + Math.sin(t) * ry];
  });

const capsula = (rx: number, ry: number): P2[] =>
  Array.from({ length: 16 }, (_, i): P2 => {
    const t = (i * 2 * Math.PI) / 16;
    const e = 2 / 3.2;
    return [Math.sign(Math.cos(t)) * Math.abs(Math.cos(t)) ** e * rx, Math.sign(Math.sin(t)) * Math.abs(Math.sin(t)) ** e * ry];
  });

/** Matriz que apoya un rasgo sobre la cara en (x, y), orientado según la curvatura local. */
function apoyo(craneo: Craneo, x: number, y: number, giroZ = 0, escala = 1): THREE.Matrix4 {
  const d = 0.02;
  const z = craneo.frente(x, y);
  const dzdx = (craneo.frente(x + d, y) - craneo.frente(x - d, y)) / (2 * d);
  const dzdy = (craneo.frente(x, y + d) - craneo.frente(x, y - d)) / (2 * d);
  const e = new THREE.Euler(Math.atan(dzdy) * 0.6, Math.atan(-dzdx) * 0.8, giroZ, "YXZ");
  return new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z + 0.014),
    new THREE.Quaternion().setFromEuler(e),
    new THREE.Vector3(escala, escala, 1),
  );
}

function pintarBoca(p: Pintura, tipo: Boca, ancho: number, m: THREE.Matrix4): void {
  const a = ancho / 2;
  const muestras = (n: number) => Array.from({ length: n + 1 }, (_, i) => -1 + (2 * i) / n);
  if (tipo === "sonrisa") {
    const xs = muestras(8);
    const centro = (u: number) => -0.05 * (1 - u * u) + 0.016;
    const grosor = (u: number) => 0.014 * (1 - 0.55 * u * u);
    p.banda(
      xs.map((u): P2 => [u * a, centro(u) + grosor(u)]),
      xs.map((u): P2 => [u * a, centro(u) - grosor(u)]),
      BOCA_LINEA,
      m,
    );
    return;
  }
  if (tipo === "plana") {
    p.poligono(
      [
        [-a * 0.5, -0.014],
        [a * 0.5, -0.004],
        [a * 0.5, 0.018],
        [-a * 0.5, 0.008],
      ],
      BOCA_LINEA,
      m,
    );
    return;
  }
  if (tipo === "redonda" || tipo === "curiosa") {
    const k = tipo === "curiosa" ? 0.8 : 1;
    p.poligono(elipse(0.042 * k, 0.052 * k, 10), BOCA_FONDO, m);
    p.poligono(elipse(0.024 * k, 0.014 * k, 8, 0, -0.03 * k), LENGUA, m, 1);
    return;
  }
  if (tipo === "feliz") {
    const fondo: P2[] = [[-a, 0.03]];
    for (let i = 0; i <= 8; i++) {
      const t = Math.PI + (i * Math.PI) / 8;
      fondo.push([Math.cos(t) * a, 0.02 + Math.sin(t) * 0.085]);
    }
    fondo.push([a, 0.03]);
    p.poligono(fondo, BOCA_FONDO, m);
    const lengua: P2[] = [];
    for (let i = 0; i <= 6; i++) {
      const t = Math.PI + (i * Math.PI) / 6;
      lengua.push([Math.cos(t) * a * 0.62, -0.012 + Math.sin(t) * 0.05]);
    }
    p.poligono(lengua, LENGUA, m, 1);
    return;
  }
  // triste: boca pequeña abierta con el arco hacia arriba.
  const arco: P2[] = [];
  for (let i = 0; i <= 8; i++) {
    const t = (i * Math.PI) / 8;
    arco.push([Math.cos(t) * a * 0.42, -0.03 + Math.sin(t) * 0.058]);
  }
  p.poligono(arco, BOCA_FONDO, m);
  p.poligono(
    [
      [-a * 0.3, -0.03],
      [a * 0.3, -0.03],
      [a * 0.22, -0.012],
      [-a * 0.22, -0.012],
    ],
    LENGUA,
    m,
    1,
  );
}

function pintarGesto(f: Ficha, craneo: Craneo, g: Gesto): THREE.BufferGeometry {
  const r = f.rasgos;
  const p = new Pintura();
  for (const s of [1, -1] as const) {
    const [dx, dy] = g.mirada ?? [0, 0];
    const mo = apoyo(craneo, s * r.ojoX + dx, r.ojoY + dy);
    if (g.ojos === "abiertos") {
      // Ojo en cápsula alta, como en las hojas: lados casi rectos y extremos redondos.
      p.poligono(capsula(r.ojoRx, r.ojoRy), OJO, mo);
      p.poligono(elipse(r.ojoRx * 0.2, r.ojoRx * 0.2, 6, -r.ojoRx * 0.3, r.ojoRy * 0.5), BRILLO, mo, 1);
    } else {
      const xs = Array.from({ length: 7 }, (_, i) => -1 + i / 3);
      const w = r.ojoRx * 1.35;
      const curva = (u: number) => -0.022 * (1 - u * u);
      p.banda(
        xs.map((u): P2 => [u * w, curva(u) + 0.009]),
        xs.map((u): P2 => [u * w, curva(u) - 0.009]),
        OJO,
        apoyo(craneo, s * r.ojoX, r.ojoY - 0.01),
      );
    }
    const [sube, giro] = s === 1 ? g.cejaI : g.cejaD;
    const w = r.cejaAncho / 2;
    // La punta interior es la del lado de la nariz: el giro se espeja para que ambas cejas hagan el mismo gesto.
    const mc = apoyo(craneo, s * (r.ojoX + 0.005), r.cejaY + sube, -s * giro);
    p.poligono(
      [
        [-w, -0.016],
        [-w * 0.4, -0.026],
        [w * 0.5, -0.02],
        [w, -0.002],
        [w * 0.5, 0.028],
        [-w * 0.4, 0.026],
        [-w, 0.014],
      ].map((q): P2 => [s * q[0]!, q[1]!]),
      f.paleta.ceja,
      mc,
    );
  }
  pintarBoca(p, g.boca, r.bocaAncho, apoyo(craneo, 0, r.bocaY, 0, g.escalaBoca ?? 1));
  return p.geometria();
}

export interface Rostro {
  grupo: THREE.Group;
  expresion(e: Expresion): void;
  actual(): Expresion;
}

/** `grupo` queda en AC con origen en el centro del cráneo: quien lo cuelga le da posición y escala. */
export function crearRostro(f: Ficha, craneo: Craneo): Rostro {
  const grupo = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, toneMapped: false });
  const mallas = new Map<Expresion, THREE.Mesh>();
  for (const e of EXPRESIONES) {
    const gesto = { ...GESTOS[e] };
    if (f.id === "nino" && e === "pensando") gesto.boca = "curiosa";
    const malla = new THREE.Mesh(pintarGesto(f, craneo, gesto), material);
    malla.visible = e === "neutral";
    malla.name = `rostro-${e}`;
    mallas.set(e, malla);
    grupo.add(malla);
  }
  let actual: Expresion = "neutral";
  return {
    grupo,
    expresion(e) {
      if (e === actual) return;
      mallas.get(actual)!.visible = false;
      mallas.get(e)!.visible = true;
      actual = e;
    },
    actual: () => actual,
  };
}
