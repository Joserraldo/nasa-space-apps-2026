import { ExtrudeGeometry, Vector3, type BufferGeometry, type Shape } from "three";
import { ConvexGeometry } from "three/addons/geometries/ConvexGeometry.js";
import { cachedGeometry } from "./cache";
import { finishGeometry, type HiddenFace } from "./normals";

/** Migrated from the approved spike: 24-point convex hull, one flat chamfer. */
export function chamferBox(w: number, h: number, d: number, c = 0.03, omit: HiddenFace[] = []): BufferGeometry {
  if (![w,h,d,c].every(Number.isFinite) || Math.min(w,h,d,c) <= 0 || c >= Math.min(w,h,d) / 2) {
    throw new Error("Invalid chamfer box dimensions");
  }
  return cachedGeometry(["chamferBox", w,h,d,c, [...omit].sort()], () => {
    const points: Vector3[] = [];
    for (const x of [-1,1]) for (const y of [-1,1]) for (const z of [-1,1]) {
      points.push(new Vector3(x*(w/2-c), y*h/2, z*(d/2-c)));
      points.push(new Vector3(x*w/2, y*(h/2-c), z*(d/2-c)));
      points.push(new Vector3(x*(w/2-c), y*(h/2-c), z*d/2));
    }
    return finishGeometry(new ConvexGeometry(points), true, omit);
  });
}

/** Content-based cache includes profile and holes, rather than a caller-provided name. */
export function extrudeProfile(shape: Shape, depth: number, bevel = 0.02): BufferGeometry {
  if (!(depth > 0 && bevel > 0 && bevel < depth / 2)) throw new Error("Invalid profile extrusion");
  const points = shape.extractPoints(1);
  return cachedGeometry(["extrudeProfile", points, depth, bevel], () => {
    const geometry = new ExtrudeGeometry(shape, {
      depth: depth - 2 * bevel, bevelEnabled: true, bevelThickness: bevel,
      bevelSize: bevel, bevelSegments: 1, curveSegments: 1, steps: 1,
    });
    geometry.translate(0,0,-depth/2 + bevel);
    return finishGeometry(geometry, true);
  });
}
