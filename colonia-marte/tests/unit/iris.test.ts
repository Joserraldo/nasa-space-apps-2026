import { describe, expect, it } from "vitest";
import { Box3, Mesh, Vector3 } from "three";
import { createProductionRegistry } from "../../src/kit/pieces";
import { irisExpressions } from "../../src/materials/iris-faces";
import { parseIris } from "../../src/kit/pieces/crew/iris";
import { validateRegistry } from "../../tools/validate-pieces";

describe("CH-09 Iris", () => {
  const registry = createProductionRegistry();
  it("uses seven rigid material batches and a larger game-readable face", () => {
    const root = registry.build("CH-09");
    let meshes = 0;
    root.traverse(node => { if (node instanceof Mesh) meshes++; });
    expect(meshes).toBe(7);
    const face = root.getObjectByName("face_happy") as Mesh;
    face.geometry.computeBoundingBox();
    const size = face.geometry.boundingBox!.getSize(new Vector3());
    expect(size.x).toBeCloseTo(0.74); expect(size.y).toBeCloseTo(0.444);
    expect(size.x / 0.8).toBeGreaterThan(0.9);
  });
  it("registers five expressions with distinct screen regions and validates all variants", () => {
    const regions = irisExpressions.map(expression => {
      const root = registry.build("CH-09", { expression });
      const face = root.getObjectByName(`face_${expression}`) as Mesh;
      expect(root.userData.expression).toBe(expression);
      return Array.from(face.geometry.getAttribute("uv").array).join(",");
    });
    expect(new Set(regions).size).toBe(5);
    for (const result of validateRegistry(registry).filter(p => p.id === "CH-09")) {
      expect(result.issues, result.variant).toEqual([]);
    }
    expect(() => parseIris({ expression: "angry" })).toThrow();
    expect(() => parseIris({ gameState: 1 })).toThrow();
  });
  it("places all four wheel pivots at wheel centers, on their X rotation axes", () => {
    const root = registry.build("CH-09");
    const wheels = root.children.filter(node => node.name === "wheel_axle");
    expect(wheels).toHaveLength(4);
    for (const wheel of wheels) {
      expect(wheel.userData.axis).toEqual([1, 0, 0]);
      root.updateMatrixWorld(true);
      const before = new Box3().setFromObject(wheel).getCenter(new Vector3());
      expect(before.distanceTo(wheel.getWorldPosition(new Vector3()))).toBeLessThan(0.001);
      wheel.rotation.x = Math.PI / 2; root.updateMatrixWorld(true);
      const after = new Box3().setFromObject(wheel).getCenter(new Vector3());
      expect(after.distanceTo(before)).toBeLessThan(0.001);
    }
  });
});
