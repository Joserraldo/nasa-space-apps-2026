import {
  BufferGeometry, Float32BufferAttribute, Group, InstancedMesh, Matrix4, Mesh, Object3D, Vector3,
} from "three";
import { mergeGeometries, mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { bakeVertexAO, type AOCache } from "../../../core/bake-vertex-ao";
import { batchStatic } from "../../../core/batching";
import { materials } from "../../../materials/shared";
import { coloredGeometry } from "../../../materials/uv";
import { panelInset, pipeRun } from "../../primitives";
import type { Point3 } from "../../primitives/details";
import { boxCenter, type PaletteKey } from "../station/helpers";

export type TransitDetail = "near" | "middle" | "far";
const aoCache: AOCache = new Map();

export function repeatMesh<T extends Mesh>(prototype: T, name: string, placements: readonly Object3D[]) {
  const out = new InstancedMesh(prototype.geometry, prototype.material, placements.length);
  out.name = name;
  placements.forEach((placement, i) => {
    placement.updateMatrix();
    out.setMatrixAt(i, placement.matrix);
  });
  out.instanceMatrix.needsUpdate = true;
  out.computeBoundingBox();
  out.computeBoundingSphere();
  return out;
}

export function location(x: number, y: number, z: number, roll = 0) {
  const placement = new Object3D();
  placement.position.set(x, y, z);
  placement.rotation.x = roll;
  return placement;
}

export function beam(a: Point3, b: Point3, width: number, color: PaletteKey, bevel = width / 4) {
  const delta = new Vector3(...b).sub(new Vector3(...a));
  const mesh = boxCenter([width, delta.length(), width], color, [
    (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2,
  ], bevel);
  mesh.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), delta.normalize());
  return mesh;
}

export function pipe(points: Point3[], radius: number, segments: number, color: PaletteKey) {
  return new Mesh(coloredGeometry(pipeRun(points, radius, segments), color, { weld: true }), materials.M_palette);
}

export function windowFrame(x: number, radius: number, theta: number, width: number, height: number, taper = 0) {
  const origin = location(x, radius * Math.cos(theta), radius * Math.sin(theta));
  origin.rotation.set(theta - Math.PI / 2, taper, 0, "XYZ");
  origin.add(
    new Mesh(coloredGeometry(panelInset(width, height, 0.045, 0.045), "darkGray", { weld: true }), materials.M_palette),
    boxCenter([width - 0.08, height - 0.08, 0.044], "black", [0, 0, -0.003], 0.016),
    boxCenter([width - 0.14, height - 0.137, 0.012], "blue", [0, 0, 0.022], 0.004),
  );
  return origin;
}

export function fusedParts(name: string, parts: Group, bake = false, details: readonly InstancedMesh[] = []) {
  const batch = batchStatic(parts);
  batch.name = name;
  for (const child of batch.children) {
    if (!(child instanceof Mesh)) continue;
    const geometry = child.geometry;
    child.geometry = mergeVertices(geometry, 1e-6);
    geometry.dispose();
  }
  if (details.length) batch.add(...details);
  if (bake) bakeContacts(batch);
  return batch;
}

/** Include the repeated fittings/tiles as occluders without expanding their draw calls. */
function bakeContacts(assembly: Group) {
  const opaque = assembly.children.filter((part): part is Mesh => part instanceof Mesh && part.material === materials.M_palette);
  const chunks: BufferGeometry[] = [];
  const world = new Matrix4(), matrix = new Matrix4();
  for (const mesh of opaque) {
    mesh.updateMatrix();
    const count = mesh instanceof InstancedMesh ? mesh.count : 1;
    for (let i = 0; i < count; i++) {
      matrix.identity();
      if (mesh instanceof InstancedMesh) mesh.getMatrixAt(i, matrix);
      const geometry = new BufferGeometry();
      geometry.setAttribute("position", mesh.geometry.getAttribute("position").clone());
      geometry.setIndex(mesh.geometry.index!.clone());
      chunks.push(geometry.applyMatrix4(world.multiplyMatrices(mesh.matrix, matrix)));
    }
  }
  const collider = mergeGeometries(chunks)!;
  chunks.forEach(geometry => geometry.dispose());
  for (const mesh of opaque) {
    if (mesh instanceof InstancedMesh) continue;
    const original = mesh.geometry;
    mesh.geometry = bakeVertexAO(original, { samples: 12, radius: 0.72, strength: 0.77 }, aoCache, collider).geometry;
    original.dispose();
  }
  collider.dispose();
}

interface BlanketRow { start: number; end: number; radiusA: number; radiusB: number }

/** A curved inset: dark pressure-shell seams behind beveled, raised blanket tiles. */
export function blankets(rows: readonly BlanketRow[], sectors: number, color: PaletteKey, padded: boolean) {
  return rows.map(({ start, end, radiusA, radiusB }, row) => {
    const half = Math.PI / sectors;
    const vertices: number[] = [], triangles: number[] = [], shade: number[] = [];
    const angular = [-half + 0.016, -half + 0.044, 0, half - 0.044, half - 0.016];
    const axial = padded ? [0, 0.065, 0.5, 0.935, 1] : [0, 0.065, 0.935, 1];
    for (const [i, u] of axial.entries()) for (const [j, angle] of angular.entries()) {
      const bezel = i === 0 || i === axial.length - 1 || j === 0 || j === angular.length - 1;
      const raise = bezel ? 0.016 : padded && i === 2 ? 0.077 : 0.055;
      const radius = radiusA + (radiusB - radiusA) * u + raise;
      vertices.push(start + (end - start) * u, Math.cos(angle) * radius, Math.sin(angle) * radius);
      shade.push(bezel ? 0.72 : 1);
      if (i && j) {
        const n = i * angular.length + j;
        triangles.push(n - angular.length - 1, n - angular.length, n, n - angular.length - 1, n, n - 1);
      }
    }
    const raw = new BufferGeometry();
    raw.setAttribute("position", new Float32BufferAttribute(vertices, 3));
    raw.setIndex(triangles);
    raw.computeVertexNormals();
    const geometry = coloredGeometry(raw, color);
    const colors = geometry.getAttribute("color");
    shade.forEach((value, i) => colors.setXYZ(i, value, value, value));
    raw.dispose();
    return repeatMesh(new Mesh(geometry, materials.M_palette), `thermal-blanket-row-${row + 1}`,
      Array.from({ length: sectors }, (_, i) => location(0, 0, 0, i * half * 2 + (row % 2) * half)));
  });
}
