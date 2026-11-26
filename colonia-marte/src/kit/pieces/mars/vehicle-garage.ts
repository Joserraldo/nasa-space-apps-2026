import { Group, Mesh } from "three";
import { paletteUV } from "../../../materials/atlas";
import { materials } from "../../../materials/shared";
import { coloredGeometry } from "../../../materials/uv";
import { pipeRun, polygonRing, polygonShape } from "../../primitives";
import { cachedGeometry } from "../../primitives/cache";
import type { Point3 } from "../../primitives/details";
import type { HiddenFace } from "../../primitives/normals";
import type { PieceRegistry } from "../../registry";
import { alignBaseCenter, extrudedMesh, parseChoice, parseRecord } from "../station/helpers";
import {
  addRecessedLouvers,
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
 * Exterior-hardened `NW-03-A` rover charging station (`100% M_palette`) placed at the head of each bay:
 * octagonal docking pad + cyan alignment ring, 1.92 m white/gray charging pylon, telemetry charge-bar screen,
 * inductive bumper, and curved umbilical power cable. If `NW-03-A` is registered in `registry` and `detail === "near"`,
 * converts any station canvas screen mesh to `M_palette` so the entire `NX-01` garage stays 100% `M_palette`.
 */
function addBayChargerStation(
  opaque: Group,
  emissive: Group,
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
        const isEm = (Math.abs(u0 - cyanUv[0]) < 1e-5 && Math.abs(v0 - cyanUv[1]) < 1e-5)
          || (Math.abs(u0 - doorOpenUv[0]) < 1e-5 && Math.abs(v0 - doorOpenUv[1]) < 1e-5);
        (isEm ? emissive : opaque).add(new Mesh(clone, materials.M_palette));
      } else {
        // Replace indoor canvas screen quad with crisp M_palette exterior telemetry charge display
        const p = node.getWorldPosition(station.position.clone());
        opaque.add(vStrip([0.46, 0.28, 0.018], "blue", [p.x, p.y, p.z]));
        emissive.add(vStrip([0.34, 0.045, 0.024], "cyan", [p.x, p.y + 0.05, p.z + 0.008]));
        emissive.add(vStrip([0.26, 0.038, 0.024], "doorOpen", [p.x - 0.04, p.y - 0.04, p.z + 0.008]));
      }
    });
    return;
  }

  const pillarH = 1.92;
  // Floor docking pad + cyan ring (omitted in `far` to drop triangle count cleanly)
  if (detail !== "far") {
    const segs = detail === "near" ? 10 : 8;
    const pad = extrudedMesh(polygonShape(0.90, segs), 0.045, 0.008, "offWhite", [bayX, deckY + 0.024, chargerZ + 0.56]);
    pad.rotation.x = -Math.PI / 2;
    opaque.add(pad);
    const ring = extrudedMesh(polygonRing(0.93, 0.84, segs), 0.05, 0.006, "cyan", [bayX, deckY + 0.028, chargerZ + 0.56]);
    ring.rotation.x = -Math.PI / 2;
    emissive.add(ring);
  }

  // Charging pylon in white + gray + cyan telemetry display
  opaque.add(vColorBox([0.96, 0.10, 0.44], "gray", [bayX, deckY + 0.05, chargerZ - 0.06], 0.016, ["bottom"]));
  opaque.add(vWhiteBox([0.78, pillarH, 0.34], [bayX, deckY + 0.10 + pillarH / 2, chargerZ - 0.08], 0.024, ["bottom"]));
  for (const sx of [-0.42, 0.42]) {
    opaque.add(vColorBox([0.10, pillarH - 0.12, 0.40], "gray", [bayX + sx, deckY + 0.10 + (pillarH - 0.12) / 2, chargerZ - 0.06], 0.018, ["bottom"]));
    emissive.add(vStrip([0.035, pillarH - 0.42, 0.032], "cyan", [bayX + sx, deckY + 0.24 + (pillarH - 0.42) / 2, chargerZ + 0.145]));
  }
  opaque.add(vWhiteBox([0.94, 0.14, 0.44], [bayX, deckY + pillarH + 0.11, chargerZ - 0.04], 0.02));
  emissive.add(vStrip([0.52, 0.045, 0.035], "doorOpen", [bayX, deckY + pillarH + 0.11, chargerZ + 0.185]));

  // Screen bezel & charge bars
  opaque.add(vColorBox([0.54, 0.36, 0.05], "darkGray", [bayX, deckY + pillarH - 0.24, chargerZ + 0.11], 0.012, ["back"]));
  opaque.add(vStrip([0.46, 0.28, 0.02], "blue", [bayX, deckY + pillarH - 0.24, chargerZ + 0.135]));
  emissive.add(vStrip([0.34, 0.045, 0.022], "cyan", [bayX, deckY + pillarH - 0.19, chargerZ + 0.146]));
  emissive.add(vStrip([0.26, 0.038, 0.022], "doorOpen", [bayX - 0.04, deckY + pillarH - 0.28, chargerZ + 0.146]));

  // Inductive lower coupling bumper + curved power cable (`near` only)
  opaque.add(vColorBox([0.56, 0.18, 0.22], "gray", [bayX, deckY + 0.36, chargerZ + 0.10], 0.016));
  emissive.add(vStrip([0.38, 0.055, 0.035], "cyan", [bayX, deckY + 0.38, chargerZ + 0.215]));
  if (detail === "near") {
    const cablePts: Point3[] = [
      [bayX + 0.36, deckY + 0.92, chargerZ + 0.06],
      [bayX + 0.54, deckY + 0.62, chargerZ + 0.22],
      [bayX + 0.48, deckY + 0.36, chargerZ + 0.44],
      [bayX + 0.28, deckY + 0.38, chargerZ + 0.50],
    ];
    const cableGeo = coloredGeometry(pipeRun(cablePts, 0.032, 6), "teal", { weld: true });
    opaque.add(new Mesh(cableGeo, materials.M_palette));
  }
}

/** Rooftop circular shrouded dust-filtration / HVAC fan pod inspired by v3-t050.10. */
function addRooftopFanPod(opaque: Group, center: Point3, detail: VehicleDetail): void {
  const segs = detail === "near" ? 12 : 8;
  const [x, y, z] = center;
  const shroud = latheAlongX(
    [
      [0.58, -0.02],
      [0.78, -0.02],
      [0.78, 0.16],
      [0.62, 0.20],
      [0.54, 0.12],
      [0.54, 0.0],
    ],
    segs,
    "hull",
  );
  shroud.rotation.z = Math.PI / 2;
  shroud.position.set(x, y + 0.02, z);
  opaque.add(shroud);

  const well = latheAlongX([[0, 0.02], [0.56, 0.02]], 8, "black");
  well.rotation.z = Math.PI / 2;
  well.position.set(x, y + 0.02, z);
  opaque.add(well);

  const hub = latheAlongX([[0, 0.16], [0.22, 0.14], [0.24, 0.02]], 8, "darkGray");
  hub.rotation.z = Math.PI / 2;
  hub.position.set(x, y + 0.02, z);
  opaque.add(hub);

  if (detail === "near") {
    for (let b = 0; b < 3; b++) {
      const blade = vStrip([1.06, 0.035, 0.11], "gray", [x, y + 0.09, z]);
      blade.rotation.y = (b * Math.PI) / 3;
      opaque.add(blade);
    }
  }
}

function buildVehicleGarage(detail: VehicleDetail, registry?: PieceRegistry): Group {
  const root = new Group();
  root.name = `NX-01_${detail}`;

  const hasStationCharger = Boolean(registry && registry.ids().includes("NW-03-A"));
  const bodyGeo = cachedGeometry(["nx01GarageGeoV2", detail, hasStationCharger], () => {
    const opaque = new Group();
    const emissive = new Group();

    const totalW = 14.8;
    const totalD = 11.0;
    const deckY = 0.48;
    // Bay centers tailored for all 3 vehicles: Bay 1 (-4.60, MV-01 truck), Bay 2 (0.00, MV-03 buggy), Bay 3 (+4.60, MV-11 rover)
    const bayCenters = [-4.60, 0.0, 4.60] as const;

    // 1. Deep 0.42 m Foundation Plinth + Modular Expansion-Jointed Composite Apron Slabs (`14.8 m x 11.0 m`)
    // Deep plinth absorbs undulating Jezero DEM terrain without sand poking through the apron or floating edges!
    opaque.add(vColorBox([totalW, 0.41, totalD - 1.18], "black", [0, 0.205, -0.59], 0.04, ["bottom"]));
    // Full-width gentle sloped drive-on entry ramp along +Z (`z = +4.18 .. +5.50`)
    const entryRamp = vColorBox([totalW - 0.16, 0.22, 1.48], "darkGray", [0, 0.24, 4.78], 0.03);
    entryRamp.rotation.x = 0.27;
    opaque.add(entryRamp);

    // Modular beveled floor slabs (`y = 0.41 .. 0.48`) separated by 4 cm dark expansion joints (zero Z-fighting!)
    const slabCols = detail === "far" ? 3 : 6;
    const slabRows = detail === "far" ? 2 : 4;
    const slabAreaW = totalW - 0.24;
    const slabAreaD = totalD - 1.32;
    const sw = slabAreaW / slabCols;
    const sd = slabAreaD / slabRows;
    for (let r = 0; r < slabRows; r++) {
      for (let c = 0; c < slabCols; c++) {
        const sx = -slabAreaW / 2 + (c + 0.5) * sw;
        const sz = -0.58 - slabAreaD / 2 + (r + 0.5) * sd;
        const tone = (r + c) % 2 === 0 ? "gray" : "hull";
        opaque.add(vColorBox([sw - 0.04, 0.075, sd - 0.04], tone, [sx, 0.4425, sz], 0.014, ["bottom"]));
      }
    }

    // 2. Dashed Emissive Cyan Bay & Forecourt Guide Lines + Amber Wheel-Stop Chocks (`v3-t050.10` signature!)
    const guideLinesX = [-6.95, -2.30, 2.30, 6.95] as const;
    const dashCount = detail === "far" ? 4 : 8;
    for (const gx of guideLinesX) {
      for (let d = 0; d < dashCount; d++) {
        const gz = -3.6 + (d / (dashCount - 1)) * 7.5;
        if (detail !== "far") {
          opaque.add(vStrip([0.13, 0.018, 0.50], "black", [gx, deckY + 0.009, gz]));
        }
        emissive.add(vStrip([0.075, 0.024, 0.42], "cyan", [gx, deckY + 0.014, gz]));
      }
    }
    // Front apron threshold dashed cyan line + wheel-stop chocks inside each bay
    for (const bx of bayCenters) {
      for (const dx of [-1.05, 0, 1.05]) {
        emissive.add(vStrip([0.48, 0.022, 0.075], "cyan", [bx + dx, deckY + 0.013, 4.02]));
      }
      // Wheel-stop chock with amber `warning` reflective strip (`z = -2.92`)
      opaque.add(vColorBox([2.10, 0.11, 0.22], "darkGray", [bx, deckY + 0.055, -2.92], 0.024, ["bottom"]));
      emissive.add(vStrip([1.68, 0.042, 0.04], "warning", [bx, deckY + 0.068, -2.80]));
    }

    // 3. 3-Bay Covered Garage Shelter (`z = -5.12 .. +1.56`, open toward `+Z` forecourt)
    // Stepped higher portal on Bay 1 (`MV-01` heavy 6x6 truck: 3.92 m clear height) and sleek twin bay roof on Bays 2 & 3 (`3.36 m` clear height)
    const zBack = -5.10;
    const zFront = 1.54;
    const shelterD = zFront - zBack; // 6.64 m covered depth
    const shelterMidZ = (zBack + zFront) / 2; // -1.78 m
    const highClearY = deckY + 3.94; // 4.16 m underside -> clears MV-01's 3.56 m antenna easily!
    const stdClearY = deckY + 3.36;  // 3.58 m underside -> clears MV-03 (2.16 m) & MV-11 (1.96 m)

    // Structural portal piers (`[-7.10, -2.30, +2.30, +7.10]`) with angled front buttresses (`v3-t040.00` / `v3-t050.10`)
    const piers: readonly [number, number, number][] = [
      [-7.10, 0.56, highClearY],
      [-2.30, 0.52, highClearY],
      [2.30, 0.48, stdClearY],
      [7.10, 0.56, stdClearY],
    ];
    for (const [px, pw, topY] of piers) {
      const h = topY - deckY;
      opaque.add(vWhiteBox([pw, h, shelterD - 0.16], [px, deckY + h / 2, shelterMidZ], 0.055, ["bottom"]));
      // Horizontal darkGray corner strakes echoing v3-t050.10
      if (detail !== "far" && Math.abs(px) > 6.0) {
        const sideSign = px > 0 ? 1 : -1;
        const omitIn: HiddenFace[] = sideSign > 0 ? ["left"] : ["right"];
        for (const sy of [deckY + 1.72, deckY + 2.15, deckY + 2.58]) {
          opaque.add(vColorBox([0.09, 0.22, shelterD - 0.04], "darkGray", [px + sideSign * (pw / 2 + 0.02), sy, shelterMidZ], 0.02, omitIn));
        }
      }
      // Angled front structural buttress leg
      const buttressH = h * 0.88;
      opaque.add(
        vStrut(
          [px, deckY + buttressH, zFront - 0.14],
          [px, deckY + 0.08, zFront + 0.72],
          pw * 0.72,
          "hull",
        ),
      );
    }

    // Stepped beveled white + hull roof slabs over Bay 1 (heavy) and Bays 2-3 (scout/buggy)
    // Bay 1 high roof (`x = -7.40 .. -1.96`)
    opaque.add(vColorBox([5.44, 0.26, shelterD + 0.12], "darkGray", [-4.68, highClearY + 0.13, shelterMidZ], 0.04));
    opaque.add(vWhiteBox([5.52, 0.22, shelterD + 0.24], [-4.68, highClearY + 0.34, shelterMidZ], 0.055));

    // Bays 2 & 3 standard roof (`x = -2.04 .. +7.40`)
    opaque.add(vColorBox([9.44, 0.24, shelterD + 0.12], "darkGray", [2.68, stdClearY + 0.12, shelterMidZ], 0.04));
    opaque.add(vWhiteBox([9.52, 0.20, shelterD + 0.24], [2.68, stdClearY + 0.31, shelterMidZ], 0.055));

    // Step-up vertical fascia cheek closing the gap between Bay 1 high roof and Bay 2 roof at x = -2.30
    opaque.add(vColorBox([0.48, highClearY - stdClearY + 0.20, shelterD], "hull", [-2.30, (highClearY + stdClearY) / 2 + 0.15, shelterMidZ], 0.035));

    // Overhead portal header fascias + glowing cyan bay indicator bars & ceiling light strips
    const bayPortals: readonly [number, number, number][] = [
      [-4.70, 4.16, highClearY],
      [0.0, 3.96, stdClearY],
      [4.70, 4.16, stdClearY],
    ];
    for (const [bx, bw, portalY] of bayPortals) {
      opaque.add(vColorBox([bw, 0.28, 0.34], "hull", [bx, portalY - 0.12, zFront - 0.06], 0.035));
      opaque.add(vStrip([bw - 0.56, 0.09, 0.06], "black", [bx, portalY - 0.13, zFront + 0.10]));
      emissive.add(vStrip([bw - 0.72, 0.048, 0.04], "cyan", [bx, portalY - 0.13, zFront + 0.125]));
      // Interior bay ceiling cyan worklight bar
      emissive.add(vStrip([bw - 1.20, 0.04, 0.18], "cyan", [bx, portalY - 0.03, shelterMidZ + 0.30]));
    }

    // 4. Rear Bulkhead Wall, Power Bus Conduits, Side Louvers & Personnel Service Hatch
    // Bay 1 rear wall (tall) + Bays 2-3 rear wall
    const backH1 = highClearY - deckY;
    const backH2 = stdClearY - deckY;
    opaque.add(vColorBox([5.20, backH1, 0.34], "hull", [-4.68, deckY + backH1 / 2, zBack + 0.18], 0.04, ["bottom"]));
    opaque.add(vColorBox([9.20, backH2, 0.34], "hull", [2.68, deckY + backH2 / 2, zBack + 0.18], 0.04, ["bottom"]));

    // Interior recessed white wall armor panels & horizontal darkGray power busbar across all 3 bays
    for (const [bx, bw, portalY] of bayPortals) {
      const panelH = portalY - deckY - 0.75;
      opaque.add(vWhiteBox([bw - 0.36, panelH, 0.10], [bx, deckY + 0.52 + panelH / 2, zBack + 0.38], 0.028, ["back"]));
      opaque.add(vColorBox([bw - 0.16, 0.18, 0.16], "darkGray", [bx, deckY + 1.48, zBack + 0.44], 0.022, ["back"]));
    }

    // Side facade details: ventilation grilles & personnel service hatch frame (`v3-t050.10`)
    if (detail !== "far") {
      addRecessedLouvers(opaque, 1.32, 0.58, detail === "near" ? 4 : 2, [-7.39, deckY + 1.25, -1.8], -Math.PI / 2);
      addRecessedLouvers(opaque, 1.32, 0.58, detail === "near" ? 4 : 2, [7.39, deckY + 1.25, -2.8], Math.PI / 2);
      // Right-flank personnel hatch frame (`v3-t050.10` style)
      opaque.add(vColorBox([0.12, 2.12, 1.24], "darkGray", [7.40, deckY + 1.06, -0.35], 0.025, ["left", "bottom"]));
      opaque.add(vColorBox([0.08, 1.88, 0.96], "black", [7.44, deckY + 0.98, -0.35], 0.018, ["left", "bottom"]));
      emissive.add(vStrip([0.05, 0.42, 0.05], "doorClosed", [7.47, deckY + 1.08, 0.02]));
    }

    // 5. Three `NW-03-A` Vehicle Charging Stations (one at the head of each bay!)
    for (const bx of bayCenters) {
      addBayChargerStation(opaque, emissive, bx, deckY, -4.18, detail, registry);
    }

    // 6. Rooftop Dust-Filtration Fans & Power Conditioning Penthouse (`v3-t050.10`)
    if (detail !== "far") {
      addRooftopFanPod(opaque, [-5.65, highClearY + 0.45, -1.85], detail);
      addRooftopFanPod(opaque, [-3.65, highClearY + 0.45, -1.85], detail);
      addRooftopFanPod(opaque, [3.60, stdClearY + 0.41, -1.85], detail);
      addRooftopFanPod(opaque, [5.60, stdClearY + 0.41, -1.85], detail);

      // Rooftop power-conditioning penthouse box + conduit spine
      opaque.add(vColorBox([2.35, 0.52, 1.68], "hull", [0.0, stdClearY + 0.66, -2.15], 0.045, ["bottom"]));
      opaque.add(vWhiteBox([2.05, 0.16, 1.38], [0.0, stdClearY + 0.96, -2.15], 0.03, ["bottom"]));
      opaque.add(vColorBox([8.20, 0.14, 0.18], "darkGray", [2.60, stdClearY + 0.48, -3.35], 0.022));
    }

    return fuseVehicleBody("nx01-garage", opaque, emissive, null, detail === "near", 1.15).geometry;
  });

  const mesh = new Mesh(bodyGeo, materials.M_palette);
  mesh.name = "nx01-garage-body";
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  root.add(mesh);

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
    build: ({ detail }) => buildVehicleGarage(detail, registry),
  });
}
