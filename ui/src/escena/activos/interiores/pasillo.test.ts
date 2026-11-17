import { describe, expect, it } from "vitest";
import { PUERTAS_PASILLO, ZONAS_PASILLO } from "./pasillo";

const dentro = (x: number, z: number) => ZONAS_PASILLO.some((c) => x >= c.xMin && x <= c.xMax && z >= c.zMin && z <= c.zMax);

describe("pasillo", () => {
  it("leads to the workshop, the habitat and the airlock", () => {
    expect(PUERTAS_PASILLO.map((p) => p.destino).sort()).toEqual(["base", "habitat", "taller"]);
  });

  it("lets the kid appear inside the walkable area a few steps in from every door, not on it", () => {
    for (const p of PUERTAS_PASILLO) {
      expect(dentro(p.entrada.x, p.entrada.z)).toBe(true);
      const d = Math.hypot(p.x - p.entrada.x, p.z - p.entrada.z);
      expect(d).toBeGreaterThan(0.9); // outside the door ring, so E does not bounce him straight back
      expect(d).toBeLessThan(2.5);
    }
  });
});
