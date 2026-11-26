import { describe, expect, it } from "vitest";
import { Mesh } from "three";
import { createDemoRegistry } from "../../src/core/demo-pieces";
import { inventoryIds } from "../../src/kit/inventory";

describe("inventory registry", () => {
  it("reads production inventory IDs, including Carbon's next tasks", () => {
    for (const id of ["ST-W01","MT-T04","MT-T05","MT-T06","CH-09"]) expect(inventoryIds.has(id)).toBe(true);
    expect(inventoryIds.has("FAKE-01")).toBe(false);
  });
  it("registers, builds, names and shares geometry while isolating transforms", () => {
    const registry = createDemoRegistry();
    const first = registry.build("DN-01"), second = registry.build("DN-01",{seed:1,width:1.6});
    expect(first.name).toBe("DN-01_standard");
    expect(first).not.toBe(second);
    expect((first.children[0] as Mesh).geometry).toBe((second.children[0] as Mesh).geometry);
    first.children[0].position.x = 99;
    expect(second.children[0].position.x).toBe(0);
    expect((registry.build("DN-01",{width:1.2}).children[3] as Mesh).geometry).not.toBe((second.children[3] as Mesh).geometry);
  });
  it("rejects unknown IDs, duplicates, unregistered IDs and invalid typed parameters", () => {
    const registry = createDemoRegistry(), entry = registry.entries()[0];
    expect(() => registry.register("FAKE-01",entry)).toThrow("Unknown inventory");
    expect(() => registry.register("DN-01",entry)).toThrow("Duplicate");
    expect(() => registry.build("ST-W01")).toThrow("not registered");
    for (const params of [{width:NaN},{width:99},{seed:0.2},{unknown:true},null]) {
      expect(() => registry.build("DN-01",params)).toThrow();
    }
  });
});
