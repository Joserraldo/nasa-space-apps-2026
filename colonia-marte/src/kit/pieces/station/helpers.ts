import {
  Box3, Float32BufferAttribute, Group, Mesh, PlaneGeometry, Shape,
  type BufferGeometry, type Material,
} from "three";
import { chamferBox, extrudeProfile } from "../../primitives";
import { cachedGeometry } from "../../primitives/cache";
import type { HiddenFace } from "../../primitives/normals";
import {
  mealScreenGeometry, screenGeometry, type MealScreenType, type ScreenType,
} from "../../../materials/screens";
import { materials } from "../../../materials/shared";
import { coloredGeometry } from "../../../materials/uv";

export type PaletteKey =
  | "white" | "offWhite" | "gray" | "darkGray" | "black" | "blue" | "cyan"
  | "ice" | "oxide" | "regolithShade" | "hull" | "yellow" | "skin" | "hair" | "red" | "teal"
  | "growLight" | "leaf" | "leafDark" | "warning" | "doorOpen" | "doorClosed";

const screenPlanes = new Map<string, BufferGeometry>();
const skyPlanes = new Map<string, BufferGeometry>();

/** Color geometry with atlas UVs and weld seam vertices via shared uv.ts cache. */
export function weldedColoredGeometry(source: BufferGeometry, color: PaletteKey): BufferGeometry {
  return coloredGeometry(source, color, { weld: true });
}

/** Deterministic 32-bit PRNG (Mulberry32) for seeded procedural variations. */
export function createRng(seed: number): () => number {
  let state = (Math.trunc(seed) ^ 0x9e3779b9) >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Validate that input is a plain parameter object with only allowed keys. */
export function parseRecord(input: unknown, allowed: readonly string[]): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Expected parameter object");
  }
  const record = input as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (!allowed.includes(key)) throw new Error(`Unknown parameter: ${key}`);
  }
  return record;
}

export function parseChoice<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: NoInfer<T>,
): T {
  if (value === undefined) return fallback;
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new Error(`Invalid option: ${String(value)}`);
  }
  return value as T;
}

export function parseSeed(value: unknown, fallback = 1): number {
  if (value === undefined) return fallback;
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new Error("Seed must be an integer");
  }
  return value;
}

/** Create a beveled palette-colored box positioned by its bottom-center [x, y, z]. */
export function boxAt(
  size: [number, number, number],
  color: PaletteKey,
  at: [number, number, number],
  chamfer = 0.02,
  omit: HiddenFace[] = [],
): Mesh {
  const [w, h, d] = size;
  const safeChamfer = Math.max(0.005, Math.min(chamfer, w * 0.3, h * 0.3, d * 0.3));
  const geometry = coloredGeometry(chamferBox(w, h, d, safeChamfer, omit), color);
  const mesh = new Mesh(geometry, materials.M_palette);
  mesh.position.set(at[0], at[1] + h / 2, at[2]);
  return mesh;
}

/** Create a beveled box positioned by its exact geometric center [x, y, z]. */
export function boxCenter(
  size: [number, number, number],
  color: PaletteKey,
  center: [number, number, number],
  chamfer = 0.02,
  omit: HiddenFace[] = [],
  material: Material = materials.M_palette,
): Mesh {
  const [w, h, d] = size;
  const safeChamfer = Math.max(0.005, Math.min(chamfer, w * 0.3, h * 0.3, d * 0.3));
  const base = chamferBox(w, h, d, safeChamfer, omit);
  const geometry = material === materials.M_palette ? coloredGeometry(base, color) : base;
  const mesh = new Mesh(geometry, material);
  mesh.position.set(center[0], center[1], center[2]);
  return mesh;
}

/** Extrude a 2D shape with bevel and apply a palette color. */
export function extrudedMesh(
  shape: Shape,
  depth: number,
  bevel: number,
  color: PaletteKey,
  center: [number, number, number],
): Mesh {
  const safeBevel = Math.max(0.005, Math.min(bevel, depth * 0.35));
  const geometry = coloredGeometry(extrudeProfile(shape, depth, safeBevel), color);
  const mesh = new Mesh(geometry, materials.M_palette);
  mesh.position.set(center[0], center[1], center[2]);
  return mesh;
}

/** Create a shared-atlas UI screen quad facing +Z. */
export function screenMesh(width: number, height: number, type: ScreenType): Mesh {
  const key = `ui:${width}:${height}:${type}`;
  let geometry = screenPlanes.get(key);
  if (!geometry) {
    const plane = new PlaneGeometry(width, height);
    geometry = screenGeometry(plane, type);
    plane.dispose();
    screenPlanes.set(key, geometry);
  }
  return new Mesh(geometry, materials.M_screen);
}

/** Create a shared-atlas food dispenser illustration quad facing +Z. */
export function mealScreenMesh(width: number, height: number, meal: MealScreenType): Mesh {
  const key = `meal:${width}:${height}:${meal}`;
  let geometry = screenPlanes.get(key);
  if (!geometry) {
    const plane = new PlaneGeometry(width, height);
    geometry = mealScreenGeometry(plane, meal);
    plane.dispose();
    screenPlanes.set(key, geometry);
  }
  return new Mesh(geometry, materials.M_screen);
}

/** Subdivided horizontal quad so vertex AO captures localized furniture contact shadows. */
export function segmentedFloorTop(
  size: [number, number],
  segments: [number, number],
  color: PaletteKey,
  at: [number, number, number],
): Mesh {
  const [w, d] = size;
  const [sx, sz] = segments;
  const base = cachedGeometry(["floorTop", w, d, sx, sz], () => {
    const plane = new PlaneGeometry(w, d, sx, sz);
    plane.rotateX(-Math.PI / 2);
    return plane;
  });
  const mesh = new Mesh(coloredGeometry(base, color, { weld: true }), materials.M_palette);
  mesh.position.set(at[0], at[1], at[2]);
  return mesh;
}

/** Create a cached sky/starfield viewport quad facing +Z. */
export function skyViewportMesh(width: number, height: number): Mesh {
  const key = `${width}:${height}`;
  let geometry = skyPlanes.get(key);
  if (!geometry) {
    geometry = cachedGeometry(["skyPlane", width, height], () => new PlaneGeometry(width, height));
    skyPlanes.set(key, geometry);
  }
  return new Mesh(geometry, materials.M_sky);
}

/** Scale RGB vertex colors (>1 triggers soft ACES/Bloom glow on M_palette without PointLight burn). */
export function boostVertexLuminance(
  source: BufferGeometry,
  rgb: [number, number, number],
): BufferGeometry {
  const geometry = source.clone();
  const count = geometry.getAttribute("position").count;
  const values = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    values[i * 3] = rgb[0];
    values[i * 3 + 1] = rgb[1];
    values[i * 3 + 2] = rgb[2];
  }
  geometry.setAttribute("color", new Float32BufferAttribute(values, 3));
  return geometry;
}

/** Center an object horizontally at X=0, Z=0 and place its base at exact Y=0. */
export function alignBaseCenter(group: Group): Group {
  const bounds = new Box3().setFromObject(group);
  const cx = (bounds.min.x + bounds.max.x) / 2;
  const cz = (bounds.min.z + bounds.max.z) / 2;
  const minY = bounds.min.y;
  for (const child of group.children) {
    child.position.x -= cx;
    child.position.y -= minY;
    child.position.z -= cz;
  }
  return group;
}
