import { Box3, InstancedMesh, LOD, Matrix4, Mesh, PerspectiveCamera, Raycaster, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import pilot from "../../data/layouts/colonies/exterior-pilot.json";
import { createProductionRegistry } from "../../src/kit/pieces";
import { terrainHeight } from "../../src/environment/terrain";
import { materials } from "../../src/materials/shared";
import { countColonyTriangles } from "../../src/scenes/colony-batches";
import { buildColonyGroup, parseColonyLayout } from "../../src/scenes/colony-layout";

const registry = createProductionRegistry();

describe("Jezero exterior additions", () => {
  it("uses shared instances for the repeated street lamps", () => {
    const layout = parseColonyLayout(pilot, registry);
    const placements = layout.placements.filter(part => part.id === "MI-02");
    const positions = placements.map(part => part.at);
    expect(positions.length).toBeGreaterThan(3);
    const colony = buildColonyGroup({ ...layout, placements }, registry);
    const lamps: number[][] = [];
    colony.traverse(node => {
      if (!(node instanceof InstancedMesh) || node.count !== positions.length) return;
      const matrix = new Matrix4();
      const offsets = positions.map((_, index) => {
        node.getMatrixAt(index, matrix);
        return new Vector3().setFromMatrixPosition(matrix);
      });
      if (positions.every(([x, z], i) => Math.hypot(offsets[i].x - x, offsets[i].z - z) < 0.001)) {
        lamps.push(offsets.map(offset => offset.y));
      }
    });
    expect(lamps).toHaveLength(1);
    const lamp = new Box3().setFromObject(registry.build("MI-02")).getSize(new Vector3());
    expect(lamp.y).toBeGreaterThan(3);
    expect(lamp.x).toBeLessThan(0.45);
  });

  it("supports a horizontal fuel vessel on two separate feet beside the hangar", () => {
    const tank = registry.build("MI-10");
    tank.updateMatrixWorld(true);
    const size = new Box3().setFromObject(tank).getSize(new Vector3());
    expect(size.x).toBeGreaterThan(2 * size.z);
    const ray = new Raycaster(new Vector3(0, 0.1, 4), new Vector3(0, 0, -1));
    expect(ray.intersectObject(tank, true)).toHaveLength(0);
    for (const x of [-1.45, 1.45]) {
      ray.ray.origin.x = x;
      expect(ray.intersectObject(tank, true).length).toBeGreaterThan(0);
    }
    const placement = pilot.placements.find(part => part.id === "MI-10")!;
    expect(Math.hypot(placement.at[0] - 6.45, placement.at[1] + 14.36)).toBeLessThan(10);
  });

  it.each(["MB-05", "MB-09", "MB-08"])("installs three decreasing levels of %s", id => {
    const layout = parseColonyLayout(pilot, registry);
    const spec = layout.placements.find(part => part.id === id)!;
    const colony = buildColonyGroup({ ...layout, placements: [spec] }, registry);
    const building = colony.children.find((node): node is LOD => node instanceof LOD)!;
    const camera = new PerspectiveCamera();
    colony.updateMatrixWorld(true);
    for (const [distance, level] of [[15, 0], [29, 1], [45, 2]]) {
      camera.position.copy(building.position).add(new Vector3(distance, 0, 0));
      camera.updateMatrixWorld();
      colony.updateLods(camera);
      expect(building.getCurrentLevel()).toBe(level);
    }
    const [near, middle, far] = building.levels.map(level => countColonyTriangles(level.object));
    expect(near).toBeGreaterThan(middle);
    expect(middle).toBeGreaterThan(far);
    for (const { object } of building.levels) {
      let glazed = false;
      object.traverse(node => {
        if (node instanceof Mesh && node.material === materials.M_glass) glazed = true;
      });
      expect(glazed).toBe(true);
    }
  });

  it("gives the residence physical balcony rails and rooftop equipment", () => {
    const model = registry.build("MB-08");
    const rails = model.getObjectByName("Balcony rail posts");
    expect(rails).toBeInstanceOf(InstancedMesh);
    expect((rails as InstancedMesh).count).toBeGreaterThan(8);
    expect(model.getObjectByName("Roof cooling louvers")).toBeInstanceOf(InstancedMesh);
  });
});

describe("Main entrance and paved core", () => {
  it("keeps the plaza to a few meshes while supporting the entrance approach", () => {
    const layout = parseColonyLayout(pilot, registry);
    const spec = layout.placements.find(part => part.id === "MI-01" && part.params?.layout === "plaza" && part.at[1] > 20);
    expect(spec).toBeDefined();
    const colony = buildColonyGroup({ ...layout, placements: [spec!] }, registry);
    colony.updateMatrixWorld(true);
    const meshes: Mesh[] = [];
    colony.traverse(node => { if (node instanceof Mesh) meshes.push(node); });
    const batches = meshes.filter(node => node instanceof InstancedMesh);
    expect(batches).toHaveLength(2);
    expect(batches.some(batch => batch.count > 100)).toBe(true);
    expect(meshes.length).toBeLessThanOrEqual(5);
    const probe = new Raycaster(new Vector3(-6.8, 12, 34), new Vector3(0, -1, 0));
    const [paving] = probe.intersectObjects(meshes);
    expect(paving).toBeDefined();
    expect(paving.point.y - terrainHeight(-6.8, 34, { biome: layout.biome, seed: layout.terrainSeed }))
      .toBeLessThan(0.09);
    expect(batches.find(batch => batch.count < 100)?.count).toBeGreaterThan(22);
    const view = layout.views[4];
    const [x, , z] = view.position;
    expect(view.eyeHeight).toBeLessThan(1.5);
    expect(Math.hypot(x - view.target[0], z - view.target[2])).toBeGreaterThan(14);
    expect(layout.placements.filter(part => part.id === "NX-04" && part.params?.principal)).toHaveLength(1);
  });

  it("keeps the real Carbon entrance pieces and declares the western sublayout", () => {
    const layout = parseColonyLayout(pilot, registry);
    expect(layout.placements.find(part => part.id === "MB-14")?.at).toEqual([-14.62, 32.51]);
    expect(layout.placements.find(part => part.id === "MV-01")?.at).toEqual([-4.31, 29.02]);
    expect(layout.reservations.map(slot => slot.id)).not.toContain("MB-14");
    expect(layout.reservedAreas).toContainEqual({
      id: "base-district", at: [-66, 11], size: [60, 52], sublayout: "base-district", rot: 90,
    });
    expect(() => parseColonyLayout({ ...pilot, reservations: [{ id: "FAKE-99", at: [0, 0] }] }, registry))
      .toThrow(/Invalid reserved/);
    expect(() => parseColonyLayout({ ...pilot, reservedAreas: [{ id: "base-district", at: [0, 0], size: [-1, 40] }] }, registry))
      .toThrow(/Invalid reserved area/);
  });
});
