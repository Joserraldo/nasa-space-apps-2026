import { describe, expect, it } from "vitest";
import { Box3, Group, InstancedMesh, Mesh } from "three";
import { createDemoRegistry } from "../../src/core/demo-pieces";
import { batchStatic } from "../../src/core/batching";
import { triangleCount } from "../../tools/geometry-inspection";
import { buildBaseScene } from "../../src/core/base-scene";

describe("static room batching", () => {
  it("builds the JSON fixture with the expected geometric budget", () => {
    const group=buildBaseScene(createDemoRegistry());
    const triangles=triangleCount(group);
    console.log("BASE_GEOMETRY",JSON.stringify({triangles,renderObjects:group.children.length}));
    expect(triangles).toBe(2854);
  });
  it("instances more than three repeats while preserving transforms and triangle counts", () => {
    const registry=createDemoRegistry(), root=new Group();
    root.position.set(12,0,-6); root.rotation.y=0.3;
    for (let i=0;i<4;i++) {const floor=registry.build("ST-F01");floor.position.x=i*2;root.add(floor);}
    const expectedBounds=new Box3().setFromObject(root), expectedTriangles=triangleCount(root);
    const batched=batchStatic(root);
    expect(batched.children.every(child=>child instanceof InstancedMesh)).toBe(true);
    expect(triangleCount(batched)).toBe(expectedTriangles);
    const actualBounds=new Box3().setFromObject(batched);
    expect(actualBounds.min.distanceTo(expectedBounds.min)).toBeLessThan(1e-5);
    expect(actualBounds.max.distanceTo(expectedBounds.max)).toBeLessThan(1e-5);
  });
  it("merges infrequent static geometry by material, preserving attributes", () => {
    const root=new Group(), registry=createDemoRegistry();
    root.add(registry.build("DN-01"));
    const merged=batchStatic(root);
    const materials=new Set(merged.children.map(child=>(child as Mesh).material));
    expect(materials.size).toBe(merged.children.filter(child=>!(child instanceof InstancedMesh)).length);
    expect(triangleCount(merged)).toBe(triangleCount(root));
    for (const child of merged.children) {
      const geometry=(child as Mesh).geometry;
      expect(geometry.getAttribute("uv")).toBeDefined();
      expect(geometry.getAttribute("normal")).toBeDefined();
    }
  });
});

