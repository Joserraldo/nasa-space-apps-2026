import * as THREE from "three";

export type Params = Record<string, unknown>;
export type PieceBuilder = (params: Params) => THREE.Object3D;

/** IDs this spike is allowed to register (subset of docs/INVENTARIO.md). */
const INVENTORY_IDS = new Set([
  "ST-F01", "ST-W01", "ST-W02", "ST-C01", "ST-D01", "ST-R01", "ST-R02", "ST-R04",
  "DN-01", "DN-02", "DN-04", "DN-06", "DN-08", "DN-09", "PR-01", "PR-02",
]);

const builders = new Map<string, PieceBuilder>();

export function register(id: string, build: PieceBuilder): void {
  if (!INVENTORY_IDS.has(id)) throw new Error(`Unknown inventory id: ${id}`);
  if (builders.has(id)) throw new Error(`Duplicate piece id: ${id}`);
  builders.set(id, build);
}

export function build(id: string, params: Params = {}): THREE.Object3D {
  const b = builders.get(id);
  if (!b) throw new Error(`Piece not registered: ${id}`);
  const obj = b(params);
  obj.name = id;
  return obj;
}

export function registeredIds(): string[] {
  return [...builders.keys()];
}
