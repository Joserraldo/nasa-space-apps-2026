import { Box3, LOD, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import colonyJson from "../../data/layouts/colonies/exterior-pilot.json";
import { createProductionRegistry } from "../../src/kit/pieces";
import { countColonyTriangles } from "../../src/scenes/colony-batches";
import { buildColonyGroup, parseColonyLayout } from "../../src/scenes/colony-layout";

describe("NX-04 exterior airlock", () => {
  it("fits the unchanged NW-05-A hatch inside a grounded enclosure", () => {
    const registry = createProductionRegistry();
    const entry = registry.build("NX-04");
    const hatch = entry.getObjectByName(registry.build("NW-05-A").name)!;
    expect(hatch).toBeDefined();
    expect(countColonyTriangles(hatch)).toBe(countColonyTriangles(registry.build("NW-05-A")));
    const enclosure = new Box3().setFromObject(entry);
    const door = new Box3().setFromObject(hatch);
    expect(enclosure.min.y).toBeCloseTo(0);
    expect(enclosure.min.x).toBeLessThan(door.min.x - 0.15);
    expect(enclosure.max.x).toBeGreaterThan(door.max.x + 0.15);
    expect(door.min.y).toBeGreaterThan(0);
    expect(enclosure.max.y).toBeGreaterThan(door.max.y + 0.12);
    expect(enclosure.max.z).toBeGreaterThan(door.max.z);
  });

  it("joins the radial hub without moving it and keeps a hatch at every distance level", () => {
    const registry = createProductionRegistry();
    const layout = parseColonyLayout(colonyJson, registry);
    const placement = layout.placements.find(piece => piece.id === "NX-04");
    expect(placement).toBeDefined();
    expect(layout.placements.find(piece => piece.id === "MB-02")?.at).toEqual([0, 0]);
    const placements = layout.placements.filter(piece => piece.id === "NX-04" || piece.id === "MB-02");
    const colony = buildColonyGroup({ ...layout, placements }, registry);
    const entry = colony.children.find(node => node instanceof LOD && node.name.startsWith("NX-04")) as LOD;
    expect(entry).toBeInstanceOf(LOD);
    expect(entry.levels).toHaveLength(3);
    const counts = entry.levels.map(({ object }) => {
      expect(object.getObjectByName(registry.build("NW-05-A").name)).toBeDefined();
      return countColonyTriangles(object);
    });
    expect(counts[0]).toBeGreaterThan(counts[1]);
    expect(counts[1]).toBeGreaterThan(counts[2]);
    const target = new Vector3(0, 1.5, 3.3);
    entry.updateMatrixWorld(true);
    const bounds = new Box3().setFromObject(entry.levels[0].object);
    expect(target.x).toBeGreaterThan(bounds.min.x);
    expect(target.x).toBeLessThan(bounds.max.x);
    expect(bounds.min.z).toBeLessThan(target.z);
    expect(bounds.max.z).toBeGreaterThan(5);
  });
});
