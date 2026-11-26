import { BoxGeometry, BufferGeometry, Float32BufferAttribute, Group, Matrix4, Mesh, Vector2, Vector3 } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { materials } from "../../../materials/shared";
import { coloredGeometry } from "../../../materials/uv";
import type { PieceRegistry } from "../../registry";
import { alignBaseCenter, boxCenter, parseRecord } from "../station/helpers";
import { fusedParts, location, repeatMesh } from "./transit-details";
import { buildPlaza, plazaContains, plazaOutline, type Plaza } from "./colony-plaza";

type Point = [number, number];
type Height = (x: number, z: number) => number;
interface Street { layout: "road"; path: Point[]; access?: Point[] }
interface Section { center: Vector2; lateral: Vector2 }
type Band = [offset: number, height: number];

const halfWidth = 2;
const footwayHalfWidth = 0.53;
const shoulderWidth = 0.62;
const deckHeight = 0.115;
const edgeLight = 1.83;
const standard: Point[] = [[0, -3], [0, 3]];

function parsePath(path: unknown): Point[] {
  if (!Array.isArray(path) || path.length < 2 || path.length > 32 ||
    !path.every(point => Array.isArray(point) && point.length === 2 &&
      point.every(value => typeof value === "number" && Number.isFinite(value)))) {
    throw new Error("Street path must have 2–32 finite local [x, z] waypoints");
  }
  if (path.some((point, i) => i && Math.hypot(point[0] - path[i - 1][0], point[1] - path[i - 1][1]) < 0.55)) {
    throw new Error("Street waypoints must be at least 0.55 m apart");
  }
  return path;
}

export function parseStreet(input: unknown): Street {
  const { layout = "road", path = standard, access } = parseRecord(input, ["layout", "path", "access"]);
  if (layout !== "road") throw new Error("Street layout must be road");
  return { layout, path: parsePath(path), ...(access === undefined ? {} : { access: parsePath(access) }) };
}

export function parseColonyPaving(input: unknown): Street | Plaza {
  if (!input || typeof input !== "object" || !("layout" in input) || input.layout !== "plaza") {
    return parseStreet(input);
  }
  const { size, lanes = [], outline } = parseRecord(input, ["layout", "size", "lanes", "outline"]);
  if (!Array.isArray(size) || size.length !== 2 ||
    !size.every(value => typeof value === "number" && Number.isFinite(value) && value >= 2 && value <= 64)) {
    throw new Error("Plaza size must be a [width, depth] from 2 to 64 metres");
  }
  if (!Array.isArray(lanes) || lanes.length > 24) throw new Error("Invalid plaza lanes");
  const spec: Plaza = { layout: "plaza", size: [size[0], size[1]], lanes: lanes.map(parsePath) };
  if (outline !== undefined) {
    const points = parsePath(outline);
    if (points.length < 3 || new Set(points.map(point => point.join(","))).size !== points.length ||
      points.some(([x, z]) => Math.abs(x) > size[0] / 2 || Math.abs(z) > size[1] / 2)) {
      throw new Error("Invalid plaza outline");
    }
    spec.outline = points;
  }
  const boundary = plazaOutline(spec);
  for (const path of spec.lanes) for (let i = 1; i < path.length; i++) {
    const [x, z] = path[i - 1], [endX, endZ] = path[i];
    const steps = Math.ceil(Math.hypot(endX - x, endZ - z) / 0.4);
    for (let step = 0; step <= steps; step++) {
      const t = step / steps;
      if (!plazaContains(boundary, x + (endX - x) * t, z + (endZ - z) * t)) {
        throw new Error("Plaza lanes must stay within the curb");
      }
    }
  }
  return spec;
}

export function buildColonyPaving(spec: Street | Plaza, height?: Height) {
  return spec.layout === "plaza" ? buildPlaza(spec, height) : buildStreet(spec, height);
}

function rightOf(tangent: Vector2) {
  return new Vector2(tangent.y, -tangent.x);
}

/** Sample circular fillets and the straight tangents between them. */
export function streetSections(path: readonly Point[], radius = 3.3): Section[] {
  const points = path.map(point => new Vector2(...point));
  const directions = points.slice(1).map((end, i) => end.clone().sub(points[i]).normalize());
  const turns = points.map((_, i) => {
    if (i === 0 || i === points.length - 1) return { angle: 0, trim: 0 };
    const from = directions[i - 1], to = directions[i];
    const angle = Math.atan2(from.cross(to), from.dot(to));
    return { angle, trim: radius * Math.tan(Math.abs(angle) / 2) };
  });
  const sections: Section[] = [];
  for (const [i, direction] of directions.entries()) {
    const start = points[i].clone().addScaledVector(direction, turns[i].trim);
    const end = points[i + 1].clone().addScaledVector(direction, -turns[i + 1].trim);
    const length = points[i].distanceTo(points[i + 1]) - turns[i].trim - turns[i + 1].trim;
    if (length < 0.025) throw new Error(`Street leg ${i + 1} is too short for its tangent fillets`);
    const cells = Math.ceil(length / 0.94);
    const lateral = rightOf(direction);
    for (let j = 0; j < cells; j++) sections.push({ center: start.clone().lerp(end, j / cells), lateral });
    const { angle } = turns[i + 1];
    if (Math.abs(angle) > 1e-5) {
      const center = end.clone().addScaledVector(lateral, -Math.sign(angle) * radius);
      const pieces = Math.ceil(Math.abs(angle) / (Math.PI / 32));
      for (let j = 0; j < pieces; j++) {
        const rotation = angle * j / pieces;
        sections.push({
          center: end.clone().rotateAround(center, rotation),
          lateral: lateral.clone().rotateAround(new Vector2(), rotation),
        });
      }
    }
  }
  sections.push({ center: points.at(-1)!, lateral: rightOf(directions.at(-1)!) });
  return sections;
}

export function streetClearance({ path, access }: Street) {
  return [
    ...streetSections(path).map(({ center }) => ({ center, radius: halfWidth + shoulderWidth + 0.08 })),
    ...(access ? streetSections(access, 0.85).map(({ center }) => ({ center, radius: 0.74 })) : []),
  ];
}

function ribbon(sections: readonly Section[], bands: readonly Band[], height: Height) {
  const positions: number[] = [], indices: number[] = [];
  for (const { center, lateral } of sections) for (const [offset, elevation] of bands) {
    const { x, y: z } = center.clone().addScaledVector(lateral, offset);
    positions.push(x, height(x, z) + elevation, z);
  }
  const width = bands.length;
  for (let i = 0; i < sections.length - 1; i++) for (let j = 0; j < width - 1; j++) {
    const a = i * width + j, b = a + width;
    indices.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function curbShell(sections: Section[], width: number, height: Height) {
  const body = ribbon(sections, [
    [-width - 0.008, -0.14], [-width, deckHeight - 0.027], [-width + 0.055, deckHeight],
    [width - 0.055, deckHeight], [width, deckHeight - 0.027], [width + 0.008, -0.14],
  ], height);
  const geometry = coloredGeometry(body, "darkGray");
  const color = geometry.getAttribute("color");
  for (let i = 0; i < color.count; i++) color.setXYZ(i, 0.73, 0.73, 0.73);
  return new Mesh(geometry, materials.M_palette);
}

function shoulders(sections: Section[], width: number, bank: number, height: Height) {
  return [-1, 1].map(side => {
    const bands: Band[] = [[side * (width - 0.015), 0.086], [side * (width + bank * 0.52), 0.045],
      [side * (width + bank), -0.035]];
    const geometry = ribbon(sections, bands.sort(([a], [b]) => a - b), height);
    geometry.setAttribute("iceMask", new Float32BufferAttribute(new Float32Array(geometry.attributes.position.count), 1));
    return geometry;
  });
}

function pave(shell: Group, sections: Section[], edge: number, columns: number, height: Height) {
  for (let i = 0; i < sections.length - 1;) {
    const a = sections[i];
    let j = i + 1;
    while (j < sections.length - 1 && a.center.distanceTo(sections[j].center) < 0.77) j++;
    const b = sections[j];
    const length = a.center.distanceTo(b.center);
    const pitch = 2 * edge / columns;
    for (let col = 0; col < columns; col++) {
      const offset = -edge + (col + 0.5) * pitch;
      const plate = boxCenter([pitch - 0.038, 0.062, length - 0.047], "hull", [0, 0, 0], 0.018);
      // Each warped plate needs its own geometry; the palette primitive buffers are shared.
      plate.geometry = plate.geometry.clone();
      const { position } = plate.geometry.attributes;
      for (let k = 0; k < position.count; k++) {
        const x = offset + position.getX(k), t = 0.5 + position.getZ(k) / length;
        const point = a.center.clone().addScaledVector(a.lateral, x)
          .lerp(b.center.clone().addScaledVector(b.lateral, x), t);
        position.setXYZ(k, point.x, height(point.x, point.y) + deckHeight + position.getY(k), point.y);
      }
      plate.geometry.computeVertexNormals();
      shell.add(plate);
    }
    i = j;
  }
}

function edgeDashes(sections: Section[], height: Height) {
  const dashes = [];
  for (const side of [-1, 1]) {
    const edge = sections.map(({ center, lateral }) => center.clone().addScaledVector(lateral, side * edgeLight));
    let next = 0.62;
    for (const [i, a] of edge.slice(0, -1).entries()) {
      const b = edge[i + 1], span = a.distanceTo(b);
      while (next < span) {
        const { x, y: z } = a.clone().lerp(b, next / span);
        const up = new Vector3(height(x - 0.05, z) - height(x + 0.05, z), 0.1,
          height(x, z - 0.05) - height(x, z + 0.05)).normalize();
        const ahead = new Vector3(b.x - a.x, 0, b.y - a.y).projectOnPlane(up).normalize();
        const light = location(x, height(x, z) + deckHeight + 0.010, z);
        light.quaternion.setFromRotationMatrix(new Matrix4().makeBasis(up.clone().cross(ahead), up, ahead));
        dashes.push(light);
        next += 1.22;
      }
      next -= span;
    }
  }
  return dashes;
}

export function buildStreet({ path, access }: Omit<Street, "layout">, height: Height = () => 0) {
  const sections = streetSections(path);
  const shell = new Group();
  shell.add(curbShell(sections, halfWidth, height));
  pave(shell, sections, 1.65, 4, height);
  const banks = shoulders(sections, halfWidth, shoulderWidth, height);
  if (access) {
    const apron = streetSections(access, 0.85);
    shell.add(curbShell(apron, footwayHalfWidth, height));
    pave(shell, apron, 0.45, 1, height);
    banks.push(...shoulders(apron, footwayHalfWidth, 0.12, height));
  }
  const lens = new Mesh(coloredGeometry(new BoxGeometry(0.063, 0.015, 0.34), "cyan"), materials.M_palette);
  const street = fusedParts("MI-01 Colony street", shell, true,
    [repeatMesh(lens, "Recessed lane dashes", edgeDashes(sections, height))]);
  const compactedSoil = new Mesh(mergeGeometries(banks)!, materials.M_terrain);
  compactedSoil.name = "Graded regolith shoulders";
  street.add(compactedSoil);
  banks.forEach(bank => bank.dispose());
  return street;
}

export function registerColonyStreet(registry: PieceRegistry) {
  registry.register("MI-01", {
    parse: parseColonyPaving,
    variants: {
      standard: { layout: "road", path: standard },
      plaza: { layout: "plaza", size: [4.5, 4.5], lanes: [[[-1.22, -1.80], [-1.22, 1.80]]] },
    },
    metadata: { category: "furniture", pivot: "base-center" },
    build: spec => alignBaseCenter(buildColonyPaving(spec)),
  });
}
