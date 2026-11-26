import type { BufferGeometry } from "three";

const geometries = new Map<string, BufferGeometry>();

/** Canonical JSON keys avoid depending on property insertion order. */
export function stableKey(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableKey).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.keys(value).sort().map(key =>
      `${JSON.stringify(key)}:${stableKey((value as Record<string, unknown>)[key])}`
    ).join(",")}}`;
  }
  if (typeof value === "number" && !Number.isFinite(value)) throw new Error("Non-finite parameter");
  return JSON.stringify(value) ?? "null";
}

export function cachedGeometry(key: unknown, create: () => BufferGeometry): BufferGeometry {
  const signature = stableKey(key);
  let geometry = geometries.get(signature);
  if (!geometry) {
    geometry = create();
    geometries.set(signature, geometry);
  }
  return geometry;
}

export function geometryCount(): number { return geometries.size; }
