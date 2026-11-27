import { Box3, Mesh, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { createProductionRegistry } from "../../src/kit/pieces";
import { buildRoverTracks, parseRoverTracks } from "../../src/kit/pieces/mars/rover-tracks";
import { materials } from "../../src/materials/shared";
import { triangleCount } from "../../tools/geometry-inspection";

describe("final exterior pieces", () => {
  it("keeps an opaque tree inside the non-emissive biodome glazing at each detail level", () => {
    const registry = createProductionRegistry();
    const triangles = ["near", "middle", "far"].map(detail => {
      const dome = registry.build("MB-06", { detail });
      const glass = dome.getObjectByName("Biodome glazing") as Mesh;
      const tree = dome.getObjectByName("Biodome tree")!;
      expect(glass.material).toBe(materials.M_glass);
      const shell = new Box3().setFromObject(glass);
      const treeBox = new Box3().setFromObject(tree);
      expect(shell.containsBox(treeBox), `${detail}: glass ${shell.min.toArray()}–${shell.max.toArray()}, tree ${treeBox.min.toArray()}–${treeBox.max.toArray()}`).toBe(true);
      expect(treeBox.getSize(new Vector3()).y).toBeGreaterThan(2);
      return triangleCount(dome);
    });
    expect(triangles[0]).toBeGreaterThan(triangles[1]);
    expect(triangles[1]).toBeGreaterThan(triangles[2]);
  });

  it("lays separated feathered treads across both sides of a sloping route", () => {
    const spec = parseRoverTracks({ path: [[0, -4], [0, 0], [1, 4]] });
    const slope = (x: number, z: number) => x * 0.04 + z * 0.08;
    const track = buildRoverTracks(spec, slope);
    const vertices = track.geometry.getAttribute("position"), coverage = track.geometry.getAttribute("treadCoverage");
    for (let i = 0; i < vertices.count; i++) {
      expect(vertices.getY(i) - slope(vertices.getX(i), vertices.getZ(i))).toBeCloseTo(0.026, 5);
    }
    expect(vertices.array.some((value, i) => i % 3 === 0 && value < -0.75)).toBe(true);
    expect(vertices.array.some((value, i) => i % 3 === 0 && value > 0.75)).toBe(true);
    expect(coverage.array.some(value => value === 0)).toBe(true);
    expect(coverage.array.some(value => value > 0)).toBe(true);
    expect(track.material).toMatchObject({ transparent: true, depthWrite: false });
  });
});
