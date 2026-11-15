import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { BANCO, LUGARES, TERRENO } from "../mundo";
import { CAMINO, CAMINOS, PLAZA, geometriaCaminos } from "./caminos";

type Tri = { a: THREE.Vector3; b: THREE.Vector3; c: THREE.Vector3; n: THREE.Vector3 };

function triangulos(g: THREE.BufferGeometry): Tri[] {
  const p = g.getAttribute("position"), n = g.getAttribute("normal");
  const salida: Tri[] = [];
  for (let i = 0; i < p.count; i += 3)
    salida.push({
      a: new THREE.Vector3().fromBufferAttribute(p, i),
      b: new THREE.Vector3().fromBufferAttribute(p, i + 1),
      c: new THREE.Vector3().fromBufferAttribute(p, i + 2),
      n: new THREE.Vector3().fromBufferAttribute(n, i),
    });
  return salida;
}

/** (x, z) estrictamente dentro del triángulo t (proyectado en x/z). */
function dentro(x: number, z: number, t: Tri): boolean {
  const s = (p: THREE.Vector3, q: THREE.Vector3) => (q.x - p.x) * (z - p.z) - (q.z - p.z) * (x - p.x);
  const d1 = s(t.a, t.b), d2 = s(t.b, t.c), d3 = s(t.c, t.a);
  const e = 1e-6;
  return (d1 > e && d2 > e && d3 > e) || (d1 < -e && d2 < -e && d3 < -e);
}

describe("caminos de losas", () => {
  const g = geometriaCaminos();
  const tris = triangulos(g);

  it("es una sola geometría con color por vértice y dentro del presupuesto de la red (≤ 3 000 triángulos)", () => {
    expect(g.getAttribute("color").count).toBe(g.getAttribute("position").count);
    expect(tris.length).toBeGreaterThan(100);
    expect(tris.length).toBeLessThan(3000);
  });

  it("solo hay caras horizontales hacia arriba y paredes verticales", () => {
    for (const t of tris) {
      const horizontal = Math.abs(t.n.y - 1) < 1e-4;
      const vertical = Math.abs(t.n.y) < 1e-4;
      expect(horizontal || vertical).toBe(true);
    }
  });

  it("ninguna cara de arriba se superpone a otra a la misma altura (sin z-fighting)", () => {
    const arriba = tris.filter(t => t.n.y > 0.5);
    const porAltura = new Map<number, Tri[]>();
    for (const t of arriba) {
      const y = Math.round(t.a.y * 1e4);
      porAltura.set(y, [...(porAltura.get(y) ?? []), t]);
    }
    // Losa, bordillo, plaza y las juntas sobre losa y plaza: alturas distintas.
    expect(porAltura.size).toBe(5);
    for (const lista of porAltura.values()) {
      for (const t of lista) {
        const cx = (t.a.x + t.b.x + t.c.x) / 3, cz = (t.a.z + t.b.z + t.c.z) / 3;
        const encima = lista.filter(o => o !== t && dentro(cx, cz, o));
        expect(encima.length, `cara en (${cx.toFixed(2)}, ${cz.toFixed(2)})`).toBe(0);
      }
    }
  });

  it("la losa queda por debajo del bordillo y la plaza es el escalón más alto", () => {
    expect(CAMINO.altoLosa).toBeLessThan(CAMINO.altoBordillo);
    expect(CAMINO.altoBordillo).toBeLessThan(CAMINO.altoPlaza);
  });

  it("ningún tramo (losa + bordillo) pisa sólidos de TERRENO ni el banco fuera de los rellanos de sus puestos", () => {
    const w = CAMINO.ancho / 2 + CAMINO.bordillo;
    const solido = (x: number, z: number) =>
      TERRENO.circulos.some(c => Math.hypot(x - c.x, z - c.z) < c.r)
      || TERRENO.capsulas.some(c => Math.hypot(x - Math.max(c.x0, Math.min(c.x1, x)), z - c.z) < c.r)
      || (x > BANCO.x0 && x < BANCO.x1 && z > BANCO.zBajo && z < BANCO.zFondo);
    const rellano = (x: number, z: number) => LUGARES.some(l => Math.hypot(x - l.x, z - l.z) < w * 1.2);
    for (const tramo of CAMINOS)
      for (let i = 1; i < tramo.length; i++) {
        const a = tramo[i - 1]!, b = tramo[i]!;
        const largo = Math.hypot(b[0] - a[0], b[1] - a[1]);
        const ux = (b[0] - a[0]) / largo, uz = (b[1] - a[1]) / largo;
        for (let t = 0; t <= largo; t += 0.1)
          for (const s of [-w, 0, w]) {
            const x = a[0] + ux * t - uz * s, z = a[1] + uz * t + ux * s;
            if (rellano(x, z)) continue;
            expect(solido(x, z), `tramo ${a} → ${b} en (${x.toFixed(2)}, ${z.toFixed(2)})`).toBe(false);
          }
      }
  });

  it("la plaza queda bajo la consola de la mesa", () => {
    const mesa = LUGARES.find(l => l.id === "mesa")!;
    expect(Math.hypot(mesa.mx - PLAZA.x, mesa.mz - PLAZA.z)).toBeLessThan(PLAZA.radio - 0.9);
  });
});
