import {
  Box3, Group, MathUtils, PointLight, Vector3,
  type Object3D, type PerspectiveCamera,
} from "three";
import { inventoryIds } from "../kit/inventory";
import type { PieceRegistry } from "../kit/registry";

interface SheetItem { object: Object3D; anchor: Vector3 }

/** Detach off-page objects: Box3 includes invisible descendants, so visibility alone is insufficient. */
export function arrangePage(group: Group, items: SheetItem[]): Box3 {
  group.clear(); items.forEach(item => group.add(item.object));
  arrangeSheet(items, 4);
  const bounds = new Box3().setFromObject(group);
  items.forEach(item => bounds.expandByPoint(item.anchor));
  if (bounds.isEmpty()) bounds.set(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));
  return bounds;
}

/** Reserve each rotated bounding box plus a label band; retain the objects' real scale. */
export function arrangeSheet(items: SheetItem[], columns: number): void {
  const sizes = items.map(({ object }) => new Box3().setFromObject(object).getSize(new Vector3()));
  const widths = Array.from({ length: columns }, (_, col) => Math.max(
    4.2, ...sizes.filter((_, index) => index % columns === col).map(size => size.x + 0.8),
  ));
  const rows = Math.ceil(items.length / columns);
  const heights = Array.from({ length: rows }, (_, row) => Math.max(
    ...sizes.slice(row * columns, (row + 1) * columns).map(size => size.y + 1.6),
  ));
  items.forEach(({ object, anchor }, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const bounds = new Box3().setFromObject(object);
    const center = bounds.getCenter(new Vector3());
    const x = widths.slice(0, col).reduce((sum, width) => sum + width, 0) + widths[col] / 2;
    const top = -heights.slice(0, row).reduce((sum, height) => sum + height, 0);
    object.position.add(new Vector3(x - center.x, top - bounds.max.y, -center.z));
    anchor.set(x, top - heights[row] + 0.8, 0);
  });
}

/** Front view prevents rows occluding one another. Fit at the nearest depth, with edge/label padding. */
export function fitSheetCamera(camera: PerspectiveCamera, bounds: Box3): void {
  const center = bounds.getCenter(new Vector3());
  const size = bounds.getSize(new Vector3());
  const tangent = Math.tan(MathUtils.degToRad(camera.fov / 2));
  const distance = Math.max((size.y + 1.6) / 2 / tangent, (size.x + 2) / 2 / tangent / camera.aspect);
  camera.position.set(center.x, center.y + 0.1, bounds.max.z + distance);
  camera.lookAt(center.x, center.y + 0.1, center.z);
  camera.updateMatrixWorld();
}

export type WallSide = "north" | "south" | "west" | "east";
export interface PieceRefSpec { id: string; params?: Record<string, unknown> }
export type WallSlotSpec = PieceRefSpec | "skip" | null;

export interface RoomCellOverride extends PieceRefSpec {
  cell: [number, number];
  span?: [number, number];
  rot?: number;
}

export interface RoomSlabLayer {
  default: PieceRefSpec;
  overrides?: RoomCellOverride[];
}

export interface RoomPiecePlacement extends PieceRefSpec {
  position: [number, number, number];
  rot?: number;
}

export interface RoomLightSpec {
  position: [number, number, number];
  color: string;
  intensity: number;
  distance: number;
  decay?: number;
}

export interface RoomCameraView {
  id: string;
  label: string;
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
}

export interface RoomLayout {
  id: string;
  name: string;
  module: 2 | 4;
  size: [number, number];
  clearHeight: number;
  environment: string;
  walls: Record<WallSide, WallSlotSpec[]>;
  floor: RoomSlabLayer;
  ceiling: RoomSlabLayer;
  pieces: RoomPiecePlacement[];
  lights: RoomLightSpec[];
  views: RoomCameraView[];
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const isVec3 = (v: unknown): v is [number, number, number] =>
  Array.isArray(v) && v.length === 3 && v.every(n => typeof n === "number" && Number.isFinite(n));
const isPair = (v: unknown): v is [number, number] =>
  Array.isArray(v) && v.length === 2 && v.every(n => typeof n === "number" && Number.isInteger(n));

function assertPieceRef(ref: unknown, registry?: PieceRegistry): PieceRefSpec {
  if (!isObj(ref) || typeof ref.id !== "string" || !ref.id.trim()) {
    throw new Error("Expected piece reference with non-empty id");
  }
  if (!inventoryIds.has(ref.id)) {
    throw new Error(`Invalid inventory piece ID: ${ref.id}`);
  }
  const params = ref.params === undefined ? undefined : (isObj(ref.params) ? ref.params : (() => {
    throw new Error(`Invalid params on piece ${ref.id}`);
  })());
  if (registry) {
    const entry = registry.entries().find(item => item.id === ref.id);
    if (!entry) throw new Error(`Unregistered piece ID: ${ref.id}`);
    entry.parse(params ?? {});
  }
  return { id: ref.id, ...(params ? { params } : {}) };
}

function parseSlabLayer(raw: unknown, cols: number, rows: number, registry?: PieceRegistry): RoomSlabLayer {
  if (!isObj(raw)) throw new Error("Expected slab layer object");
  const base = assertPieceRef(raw.default, registry);
  const occupied = new Set<string>();
  const overrides: RoomCellOverride[] = [];
  if (raw.overrides !== undefined) {
    if (!Array.isArray(raw.overrides)) throw new Error("Slab overrides must be an array");
    for (const item of raw.overrides) {
      const ref = assertPieceRef(item, registry);
      const rec = item as Record<string, unknown>;
      if (!isPair(rec.cell)) throw new Error(`Invalid slab override cell for ${ref.id}`);
      const span: [number, number] = rec.span === undefined ? [1, 1] : (isPair(rec.span) ? rec.span : (() => {
        throw new Error(`Invalid slab span for ${ref.id}`);
      })());
      const [cx, cz] = rec.cell;
      const [sx, sz] = span;
      if (cx < 0 || cz < 0 || sx < 1 || sz < 1 || cx + sx > cols || cz + sz > rows) {
        throw new Error(`Slab override ${ref.id} at [${cx},${cz}] exceeds room grid [${cols},${rows}]`);
      }
      for (let dx = 0; dx < sx; dx++) {
        for (let dz = 0; dz < sz; dz++) {
          const key = `${cx + dx},${cz + dz}`;
          if (occupied.has(key)) throw new Error(`Overlapping slab override at cell [${key}]`);
          occupied.add(key);
        }
      }
      const rot = rec.rot === undefined ? undefined : Number(rec.rot);
      if (rot !== undefined && !Number.isFinite(rot)) throw new Error(`Invalid rotation on ${ref.id}`);
      overrides.push({ ...ref, cell: [cx, cz], span, ...(rot !== undefined ? { rot } : {}) });
    }
  }
  return { default: base, overrides };
}

/** Validate a room layout JSON document against inventory IDs, grid bounds, and optional registry schemas. */
export function parseRoomLayout(input: unknown, registry?: PieceRegistry): RoomLayout {
  if (!isObj(input)) throw new Error("Room layout must be an object");
  if (typeof input.id !== "string" || !input.id.trim()) throw new Error("Room layout requires id");
  if (typeof input.name !== "string" || !input.name.trim()) throw new Error("Room layout requires name");
  if (input.module !== 2 && input.module !== 4) throw new Error("Room module must be 2 or 4");
  if (!isPair(input.size) || input.size[0] < 1 || input.size[1] < 1) throw new Error("Invalid room size");
  const [cols, rows] = input.size;
  const clearHeight = input.clearHeight === undefined ? 3 : Number(input.clearHeight);
  if (!Number.isFinite(clearHeight) || clearHeight <= 0) throw new Error("Invalid clearHeight");
  if (typeof input.environment !== "string" || !input.environment.trim()) {
    throw new Error("Room layout requires environment preset id");
  }
  if (!isObj(input.walls)) throw new Error("Room layout requires walls");

  const expectedLen: Record<WallSide, number> = { north: cols, south: cols, west: rows, east: rows };
  const walls = {} as Record<WallSide, WallSlotSpec[]>;
  for (const side of ["north", "south", "west", "east"] as const) {
    const slots = input.walls[side];
    if (!Array.isArray(slots) || slots.length !== expectedLen[side]) {
      throw new Error(`Wall side ${side} must have ${expectedLen[side]} slots`);
    }
    walls[side] = slots.map(slot => (slot === null || slot === "skip" ? slot : assertPieceRef(slot, registry)));
  }

  const floor = parseSlabLayer(input.floor, cols, rows, registry);
  const ceiling = parseSlabLayer(input.ceiling, cols, rows, registry);

  if (!Array.isArray(input.pieces)) throw new Error("Room pieces must be an array");
  const pieces: RoomPiecePlacement[] = input.pieces.map(item => {
    const ref = assertPieceRef(item, registry);
    const rec = item as Record<string, unknown>;
    if (!isVec3(rec.position)) throw new Error(`Invalid position on piece ${ref.id}`);
    const rot = rec.rot === undefined ? undefined : Number(rec.rot);
    if (rot !== undefined && !Number.isFinite(rot)) throw new Error(`Invalid rotation on piece ${ref.id}`);
    return { ...ref, position: rec.position, ...(rot !== undefined ? { rot } : {}) };
  });

  if (!Array.isArray(input.lights)) throw new Error("Room lights must be an array");
  const lights: RoomLightSpec[] = input.lights.map(item => {
    if (!isObj(item) || !isVec3(item.position) || typeof item.color !== "string" ||
      !/^#[\da-f]{6}$/i.test(item.color) || typeof item.intensity !== "number" ||
      typeof item.distance !== "number") {
      throw new Error("Invalid room light specification");
    }
    const decay = item.decay === undefined ? 2 : Number(item.decay);
    return { position: item.position, color: item.color, intensity: item.intensity, distance: item.distance, decay };
  });

  if (!Array.isArray(input.views) || input.views.length === 0) throw new Error("Room requires camera views");
  const views: RoomCameraView[] = input.views.map(item => {
    if (!isObj(item) || typeof item.id !== "string" || typeof item.label !== "string" ||
      !isVec3(item.position) || !isVec3(item.target) || typeof item.fov !== "number") {
      throw new Error("Invalid room camera view");
    }
    return { id: item.id, label: item.label, position: item.position, target: item.target, fov: item.fov };
  });

  return { id: input.id, name: input.name, module: input.module, size: [cols, rows], clearHeight,
    environment: input.environment, walls, floor, ceiling, pieces, lights, views };
}

/** Instantiate all static room pieces and point lights from a validated RoomLayout. */
export function buildRoomFromLayout(layout: RoomLayout, registry: PieceRegistry) {
  const staticGroup = new Group();
  staticGroup.name = `room_${layout.id}`;
  const lightsGroup = new Group();
  lightsGroup.name = `room_${layout.id}_lights`;
  const M = layout.module;
  const [cols, rows] = layout.size;
  const width = cols * M;
  const depth = rows * M;
  let pieceCount = 0;

  const buildSlabLayer = (layer: RoomSlabLayer, y: number) => {
    const covered = new Set<string>();
    for (const ov of layer.overrides ?? []) {
      const [cx, cz] = ov.cell;
      const [sx, sz] = ov.span ?? [1, 1];
      for (let dx = 0; dx < sx; dx++) {
        for (let dz = 0; dz < sz; dz++) covered.add(`${cx + dx},${cz + dz}`);
      }
      const obj = registry.build(ov.id, ov.params ?? {});
      obj.position.set(cx * M, y, cz * M);
      if (ov.rot) obj.rotation.y = MathUtils.degToRad(ov.rot);
      staticGroup.add(obj);
      pieceCount += 1;
    }
    for (let cx = 0; cx < cols; cx++) {
      for (let cz = 0; cz < rows; cz++) {
        if (covered.has(`${cx},${cz}`)) continue;
        const obj = registry.build(layer.default.id, layer.default.params ?? {});
        obj.position.set(cx * M, y, cz * M);
        staticGroup.add(obj);
        pieceCount += 1;
      }
    }
  };

  buildSlabLayer(layout.floor, -0.2);
  buildSlabLayer(layout.ceiling, layout.clearHeight);

  for (const side of ["north", "south", "west", "east"] as const) {
    layout.walls[side].forEach((slot, index) => {
      if (!slot || slot === "skip") return;
      const obj = registry.build(slot.id, slot.params ?? {});
      if (side === "north") obj.position.set(index * M, 0, 0);
      else if (side === "south") { obj.position.set((index + 1) * M, 0, depth); obj.rotation.y = Math.PI; }
      else if (side === "west") { obj.position.set(0, 0, (index + 1) * M); obj.rotation.y = Math.PI / 2; }
      else { obj.position.set(width, 0, index * M); obj.rotation.y = -Math.PI / 2; }
      staticGroup.add(obj);
      pieceCount += 1;
    });
  }

  for (const item of layout.pieces) {
    const obj = registry.build(item.id, item.params ?? {});
    obj.position.fromArray(item.position);
    if (item.rot) obj.rotation.y = MathUtils.degToRad(item.rot);
    staticGroup.add(obj);
    pieceCount += 1;
  }

  for (const spec of layout.lights) {
    const light = new PointLight(spec.color, spec.intensity, spec.distance, spec.decay ?? 2);
    light.position.fromArray(spec.position);
    lightsGroup.add(light);
  }

  return { staticGroup, lightsGroup, pieceCount };
}
