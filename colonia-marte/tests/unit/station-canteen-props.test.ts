import { describe, expect, it } from "vitest";
import { registerStationPieces } from "../../src/kit/pieces/station";
import { PieceRegistry } from "../../src/kit/registry";
import { geometryHash } from "../../tools/geometry-inspection";
import { validateRegistry } from "../../tools/validate-pieces";

const canteenAndPropIds = [
  "DN-01", "DN-02", "DN-04", "DN-06",
  "PR-01", "PR-02", "PR-05",
] as const;

describe("T4.3 canteen furniture and transverse props", () => {
  const registry = new PieceRegistry();
  registerStationPieces(registry);

  it("registers all P1 canteen and prop pieces and passes specification 8.1 checks", () => {
    for (const id of canteenAndPropIds) {
      expect(registry.ids()).toContain(id);
    }
    const results = validateRegistry(registry).filter(r =>
      (canteenAndPropIds as readonly string[]).includes(r.id),
    );
    expect(results.length).toBeGreaterThanOrEqual(16);
    for (const result of results) {
      expect(result.issues, `${result.id}/${result.variant}`).toEqual([]);
    }
  });

  it("keeps PR-01 seeded foliage deterministic and distinct across seeds", () => {
    const a1 = registry.build("PR-01", { seed: 3, fullness: "lush" }, true);
    const a2 = registry.build("PR-01", { seed: 3, fullness: "lush" }, true);
    const b = registry.build("PR-01", { seed: 8, fullness: "lush" }, true);
    expect(geometryHash(a1)).toBe(geometryHash(a2));
    expect(geometryHash(a1)).not.toBe(geometryHash(b));
    expect(() => registry.build("PR-05", { screen: "invalid" })).toThrow();
  });
});
