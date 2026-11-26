import { InstancedMesh, LOD, Matrix4, Mesh, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import colonyJson from "../../data/layouts/colonies/exterior-pilot.json";
import { createProductionRegistry } from "../../src/kit/pieces";
import { materials } from "../../src/materials/shared";
import { buildColonyGroup, parseColonyLayout } from "../../src/scenes/colony-layout";

describe("NX-02 runway edge beacons", () => {
  it("registers a single palette mesh that can be shared by every beacon", () => {
    const beacon = createProductionRegistry().build("NX-02");
    expect(beacon.children).toHaveLength(1);
    expect(beacon.children[0]).toBeInstanceOf(Mesh);
    expect((beacon.children[0] as Mesh).material).toBe(materials.M_palette);
  });

  it("instances two deck-mounted fixtures per edge without blocking the MI-07 stair", () => {
    const registry = createProductionRegistry();
    const colony = buildColonyGroup(parseColonyLayout(colonyJson, registry), registry);
    const pad = colony.children.find(child => child instanceof LOD && child.name.startsWith("MI-07")) as LOD;
    const beacons = pad.levels[0].object.children.find(child => child.name === "NX-02 runway edge") as InstancedMesh;
    expect(beacons).toBeInstanceOf(InstancedMesh);
    expect(beacons.count).toBe(16);
    const matrix = new Matrix4();
    for (let edge = 0; edge < 8; edge++) {
      const angle = edge * Math.PI / 4;
      const outward = new Vector3(Math.sin(angle), 0, Math.cos(angle));
      const tangent = new Vector3(Math.cos(angle), 0, -Math.sin(angle));
      for (let side = 0; side < 2; side++) {
        beacons.getMatrixAt(edge * 2 + side, matrix);
        const position = new Vector3().setFromMatrixPosition(matrix);
        expect(position.y).toBeCloseTo(1.58);
        expect(position.dot(outward)).toBeCloseTo(5, 1);
        expect(position.dot(tangent)).toBeCloseTo(side === 0 ? -1.08 : 1.08);
      }
    }
    expect(pad.levels[2].object.getObjectByName(beacons.name)).toBeUndefined();
  });
});
