import { BufferGeometry, Float32BufferAttribute, Vector3 } from "three";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

export type HiddenFace = "bottom" | "top" | "back" | "front" | "left" | "right";
const directions: Record<HiddenFace, Vector3> = {
  bottom: new Vector3(0, -1, 0), top: new Vector3(0, 1, 0),
  back: new Vector3(0, 0, -1), front: new Vector3(0, 0, 1),
  left: new Vector3(-1, 0, 0), right: new Vector3(1, 0, 0),
};

/** Keep broad faces flat; blend bevel normals toward their corner direction. */
export function finishGeometry(source: BufferGeometry, bevel = false, omit: HiddenFace[] = []): BufferGeometry {
  const raw = source.index ? source.toNonIndexed() : source;
  const pos = raw.getAttribute("position"), normals = raw.getAttribute("normal");
  const uv = raw.getAttribute("uv");
  const positions: number[] = [], resultNormals: number[] = [], uvs: number[] = [];
  const a = new Vector3(), b = new Vector3(), c = new Vector3();
  const face = new Vector3(), normal = new Vector3(), point = new Vector3();
  for (let i = 0; i < pos.count; i += 3) {
    a.fromBufferAttribute(pos, i); b.fromBufferAttribute(pos, i + 1); c.fromBufferAttribute(pos, i + 2);
    face.subVectors(b, a).cross(c.clone().sub(a)).normalize();
    if (omit.some(side => face.dot(directions[side]) > 0.9999)) continue;
    const isBevel = bevel && Math.max(Math.abs(face.x), Math.abs(face.y), Math.abs(face.z)) < 0.9999;
    for (let j = i; j < i + 3; j++) {
      point.fromBufferAttribute(pos, j);
      normal.copy(face);
      if (isBevel) normal.addScaledVector(point.clone().normalize(), 0.35).normalize();
      else if (!bevel && normals) normal.fromBufferAttribute(normals, j).normalize();
      positions.push(point.x, point.y, point.z);
      resultNormals.push(normal.x, normal.y, normal.z);
      uvs.push(uv ? uv.getX(j) : point.x, uv ? uv.getY(j) : point.y);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new Float32BufferAttribute(resultNormals, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setAttribute("color", new Float32BufferAttribute(new Float32Array(positions.length).fill(1), 3));
  const welded = mergeVertices(geometry, 1e-6);
  geometry.dispose();
  if (raw !== source) raw.dispose();
  source.dispose();
  welded.computeBoundingBox(); welded.computeBoundingSphere();
  return welded;
}
