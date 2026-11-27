import { BufferGeometry, Float32BufferAttribute, Group, Mesh, Vector2 } from "three";
import { materials } from "../../../materials/shared";
import type { PieceRegistry } from "../../registry";
import { alignBaseCenter, parseRecord } from "../station/helpers";

interface TrackSpec { path: [number, number][] }
const defaultPath: TrackSpec["path"] = [[0, -4], [0, 4]];
const separation = 1.96;
const spacing = 0.48;

export function parseRoverTracks(input: unknown): TrackSpec {
  const { path = defaultPath } = parseRecord(input, ["path"]);
  if (!Array.isArray(path) || path.length < 2 || path.length > 10 || path.some(point =>
    !Array.isArray(point) || point.length !== 2 ||
    point.some(value => typeof value !== "number" || !Number.isFinite(value) || Math.abs(value) > 64))) {
    throw new Error("Rover tracks require 2–10 local [x, z] points");
  }
  for (let i = 1; i < path.length; i++) {
    if (Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]) < spacing * 2) {
      throw new Error("Adjacent rover track points are too close");
    }
  }
  return { path };
}

export function buildRoverTracks({ path }: TrackSpec, ground: (x: number, z: number) => number) {
  const geometry = new BufferGeometry(), positions: number[] = [], coverage: number[] = [], indices: number[] = [];
  const points = path.map(([x, z]) => new Vector2(x, z));
  const starts = [0];
  for (let i = 1; i < points.length; i++) starts.push(starts[i - 1] + points[i].distanceTo(points[i - 1]));
  const length = starts.at(-1)!;
  let segment = 0;
  for (let distance = spacing / 2; distance < length; distance += spacing) {
    while (distance > starts[segment + 1]) segment++;
    const tangent = points[segment + 1].clone().sub(points[segment]).normalize();
    const normal = new Vector2(-tangent.y, tangent.x);
    const point = points[segment].clone().addScaledVector(tangent, distance - starts[segment]);
    const fade = Math.min(1, distance / 1.35, (length - distance) / 1.75);
    for (const side of [-1, 1]) {
      const start = positions.length / 3;
      for (const [row, across] of [-0.25, -0.20, 0, 0.20, 0.25].entries()) {
        for (const [col, ahead] of [-0.185, -0.13, 0.13, 0.185].entries()) {
          const cross = across + side * separation * 0.5;
          const along = ahead + side * (0.095 - Math.abs(across) * 0.50);
          const x = point.x + normal.x * cross + tangent.x * along;
          const z = point.y + normal.y * cross + tangent.y * along;
          const alpha = row === 0 || row === 4 || col === 0 || col === 3 ? 0 : 0.49 * fade;
          positions.push(x, ground(x, z) + 0.026, z);
          coverage.push(alpha);
        }
      }
      for (let row = 0; row < 4; row++) for (let col = 0; col < 3; col++) {
        const a = start + row * 4 + col;
        indices.push(a, a + 4, a + 1, a + 1, a + 4, a + 5);
      }
    }
  }
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("treadCoverage", new Float32BufferAttribute(coverage, 1));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const mesh = new Mesh(geometry, materials.M_roverTracks);
  mesh.name = "NX-03 Projected rover treads";
  return mesh;
}

export function registerRoverTracks(registry: PieceRegistry): void {
  registry.register<TrackSpec>("NX-03", {
    parse: parseRoverTracks,
    variants: { standard: { path: defaultPath } },
    metadata: { category: "terrain", pivot: "base-center" },
    build: spec => {
      const group = new Group();
      group.add(buildRoverTracks(spec, () => 0));
      return alignBaseCenter(group);
    },
  });
}
