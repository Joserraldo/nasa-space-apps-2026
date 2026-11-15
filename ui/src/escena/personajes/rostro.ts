import * as THREE from "three";
import { EXPRESIONES, type Expresion, type Rostro } from "./cabeza.js";
import type { Sonda } from "./superficie.js";

/**
 * Rostro B: ojos, cejas y boca son calcomanías que SIGUEN la piel. Cada forma se dibuja en el plano
 * de la cara, se subdivide en triángulos pequeños y cada vértice se proyecta sobre la malla de la
 * cabeza; heredan la normal de la piel, así que reciben la misma luz y no parecen piezas pegadas.
 *
 * Unidades: altos de cráneo, origen en el centro del cráneo.
 */

export interface RasgosB {
  ojoX: number;
  ojoY: number;
  ojoRx: number;
  ojoRy: number;
  cejaY: number;
  cejaAncho: number;
  bocaY: number;
  bocaAncho: number;
  colorCeja: number;
  colorPiel: number;
  colorIris: number;
  /** Contorno del ojo; por defecto el color de la ceja (cejas claras necesitan un contorno más oscuro). */
  colorContorno?: number;
  /** Grosor relativo de la ceja (1 = patrón). */
  cejaGrosor?: number;
  /** Tamaño relativo de iris y pupila dentro del ojo (1 = patrón). Más alto deja menos blanco: mirada más tierna. */
  irisEscala?: number;
  /** Párpado superior: fracción del alto del ojo que cubre (0 = sin párpado). Mirada serena. */
  parpado?: number;
  /** Ajustes de cada expresión para este rostro: el sistema es común, el carácter es propio. */
  gestos?: Partial<Record<Expresion, Partial<GestoRostro>>>;
}

type P2 = [number, number];

/** Separación sobre la piel y lado máximo de triángulo: acotan cuánto puede hundirse una cara plana en una arista. */
const SEPARACION = 0.007;
const PASO = 0.035;

class Lienzo {
  private pos: number[] = [];
  private nor: number[] = [];
  private col: number[] = [];
  private tmp = new THREE.Color();
  constructor(private sonda: Sonda) {}

  /** Polígono estrellado respecto de su centroide. `divisiones` fija la malla cuando dos piezas comparten borde. */
  poligono(pts: P2[], color: number, divisiones?: number): void {
    const c: P2 = [0, 0];
    for (const p of pts) {
      c[0] += p[0] / pts.length;
      c[1] += p[1] / pts.length;
    }
    let largo = 0;
    pts.forEach((p, i) => {
      const q = pts[(i + 1) % pts.length]!;
      largo = Math.max(largo, Math.hypot(p[0] - q[0], p[1] - q[1]), Math.hypot(p[0] - c[0], p[1] - c[1]));
    });
    const n = divisiones ?? Math.max(1, Math.ceil(largo / PASO));
    this.tmp.setHex(color);
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i]!;
      const b = pts[(i + 1) % pts.length]!;
      // Retícula baricéntrica: las aristas radiales coinciden entre triángulos vecinos del abanico.
      const en = (u: number, v: number): P2 => [c[0] + ((a[0] - c[0]) * u + (b[0] - c[0]) * v) / n, c[1] + ((a[1] - c[1]) * u + (b[1] - c[1]) * v) / n];
      for (let u = 0; u < n; u++) {
        for (let v = 0; v < n - u; v++) {
          this.tri(en(u, v), en(u + 1, v), en(u, v + 1));
          if (u + v < n - 1) this.tri(en(u + 1, v), en(u + 1, v + 1), en(u, v + 1));
        }
      }
    }
  }

  banda(arriba: P2[], abajo: P2[], color: number): void {
    for (let i = 0; i < arriba.length - 1; i++) this.poligono([abajo[i]!, abajo[i + 1]!, arriba[i + 1]!, arriba[i]!], color, 1);
  }

  private tri(a: P2, b: P2, c: P2): void {
    const area = (b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1]);
    if (Math.abs(area) < 1e-12) return;
    const orden = area > 0 ? [a, b, c] : [a, c, b];
    const impactos = orden.map((p) => this.sonda(p[0], p[1]));
    if (impactos.some((h) => !h)) return;
    orden.forEach((p, i) => {
      const h = impactos[i]!;
      this.pos.push(p[0] + h.n[0] * SEPARACION, p[1] + h.n[1] * SEPARACION, h.z + h.n[2] * SEPARACION);
      this.nor.push(h.n[0], h.n[1], h.n[2]);
      this.col.push(this.tmp.r, this.tmp.g, this.tmp.b);
    });
  }

  geometria(): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(this.col, 3));
    return g;
  }
}

const elipse = (cx: number, cy: number, rx: number, ry: number, lados = 14): P2[] =>
  Array.from({ length: lados }, (_, i): P2 => {
    const t = (i * 2 * Math.PI) / lados;
    return [cx + Math.cos(t) * rx, cy + Math.sin(t) * ry];
  });

type Boca = "sonrisa" | "feliz" | "plana" | "triste" | "redonda";

export interface GestoRostro {
  boca: Boca;
  escalaBoca?: number;
  ojos: "abiertos" | "cerrados" | "sonrientes";
  mirada?: P2;
  /** [subida, giro] por ceja: izquierda del personaje, derecha. Giro positivo = punta interior arriba. */
  cejaI: P2;
  cejaD: P2;
}

const GESTOS: Record<Expresion, GestoRostro> = {
  neutral: { boca: "sonrisa", ojos: "abiertos", cejaI: [0, 0], cejaD: [0, 0] },
  feliz: { boca: "feliz", ojos: "sonrientes", cejaI: [0.02, -0.05], cejaD: [0.02, -0.05] },
  pensando: { boca: "plana", ojos: "abiertos", mirada: [-0.014, 0.016], cejaI: [0.03, -0.12], cejaD: [-0.008, 0.16] },
  preocupado: { boca: "triste", ojos: "abiertos", cejaI: [0.015, 0.34], cejaD: [0.015, 0.34] },
  hablaCerrada: { boca: "sonrisa", ojos: "abiertos", cejaI: [0, 0], cejaD: [0, 0] },
  hablaAbierta: { boca: "feliz", escalaBoca: 0.8, ojos: "abiertos", cejaI: [0.012, -0.03], cejaD: [0.012, -0.03] },
  hablaRedonda: { boca: "redonda", ojos: "abiertos", cejaI: [0.015, 0], cejaD: [0.015, 0] },
  parpadeo: { boca: "sonrisa", ojos: "cerrados", cejaI: [-0.008, 0], cejaD: [-0.008, 0] },
};

const BLANCO = 0xfff8f0;
const PUPILA = 0x150d12;
const BOCA_LINEA = 0x7a2a30;
const BOCA_FONDO = 0x5c1d2b;
const LENGUA = 0xf07a72;

function pintarOjo(l: Lienzo, r: RasgosB, lado: 1 | -1, g: GestoRostro): void {
  const cx = lado * r.ojoX;
  const cy = r.ojoY;
  if (g.ojos === "cerrados") {
    const xs = Array.from({ length: 9 }, (_, i) => -1 + i / 4);
    const w = r.ojoRx * 1.15;
    const curva = (u: number) => -0.03 * (1 - u * u);
    l.banda(
      xs.map((u): P2 => [cx + u * w, cy - 0.02 + curva(u) + 0.011]),
      xs.map((u): P2 => [cx + u * w, cy - 0.02 + curva(u) - 0.011]),
      r.colorContorno ?? r.colorCeja,
    );
    return;
  }
  const [mx, my] = g.mirada ?? [0, 0];
  // Contorno: un poco más alto arriba, como línea de pestañas.
  l.poligono(elipse(cx, cy + 0.007, r.ojoRx + 0.011, r.ojoRy + 0.012, 16), r.colorContorno ?? r.colorCeja);
  l.poligono(elipse(cx, cy, r.ojoRx, r.ojoRy, 16), BLANCO);
  // El iris mira apenas hacia la nariz: sin eso los ojos grandes se leen bizcos hacia fuera.
  const ix = cx - lado * r.ojoRx * 0.1 + mx;
  const iy = cy - r.ojoRy * 0.06 + my;
  const ki = r.irisEscala ?? 1;
  l.poligono(elipse(ix, iy, r.ojoRx * 0.74 * ki, r.ojoRy * 0.78 * ki, 14), r.colorIris);
  l.poligono(elipse(ix, iy - r.ojoRy * 0.04, r.ojoRx * 0.48 * ki, r.ojoRy * 0.52 * ki, 12), PUPILA);
  l.poligono(elipse(ix - r.ojoRx * 0.3, iy + r.ojoRy * 0.38, r.ojoRx * 0.24, r.ojoRx * 0.24, 8), 0xffffff);
  l.poligono(elipse(ix + r.ojoRx * 0.3, iy - r.ojoRy * 0.36, r.ojoRx * 0.11, r.ojoRx * 0.11, 6), 0xffffff);
  if (r.parpado) {
    // La piel baja sobre el ojo y la línea de pestañas marca el borde.
    const borde = (u: number) => cy + r.ojoRy * (1 - 2 * r.parpado!) + 0.014 * (1 - u * u);
    const us = Array.from({ length: 9 }, (_, i) => -1 + i / 4);
    const w = r.ojoRx + 0.02;
    const tapa: P2[] = us.map((u): P2 => [cx + u * w, borde(u)]);
    tapa.push([cx + w, cy + r.ojoRy + 0.026], [cx - w, cy + r.ojoRy + 0.026]);
    l.poligono(tapa, r.colorPiel, 4);
    l.banda(
      us.map((u): P2 => [cx + u * (r.ojoRx + 0.012), borde(u) + 0.006]),
      us.map((u): P2 => [cx + u * (r.ojoRx + 0.012), borde(u) - 0.006]),
      r.colorContorno ?? r.colorCeja,
    );
  }
  if (g.ojos === "sonrientes") {
    // La mejilla sube y tapa el tercio inferior del ojo.
    const corte = cy - r.ojoRy * 0.42;
    const tapa: P2[] = [];
    for (let i = 0; i <= 8; i++) {
      const u = -1 + i / 4;
      tapa.push([cx + u * (r.ojoRx + 0.02), corte + 0.03 * (1 - u * u)]);
    }
    tapa.push([cx + r.ojoRx + 0.02, cy - r.ojoRy - 0.02], [cx - r.ojoRx - 0.02, cy - r.ojoRy - 0.02]);
    l.poligono(tapa, r.colorPiel);
  }
}

function pintarCeja(l: Lienzo, r: RasgosB, lado: 1 | -1, sube: number, giro: number): void {
  const w = r.cejaAncho / 2;
  const cx = lado * (r.ojoX + 0.004);
  const cy = r.cejaY + sube;
  const a = -lado * giro;
  const k = r.cejaGrosor ?? 1;
  const forma: P2[] = [
    [-w, -0.012],
    [-w * 0.3, -0.022],
    [w * 0.6, -0.016],
    [w, 0.002],
    [w * 0.55, 0.027],
    [-w * 0.3, 0.03],
    [-w, 0.016],
  ];
  l.poligono(
    forma.map(([x, y0]): P2 => {
      const y = y0 * k;
      const px = lado * x;
      return [cx + px * Math.cos(a) - y * Math.sin(a), cy + px * Math.sin(a) + y * Math.cos(a)];
    }),
    r.colorCeja,
  );
}

function pintarBoca(l: Lienzo, r: RasgosB, tipo: Boca, escala: number): void {
  const a = (r.bocaAncho / 2) * escala;
  const y0 = r.bocaY;
  const muestras = Array.from({ length: 9 }, (_, i) => -1 + i / 4);
  if (tipo === "sonrisa") {
    const centro = (u: number) => -0.042 * (1 - u * u) + 0.014;
    const grosor = (u: number) => 0.013 * (1 - 0.5 * u * u);
    l.banda(
      muestras.map((u): P2 => [u * a, y0 + centro(u) + grosor(u)]),
      muestras.map((u): P2 => [u * a, y0 + centro(u) - grosor(u)]),
      BOCA_LINEA,
    );
    return;
  }
  if (tipo === "plana") {
    l.poligono(
      [
        [-a * 0.5, y0 - 0.014],
        [a * 0.5, y0 - 0.005],
        [a * 0.5, y0 + 0.016],
        [-a * 0.5, y0 + 0.007],
      ],
      BOCA_LINEA,
    );
    return;
  }
  if (tipo === "redonda") {
    l.poligono(elipse(0, y0, 0.04 * escala, 0.05 * escala, 10), BOCA_FONDO);
    l.poligono(elipse(0, y0 - 0.028 * escala, 0.023 * escala, 0.014 * escala, 8), LENGUA);
    return;
  }
  if (tipo === "feliz") {
    const fondo: P2[] = [[-a, y0 + 0.03]];
    for (let i = 0; i <= 8; i++) {
      const t = Math.PI + (i * Math.PI) / 8;
      fondo.push([Math.cos(t) * a, y0 + 0.02 + Math.sin(t) * 0.085 * escala]);
    }
    fondo.push([a, y0 + 0.03]);
    l.poligono(fondo, BOCA_FONDO);
    const lengua: P2[] = [];
    for (let i = 0; i <= 6; i++) {
      const t = Math.PI + (i * Math.PI) / 6;
      lengua.push([Math.cos(t) * a * 0.6, y0 - 0.014 * escala + Math.sin(t) * 0.048 * escala]);
    }
    l.poligono(lengua, LENGUA);
    return;
  }
  // triste: boca pequeña con el arco hacia arriba.
  const arco: P2[] = [];
  for (let i = 0; i <= 8; i++) {
    const t = (i * Math.PI) / 8;
    arco.push([Math.cos(t) * a * 0.42, y0 - 0.03 + Math.sin(t) * 0.056]);
  }
  l.poligono(arco, BOCA_FONDO);
}

// Sin escritura de profundidad: las capas se apilan por orden de dibujo y nunca pelean entre sí.
const material = new THREE.MeshStandardMaterial({
  vertexColors: true,
  roughness: 0.6,
  metalness: 0,
  depthWrite: false,
  polygonOffset: true,
  polygonOffsetFactor: -2,
  polygonOffsetUnits: -2,
});
material.userData.compartido = true;

/** `grupo` queda en altos de cráneo con origen en el centro del cráneo. */
export function crearRostroB(r: RasgosB, sonda: Sonda): Rostro {
  const grupo = new THREE.Group();
  const mallas = new Map<Expresion, THREE.Mesh>();
  for (const e of EXPRESIONES) {
    const g: GestoRostro = { ...GESTOS[e], ...r.gestos?.[e] };
    const l = new Lienzo(sonda);
    for (const lado of [1, -1] as const) {
      pintarOjo(l, r, lado, g);
      const [sube, giro] = lado === 1 ? g.cejaI : g.cejaD;
      pintarCeja(l, r, lado, sube, giro);
    }
    pintarBoca(l, r, g.boca, g.escalaBoca ?? 1);
    const malla = new THREE.Mesh(l.geometria(), material);
    malla.visible = e === "neutral";
    malla.name = `rostro-${e}`;
    malla.renderOrder = 0.5;
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
