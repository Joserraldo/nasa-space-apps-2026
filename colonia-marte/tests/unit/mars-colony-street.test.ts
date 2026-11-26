import { Box3, InstancedMesh, Matrix4, Mesh, Raycaster, Vector3 } from "three";
import { expect, it } from "vitest";
import layoutJson from "../../data/layouts/colonies/exterior-pilot.json";
import { createTerrain, terrainHeight } from "../../src/environment/terrain";
import { createProductionRegistry } from "../../src/kit/pieces";
import { parseStreet, streetSections } from "../../src/kit/pieces/mars/colony-street";
import { materials } from "../../src/materials/shared";
import { buildColonyGroup, parseColonyLayout } from "../../src/scenes/colony-layout";

const registry = createProductionRegistry();

it("registers a four-metre grid with one instanced strip for both edges", () => {
  const street = registry.build("MI-01");
  const lights = street.getObjectByName("Recessed lane dashes") as InstancedMesh;
  expect(lights).toBeInstanceOf(InstancedMesh);
  expect(lights.count).toBeGreaterThan(3);
  expect(new Box3().setFromObject(street).min.y).toBeCloseTo(0);
  const x = new Vector3();
  const matrix = new Matrix4();
  const sides = [];
  for (let i = 0; i < lights.count; i++) {
    lights.getMatrixAt(i, matrix);
    sides.push(x.setFromMatrixPosition(matrix).x);
  }
  expect(Math.min(...sides)).toBeCloseTo(-1.83);
  expect(Math.max(...sides)).toBeCloseTo(1.83);
  expect(sides.filter(x => x > 0)).toHaveLength(sides.length / 2);
});

it("cuts a constant-radius quarter circle tangent to both straight runs", () => {
  const sections = streetSections([[0, 0], [10, 0], [10, 10]]);
  const arc = sections.filter(({ center }) => center.x > 6.71 && center.x < 9.99 && center.y > 0.01);
  expect(arc.length).toBeGreaterThan(8);
  for (const { center, lateral } of arc) {
    expect(Math.hypot(center.x - 6.7, center.y - 3.3)).toBeCloseTo(3.3, 5);
    expect(lateral.length()).toBeCloseTo(1);
  }
});

it("supports the dual edge dashes and grades the side strips into the existing ground", () => {
  const layout = parseColonyLayout(layoutJson, registry);
  const group = buildColonyGroup(layout, registry);
  const lights = group.getObjectByName("Recessed lane dashes") as InstancedMesh;
  expect(lights).toBeInstanceOf(InstancedMesh);
  expect(lights.count).toBeGreaterThanOrEqual(4);
  const street = lights.parent!;
  group.updateMatrixWorld(true);
  const slabs = street.children.filter(child => child instanceof Mesh && child.material === materials.M_palette &&
    !(child instanceof InstancedMesh));
  expect(slabs).toHaveLength(1);
  const shoulder = street.children.find(child => child instanceof Mesh && child.material === materials.M_terrain) as Mesh;
  expect(shoulder).toBeInstanceOf(Mesh);
  const sample = new Vector3(), matrix = new Matrix4();
  const terrain = createTerrain({ biome: layout.biome, seed: layout.terrainSeed });
  const nearGround = terrain.children[0];
  for (let i = 0; i < lights.count; i++) {
    lights.getMatrixAt(i, matrix);
    sample.setFromMatrixPosition(matrix).applyMatrix4(lights.matrixWorld);
    const ground = terrainHeight(sample.x, sample.z, { biome: layout.biome, seed: layout.terrainSeed });
    const ray = new Raycaster(new Vector3(sample.x, sample.y + 0.3, sample.z), new Vector3(0, -1, 0));
    const pavement = ray.intersectObjects(slabs)[0]?.point.y ?? -Infinity;
    expect(pavement - ground).toBeGreaterThan(0.08);
    if (i % 4 === 0) {
      const renderedGround = ray.intersectObject(nearGround)[0]?.point.y ?? Infinity;
      expect(pavement - renderedGround).toBeGreaterThan(0.055);
      expect(pavement - renderedGround).toBeLessThan(0.2);
    }
    expect(sample.y - pavement).toBeGreaterThanOrEqual(0.004);
    expect(sample.y - pavement).toBeLessThan(0.024);
  }
  const levels = [...Array(shoulder.geometry.getAttribute("position").count)].map((_, i) => {
    const { x, y, z } = sample.fromBufferAttribute(shoulder.geometry.getAttribute("position"), i)
      .applyMatrix4(shoulder.matrixWorld);
    return y - terrainHeight(x, z, { biome: layout.biome, seed: layout.terrainSeed });
  });
  expect(Math.min(...levels)).toBeLessThan(0);
  expect(Math.max(...levels)).toBeGreaterThan(0.08);
});

it("connects the hub airlock to the greenhouse west steps without a perimeter detour", () => {
  const layout = parseColonyLayout(layoutJson, registry);
  const airlock = layout.placements.find(spec => spec.id === "NX-04")!;
  const greenhouse = layout.placements.find(spec => spec.id === "MB-11")!;
  const road = layout.placements.find(spec => spec.id === "MI-01")!;
  const { path, access } = parseStreet(road.params);
  expect(access).toBeDefined();
  expect(road.at[0] + access![0][0]).toBeCloseTo(airlock.at[0]);
  expect(road.at[1] + access![0][1] - airlock.at[1]).toBeCloseTo(1.45);
  const [joinX, joinZ] = access!.at(-1)!;
  expect(joinX - path[0][0]).toBeGreaterThanOrEqual(0);
  expect(joinX - path[0][0]).toBeLessThan(0.35);
  expect(Math.abs(joinZ - path[0][1])).toBeLessThan(2);
  expect(path.length).toBeLessThanOrEqual(3);
  expect(Math.max(...[...access!, ...path].map(([, z]) => road.at[1] + z))).toBeLessThan(13.4);
  const [x, z] = path.at(-1)!;
  expect(road.at[1] + z).toBeCloseTo(greenhouse.at[1]);
  expect(greenhouse.at[0] - (road.at[0] + x)).toBeCloseTo(5.215, 1);
});

it("keeps pavement and graded edges out from under existing structures and rocks", () => {
  const layout = parseColonyLayout(layoutJson, registry);
  const road = layout.placements.find(spec => spec.id === "MI-01")!;
  const { path, access } = parseStreet(road.params);
  const roadSamples = [
    ...footprintSamples(streetSections(path), 2.62),
    ...footprintSamples(streetSections(access!, 0.85), 0.65),
  ];
  const ray = new Raycaster(new Vector3(), new Vector3(0, -1, 0));
  for (const spec of layout.placements.filter(piece => piece.id !== "MI-01")) {
    const structure = registry.build(spec.id, spec.params);
    structure.position.set(spec.at[0], 0, spec.at[1]);
    structure.rotation.y = (spec.rot ?? 0) * Math.PI / 180;
    const { min, max } = new Box3().setFromObject(structure);
    const intrusion = roadSamples.some(([x, z]) => {
      if (x < min.x || x > max.x || z < min.z || z > max.z) return false;
      ray.ray.origin.set(x, max.y + 1, z);
      return ray.intersectObject(structure).length > 0;
    });
    expect(intrusion, `${spec.id} (${spec.at.join(", ")})`).toBe(false);
  }

  function footprintSamples(sections: ReturnType<typeof streetSections>, halfWidth: number) {
    return sections.slice(1).flatMap((end, i) => {
      const start = sections[i];
      const cuts = Math.ceil(start.center.distanceTo(end.center) / 0.12);
      const offsets = Math.ceil(halfWidth / 0.12);
      return Array.from({ length: cuts + 1 }, (_, cut) => {
        const t = cut / cuts;
        const center = start.center.clone().lerp(end.center, t);
        const lateral = start.lateral.clone().lerp(end.lateral, t);
        return Array.from({ length: 2 * offsets + 1 }, (_, j) => {
          const offset = halfWidth * (j / offsets - 1);
          return [road.at[0] + center.x + offset * lateral.x, road.at[1] + center.y + offset * lateral.y];
        });
      }).flat();
    });
  }
});
