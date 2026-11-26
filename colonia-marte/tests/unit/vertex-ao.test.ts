import { describe, expect, it } from "vitest";
import { BoxGeometry } from "three";
import { bakeVertexAO, restoreAOCache, serializeAOCache, type AOCache } from "../../tools/bake-vertex-ao";
import { bakeRoomAO } from "../../tools/bake-room-ao";
import { createAORoom } from "../../src/scenes/ao-fixture";

describe("vertex AO", () => {
  it("is bounded, deterministic, preserves inputs and darkens contact areas", () => {
    const room = createAORoom();
    const a = bakeRoomAO(room, { samples: 24 });
    const b = bakeRoomAO(room, { samples: 24 });
    const values = Array.from((a.group.children[0] as import("three").Mesh).geometry.getAttribute("color").array);
    const repeat = Array.from((b.group.children[0] as import("three").Mesh).geometry.getAttribute("color").array);
    expect(values).toEqual(repeat);
    expect(Math.min(...values)).toBeGreaterThanOrEqual(0);
    expect(Math.min(...values)).toBeLessThan(0.8);
    expect(Math.max(...values)).toBe(1);
    const original = (room.children[0] as import("three").Mesh).geometry.getAttribute("color");
    expect(Array.from(original.array).every(value => value === 1)).toBe(true);
    console.log("AO_COLD_BAKE", JSON.stringify({ milliseconds: a.milliseconds, vertices: values.length / 3 }));
  });
  it("round-trips room caches and invalidates geometry and parameters", () => {
    const geometry = new BoxGeometry();
    const cache: AOCache = new Map();
    const cold = bakeVertexAO(geometry, { samples: 8 }, cache);
    const restored = restoreAOCache(serializeAOCache(cache));
    const warm = bakeVertexAO(geometry, { samples: 8 }, restored);
    expect(cold.cacheHit).toBe(false); expect(warm.cacheHit).toBe(true);
    expect(warm.geometry.getAttribute("color").array).toEqual(cold.geometry.getAttribute("color").array);
    expect(bakeVertexAO(geometry, { samples: 9 }, restored).cacheHit).toBe(false);
    expect(bakeVertexAO(geometry.clone().translate(0.1, 0, 0), { samples: 8 }, restored).cacheHit).toBe(false);
    expect(geometry.hasAttribute("color")).toBe(false);
    expect(() => restoreAOCache('{"version":"old","entries":[]}')).toThrow();
    expect(() => bakeVertexAO(geometry, { radius: -1 })).toThrow();
  });
});
