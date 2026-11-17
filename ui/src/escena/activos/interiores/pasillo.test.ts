import { describe, expect, it } from "vitest";
import { PUERTAS_PASILLO, ZONAS_PASILLO } from "./pasillo";

const dentro = (x: number, z: number) => ZONAS_PASILLO.some((c) => x >= c.xMin && x <= c.xMax && z >= c.zMin && z <= c.zMax);

describe("pasillo", () => {
  it("leads to the workshop, the habitat and the airlock", () => {
    expect(PUERTAS_PASILLO.map((p) => p.destino).sort()).toEqual(["base", "habitat", "taller"]);
  });

  it("lets the kid appear inside the walkable area at every door, within reach of its marker", () => {
    for (const p of PUERTAS_PASILLO) {
      expect(dentro(p.entrada.x, p.entrada.z)).toBe(true);
      expect(Math.hypot(p.x - p.entrada.x, p.z - p.entrada.z)).toBeLessThan(0.9);
    }
  });
});
