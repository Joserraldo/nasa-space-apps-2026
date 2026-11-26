import {
  BufferGeometry, DoubleSide, Float32BufferAttribute, Ray, Vector3,
} from "three";
import { MeshBVH } from "three-mesh-bvh";

export interface AOOptions {
  samples?: number;
  radius?: number;
  bias?: number;
  strength?: number;
  seed?: number;
}
export interface AOEntry { key: string; visibility: number[] }
export type AOCache = Map<string, AOEntry>;
const VERSION = "vertex-ao-1";

function settings(input: AOOptions) {
  const options = { samples: 48, radius: 1.25, bias: 0.002, strength: 0.85, seed: 1, ...input };
  if (!Number.isInteger(options.samples) || options.samples < 1 || options.samples > 4096 ||
    !Number.isInteger(options.seed) || ![options.radius, options.bias, options.strength].every(Number.isFinite) ||
    options.radius <= options.bias || options.bias <= 0 || options.strength < 0 || options.strength > 1) {
    throw new Error("Invalid AO settings");
  }
  return options;
}

/** Two independent content hashes include vertex order, normals, indices and bake settings. */
export function aoCacheKey(surface: BufferGeometry, occluder: BufferGeometry, input: AOOptions = {}): string {
  let a = 2166136261, b = 5381;
  const add = (text: string) => {
    for (let i = 0; i < text.length; i++) {
      a = Math.imul(a ^ text.charCodeAt(i), 16777619);
      b = Math.imul(b, 33) ^ text.charCodeAt(i);
    }
  };
  add(JSON.stringify([VERSION, settings(input)]));
  for (const geometry of [surface, occluder]) {
    for (const name of ["position", "normal"]) {
      const attribute = geometry.getAttribute(name);
      add(JSON.stringify(attribute ? Array.from(attribute.array) : null));
    }
    add(JSON.stringify(geometry.index ? Array.from(geometry.index.array) : null));
  }
  return `${VERSION}-${(a >>> 0).toString(16)}-${(b >>> 0).toString(16)}`;
}

/** JSON can be stored per room on disk or in localStorage. Cache entries never own geometry. */
export function serializeAOCache(cache: AOCache): string {
  return JSON.stringify({ version: VERSION, entries: [...cache.values()] });
}

export function restoreAOCache(json: string): AOCache {
  const data = JSON.parse(json);
  if (data.version !== VERSION || !Array.isArray(data.entries)) throw new Error("Invalid AO cache");
  const cache: AOCache = new Map();
  for (const entry of data.entries) {
    if (typeof entry.key !== "string" || !Array.isArray(entry.visibility) ||
      !entry.visibility.every((n: unknown) => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 1)) {
      throw new Error("Invalid AO cache entry");
    }
    cache.set(entry.key, { key: entry.key, visibility: [...entry.visibility] });
  }
  return cache;
}

/** Bake in room-local meters. Clone input; preserve atlas UVs and multiply any original vertex colors. */
export function bakeVertexAO(
  surface: BufferGeometry, input: AOOptions = {}, cache: AOCache = new Map(), occluder = surface,
) {
  const start = performance.now();
  const options = settings(input);
  const position = surface.getAttribute("position"), normal = surface.getAttribute("normal");
  if (!position || !normal || position.count !== normal.count) throw new Error("AO requires positions and normals");
  const key = aoCacheKey(surface, occluder, options);
  let entry = cache.get(key);
  const cacheHit = !!entry && entry.visibility.length === position.count;
  if (!cacheHit) {
    // BVH may reorder the index buffer, so build it on an independent clone.
    const collider = occluder.clone();
    collider.clearGroups();
    const tree = new MeshBVH(collider);
    const visibility: number[] = [];
    const n = new Vector3(), tangent = new Vector3(), bitangent = new Vector3();
    const point = new Vector3(), direction = new Vector3(), ray = new Ray();
    const rotation = ((options.seed >>> 0) * 0.618033988749895 % 1) * Math.PI * 2;
    for (let vertex = 0; vertex < position.count; vertex++) {
      n.fromBufferAttribute(normal, vertex).normalize();
      if (n.lengthSq() < 0.9) throw new Error("AO requires nonzero normals");
      tangent.set(Math.abs(n.y) < 0.99 ? 0 : 1, Math.abs(n.y) < 0.99 ? 1 : 0, 0).cross(n).normalize();
      bitangent.crossVectors(n, tangent);
      point.fromBufferAttribute(position, vertex).addScaledVector(n, options.bias);
      let blocked = 0;
      for (let sample = 0; sample < options.samples; sample++) {
        // Cosine-weighted hemisphere with a deterministic golden-angle sequence.
        const r = Math.sqrt((sample + 0.5) / options.samples);
        const angle = sample * 2.399963229728653 + rotation;
        direction.copy(tangent).multiplyScalar(r * Math.cos(angle))
          .addScaledVector(bitangent, r * Math.sin(angle)).addScaledVector(n, Math.sqrt(1 - r * r));
        ray.set(point, direction);
        if (tree.raycastFirst(ray, DoubleSide, options.bias, options.radius)) blocked++;
      }
      visibility.push(1 - options.strength * blocked / options.samples);
    }
    collider.dispose();
    entry = { key, visibility };
    cache.set(key, entry);
  }
  const geometry = surface.clone();
  const original = surface.getAttribute("color");
  const colors = new Float32Array(position.count * 3);
  entry!.visibility.forEach((value, i) => {
    colors[i * 3] = value * (original?.getX(i) ?? 1);
    colors[i * 3 + 1] = value * (original?.getY(i) ?? 1);
    colors[i * 3 + 2] = value * (original?.getZ(i) ?? 1);
  });
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  return { geometry, key, cacheHit, milliseconds: performance.now() - start };
}
