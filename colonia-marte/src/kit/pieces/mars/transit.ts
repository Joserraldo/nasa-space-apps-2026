import {
  BoxGeometry, BufferGeometry, Float32BufferAttribute, Group, LatheGeometry, Mesh, Vector2,
} from "three";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { batchStatic } from "../../../core/batching";
import { materials } from "../../../materials/shared";
import { coloredGeometry } from "../../../materials/uv";
import type { PieceRegistry } from "../../registry";
import { alignBaseCenter, boxCenter, parseChoice, parseRecord, type PaletteKey } from "../station/helpers";
import { buildEarth } from "./earth";

const detailLevels = ["near", "middle", "far"] as const;
type TransitDetail = typeof detailLevels[number];
const resolution = {
  near: { body: 24, small: 16, orionGrid: [4, 4], dstGrid: [6, 20] },
  middle: { body: 16, small: 10, orionGrid: [3, 3], dstGrid: [4, 12] },
  far: { body: 10, small: 8, orionGrid: [2, 2], dstGrid: [2, 6] },
} as const;
type Resolution = (typeof resolution)[TransitDetail];
type Profile = [radius: number, x: number][];
type TransitColor = PaletteKey | "nightSky" | "xenonGlow";

function axialProfile(profile: Profile, segments: number, color: TransitColor, x = 0, y = 0, z = 0) {
  const geometry = new LatheGeometry(profile.map(([radius, axial]) => new Vector2(radius, axial)), segments);
  if (profile.some(([radius]) => radius === 0)) {
    const index = geometry.getIndex()!, stride = profile.length, triangles: number[] = [];
    for (let i = 0; i < index.count; i += 3) {
      const triangle = [index.getX(i), index.getX(i + 1), index.getX(i + 2)];
      // Adjacent samples of a profile pole occupy one vertex, not a second triangle.
      if (triangle.filter(vertex => profile[vertex % stride][0] === 0).length < 2) {
        triangles.push(...triangle);
      }
    }
    geometry.setIndex(triangles);
  }
  geometry.rotateZ(-Math.PI / 2);
  const mesh = new Mesh(coloredGeometry(geometry, color, { weld: true }), materials.M_palette);
  geometry.dispose();
  mesh.position.set(x, y, z);
  return mesh;
}

function cylinder(start: number, end: number, radius: number, segments: number, color: PaletteKey) {
  return axialProfile([[0, start], [radius, start], [radius, end], [0, end]], segments, color);
}

function block(size: [number, number, number], color: TransitColor, position: [number, number, number]) {
  const geometry = new BoxGeometry(...size);
  const mesh = new Mesh(coloredGeometry(geometry, color), materials.M_palette);
  geometry.dispose();
  mesh.position.set(...position);
  return mesh;
}

function fusedParts(name: string, parts: Group) {
  const batch = batchStatic(parts);
  batch.name = name;
  for (const child of batch.children) {
    if (!(child instanceof Mesh)) continue;
    const geometry = child.geometry;
    child.geometry = mergeVertices(geometry, 1e-6);
    geometry.dispose();
  }
  return batch;
}

function solarCells(width: number, length: number, [columns, rows]: readonly [number, number]) {
  const positions: number[] = [], indices: number[] = [];
  const dx = width / columns, dz = length / rows;
  for (const side of [-1, 1]) for (let row = 0; row < rows; row++) for (let col = 0; col < columns; col++) {
    const x = (col - columns / 2) * dx + 0.023;
    const z = (row - rows / 2) * dz + 0.027;
    const right = x + dx - 0.046, end = z + dz - 0.054;
    const start = positions.length / 3, y = side * 0.034;
    positions.push(x, y, z, x, y, end, right, y, end, right, y, z);
    if (side > 0) indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
    else indices.push(start, start + 2, start + 1, start, start + 3, start + 2);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const cells = new Mesh(coloredGeometry(geometry, "blue"), materials.M_palette);
  geometry.dispose();
  return cells;
}

function solarPanel(name: string, width: number, length: number, grid: readonly [number, number], rollOut = false) {
  const parts = new Group();
  parts.add(block([width, 0.065, length], "nightSky", [0, 0, 0]), solarCells(width - 0.14, length - 0.13, grid));
  for (const edge of [-1, 1]) {
    parts.add(block([0.059, 0.091, length], "hull", [edge * (width / 2 - 0.034), 0, 0]));
    if (rollOut) parts.add(block([width, 0.11, 0.14], "darkGray", [0, 0, edge * (length / 2 - 0.05)]));
  }
  return fusedParts(name, parts);
}

function orionWing(index: number, detail: Resolution) {
  const wing = new Group(), joint = new Group();
  wing.name = `orion-solar-wing-${index + 1}`;
  wing.position.x = -14.72;
  wing.rotation.x = Math.PI / 4 + index * Math.PI / 2;
  joint.add(boxCenter([0.47, 0.41, 0.65], "darkGray", [0, 0, 2.34], 0.07));
  wing.add(fusedParts("orion-wing-hinge", joint));
  for (let panel = 0; panel < 3; panel++) {
    const tile = solarPanel(`orion-panel-${panel + 1}`, 2, 2.12, detail.orionGrid);
    tile.position.set(panel * -0.11, 0, 3.63 + panel * 2.23);
    wing.add(tile);
  }
  return wing;
}

function orion(detail: Resolution) {
  const { body, small } = detail;
  const nose = new Group(), service = new Group(), structure = new Group();
  structure.name = "orion";
  // Capsule apex docks to the habitat; the broad heat shield faces the service module.
  nose.add(
    axialProfile([[2.50, -13.52], [2.47, -13.27], [2.30, -12.86], [0.92, -10.55], [0.78, -10.30]], body, "white"),
    axialProfile([[1.92, -13.74], [2.38, -13.66], [2.50, -13.52], [2.48, -13.39]], body, "darkGray"),
    cylinder(-10.37, -9.75, 0.73, small, "hull"),
    cylinder(-9.90, -9.59, 0.65, small, "darkGray"),
  );
  for (const sign of [-1, 1]) {
    const window = boxCenter([0.40, 0.28, 0.09], "black", [-11.32, 0.55, 1.26 * sign], 0.024);
    window.rotation.y = sign * -0.54;
    nose.add(window);
  }
  service.add(
    cylinder(-16.43, -13.73, 2.25, body, "offWhite"),
    cylinder(-16.50, -16.36, 2.20, small, "darkGray"),
    axialProfile([[0.45, -16.64], [0.56, -16.98], [0.94, -17.78], [1.06, -17.85], [1.13, -17.81],
      [0.69, -16.86], [0.65, -16.45]], small, "darkGray"),
  );
  const module = fusedParts("orion-service-module", service);
  for (let i = 0; i < 4; i++) module.add(orionWing(i, detail));
  structure.add(fusedParts("orion-crew-module", nose), module);
  return structure;
}

function tank(x: number, length: number, radius: number, angle: number, offset: number, segments: number) {
  const centerY = Math.cos(angle) * offset, centerZ = Math.sin(angle) * offset;
  const half = length / 2;
  return axialProfile([[0, -half], [radius * 0.73, -half + radius * 0.16], [radius, -half + radius * 0.61],
    [radius, half - radius * 0.61], [radius * 0.73, half - radius * 0.16], [0, half]], segments, "offWhite",
    x, centerY, centerZ);
}

function habitat(detail: Resolution, tier: TransitDetail) {
  const { body, small } = detail;
  const parts = new Group();
  parts.add(
    axialProfile([[0.65, -9.76], [1.20, -9.70], [2.37, -9.15], [2.55, -8.60], [2.55, 6.72],
      [2.37, 7.32], [1.71, 7.65], [0, 7.65]], body, "white"),
  );
  for (const x of [-8.3, -5.6, -2.8, 0.2, 3.3, 6.45]) {
    parts.add(axialProfile([[2.551, x], [2.553, x + 0.037]], body, "hull"));
  }
  for (let i = 0; i < 6; i++) parts.add(tank(2.30, 5.6, 0.58, (i + 0.5) * Math.PI / 3, 2.56, small));
  for (const side of [-1, 1]) {
    const radiator = new Group();
    radiator.position.set(1.15, -0.87, side * 2.68);
    radiator.rotation.x = side * -0.24;
    radiator.add(block([9.6, 0.16, 1.49], "darkGray", [0, 0, 0]));
    const strips = tier === "near" ? 12 : tier === "middle" ? 6 : 3;
    for (let i = 0; i < strips; i++) {
      radiator.add(block([9.45 / strips - 0.035, 0.036, 1.30], "hull", [(i + 0.5) * 9.45 / strips - 4.725, 0.08, 0]));
    }
    parts.add(radiator);
  }
  for (const x of [-6.9, -4.9, -3.7]) {
    parts.add(boxCenter([0.42, 0.26, 0.12], "black", [x, 0.42, -2.49], 0.035));
  }
  const antenna = new Group();
  antenna.position.set(-5.55, 2.30, -0.39);
  antenna.rotation.z = -0.29;
  antenna.rotation.x = -0.43;
  const dish = axialProfile([[0, -0.13], [0.57, -0.03], [1.05, 0.29], [1.05, 0.36], [0.59, 0.09], [0, 0.01]], small, "offWhite");
  dish.rotation.z = Math.PI / 2;
  dish.position.y = 1.24;
  antenna.add(
    boxCenter([0.17, 1.33, 0.18], "gray", [0, 0.63, 0], 0.04), dish,
    block([0.085, 0.50, 0.085], "darkGray", [0, 1.45, 0]),
  );
  parts.add(antenna);
  return fusedParts("dst-transit-habitat", parts);
}

function propulsion(detail: Resolution) {
  const { body, small } = detail;
  const parts = new Group();
  parts.add(
    cylinder(7.53, 12.92, 1.67, body, "hull"),
    axialProfile([[1.35, 12.81], [2.38, 13.32], [2.43, 15.35], [2.25, 15.57], [0, 15.57]], body, "gray"),
  );
  for (let i = 0; i < 4; i++) {
    const angle = Math.PI / 4 + i * Math.PI / 2;
    parts.add(tank(10.84, 4.1, 0.47, angle, 1.77, small));
    const y = Math.cos(angle) * 1.26, z = Math.sin(angle) * 1.26;
    parts.add(
      axialProfile([[0.52, 15.47], [0.70, 15.74], [0.72, 16.04], [0.62, 16.15], [0.52, 16.12],
        [0.46, 15.86]], small, "darkGray", 0, y, z),
      axialProfile([[0.44, 15.93], [0.34, 15.94], [0.27, 15.83]], small, "xenonGlow", 0, y, z),
    );
  }
  const module = fusedParts("dst-electric-propulsion", parts);
  for (let i = 0; i < 2; i++) {
    const wing = new Group(), support = new Group();
    wing.name = `dst-solar-wing-${i + 1}`;
    wing.position.x = 10.74;
    wing.rotation.set(-0.53, i * Math.PI, 0, "XYZ");
    support.add(boxCenter([0.70, 0.45, 3.10], "darkGray", [0, 0, 2.52], 0.09));
    const array = solarPanel("roll-out-array", 7.4, 20.0, detail.dstGrid, true);
    array.position.z = 13.78;
    wing.add(fusedParts("dst-wing-boom", support), array);
    module.add(wing);
  }
  return module;
}

function buildTransit(tier: TransitDetail) {
  const ship = new Group(), detail = resolution[tier];
  ship.add(orion(detail), habitat(detail, tier), propulsion(detail));
  return alignBaseCenter(ship);
}

export function registerMarsTransit(registry: PieceRegistry): void {
  registry.register<{ detail: TransitDetail }>("MV-09", {
    parse: input => ({ detail: parseChoice(parseRecord(input, ["detail"]).detail, detailLevels, "near") }),
    variants: { near: { detail: "near" } },
    metadata: { category: "vehicle", pivot: "base-center" },
    build: ({ detail }) => buildTransit(detail),
  });
  registry.register("BG-01", {
    parse: input => parseRecord(input, []),
    variants: { standard: {} },
    metadata: { category: "terrain", pivot: "base-center" },
    build: buildEarth,
  });
}
