import { BufferGeometry, Group, InstancedMesh, Matrix4, Mesh, type Material, type Object3D } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { bakeVertexAO, type AOCache, type AOOptions } from "./bake-vertex-ao";

/** Merge each static material once; all materials occlude each other in one room-local BVH. */
export function bakeRoomAO(root: Object3D, options: AOOptions = {}, cache: AOCache = new Map()) {
  const start = performance.now();
  root.updateMatrixWorld(true);
  const inverse = root.matrixWorld.clone().invert();
  const buckets = new Map<Material, BufferGeometry[]>();
  root.traverseVisible(node => {
    if (!(node instanceof Mesh)) return;
    if (Array.isArray(node.material) || "isSkinnedMesh" in node) throw new Error("Expected static room meshes");
    const list = buckets.get(node.material) ?? [];
    const count = node instanceof InstancedMesh ? node.count : 1;
    for (let i = 0; i < count; i++) {
      const matrix = inverse.clone().multiply(node.matrixWorld);
      if (node instanceof InstancedMesh) {
        const instance = new Matrix4();
        node.getMatrixAt(i, instance);
        matrix.multiply(instance);
      }
      const geometry = node.geometry.clone().applyMatrix4(matrix);
      geometry.clearGroups();
      list.push(geometry);
    }
    buckets.set(node.material, list);
  });
  const merged = [...buckets].map(([material, parts]) => {
    const geometry = mergeGeometries(parts, false);
    parts.forEach(part => part.dispose());
    if (!geometry) throw new Error("Room attributes must match within each material");
    return { material, geometry };
  });
  if (!merged.length) throw new Error("Empty room");
  const colliders = merged.map(({ geometry }) => {
    const collider = new BufferGeometry();
    collider.setAttribute("position", geometry.getAttribute("position").clone());
    collider.setIndex(geometry.index?.clone() ?? null);
    return collider;
  });
  const occluder = mergeGeometries(colliders, false)!;
  const group = new Group();
  group.name = `${root.name}_ao`;
  group.position.copy(root.position); group.quaternion.copy(root.quaternion); group.scale.copy(root.scale);
  const results = merged.map(({ material, geometry }) => {
    const result = bakeVertexAO(geometry, options, cache, occluder);
    group.add(new Mesh(result.geometry, material));
    geometry.dispose();
    return { key: result.key, cacheHit: result.cacheHit, milliseconds: result.milliseconds };
  });
  colliders.forEach(geometry => geometry.dispose()); occluder.dispose();
  return { group, results, milliseconds: performance.now() - start };
}
