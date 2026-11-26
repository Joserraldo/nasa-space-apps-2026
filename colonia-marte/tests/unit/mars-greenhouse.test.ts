import { Box3, InstancedMesh, LOD, Mesh, Raycaster, Vector3 } from "three";
import { expect, it } from "vitest";
import layoutJson from "../../data/layouts/colonies/exterior-pilot.json";
import { createProductionRegistry } from "../../src/kit/pieces";
import { paletteUV } from "../../src/materials/atlas";
import { materials } from "../../src/materials/shared";
import { countColonyTriangles } from "../../src/scenes/colony-batches";
import { buildColonyGroup, parseColonyLayout } from "../../src/scenes/colony-layout";

const registry = createProductionRegistry();

it.each(["near", "middle", "far"])("keeps jointed cladding and a cyan plinth strip on both long walls in %s", detail => {
  const greenhouse = registry.build("MB-11", { detail });
  greenhouse.updateMatrixWorld(true);
  const uv = paletteUV("cyan");
  const opaque = greenhouse.children.filter(node => node instanceof Mesh && node.material === materials.M_palette);
  for (const side of [-1, 1]) {
    const cyanXs: number[] = [];
    for (const node of opaque as Mesh[]) {
      const position = node.geometry.getAttribute("position"), atlas = node.geometry.getAttribute("uv");
      for (let i = 0; i < position.count; i++) {
        const point = new Vector3().fromBufferAttribute(position, i).applyMatrix4(node.matrixWorld);
        if (point.y < 0.66 && point.z * side > 2.26 &&
          Math.abs(atlas.getX(i) - uv[0]) + Math.abs(atlas.getY(i) - uv[1]) < 1e-6) cyanXs.push(point.x);
      }
    }
    expect(Math.max(...cyanXs) - Math.min(...cyanXs)).toBeGreaterThan(9.4);
    const length = 9.7, bays = detail === "far" ? 3 : 5;
    const panelZ = (x: number) => new Raycaster(
      new Vector3(x, 0.34, side * 3), new Vector3(0, 0, -side),
    ).intersectObjects(opaque)[0]?.point.z ?? 0;
    expect((panelZ(-length / 2 + length / bays / 2) - panelZ(-length / 2 + length / bays)) * side).toBeGreaterThan(0.02);
  }
});

it("keeps living rows behind shared, non-emissive greenhouse glazing", () => {
  const greenhouse = registry.build("MB-11");
  const crops = greenhouse.getObjectByName("Hydroponic leaves") as InstancedMesh;
  expect(crops).toBeInstanceOf(InstancedMesh);
  expect(crops.count).toBeGreaterThan(40);
  expect(crops.material).toBe(materials.M_palette);
  const panes = greenhouse.children.filter((object): object is Mesh =>
    object instanceof Mesh && object.material === materials.M_glass);
  expect(panes).toHaveLength(1);
  expect(materials.M_glass.transparent).toBe(true);
  expect(materials.M_glass.emissive.getHex()).toBe(0);
  const glass = new Box3().setFromObject(panes[0]);
  const planting = new Box3().setFromObject(crops);
  expect(planting.max.y).toBeLessThan(glass.max.y);
  expect(planting.min.x).toBeGreaterThan(glass.min.x);
  expect(planting.max.z).toBeLessThan(glass.max.z);
});

it("places a three-level greenhouse clear of the existing radial pieces", () => {
  const layout = parseColonyLayout(layoutJson, registry);
  const placements = layout.placements.filter(piece => piece.id === "MB-11");
  const colony = buildColonyGroup({ ...layout, placements }, registry);
  const greenhouse = colony.children.find(child => child instanceof LOD && child.name.startsWith("MB-11")) as LOD;
  expect(greenhouse).toBeDefined();
  expect(greenhouse.levels.map(level => level.distance)).toEqual([0, 62, 105]);
  const [near, middle, far] = greenhouse.levels.map(level => countColonyTriangles(level.object));
  expect(near).toBeGreaterThan(middle);
  expect(middle).toBeGreaterThan(far);
  for (const { object } of greenhouse.levels) {
    expect(object.children.some(node => node instanceof Mesh && node.material === materials.M_glass)).toBe(true);
  }
  const bounds = new Box3().setFromObject(greenhouse);
  for (const spec of layout.placements.filter(piece => !["MB-11", "MI-01"].includes(piece.id))) {
    const existing = registry.build(spec.id, spec.params);
    existing.position.set(spec.at[0], 0, spec.at[1]);
    existing.rotation.y = (spec.rot ?? 0) * Math.PI / 180;
    const other = new Box3().setFromObject(existing);
    const overlaps = bounds.max.x > other.min.x && bounds.min.x < other.max.x &&
      bounds.max.z > other.min.z && bounds.min.z < other.max.z;
    expect(overlaps, `${spec.id} (${spec.at.join(", ")})`).toBe(false);
  }
});
