import { BufferGeometry, Float32BufferAttribute, Group, Int32BufferAttribute, Mesh } from "three";
import { materials } from "../materials/shared";
import { noise } from "./noise";
import { sampleDEM, type DEM } from "./dem";

export type Biome = "jezero" | "polar";
export const TERRAIN_LIMIT = 150000;
export const RINGS = [
  { inner: 0, outer: 80, steps: 48, source: "procedural" },
  { inner: 80, outer: 800, steps: 32, source: "procedural" },
  { inner: 800, outer: 24000, steps: 24, source: "far DEM" },
] as const;
export interface TerrainOptions { biome: Biome; seed: number; lod?: 0 | 1 | 2; dem?: DEM }
const blend = (value: number) => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); };

function jezeroNearStoneRelief(x: number, z: number, radius: number, seed: number): number {
  if (radius >= 54) return 0;
  const nearFade = 1 - blend((radius - 30) / 24);
  // Smooth, gentle organic undulations around the colony (INVENTARIO 0.3: smooth terrain,
  // zero stair-step Math.floor trenches that crease the polar mesh).
  const swell = (noise(x / 18, z / 18, seed + 5) - 0.5) * 0.52
    + (noise(x / 9.5, z / 9.5, seed + 9) - 0.5) * 0.18;
  const colonyPad = blend((radius - 13) / 10);
  return swell * nearFade * colonyPad;
}

export function terrainHeight(x: number, z: number, options: TerrainOptions): number {
  const { seed, dem, biome } = options;
  const radius = Math.hypot(x, z);
  const nearby = (noise(x / 32, z / 32, seed) - 0.5) * 1.2;
  const rolling = (noise(x / 160, z / 160, seed + 1) - 0.5) * 13 +
    (noise(x / 380, z / 380, seed + 2) - 0.5) * 3.5;
  const nearStone = biome === "jezero" ? jezeroNearStoneRelief(x, z, radius, seed) : 0;
  const flattened = nearStone + nearby * blend(radius / 14) + rolling * blend((radius - 14) / 42);
  if (radius <= 800 || biome === "polar" || !dem) return flattened;
  const elevation = sampleDEM(dem, x, z) - sampleDEM(dem, 0, 0);
  // Real DEM horizontal distance; 1.4x vertical exaggeration makes the rim legible at eye height.
  const distant = elevation * 1.4 - radius * radius / (2 * 3389500);
  return flattened * (1 - blend((radius - 800) / 1600)) + distant * blend((radius - 800) / 1600);
}

/** A categorical mask: hard threshold on noise, slope and height. Jezero cannot enter the ice path. */
export function iceMask(biome: Biome, x: number, z: number, height: number, slope: number, seed: number): 0 | 1 {
  if (biome === "jezero") return 0;
  return noise(x / 32, z / 32, seed + 13) + iceBias(height, slope) > 0.29 ? 1 : 0;
}

const iceBias = (height: number, slope: number) => height * 0.008 - slope * 0.35;

function ringGeometry(ring: typeof RINGS[number], options: TerrainOptions): BufferGeometry {
  const divisor = 2 ** (options.lod ?? 0), sectors = 256 / divisor;
  const steps = Math.max(4, Math.floor(ring.steps / divisor));
  const positions: number[] = [], normals: number[] = [], biases: number[] = [], indices: number[] = [];
  const add = (x: number, z: number) => {
    const y = terrainHeight(x, z, options);
    const epsilon = options.biome === "jezero" && ring.inner === 0 ? 0.14 : 0.25;
    const dx = (terrainHeight(x + epsilon, z, options) - terrainHeight(x - epsilon, z, options)) / (2 * epsilon);
    const dz = (terrainHeight(x, z + epsilon, options) - terrainHeight(x, z - epsilon, options)) / (2 * epsilon);
    const length = Math.hypot(dx, 1, dz);
    positions.push(x, y, z); normals.push(-dx / length, 1 / length, -dz / length);
    biases.push(options.biome === "polar" ? iceBias(y, Math.hypot(dx, dz)) : 0);
  };
  // A single center avoids degenerate triangles in the innermost fan.
  if (ring.inner === 0) add(0, 0);
  const offset = ring.inner === 0 ? 1 : 0;
  const first = ring.inner === 0 ? 1 : 0;
  for (let radial = first; radial <= steps; radial++) {
    const linearT = radial / steps;
    const t = options.biome === "jezero" && ring.inner === 0 ? linearT ** 1.28 : linearT;
    const radius = ring.inner + (ring.outer - ring.inner) * t;
    for (let sector = 0; sector < sectors; sector++) {
      const angle = sector / sectors * Math.PI * 2;
      add(Math.cos(angle) * radius, Math.sin(angle) * radius);
    }
  }
  if (offset) for (let s = 0; s < sectors; s++) indices.push(0, 1 + (s + 1) % sectors, 1 + s);
  const rows = steps + 1 - first;
  for (let row = 0; row < rows - 1; row++) for (let s = 0; s < sectors; s++) {
    const a = offset + row * sectors + s, b = offset + row * sectors + (s + 1) % sectors;
    indices.push(a, b, a + sectors, b, b + sectors, a + sectors);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new Float32BufferAttribute(normals, 3));
  geometry.setAttribute("iceBias", new Float32BufferAttribute(biases, 1));
  geometry.setAttribute("iceSeed", new Int32BufferAttribute(new Int32Array(biases.length).fill(options.seed + 13), 1));
  geometry.setIndex(indices); geometry.computeBoundingSphere();
  return geometry;
}

export function createTerrain(options: TerrainOptions): Group {
  if (!["jezero", "polar"].includes(options.biome) || !Number.isInteger(options.seed) ||
    ![0, 1, 2].includes(options.lod ?? 0)) throw new Error("Invalid terrain options");
  const group = new Group(); group.name = `terrain_${options.biome}`;
  RINGS.forEach((ring, index) => {
    const mesh = new Mesh(ringGeometry(ring, options), materials.M_terrain);
    mesh.name = `ring_${index}_${ring.source}`;
    mesh.receiveShadow = true; group.add(mesh);
  });
  group.userData.biome = options.biome;
  group.userData.chapter = options.biome === "polar" ? "C5" : "C2-C4";
  return group;
}
