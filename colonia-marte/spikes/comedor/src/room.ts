import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { build, type Params } from "./kit/registry";

type PieceRef = { id: string; params?: Params } | "skip" | null;

export interface RoomLayout {
  id: string;
  module: number;
  size: [number, number];
  walls: Record<"north" | "south" | "west" | "east", PieceRef[]>;
  floorAccents: [number, number][];
  ceiling: { id: string; params?: Params };
  pieces: { id: string; at: [number, number]; y?: number; rot?: number; params?: Params }[];
  lights: { at: [number, number, number]; intensity: number; distance: number; color?: string }[];
}

/** Builds a room from data. Every piece comes from the registry by inventory id. */
export function buildRoom(layout: RoomLayout): { group: THREE.Group; stats: { pieces: number } } {
  const group = new THREE.Group();
  group.name = `room:${layout.id}`;
  const M = layout.module;
  const [cols, rows] = layout.size;
  const W = cols * M;
  const D = rows * M;
  let pieces = 0;

  const accent = new Set(layout.floorAccents.map(([x, z]) => `${x},${z}`));
  for (let x = 0; x < cols; x++) {
    for (let z = 0; z < rows; z++) {
      const tile = build("ST-F01", { accent: accent.has(`${x},${z}`) });
      tile.position.set(x * M, 0, z * M);
      const ceil = build(layout.ceiling.id, layout.ceiling.params);
      ceil.position.set(x * M, 0, z * M);
      group.add(tile, ceil);
      pieces += 2;
    }
  }

  const place = (side: keyof RoomLayout["walls"], i: number, obj: THREE.Object3D) => {
    if (side === "north") { obj.position.set(i * M, 0, 0); }
    if (side === "south") { obj.position.set((i + 1) * M, 0, D); obj.rotation.y = Math.PI; }
    if (side === "west") { obj.position.set(0, 0, (i + 1) * M); obj.rotation.y = Math.PI / 2; }
    if (side === "east") { obj.position.set(W, 0, i * M); obj.rotation.y = -Math.PI / 2; }
  };
  for (const side of ["north", "south", "west", "east"] as const) {
    layout.walls[side].forEach((ref, i) => {
      if (!ref || ref === "skip") return;
      const obj = build(ref.id, ref.params);
      place(side, i, obj);
      group.add(obj);
      pieces++;
    });
  }

  for (const p of layout.pieces) {
    const obj = build(p.id, p.params);
    obj.position.x = p.at[0];
    obj.position.z = p.at[1];
    obj.position.y += p.y ?? 0;
    obj.rotation.y = THREE.MathUtils.degToRad(p.rot ?? 0);
    group.add(obj);
    pieces++;
  }

  for (const l of layout.lights) {
    const light = new THREE.PointLight(l.color ?? "#f2f7ff", l.intensity, l.distance, 2);
    light.position.set(...l.at);
    group.add(light);
  }
  return { group, stats: { pieces } };
}

/**
 * Merges every static, untextured mesh into one mesh per material.
 * Textured meshes (screens) stay as they are.
 */
export function mergeStatic(root: THREE.Object3D): THREE.Group {
  root.updateMatrixWorld(true);
  const byMat = new Map<THREE.Material, THREE.BufferGeometry[]>();
  const keep: THREE.Object3D[] = [];
  const lights: THREE.Light[] = [];
  root.traverse((o) => {
    if ((o as THREE.Light).isLight) { lights.push(o as THREE.Light); return; }
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const m = mesh.material as THREE.MeshStandardMaterial;
    if (m.map) { keep.push(mesh); return; }
    let g = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
    for (const name of Object.keys(g.attributes)) if (name !== "position" && name !== "normal") g.deleteAttribute(name);
    g = g.applyMatrix4(mesh.matrixWorld);
    const list = byMat.get(m) ?? [];
    list.push(g);
    byMat.set(m, list);
  });
  const out = new THREE.Group();
  out.name = `${root.name}:merged`;
  for (const [m, geos] of byMat) {
    const merged = mergeGeometries(geos, false);
    if (merged) out.add(new THREE.Mesh(merged, m));
  }
  for (const k of keep) {
    const clone = (k as THREE.Mesh).clone();
    k.matrixWorld.decompose(clone.position, clone.quaternion, clone.scale);
    out.add(clone);
  }
  for (const l of lights) {
    const clone = l.clone();
    l.getWorldPosition(clone.position);
    out.add(clone);
  }
  return out;
}
