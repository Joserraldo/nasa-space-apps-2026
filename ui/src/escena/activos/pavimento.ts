/** Unión de huellas convexas: una superficie plana, sin losas duplicadas ni cruces superpuestos. */
import * as THREE from "three";

export type PuntoPavimento = readonly [number, number];
type Poligono = readonly PuntoPavimento[];
type Arista = { a: PuntoPavimento; b: PuntoPavimento };
type Intervalo = { izquierda: Arista; derecha: Arista };
const EPS = 1e-8;

function xEn(e: Arista, z: number): number {
  return e.a[0] + (e.b[0] - e.a[0]) * (z - e.a[1]) / (e.b[1] - e.a[1]);
}

/**
 * Barre franjas entre vértices e intersecciones. Dentro de una franja cada borde es lineal y
 * conserva su orden, por lo que la unión de intervalos produce trapecios que solo comparten borde.
 * Las huellas deben ser convexas y simples; el sentido de sus vértices puede ser cualquiera.
 */
export function pavimento(poligonos: readonly Poligono[], color: THREE.Color, altura = 0.035): THREE.BufferGeometry {
  const grupos: Arista[][] = [];
  const aristas: Arista[] = [];
  const cortes: number[] = [];
  for (const p of poligonos) {
    if (p.length < 3) continue;
    const g: Arista[] = [];
    for (let i = 0; i < p.length; i++) {
      const a = p[i]!, b = p[(i + 1) % p.length]!;
      cortes.push(a[1]);
      if (Math.abs(a[1] - b[1]) <= EPS) continue;
      const e = { a, b };
      g.push(e);
      aristas.push(e);
    }
    grupos.push(g);
  }
  // Un cambio de borde exterior puede suceder entre vértices: también corta en cada cruce.
  for (let i = 0; i < aristas.length; i++) {
    const a = aristas[i]!;
    const ma = (a.b[0] - a.a[0]) / (a.b[1] - a.a[1]);
    for (let j = i + 1; j < aristas.length; j++) {
      const b = aristas[j]!;
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
  const posiciones: number[] = [];
  const triangulo = (a: PuntoPavimento, b: PuntoPavimento, c: PuntoPavimento) => {
    const area = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    if (Math.abs(area) <= EPS) return;
    // En x/z, el sentido horario apunta hacia +y.
    const orden = area < 0 ? [a, b, c] : [a, c, b];
    for (const p of orden) posiciones.push(p[0], altura, p[1]);
  };
  for (let i = 0; i < niveles.length - 1; i++) {
    const z0 = niveles[i]!, z1 = niveles[i + 1]!, medio = (z0 + z1) / 2;
    const intervalos: Intervalo[] = [];
    for (const g of grupos) {
      const activas = g.filter(e => medio > Math.min(e.a[1], e.b[1]) && medio < Math.max(e.a[1], e.b[1]));
      activas.sort((a, b) => xEn(a, medio) - xEn(b, medio));
      if (activas.length >= 2) intervalos.push({ izquierda: activas[0]!, derecha: activas[activas.length - 1]! });
    }
    intervalos.sort((a, b) => xEn(a.izquierda, medio) - xEn(b.izquierda, medio));
    const unidos: Intervalo[] = [];
    for (const actual of intervalos) {
      const ultimo = unidos[unidos.length - 1];
      if (!ultimo || xEn(actual.izquierda, medio) > xEn(ultimo.derecha, medio) + EPS) unidos.push({ ...actual });
      else if (xEn(actual.derecha, medio) > xEn(ultimo.derecha, medio)) ultimo.derecha = actual.derecha;
    }
    for (const u of unidos) {
      const a: PuntoPavimento = [xEn(u.izquierda, z0), z0];
      const b: PuntoPavimento = [xEn(u.derecha, z0), z0];
      const c: PuntoPavimento = [xEn(u.derecha, z1), z1];
      const d: PuntoPavimento = [xEn(u.izquierda, z1), z1];
      triangulo(a, b, c);
      triangulo(a, c, d);
    }
  }
  const geometria = new THREE.BufferGeometry();
  const colores = new Float32Array(posiciones.length);
  for (let i = 0; i < colores.length; i += 3) colores.set([color.r, color.g, color.b], i);
  geometria.setAttribute("position", new THREE.Float32BufferAttribute(posiciones, 3));
  geometria.setAttribute("color", new THREE.BufferAttribute(colores, 3));
  geometria.computeVertexNormals();
  geometria.computeBoundingSphere();
  return geometria;
}
