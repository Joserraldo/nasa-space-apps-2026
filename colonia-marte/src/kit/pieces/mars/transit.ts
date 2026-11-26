import {
  BoxGeometry, BufferGeometry, Float32BufferAttribute, Group, LatheGeometry, Mesh, Vector2, Vector3,
} from "three";
import { materials } from "../../../materials/shared";
import { coloredGeometry } from "../../../materials/uv";
import type { PieceRegistry } from "../../registry";
import { alignBaseCenter, boxCenter, parseChoice, parseRecord, type PaletteKey } from "../station/helpers";
import { buildEarth } from "./earth";
import { beam, blankets, fusedParts, location, pipe, repeatMesh, windowFrame, type TransitDetail } from "./transit-details";

const detailLevels = ["near", "middle", "far"] as const;
const resolution = {
  near: { body: 24, small: 10, orionGrid: [5, 6], dstGrid: [7, 23] },
  middle: { body: 16, small: 8, orionGrid: [3, 4], dstGrid: [4, 12] },
  far: { body: 10, small: 6, orionGrid: [2, 2], dstGrid: [2, 6] },
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
  const bevel = Math.min((end - start) * 0.2, radius * 0.12, 0.075);
  return axialProfile([[0, start], [radius - bevel, start], [radius, start + bevel],
    [radius, end - bevel], [radius - bevel, end], [0, end]], segments, color);
}

function block(size: [number, number, number], color: TransitColor, position: [number, number, number]) {
  return boxCenter(size, color as PaletteKey, position, Math.min(...size) * 0.17);
}

function strip(size: [number, number, number], color: PaletteKey, position: [number, number, number]) {
  const raw = new BoxGeometry(...size);
  const mesh = new Mesh(coloredGeometry(raw, color, { weld: true }), materials.M_palette);
  raw.dispose();
  mesh.position.set(...position);
  return mesh;
}

function solarCells(width: number, length: number, [columns, rows]: readonly [number, number]) {
  const positions: number[] = [], indices: number[] = [], placements = [];
  const dx = width / columns, dz = length / rows;
  const x = dx / 2 - 0.018, z = dz / 2 - 0.022;
  for (const [i, y] of [-0.047, 0.047].entries()) {
    positions.push(-x, y, -z, -x, y, z, x, y, z, x, y, -z);
    if (i) indices.push(4, 5, 6, 4, 6, 7);
    else indices.push(0, 2, 1, 0, 3, 2);
  }
  for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
    placements.push(location((column + 0.5 - columns / 2) * dx, 0, (row + 0.5 - rows / 2) * dz));
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const surface = coloredGeometry(geometry, "blue");
  const color = surface.getAttribute("color");
  for (let i = 0; i < color.count; i++) color.setXYZ(i, 0.46, 0.46, 0.46);
  const cells = new Mesh(surface, materials.M_palette);
  geometry.dispose();
  return repeatMesh(cells, "solar-cells", placements);
}

function solarPanel(name: string, width: number, length: number, grid: readonly [number, number], tier: TransitDetail, rollOut = false) {
  const parts = new Group();
  parts.add(boxCenter([width, 0.059, length], "nightSky" as PaletteKey, [0, 0, 0], 0.01));
  if (tier !== "far") for (const edge of [-1, 1]) {
    const rail = tier === "near" ? block : strip;
    parts.add(rail([0.065, 0.091, length], "offWhite", [edge * (width / 2 - 0.034), 0, 0]));
    if (tier === "near") parts.add(block([width - 0.08, 0.091, 0.089], "hull", [0, 0, edge * (length / 2 - 0.043)]));
  }
  if (rollOut && tier !== "far") {
    parts.add(block([0.25, 0.24, length], "darkGray", [0, -0.10, 0]));
    if (tier === "near") for (const x of [-width * 0.34, width * 0.34]) {
      parts.add(block([0.10, 0.13, length - 0.18], "hull", [x, -0.067, 0]));
    }
  }
  return fusedParts(name, parts, false, [solarCells(width - 0.17, length - 0.2, grid)]);
}

function orionWing(index: number, detail: Resolution, tier: TransitDetail) {
  const wing = new Group(), joint = new Group();
  wing.name = `orion-solar-wing-${index + 1}`;
  wing.position.x = -14.72;
  wing.rotation.x = Math.PI / 4 + index * Math.PI / 2;
  joint.add(block([0.43, 0.30, 1.0], "hull", [0, 0, 2.48]));
  if (tier !== "far") {
    const shaft = cylinder(-0.42, 0.42, 0.20, detail.small, "darkGray");
    shaft.position.z = 2.30;
    joint.add(shaft, block([0.68, 0.24, 0.37], "offWhite", [0, -0.16, 2.58]));
    if (tier === "near") for (const z of [4.73, 6.96]) {
      joint.add(block([1.3, 0.10, 0.24], "darkGray", [-0.11, -0.03, z]));
    }
  }
  wing.add(fusedParts("orion-wing-hinge", joint));
  for (let panel = 0; panel < 3; panel++) {
    const tile = solarPanel(`orion-panel-${panel + 1}`, 2, 2.12, detail.orionGrid, tier);
    tile.position.set(panel * -0.11, 0, 3.63 + panel * 2.23);
    wing.add(tile);
  }
  return wing;
}

const orionFlank: Profile = [[2.47, -13.39], [0.90, -10.47]];
const [[orionBaseRadius, orionBaseX], [orionNoseRadius, orionNoseX]] = orionFlank;
const orionFlankSlope = (orionNoseRadius - orionBaseRadius) / (orionNoseX - orionBaseX);
const orionFlankRadius = (x: number) => orionBaseRadius + orionFlankSlope * (x - orionBaseX);

function orion(detail: Resolution, tier: TransitDetail) {
  const { body, small } = detail;
  const nose = new Group(), service = new Group(), structure = new Group();
  structure.name = "orion";
  // Capsule apex docks to the habitat; the broad heat shield faces the service module.
  nose.add(
    axialProfile([[2.50, -13.52], ...orionFlank, [0.80, -10.33]], body, tier === "far" ? "white" : "hull"),
    axialProfile([[1.93, -13.78], [2.36, -13.71], [2.52, -13.57], [2.50, -13.52]], body, "darkGray"),
    cylinder(-10.37, -9.75, 0.73, small, "hull"),
    cylinder(-9.90, -9.59, 0.65, small, "darkGray"),
  );
  if (tier === "near") for (const angle of [-1.00, -1.41]) {
    nose.add(windowFrame(-11.40, orionFlankRadius(-11.40) + 0.05, angle, 0.53, 0.37, -Math.atan(orionFlankSlope)));
  }
  if (tier !== "far") for (const angle of [-2.2, -0.9, 0.9, 2.2]) {
    const dot = block([0.12, 0.07, 0.073], "cyan", [-9.91, 0.73 * Math.cos(angle), 0.73 * Math.sin(angle)]);
    dot.rotation.x = angle;
    nose.add(dot);
  }
  service.add(
    cylinder(-16.43, -13.73, 2.25, body, tier === "far" ? "offWhite" : "hull"),
    cylinder(-16.50, -16.36, 2.20, small, "darkGray"),
    axialProfile([[0.43, -16.52], [0.51, -16.84], [0.74, -17.38], [1.01, -17.82], [1.10, -17.85],
      [1.15, -17.81], [0.83, -17.28], [0.61, -16.79], [0.59, -16.45]], small, "darkGray"),
  );
  if (tier !== "far") for (let index = 0; index < 4; index++) {
    const rcs = location(-16.18, 0, 0, Math.PI * (index / 2 + 0.52));
    rcs.add(boxCenter([0.49, 0.34, 0.49], "darkGray", [0, 2.23, 0], 0.07));
    for (const z of [-0.15, 0.15]) {
      const nozzle = axialProfile([[0.047, 0], [0.080, 0.12], [0.094, 0.133], [0.11, 0.109], [0.07, 0]], 6, "hull");
      nozzle.rotation.z = Math.PI / 2;
      nozzle.position.set(0, 2.39, z);
      rcs.add(nozzle);
    }
    service.add(rcs);
  }
  const crewTiles = tier === "near" ? blankets([
    [-13.36, -12.49], [-12.42, -11.40], [-11.33, -10.48],
  ].map(([start, end]) => ({
    start, end, radiusA: orionFlankRadius(start), radiusB: orionFlankRadius(end),
  })), 10, "white", false) : [];
  const serviceTiles = tier === "far" ? [] : blankets([
    { start: -16.34, end: -15.27, radiusA: 2.25, radiusB: 2.25 },
    { start: -15.21, end: -13.81, radiusA: 2.25, radiusB: 2.25 },
  ], tier === "near" ? 12 : 6, "offWhite", false);
  const module = fusedParts("orion-service-module", service, tier !== "far", serviceTiles);
  for (let i = 0; i < 4; i++) module.add(orionWing(i, detail, tier));
  structure.add(fusedParts("orion-crew-module", nose, tier === "near", crewTiles), module);
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
      [2.37, 7.32], [1.71, 7.65], [0, 7.65]], body, tier === "near" ? "hull" : "white"),
  );
  if (tier !== "far") for (let i = 0; i <= 10; i++) {
    const x = -8.55 + i * 1.5;
    parts.add(axialProfile([[2.562, x - 0.026], [2.562, x + 0.026]], tier === "near" ? body : small, "darkGray"));
  }
  for (let i = 0; i < (tier === "far" ? 4 : 6); i++) {
    const angle = (i + 0.5) * Math.PI / (tier === "far" ? 2 : 3);
    parts.add(tank(2.52, 5.1, 0.55, angle, 2.62, small));
    if (tier === "near") for (const x of [0.89, 4.04]) {
      parts.add(axialProfile([[0.53, x - 0.14], [0.584, x - 0.092], [0.584, x + 0.092], [0.53, x + 0.14]],
        8, "gray", 0, 2.62 * Math.cos(angle), 2.62 * Math.sin(angle)));
      const foot = location(x, 0, 0, angle);
      foot.add(boxCenter([0.28, 0.18, 1.03], "darkGray", [0, 2.45, 0], 0.035));
      parts.add(foot);
    }
  }
  for (const side of [-1, 1]) {
    const radiator = new Group();
    radiator.position.set(1.15, -0.87, side * 2.68);
    radiator.rotation.x = side * -0.24;
    radiator.add(block([9.6, 0.16, 1.49], "darkGray", [0, 0, 0]));
    const strips = tier === "near" ? 16 : tier === "middle" ? 5 : 0;
    for (let i = 0; i < strips; i++) {
      radiator.add(strip([9.45 / strips - 0.035, 0.036, 1.30], "hull", [(i + 0.5) * 9.45 / strips - 4.725, 0.08, 0]));
    }
    parts.add(radiator);
  }
  if (tier === "near") for (const angle of [-1.25, 1.25]) for (const x of [-7.38, -4.40, -2.87]) {
    parts.add(windowFrame(x, 2.63, angle, 0.52, 0.31));
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
  if (tier === "near") {
    const lip = axialProfile([[1.045, 0.29], [1.076, 0.30], [1.076, 0.36], [1.042, 0.38]], small, "hull");
    lip.rotation.z = Math.PI / 2;
    lip.position.y = 1.24;
    antenna.add(lip);
    for (const angle of [0, Math.PI * 2 / 3, Math.PI * 4 / 3]) {
      antenna.add(beam([0.88 * Math.sin(angle), 1.41, 0.88 * Math.cos(angle)], [0, 1.91, 0], 0.044, "gray"));
    }
  }
  parts.add(antenna);
  const tiles = tier === "near" ? blankets(Array.from({ length: 10 }, (_, i) => ({
    start: -8.49 + 1.5 * i, end: -7.11 + 1.5 * i, radiusA: 2.55, radiusB: 2.55,
  })), 12, "white", true) : [];
  if (tier === "near") {
    const rail = pipe([[-0.48, 0, 0], [-0.37, 0.19, 0], [0.37, 0.19, 0], [0.48, 0, 0]], 0.042, 4, "hull");
    const bolts = axialProfile([[0.043, -0.024], [0.049, 0.006], [0.035, 0.022], [0, 0.022]], 5, "darkGray");
    const railLocations = [], boltLocations = [];
    for (const [row, angle] of [-2.20, -0.50, 0.50, 2.20].entries()) for (let bay = 0; bay < 10; bay++) {
      const x = -7.85 + bay * 1.5;
      if ((bay + row) % 3 === 0) railLocations.push(location(x, 2.60 * Math.cos(angle), 2.60 * Math.sin(angle), angle));
      const bolt = location(x - 0.55, 2.61 * Math.cos(angle), 2.61 * Math.sin(angle));
      bolt.quaternion.setFromUnitVectors(new Vector3(1, 0, 0), new Vector3(0, Math.cos(angle), Math.sin(angle)));
      boltLocations.push(bolt);
    }
    tiles.push(repeatMesh(rail, "hull-grab-rails", railLocations), repeatMesh(bolts, "blanket-fasteners", boltLocations));
  }
  const habitat = fusedParts("dst-transit-habitat", parts, tier !== "far", tiles);
  for (const [name, color, sign] of [["nav-red", "doorClosed", -1], ["nav-green", "doorOpen", 1]] as const) {
    const nav = block([0.14, 0.12, 0.12], color, [-1.93, 0.34, sign * 2.63]);
    nav.name = name;
    habitat.add(nav);
  }
  return habitat;
}

function hallThrusters(segments: number, tier: TransitDetail) {
  const mount = new Group();
  const body = axialProfile([[0.43, 0], [0.64, 0.04], [0.75, 0.27], [0.75, 0.55], [0.66, 0.68],
    [0.59, 0.68], [0.54, 0.63], [0.54, 0.51]], segments, "darkGray");
  const center = axialProfile([[0.46, 0.47], [0.44, 0.61], [0.39, 0.64], [0, 0.64]], segments, "black");
  const channel = axialProfile([[0.45, 0.63], [0.545, 0.645], [0.57, 0.654]], segments * 2, "xenonGlow");
  // A +X-facing annulus, not a cap. The atlas provides the emission.
  channel.geometry.index!.array.reverse();
  const cathode = cylinder(-0.14, 0.27, 0.105, 6, "hull");
  const plumeGeometry = new LatheGeometry([
    new Vector2(0.54, 0.66), new Vector2(0.62, 0.97), new Vector2(0.76, 1.50),
    new Vector2(1.02, 2.35), new Vector2(1.54, 4.39),
  ], Math.max(segments, 8));
  plumeGeometry.rotateZ(-Math.PI / 2);
  const plume = new Mesh(plumeGeometry, materials.M_hallPlume);
  const placements = [], cathodes = [];
  for (const y of [-1.04, 1.04]) for (const z of [-1.04, 1.04]) {
    placements.push(location(15.38, y, z));
    cathodes.push(location(15.72, y, z + Math.sign(z) * 0.75));
  }
  mount.name = "hall-propulsion";
  mount.add(
    repeatMesh(body, "hall-chamfered-bodies", placements), repeatMesh(center, "hall-dark-poles", placements),
    repeatMesh(channel, "hall-emissive-channels", placements), repeatMesh(plume, "hall-plumes", placements),
  );
  if (tier !== "far") mount.add(repeatMesh(cathode, "hall-external-cathodes", cathodes));
  return mount;
}

function sternVentGrilles() {
  const parts = new Group();
  parts.add(boxCenter([0.88, 0.12, 0.80], "darkGray", [0, 2.36, 0], 0.036));
  for (const pitch of [-3, -1, 1, 3]) {
    parts.add(
      strip([0.046, 0.078, 0.56], "gray", [pitch * 0.095, 2.445, 0]),
      strip([0.64, 0.074, 0.046], "gray", [0, 2.452, pitch * 0.085]),
    );
  }
  const grille = fusedParts("stern-vent", parts, true).children[0] as Mesh;
  return repeatMesh(grille, "stern-vent-grilles",
    Array.from({ length: 4 }, (_, i) => location(14.48, 0, 0, Math.PI / 4 + i * Math.PI / 2)));
}

function propulsion(detail: Resolution, tier: TransitDetail) {
  const { body, small } = detail;
  const parts = new Group();
  parts.add(
    cylinder(7.48, 7.85, 1.76, tier === "far" ? small : body, "hull"),
    cylinder(12.73, 13.25, 1.88, tier === "far" ? small : body, "hull"),
    axialProfile([[0, 13.22], [1.49, 13.22], [2.38, 13.74], [2.43, 14.96],
      [2.30, 15.35], [0, 15.48]], body, "gray"),
  );
  for (let i = 0; i < 4; i++) {
    const angle = Math.PI / 4 + i * Math.PI / 2;
    const y = Math.cos(angle), z = Math.sin(angle);
    const next = angle + Math.PI / 2;
    parts.add(beam([7.68, y * 1.59, z * 1.59], [13.04, y * 1.86, z * 1.86], 0.19, "hull"));
    if (tier !== "far") {
      parts.add(beam([7.77, y * 1.60, z * 1.60], [12.98, Math.cos(next) * 1.83, Math.sin(next) * 1.83], 0.12, "darkGray"));
      parts.add(axialProfile([[0, -0.77], [0.42, -0.63], [0.66, -0.40], [0.77, 0], [0.66, 0.4],
        [0.42, 0.63], [0, 0.77]], small, "offWhite", i % 2 ? 11.77 : 9.22, y * 0.88, z * 0.88));
    }
    if (tier === "near") {
      parts.add(beam([10.53, y * 1.73, z * 1.73], [10.53, Math.cos(next) * 1.73, Math.sin(next) * 1.73], 0.16, "hull"));
    }
  }
  const module = fusedParts("dst-electric-propulsion", parts, tier !== "far", tier === "near" ? [sternVentGrilles()] : []);
  module.add(hallThrusters(tier === "far" ? 5 : small, tier));
  for (let i = 0; i < 2; i++) {
    const wing = new Group(), support = new Group();
    wing.name = `dst-solar-wing-${i + 1}`;
    wing.position.x = 10.74;
    wing.rotation.set(-0.53, i * Math.PI, 0, "XYZ");
    support.add(boxCenter([0.70, 0.45, 3.10], "darkGray", [0, 0, 2.52], 0.09));
    if (tier !== "far") {
      const drum = cylinder(-3.70, 3.70, 0.235, small, "hull");
      drum.position.set(0, -0.07, 3.81);
      support.add(drum, beam([-3.48, 0, 3.87], [0, 0, 2.32], 0.15, "gray"),
        beam([3.48, 0, 3.87], [0, 0, 2.32], 0.15, "gray"));
    }
    const array = solarPanel("roll-out-array", 7.4, 20.0, detail.dstGrid, tier, true);
    array.position.z = 13.78;
    wing.add(fusedParts("dst-wing-boom", support), array);
    module.add(wing);
  }
  return module;
}

function buildTransit(tier: TransitDetail) {
  const ship = new Group(), detail = resolution[tier];
  ship.add(orion(detail, tier), habitat(detail, tier), propulsion(detail, tier));
  return alignBaseCenter(ship);
}

export function registerMarsTransit(registry: PieceRegistry): void {
  registry.register<{ detail: TransitDetail }>("MV-09", {
    parse: input => ({ detail: parseChoice(parseRecord(input, ["detail"]).detail, detailLevels, "near") }),
    variants: { near: { detail: "near" } },
    metadata: { category: "transitSpacecraft", pivot: "base-center" },
    build: ({ detail }) => buildTransit(detail),
  });
  registry.register("BG-01", {
    parse: input => parseRecord(input, []),
    variants: { standard: {} },
    metadata: { category: "terrain", pivot: "base-center" },
    build: buildEarth,
  });
}
