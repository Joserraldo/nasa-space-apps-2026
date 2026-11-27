import { InstancedMesh, LOD, Mesh, PerspectiveCamera } from "three";
import { describe, expect, it } from "vitest";
import districtJson from "../../data/layouts/colonies/base-district.json";
import { createProductionRegistry } from "../../src/kit/pieces";
import { sharedMaterials } from "../../src/materials/shared";
import { countVisibleDrawCalls, countVisibleTriangles } from "../../src/scenes/base-district";
import { buildColonyGroup, parseColonyLayout } from "../../src/scenes/colony-layout";

describe("T3.5 Colony Base District (base-district.json)", () => {
  const registry = createProductionRegistry();

  it("parses base-district.json with all required views, dense blocks, vehicles, and landmark pieces", () => {
    const layout = parseColonyLayout(districtJson, registry);
    expect(layout.id).toBe("base-district");
    expect(layout.biome).toBe("jezero");
    expect(layout.environment).toBe("AMB-04");
    expect(layout.flatPlatform).toBe(true);

    const viewIds = layout.views.map(v => v.id);
    expect(viewIds).toEqual(["v3-t050", "v3-t074", "parking", "street-landmark"]);

    const ids = new Set(layout.placements.map(p => p.id));
    for (const required of ["MI-01", "MI-02", "MI-05", "MI-09", "MI-10", "MB-10", "MB-13", "MB-14", "NX-01", "MV-01", "MV-03", "MV-11"]) {
      expect(ids.has(required), `missing ${required}`).toBe(true);
    }

    const rescuedRover = layout.placements.find(p => p.id === "MV-11");
    expect(rescuedRover?.params?.state).toBe("rescued");
  });

  it("keeps the district strictly within <= 80 draw calls and <= 250,000 triangles with instancing and 3 LODs", () => {
    const layout = parseColonyLayout(districtJson, registry);
    const colony = buildColonyGroup(layout, registry);
    colony.updateMatrixWorld(true);

    const cam = new PerspectiveCamera(40, 16 / 9, 0.15, 60000);
    cam.position.set(-21.5, 14.5, 29.5);
    cam.lookAt(2.2, 2.4, 9.8);
    cam.updateMatrixWorld();
    colony.updateLods(cam);

    const drawCalls = countVisibleDrawCalls(colony);
    const triangles = countVisibleTriangles(colony);
    expect(drawCalls).toBeLessThanOrEqual(80);
    expect(triangles).toBeLessThanOrEqual(250_000);
    expect(colony.detailedTriangles).toBeLessThanOrEqual(250_000);

    // Instancing mandatory for repeated slabs, street LEDs, lamps, and crates
    const instanced: InstancedMesh[] = [];
    colony.traverse(node => {
      if (node instanceof Mesh) {
        expect(sharedMaterials.has(node.material)).toBe(true);
      }
      if (node instanceof InstancedMesh) instanced.push(node);
    });
    expect(instanced.length).toBeGreaterThanOrEqual(5);

    // 3 LOD levels on district buildings & vehicles
    const lodNodes = colony.children.filter((n): n is LOD => n instanceof LOD);
    expect(lodNodes.length).toBeGreaterThanOrEqual(12);
    for (const lod of lodNodes) {
      expect(lod.levels).toHaveLength(3);
    }
  }, 30_000);
});
