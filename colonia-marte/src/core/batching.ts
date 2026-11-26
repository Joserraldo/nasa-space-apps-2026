import { Group, InstancedMesh, Matrix4, Mesh, type BufferGeometry, type Material, type Object3D } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

/** Approved-spike static merge, preserving UVs, normals, colors and root-local transforms. */
export function batchStatic(root: Object3D): Group {
  root.updateMatrixWorld(true);
  const inverse = root.matrixWorld.clone().invert();
  const repeated = new Map<BufferGeometry, Map<Material, Mesh[]>>();
  root.traverseVisible(node => {
    if (!(node instanceof Mesh)) return;
    if (Array.isArray(node.material)) throw new Error("Static batching expects single-material meshes");
    let materials = repeated.get(node.geometry);
    if (!materials) repeated.set(node.geometry, materials = new Map());
    const list = materials.get(node.material) ?? [];
    list.push(node); materials.set(node.material, list);
  });
  const out = new Group(), merged = new Map<Material, BufferGeometry[]>();
  out.name = `${root.name}_batched`;
  out.position.copy(root.position); out.quaternion.copy(root.quaternion); out.scale.copy(root.scale);
  const matrix = new Matrix4();
  for (const [geometry, materials] of repeated) for (const [material, meshes] of materials) {
    if (meshes.length > 3) {
      const instances = new InstancedMesh(geometry, material, meshes.length);
      meshes.forEach((mesh,i) => instances.setMatrixAt(i,matrix.multiplyMatrices(inverse,mesh.matrixWorld)));
      instances.instanceMatrix.needsUpdate = true;
      instances.computeBoundingSphere(); out.add(instances);
    } else {
      const list = merged.get(material) ?? [];
      for (const mesh of meshes) list.push(geometry.clone().applyMatrix4(matrix.multiplyMatrices(inverse,mesh.matrixWorld)));
      merged.set(material,list);
    }
  }
  for (const [material, geometries] of merged) {
    const geometry = mergeGeometries(geometries,false);
    if (!geometry) throw new Error("Incompatible static geometry attributes");
    out.add(new Mesh(geometry,material));
    geometries.forEach(g => g.dispose());
  }
  return out;
}
