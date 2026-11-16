import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { crearMateriales } from "../materiales";
import { crearFormaModulo } from "./modulos";

describe("forma del escudo", () => {
  const m = crearMateriales();
  const forma = crearFormaModulo(m, "escudo");
  forma.updateMatrixWorld(true);
  const mallas: THREE.Mesh[] = [];
  forma.traverse((o) => {
    if (o instanceof THREE.Mesh) mallas.push(o);
  });
  const nombres: string[] = [];
  forma.traverse((o) => nombres.push(o.name));

  it("cabe en la huella 2,2 × 4,0 y en el alto 2,4", () => {
    const b = new THREE.Box3().setFromObject(forma);
    expect(b.min.x).toBeGreaterThanOrEqual(-1.1);
    expect(b.max.x).toBeLessThanOrEqual(1.1);
    expect(b.min.z).toBeGreaterThanOrEqual(-2.0);
    expect(b.max.z).toBeLessThanOrEqual(2.0);
    expect(b.min.y).toBeGreaterThanOrEqual(0);
    expect(b.max.y).toBeLessThanOrEqual(2.4);
  });

  it("no supera 500 triángulos", () => {
    const tri = mallas.reduce((s, o) => s + (o.geometry.index?.count ?? o.geometry.getAttribute("position").count) / 3, 0);
    expect(tri).toBeLessThanOrEqual(500);
  });

  it("tiene placa frontal y emblema anidado, y nada de refugio", () => {
    for (const n of ["Shield_Face", "Shield_Emblem_Outer", "Shield_Emblem_Inner"]) expect(nombres).toContain(n);
    for (const n of nombres) expect(n).not.toMatch(/Door|Vestibule|Vent|Mound/);
    for (const o of mallas) expect(o.name.startsWith("Shield_"), o.name).toBe(true);
  });

  it("solo usa los slots SuitBase, Boots y Accent", () => {
    const permitidos = new Set<THREE.Material>([m.SuitBase, m.Boots, m.Accent]);
    for (const o of mallas) expect(permitidos.has(o.material as THREE.Material), o.name).toBe(true);
  });

  it("la placa frontal es más ancha arriba que abajo", () => {
    const cara = mallas.find((o) => o.name === "Shield_Face")!;
    const p = cara.geometry.getAttribute("position");
    cara.geometry.computeBoundingBox();
    const { min, max } = cara.geometry.boundingBox!;
    const alto = max.y - min.y;
    let arriba = 0, abajo = 0;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i), x = Math.abs(p.getX(i));
      if (y > max.y - alto * 0.25) arriba = Math.max(arriba, x);
      if (y < min.y + alto * 0.25) abajo = Math.max(abajo, x);
    }
    expect(arriba).toBeGreaterThan(abajo * 1.3);
  });
});
