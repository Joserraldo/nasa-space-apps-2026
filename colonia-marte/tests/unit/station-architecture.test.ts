import { Box3, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { registerStationPieces } from "../../src/kit/pieces/station";
import { PieceRegistry } from "../../src/kit/registry";
import { validateRegistry } from "../../tools/validate-pieces";

const expectedIds = [
  "ST-W01", "ST-W02", "ST-W03", "ST-W07",
  "ST-C01", "ST-D01", "ST-D03",
  "ST-F01", "ST-F02", "ST-F04",
  "ST-R01", "ST-R02", "ST-R04",
] as const;

const wallLineIds = ["ST-W01", "ST-W02", "ST-W03", "ST-W07", "ST-D01"] as const;

describe("T4.1 station architecture pieces", () => {
  const registry = new PieceRegistry();
  registerStationPieces(registry);

  it("registers all 12 P1 architecture pieces and passes specification 8.1 checks without filler ribs", () => {
    for (const id of expectedIds) {
      expect(registry.ids()).toContain(id);
    }
    const results = validateRegistry(registry).filter(r =>
      (expectedIds as readonly string[]).includes(r.id),
    );
    expect(results.length).toBeGreaterThanOrEqual(31);
    for (const result of results) {
      expect(result.issues, `${result.id}/${result.variant}`).toEqual([]);
      expect(result.triangles).toBeGreaterThanOrEqual(100);
      expect(result.triangles).toBeLessThanOrEqual(1200);
    }
  });

  it("declares real wall-line (0.2..0.3 m) and point (0.6..0.8 m) envelopes and avoids neighbor overlap", () => {
    const entries = new Map(registry.entries().map(e => [e.id, e]));
    for (const id of wallLineIds) {
      const meta = entries.get(id)!.metadata;
      expect(meta.placement, id).toBe("wall-line");
      const box = new Box3().setFromObject(registry.build(id));
      const size = box.getSize(new Vector3());
      expect(size.x).toBeCloseTo(2, 3);
      expect(size.y).toBeCloseTo(3, 3);
      expect(size.z).toBeGreaterThanOrEqual(0.2 - 1e-3);
      expect(size.z).toBeLessThanOrEqual(0.3 + 1e-3);
      expect((box.min.z + box.max.z) / 2).toBeCloseTo(0, 3);
    }

    const colMeta = entries.get("ST-C01")!.metadata;
    expect(colMeta.placement).toBe("point");
    const colSize = new Box3().setFromObject(registry.build("ST-C01")).getSize(new Vector3());
    expect(colSize.x).toBeGreaterThanOrEqual(0.6);
    expect(colSize.x).toBeLessThanOrEqual(0.8);
    expect(colSize.z).toBeGreaterThanOrEqual(0.6);
    expect(colSize.z).toBeLessThanOrEqual(0.8);

    // Adjacent walls on the 2 m line neither overlap in X nor invade interior cells beyond half-thickness.
    const wallA = registry.build("ST-W01");
    wallA.position.set(0, 0, 0);
    wallA.updateMatrixWorld(true);
    const wallB = registry.build("ST-W02");
    wallB.position.set(2, 0, 0);
    wallB.updateMatrixWorld(true);
    const boxA = new Box3().setFromObject(wallA);
    const boxB = new Box3().setFromObject(wallB);
    expect(boxA.max.x).toBeLessThanOrEqual(boxB.min.x + 1e-5);
    expect(boxA.max.z).toBeLessThanOrEqual(0.15);
    expect(boxB.max.z).toBeLessThanOrEqual(0.15);
  });

  it("rejects unknown or malformed parameters", () => {
    expect(() => registry.build("ST-W01", { unknown: true })).toThrow();
    expect(() => registry.build("ST-W02", { mode: "diagonal" })).toThrow();
    expect(() => registry.build("ST-D01", "invalid")).toThrow();
  });
});
