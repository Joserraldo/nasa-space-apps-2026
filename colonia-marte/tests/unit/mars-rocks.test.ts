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

  it("keeps outward-facing normals and closed bottom caps on MT-T04, MT-T05, and MT-T06", () => {
    for (const id of ["MT-T04", "MT-T05", "MT-T06"]) {
      const piece = registry.build(id, { biome: "jezero", seed: 3 }, true);
      let meshCount = 0;
      let bottomCapFaces = 0;
      piece.traverse(node => {
        if (!(node instanceof Mesh)) return;
        meshCount += 1;
        const g = node.geometry;
        const pos = g.getAttribute("position");
        const norm = g.getAttribute("normal");
        const idx = g.getIndex();
        expect(idx).not.toBeNull();
        // Centroid of this sub-mesh in local space; average face normal dot (faceCenter - meshCentroid) must be > 0 (outward).
        let cx = 0, cy = 0, cz = 0;
        for (let i = 0; i < pos.count; i++) {
          cx += pos.getX(i);
          cy += pos.getY(i);
          cz += pos.getZ(i);
        }
        cx /= pos.count; cy /= pos.count; cz /= pos.count;
        let signedOutward = 0;
        for (let t = 0; t < idx!.count; t += 3) {
          const i0 = idx!.getX(t), i1 = idx!.getX(t + 1), i2 = idx!.getX(t + 2);
          const fx = (pos.getX(i0) + pos.getX(i1) + pos.getX(i2)) / 3 - cx;
          const fy = (pos.getY(i0) + pos.getY(i1) + pos.getY(i2)) / 3 - cy;
          const fz = (pos.getZ(i0) + pos.getZ(i1) + pos.getZ(i2)) / 3 - cz;
          const nx = (norm.getX(i0) + norm.getX(i1) + norm.getX(i2)) / 3;
          const ny = (norm.getY(i0) + norm.getY(i1) + norm.getY(i2)) / 3;
          const nz = (norm.getZ(i0) + norm.getZ(i1) + norm.getZ(i2)) / 3;
          signedOutward += fx * nx + fy * ny + fz * nz;
          if (ny < -0.95) bottomCapFaces += 1;
        }
        expect(signedOutward, `${id} sub-mesh outward winding`).toBeGreaterThan(0);
      });
      expect(meshCount).toBeGreaterThan(0);
      expect(bottomCapFaces, `${id} closed bottom cap`).toBeGreaterThan(0);
    }
  });
});
