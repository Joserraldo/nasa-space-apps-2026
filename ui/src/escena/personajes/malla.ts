import * as THREE from "three";

/**
 * Constructor de malla facetada con color por cara y un hueso por triángulo.
 *
 * Todo el cuerpo de un personaje termina en UNA sola geometría (una llamada de dibujo):
 * cada triángulo queda pegado rígidamente a un hueso, así las articulaciones doblan sin
 * partir el personaje en decenas de mallas sueltas.
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

export function azar(semilla: number): () => number {
  let s = semilla % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

const resta = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cruz = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const punto = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

export function centroide(pts: V3[]): V3 {
  const c: V3 = [0, 0, 0];
  for (const p of pts) {
    c[0] += p[0];
    c[1] += p[1];
    c[2] += p[2];
  }
  return [c[0] / pts.length, c[1] / pts.length, c[2] / pts.length];
}

export interface OpcionesLoft {
  tapaInicio?: boolean;
  tapaFin?: boolean;
  /** Color por banda (índice del tramo entre anillos). Si falta, se usa el color base. */
  colorBanda?: (banda: number) => number | undefined;
}

export class ConstructorMalla {
  private pos: number[] = [];
  private col: number[] = [];
  private hueso: number[] = [];
  private rnd = azar(7);
  private tmp = new THREE.Color();
  /** Variación de luminosidad por faceta: es lo que hace leer el low-poly con luz suave. */
  variacion = 0.035;

  get triangulos(): number {
    return this.pos.length / 9;
  }

  /** Triángulo con la normal apuntando hacia fuera respecto de `centro`. */
  tri(a: V3, b: V3, c: V3, color: number, hueso: number, centro?: V3): void {
    const n = cruz(resta(b, a), resta(c, a));
    if (punto(n, n) < 1e-14) return;
    if (centro) {
      const medio: V3 = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3];
      if (punto(n, resta(medio, centro)) < 0) [b, c] = [c, b];
    }
    this.tmp.setHex(color);
    const k = 1 + (this.rnd() - 0.5) * 2 * this.variacion;
    for (const v of [a, b, c]) {
      this.pos.push(v[0], v[1], v[2]);
      this.col.push(this.tmp.r * k, this.tmp.g * k, this.tmp.b * k);
      this.hueso.push(hueso);
    }
  }

  cuad(a: V3, b: V3, c: V3, d: V3, color: number, hueso: number, centro?: V3): void {
    this.tri(a, b, c, color, hueso, centro);
    this.tri(a, c, d, color, hueso, centro);
  }

  /**
   * Une anillos consecutivos con caras; todos los anillos deben tener el mismo número de puntos.
   * El sentido de las caras se decide UNA vez para todo el loft (voto ponderado por área): decidirlo
   * cara por cara invierte facetas en formas cóncavas como el casquete del pelo.
   */
  loft(anillos: V3[][], color: number, hueso: number, o: OpcionesLoft = {}): void {
    const centro = centroide(anillos.flat());
    let voto = 0;
    for (let r = 0; r < anillos.length - 1; r++) {
      const a = anillos[r]!;
      const b = anillos[r + 1]!;
      for (let i = 0; i < a.length; i++) {
        const j = (i + 1) % a.length;
        const n = cruz(resta(a[j]!, a[i]!), resta(b[i]!, a[i]!));
        const medio: V3 = [(a[i]![0] + b[j]![0]) / 2, (a[i]![1] + b[j]![1]) / 2, (a[i]![2] + b[j]![2]) / 2];
        voto += punto(n, resta(medio, centro));
      }
    }
    const gira = voto < 0;
    for (let r = 0; r < anillos.length - 1; r++) {
      const a = anillos[r]!;
      const b = anillos[r + 1]!;
      const c = o.colorBanda?.(r) ?? color;
      for (let i = 0; i < a.length; i++) {
        const j = (i + 1) % a.length;
        if (gira) this.cuad(a[i]!, b[i]!, b[j]!, a[j]!, c, hueso);
        else this.cuad(a[i]!, a[j]!, b[j]!, b[i]!, c, hueso);
      }
    }
    if (o.tapaInicio ?? true) this.tapa(anillos[0]!, o.colorBanda?.(0) ?? color, hueso, centro);
    if (o.tapaFin ?? true) {
      const ultimo = anillos.length - 1;
      this.tapa(anillos[ultimo]!, o.colorBanda?.(ultimo - 1) ?? color, hueso, centro);
    }
  }

  tapa(anillo: V3[], color: number, hueso: number, centro: V3): void {
    const m = centroide(anillo);
    for (let i = 0; i < anillo.length; i++) this.tri(anillo[i]!, anillo[(i + 1) % anillo.length]!, m, color, hueso, centro);
  }

  /** Columna de superelipses horizontales (torso, pierna, bota...). */
  columna(anillos: Anillo[], segmentos: number, color: number, hueso: number, o: OpcionesLoft = {}): void {
    this.loft(
      anillos.map((a) => puntosAnillo(a, segmentos)),
      color,
      hueso,
      o,
    );
  }

  /** Prisma facetado entre dos puntos cualesquiera (brazos en A, correas, antenas). */
  tubo(
    tramos: Array<{ p: V3; rx: number; rz: number }>,
    segmentos: number,
    color: number,
    hueso: number,
    o: OpcionesLoft & { n?: number } = {},
  ): void {
    const eje = new THREE.Vector3(...resta(tramos[tramos.length - 1]!.p, tramos[0]!.p)).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), eje);
    const v = new THREE.Vector3();
    const anillos = tramos.map((t) =>
      puntosAnillo({ y: 0, rx: t.rx, rz: t.rz, n: o.n ?? 2.6 }, segmentos).map((p): V3 => {
        v.set(p[0], p[1], p[2]).applyQuaternion(q);
        return [v.x + t.p[0], v.y + t.p[1], v.z + t.p[2]];
      }),
    );
    this.loft(anillos, color, hueso, o);
  }

  /** Caja biselada (mochila, bolsa, auricular). `bisel` recorta las ocho esquinas. */
  caja(c: V3, medio: V3, color: number, hueso: number, bisel = 0.25, colorFrente?: { cara: "z+" | "z-"; color: number }): void {
    const [hx, hy, hz] = medio;
    const b = Math.min(hx, hy, hz) * bisel;
    const anillo = (z: number, encoge: number): V3[] => {
      const x = hx - encoge;
      const y = hy - encoge;
      return [
        [c[0] - x + b, c[1] - y, c[2] + z],
        [c[0] + x - b, c[1] - y, c[2] + z],
        [c[0] + x, c[1] - y + b, c[2] + z],
        [c[0] + x, c[1] + y - b, c[2] + z],
        [c[0] + x - b, c[1] + y, c[2] + z],
        [c[0] - x + b, c[1] + y, c[2] + z],
        [c[0] - x, c[1] + y - b, c[2] + z],
        [c[0] - x, c[1] - y + b, c[2] + z],
      ];
    };
    const anillos = [anillo(-hz, b), anillo(-hz + b, 0), anillo(hz - b, 0), anillo(hz, b)];
    this.loft(anillos, color, hueso, { tapaInicio: false, tapaFin: false });
    const centro = c;
    this.tapa(anillos[0]!, colorFrente?.cara === "z-" ? colorFrente.color : color, hueso, centro);
    this.tapa(anillos[3]!, colorFrente?.cara === "z+" ? colorFrente.color : color, hueso, centro);
  }

  /** Polígono plano mirando a +Z o -Z (insignias, luz del pecho, paneles). */
  disco(c: V3, rx: number, ry: number, lados: number, color: number, hueso: number, mira: 1 | -1 = 1, giro = 0): void {
    const pts: V3[] = [];
    for (let i = 0; i < lados; i++) {
      const t = giro + (i * 2 * Math.PI) / lados;
      pts.push([c[0] + Math.cos(t) * rx, c[1] + Math.sin(t) * ry, c[2]]);
    }
    const detras: V3 = [c[0], c[1], c[2] - mira];
    for (let i = 0; i < lados; i++) this.tri(c, pts[i]!, pts[(i + 1) % lados]!, color, hueso, detras);
  }

  /** Icosaedro deformado: moños, bolas de antena, piedras. */
  bola(c: V3, r: V3, detalle: number, color: number, hueso: number, ruido = 0): void {
    const g = new THREE.IcosahedronGeometry(1, detalle);
    const p = g.getAttribute("position");
    const rnd = azar(Math.round((c[0] + c[1] * 3 + c[2] * 7) * 1000) + 11);
    const cache = new Map<string, number>();
    const v = (i: number): V3 => {
      const x = p.getX(i);
      const y = p.getY(i);
      const z = p.getZ(i);
      const clave = `${x.toFixed(3)},${y.toFixed(3)},${z.toFixed(3)}`;
      let k = cache.get(clave);
      if (k === undefined) {
        k = 1 + (rnd() - 0.5) * 2 * ruido;
        cache.set(clave, k);
      }
      return [c[0] + x * r[0] * k, c[1] + y * r[1] * k, c[2] + z * r[2] * k];
    };
    for (let i = 0; i < p.count; i += 3) this.tri(v(i), v(i + 1), v(i + 2), color, hueso, c);
    g.dispose();
  }

  geometria(conHuesos: boolean): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(this.col, 3));
    if (conHuesos) {
      const n = this.hueso.length;
      const indices = new Uint16Array(n * 4);
      const pesos = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) {
        indices[i * 4] = this.hueso[i]!;
        pesos[i * 4] = 1;
      }
      g.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(indices, 4));
      g.setAttribute("skinWeight", new THREE.Float32BufferAttribute(pesos, 4));
    }
    g.computeVertexNormals();
    g.computeBoundingSphere();
    return g;
  }
}
