import { LOD, MathUtils, Mesh, type Object3D } from "three";
import type { DEM } from "../environment/dem";
import { terrainHeight, type Biome } from "../environment/terrain";
import { inventoryIds } from "../kit/inventory";
import { AIRLOCK_ENTRY_LODS } from "../kit/pieces/mars/airlock-entry";
import { buildStreet, parseStreet } from "../kit/pieces/mars/colony-street";
import { GREENHOUSE_LODS } from "../kit/pieces/mars/greenhouse";
import { LANDING_PAD_LODS } from "../kit/pieces/mars/landing-pad";
import type { PieceRegistry } from "../kit/registry";
import { materials } from "../materials/shared";
import { ColonyGroup, countColonyTriangles, fuseColonyInfrastructure } from "./colony-batches";

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

export function buildColonyGroup(layout: ColonyLayout, registry: PieceRegistry, dem?: DEM) {
  const colony = new ColonyGroup();
  colony.name = `colony_${layout.id}`;
  const infrastructure: Object3D[] = [];
  const buildings = new Map<string, Object3D[]>();
  const terrainOpts = { biome: layout.biome, seed: layout.terrainSeed, dem };
  for (const item of layout.placements) {
    const [cx, cz] = item.at;
    if (item.id === "MI-01") {
      const street = buildStreet(parseStreet(item.params ?? {}), (x, z) => terrainHeight(cx + x, cz + z, terrainOpts));
      street.position.set(cx, item.yOffset ?? 0, cz);
      colony.detailedTriangles += countColonyTriangles(street);
      colony.add(street);
      continue;
    }
    const piece = registry.build(item.id, item.params ?? {});
    colony.detailedTriangles += countColonyTriangles(piece);
    let groundY = terrainHeight(cx, cz, terrainOpts);
    if (item.id.startsWith("MT-")) {
      const footR = item.id === "MT-T06" ? 1.9 : item.id === "MT-T04" ? 1.0 : 0.7;
      groundY = Math.min(
        groundY,
        terrainHeight(cx + footR, cz, terrainOpts),
        terrainHeight(cx - footR, cz, terrainOpts),
        terrainHeight(cx, cz + footR, terrainOpts),
        terrainHeight(cx, cz - footR, terrainOpts),
      );
    }
    piece.position.set(cx, groundY + (item.yOffset ?? 0), cz);
    if (item.rot) piece.rotation.y = MathUtils.degToRad(item.rot);
    const detailLevels = item.id === "MI-07" ? LANDING_PAD_LODS : item.id === "NX-04" ? AIRLOCK_ENTRY_LODS
      : item.id === "MB-11" ? GREENHOUSE_LODS : null;
    if (detailLevels) {
      const lod = new LOD();
      lod.name = piece.name;
      lod.autoUpdate = false;
      lod.position.copy(piece.position);
      lod.rotation.copy(piece.rotation);
      piece.position.set(0, 0, 0);
      piece.rotation.set(0, 0, 0);
      lod.addLevel(piece, 0);
      for (const [index, detail] of detailLevels.slice(1).entries()) {
        const simplified = registry.build(item.id, { detail });
        simplified.visible = false;
        lod.addLevel(simplified, index === 0 ? 62 : 105, 0.12);
      }
      colony.addLOD(lod);
    } else if (item.id.startsWith("MB-") || item.id.startsWith("MV-")) {
      const repeated = buildings.get(item.id) ?? [];
      repeated.push(piece);
      buildings.set(item.id, repeated);
    } else infrastructure.push(piece);
  }
  for (const pieces of buildings.values()) {
    if (pieces.length > 3) colony.addBuildings(pieces);
    else for (const piece of pieces) colony.addBuildings([piece]);
  }
  colony.add(fuseColonyInfrastructure(infrastructure));
  colony.traverse(node => {
    if (node instanceof Mesh) {
      node.castShadow = node.material !== materials.M_glass;
      node.receiveShadow = true;
    }
  });
  return colony;
}
