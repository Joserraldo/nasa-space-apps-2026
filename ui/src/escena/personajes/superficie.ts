import * as THREE from "three";
import type { V3 } from "./malla.js";

/**
 * Malla poligonal lógica: vértices compartidos, caras de tres o cuatro lados y pesos de hueso
 * por vértice. A diferencia de `ConstructorMalla` (triángulos sueltos, un hueso por cara), aquí
 * dos bandas vecinas usan los MISMOS vértices, así que la superficie es continua y se dobla en
 * las articulaciones mezclando pesos.
 *
 * La orientación de las caras se resuelve al final, por componente conexa: se propaga por las
 * aristas compartidas y el signo sale del volumen (piezas cerradas) o de una pista (piezas abiertas).
 */

export type Pesos = ReadonlyArray<readonly [hueso: number, peso: number]>;

export interface OpcionesCara {
  /** Normales promediadas por vértice (piel). Sin esto la cara es una faceta plana. */
  suave?: boolean;
  /** Dirección aproximada de la normal, para piezas abiertas (insignias, correas). */
  pista?: V3;
}

interface Cara {
  v: number[];
  color: number;
  suave: boolean;
  pista: V3 | undefined;
  etiqueta: string;
}

export interface Topologia {
  vertices: number;
  caras: number;
  cuadrilateros: number;
  triangulos: number;
  /** Triángulos que llegan a la GPU. */
  triangulosRender: number;
  aristas: number;
  aristasAbiertas: number;
  aristasMultiples: number;
  componentes: number;
}

export interface Impacto {
  z: number;
  n: V3;
}
export type Sonda = (x: number, y: number) => Impacto | undefined;

const resta = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cruz = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const punto = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const unidad = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
const clave = (a: number, b: number) => (a < b ? a * 65536 + b : b * 65536 + a);

export class Superficie {
  readonly pos: V3[] = [];
  readonly caras: Cara[] = [];
  /** Etiqueta que reciben las caras nuevas: permite medir y sondear cada pieza por separado. */
  etiqueta = "";
  private pesos: Pesos[] = [];
  private tintes = new Map<number, number>();
  private sucia = true;
  private normalesV: V3[] = [];

  vertice(p: V3, pesos: Pesos): number {
    this.pos.push([p[0], p[1], p[2]]);
    this.pesos.push(pesos);
    return this.pos.length - 1;
  }

  anillo(pts: V3[], pesos: Pesos | ((i: number) => Pesos)): number[] {
    return pts.map((p, i) => this.vertice(p, typeof pesos === "function" ? pesos(i) : pesos));
  }

  pesar(v: number, pesos: Pesos): void {
    this.pesos[v] = pesos;
  }

  /** Color propio de un vértice en caras suaves (rubor): se interpola entre vecinos. */
  tenir(v: number, color: number): void {
    this.tintes.set(v, color);
  }

  cara(v: number[], color: number, o: OpcionesCara = {}): number {
    this.caras.push({ v: [...v], color, suave: o.suave ?? false, pista: o.pista, etiqueta: this.etiqueta });
    this.sucia = true;
    return this.caras.length - 1;
  }

  /** Banda de cuadriláteros entre dos bucles del mismo tamaño. Devuelve el índice de cada cara (-1 si se omitió). */
  puente(
    a: number[],
    b: number[],
    color: number | ((i: number) => number),
    o: OpcionesCara & { omitir?: (i: number) => boolean } = {},
  ): number[] {
    const ids: number[] = [];
    for (let i = 0; i < a.length; i++) {
      const j = (i + 1) % a.length;
      if (o.omitir?.(i)) {
        ids.push(-1);
        continue;
      }
      ids.push(this.cara([a[i]!, a[j]!, b[j]!, b[i]!], typeof color === "function" ? color(i) : color, o));
    }
    return ids;
  }

  /** Cierra un bucle con triángulos hacia un vértice nuevo. */
  abanico(bucle: number[], centro: V3, pesos: Pesos, color: number, o: OpcionesCara = {}): number {
    const c = this.vertice(centro, pesos);
    for (let i = 0; i < bucle.length; i++) this.cara([bucle[i]!, bucle[(i + 1) % bucle.length]!, c], color, o);
    return c;
  }

  /** Extruye una cara: la desplaza, la encoge y une el borde viejo con el nuevo. */
  extruir(idCara: number, desplazamiento: V3, escala: number): number[] {
    const c = this.caras[idCara]!;
    const viejos = [...c.v];
    const centro: V3 = [0, 0, 0];
    for (const v of viejos) for (let k = 0; k < 3; k++) centro[k]! += this.pos[v]![k]! / viejos.length;
    const nuevos = viejos.map((v) => {
      const p = this.pos[v]!;
      return this.vertice(
        [
          centro[0] + (p[0] - centro[0]) * escala + desplazamiento[0],
          centro[1] + (p[1] - centro[1]) * escala + desplazamiento[1],
          centro[2] + (p[2] - centro[2]) * escala + desplazamiento[2],
        ],
        this.pesos[v]!,
      );
    });
    c.v = nuevos;
    const opciones: OpcionesCara = { suave: c.suave };
    const etiqueta = this.etiqueta;
    this.etiqueta = c.etiqueta;
    for (let i = 0; i < viejos.length; i++) {
      const j = (i + 1) % viejos.length;
      this.cara([viejos[i]!, viejos[j]!, nuevos[j]!, nuevos[i]!], c.color, opciones);
    }
    this.etiqueta = etiqueta;
    return nuevos;
  }

  /** Caja con las aristas de frente y espalda biseladas: 16 vértices, cerrada. */
  caja(c: V3, medio: V3, pesos: Pesos, color: number, bisel = 0.25, colorFrente?: number): void {
    const [hx, hy, hz] = medio;
    const b = Math.min(hx, hy, hz) * bisel;
    const rect = (z: number, encoge: number): number[] =>
      this.anillo(
        [
          [c[0] - hx + encoge, c[1] - hy + encoge, c[2] + z],
          [c[0] + hx - encoge, c[1] - hy + encoge, c[2] + z],
          [c[0] + hx - encoge, c[1] + hy - encoge, c[2] + z],
          [c[0] - hx + encoge, c[1] + hy - encoge, c[2] + z],
        ],
        pesos,
      );
    const r = [rect(-hz, b), rect(-hz + b, 0), rect(hz - b, 0), rect(hz, b)];
    for (let i = 0; i < 3; i++) this.puente(r[i]!, r[i + 1]!, color);
    this.cara(r[0]!, color);
    this.cara(r[3]!, colorFrente ?? color);
  }

  /** Icosaedro de 20 caras con vértices soldados (moño, bola de antena). */
  bola(c: V3, r: V3, pesos: Pesos, color: number, o: OpcionesCara = {}): void {
    const g = new THREE.IcosahedronGeometry(1, 0);
    const p = g.getAttribute("position");
    const soldados = new Map<string, number>();
    const id = (i: number): number => {
      const k = `${p.getX(i).toFixed(4)},${p.getY(i).toFixed(4)},${p.getZ(i).toFixed(4)}`;
      let v = soldados.get(k);
      if (v === undefined) {
        v = this.vertice([c[0] + p.getX(i) * r[0], c[1] + p.getY(i) * r[1], c[2] + p.getZ(i) * r[2]], pesos);
        soldados.set(k, v);
      }
      return v;
    };
    for (let i = 0; i < p.count; i += 3) this.cara([id(i), id(i + 1), id(i + 2)], color, o);
    g.dispose();
  }

  /** Esferoide de pocas caras: dos polos y dos paralelos. Más redondo que un icosaedro estirado. */
  esferoide(c: V3, r: V3, pesos: Pesos, color: number, lados = 7): void {
    const paralelo = (lat: number, giro: number): number[] =>
      this.anillo(
        Array.from({ length: lados }, (_, i): V3 => {
          const t = giro + (i * 2 * Math.PI) / lados;
          return [c[0] + Math.sin(t) * Math.cos(lat) * r[0], c[1] + Math.sin(lat) * r[1], c[2] + Math.cos(t) * Math.cos(lat) * r[2]];
        }),
        pesos,
      );
    const bajo = paralelo(-0.58, 0);
    const alto = paralelo(0.58, Math.PI / lados);
    this.puente(bajo, alto, color);
    this.abanico(bajo, [c[0], c[1] - r[1] * 0.86, c[2]], pesos, color);
    this.abanico(alto, [c[0], c[1] + r[1] * 0.86, c[2]], pesos, color);
  }

  private normalCara(c: Cara): V3 {
    // Newell: sirve para cuadriláteros que no son planos.
    const n: V3 = [0, 0, 0];
    for (let i = 0; i < c.v.length; i++) {
      const a = this.pos[c.v[i]!]!;
      const b = this.pos[c.v[(i + 1) % c.v.length]!]!;
      n[0] += (a[1] - b[1]) * (a[2] + b[2]);
      n[1] += (a[2] - b[2]) * (a[0] + b[0]);
      n[2] += (a[0] - b[0]) * (a[1] + b[1]);
    }
    return n;
  }

  private aristasPorCara(filtro?: (c: Cara) => boolean): Map<number, number[]> {
    const m = new Map<number, number[]>();
    this.caras.forEach((c, f) => {
      if (filtro && !filtro(c)) return;
      for (let i = 0; i < c.v.length; i++) {
        const k = clave(c.v[i]!, c.v[(i + 1) % c.v.length]!);
        const l = m.get(k);
        if (l) l.push(f);
        else m.set(k, [f]);
      }
    });
    return m;
  }

  private orientar(): void {
    if (!this.sucia) return;
    const porArista = this.aristasPorCara();
    const visto = new Uint8Array(this.caras.length);
    for (let inicio = 0; inicio < this.caras.length; inicio++) {
      if (visto[inicio]) continue;
      visto[inicio] = 1;
      const componente = [inicio];
      let cerrada = true;
      for (let q = 0; q < componente.length; q++) {
        const cg = this.caras[componente[q]!]!;
        for (let i = 0; i < cg.v.length; i++) {
          const a = cg.v[i]!;
          const b = cg.v[(i + 1) % cg.v.length]!;
          const vecinas = porArista.get(clave(a, b))!;
          if (vecinas.length !== 2) {
            cerrada = false;
            continue;
          }
          const h = vecinas[0] === componente[q] ? vecinas[1]! : vecinas[0]!;
          if (visto[h]) continue;
          const ch = this.caras[h]!;
          // Dos caras bien orientadas recorren la arista común en sentidos opuestos.
          if (ch.v[(ch.v.indexOf(a) + 1) % ch.v.length] === b) ch.v.reverse();
          visto[h] = 1;
          componente.push(h);
        }
      }
      let signo = 0;
      if (cerrada) {
        for (const f of componente) {
          const v = this.caras[f]!.v;
          for (let i = 1; i < v.length - 1; i++) signo += punto(this.pos[v[0]!]!, cruz(this.pos[v[i]!]!, this.pos[v[i + 1]!]!));
        }
      } else {
        const conPista = componente.find((f) => this.caras[f]!.pista);
        if (conPista !== undefined) {
          signo = punto(this.normalCara(this.caras[conPista]!), this.caras[conPista]!.pista!);
        } else {
          const centro: V3 = [0, 0, 0];
          let n = 0;
          for (const f of componente) for (const v of this.caras[f]!.v) {
            for (let k = 0; k < 3; k++) centro[k]! += this.pos[v]![k]!;
            n++;
          }
          for (let k = 0; k < 3; k++) centro[k]! /= n;
          for (const f of componente) {
            const c = this.caras[f]!;
            signo += punto(this.normalCara(c), resta(this.pos[c.v[0]!]!, centro));
          }
        }
      }
      if (signo < 0) for (const f of componente) this.caras[f]!.v.reverse();
    }
    this.normalesV = this.pos.map((): V3 => [0, 0, 0]);
    for (const c of this.caras) {
      if (!c.suave) continue;
      const n = this.normalCara(c);
      for (const v of c.v) for (let k = 0; k < 3; k++) this.normalesV[v]![k]! += n[k]!;
    }
    this.normalesV = this.normalesV.map(unidad);
    this.sucia = false;
  }

  private triangulos(c: Cara): Array<[number, number, number]> {
    const v = c.v;
    if (v.length === 3) return [[v[0]!, v[1]!, v[2]!]];
    if (v.length === 4) {
      const d02 = resta(this.pos[v[0]!]!, this.pos[v[2]!]!);
      const d13 = resta(this.pos[v[1]!]!, this.pos[v[3]!]!);
      return punto(d02, d02) <= punto(d13, d13)
        ? [
            [v[0]!, v[1]!, v[2]!],
            [v[0]!, v[2]!, v[3]!],
          ]
        : [
            [v[0]!, v[1]!, v[3]!],
            [v[1]!, v[2]!, v[3]!],
          ];
    }
    const t: Array<[number, number, number]> = [];
    for (let i = 1; i < v.length - 1; i++) t.push([v[0]!, v[i]!, v[i + 1]!]);
    return t;
  }

  topologia(etiqueta?: string): Topologia {
    const filtro = (c: Cara) => etiqueta === undefined || c.etiqueta === etiqueta;
    const caras = this.caras.filter(filtro);
    const aristas = this.aristasPorCara(filtro);
    const vertices = new Set<number>();
    for (const c of caras) for (const v of c.v) vertices.add(v);
    // Componentes por vértices compartidos.
    const padre = new Map<number, number>();
    const raiz = (v: number): number => {
      let r = v;
      while (padre.get(r) !== r) r = padre.get(r)!;
      padre.set(v, r);
      return r;
    };
    for (const v of vertices) padre.set(v, v);
    for (const c of caras) for (let i = 1; i < c.v.length; i++) padre.set(raiz(c.v[i]!), raiz(c.v[0]!));
    const raices = new Set<number>();
    for (const v of vertices) raices.add(raiz(v));
    let abiertas = 0;
    let multiples = 0;
    for (const l of aristas.values()) {
      if (l.length === 1) abiertas++;
      if (l.length > 2) multiples++;
    }
    const cuadrilateros = caras.filter((c) => c.v.length === 4).length;
    const triangulos = caras.filter((c) => c.v.length === 3).length;
    return {
      vertices: vertices.size,
      caras: caras.length,
      cuadrilateros,
      triangulos,
      triangulosRender: caras.reduce((n, c) => n + c.v.length - 2, 0),
      aristas: aristas.size,
      aristasAbiertas: abiertas,
      aristasMultiples: multiples,
      componentes: raices.size,
    };
  }

  /** Profundidad y normal de la superficie vista desde +Z (o -Z), solo sobre las etiquetas dadas. */
  sonda(etiquetas: string[], desde: 1 | -1 = 1): Sonda {
    this.orientar();
    const tris: Array<{ a: number; b: number; c: number; suave: boolean; n: V3 }> = [];
    for (const c of this.caras) {
      if (!etiquetas.includes(c.etiqueta)) continue;
      const n = unidad(this.normalCara(c));
      for (const t of this.triangulos(c)) tris.push({ a: t[0], b: t[1], c: t[2], suave: c.suave, n });
    }
    const pos = this.pos;
    const nv = this.normalesV;
    return (x, y) => {
      let mejor: Impacto | undefined;
      for (const t of tris) {
        const a = pos[t.a]!;
        const b = pos[t.b]!;
        const c = pos[t.c]!;
        const det = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
        if (Math.abs(det) < 1e-14) continue;
        const u = ((b[1] - c[1]) * (x - c[0]) + (c[0] - b[0]) * (y - c[1])) / det;
        const v = ((c[1] - a[1]) * (x - c[0]) + (a[0] - c[0]) * (y - c[1])) / det;
        const w = 1 - u - v;
        if (u < -1e-7 || v < -1e-7 || w < -1e-7) continue;
        const z = u * a[2] + v * b[2] + w * c[2];
        if (mejor && (z - mejor.z) * desde <= 0) continue;
        const n: V3 = t.suave
          ? unidad([
              u * nv[t.a]![0] + v * nv[t.b]![0] + w * nv[t.c]![0],
              u * nv[t.a]![1] + v * nv[t.b]![1] + w * nv[t.c]![1],
              u * nv[t.a]![2] + v * nv[t.b]![2] + w * nv[t.c]![2],
            ])
          : t.n;
        mejor = { z, n };
      }
      return mejor;
    };
  }

  /**
   * Geometría para la GPU: sin índice, porque el color es por cara y las facetas necesitan su
   * propia normal. Las aristas de la malla lógica (sin diagonales) quedan en `userData.aristas`.
   */
  geometria(): THREE.BufferGeometry {
    this.orientar();
    const pos: number[] = [];
    const nor: number[] = [];
    const col: number[] = [];
    const indices: number[] = [];
    const pesos: number[] = [];
    const tmp = new THREE.Color();
    for (const c of this.caras) {
      const plana = unidad(this.normalCara(c));
      for (const t of this.triangulos(c)) {
        for (const v of t) {
          const p = this.pos[v]!;
          const n = c.suave ? this.normalesV[v]! : plana;
          pos.push(p[0], p[1], p[2]);
          nor.push(n[0], n[1], n[2]);
          tmp.setHex(c.suave ? (this.tintes.get(v) ?? c.color) : c.color);
          col.push(tmp.r, tmp.g, tmp.b);
          const w = this.pesos[v]!;
          const total = w.reduce((s, x) => s + x[1], 0) || 1;
          for (let k = 0; k < 4; k++) {
            indices.push(w[k]?.[0] ?? 0);
            pesos.push((w[k]?.[1] ?? 0) / total);
          }
        }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    g.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(indices, 4));
    g.setAttribute("skinWeight", new THREE.Float32BufferAttribute(pesos, 4));
    const lineas: number[] = [];
    for (const k of this.aristasPorCara().keys()) {
      const a = this.pos[Math.floor(k / 65536)]!;
      const b = this.pos[k % 65536]!;
      lineas.push(a[0], a[1], a[2], b[0], b[1], b[2]);
    }
    g.userData.aristas = new Float32Array(lineas);
    g.computeBoundingSphere();
    return g;
  }
}
