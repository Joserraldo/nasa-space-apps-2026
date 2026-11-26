import { describe, expect, it } from "vitest";
import { batchStatic } from "../../src/core/batching";
import { registerStationPieces } from "../../src/kit/pieces/station";
import { PieceRegistry } from "../../src/kit/registry";
import {
  buildDiningTableSet, buildHydroponicRackSet, buildPlanterSet,
} from "../../src/kit/sets";
import { triangleCount } from "../../tools/geometry-inspection";
import { validateRegistry } from "../../tools/validate-pieces";

const verticalSliceIds = [
  "NW-01-A", "NW-01-B", "NW-01-D",
  "NW-02-A", "NW-02-B", "NX-05",
  "NW-05-A", "NW-05-B",
] as const;

describe("T4.3 server, hydroponic, airlock pieces, and reusable sets", () => {
  const registry = new PieceRegistry();
  registerStationPieces(registry);

  it("registers all remaining P1 vertical-slice pieces and passes specification 8.1", () => {
    expect(registry.ids().length).toBeGreaterThanOrEqual(31);
    for (const id of verticalSliceIds) {
      expect(registry.ids()).toContain(id);
    }
    const results = validateRegistry(registry).filter(r =>
      (verticalSliceIds as readonly string[]).includes(r.id),
    );
    expect(results.length).toBe(23);
    for (const result of results) {
      expect(result.issues, `${result.id}/${result.variant}`).toEqual([]);
    }
  });

  it("increases crop geometry complexity monotonically across NX-05 growth stages", () => {
    const counts = (["seed", "sprout", "plant", "harvest"] as const).map(stage =>
      triangleCount(registry.build("NX-05", { crop: "tomato", stage, seed: 2 })),
    );
    expect(counts[0]).toBeLessThan(counts[1]);
    expect(counts[1]).toBeLessThan(counts[2]);
    expect(counts[2]).toBeLessThan(counts[3]);
  });

  it("assembles reusable dining, planter, and hydroponic sets compatible with static batching", () => {
    const dining = buildDiningTableSet(registry);
    const planter = buildPlanterSet(registry, 3);
    const hydro = buildHydroponicRackSet(registry, { powered: true, stage: "harvest" });
    expect(dining.children.length).toBe(6);
    expect(planter.children.length).toBe(2);
    expect(hydro.children.length).toBe(7);
    expect(triangleCount(batchStatic(dining))).toBe(triangleCount(dining));
    expect(triangleCount(batchStatic(hydro))).toBe(triangleCount(hydro));
  });
});
