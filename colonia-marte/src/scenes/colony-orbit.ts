import { InstancedMesh, Matrix4, Mesh, type BufferGeometry } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { PieceRegistry } from "../kit/registry";
import { materials } from "../materials/shared";

export function createOrbitalTransit(registry: PieceRegistry) {
  const far = registry.build("MV-10", { detail: "far" });
  far.updateMatrixWorld(true);
  const parts: BufferGeometry[] = [];
  const matrix = new Matrix4();
  far.traverse(node => {
    if (!(node instanceof Mesh) || node.material !== materials.M_palette) return;
    if (node instanceof InstancedMesh) {
      for (let i = 0; i < node.count; i++) {
        node.getMatrixAt(i, matrix);
        parts.push(node.geometry.clone().applyMatrix4(matrix.premultiply(node.matrixWorld)));
      }
      node.dispose();
    } else {
      parts.push(node.geometry.clone().applyMatrix4(node.matrixWorld));
    }
  });
  const geometry = mergeGeometries(parts);
  parts.forEach(part => part.dispose());
  if (!geometry) throw new Error("Cannot merge the orbital transit silhouette");
  const material = materials.M_palette.clone();
  material.fog = false;
  const ship = new Mesh(geometry, material);
  ship.name = "MV-10 in orbit";
  // An angular backdrop prop; its scene distance does not model an orbital altitude.
  ship.position.set(-1450, 290, -1300);
  ship.scale.setScalar(3.3);
  ship.rotation.set(0.14, 0.12, 0.21);
  return { ship, dispose() { geometry.dispose(); material.dispose(); } };
}
