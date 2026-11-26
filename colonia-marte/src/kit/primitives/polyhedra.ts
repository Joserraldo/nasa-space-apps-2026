import { BufferGeometry, Float32BufferAttribute, IcosahedronGeometry, Vector3 } from "three";
import { ConvexGeometry } from "three/addons/geometries/ConvexGeometry.js";
import { cachedGeometry } from "./cache";
import { finishGeometry } from "./normals";

/** Truncate every icosahedron edge at one third: 60 vertices, pentagons and hexagons. */
export function truncatedIcosa(radius = 0.7): BufferGeometry {
  if (!(radius > 0)) throw new Error("Invalid polyhedron radius");
  return cachedGeometry(["truncatedIcosa", radius], () => {
    const ico = new IcosahedronGeometry(radius, 0), pos = ico.getAttribute("position");
    const points: Vector3[] = [];
    for (let i = 0; i < pos.count; i += 3) {
      const corners = [0,1,2].map(j => new Vector3().fromBufferAttribute(pos, i+j));
      for (let j = 0; j < 3; j++) {
        points.push(corners[j].clone().lerp(corners[(j+1)%3], 1/3));
        points.push(corners[j].clone().lerp(corners[(j+1)%3], 2/3));
      }
    }
    const unique = [...new Map(points.map(p => [p.toArray().map(n => n.toFixed(6)).join(), p])).values()];
    ico.dispose();
    return finishGeometry(new ConvexGeometry(unique));
  });
}

/** Clip the geodesic at Y=0; no invisible bottom cap. */
export function geodesicHalf(radius = 0.8, detail = 1): BufferGeometry {
  if (!(radius > 0) || !Number.isInteger(detail) || detail < 0 || detail > 3) throw new Error("Invalid dome");
  return cachedGeometry(["geodesicHalf", radius, detail], () => {
    const ico = new IcosahedronGeometry(radius, detail), pos = ico.getAttribute("position");
    const positions: number[] = [], normals: number[] = [];
    for (let i = 0; i < pos.count; i += 3) {
      const polygon: Vector3[] = [];
      const triangle = [0,1,2].map(j => new Vector3().fromBufferAttribute(pos, i+j));
      for (let j=0; j<3; j++) {
        const a=triangle[j], b=triangle[(j+1)%3];
        if (a.y >= 0) polygon.push(a);
        if ((a.y < 0 && b.y > 0) || (a.y > 0 && b.y < 0)) polygon.push(a.clone().lerp(b, -a.y/(b.y-a.y)));
      }
      for (let j=1; j<polygon.length-1; j++) {
        const vertices = [polygon[0], polygon[j], polygon[j+1]];
        const normal = vertices[1].clone().sub(vertices[0]).cross(vertices[2].clone().sub(vertices[0])).normalize();
        for (const vertex of vertices) { positions.push(...vertex.toArray()); normals.push(...normal.toArray()); }
      }
    }
    ico.dispose();
    const geometry = new BufferGeometry();
    geometry.setAttribute("position",new Float32BufferAttribute(positions,3));
    geometry.setAttribute("normal",new Float32BufferAttribute(normals,3));
    return finishGeometry(geometry);
  });
}
