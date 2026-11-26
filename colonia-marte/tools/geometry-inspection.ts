import { Mesh, type Object3D, type BufferGeometry } from "three";
import { stableKey } from "../src/kit/primitives/cache";

export function triangleCount(root: Object3D): number {
  let count = 0;
  root.traverse(node => {
    if (node instanceof Mesh) count += (node.geometry.index?.count ?? node.geometry.getAttribute("position").count) / 3 *
      ("isInstancedMesh" in node ? (node as Mesh & { count:number }).count : 1);
  });
  return count;
}

/** Includes transforms, indices, groups and every attribute, while excluding random UUIDs. */
export function geometryHash(root: Object3D): string {
  const parts: unknown[] = [];
  root.updateMatrixWorld(true);
  root.traverse(node => {
    if (!(node instanceof Mesh)) return;
    parts.push(node.matrixWorld.toArray(), node.geometry.index ? Array.from(node.geometry.index.array) : null);
    const geometry = node.geometry as BufferGeometry;
    for (const [name, attr] of Object.entries(geometry.attributes).sort(([a],[b]) => a.localeCompare(b))) {
      parts.push(name, attr.itemSize, attr.normalized, Array.from(attr.array));
    }
    parts.push(node.geometry.groups);
  });
  const data = stableKey(parts);
  let hash = 2166136261;
  for (let i=0; i<data.length; i++) hash = Math.imul(hash ^ data.charCodeAt(i), 16777619);
  return (hash >>> 0).toString(16);
}
