/**
 * Pavimento por barrido: unión (y resta) de huellas convexas en el plano x/z, sin superficies
 * superpuestas. De un mismo barrido salen las caras de arriba y las paredes del contorno, así un
 * camino con bordillo es una sola geometría sin z-fighting.
 */
import * as THREE from "three";

export type PuntoPavimento = readonly [number, number];
type Poligono = readonly PuntoPavimento[];
type Arista = { a: PuntoPavimento; b: PuntoPavimento };
type Intervalo = { izquierda: Arista; derecha: Arista };
/** Banda horizontal entre dos cortes: dentro, cada borde es lineal y no se cruza con otro. */
export type Franja = { z0: number; z1: number; intervalos: Intervalo[]; /** z0 es un corte de guía: no se funde con la franja de abajo. */ corte?: boolean };
const EPS = 1e-8;

function xEn(e: Arista, z: number): number {
  return e.a[0] + (e.b[0] - e.a[0]) * (z - e.a[1]) / (e.b[1] - e.a[1]);
}

function aristas(poligonos: readonly Poligono[], cortes: number[], todas: Arista[]): Arista[][] {
  const grupos: Arista[][] = [];
  for (const p of poligonos) {
    if (p.length < 3) continue;
    const g: Arista[] = [];
    for (let i = 0; i < p.length; i++) {
      const a = p[i]!, b = p[(i + 1) % p.length]!;
      cortes.push(a[1]);
      if (Math.abs(a[1] - b[1]) <= EPS) continue;
      const e = { a, b };
      g.push(e);
      todas.push(e);
    }
    grupos.push(g);
  }
  return grupos;
}

/** Intervalos unidos de un conjunto de huellas convexas a la altura `z` (ordenados en x). */
function unir(grupos: readonly Arista[][], z: number): Intervalo[] {
  const intervalos: Intervalo[] = [];
  for (const g of grupos) {
    const activas = g.filter(e => z > Math.min(e.a[1], e.b[1]) && z < Math.max(e.a[1], e.b[1]));
    activas.sort((a, b) => xEn(a, z) - xEn(b, z));
    if (activas.length >= 2) intervalos.push({ izquierda: activas[0]!, derecha: activas[activas.length - 1]! });
  }
  intervalos.sort((a, b) => xEn(a.izquierda, z) - xEn(b.izquierda, z));
  const unidos: Intervalo[] = [];
  for (const actual of intervalos) {
    const ultimo = unidos[unidos.length - 1];
    if (!ultimo || xEn(actual.izquierda, z) > xEn(ultimo.derecha, z) + EPS) unidos.push({ ...actual });
    else if (xEn(actual.derecha, z) > xEn(ultimo.derecha, z)) ultimo.derecha = actual.derecha;
  }
  return unidos;
}

/** `llenos − huecos` sobre intervalos ordenados y disjuntos a la altura `z`. */
function restar(llenos: Intervalo[], huecos: Intervalo[], z: number): Intervalo[] {
  const salida: Intervalo[] = [];
  for (const u of llenos) {
    let izquierda = u.izquierda;
    for (const h of huecos) {
      if (xEn(h.derecha, z) <= xEn(izquierda, z) + EPS) continue;
      if (xEn(h.izquierda, z) >= xEn(u.derecha, z) - EPS) break;
      if (xEn(h.izquierda, z) > xEn(izquierda, z) + EPS) salida.push({ izquierda, derecha: h.izquierda });
      izquierda = h.derecha;
    }
    if (xEn(u.derecha, z) > xEn(izquierda, z) + EPS) salida.push({ izquierda, derecha: u.derecha });
  }
  return salida;
}

/**
 * Barre `llenos − huecos` en franjas entre vértices e intersecciones. Las huellas deben ser
 * convexas y simples; el sentido de sus vértices puede ser cualquiera. Las franjas son contiguas
 * (también las vacías), así `paredes` encuentra los bordes horizontales del contorno. `guias` son
 * polígonos que no rellenan nada pero añaden sus cortes: así dos barridos que comparten una arista
 * (centro y marco de la plaza) la parten en los mismos vértices y no dejan grietas en T.
 */
export function barrer(llenos: readonly Poligono[], huecos: readonly Poligono[] = [], guias: readonly Poligono[] = []): Franja[] {
  const cortes: number[] = [];
  const todas: Arista[] = [];
  const gl = aristas(llenos, cortes, todas);
  const gh = aristas(huecos, cortes, todas);
  const forzados: number[] = [];
  aristas(guias, forzados, todas); // solo aportan cortes: dos barridos con las mismas guías comparten vértices
  cortes.push(...forzados);
  // Un cambio de borde exterior puede suceder entre vértices: también corta en cada cruce.
  for (let i = 0; i < todas.length; i++) {
    const a = todas[i]!;
    const ma = (a.b[0] - a.a[0]) / (a.b[1] - a.a[1]);
    for (let j = i + 1; j < todas.length; j++) {
      const b = todas[j]!;
      const mb = (b.b[0] - b.a[0]) / (b.b[1] - b.a[1]);
      if (Math.abs(ma - mb) <= EPS) continue;
      const z = (b.a[0] - mb * b.a[1] - a.a[0] + ma * a.a[1]) / (ma - mb);
      const minimo = Math.max(Math.min(a.a[1], a.b[1]), Math.min(b.a[1], b.b[1]));
      const maximo = Math.min(Math.max(a.a[1], a.b[1]), Math.max(b.a[1], b.b[1]));
      if (z > minimo + EPS && z < maximo - EPS) cortes.push(z);
    }
  }
  cortes.sort((a, b) => a - b);
  const niveles = cortes.filter((z, i) => i === 0 || z - cortes[i - 1]! > EPS);
  const franjas: Franja[] = [];
  for (let i = 0; i < niveles.length - 1; i++) {
    const z0 = niveles[i]!, z1 = niveles[i + 1]!, medio = (z0 + z1) / 2;
    const u = unir(gl, medio);
    const intervalos = gh.length ? restar(u, unir(gh, medio), medio) : u;
    franjas.push(forzados.some(c => Math.abs(c - z0) <= EPS) ? { z0, z1, intervalos, corte: true } : { z0, z1, intervalos });
  }
  return franjas;
}

/** (x, z) cae dentro de la región barrida (con `tolerancia` en x, en metros). */
export function dentroDe(franjas: readonly Franja[], x: number, z: number, tolerancia = 1e-4): boolean {
  const f = franjas.find(g => z >= g.z0 - EPS && z <= g.z1 + EPS);
  return !!f && f.intervalos.some(iv => {
    const zz = Math.min(f.z1, Math.max(f.z0, z));
    return x >= xEn(iv.izquierda, zz) - tolerancia && x <= xEn(iv.derecha, zz) + tolerancia;
  });
}

/**
 * Trapecios del barrido. Un intervalo que sigue con los mismos dos bordes en la franja siguiente
 * se alarga en vez de cortarse: los cortes de huellas lejanas no multiplican triángulos.
 */
function trapecios(franjas: readonly Franja[]): { i: Arista; d: Arista; z0: number; z1: number }[] {
  const salida: { i: Arista; d: Arista; z0: number; z1: number }[] = [];
  let abiertos: typeof salida = [];
  for (const f of franjas) {
    const siguen: typeof salida = [];
    for (const iv of f.intervalos) {
      const previo = f.corte ? undefined : abiertos.find(t => t.i === iv.izquierda && t.d === iv.derecha && Math.abs(t.z1 - f.z0) <= EPS);
      if (previo) previo.z1 = f.z1;
      else salida.push({ i: iv.izquierda, d: iv.derecha, z0: f.z0, z1: f.z1 });
      siguen.push(previo ?? salida[salida.length - 1]!);
    }
    abiertos = siguen;
  }
  return salida;
}

/** Acumula triángulos con color por vértice. Cierra en una geometría no indexada (facetas planas). */
export class MallaPavimento {
  private readonly posiciones: number[] = [];
  private readonly colores: number[] = [];

  /** Triángulo con la cara hacia `normal` (se invierte el orden si hace falta). */
  triangulo(p: readonly THREE.Vector3[], color: THREE.Color, normal: THREE.Vector3): void {
    const [a, b, c] = p as [THREE.Vector3, THREE.Vector3, THREE.Vector3];
    const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a));
    if (n.lengthSq() <= EPS * EPS) return;
    for (const v of n.dot(normal) >= 0 ? [a, b, c] : [a, c, b]) {
      this.posiciones.push(v.x, v.y, v.z);
      this.colores.push(color.r, color.g, color.b);
    }
  }

  /** Cuadrilátero plano a, b, c, d (en orden de contorno) mirando hacia `normal`. */
  cuadro(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, d: THREE.Vector3, color: THREE.Color, normal: THREE.Vector3): void {
    this.triangulo([a, b, c], color, normal);
    this.triangulo([a, c, d], color, normal);
  }

  /** Caras de arriba del barrido a la altura `y`. */
  caras(franjas: readonly Franja[], y: number, color: THREE.Color): void {
    const arriba = new THREE.Vector3(0, 1, 0);
    const v = (x: number, z: number) => new THREE.Vector3(x, y, z);
    for (const t of trapecios(franjas))
      this.cuadro(v(xEn(t.i, t.z0), t.z0), v(xEn(t.d, t.z0), t.z0), v(xEn(t.d, t.z1), t.z1), v(xEn(t.i, t.z1), t.z1), color, arriba);
  }

  /**
   * Paredes verticales del contorno del barrido, de `abajo` a `arriba`. Miran hacia fuera de la
   * región, o hacia dentro con `haciaDentro` (el escalón de un bordillo más alto que la losa).
   */
  paredes(franjas: readonly Franja[], abajo: number, arriba: number, color: THREE.Color, haciaDentro = false): void {
    const s = haciaDentro ? -1 : 1;
    const pared = (x0: number, z0: number, x1: number, z1: number, nx: number, nz: number) =>
      this.cuadro(
        new THREE.Vector3(x0, abajo, z0), new THREE.Vector3(x1, abajo, z1),
        new THREE.Vector3(x1, arriba, z1), new THREE.Vector3(x0, arriba, z0),
        color, new THREE.Vector3(nx * s, 0, nz * s),
      );
    for (const t of trapecios(franjas)) {
      pared(xEn(t.i, t.z0), t.z0, xEn(t.i, t.z1), t.z1, -1, 0);
      pared(xEn(t.d, t.z0), t.z0, xEn(t.d, t.z1), t.z1, 1, 0);
    }
    // Bordes horizontales: lo que hay en una franja y no en la contigua.
    const tramos = (f: Franja | undefined, z: number) => (f?.intervalos ?? []).map(iv => [xEn(iv.izquierda, z), xEn(iv.derecha, z)] as const);
    const menos = (a: readonly (readonly [number, number])[], b: readonly (readonly [number, number])[]) => {
      const salida: [number, number][] = [];
      for (const [x0, x1] of a) {
        let desde = x0;
        for (const [h0, h1] of b) {
          if (h1 <= desde + EPS || h0 >= x1 - EPS) continue;
          if (h0 > desde + EPS) salida.push([desde, h0]);
          desde = Math.max(desde, h1);
        }
        if (x1 > desde + EPS) salida.push([desde, x1]);
      }
      return salida;
    };
    for (let k = 0; k <= franjas.length; k++) {
      const bajo = franjas[k - 1], alto = franjas[k];
      const z = bajo ? bajo.z1 : alto!.z0;
      const a = tramos(bajo, z), b = tramos(alto, z);
      for (const [x0, x1] of menos(a, b)) pared(x0, z, x1, z, 0, 1);
      for (const [x0, x1] of menos(b, a)) pared(x0, z, x1, z, 0, -1);
    }
  }

  geometria(): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.posiciones, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(this.colores, 3));
    g.computeVertexNormals();
    g.computeBoundingSphere();
    return g;
  }
}

/** Superficie plana de la unión de `poligonos` a la altura `altura`, de un solo color. */
export function pavimento(poligonos: readonly Poligono[], color: THREE.Color, altura = 0.035): THREE.BufferGeometry {
  const m = new MallaPavimento();
  m.caras(barrer(poligonos), altura, color);
  return m.geometria();
}
