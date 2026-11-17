import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { crearMateriales } from "../../materiales";
import { fusionar } from "../fusionar";
import { TALLER, crearTaller, zonaTaller } from "./taller";

function contar(raiz: THREE.Object3D): { llamadas: number; triangulos: number } {
  let llamadas = 0, triangulos = 0;
  raiz.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    llamadas++;
    const g = o.geometry as THREE.BufferGeometry;
    triangulos += (g.index ? g.index.count : g.getAttribute("position").count) / 3;
  });
  return { llamadas, triangulos };
}

const dentro = (p: { x: number; z: number }, c: { x0: number; x1: number; z0: number; z1: number }) =>
  p.x >= c.x0 && p.x <= c.x1 && p.z >= c.z0 && p.z <= c.z1;

describe("taller (D5, estación 05)", () => {
  it("fusionado entra holgado en el presupuesto de una vista (80 draw calls, 80 000 triángulos)", () => {
    const { llamadas, triangulos } = contar(fusionar(crearTaller(crearMateriales()), "Sala_Taller"));
    expect(llamadas).toBeLessThanOrEqual(10);
    expect(triangulos).toBeLessThan(5000);
  });

  it("la zona caminable queda dentro de las paredes", () => {
    const { caminable: c } = zonaTaller();
    expect(c.x0).toBeGreaterThan(-TALLER.ancho / 2);
    expect(c.x1).toBeLessThan(TALLER.ancho / 2);
    expect(c.z0).toBeGreaterThan(-TALLER.fondo / 2);
    expect(c.z1).toBeLessThan(TALLER.fondo / 2);
  });

  it("la entrada y cada punto de uso están en la zona caminable y fuera de todo obstáculo", () => {
    const z = zonaTaller();
    for (const [nombre, p] of [["entrada", z.entrada], ...Object.entries(z.puntos)] as const) {
      expect(dentro(p, z.caminable), nombre).toBe(true);
      for (const o of z.obstaculos) expect(Math.hypot(p.x - o.x, p.z - o.z), `${nombre} contra obstáculo en ${o.x},${o.z}`).toBeGreaterThan(o.r);
    }
  });

  it("tiene las piezas de la lámina y del plan: baterías, consola, banco, dock de Iris, panel en su eje y puerta", () => {
    const nombres = new Set<string>();
    crearTaller(crearMateriales()).traverse((o) => nombres.add(o.name));
    for (const n of ["Workshop_BatteryRack", "Kit_Console", "Workshop_Bench", "Workshop_IrisDock", "SolarTilt_Head", "Kit_Door", "Workshop_PanelPad"]) {
      expect(nombres.has(n), n).toBe(true);
    }
  });
});
