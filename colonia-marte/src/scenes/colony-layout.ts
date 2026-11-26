import { Group, MathUtils, Mesh } from "three";
import { batchStatic } from "../core/batching";
import type { DEM } from "../environment/dem";
import { terrainHeight, type Biome } from "../environment/terrain";
import { inventoryIds } from "../kit/inventory";
import type { PieceRegistry } from "../kit/registry";
import { materials } from "../materials/shared";

export interface ColonyPlacementSpec {
  id: string;
  at: [number, number];
  yOffset?: number;
  rot?: number;
  params?: Record<string, unknown>;
}

export interface ColonyViewSpec {
  id: string;
  label: string;
  position: [number, number, number];
  eyeHeight?: number;
  target: [number, number, number];
  fov: number;
}

export interface ColonyLayout {
  id: string;
  name: string;
  biome: Biome;
  environment: string;
  terrainSeed: number;
  placements: ColonyPlacementSpec[];
  views: ColonyViewSpec[];
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const isVec2 = (v: unknown): v is [number, number] =>
  Array.isArray(v) && v.length === 2 && v.every(n => typeof n === "number" && Number.isFinite(n));
const isVec3 = (v: unknown): v is [number, number, number] =>
  Array.isArray(v) && v.length === 3 && v.every(n => typeof n === "number" && Number.isFinite(n));

export function parseColonyLayout(input: unknown, registry?: PieceRegistry): ColonyLayout {
  if (!isObj(input)) throw new Error("Colony layout must be an object");
  if (typeof input.id !== "string" || !input.id.trim()) throw new Error("Colony layout requires id");
  if (typeof input.name !== "string" || !input.name.trim()) throw new Error("Colony layout requires name");
  if (input.biome !== "jezero" && input.biome !== "polar") throw new Error("Invalid colony biome");
  if (typeof input.environment !== "string" || !input.environment.trim()) {
    throw new Error("Colony layout requires environment");
  }
  const terrainSeed = typeof input.terrainSeed === "number" && Number.isInteger(input.terrainSeed)
    ? input.terrainSeed
    : (() => { throw new Error("Invalid terrainSeed"); })();

  if (!Array.isArray(input.placements) || input.placements.length === 0) {
    throw new Error("Colony layout requires placements");
  }
  const placements: ColonyPlacementSpec[] = input.placements.map(raw => {
    if (!isObj(raw) || typeof raw.id !== "string" || !inventoryIds.has(raw.id)) {
      throw new Error(`Invalid inventory piece ID: ${String(isObj(raw) ? raw.id : raw)}`);
    }
    if (!isVec2(raw.at)) throw new Error(`Invalid [x, z] coordinates on ${raw.id}`);
    const params = raw.params === undefined ? undefined : (isObj(raw.params) ? raw.params : (() => {
      throw new Error(`Invalid params on ${raw.id}`);
    })());
    if (registry) {
      const entry = registry.entries().find(e => e.id === raw.id);
      if (!entry) throw new Error(`Unregistered piece ID: ${raw.id}`);
      entry.parse(params ?? {});
    }
    const yOffset = raw.yOffset === undefined ? 0 : Number(raw.yOffset);
    const rot = raw.rot === undefined ? 0 : Number(raw.rot);
    return { id: raw.id, at: raw.at, yOffset, rot, ...(params ? { params } : {}) };
  });

  if (!Array.isArray(input.views) || input.views.length === 0) throw new Error("Colony layout requires views");
  const views: ColonyViewSpec[] = input.views.map(raw => {
    if (!isObj(raw) || typeof raw.id !== "string" || typeof raw.label !== "string" ||
      !isVec3(raw.position) || !isVec3(raw.target) || typeof raw.fov !== "number") {
      throw new Error("Invalid colony camera view");
    }
    const eyeHeight = raw.eyeHeight === undefined ? undefined : Number(raw.eyeHeight);
    return {
      id: raw.id, label: raw.label, position: raw.position, target: raw.target, fov: raw.fov,
      ...(eyeHeight !== undefined ? { eyeHeight } : {}),
    };
  });

  return { id: input.id, name: input.name, biome: input.biome, environment: input.environment,
    terrainSeed, placements, views };
}

export function buildColonyGroup(layout: ColonyLayout, registry: PieceRegistry, dem?: DEM): Group {
  const raw = new Group();
  raw.name = `colony_${layout.id}`;
  const terrainOpts = { biome: layout.biome, seed: layout.terrainSeed, dem };
  for (const item of layout.placements) {
    const piece = registry.build(item.id, item.params ?? {});
    const groundY = terrainHeight(item.at[0], item.at[1], terrainOpts);
    piece.position.set(item.at[0], groundY + (item.yOffset ?? 0), item.at[1]);
    if (item.rot) piece.rotation.y = MathUtils.degToRad(item.rot);
    raw.add(piece);
  }
  const batched = batchStatic(raw);
  batched.traverse(node => {
    if (node instanceof Mesh) {
      node.castShadow = node.material !== materials.M_glass;
      node.receiveShadow = true;
    }
  });
  return batched;
}
