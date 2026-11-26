import {
  Color, Euler, Group, InstancedMesh, Matrix4, Mesh, Quaternion, Vector3, type BufferGeometry,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { DEM } from "./dem";
import { terrainHeight } from "./terrain";
import { registerMarsRocks } from "../kit/pieces/mars/rocks";
import { createRng } from "../kit/pieces/station/helpers";
import { PieceRegistry } from "../kit/registry";
import { materials } from "../materials/shared";

export interface RockExclusionZone {
  x: number;
  z: number;
  radius: number;
}

export interface JezeroRockScatterOptions {
  seed: number;
  lod?: 0 | 1 | 2;
  dem?: DEM;
  exclusions?: readonly RockExclusionZone[];
}

let rockRegistry: PieceRegistry | undefined;

function getRockRegistry(): PieceRegistry {
  if (!rockRegistry) {
    rockRegistry = new PieceRegistry();
    registerMarsRocks(rockRegistry);
  }
  return rockRegistry;
}

function bakePieceGeometry(id: string, params: Record<string, unknown>): BufferGeometry {
  const root = getRockRegistry().build(id, params, true);
  root.updateMatrixWorld(true);
  const inv = root.matrixWorld.clone().invert();
  const parts: BufferGeometry[] = [];
  const localMat = new Matrix4();
  root.traverse(node => {
    if (!(node instanceof Mesh)) return;
    const g = node.geometry.index ? node.geometry.toNonIndexed() : node.geometry.clone();
    g.applyMatrix4(localMat.multiplyMatrices(inv, node.matrixWorld));
    parts.push(g);
  });
  const merged = mergeGeometries(parts, false);
  parts.forEach(p => p.dispose());
  if (!merged) throw new Error(`Failed to merge rock piece ${id}`);
  merged.computeBoundingSphere();
  return merged;
}

interface TierSpec {
  name: string;
  pieceId: string;
  params: Record<string, unknown>;
  counts: [number, number, number];
  rMin: number;
  rMax: number;
  falloffExp: number;
  scaleMin: number;
  scaleMax: number;
  sink: number;
  castShadow: boolean;
}

const TIERS: readonly TierSpec[] = [
  {
    name: "rocks_small_mt05",
    pieceId: "MT-T05",
    params: { biome: "jezero", formation: "single", seed: 1 },
    counts: [135, 42, 10],
    rMin: 3.6,
    rMax: 58,
    falloffExp: 1.60,
    scaleMin: 0.55,
    scaleMax: 1.25,
    sink: 0.06,
    castShadow: true,
  },
  {
    name: "rocks_medium_mt05",
    pieceId: "MT-T05",
    params: { biome: "jezero", formation: "cluster", seed: 3 },
    counts: [84, 26, 6],
    rMin: 5.8,
    rMax: 96,
    falloffExp: 1.48,
    scaleMin: 1.35,
    scaleMax: 2.85,
    sink: 0.12,
    castShadow: true,
  },
  {
    name: "rocks_mound_mt06",
    pieceId: "MT-T06",
    params: { biome: "jezero", seed: 4 },
    counts: [26, 9, 2],
    rMin: 9.5,
    rMax: 128,
    falloffExp: 1.35,
    scaleMin: 0.55,
    scaleMax: 1.30,
    sink: 0.20,
    castShadow: true,
  },
  {
    name: "rocks_large_mt04",
    pieceId: "MT-T04",
    params: { biome: "jezero", scale: "standard", seed: 2 },
    counts: [24, 8, 2],
    rMin: 13.5,
    rMax: 148,
    falloffExp: 1.28,
    scaleMin: 0.90,
    scaleMax: 1.72,
    sink: 0.22,
    castShadow: true,
  },
];

function isExcluded(x: number, z: number, margin: number, zones: readonly RockExclusionZone[]): boolean {
  for (const zone of zones) {
    const minDist = zone.radius + margin;
    const dx = x - zone.x;
    const dz = z - zone.z;
    if (dx * dx + dz * dz < minDist * minDist) return true;
  }
  return false;
}

/**
 * Deterministic 3-scale instanced MT-* rock field on Jezero with radial density falloff
 * away from the colony center.
 */
export function createJezeroRockScatter(options: JezeroRockScatterOptions): Group {
  const lod = options.lod ?? 0;
  const exclusions = options.exclusions ?? [];
  const group = new Group();
  group.name = "jezero_rock_scatter";

  const pos = new Vector3();
  const rot = new Euler();
  const quat = new Quaternion();
  const scl = new Vector3();
  const mat = new Matrix4();
  const tint = new Color();

  TIERS.forEach((tier, tierIdx) => {
    const targetCount = tier.counts[lod];
    const geometry = bakePieceGeometry(tier.pieceId, tier.params);
    const mesh = new InstancedMesh(geometry, materials.M_palette, targetCount);
    mesh.name = tier.name;
    mesh.castShadow = tier.castShadow;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;

    const rng = createRng(options.seed * 97 + tierIdx * 313 + 19);
    let placed = 0;
    let attempts = 0;
    const maxAttempts = targetCount * 16;

    while (placed < targetCount && attempts < maxAttempts) {
      attempts += 1;
      const u = rng();
      const angle = rng() * Math.PI * 2;
      const radius = tier.rMin + (tier.rMax - tier.rMin) * (u ** tier.falloffExp);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const baseScale = tier.scaleMin + (tier.scaleMax - tier.scaleMin) * rng();
      if (isExcluded(x, z, baseScale * 0.9, exclusions)) continue;

      const y = terrainHeight(x, z, { biome: "jezero", seed: options.seed, dem: options.dem }) - tier.sink * baseScale;
      pos.set(x, y, z);
      rot.set((rng() - 0.5) * 0.14, rng() * Math.PI * 2, (rng() - 0.5) * 0.14);
      quat.setFromEuler(rot);
      scl.set(
        baseScale * (0.88 + rng() * 0.26),
        baseScale * (0.82 + rng() * 0.32),
        baseScale * (0.88 + rng() * 0.26),
      );
      mat.compose(pos, quat, scl);
      mesh.setMatrixAt(placed, mat);

      // Muted earthy garnet-oxide rocks slightly darker than surrounding soil (sat <= 0.45, R > B >= G)
      const shadeMix = rng();
      if (shadeMix < 0.5) {
        const d = 0.80 + shadeMix * 0.22;
        tint.setRGB(d * 1.0, d * 0.96, d * 0.97);
      } else {
        const d = 0.92 + rng() * 0.16;
        tint.setRGB(d * 1.0, d * 0.97, d * 0.98);
      }
      mesh.setColorAt(placed, tint);
      placed += 1;
    }

    mesh.count = placed;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    group.add(mesh);
  });

  return group;
}

export function disposeRockScatter(group: Group): void {
  group.traverse(node => {
    if (node instanceof Mesh) node.geometry.dispose();
  });
}
