import { Box3, Mesh, Vector3, type BufferGeometry, type Object3D } from "three";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { inventoryIds } from "../src/kit/inventory";
import { triangleBudgets, type PieceMetadata } from "../src/kit/types";
import type { PieceRegistry } from "../src/kit/registry";
import { geometryHash, triangleCount } from "./geometry-inspection";
import { sharedMaterials } from "../src/materials/shared";

export type Check = "triangles" | "duplicates" | "degenerates" | "materials" | "grid" | "pivot"
  | "determinism" | "registry" | "index" | "normals" | "color";
export interface Issue { check: Check; message: string }
const tolerance = 0.001;

export function inspectGeometry(geometry: BufferGeometry): Issue[] {
  const issues: Issue[] = [];
  const positions = geometry.getAttribute("position");
  const normals = geometry.getAttribute("normal");
  const index = geometry.index;
  if (!positions || !index || index.count % 3 || Array.from(index.array).some(i => i >= positions.count)) {
    return [{ check: "index", message: "Expected indexed triangles with valid vertex references" }];
  }
  if (!Array.from(positions.array).every(Number.isFinite)) {
    issues.push({ check: "degenerates", message: "Non-finite positions" });
  }
  const welded = mergeVertices(geometry, 1e-6);
  if (welded.getAttribute("position").count !== positions.count) {
    issues.push({ check: "duplicates", message: "Duplicate vertex attributes" });
  }
  welded.dispose();
  const a = new Vector3();
  const b = new Vector3();
  const c = new Vector3();
  for (let i = 0; i < index.count; i += 3) {
    a.fromBufferAttribute(positions, index.getX(i));
    b.fromBufferAttribute(positions, index.getX(i + 1));
    c.fromBufferAttribute(positions, index.getX(i + 2));
    const area = b.sub(a).cross(c.sub(a)).length() / 2;
    if (!Number.isFinite(area) || area < 1e-6) {
      issues.push({ check: "degenerates", message: `Triangle ${i / 3} has area ${area}` });
      break;
    }
  }
  const validNormals = normals && normals.count === positions.count && Array.from(
    { length: positions.count }, (_, i) => new Vector3().fromBufferAttribute(normals, i).length(),
  ).every(length => Number.isFinite(length) && Math.abs(length - 1) <= 0.001);
  if (!validNormals) issues.push({ check: "normals", message: "Expected finite unit normals" });
  return issues;
}

export function validatePiece(id: string, metadata: PieceMetadata, build: () => Object3D) {
  const root = build();
  const issues: Issue[] = [];
  const triangles = triangleCount(root);
  const range = triangleBudgets[metadata.category];
  if (triangles < range[0] || triangles > range[1]) {
    issues.push({ check: "triangles", message: `${triangles} outside ${range.join("..")}` });
  }
  root.traverse(node => {
    if (!(node instanceof Mesh)) return;
    issues.push(...inspectGeometry(node.geometry));
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    if (materials.some(material => "vertexColors" in material && material.vertexColors)) {
      const color = node.geometry.getAttribute("color");
      const count = node.geometry.getAttribute("position")?.count;
      if (!color || color.itemSize !== 3 || color.count !== count ||
        !Array.from(color.array).every(Number.isFinite)) {
        issues.push({ check: "color", message: "Vertex-colored material requires finite RGB per vertex" });
      }
    }
    if (materials.some(material => !sharedMaterials.has(material))) {
      issues.push({ check: "materials", message: "Material outside shared palette providers" });
    }
  });
  const bounds = new Box3().setFromObject(root);
  const size = bounds.getSize(new Vector3());
  const offset = new Vector3(...(metadata.pivotOffset ?? [0, 0, 0]));
  const center = bounds.getCenter(new Vector3()).sub(offset);
  const base = bounds.min.clone().sub(offset);
  const finite = [...bounds.min.toArray(), ...bounds.max.toArray()].every(Number.isFinite);
  let pivotOK = finite;
  const placement = metadata.placement ?? "cell";
  if (metadata.category === "architecture" && placement === "wall-line") {
    pivotOK &&= Math.abs(base.x) < tolerance && Math.abs(base.y) < tolerance && Math.abs(center.z) < tolerance;
  } else if (metadata.category === "architecture" && placement === "point") {
    pivotOK &&= Math.abs(center.x) < tolerance && Math.abs(center.z) < tolerance && Math.abs(base.y) < tolerance;
  } else if (metadata.pivot === "base-center" || metadata.pivot === "axle-center") {
    pivotOK &&= Math.abs(center.x) < tolerance && Math.abs(center.z) < tolerance &&
      (metadata.pivot === "axle-center" || Math.abs(base.y) < tolerance);
  } else if (metadata.pivot === "module-corner") {
    pivotOK &&= base.toArray().every(n => Math.abs(n) < tolerance);
  } else {
    pivotOK &&= Math.min(Math.abs(base.x), Math.abs(bounds.max.x - offset.x)) < tolerance
      && Math.abs(base.y) < tolerance;
  }
  if (!pivotOK) issues.push({ check: "pivot", message: "Bounding box does not match declared pivot" });
  if (metadata.category === "architecture") {
    const grid = metadata.grid;
    const multiple = (n: number) => n > 0 && Math.abs(n / 2 - Math.round(n / 2)) < tolerance / 2;
    const envelope = placement === "point" || (placement === "wall-line"
      ? multiple(size.x) && size.z >= 0.1 - tolerance && size.z <= 0.5 + tolerance
      : placement === "cell" && multiple(size.x) && multiple(size.z));
    const valid = grid && grid.size.every((n, i) => n > 0 && Math.abs(n - size.getComponent(i)) <= tolerance)
      && [2, 4].includes(grid.module) && envelope
      && [0.2, 0.6, 3, 3.2, 3.8].some(height => Math.abs(grid.size[1] - height) < tolerance);
    if (!valid) issues.push({ check: "grid", message: "Architecture must match a declared grid envelope" });
  }
  if (geometryHash(root) !== geometryHash(build())) {
    issues.push({ check: "determinism", message: "Fresh builds differ" });
  }
  if (!inventoryIds.has(id)) issues.push({ check: "registry", message: `Unknown inventory id: ${id}` });
  return { triangles, issues };
}

export function validateRegistry(registry: PieceRegistry) {
  return registry.entries().flatMap(entry => Object.entries(entry.variants).map(([variant, params]) => ({
    id: entry.id, variant, ...validatePiece(entry.id, entry.metadata, () => registry.build(entry.id, params, true)),
  })));
}
