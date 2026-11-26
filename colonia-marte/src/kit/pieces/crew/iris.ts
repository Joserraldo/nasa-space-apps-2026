import {
  CylinderGeometry, Group, Matrix4, Mesh, PlaneGeometry, Vector3, type BufferGeometry,
} from "three";
import { mergeGeometries, mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { chamferBox } from "../../primitives";
import { cachedGeometry } from "../../primitives/cache";
import { finishGeometry } from "../../primitives/normals";
import { coloredGeometry } from "../../../materials/uv";
import { materials } from "../../../materials/shared";
import { irisExpressions, type IrisExpression } from "../../../materials/iris-faces";
import { screenCellGeometry } from "../../../materials/screens";

export interface IrisParams { expression: IrisExpression }
export function parseIris(input: unknown): IrisParams {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Expected Iris parameters");
  const p = input as Record<string, unknown>;
  if (Object.keys(p).some(key => key !== "expression") ||
    !irisExpressions.includes((p.expression ?? "happy") as IrisExpression)) throw new Error("Invalid Iris expression");
  return { expression: (p.expression ?? "happy") as IrisExpression };
}

function block(w: number, h: number, d: number, color: string, x: number, y: number, z: number) {
  const geometry = coloredGeometry(chamferBox(w, h, d, Math.min(w, h, d) * 0.16), color);
  const mesh = new Mesh(geometry, materials.M_palette); mesh.position.set(x, y, z); return mesh;
}

function wheel(): Group {
  const pivot = new Group(); pivot.name = "wheel_axle"; pivot.userData.axis = [1, 0, 0];
  const geometry = cachedGeometry(["iris-wheel-v2"], () => {
    const tire = coloredGeometry(finishGeometry(
      new CylinderGeometry(0.23, 0.23, 0.18, 16).rotateZ(Math.PI / 2),
    ), "black", { weld: true });
    const parts = [tire.clone()];
    const tread = coloredGeometry(chamferBox(0.19, 0.045, 0.09, 0.008), "darkGray");
    const matrix = new Matrix4();
    for (let index = 0; index < 16; index++) {
      const angle = index / 16 * Math.PI * 2;
      matrix.makeRotationX(angle); matrix.setPosition(0, Math.cos(angle) * 0.235, Math.sin(angle) * 0.235);
      parts.push(tread.clone().applyMatrix4(matrix));
    }
    for (const side of [-1, 1]) {
      parts.push(coloredGeometry(chamferBox(0.025, 0.22, 0.22, 0.004), "white")
        .clone().translate(side * 0.102, 0, 0));
    }
    return mergeParts(parts);
  });
  pivot.add(new Mesh(geometry, materials.M_palette));
  return pivot;
}

function mergeParts(parts: BufferGeometry[]): BufferGeometry {
  const merged = mergeGeometries(parts, false)!;
  const welded = mergeVertices(merged, 1e-6);
  merged.dispose(); parts.forEach(part => part.dispose());
  return welded;
}

/** Only merge direct palette meshes; movable wheels and mast retain independent transforms. */
function mergeRigid(group: Group) {
  const children = group.children.filter((node): node is Mesh =>
    node instanceof Mesh && node.material === materials.M_palette);
  const geometry = mergeParts(children.map(mesh => {
    mesh.updateMatrix(); return mesh.geometry.clone().applyMatrix4(mesh.matrix);
  }));
  children.forEach(mesh => group.remove(mesh));
  group.add(new Mesh(geometry, materials.M_palette));
}

/** Rigid CH-09. Root is centered between axles; wheel origins lie on the X rotation axis. */
export function buildIris({ expression }: IrisParams): Group {
  const root = new Group(); root.name = `CH-09_${expression}`; root.userData.expression = expression;
  root.add(block(0.8, 0.28, 1.05, "white", 0, 0.39, 0));
  root.add(block(0.61, 0.08, 0.72, "blue", 0, 0.57, 0));
  root.add(block(0.58, 0.09, 0.12, "cyan", 0, 0.38, 0.49));
  mergeRigid(root);
  for (const x of [-0.46, 0.46]) for (const z of [-0.35, 0.35]) {
    const axle = wheel(); axle.position.set(x, 0.255, z); root.add(axle);
  }
  const mast = new Group(); mast.name = "mast"; mast.position.set(0, 0.61, 0);
  mast.add(block(0.1, 0.43, 0.12, "darkGray", 0, 0.215, 0));
  mast.add(block(0.86, 0.56, 0.18, "white", 0, 0.60, 0));
  mergeRigid(mast);
  const faceGeometry = cachedGeometry(["iris-face", expression], () => screenCellGeometry(
    new PlaneGeometry(0.74, 0.444), 8 + irisExpressions.indexOf(expression),
  ));
  const face = new Mesh(faceGeometry, materials.M_screen); face.name = `face_${expression}`;
  face.position.set(0, 0.60, 0.091); mast.add(face); root.add(mast);
  root.traverse(node => { if (node instanceof Mesh) { node.castShadow = true; node.receiveShadow = true; } });
  root.userData.forward = new Vector3(0, 0, 1).toArray();
  return root;
}
