import { Mesh, PlaneGeometry } from "three";
import { describe, expect, it } from "vitest";
import colonyJson from "../../data/layouts/colonies/exterior-pilot.json";
import { createProductionRegistry } from "../../src/kit/pieces";
import { decalScreenGeometry, decalTypes } from "../../src/materials/screens";
import { materials } from "../../src/materials/shared";
import { buildColonyGroup, parseColonyLayout } from "../../src/scenes/exterior-pilot";
import { validateRegistry } from "../../tools/validate-pieces";

const requiredIds = [
  "MB-01", "MB-02", "MB-03", "MB-04", "MB-07", "MB-10",
  "MI-03", "MI-04", "MI-06", "MI-09", "MI-11",
] as const;

describe("T3.1 Mars colony exterior pilot pieces, decals, and layout", () => {
  it("registers all 11 exterior pieces and passes specification 8.1 checks", () => {
    const registry = createProductionRegistry();
    for (const id of requiredIds) {
      expect(registry.ids()).toContain(id);
    }
    const results = validateRegistry(registry).filter(r =>
      (requiredIds as readonly string[]).includes(r.id),
    );
    expect(results.length).toBeGreaterThanOrEqual(22);
    for (const result of results) {
      expect(result.issues, `${result.id}/${result.variant}`).toEqual([]);
    }
  });

  it("maps distinct atlas regions for all realistic aerospace decal stickers on shared M_screen", () => {
    const plane = new PlaneGeometry(1, 0.6);
    const centers = new Set<string>();
    for (const decal of decalTypes) {
      const uv = decalScreenGeometry(plane, decal).getAttribute("uv");
      const coords = Array.from(uv.array);
      expect(coords.every(v => v > 0 && v < 1)).toBe(true);
      centers.add(`${uv.getX(0).toFixed(5)},${uv.getY(0).toFixed(5)}`);
    }
    plane.dispose();
    expect(centers.size).toBe(decalTypes.length);
  });

  it("validates and batches data/layouts/colonies/exterior-pilot.json with shared M_screen decals", () => {
    const registry = createProductionRegistry();
    const layout = parseColonyLayout(colonyJson, registry);
    expect(layout.biome).toBe("jezero");
    expect(layout.environment).toBe("AMB-04");
    for (const id of requiredIds) {
      expect(layout.placements.some(p => p.id === id)).toBe(true);
    }
    expect(layout.placements.filter(p => p.id === "MB-01")).toHaveLength(4);
    expect(layout.placements.filter(p => p.id === "MB-10")).toHaveLength(2);

    const batched = buildColonyGroup(layout, registry);
    expect(batched.children.length).toBeGreaterThan(0);
    let hasScreenDecals = false;
    batched.traverse(node => {
      if (node instanceof Mesh && node.material === materials.M_screen) hasScreenDecals = true;
    });
    expect(hasScreenDecals).toBe(true);

    expect(() => parseColonyLayout({
      ...colonyJson,
      placements: [{ id: "FAKE-99", at: [0, 0] }],
    }, registry)).toThrow(/Invalid inventory piece ID/);
  });
});
