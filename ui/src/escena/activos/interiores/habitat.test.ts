import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { crearMateriales } from "../../materiales";
import { fusionar } from "../fusionar";
import { HABITAT_SALA, crearHabitatInterior, zonaHabitat } from "./habitat";

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

describe("hábitat (D5, estaciones 06 y 07)", () => {
  it("fusionado entra holgado en el presupuesto de una vista (80 draw calls, 80 000 triángulos)", () => {
    const { llamadas, triangulos } = contar(fusionar(crearHabitatInterior(crearMateriales()), "Sala_Habitat"));
    expect(llamadas).toBeLessThanOrEqual(10);
    expect(triangulos).toBeLessThan(5000);
  });

  it("la zona caminable queda dentro de las paredes", () => {
    const { caminable: c } = zonaHabitat();
    expect(c.x0).toBeGreaterThan(-HABITAT_SALA.ancho / 2);
    expect(c.x1).toBeLessThan(HABITAT_SALA.ancho / 2);
    expect(c.z0).toBeGreaterThan(-HABITAT_SALA.fondo / 2);
    expect(c.z1).toBeLessThan(HABITAT_SALA.fondo / 2);
  });

  it("la entrada y cada punto de uso están en la zona caminable y fuera de todo obstáculo", () => {
    const z = zonaHabitat();
    for (const [nombre, p] of [["entrada", z.entrada], ...Object.entries(z.puntos)] as const) {
      expect(dentro(p, z.caminable), nombre).toBe(true);
      for (const o of z.obstaculos) expect(Math.hypot(p.x - o.x, p.z - o.z), `${nombre} contra obstáculo en ${o.x},${o.z}`).toBeGreaterThan(o.r);
    }
  });

  it("tiene las piezas de las láminas: litera, comedor, dispensador, armario, camilla, botiquín con escudo y puerta", () => {
    const nombres = new Set<string>();
    crearHabitatInterior(crearMateriales()).traverse((o) => nombres.add(o.name));
    for (const n of ["Habitat_Bunk", "Habitat_MessTable", "Habitat_Dispenser", "Habitat_Cabinet", "Habitat_MedBed", "MedKit_Shield", "Kit_Door"]) {
      expect(nombres.has(n), n).toBe(true);
    }
  });
});
