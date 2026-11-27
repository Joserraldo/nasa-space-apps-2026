import { Box3, InstancedMesh, LOD } from "three";
import { describe, expect, it } from "vitest";
import colonyJson from "../../data/layouts/colonies/exterior-pilot.json";
import { terrainHeight } from "../../src/environment/terrain";
import { createProductionRegistry } from "../../src/kit/pieces";
import { buildColonyGroup, parseColonyLayout } from "../../src/scenes/colony-layout";
import { countColonyTriangles } from "../../src/scenes/colony-batches";

describe("MI-07 landing pad", () => {
  it("uses repeated parts, has a base pivot, and rejects unsupported parameters", () => {
    const registry = createProductionRegistry();
    const pad = registry.build("MI-07");
    const bounds = new Box3().setFromObject(pad);
    expect(bounds.min.y).toBeCloseTo(0);
    expect(bounds.max.z - bounds.min.z).toBeGreaterThan(bounds.max.x - bounds.min.x);
    expect(pad.children.some(child => child instanceof InstancedMesh && child.count >= 6)).toBe(true);
    expect(() => registry.build("MI-07", { detail: "invalid" })).toThrow("Invalid option");
  });

  it("places a three-level pad relative to the unchanged Jezero terrain", () => {
    const registry = createProductionRegistry();
    const layout = parseColonyLayout(colonyJson, registry);
    const specs = layout.placements.filter(piece => piece.id === "MI-07");
    expect(specs).toHaveLength(1);
    const colony = buildColonyGroup({ ...layout, placements: specs }, registry);
    const pad = colony.children.find(child => child instanceof LOD && child.name.startsWith("MI-07")) as LOD;
    const { at: [x, z], yOffset = 0 } = specs[0];
    expect(pad.position.toArray()).toEqual([x, terrainHeight(x, z, {
      biome: "jezero", seed: layout.terrainSeed,
    }) + yOffset, z]);
    expect(pad.levels).toHaveLength(3);
    const [near, middle, far] = pad.levels.map(({ object }) => countColonyTriangles(object));
    expect(near).toBeGreaterThan(middle);
    expect(middle).toBeGreaterThan(far);
    expect(colony.detailedTriangles).toBe(near);
  });
});
