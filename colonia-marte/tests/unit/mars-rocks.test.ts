import { Mesh } from "three";
import { describe, expect, it } from "vitest";
import { paletteUV } from "../../src/materials/atlas";
import { registerMarsPieces } from "../../src/kit/pieces/mars";
import { PieceRegistry } from "../../src/kit/registry";
import { geometryHash } from "../../tools/geometry-inspection";
import { validateRegistry } from "../../tools/validate-pieces";

describe("T2.4 Mars rocks, pillars, and mesa pieces", () => {
  const registry = new PieceRegistry();
  registerMarsPieces(registry);

  it("registers MT-T04, MT-T05, and MT-T06 and passes specification 8.1 validation", () => {
    const rockIds = ["MT-T04", "MT-T05", "MT-T06"];
    expect(registry.ids()).toEqual(expect.arrayContaining(rockIds));
    const results = validateRegistry(registry).filter(r => rockIds.includes(r.id));
    expect(results.length).toBe(8);
    for (const result of results) {
      expect(result.issues, `${result.id}/${result.variant}`).toEqual([]);
      expect(result.triangles).toBeGreaterThanOrEqual(40);
      expect(result.triangles).toBeLessThanOrEqual(1200);
    }
  });

  it("excludes polar ice UVs from Jezero variants while including ice on polar variants", () => {
    const iceUv = paletteUV("ice");
    const hasIce = (id: string, biome: "jezero" | "polar"): boolean => {
      let found = false;
      registry.build(id, { biome, seed: 7 }, true).traverse(node => {
        if (!(node instanceof Mesh)) return;
        const uv = node.geometry.getAttribute("uv");
        if (Math.abs(uv.getX(0) - iceUv[0]) < 1e-5 && Math.abs(uv.getY(0) - iceUv[1]) < 1e-5) {
          found = true;
        }
      });
      return found;
    };

    for (const id of ["MT-T04", "MT-T05", "MT-T06"]) {
      expect(hasIce(id, "jezero")).toBe(false);
      expect(hasIce(id, "polar")).toBe(true);
    }
  });

  it("produces deterministic geometry per seed and distinct geometry across seeds", () => {
    const a1 = registry.build("MT-T05", { seed: 10 }, true);
    const a2 = registry.build("MT-T05", { seed: 10 }, true);
    const b = registry.build("MT-T05", { seed: 11 }, true);
    expect(geometryHash(a1)).toBe(geometryHash(a2));
    expect(geometryHash(a1)).not.toBe(geometryHash(b));
    expect(() => registry.build("MT-T04", { biome: "tropical" })).toThrow();
  });
});
