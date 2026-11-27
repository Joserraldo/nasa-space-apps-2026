import { BufferGeometry, Color, Float32BufferAttribute, Group, Mesh, Vector3 } from "three";
import { paletteHex } from "../../../materials/palette";
import { materials } from "../../../materials/shared";
import { coloredGeometry } from "../../../materials/uv";
import { cachedGeometry } from "../../primitives/cache";
import type { Point3 } from "../../primitives/details";
import type { HiddenFace } from "../../primitives/normals";
import type { PieceRegistry } from "../../registry";
import { alignBaseCenter, parseChoice, parseRecord, type PaletteKey } from "../station/helpers";
import {
  addRecessedLouvers,
  buildArticulatedWheel,
  fuseVehicleBody,
  latheAlongX,
  vColorBox,
  vehicleDetailLevels,
  vStrip,
  vStrut,
  vWhiteBox,
  type VehicleDetail,
} from "./rover-truck";

export const strandedStates = ["stranded", "rescued"] as const;
export type StrandedState = (typeof strandedStates)[number];

export interface StrandedRoverParams {
  state: StrandedState;
  detail: VehicleDetail;
}

export function parseStrandedRover(input: unknown): StrandedRoverParams {
  const rec = parseRecord(input, ["state", "detail"]);
  return {
    state: parseChoice(rec.state, strandedStates, "stranded"),
    detail: parseChoice(rec.detail, vehicleDetailLevels, "near"),
  };
}

/**
 * Tint upward-facing hull vertices with a zero-thickness matte Martian dust film (never protruding slabs!)
 * so horizontal top surfaces read naturally dusty in `stranded` state while vertical walls stay crisp.
 */
function applyUpwardDustFilm(geometry: BufferGeometry): void {
  const norm = geometry.getAttribute("normal");
  const pos = geometry.getAttribute("position");
  const col = geometry.getAttribute("color");
  if (!norm || !pos || !col) return;
  const dustR = 0.72;
  const dustG = 0.53;
  const dustB = 0.55;
  for (let i = 0; i < norm.count; i++) {
    const ny = norm.getY(i);
    if (ny <= 0.34) continue;
    const px = pos.getX(i);
    const pz = pos.getZ(i);
    const streak = 0.84 + 0.16 * Math.sin(px * 3.8 + pz * 2.9);
    const w = Math.min(0.68, ((ny - 0.34) / 0.66) * 0.64 * streak);
    const r = col.getX(i);
    const g = col.getY(i);
    const b = col.getZ(i);
    col.setXYZ(
      i,
      r * (1 - w) + r * dustR * w,
      g * (1 - w) + g * dustG * w,
      b * (1 - w) + b * dustB * w,
    );
  }
  col.needsUpdate = true;
}

/**
 * Build a solar cell box whose upward face blends smoothly between clean `blue` photovoltaic glass
 * and powdery Martian `oxide` dust along the wing's wind-drift gradient — zero tile jumps and zero Z-fighting!
 */
function buildSolarCellMesh(
  size: [number, number, number],
  center: Point3,
  wingSize: [number, number],
  sideSign: -1 | 1,
  dusty: boolean,
): Mesh {
  if (!dusty) {
    return vStrip(size, "blue", center);
  }

  const baseMesh = vStrip(size, "white", center);
  const geo = baseMesh.geometry;
  const pos = geo.getAttribute("position");
  const norm = geo.getAttribute("normal");
  const col = geo.getAttribute("color");

  const whiteLin = new Color(paletteHex("white"));
  const blueLin = new Color(paletteHex("blue"));
  const dustLin = new Color(paletteHex("oxide")).multiplyScalar(0.95);
  const darkLin = new Color(paletteHex("darkGray")).multiplyScalar(0.45);
  const mixed = new Color();

  const [innerW, innerL] = wingSize;
  for (let i = 0; i < pos.count; i++) {
    const ny = norm.getY(i);
    if (ny < 0.5) {
      col.setXYZ(i, darkLin.r / whiteLin.r, darkLin.g / whiteLin.g, darkLin.b / whiteLin.b);
      continue;
    }
    const lx = center[0] + pos.getX(i);
    const lz = center[2] + pos.getZ(i);
    // Normalized wing coordinates u in [0=inner .. 1=outer tip], v in [0=rear .. 1=front]
    const u = Math.max(0, Math.min(1, (sideSign * lx + innerW / 2) / innerW));
    const v = Math.max(0, Math.min(1, (lz + innerL / 2) / innerL));
    // Smooth organic wind-swept dust veil: thickest near the inner spine & rear, thinning smoothly toward the windward outer-front edge
    const ripple = 0.06 * Math.sin(lx * 7.5 + lz * 5.2);
    const clearFactor = Math.pow(Math.max(0, u * 0.58 + v * 0.42 + ripple), 1.65);
    const dustWeight = Math.max(0.22, Math.min(0.88, 0.90 - clearFactor * 0.66));
    mixed.copy(blueLin).lerp(dustLin, dustWeight);
    col.setXYZ(i, mixed.r / whiteLin.r, mixed.g / whiteLin.g, mixed.b / whiteLin.b);
  }
  col.needsUpdate = true;
  return baseMesh;
}

function buildSolarWing(
  target: Group,
  sideSign: -1 | 1,
  detail: VehicleDetail,
  dusty: boolean,
): void {
  const wing = new Group();
  const w = 0.86;
  const len = 1.62;
  const border = 0.055;
  const innerW = w - border * 2;
  const innerL = len - border * 2;

  // Recessed dark backing plate (`top = +0.002`) + 4 beveled `hull` perimeter frame rails (`top = +0.028`).
  // Zero overlapping full-area planes -> 18 mm real depth clearance under every photovoltaic cell (zero Z-fighting!).
  wing.add(vStrip([w - 0.03, 0.028, len - 0.03], "black", [0, -0.012, 0]));
  wing.add(vColorBox([border, 0.054, len], "hull", [-w / 2 + border / 2, 0.001, 0], 0.012));
  wing.add(vColorBox([border, 0.054, len], "hull", [w / 2 - border / 2, 0.001, 0], 0.012));
  wing.add(vColorBox([innerW, 0.054, border], "hull", [0, 0.001, len / 2 - border / 2], 0.012, ["left", "right"]));
  wing.add(vColorBox([innerW, 0.054, border], "hull", [0, 0.001, -len / 2 + border / 2], 0.012, ["left", "right"]));

  const cols = detail === "near" ? 4 : detail === "middle" ? 2 : 1;
  const rows = detail === "near" ? 6 : detail === "middle" ? 3 : 2;
  const cw = innerW / cols;
  const cl = innerL / rows;
  const gap = detail === "far" ? 0.008 : 0.014;
  // Each cell spans Y = +0.002 .. +0.020 (18 mm proud of the dark seam bed, flush inside the +0.028 hull rim)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = -innerW / 2 + (c + 0.5) * cw;
      const cz = -innerL / 2 + (r + 0.5) * cl;
      wing.add(
        buildSolarCellMesh(
          [cw - gap, 0.018, cl - gap],
          [cx, 0.011, cz],
          [innerW, innerL],
          sideSign,
          dusty,
        ),
      );
    }
  }

  if (detail !== "far") {
    wing.add(vColorBox([0.14, 0.065, 0.22], "darkGray", [-sideSign * (w * 0.42), -0.038, 0.42], 0.012));
    wing.add(vColorBox([0.14, 0.065, 0.22], "darkGray", [-sideSign * (w * 0.42), -0.038, -0.42], 0.012));
  }

  wing.position.set(sideSign * 0.88, 1.16, -0.04);
  wing.rotation.z = -sideSign * 0.05;
  target.add(wing);
}

/**
 * Smooth, soft crescent sand/dust drift banked against the sunken front-right wheel (`wheel_fr`)
 * so anyone immediately sees the front wheel is trapped in soft Martian dust (zero angular rock facets!).
 */
function buildWheelDustDrift(wheelPos: Point3, wheelRadius: number, detail: VehicleDetail): Mesh {
  const segs = detail === "near" ? 16 : detail === "middle" ? 12 : 8;
  const rings = detail === "near" ? 4 : 3;
  const geo = cachedGeometry(["mv11WheelDustDriftV3", segs, rings, wheelRadius], () => {
    const rx = 0.72;
    const rz = 0.78;
    const baseY = -wheelRadius + 0.03; // Slightly above wheel_fr bottom so wheel_fr sets min.y, deep enough to embed in ground
    const crestY = -wheelRadius + 0.37; // Rises ~16 cm above ground right against the front & flanks of wheel_fr
    const cx0 = -0.02;
    const cz0 = 0.14; // Banked directly against the front tread & sides of the bogged-down wheel!
    const positions: number[] = [cx0, crestY, cz0];
    const indices: number[] = [];

    for (let ir = 1; ir <= rings; ir++) {
      const t = ir / rings;
      for (let is = 0; is < segs; is++) {
        const phi = (is / segs) * Math.PI * 2;
        const dirX = Math.cos(phi);
        const dirZ = Math.sin(phi);
        // Wide wind-blown crescent wrapping the front (+Z) and outer (+X) flank of wheel_fr, tapered on inner -X
        const radScale = 1 + 0.22 * Math.max(0, dirZ) + 0.14 * Math.max(0, dirX) - 0.26 * Math.max(0, -dirX);
        const px = cx0 + dirX * rx * t * radScale;
        const pz = cz0 + dirZ * rz * t * radScale;
        // Gentle low-angle sand-drift slope (`cos` bell raised to 1.55) so it reads as soft drifted dust, never a cone or rock
        const bell = Math.pow(0.5 * (1 + Math.cos(Math.PI * t)), 1.55);
        const windRipple = 1 + 0.08 * Math.cos(phi - 0.9) * (1 - t);
        const py = baseY + (crestY - baseY) * bell * windRipple;
        positions.push(px, py, pz);
      }
    }

    for (let is = 0; is < segs; is++) {
      const next = (is + 1) % segs;
      indices.push(0, 1 + next, 1 + is);
    }
    for (let ir = 0; ir < rings - 1; ir++) {
      const r0 = 1 + ir * segs;
      const r1 = 1 + (ir + 1) * segs;
      for (let is = 0; is < segs; is++) {
        const next = (is + 1) % segs;
        indices.push(r0 + is, r0 + next, r1 + next);
        indices.push(r0 + is, r1 + next, r1 + is);
      }
    }
    const botCenterIdx = positions.length / 3;
    positions.push(cx0, baseY, cz0);
    const outerStart = 1 + (rings - 1) * segs;
    for (let is = 0; is < segs; is++) {
      const next = (is + 1) % segs;
      indices.push(botCenterIdx, outerStart + is, outerStart + next);
    }

    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(positions, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    const colored = coloredGeometry(g, "oxide", { weld: true });
    g.dispose();

    // Match M_terrain's Jezero regolith luminance (`0.68..0.84`) so the drift blends naturally into the sand floor
    const col = colored.getAttribute("color");
    const posAttr = colored.getAttribute("position");
    for (let i = 0; i < posAttr.count; i++) {
      const py = posAttr.getY(i);
      const pz = posAttr.getZ(i);
      const hNorm = Math.max(0, Math.min(1, (py - baseY) / (crestY - baseY)));
      const shade = 0.69 + 0.16 * hNorm + 0.03 * pz;
      col.setXYZ(i, col.getX(i) * shade, col.getY(i) * (shade * 0.97), col.getZ(i) * (shade * 0.99));
    }
    col.needsUpdate = true;
    return colored;
  });

  const mesh = new Mesh(geo, materials.M_palette);
  mesh.name = "mv11-wheel-dust-drift";
  mesh.position.set(wheelPos[0], wheelPos[1], wheelPos[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function buildStrandedRover({ state, detail }: StrandedRoverParams): Group {
  const isStranded = state === "stranded";
  const root = new Group();
  root.name = `MV-11_${state}_${detail}`;
  root.userData.state = state;

  // Whole-rover tilt in `stranded` state: ~7.2 deg lateral roll toward the right (+X) + ~3.6 deg forward pitch
  // so the ENTIRE rover (chassis, wheels, fenders, solar wings & mast) clearly leans into its buried front-right wheel!
  const roverTilt = new Group();
  roverTilt.name = "mv11-rover-tilt";
  if (isStranded) {
    roverTilt.rotation.order = "ZXY";
    roverTilt.rotation.z = -0.126; // -7.22 deg roll right (inside 6-8 deg target!)
    roverTilt.rotation.x = 0.063;  // +3.61 deg nose-down pitch toward sunken front-right wheel
  }
  roverTilt.updateMatrixWorld(true);
  const tiltToRoot = (lx: number, ly: number, lz: number): Point3 => {
    const v = new Vector3(lx, ly, lz).applyMatrix4(roverTilt.matrixWorld);
    return [v.x, v.y, v.z];
  };

  const wheelRadius = 0.34;
  const wheelWidth = 0.26;
  const trackX = 0.88;
  const axleZ = [1.06, -0.02, -1.08] as const;
  const mastX = 0.18;
  const mastZ = 0.58;

  // In `stranded`, `fr` bogie also drops an extra 6 cm into the soft sand pocket while the whole rover rolls 7.2 deg!
  const wheelDefs: readonly [string, -1 | 1, number, number][] = [
    ["fl", -1, axleZ[0], wheelRadius],
    ["fr", 1, axleZ[0], wheelRadius - (isStranded ? 0.06 : 0)],
    ["ml", -1, axleZ[1], wheelRadius],
    ["mr", 1, axleZ[1], wheelRadius - (isStranded ? 0.015 : 0)],
    ["rl", -1, axleZ[2], wheelRadius],
    ["rr", 1, axleZ[2], wheelRadius],
  ];

  const bodyGeo = cachedGeometry(["mv11BodyGeoV4", state, detail], () => {
    const bodyOpaque = new Group();
    const bodyEmissive = new Group();
    const wheelProxies = new Group();

  // 1. Central Warm Electronics Box (WEB)
  bodyOpaque.add(vColorBox([1.06, 0.56, 1.98], "darkGray", [0, 0.84, 0.0], 0.055));
  bodyOpaque.add(vColorBox([0.88, 0.16, 1.76], "black", [0, 0.52, 0.0], 0.03, ["top"]));

  const nosePlate = vWhiteBox([0.96, 0.34, 0.24], [0, 0.86, 1.04], 0.035, ["back"]);
  nosePlate.rotation.x = 0.18;
  bodyOpaque.add(nosePlate);
  bodyOpaque.add(vColorBox([1.14, 0.22, 0.26], "hull", [0, 0.64, 1.12], 0.035));

  for (const side of [-1, 1] as const) {
    const omitIn: HiddenFace[] = side > 0 ? ["left"] : ["right"];
    bodyOpaque.add(vWhiteBox([0.08, 0.44, 0.82], [side * 0.55, 0.86, 0.46], 0.022, omitIn));
    bodyOpaque.add(vColorBox([0.08, 0.44, 0.82], "hull", [side * 0.55, 0.86, -0.46], 0.022, omitIn));

    // Rocker-bogie suspension connecting body shoulder to each wheel axle
    const fY = side < 0 ? wheelDefs[0][3] : wheelDefs[1][3];
    const mY = side < 0 ? wheelDefs[2][3] : wheelDefs[3][3];
    const rY = side < 0 ? wheelDefs[4][3] : wheelDefs[5][3];
    const mainPivot: Point3 = [side * 0.62, 0.88, 0.24];
    const rearBogiePivot: Point3 = [side * 0.68, (mainPivot[1] + mY) * 0.52, -0.54];

    bodyOpaque.add(vColorBox([0.14, 0.18, 0.18], "hull", mainPivot, 0.028));
    bodyOpaque.add(vStrut(mainPivot, [side * 0.74, fY + 0.08, axleZ[0]], 0.082, "darkGray"));
    bodyOpaque.add(vStrut([side * 0.74, fY + 0.08, axleZ[0]], [side * 0.78, fY, axleZ[0]], 0.078, "gray"));
    bodyOpaque.add(vStrut(mainPivot, rearBogiePivot, 0.082, "darkGray"));
    bodyOpaque.add(vColorBox([0.12, 0.14, 0.16], "hull", rearBogiePivot, 0.024));
    bodyOpaque.add(vStrut(rearBogiePivot, [side * 0.78, mY, axleZ[1]], 0.072, "darkGray"));
    bodyOpaque.add(vStrut(rearBogiePivot, [side * 0.78, rY, axleZ[2]], 0.072, "darkGray"));

    // Clean beveled wheel-arch mudguards tilted coherently with the rover
    for (const [, , wz, wy] of wheelDefs.filter(([, s]) => s === side)) {
      bodyOpaque.add(vColorBox([0.30, 0.055, 0.54], "hull", [side * 0.88, wy + 0.39, wz], 0.015));
    }
  }

  // 2. Deck Center Spine + Twin Gull-Wing Solar Panels (z-fight-free recessed frame, smooth dust veil in `stranded`)
  bodyOpaque.add(vWhiteBox([0.88, 0.10, 1.84], [0, 1.15, -0.02], 0.026, ["bottom"]));
  buildSolarWing(bodyOpaque, -1, detail, isStranded);
  buildSolarWing(bodyOpaque, 1, detail, isStranded);

  // Rear RTG / battery radiator housing, louvers & hazard bar
  bodyOpaque.add(vColorBox([0.84, 0.36, 0.32], "hull", [0, 0.84, -1.10], 0.035, ["front"]));
  if (detail !== "far") {
    addRecessedLouvers(bodyOpaque, 0.58, 0.22, detail === "near" ? 3 : 2, [0, 0.84, -1.26], Math.PI);
  }
  const statusAccent: PaletteKey = isStranded ? "warning" : "cyan";
  bodyOpaque.add(vStrip([0.62, 0.09, 0.06], "black", [0, 1.06, -1.25]));
  bodyEmissive.add(vStrip([0.52, 0.045, 0.04], statusAccent, [0, 1.06, -1.27]));

  // 3. Front Stereo Hazcam, Tow Hook, Headlights & Articulated Sample Arm
  for (const side of [-1, 1] as const) {
    bodyOpaque.add(vColorBox([0.28, 0.14, 0.09], "black", [side * 0.36, 0.66, 1.25], 0.016, ["back"]));
    if (isStranded) {
      bodyOpaque.add(vStrip([0.20, 0.07, 0.04], "darkGray", [side * 0.36, 0.66, 1.29]));
    } else {
      bodyEmissive.add(vStrip([0.20, 0.07, 0.04], "cyan", [side * 0.36, 0.66, 1.29]));
    }
    bodyOpaque.add(vColorBox([0.08, 0.10, 0.14], "gray", [side * 0.14, 0.58, 1.27], 0.018, ["back"]));
  }

  if (detail !== "far") {
    bodyOpaque.add(vColorBox([0.18, 0.16, 0.18], "darkGray", [-0.24, 0.72, 1.22], 0.025, ["back"]));
    const armTipY = isStranded ? 0.58 : 0.76;
    bodyOpaque.add(vStrut([-0.24, 0.72, 1.24], [-0.20, 0.82, 1.50], 0.06, "gray"));
    bodyOpaque.add(vStrut([-0.20, 0.82, 1.50], [-0.04, armTipY, 1.56], 0.055, "darkGray"));
    bodyOpaque.add(vColorBox([0.14, 0.12, 0.14], "hull", [-0.02, armTipY, 1.58], 0.022));
  }

  // 4. Pancam Camera Mast & High-Gain Dish Antenna
  bodyOpaque.add(vColorBox([0.16, 0.12, 0.16], "darkGray", [mastX, 1.22, mastZ], 0.02, ["bottom"]));
  bodyOpaque.add(vStrut([mastX, 1.24, mastZ], [mastX, 1.68, mastZ + (isStranded ? 0.05 : 0)], 0.085, "gray"));

  const head = new Group();
  head.add(vWhiteBox([0.46, 0.22, 0.26], [0, 0, 0], 0.035));
  head.add(vColorBox([0.38, 0.12, 0.06], "black", [0, 0.01, 0.12], 0.012, ["back"]));
  for (const lx of [-0.11, 0.11]) {
    head.add(vStrip([0.09, 0.07, 0.04], isStranded ? "darkGray" : "teal", [lx, 0.01, 0.145]));
  }
  if (!isStranded) {
    bodyEmissive.add(vStrip([0.16, 0.035, 0.04], "cyan", [mastX, 1.66, mastZ + 0.15]));
  }
  head.position.set(mastX, 1.74, mastZ + (isStranded ? 0.06 : 0));
  if (isStranded) head.rotation.x = 0.22;
  bodyOpaque.add(head);

  if (detail !== "far") {
    const dishSegs = detail === "near" ? 10 : 6;
    bodyOpaque.add(vStrut([-0.32, 1.20, -0.62], [-0.32, 1.44, -0.62], 0.055, "darkGray"));
    const dish = latheAlongX(
      [[0, 0], [0.16, 0.025], [0.28, 0.085], [0.28, 0.105], [0.14, 0.045], [0, 0.02]],
      dishSegs,
      "offWhite",
    );
    dish.rotation.set(0.35, 0, Math.PI / 2);
    dish.position.set(-0.32, 1.46, -0.62);
    bodyOpaque.add(dish);
  }

    roverTilt.add(bodyOpaque, bodyEmissive);
    roverTilt.updateMatrixWorld(true);

    const allOpaque = new Group();
    const allEmissive = new Group();
    bodyOpaque.traverse(node => {
      if (!(node instanceof Mesh)) return;
      const c = node.geometry.clone();
      c.applyMatrix4(node.matrixWorld);
      allOpaque.add(new Mesh(c, materials.M_palette));
    });
    bodyEmissive.traverse(node => {
      if (!(node instanceof Mesh)) return;
      const c = node.geometry.clone();
      c.applyMatrix4(node.matrixWorld);
      allEmissive.add(new Mesh(c, materials.M_palette));
    });

    if (detail === "near") {
      for (const [, sideSign, wz, wy] of wheelDefs) {
        const wp = tiltToRoot(sideSign * trackX, wy, wz);
        const proxy = latheAlongX(
          [[0, -wheelWidth / 2], [wheelRadius, -wheelWidth / 2], [wheelRadius, wheelWidth / 2], [0, wheelWidth / 2]],
          8,
          "black",
          wp,
        );
        if (isStranded) {
          proxy.rotation.order = "ZXY";
          proxy.rotation.z = roverTilt.rotation.z;
          proxy.rotation.x = roverTilt.rotation.x;
        }
        wheelProxies.add(proxy);
      }
    }

    const fused = fuseVehicleBody(
      `mv11-body-${state}`,
      allOpaque,
      allEmissive,
      wheelProxies,
      detail === "near",
      0.75,
    ).geometry;
    if (isStranded) {
      applyUpwardDustFilm(fused);
    }
    return fused;
  });

  const bodyMesh = new Mesh(bodyGeo, materials.M_palette);
  bodyMesh.name = `mv11-body-${state}`;
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  root.add(bodyMesh);

  // Smooth wind-blown dust drift mound banked against the sunken front-right wheel (`wheel_fr`) in `stranded` state!
  if (isStranded) {
    const frWorldPos = tiltToRoot(trackX, wheelDefs[1][3], axleZ[0]);
    root.add(buildWheelDustDrift(frWorldPos, wheelRadius, detail));
  }

  // Top mast status beacon (`warning` amber blinking in `stranded`, steady `cyan` in `rescued`)
  const beaconMatColor: PaletteKey = isStranded ? "warning" : "cyan";
  const beaconPos = tiltToRoot(mastX, 1.88, mastZ + (isStranded ? 0.04 : 0));
  const beaconMesh = vColorBox([0.12, 0.085, 0.12], beaconMatColor, beaconPos, 0.022);
  beaconMesh.name = isStranded ? "stranded-amber-beacon" : "rescued-cyan-beacon";
  if (isStranded) {
    beaconMesh.rotation.order = "ZXY";
    beaconMesh.rotation.z = roverTilt.rotation.z;
    beaconMesh.rotation.x = roverTilt.rotation.x;
  }
  root.add(beaconMesh);

  // Attach 6 independent articulated wheels inside tilted axle carriers so the wheels lean with the rover
  // AND still spin purely around their own local X axle (`wheel.rotation.x`) with zero center drift!
  for (const [wid, sideSign, wz, wy] of wheelDefs) {
    const wheel = buildArticulatedWheel({
      cacheKey: `mv11_${state}`,
      wheelId: wid,
      radius: wheelRadius,
      width: wheelWidth,
      sideSign,
      detail,
      rimColor: "hull",
      accentColor: isStranded ? "darkGray" : "cyan",
    });
    const wp = tiltToRoot(sideSign * trackX, wy, wz);
    if (isStranded) {
      const carrier = new Group();
      carrier.name = `wheel_carrier_${wid}`;
      carrier.position.set(wp[0], wp[1], wp[2]);
      carrier.rotation.order = "ZXY";
      carrier.rotation.z = roverTilt.rotation.z;
      carrier.rotation.x = roverTilt.rotation.x;
      carrier.add(wheel);
      root.add(carrier);
    } else {
      wheel.position.set(wp[0], wp[1], wp[2]);
      root.add(wheel);
    }
  }

  const aligned = alignBaseCenter(root);
  aligned.userData.forward = [0, 0, 1];
  return aligned;
}

export function registerMarsStrandedRover(registry: PieceRegistry): void {
  registry.register<StrandedRoverParams>("MV-11", {
    parse: parseStrandedRover,
    variants: {
      stranded: { state: "stranded", detail: "near" },
      rescued: { state: "rescued", detail: "near" },
    },
    metadata: { category: "vehicle", pivot: "base-center" },
    build: buildStrandedRover,
  });
}
