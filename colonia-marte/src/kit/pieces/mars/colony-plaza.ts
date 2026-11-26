import { BoxGeometry, BufferGeometry, Float32BufferAttribute, Group, Matrix4, Mesh, ShapeUtils, Vector2 } from "three";
import { mergeGeometries, mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { materials } from "../../../materials/shared";
import { coloredGeometry } from "../../../materials/uv";
import { boxCenter } from "../station/helpers";
import { location, repeatMesh } from "./transit-details";

type Point = [number, number];
type Height = (x: number, z: number) => number;
export interface PlazaMarking {
  at: Point;
  rot?: number;
  kind?: "arrow" | "pad";
}
export interface Plaza {
  layout: "plaza";
  size: Point;
  outline?: Point[];
  lanes: Point[][];
  platformSkirt?: boolean;
  grates?: [number, number, number?][];
  markings?: PlazaMarking[];
}

const tilePitch = 1.42;
const joint = 0.055;
const tileThickness = 0.052;
const top = 0.052;

export function plazaOutline({ size: [w, d], outline }: Plaza): Point[] {
  return outline ?? [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]];
}

export function plazaContains(outline: readonly Point[], x: number, z: number) {
  let inside = false;
  for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
    const [ax, az] = outline[j], [bx, bz] = outline[i];
    if ((az > z) !== (bz > z) && x < ax + (bx - ax) * (z - az) / (bz - az)) inside = !inside;
  }
  return inside;
}

function surface(points: number[], faces: number[]) {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(points, 3));
  geometry.setIndex(faces);
  geometry.computeVertexNormals();
  return geometry;
}

/** Clip one triangulated piece of the footprint against a rectangular cell or its inset. */
function clip(polygon: Point[], axis: 0 | 1, limit: number, sense: number): Point[] {
  const result: Point[] = [];
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i], b = polygon[(i + 1) % polygon.length];
    const da = (a[axis] - limit) * sense, db = (b[axis] - limit) * sense;
    if (da >= 0) result.push(a);
    if (da * db < 0) {
      const t = da / (da - db);
      result.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }
  return result;
}

function area(polygon: readonly Point[]) {
  return polygon.reduce((sum, [x, z], i) => {
    const [nextX, nextZ] = polygon[(i + 1) % polygon.length];
    return sum + x * nextZ - z * nextX;
  }, 0) / 2;
}

function addPatch(
  vertices: number[], faces: number[], polygon: Point[], height: Height, lift: number,
) {
  if (Math.abs(area(polygon)) < 0.00001) return;
  const first = vertices.length / 3;
  const [a, ...rest] = area(polygon) < 0 ? polygon : polygon.slice().reverse();
  for (const [x, z] of [a, ...rest]) vertices.push(x, height(x, z) + lift, z);
  for (let i = 1; i < rest.length; i++) {
    if (Math.abs(area([a, rest[i - 1], rest[i]])) > 0.000002) faces.push(first, first + i, first + i + 1);
  }
}

function pavement(outline: Point[], width: number, depth: number, height: Height) {
  const contour = outline.map(([x, z]) => new Vector2(x, z));
  const triangles = ShapeUtils.triangulateShape(contour, []).map(face => face.map(index => outline[index]));
  const columns = Math.ceil(width / tilePitch), rows = Math.ceil(depth / tilePitch);
  const tileX = width / columns, tileZ = depth / rows;
  const bases: number[] = [], baseFaces: number[] = [], edges: number[] = [], edgeFaces: number[] = [];
  const mounts = [];
  for (let row = 0; row < rows; row++) for (let col = 0; col < columns; col++) {
    const x = col * tileX - width / 2, z = row * tileZ - depth / 2;
    const parts = triangles.map(polygon => clip(
      clip(clip(clip(polygon, 0, x, 1), 0, x + tileX, -1), 1, z, 1), 1, z + tileZ, -1,
    )).filter(polygon => polygon.length >= 3);
    const covered = parts.reduce((sum, part) => sum + Math.abs(area(part)), 0);
    if (covered < 0.00001) continue;
    if (covered >= tileX * tileZ - 0.00001) {
      addPatch(bases, baseFaces, [[x, z], [x + tileX, z], [x + tileX, z + tileZ], [x, z + tileZ]], height, top - 0.026);
      const cx = x + tileX / 2, cz = z + tileZ / 2;
      mounts.push(location(cx, height(cx, cz) + top - tileThickness / 2, cz));
      continue;
    }
    const inset = joint / 2;
    for (const part of parts) {
      addPatch(bases, baseFaces, part, height, top - 0.026);
      const face = clip(clip(clip(clip(part, 0, x + inset, 1), 0, x + tileX - inset, -1),
        1, z + inset, 1), 1, z + tileZ - inset, -1);
      addPatch(edges, edgeFaces, face, height, top);
    }
  }
  // Palette `gray` modulated to true mid-gray slate (`Y ~ 115..124` under AMB-04 sun, never near-white!)
  const slab = boxCenter([tileX - joint, tileThickness, tileZ - joint], "gray", [0, 0, 0], 0.014);
  slab.geometry = slab.geometry.clone();
  const paint = slab.geometry.getAttribute("color");
  for (let i = 0; i < paint.count; i++) {
    const isTop = slab.geometry.attributes.position.getY(i) > 0.022;
    paint.setXYZ(i, isTop ? 0.36 : 0.26, isTop ? 0.38 : 0.28, isTop ? 0.42 : 0.31);
  }
  const slabs = repeatMesh(slab, "Beveled plaza slab grid", mounts);
  const transform = new Matrix4();
  mounts.forEach(({ position: { x, z } }, index) => {
    slabs.getMatrixAt(index, transform);
    // Preserve the joint spacing on slopes.
    transform.elements[1] = (height(x + tileX / 2, z) - height(x - tileX / 2, z)) / tileX;
    transform.elements[9] = (height(x, z + tileZ / 2) - height(x, z - tileZ / 2)) / tileZ;
    slabs.setMatrixAt(index, transform);
  });
  slabs.instanceMatrix.needsUpdate = true;
  slabs.computeBoundingBox();
  slabs.computeBoundingSphere();
  return { slabs, bed: surface(bases, baseFaces), edgeSlabs: surface(edges, edgeFaces) };
}

function perimeter(outline: Point[], height: (x: number, z: number, offset: number) => number, bands: readonly Point[]) {
  const edge = (area(outline) < 0 ? outline.slice().reverse() : outline).map(([x, z]) => new Vector2(x, z));
  const points: number[] = [], faces: number[] = [];
  const rows: Array<{ at: Vector2; outward: Vector2 }> = [];
  const normals = edge.map((a, i) => {
    const b = edge[(i + 1) % edge.length];
    return new Vector2(b.y - a.y, a.x - b.x).normalize();
  });
  for (const [i, a] of edge.entries()) {
    const normal = normals[i], before = normals.at(i - 1)!;
    const b = edge[(i + 1) % edge.length], steps = Math.ceil(a.distanceTo(b) / 0.55);
    rows.push({ at: a, outward: normal.clone().add(before).divideScalar(Math.max(0.40, 1 + normal.dot(before))) });
    for (let j = 1; j < steps; j++) rows.push({ at: a.clone().lerp(b, j / steps), outward: normal });
  }
  for (const [i, { at, outward }] of rows.entries()) for (const [j, [offset, lift]] of bands.entries()) {
    const { x, y: z } = at.clone().addScaledVector(outward, offset);
    points.push(x, height(x, z, offset) + lift, z);
    if (j + 1 === bands.length) continue;
    const a = i * bands.length + j, b = ((i + 1) % rows.length) * bands.length + j;
    faces.push(a, b, a + 1, b, b + 1, a + 1);
  }
  return surface(points, faces);
}

function laneDashes(lanes: readonly Point[][], height: Height) {
  const mounts = [];
  for (const lane of lanes) {
    let next = 0.38;
    for (let i = 1; i < lane.length; i++) {
      const [ax, az] = lane[i - 1], [bx, bz] = lane[i];
      const dx = bx - ax, dz = bz - az, length = Math.hypot(dx, dz);
      for (; next < length; next += 1.18) {
        const x = ax + dx * next / length, z = az + dz * next / length;
        const mount = location(x, height(x, z) + top + 0.012, z);
        mount.rotation.y = Math.atan2(dx, dz);
        mount.rotation.x = -Math.atan2(
          height(x + dx / length * 0.18, z + dz / length * 0.18) -
            height(x - dx / length * 0.18, z - dz / length * 0.18), 0.36,
        );
        mounts.push(mount);
      }
      next -= length;
    }
  }
  return mounts;
}

function tintGeometry(geo: BufferGeometry, r: number, g: number, b: number): BufferGeometry {
  const c = geo.getAttribute("color");
  if (c) {
    for (let i = 0; i < c.count; i++) c.setXYZ(i, r, g, b);
  }
  return geo;
}

function buildDistrictFloorDetails(spec: Plaza, outline: Point[], height: Height): BufferGeometry[] {
  const extras: BufferGeometry[] = [];
  const pushMesh = (mesh: Mesh, x: number, y: number, z: number, rotY = 0) => {
    const g = mesh.geometry.clone();
    if (rotY !== 0) g.rotateY(rotY);
    g.translate(x, y, z);
    extras.push(g);
  };

  // 1. Raised colony platform border & structural dark truss skirt (`§1.8`, `v3-t050.10` edge)
  if (spec.platformSkirt) {
    const lip = perimeter(outline, height, [
      [-0.14, top + 0.024],
      [0.08, top + 0.024],
      [0.14, top - 0.02],
      [0.16, -0.46],
    ]);
    extras.push(tintGeometry(coloredGeometry(lip, "darkGray"), 0.58, 0.60, 0.64));
    lip.dispose();

    const edge = (area(outline) < 0 ? outline.slice().reverse() : outline).map(([x, z]) => new Vector2(x, z));
    for (let i = 0; i < edge.length; i++) {
      const a = edge[i], b = edge[(i + 1) % edge.length];
      const len = a.distanceTo(b);
      const dir = b.clone().sub(a).normalize();
      const out = new Vector2(dir.y, -dir.x);
      const yaw = Math.atan2(dir.x, dir.y);
      const count = Math.max(1, Math.floor(len / 2.4));
      for (let k = 0; k < count; k++) {
        const pt = a.clone().lerp(b, (k + 0.5) / count).addScaledVector(out, 0.14);
        const hy = height(pt.x, pt.y);
        const post = boxCenter([0.12, 0.44, 0.16], "black", [0, 0, 0], 0.015);
        pushMesh(post, pt.x, hy - 0.20, pt.y, yaw);
        const brace = boxCenter([0.07, 0.08, 1.45], "darkGray", [0, 0, 0], 0.012);
        const bg = brace.geometry.clone();
        bg.rotateX(0.26);
        bg.rotateY(yaw);
        bg.translate(pt.x, hy - 0.18, pt.y);
        extras.push(tintGeometry(bg, 0.45, 0.47, 0.50));
      }
    }
  }

  // 2. Maintenance floor grates & linear storm/dust drains (`§1.3` & `§2.4`, `v3-t050.10` / `v3-t074.80`)
  if (spec.grates?.length) {
    for (const [gx, gz, rotDeg = 0] of spec.grates) {
      const yaw = (rotDeg * Math.PI) / 180;
      const gy = height(gx, gz) + top;
      const frame = boxCenter([1.28, 0.020, 2.24], "darkGray", [0, 0, 0], 0.006);
      frame.geometry = tintGeometry(frame.geometry.clone(), 0.42, 0.44, 0.48);
      pushMesh(frame, gx, gy + 0.005, gz, yaw);

      const well = boxCenter([1.08, 0.024, 2.02], "black", [0, 0, 0], 0.005);
      pushMesh(well, gx, gy + 0.008, gz, yaw);

      for (let s = -4; s <= 4; s++) {
        const bar = boxCenter([0.98, 0.026, 0.08], "gray", [0, 0, s * 0.20], 0.005);
        const bg = tintGeometry(bar.geometry.clone(), 0.36, 0.38, 0.42);
        bg.translate(0, 0, s * 0.20);
        if (yaw !== 0) bg.rotateY(yaw);
        bg.translate(gx, gy + 0.010, gz);
        extras.push(bg);
      }
    }
  }

  // 3. Painted floor arrows & hangar threshold `[ + ]` amber/white bay pads (`v3-t074.80`)
  if (spec.markings?.length) {
    for (const { at: [mx, mz], rot = 0, kind = "arrow" } of spec.markings) {
      const yaw = (rot * Math.PI) / 180;
      const my = height(mx, mz) + top + 0.010;
      if (kind === "arrow") {
        const stem = boxCenter([0.22, 0.014, 1.35], "white", [0, 0, 0], 0.004);
        pushMesh(stem, mx, my, mz - 0.15 * Math.cos(yaw), yaw);
        for (const sx of [-1, 1] as const) {
          const wing = boxCenter([0.18, 0.014, 0.86], "white", [0, 0, 0], 0.004);
          const wg = wing.geometry.clone();
          wg.rotateY(sx * 0.68);
          wg.translate(sx * 0.24, 0, 0.42);
          wg.rotateY(yaw);
          wg.translate(mx, my, mz);
          extras.push(wg);
        }
      } else {
        // Hangar threshold `[ + ]` amber/yellow floor target pad (`v3-t074.80` depot entrance!)
        for (const sx of [-1, 1] as const) {
          for (const sz of [-1, 1] as const) {
            const c1 = boxCenter([0.52, 0.015, 0.09], "warning", [0, 0, 0], 0.004);
            const g1 = c1.geometry.clone();
            g1.translate(sx * 0.68, 0, sz * 0.94);
            g1.rotateY(yaw);
            g1.translate(mx, my, mz);
            extras.push(g1);

            const c2 = boxCenter([0.09, 0.015, 0.52], "warning", [0, 0, 0], 0.004);
            const g2 = c2.geometry.clone();
            g2.translate(sx * 0.94, 0, sz * 0.68);
            g2.rotateY(yaw);
            g2.translate(mx, my, mz);
            extras.push(g2);
          }
        }
        // Central cross
        for (const r of [0, Math.PI / 2]) {
          const cross = boxCenter([0.09, 0.016, 0.96], "cyan", [0, 0, 0], 0.004);
          const cg = cross.geometry.clone();
          cg.rotateY(yaw + r);
          cg.translate(mx, my + 0.001, mz);
          extras.push(cg);
        }
      }
    }
  }

  return extras;
}

export function buildPlaza(spec: Plaza, height: Height = () => 0, embankment?: { grade: number; ground: Height }) {
  const outline = plazaOutline(spec);
  const { slabs, bed, edgeSlabs } = pavement(outline, ...spec.size, height);
  const curb = perimeter(outline, embankment ? () => embankment.grade : height,
    [[-0.086, top + 0.009], [0.03, top + 0.009], [0.108, 0.019]]);
  const layers: BufferGeometry[] = [
    coloredGeometry(bed, "black"),
    tintGeometry(coloredGeometry(curb, "darkGray"), 0.52, 0.54, 0.58),
  ];
  if (edgeSlabs.index!.count) {
    layers.push(tintGeometry(coloredGeometry(edgeSlabs, "gray"), 0.36, 0.38, 0.42));
  }
  const extraLayers = buildDistrictFloorDetails(spec, outline, height);
  layers.push(...extraLayers);
  const combinedPaving = mergeGeometries(layers)!;
  const paving = mergeVertices(combinedPaving, 1e-6);
  combinedPaving.dispose();
  for (const geometry of [...layers, bed, curb, edgeSlabs]) geometry.dispose();
  const bank = embankment
    ? perimeter(outline, (x, z, offset) => {
      const t = (offset - 0.09) / 4.11;
      return (1 - t) * embankment.grade + t * embankment.ground(x, z);
    }, [[0.09, 0.018], [0.8, 0.015], [1.7, 0.011], [2.8, 0.002], [4.2, -0.018]])
    : perimeter(outline, height, [[0.09, 0.018], [0.32, 0.014], [0.74, -0.018]]);
  bank.setAttribute("iceMask", new Float32BufferAttribute(new Float32Array(bank.attributes.position.count), 1));
  const group = new Group();
  group.name = "MI-01 Paved colony platform";
  const bankMesh = new Mesh(bank, materials.M_terrain);
  if (embankment) bankMesh.name = "District compacted regolith bank";
  group.add(new Mesh(paving, materials.M_palette), bankMesh, slabs);
  const dashes = laneDashes(spec.lanes, height);
  if (dashes.length) {
    const lamp = new Mesh(coloredGeometry(new BoxGeometry(0.104, 0.012, 0.46), "cyan"), materials.M_palette);
    group.add(repeatMesh(lamp, "Cyan plaza lane dashes", dashes));
  }
  return group;
}
