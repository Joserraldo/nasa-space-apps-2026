import type { PieceRegistry } from "../../registry";
import type { Group } from "three";
import { alignBaseCenter, extrudedMesh, parseChoice, parseRecord, type PaletteKey } from "../station/helpers";
import { polygonRing, polygonShape } from "../../primitives";

export const COLONY_BUILDING_LODS = ["near", "middle", "far"] as const;
export type ColonyBuildingDetail = typeof COLONY_BUILDING_LODS[number];

export function registerColonyBuilding(
  registry: PieceRegistry, id: string, build: (detail: ColonyBuildingDetail) => Group,
) {
  registry.register<{ detail: ColonyBuildingDetail }>(id, {
    parse: input => ({ detail: parseChoice(parseRecord(input, ["detail"]).detail, COLONY_BUILDING_LODS, "near") }),
    variants: { standard: { detail: "near" } },
    metadata: { category: "building", pivot: "base-center" },
    build: ({ detail }) => alignBaseCenter(build(detail)),
  });
}

export function horizontalBand(radius: number, height: number, y: number, sides: number, tone: PaletteKey, inner = 0) {
  const shape = inner > 0 ? polygonRing(radius, inner, sides) : polygonShape(radius, sides);
  const mesh = extrudedMesh(shape, height, Math.min(height * 0.24, 0.06), tone, [0, y, 0]);
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}
