import * as THREE from "three";
import { ConvexGeometry } from "three/examples/jsm/geometries/ConvexGeometry.js";

const cache = new Map<string, THREE.BufferGeometry>();

function cached(key: string, make: () => THREE.BufferGeometry): THREE.BufferGeometry {
  let g = cache.get(key);
  if (!g) {
    g = make();
    cache.set(key, g);
  }
  return g;
}

/**
 * Box with a flat 45-degree chamfer on every edge (one bevel segment).
 * Built as the convex hull of 24 points, so every face, including the chamfer,
 * is flat-shaded: crisp low-poly bevels that catch the light.
 * Centered on the origin.
 */
export function chamferBox(w: number, h: number, d: number, c = 0.03): THREE.BufferGeometry {
  const cc = Math.min(c, w / 2.01, h / 2.01, d / 2.01);
  return cached(`cb:${w}:${h}:${d}:${cc}`, () => {
    const pts: THREE.Vector3[] = [];
    const hx = w / 2, hy = h / 2, hz = d / 2;
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
      pts.push(new THREE.Vector3(sx * (hx - cc), sy * hy, sz * (hz - cc)));
      pts.push(new THREE.Vector3(sx * hx, sy * (hy - cc), sz * (hz - cc)));
      pts.push(new THREE.Vector3(sx * (hx - cc), sy * (hy - cc), sz * hz));
    }
    return new ConvexGeometry(pts);
  });
}

/** Regular polygon shape in the XY plane. */
export function polygonShape(radius: number, sides: number, rotation = Math.PI / sides): THREE.Shape {
  const s = new THREE.Shape();
  for (let i = 0; i <= sides; i++) {
    const a = rotation + (i / sides) * Math.PI * 2;
    const x = Math.cos(a) * radius, y = Math.sin(a) * radius;
    if (i === 0) s.moveTo(x, y); else s.lineTo(x, y);
  }
  return s;
}

/** Polygonal ring (outer polygon with a polygonal hole). */
export function polygonRing(outer: number, inner: number, sides: number): THREE.Shape {
  const s = polygonShape(outer, sides);
  const hole = polygonShape(inner, sides);
  s.holes.push(new THREE.Path(hole.getPoints().reverse()));
  return s;
}

/** Rectangle with chamfered corners, centered. */
export function chamferRect(w: number, h: number, c: number): THREE.Shape {
  const x = w / 2, y = h / 2;
  const s = new THREE.Shape();
  s.moveTo(-x + c, -y);
  s.lineTo(x - c, -y); s.lineTo(x, -y + c);
  s.lineTo(x, y - c); s.lineTo(x - c, y);
  s.lineTo(-x + c, y); s.lineTo(-x, y - c);
  s.lineTo(-x, -y + c); s.closePath();
  return s;
}

/** Extrudes a profile along +Z with a one-segment flat bevel. */
export function extrudeProfile(key: string, shape: THREE.Shape, depth: number, bevel = 0.02): THREE.BufferGeometry {
  return cached(`ex:${key}:${depth}:${bevel}`, () => {
    const g = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: bevel > 0,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 1,
      curveSegments: 1,
    });
    g.translate(0, 0, -depth / 2);
    return g;
  });
}

export function geometryCount(): number {
  return cache.size;
}
