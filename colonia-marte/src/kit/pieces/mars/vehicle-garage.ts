import { Group, Mesh, PlaneGeometry, type BufferGeometry } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { paletteUV } from "../../../materials/atlas";
import { decalScreenGeometry, screenGeometry, type DecalType } from "../../../materials/screens";
import { materials } from "../../../materials/shared";
import { coloredGeometry } from "../../../materials/uv";
import { pipeRun, polygonRing, polygonShape } from "../../primitives";
import { cachedGeometry } from "../../primitives/cache";
import type { Point3 } from "../../primitives/details";
import type { PieceRegistry } from "../../registry";
import { alignBaseCenter, boostVertexLuminance, extrudedMesh, parseChoice, parseRecord } from "../station/helpers";
import { valveRedBoxCenter } from "./mars-helpers";
import {
  fuseVehicleBody,
  latheAlongX,
  vColorBox,
  vehicleDetailLevels,
  vStrip,
  vStrut,
  vWhiteBox,
  type VehicleDetail,
} from "./rover-truck";

export interface VehicleGarageParams {
  detail: VehicleDetail;
}

export function parseVehicleGarage(input: unknown): VehicleGarageParams {
  const rec = parseRecord(input, ["detail"]);
  return { detail: parseChoice(rec.detail, vehicleDetailLevels, "near") };
}

/**
 * Add an `NW-03-A` rover charging station at the head of an outdoor plaza bay (`§1b`),
 * including its octagonal docking pad, cyan status ring, telemetry screen frame, inductive bumper,
 * and coiled/curved umbilical charging cable.
 */
function addOutdoorChargerStation(
  opaque: Group,
  emissive: Group,
  screenQuads: BufferGeometry[],
  bayX: number,
  deckY: number,
  chargerZ: number,
  detail: VehicleDetail,
  registry?: PieceRegistry,
): void {
  if (detail === "near" && registry && registry.ids().includes("NW-03-A")) {
    const station = registry.build("NW-03-A", { mode: "rover" });
    station.position.set(bayX, deckY, chargerZ);
    station.updateMatrixWorld(true);
    const cyanUv = paletteUV("cyan");
    const doorOpenUv = paletteUV("doorOpen");
    station.traverse(node => {
      if (!(node instanceof Mesh)) return;
      if (node.material === materials.M_palette) {
        const clone = node.geometry.clone();
        clone.applyMatrix4(node.matrixWorld);
        const uv = clone.getAttribute("uv");
        const u0 = uv ? uv.getX(0) : -1;
        const v0 = uv ? uv.getY(0) : -1;
        const isEm =
          (Math.abs(u0 - cyanUv[0]) < 1e-5 && Math.abs(v0 - cyanUv[1]) < 1e-5) ||
          (Math.abs(u0 - doorOpenUv[0]) < 1e-5 && Math.abs(v0 - doorOpenUv[1]) < 1e-5);
        (isEm ? emissive : opaque).add(new Mesh(clone, materials.M_palette));
      } else {
        const p = node.getWorldPosition(station.position.clone());
        const scr = screenGeometry(new PlaneGeometry(0.46, 0.28), "energy");
        scr.translate(p.x, p.y, p.z + 0.012);
        screenQuads.push(scr);
      }
    });
  } else {
    const pillarH = 1.88;
    if (detail !== "far") {
      const segs = detail === "near" ? 10 : 8;
      const pad = extrudedMesh(polygonShape(0.86, segs), 0.036, 0.008, "darkGray", [bayX, deckY + 0.018, chargerZ + 0.56]);
      pad.rotation.x = -Math.PI / 2;
      opaque.add(pad);
      const ring = extrudedMesh(polygonRing(0.89, 0.80, segs), 0.04, 0.006, "cyan", [bayX, deckY + 0.022, chargerZ + 0.56]);
      ring.rotation.x = -Math.PI / 2;
      emissive.add(ring);
    }

    opaque.add(vColorBox([0.94, 0.10, 0.44], "darkGray", [bayX, deckY + 0.05, chargerZ - 0.06], 0.016, ["bottom"]));
    opaque.add(vWhiteBox([0.78, pillarH, 0.34], [bayX, deckY + 0.10 + pillarH / 2, chargerZ - 0.08], 0.024, ["bottom"]));
    for (const sx of [-0.42, 0.42]) {
      opaque.add(
        vColorBox([0.10, pillarH - 0.12, 0.40], "gray", [bayX + sx, deckY + 0.10 + (pillarH - 0.12) / 2, chargerZ - 0.06], 0.018, ["bottom"]),
      );
      emissive.add(vStrip([0.035, pillarH - 0.42, 0.032], "cyan", [bayX + sx, deckY + 0.24 + (pillarH - 0.42) / 2, chargerZ + 0.145]));
    }
    opaque.add(vWhiteBox([0.92, 0.14, 0.44], [bayX, deckY + pillarH + 0.11, chargerZ - 0.04], 0.02));
    emissive.add(vStrip([0.52, 0.045, 0.035], "doorOpen", [bayX, deckY + pillarH + 0.11, chargerZ + 0.185]));

    opaque.add(vColorBox([0.54, 0.36, 0.05], "black", [bayX, deckY + pillarH - 0.26, chargerZ + 0.11], 0.012, ["back"]));
    if (detail !== "far") {
      const scr = screenGeometry(new PlaneGeometry(0.46, 0.28), "energy");
      scr.translate(bayX, deckY + pillarH - 0.26, chargerZ + 0.138);
      screenQuads.push(scr);
    } else {
      emissive.add(vStrip([0.40, 0.22, 0.02], "cyan", [bayX, deckY + pillarH - 0.26, chargerZ + 0.135]));
    }
    opaque.add(vColorBox([0.56, 0.18, 0.22], "gray", [bayX, deckY + 0.36, chargerZ + 0.10], 0.016));
    emissive.add(vStrip([0.38, 0.055, 0.035], "cyan", [bayX, deckY + 0.38, chargerZ + 0.215]));
  }

  // Heavy articulated umbilical charging cable + coupler plug (`§1b`)
  if (detail !== "far") {
    const cableSegs = detail === "near" ? 8 : 6;
    const cablePts: Point3[] = [
      [bayX + 0.38, deckY + 1.04, chargerZ + 0.08],
      [bayX + 0.62, deckY + 0.66, chargerZ + 0.28],
      [bayX + 0.56, deckY + 0.12, chargerZ + 0.62],
      [bayX + 0.26, deckY + 0.10, chargerZ + 0.98],
      [bayX + 0.08, deckY + 0.28, chargerZ + 1.24],
    ];
    const cableGeo = coloredGeometry(pipeRun(cablePts, 0.036, cableSegs), "black", { weld: true });
    opaque.add(new Mesh(cableGeo, materials.M_palette));
    opaque.add(vColorBox([0.16, 0.14, 0.22], "darkGray", [bayX + 0.08, deckY + 0.29, chargerZ + 1.28], 0.02));
    emissive.add(vStrip([0.10, 0.04, 0.08], "cyan", [bayX + 0.08, deckY + 0.365, chargerZ + 1.28]));
  }
}

/**
 * Exterior EVA & rover maintenance tool rack (`§1b`) mounted between charging bays:
 * perforated backplate, torque wrenches, calibration bars, coiled hose reel, and fire extinguisher.
 */
function addMaintenanceToolRack(
  opaque: Group,
  emissive: Group,
  cx: number,
  deckY: number,
  cz: number,
  detail: VehicleDetail,
): void {
  // Heavy stanchion legs + armored tool cabinet frame (`1.72 m` wide x `1.62 m` high)
  for (const sx of [-0.78, 0.78]) {
    opaque.add(vColorBox([0.14, 1.58, 0.28], "darkGray", [cx + sx, deckY + 0.79, cz], 0.02, ["bottom"]));
  }
  opaque.add(vWhiteBox([1.72, 0.14, 0.34], [cx, deckY + 1.56, cz + 0.02], 0.025));
  opaque.add(vColorBox([1.52, 0.52, 0.32], "hull", [cx, deckY + 0.28, cz], 0.025, ["bottom"]));
  opaque.add(vColorBox([1.48, 0.90, 0.10], "black", [cx, deckY + 1.02, cz - 0.04], 0.015));
  emissive.add(vStrip([1.36, 0.038, 0.03], "cyan", [cx, deckY + 1.48, cz + 0.16]));

  if (detail !== "far") {
    // Perforated pegboard rails + hanging low-poly rover tools (torque wrenches, pry bar, socket driver)
    for (const ry of [deckY + 0.78, deckY + 1.06, deckY + 1.30]) {
      opaque.add(vColorBox([1.38, 0.045, 0.04], "darkGray", [cx, ry, cz + 0.02], 0.008));
    }
    const toolOffsets = [-0.52, -0.30, -0.08, 0.14] as const;
    for (const [idx, tx] of toolOffsets.entries()) {
      const th = 0.42 + (idx % 2) * 0.14;
      opaque.add(vColorBox([0.045, th, 0.035], "gray", [cx + tx, deckY + 1.04, cz + 0.055], 0.008));
      opaque.add(vColorBox([0.11, 0.08, 0.045], idx === 1 ? "teal" : "white", [cx + tx, deckY + 1.04 + th / 2, cz + 0.06], 0.01));
    }

    // Coiled pneumatic / diagnostic hose reel on right side of rack
    const segs = detail === "near" ? 12 : 8;
    const reel = latheAlongX(
      [
        [0.08, -0.09],
        [0.24, -0.09],
        [0.24, 0.09],
        [0.08, 0.09],
      ],
      segs,
      "teal",
    );
    reel.rotation.y = Math.PI / 2;
    reel.position.set(cx + 0.48, deckY + 0.98, cz + 0.11);
    opaque.add(reel);

    // Pressurized safety cylinder beside rack
    const tank = extrudedMesh(polygonShape(0.11, detail === "near" ? 10 : 6), 0.56, 0.015, "red", [cx + 0.98, deckY + 0.28, cz + 0.04]);
    tank.rotation.x = -Math.PI / 2;
    opaque.add(tank);
    opaque.add(valveRedBoxCenter([0.16, 0.12, 0.16], [cx + 0.98, deckY + 0.58, cz + 0.04], 0.015));
  }
}

/**
 * Rebuilt `NX-01`: Outdoor 3-Bay Colony Vehicle Parking & Charging Apron (`§1b`, `INVENTARIO.md` line 389).
 * Sits flush on the mid-gray colony plaza (NO standalone shed roof!):
 * - Flush mid-gray beveled slab pad (`14.8 x 9.6 m`) with dark expansion joints & slotted bay drains
 * - 3 outdoor bays (`[-4.65, 0.0, +4.65]`) marked on the floor in palette `white` & `yellow`/`warning`
 * - Bay number decals (`"bay-01"`, `"bay-02"`, `"bay-03"`) on shared `M_screen`
 * - Heavy `darkGray` + `warning` wheel stops + floor-level amber warning beacons
 * - 3 `NW-03-A` charging stations with curved power cables & `"energy"` screens + 2 maintenance tool racks!
 */
function buildVehicleChargingApron(detail: VehicleDetail, registry?: PieceRegistry): Group {
  const root = new Group();
  root.name = `NX-01_${detail}`;

  const totalW = 15.0;
  const totalD = 9.6;
  const deckY = 0.065;
  const bayCenters = [-4.68, 0.0, 4.68] as const;
  const bayDecals: readonly DecalType[] = ["bay-01", "bay-02", "bay-03"];

  const hasStationCharger = Boolean(registry && registry.ids().includes("NW-03-A"));
  const cached = cachedGeometry(["nx01OutdoorApronV3", detail, hasStationCharger], () => {
    const opaque = new Group();
    const emissive = new Group();
    const screenQuads: BufferGeometry[] = [];

    // 1. Low-profile flush mid-gray paved apron base (`6.5 cm` proud with chamfered perimeter ramp)
    opaque.add(vColorBox([totalW, 0.036, totalD], "black", [0, 0.018, 0], 0.012, ["bottom"]));
    const cols = detail === "far" ? 3 : 6;
    const rows = detail === "far" ? 2 : 4;
    const sw = (totalW - 0.16) / cols;
    const sd = (totalD - 0.16) / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const sx = -(totalW - 0.16) / 2 + (c + 0.5) * sw;
        const sz = -(totalD - 0.16) / 2 + (r + 0.5) * sd;
        const raw = vColorBox([sw - 0.045, 0.036, sd - 0.045], "gray", [sx, 0.047, sz], 0.008, ["bottom"]);
        const tinted = boostVertexLuminance(raw.geometry, [0.36, 0.38, 0.42]);
        raw.geometry.dispose();
        const m = new Mesh(tinted, materials.M_palette);
        m.position.copy(raw.position);
        opaque.add(m);
      }
    }

    // 2. Outdoor Bay Markings on the Floor: Crisp Palette White & Yellow/Warning Stripes + Bay Decals (`§1b`)
    const dividersX = [-7.02, -2.34, 2.34, 7.02] as const;
    for (const gx of dividersX) {
      // Solid painted white bay side boundary line (`z = -3.10 .. +3.85`)
      opaque.add(vWhiteBox([0.11, 0.012, 6.85], [gx, deckY + 0.006, 0.36], 0.003, ["bottom"]));
      // Recessed cyan LED lane guide dashes along bay dividers (`v3-t050.10`)
      const dashCount = detail === "far" ? 3 : 6;
      for (let d = 0; d < dashCount; d++) {
        const dz = -2.55 + (d / (dashCount - 1)) * 6.30;
        emissive.add(vStrip([0.055, 0.016, 0.36], "cyan", [gx, deckY + 0.009, dz]));
      }
    }

    for (const [idx, bx] of bayCenters.entries()) {
      // Yellow/warning painted front corner L-brackets & head safety stripe (`§1b`)
      emissive.add(vStrip([3.86, 0.012, 0.11], "yellow", [bx, deckY + 0.006, -3.02]));
      for (const sx of [-1, 1] as const) {
        emissive.add(vStrip([0.74, 0.013, 0.11], "yellow", [bx + sx * 1.62, deckY + 0.0065, 3.86]));
        emissive.add(vStrip([0.11, 0.013, 0.74], "yellow", [bx + sx * 1.94, deckY + 0.0065, 3.54]));
      }

      // Entry alignment arrow in crisp exterior white (`z = +3.35`)
      opaque.add(vWhiteBox([0.16, 0.012, 0.78], [bx, deckY + 0.006, 3.45], 0.003, ["bottom"]));
      if (detail !== "far") {
        for (const sx of [-1, 1] as const) {
          const wing = vWhiteBox([0.14, 0.012, 0.52], [bx + sx * 0.16, deckY + 0.006, 3.12], 0.003, ["bottom"]);
          wing.rotation.y = -sx * 0.65;
          opaque.add(wing);
        }
      }

      // Heavy physical wheel-stop chock (`darkGray` + `warning` reflective strip, `z = -2.36`)
      opaque.add(vColorBox([2.18, 0.13, 0.24], "darkGray", [bx, deckY + 0.065, -2.36], 0.025, ["bottom"]));
      emissive.add(vStrip([1.72, 0.042, 0.04], "warning", [bx, deckY + 0.082, -2.235]));

      // Recessed slotted oil/dust floor grate centered in each bay (`z = +0.35`)
      opaque.add(vColorBox([1.24, 0.016, 1.88], "black", [bx, deckY + 0.005, 0.35], 0.005, ["bottom"]));
      if (detail !== "far") {
        const slats = detail === "near" ? 7 : 4;
        for (let s = 0; s < slats; s++) {
          const sz = 0.35 - 0.76 + (s / (slats - 1)) * 1.52;
          opaque.add(vColorBox([1.10, 0.018, 0.075], "darkGray", [bx, deckY + 0.008, sz], 0.004, ["bottom"]));
        }
      }

      // Bay number floor decal (`"bay-01"`, `"bay-02"`, `"bay-03"`) on shared `M_screen` (`z = +2.18`)
      if (detail !== "far") {
        const bayDecal = decalScreenGeometry(new PlaneGeometry(1.48, 0.88), bayDecals[idx]);
        bayDecal.rotateX(-Math.PI / 2);
        bayDecal.translate(bx, deckY + 0.011, 2.18);
        screenQuads.push(bayDecal);
      }

      // 3. `NW-03-A` Charging Station at the Head of Each Bay (`z = -3.55`)
      addOutdoorChargerStation(opaque, emissive, screenQuads, bx, deckY, -3.55, detail, registry);
    }

    // 4. Low Rear Power Bus Spine, Maintenance Tool Racks & Floor Warning Lights (`z = -4.22`, `y <= 1.85 m` — NO shed roof!)
    opaque.add(vColorBox([totalW - 0.36, 0.28, 0.56], "darkGray", [0, deckY + 0.14, -4.34], 0.035, ["bottom"]));
    opaque.add(vColorBox([totalW - 0.80, 0.14, 0.18], "hull", [0, deckY + 0.34, -4.18], 0.02, ["bottom"]));

    // Two EVA/rover tool racks + power conditioning cabinets between Bays 1-2 (`x = -2.34`) and Bays 2-3 (`x = +2.34`)
    addMaintenanceToolRack(opaque, emissive, -2.34, deckY + 0.28, -4.30, detail);
    addMaintenanceToolRack(opaque, emissive, 2.34, deckY + 0.28, -4.30, detail);

    // Outer corner protective bollards + floor-level amber warning beacons (`§1b`)
    for (const sx of [-7.12, -2.34, 2.34, 7.12]) {
      opaque.add(vColorBox([0.28, 0.78, 0.28], "darkGray", [sx, deckY + 0.39, -3.32], 0.035, ["bottom"]));
      emissive.add(vStrip([0.22, 0.08, 0.22], "warning", [sx, deckY + 0.72, -3.32]));
    }
    for (const sx of [-7.12, 7.12]) {
      opaque.add(vColorBox([0.28, 0.22, 0.28], "darkGray", [sx, deckY + 0.11, 4.18], 0.03, ["bottom"]));
      emissive.add(vColorBox([0.18, 0.14, 0.18], "warning", [sx, deckY + 0.25, 4.18], 0.025, ["bottom"]));
    }

    const bodyGeo = fuseVehicleBody("nx01-outdoor-apron", opaque, emissive, null, detail === "near", 1.15).geometry;
    let screenGeo = null;
    if (screenQuads.length > 0) {
      screenGeo = mergeGeometries(screenQuads)!;
      for (const q of screenQuads) q.dispose();
    }
    bodyGeo.userData.screenGeo = screenGeo;
    return bodyGeo;
  });

  const bodyMesh = new Mesh(cached, materials.M_palette);
  bodyMesh.name = "nx01-apron-body";
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  root.add(bodyMesh);

  if (cached.userData.screenGeo) {
    const screenMesh = new Mesh(cached.userData.screenGeo, materials.M_screen);
    screenMesh.name = "nx01-apron-screens";
    root.add(screenMesh);
  }

  const aligned = alignBaseCenter(root);
  aligned.userData.forward = [0, 0, 1];
  return aligned;
}

export function registerMarsVehicleGarage(registry: PieceRegistry): void {
  registry.register<VehicleGarageParams>("NX-01", {
    parse: parseVehicleGarage,
    variants: {
      near: { detail: "near" },
    },
    metadata: { category: "building", pivot: "base-center" },
    build: ({ detail }) => buildVehicleChargingApron(detail, registry),
  });
}
