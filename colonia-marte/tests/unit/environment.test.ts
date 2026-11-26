import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { Mesh, InstancedMesh, Matrix4, Vector3 } from "three";
import data from "../../data/environments.json";
import { createJezeroRockScatter, disposeRockScatter } from "../../src/environment/rock-scatter";
import { createTerrain, iceMask, terrainHeight, TERRAIN_LIMIT } from "../../src/environment/terrain";
import { loadPresets, presets } from "../../src/environment/presets";
import { decodeJezeroDEM, sampleDEM } from "../../src/environment/dem";
import { triangleCount, geometryHash } from "../../tools/geometry-inspection";

describe("terrain rings", () => {
  it("retains a non-flat distant rim silhouette from the actual Jezero DEM", () => {
    const bytes = readFileSync(new URL("../../data/terrain/jezero-elevation.bin", import.meta.url));
    const dem = decodeJezeroDEM(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
    const angles = [-25, -12, 0, 12, 25].map(degrees => {
      const angle = degrees * Math.PI / 180;
      const samples = Array.from({ length: 93 }, (_, i) => {
        const radius = 1000 + i * 250;
        const h = terrainHeight(Math.sin(angle) * radius, -Math.cos(angle) * radius, {
          biome: "jezero", seed: 42, dem,
        });
        return Math.atan2(h - 1.5, radius) * 180 / Math.PI;
      });
      return Math.max(...samples);
    });
    console.log("JEZERO_RIM_DEGREES", JSON.stringify(angles));
    expect(Math.min(...angles)).toBeGreaterThan(0.5);
    expect(Math.max(...angles) - Math.min(...angles)).toBeGreaterThan(0.3);
  });
  it("has legible, gentle 2–15 m relief between 50 and 800 m in Jezero", () => {
    for (const seed of [1, 42, 93]) {
      const heights: number[] = [];
      let maxSlope = 0;
      for (let x = -800; x <= 800; x += 10) for (let z = -800; z <= 800; z += 10) {
        if (Math.hypot(x, z) < 50 || Math.hypot(x, z) > 800) continue;
        const options = { biome: "jezero" as const, seed };
        const h = terrainHeight(x, z, options); heights.push(h);
        maxSlope = Math.max(maxSlope, Math.abs(terrainHeight(x + 1, z, options) - h));
      }
      const relief = Math.max(...heights) - Math.min(...heights);
      console.log("JEZERO_RELIEF", JSON.stringify({ seed, relief, maxSlope }));
      expect(relief).toBeGreaterThanOrEqual(2); expect(relief).toBeLessThanOrEqual(15);
      expect(maxSlope).toBeLessThan(0.25);
    }
  });
  it("covers over 60% of sampled polar ground with ice, leaving soil patches", () => {
    for (const seed of [1, 42, 93]) {
      let covered = 0, total = 0;
      for (let x = -800; x <= 800; x += 8) for (let z = -800; z <= 800; z += 8) {
        const options = { biome: "polar" as const, seed };
        const h = terrainHeight(x, z, options);
        const dx = (terrainHeight(x + 0.25, z, options) - terrainHeight(x - 0.25, z, options)) / 0.5;
        const dz = (terrainHeight(x, z + 0.25, options) - terrainHeight(x, z - 0.25, options)) / 0.5;
        covered += iceMask("polar", x, z, h, Math.hypot(dx, dz), seed); total++;
      }
      const ratio = covered / total;
      console.log("POLAR_ICE_RATIO", JSON.stringify({ seed, ratio, samples: total }));
      expect(ratio).toBeGreaterThan(0.6); expect(ratio).toBeLessThan(0.98);
    }
  });
  it("bounds every LOD budget and reduces triangles with distance detail", () => {
    const counts = [0, 1, 2].map(lod => {
      const terrain = createTerrain({ biome: "jezero", seed: 42, lod: lod as 0 | 1 | 2 });
      const count = triangleCount(terrain);
      expect(terrain.children).toHaveLength(3);
      expect(count).toBeLessThanOrEqual(TERRAIN_LIMIT);
      terrain.children.forEach(node => {
        const mesh = node as Mesh;
        expect(Array.from(mesh.geometry.getAttribute("iceBias").array).every(n => n === 0)).toBe(true);
        expect(mesh.geometry.index!.count / 3).toBeLessThan(25000);
      });
      return count;
    });
    expect(counts[0]).toBeGreaterThan(counts[1]); expect(counts[1]).toBeGreaterThan(counts[2]);
    console.log("TERRAIN_LOD_TRIANGLES", JSON.stringify(counts));
  });
  it("keeps Jezero ice-free for arbitrary height and slope, with deterministic relief", () => {
    for (const height of [-1000, 0, 1000]) for (const slope of [0, 0.2, 2]) {
      expect(iceMask("jezero", 30, 40, height, slope, 42)).toBe(0);
    }
    const options = { biome: "jezero" as const, seed: 42, lod: 2 as const };
    expect(geometryHash(createTerrain(options))).toBe(geometryHash(createTerrain(options)));
    expect(terrainHeight(10, 10, options)).not.toBe(terrainHeight(10, 10, { ...options, seed: 43 }));
    expect(Math.abs(terrainHeight(10, 10, options))).toBeLessThan(2.2);
  });
  it("uses binary polar patches depending on noise, slope and height", () => {
    const masks = Array.from({ length: 100 }, (_, i) => iceMask("polar", i, i * 2, 0, 0, 42));
    expect(new Set(masks)).toEqual(new Set([0, 1]));
    expect(iceMask("polar", 0, 0, 0, 20, 42)).toBe(0);
    expect(iceMask("polar", 0, 0, 100, 0, 42)).toBe(1);
  });
  it("reads signed little-endian DEM meters and excludes it from the near field", () => {
    const buffer = new ArrayBuffer(280 * 280 * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < 280 * 280; i++) view.setInt16(i * 2, -2600 + i % 280, true);
    const dem = decodeJezeroDEM(buffer);
    expect(dem.metersPerPixel).toBe(289);
    expect(sampleDEM(dem, 289, 0) - sampleDEM(dem, 0, 0)).toBeCloseTo(1);
    const options = { biome: "jezero" as const, seed: 42 };
    expect(terrainHeight(799, 0, { ...options, dem })).toBe(terrainHeight(799, 0, options));
    expect(terrainHeight(3200, 0, { ...options, dem })).not.toBe(terrainHeight(3200, 0, options));
    expect(() => decodeJezeroDEM(new ArrayBuffer(10))).toThrow();
  });
  it("scatters MT-* rocks in 3 size tiers with radial density falloff within 150k budget", () => {
    const terrain = createTerrain({ biome: "jezero", seed: 42, lod: 0 });
    const rocks = createJezeroRockScatter({ seed: 42, lod: 0, exclusions: [{ x: 0, z: 0, radius: 10 }] });
    expect(rocks.children.length).toBe(4);
    expect(rocks.children.every(c => c instanceof InstancedMesh)).toBe(true);
    const total = triangleCount(terrain) + triangleCount(rocks);
    expect(total).toBeLessThanOrEqual(TERRAIN_LIMIT);

    // Verify radial density per m^2 drops away from the colony
    const mat = new Matrix4();
    const pos = new Vector3();
    let nearCount = 0;
    let farCount = 0;
    rocks.children.forEach(node => {
      const im = node as InstancedMesh;
      for (let i = 0; i < im.count; i++) {
        im.getMatrixAt(i, mat);
        pos.setFromMatrixPosition(mat);
        const r = Math.hypot(pos.x, pos.z);
        expect(r).toBeGreaterThanOrEqual(10);
        if (r >= 12 && r < 45) nearCount++;
        if (r >= 90 && r < 150) farCount++;
      }
    });
    const nearDensity = nearCount / (Math.PI * (45 * 45 - 12 * 12));
    const farDensity = farCount / (Math.PI * (150 * 150 - 90 * 90));
    expect(nearDensity).toBeGreaterThan(farDensity * 2.5);

    const lod2Terrain = createTerrain({ biome: "jezero", seed: 42, lod: 2 });
    const lod2Rocks = createJezeroRockScatter({ seed: 42, lod: 2 });
    expect(triangleCount(lod2Terrain) + triangleCount(lod2Rocks)).toBeLessThan(10000);
    disposeRockScatter(rocks);
    disposeRockScatter(lod2Rocks);
  });
});

describe("environment preset data", () => {
  it("lights the polar ground with cool ambient light without recoloring the visible horizon", () => {
    const polar = presets.find(preset => preset.id === "AMB-07")!;
    expect(polar.light.sky).toBe("ice");
    expect(polar.sky.horizon).toBe("skyHorizon");
  });
  it("defines all eight IDs, scientific day/dusk and unchanged solar-alert sky", () => {
    expect(presets.map(p => p.id)).toEqual(Array.from({ length: 8 }, (_, i) => `AMB-0${i + 1}`));
    expect(presets[1].sky).toEqual(presets[2].sky);
    expect(presets[3].sky.zenith).toBe("skyZenith");
    expect(presets[4].sky.halo).toBe("duskHalo");
    expect(presets[5].fog.far).toBeLessThan(presets[3].fog.far);
    expect(presets[7].sky.earth).toBe(1);
  });
  it("rejects missing, duplicate, invalid range and unknown palette data", () => {
    expect(() => loadPresets(null)).toThrow();
    for (const change of [
      (doc: typeof data) => { doc.presets.pop(); },
      (doc: typeof data) => { doc.presets[1].id = "AMB-01"; },
      (doc: typeof data) => { doc.presets[0].post.exposure = -1; },
      (doc: typeof data) => { doc.presets[0].fog.near = 100000; },
      (doc: typeof data) => { doc.presets[0].sky.horizon = "unknown"; },
    ]) {
      const doc = structuredClone(data); change(doc); expect(() => loadPresets(doc)).toThrow();
    }
  });
});
