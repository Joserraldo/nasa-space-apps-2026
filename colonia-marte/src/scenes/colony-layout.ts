import { LOD, MathUtils, Mesh, type Object3D } from "three";
import type { DEM } from "../environment/dem";
import { terrainHeight, type Biome } from "../environment/terrain";
import { inventoryIds } from "../kit/inventory";
import { AIRLOCK_ENTRY_LODS } from "../kit/pieces/mars/airlock-entry";
import { buildColonyPaving, parseColonyPaving } from "../kit/pieces/mars/colony-street";
import { COLONY_BUILDING_LODS } from "../kit/pieces/mars/colony-building-details";
import { GREENHOUSE_LODS } from "../kit/pieces/mars/greenhouse";
import { LANDING_PAD_LODS } from "../kit/pieces/mars/landing-pad";
import { vehicleDetailLevels } from "../kit/pieces/mars/rover-truck";
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
  reservations: Pick<ColonyPlacementSpec, "id" | "at" | "rot">[];
  reservedAreas: { id: string; at: [number, number]; size: [number, number] }[];
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

  const slots = input.reservations ?? [];
  if (!Array.isArray(slots)) throw new Error("Invalid reserved slots");
  const reservations = slots.map(slot => {
    if (!isObj(slot) || typeof slot.id !== "string" || !inventoryIds.has(slot.id) || !isVec2(slot.at)) {
      throw new Error("Invalid reserved piece ID or coordinates");
    }
    if (slot.rot !== undefined && (typeof slot.rot !== "number" || !Number.isFinite(slot.rot))) {
      throw new Error("Invalid reserved piece rotation");
    }
    return { id: slot.id, at: slot.at, rot: slot.rot ?? 0 };
  });
  const areas = input.reservedAreas ?? [];
  if (!Array.isArray(areas)) throw new Error("Invalid reserved areas");
  const areaIds = new Set<string>();
  const reservedAreas = areas.map(area => {
    if (!isObj(area) || typeof area.id !== "string" || !/^[a-z][a-z0-9-]*$/.test(area.id) ||
      areaIds.has(area.id) || !isVec2(area.at) || !isVec2(area.size) || area.size.some(length => length <= 0)) {
      throw new Error("Invalid reserved area ID, coordinates, or dimensions");
    }
    areaIds.add(area.id);
    return { id: area.id, at: area.at, size: area.size };
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
    terrainSeed, placements, reservations, reservedAreas, views };
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
      const spec = parseColonyPaving(item.params ?? {});
      const angle = MathUtils.degToRad(item.rot ?? 0);
      const c = Math.cos(angle), s = Math.sin(angle);
      const paving = buildColonyPaving(spec, (x, z) => terrainHeight(cx + x * c + z * s, cz + z * c - x * s, terrainOpts));
      paving.position.set(cx, item.yOffset ?? 0, cz);
      paving.rotation.y = angle;
      colony.detailedTriangles += countColonyTriangles(paving);
      colony.add(paving);
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
    const isNewBuilding = ["MB-05", "MB-08", "MB-09"].includes(item.id);
    const hasCarbonLevels = ["MB-14", "MV-01", "MV-03", "MV-11", "NX-01"].includes(item.id);
    const detailLevels = item.id === "MI-07" ? LANDING_PAD_LODS : item.id === "NX-04" ? AIRLOCK_ENTRY_LODS
      : item.id === "MB-11" ? GREENHOUSE_LODS
      : isNewBuilding ? COLONY_BUILDING_LODS : hasCarbonLevels ? vehicleDetailLevels : null;
    if (detailLevels) {
      const lod = new LOD();
      lod.name = piece.name;
      lod.autoUpdate = false;
      lod.position.copy(piece.position);
      lod.rotation.copy(piece.rotation);
      piece.position.set(0, 0, 0);
      piece.rotation.set(0, 0, 0);
      lod.addLevel(piece, 0);
      const ranges = isNewBuilding ? [22, 38] : hasCarbonLevels ? [18, 37] : [62, 105];
      for (const [index, detail] of detailLevels.slice(1).entries()) {
        const simplified = registry.build(item.id,
          item.id === "NX-04" || hasCarbonLevels ? { ...item.params, detail } : { detail });
        simplified.visible = false;
        lod.addLevel(simplified, ranges[index], 0.12);
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
      node.castShadow = node.material !== materials.M_glass && node.parent?.name !== "MI-01 Paved colony platform";
      node.receiveShadow = true;
    }
  });
  return colony;
}
