import { describe, expect, it } from "vitest";
import { Mesh } from "three";
import * as primitives from "../../src/kit/primitives";
import { inspectGeometry } from "../../tools/validate-pieces";
import { geometryHash } from "../../tools/geometry-inspection";
import { primitiveSamples } from "../../src/catalog/samples";

describe("approved-spike primitives", () => {
  for (const [name,build] of Object.entries(primitiveSamples)) it(`${name}: indexed, welded, nondegenerate, deterministic`, () => {
    const geometry = build();
    console.log("PRIMITIVE_COUNT",name,geometry.index!.count/3);
    expect(inspectGeometry(geometry)).toEqual([]);
    expect(Array.from(geometry.getAttribute("color").array).every(value => value === 1)).toBe(true);
    expect(geometryHash(new Mesh(geometry))).toBe(geometryHash(new Mesh(build())));
    expect(build()).toBe(geometry);
  });
  it("keeps exact box dimensions and flat faces with interpolated bevel normals", () => {
    const geometry = primitiveSamples.chamferBox();
    expect(geometry.boundingBox!.max.x-geometry.boundingBox!.min.x).toBeCloseTo(1);
    const normals = geometry.getAttribute("normal");
    expect(Array.from({length:normals.count},(_,i) => normals.getX(i)).some(n => n===1)).toBe(true);
    expect(new Set(Array.from(normals.array).map(n => n.toFixed(4))).size).toBeGreaterThan(10);
  });
  it("keys extrusions by actual profile and removes declared hidden faces", () => {
    expect(primitives.extrudeProfile(primitives.chamferRect(1,1,0.1),0.2)).not.toBe(
      primitives.extrudeProfile(primitives.chamferRect(2,1,0.1),0.2));
    const open = primitives.chamferBox(1,1,1,0.04,["bottom"]), full = primitives.chamferBox(1,1,1,0.04);
    expect(open.index!.count).toBeLessThan(full.index!.count);
    expect(primitives.geodesicHalf().boundingBox!.min.y).toBeCloseTo(0);
  });
  it("rejects impossible dimensions", () => {
    expect(() => primitives.chamferBox(0,1,1)).toThrow();
    expect(() => primitives.pipeRun([[0,0,0],[0,0,0]])).toThrow();
    expect(() => primitives.geodesicHalf(1,5)).toThrow();
  });
});
