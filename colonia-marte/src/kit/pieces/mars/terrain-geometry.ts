import {
  Box3, BufferGeometry, Float32BufferAttribute, Group, Shape, Vector3,
} from "three";
import { geodesicHalf } from "../../primitives";
import { cachedGeometry } from "../../primitives/cache";
import { finishGeometry } from "../../primitives/normals";
import { createRng } from "../station/helpers";

/** Center an assembly horizontally at X=0, Z=0 and rest its lowest point at Y=0. */
export function centerOnGround(group: Group): Group {
  const bounds = new Box3().setFromObject(group);
  const cx = (bounds.min.x + bounds.max.x) / 2;
  const cz = (bounds.min.z + bounds.max.z) / 2;
  const minY = bounds.min.y;
  for (const child of group.children) {
    child.position.x -= cx;
    child.position.y -= minY;
    child.position.z -= cz;
  }
  return group;
}

function pushFacet(
  positions: number[],
  normals: number[],
  a: Vector3,
  b: Vector3,
  c: Vector3,
): void {
  const normal = b.clone().sub(a).cross(c.clone().sub(a));
  if (normal.lengthSq() < 1e-10) return;
  normal.normalize();
  for (const v of [a, b, c]) {
    positions.push(v.x, v.y, v.z);
    normals.push(normal.x, normal.y, normal.z);
  }
}

/** Watertight stratified low-poly rock column or mesa cliff geometry with outward normals. */
export function stratifiedRockGeometry(
  keyTag: string,
  seed: number,
  radius: number,
  height: number,
  sides: number,
  profile: readonly [number, number][],
  jitter = 0.16,
): BufferGeometry {
  return cachedGeometry([keyTag, seed, radius, height, sides, profile, jitter], () => {
    const rng = createRng(seed);
    const phaseA = rng() * Math.PI * 2;
    const phaseB = rng() * Math.PI * 2;
    const rings: Vector3[][] = profile.map(([yFrac, rScale], rIdx) => {
      const ring: Vector3[] = [];
      const yBase = yFrac * height;
      for (let i = 0; i < sides; i++) {
        const angle = (i / sides) * Math.PI * 2;
        const wave = 1 + jitter * (
          0.6 * Math.sin(angle * 2 + phaseA + rIdx * 0.7) +
          0.4 * Math.cos(angle * 3 - phaseB + rIdx * 1.1)
        ) + (rng() - 0.5) * jitter * 0.5;
        const r = radius * rScale * wave;
        const yJitter = rIdx === 0 || rIdx === profile.length - 1
          ? 0
          : (rng() - 0.5) * height * 0.04;
        ring.push(new Vector3(Math.cos(angle) * r, Math.max(0, yBase + yJitter), Math.sin(angle) * r));
      }
      return ring;
    });

    const positions: number[] = [];
    const normals: number[] = [];
    for (let r = 0; r < rings.length - 1; r++) {
      const lower = rings[r];
      const upper = rings[r + 1];
      for (let i = 0; i < sides; i++) {
        const next = (i + 1) % sides;
        pushFacet(positions, normals, lower[i], upper[next], lower[next]);
        pushFacet(positions, normals, lower[i], upper[i], upper[next]);
      }
    }
    const topRing = rings[rings.length - 1];
    const apex = new Vector3(
      (rng() - 0.5) * radius * 0.08,
      height + height * 0.02,
      (rng() - 0.5) * radius * 0.08,
    );
    for (let i = 0; i < sides; i++) {
      const next = (i + 1) % sides;
      pushFacet(positions, normals, topRing[i], apex, topRing[next]);
    }

    // Close bottom ring at Y=0 with downward (-Y) outward normals.
    const bottomRing = rings[0];
    const baseCenter = new Vector3(0, 0, 0);
    for (let i = 0; i < sides; i++) {
      const next = (i + 1) % sides;
      pushFacet(positions, normals, baseCenter, bottomRing[i], bottomRing[next]);
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    geometry.setAttribute("normal", new Float32BufferAttribute(normals, 3));
    return finishGeometry(geometry);
  });
}

/** Deterministic deformed half-geodesic boulder with flat open ground contact at Y=0. */
export function boulderGeometry(
  seed: number,
  radius: number,
  scaleY: number,
  detail: 0 | 1 = 1,
): BufferGeometry {
  return cachedGeometry(["marsBoulder", seed, radius, scaleY, detail], () => {
    const rng = createRng(seed);
    const p1 = rng() * Math.PI * 2;
    const p2 = rng() * Math.PI * 2;
    const p3 = rng() * Math.PI * 2;
    const source = geodesicHalf(radius, detail).toNonIndexed();
    const pos = source.getAttribute("position");
    const positions: number[] = [];
    const normals: number[] = [];
    const deform = (v: Vector3): Vector3 => {
      const len = Math.hypot(v.x, v.y, v.z) || 1;
      const nx = v.x / len;
      const ny = v.y / len;
      const nz = v.z / len;
      const factor = 1 + 0.18 * Math.sin(nx * 3.1 + p1) + 0.14 * Math.cos(nz * 2.7 + p2)
        + 0.1 * Math.sin((nx + ny) * 4.0 + p3);
      return new Vector3(
        v.x * factor,
        v.y <= 1e-4 ? 0 : v.y * scaleY * (0.92 + 0.16 * Math.sin(ny * 2.5 + p1)),
        v.z * factor,
      );
    };
    const rimMap = new Map<string, Vector3>();
    for (let i = 0; i < pos.count; i += 3) {
      const a = deform(new Vector3().fromBufferAttribute(pos, i));
      const b = deform(new Vector3().fromBufferAttribute(pos, i + 1));
      const c = deform(new Vector3().fromBufferAttribute(pos, i + 2));
      pushFacet(positions, normals, a, b, c);
      for (const v of [a, b, c]) {
        if (v.y <= 1e-4) {
          rimMap.set(`${v.x.toFixed(4)},${v.z.toFixed(4)}`, new Vector3(v.x, 0, v.z));
        }
      }
    }
    const rim = [...rimMap.values()].sort((u, v) => Math.atan2(u.z, u.x) - Math.atan2(v.z, v.x));
    if (rim.length >= 3) {
      const baseOrigin = new Vector3(0, 0, 0);
      for (let i = 0; i < rim.length; i++) {
        const next = (i + 1) % rim.length;
        pushFacet(positions, normals, baseOrigin, rim[i], rim[next]);
      }
    }
    source.dispose();
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    geometry.setAttribute("normal", new Float32BufferAttribute(normals, 3));
    return finishGeometry(geometry);
  });
}

export function irregularCapShape(seed: number, radius: number, sides: number, jitter = 0.14): Shape {
  const rng = createRng(seed);
  const shape = new Shape();
  for (let i = 0; i < sides; i++) {
    const angle = (i / sides) * Math.PI * 2;
    const r = radius * (1 + (rng() - 0.5) * jitter * 2);
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}
