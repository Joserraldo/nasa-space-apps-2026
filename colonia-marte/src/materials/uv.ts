import { Float32BufferAttribute, type BufferGeometry } from "three";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { paletteUV } from "./atlas";

const cache = new WeakMap<BufferGeometry, Map<string, BufferGeometry>>();

/** Clone shared source geometry once per color; all UVs land at the center of one atlas tile. */
export function coloredGeometry(
  source: BufferGeometry, color: string, options: { weld?: boolean } = {},
): BufferGeometry {
  let colors = cache.get(source);
  if (!colors) cache.set(source, colors = new Map());
  const key = `${color}:${options.weld === true}`;
  const existing = colors.get(key);
  if (existing) return existing;
  const uv = paletteUV(color);
  let geometry = source.clone();
  const values = new Float32Array(geometry.getAttribute("position").count * 2);
  for (let i = 0; i < values.length; i += 2) values.set(uv, i);
  geometry.setAttribute("uv", new Float32BufferAttribute(values, 2));
  geometry.setAttribute("color", new Float32BufferAttribute(
    new Float32Array(geometry.getAttribute("position").count * 3).fill(1), 3,
  ));
  if (options.weld) {
    const welded = mergeVertices(geometry, 1e-6);
    geometry.dispose();
    geometry = welded;
  }
  colors.set(key, geometry);
  return geometry;
}
