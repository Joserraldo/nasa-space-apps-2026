import { describe, expect, it } from "vitest";
import { Group, Mesh } from "three";
import { chamferBox } from "../../src/kit/primitives";
import { materials } from "../../src/materials/shared";
import { validatePiece } from "../../tools/validate-pieces";
import type { PieceMetadata } from "../../src/kit/types";

function check(placement: PieceMetadata["placement"], size: [number, number, number], x: number, z: number) {
  return validatePiece("ST-W01", {
    category: "architecture", pivot: "module-corner", placement, grid: { size, module: 2 },
  }, () => {
    const root = new Group();
    const mesh = new Mesh(chamferBox(...size, 0.02), materials.M_palette);
    mesh.position.set(x, size[1] / 2, z); root.add(mesh);
    return root;
  }).issues.filter(issue => issue.check === "grid" || issue.check === "pivot");
}

describe("architectural placement envelopes", () => {
  it("defaults to cell and preserves corner alignment and 2 m multiples", () => {
    expect(check(undefined, [2, 3, 2], 1, 1)).toEqual([]);
    expect(check("cell", [4, 3, 2], 2, 1)).toEqual([]);
    expect(check("cell", [2, 3, 0.24], 1, 0.12).map(i => i.check)).toContain("grid");
    expect(check("cell", [2, 3, 2], 1.2, 1).map(i => i.check)).toContain("pivot");
  });
  it("accepts walls straddling Z=0, with X starting at the node and no artificial rear arms", () => {
    for (const depth of [0.1, 0.24, 0.5]) expect(check("wall-line", [2, 3, depth], 1, 0)).toEqual([]);
    for (const depth of [0.08, 0.6, 2]) {
      expect(check("wall-line", [2, 3, depth], 1, 0).map(i => i.check)).toContain("grid");
    }
    expect(check("wall-line", [2.1, 3, 0.24], 1.05, 0).map(i => i.check)).toContain("grid");
    expect(check("wall-line", [2, 3, 0.24], 1, 0.12).map(i => i.check)).toContain("pivot");
  });
  it("accepts point columns of arbitrary footprint centered on the node", () => {
    expect(check("point", [0.7, 3, 0.7], 0, 0)).toEqual([]);
    expect(check("point", [0.6, 3, 0.8], 0, 0)).toEqual([]);
    expect(check("point", [0.7, 3, 0.7], 0.35, 0).map(i => i.check)).toContain("pivot");
  });
});
