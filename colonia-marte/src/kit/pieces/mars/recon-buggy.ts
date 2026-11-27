import { Group, Mesh } from "three";
import { materials } from "../../../materials/shared";
import { cachedGeometry } from "../../primitives/cache";
import type { HiddenFace } from "../../primitives/normals";
import type { PieceRegistry } from "../../registry";
import { alignBaseCenter, parseChoice, parseRecord } from "../station/helpers";
import {
  addRecessedLouvers,
  buildArticulatedWheel,
  extrudeSideProfileX,
  fuseVehicleBody,
  latheAlongX,
  vColorBox,
  vehicleDetailLevels,
  vStrip,
  vStrut,
  vWhiteBox,
  type VehicleDetail,
} from "./rover-truck";

export interface ReconBuggyParams {
  detail: VehicleDetail;
}

export function parseReconBuggy(input: unknown): ReconBuggyParams {
  const rec = parseRecord(input, ["detail"]);
  return { detail: parseChoice(rec.detail, vehicleDetailLevels, "near") };
}

function buildReconBuggy(detail: VehicleDetail): Group {
  const root = new Group();
  root.name = `MV-03_${detail}`;

  const wheelRadius = 0.48;
  const wheelWidth = 0.38;
  const trackX = 0.96;
  const axleZ = [1.18, -1.16] as const;
  const wheelDefs = [
    ["fl", -1, axleZ[0]],
    ["fr", 1, axleZ[0]],
    ["rl", -1, axleZ[1]],
    ["rr", 1, axleZ[1]],
  ] as const;

  const bodyGeo = cachedGeometry(["mv03BodyGeoV1", detail], () => {
    const opaque = new Group();
    const emissive = new Group();
    const wheelProxies = new Group();

    // 1. High-clearance armored belly tub, bash-plates & double-wishbone suspension
    opaque.add(vColorBox([1.18, 0.28, 3.38], "darkGray", [0, 0.62, 0.02], 0.045));
    opaque.add(vColorBox([0.96, 0.14, 3.04], "black", [0, 0.46, 0.02], 0.025));

    // Angled front skid-plate + beveled bumper + tubular bull-bar
    const frontSkid = vColorBox([1.12, 0.12, 0.48], "darkGray", [0, 0.56, 1.72], 0.025);
    frontSkid.rotation.x = -0.38;
    opaque.add(frontSkid);
    opaque.add(vColorBox([1.68, 0.24, 0.28], "hull", [0, 0.72, 1.84], 0.038));
    if (detail !== "far") {
      // Forward bull-bar hoop & tow shackles
      opaque.add(vColorBox([1.16, 0.075, 0.075], "darkGray", [0, 0.92, 1.98], 0.018));
      for (const side of [-1, 1] as const) {
        opaque.add(vStrut([side * 0.54, 0.74, 1.92], [side * 0.54, 0.92, 1.98], 0.072, "darkGray"));
        opaque.add(vColorBox([0.09, 0.12, 0.14], "gray", [side * 0.38, 0.60, 1.96], 0.02, ["back"]));
      }
      addRecessedLouvers(opaque, 0.68, 0.16, detail === "near" ? 3 : 2, [0, 0.72, 1.97], 0);
    }

    // Twin recessed cyan LED headlights + upper DRL brow strips
    for (const side of [-1, 1] as const) {
      opaque.add(vColorBox([0.32, 0.15, 0.09], "black", [side * 0.60, 0.73, 1.95], 0.016, ["back"]));
      emissive.add(vStrip([0.24, 0.08, 0.045], "cyan", [side * 0.60, 0.73, 1.985]));
      emissive.add(vStrip([0.26, 0.032, 0.04], "cyan", [side * 0.56, 0.95, 1.79]));
    }

    // Suspension wishbones, coil-over shocks, side rock-sliders & flared trapezoidal wheel arches
    for (const side of [-1, 1] as const) {
      const omitIn: HiddenFace[] = side > 0 ? ["left"] : ["right"];
      for (const wz of axleZ) {
        // Lower wishbone + inclined coil-over shock absorber
        opaque.add(vStrut([side * 0.54, 0.56, wz], [side * 0.82, wheelRadius - 0.02, wz], 0.10, "darkGray"));
        if (detail !== "far") {
          opaque.add(vStrut([side * 0.60, 0.94, wz * 0.92], [side * 0.80, wheelRadius + 0.06, wz], 0.068, "gray"));
        }

        // Flared two-tone trapezoidal over-fender (v3-t040.00 / v3-t104.90 signature arch)
        opaque.add(vColorBox([0.46, 0.11, 0.84], "hull", [side * 0.94, 1.10, wz], 0.028));
        opaque.add(vWhiteBox([0.42, 0.08, 0.76], [side * 0.94, 1.17, wz], 0.022, ["bottom"]));
        const frontFlare = vColorBox([0.44, 0.09, 0.34], "hull", [side * 0.94, 0.99, wz + 0.51], 0.022);
        frontFlare.rotation.x = 0.58;
        const rearFlare = vColorBox([0.44, 0.09, 0.34], "hull", [side * 0.94, 0.99, wz - 0.51], 0.022);
        rearFlare.rotation.x = -0.58;
        opaque.add(frontFlare, rearFlare);
      }

      // Side rock-slider step rail & sill armor between front and rear wheels
      opaque.add(vColorBox([0.32, 0.14, 1.14], "darkGray", [side * 0.82, 0.64, 0.01], 0.028, omitIn));
      opaque.add(vColorBox([0.22, 0.06, 1.04], "hull", [side * 0.90, 0.72, 0.01], 0.016, ["bottom"]));
    }

    // 2. Faceted 2-Seat Pressurized Recon Cabin (Z = -0.36 .. +1.82)
    const cabProfile: [number, number][] = [
      [-0.36, 0.74],
      [1.82, 0.74],
      [1.82, 0.96],
      [1.04, 1.18],
      [0.44, 1.72],
      [-0.28, 1.72],
      [-0.36, 1.28],
    ];
    opaque.add(extrudeSideProfileX(cabProfile, 1.44, 0.04, "darkGray"));

    // Split beveled white hood armor plates with crisp dark center seam
    for (const side of [-1, 1] as const) {
      const hood = vWhiteBox([0.64, 0.09, 0.76], [side * 0.35, 1.10, 1.41], 0.024, ["bottom"]);
      hood.rotation.x = 0.275;
      opaque.add(hood);
    }

    // Raked 2-pane teal forward windshield (28 mm proud of darkGray core -> zero Z-fighting)
    const wsAngle = 0.835; // Matches slope from (1.04, 1.18) to (0.44, 1.72): atan2(0.60, 0.54) = 0.838 rad
    const wsFrame = new Group();
    wsFrame.position.set(0, 1.46, 0.76);
    wsFrame.rotation.x = -wsAngle;
    wsFrame.add(vColorBox([1.34, 0.74, 0.05], "black", [0, 0, 0.01], 0.014, ["back"]));
    for (const side of [-1, 1] as const) {
      wsFrame.add(vStrip([0.58, 0.60, 0.036], "teal", [side * 0.31, 0, 0.028]));
    }
    opaque.add(wsFrame);

    // Sculpted side cab doors, angled teal side windows, panelInset hatches & side mirrors
    for (const side of [-1, 1] as const) {
      const omitIn: HiddenFace[] = side > 0 ? ["left"] : ["right"];
      // Lower beveled white door armor
      opaque.add(vWhiteBox([0.09, 0.44, 1.16], [side * 0.74, 0.98, 0.22], 0.024, omitIn));
      // Upper cab window surround + recessed teal side glass
      opaque.add(vColorBox([0.08, 0.42, 0.86], "black", [side * 0.73, 1.43, 0.10], 0.016, omitIn));
      opaque.add(vStrip([0.04, 0.30, 0.70], "teal", [side * 0.755, 1.43, 0.10]));

      if (detail === "near") {
        // Clean recessed door latch pocket & grab handle
        opaque.add(vColorBox([0.045, 0.22, 0.62], "hull", [side * 0.785, 0.96, 0.18], 0.012, omitIn));
        opaque.add(vStrip([0.035, 0.055, 0.18], "darkGray", [side * 0.805, 1.02, -0.02]));
      }
      if (detail !== "far") {
        // Rugged side-view camera/mirror pod
        opaque.add(vColorBox([0.14, 0.09, 0.11], "darkGray", [side * 0.82, 1.32, 0.66], 0.018));
      }
    }

    // Beveled white roof cap + forward cyan expedition light-bar pod
    opaque.add(vWhiteBox([1.36, 0.08, 0.68], [0, 1.75, 0.08], 0.024, ["bottom"]));
    opaque.add(vColorBox([1.06, 0.13, 0.24], "hull", [0, 1.83, 0.36], 0.028));
    opaque.add(vColorBox([0.96, 0.085, 0.08], "black", [0, 1.83, 0.46], 0.014, ["back"]));
    for (const lx of [-0.33, -0.11, 0.11, 0.33]) {
      emissive.add(vStrip([0.16, 0.05, 0.04], "cyan", [lx, 1.83, 0.49]));
    }

    // 3. Rear Open Utility Bed + Tubular Roll-Cage & EVA Cargo Modules (Z = -1.78 .. -0.36)
    opaque.add(vColorBox([1.42, 0.14, 1.42], "darkGray", [0, 0.78, -1.06], 0.03));
    for (const side of [-1, 1] as const) {
      const omitIn: HiddenFace[] = side > 0 ? ["left"] : ["right"];
      opaque.add(vColorBox([0.12, 0.38, 1.38], "hull", [side * 0.66, 1.02, -1.06], 0.026));
      opaque.add(vWhiteBox([0.08, 0.26, 0.96], [side * 0.72, 1.03, -1.04], 0.02, omitIn));
      if (detail !== "far") {
        addRecessedLouvers(
          opaque,
          0.52,
          0.16,
          detail === "near" ? 3 : 2,
          [side * 0.75, 1.03, -1.04],
          side * (Math.PI / 2),
        );
      }
    }

    // Signature tubular beveled roll-cage over rear bed (v3-t040.00)
    const cageThick = 0.078;
    for (const side of [-1, 1] as const) {
      // Main vertical B-pillar hoop posts + angled fastback down-tubes + upper bed tie-down rails
      opaque.add(vStrut([side * 0.60, 1.20, -0.44], [side * 0.56, 1.80, -0.44], cageThick, "darkGray"));
      opaque.add(vStrut([side * 0.56, 1.80, -0.44], [side * 0.58, 1.22, -1.64], cageThick, "darkGray"));
      if (detail !== "far") {
        opaque.add(vStrut([side * 0.62, 1.38, -0.44], [side * 0.62, 1.34, -1.66], 0.062, "hull"));
        opaque.add(vStrut([side * 0.62, 1.20, -1.66], [side * 0.62, 1.36, -1.66], 0.065, "darkGray"));
      }
    }
    opaque.add(vColorBox([1.18, cageThick, cageThick], "darkGray", [0, 1.80, -0.44], 0.02));
    if (detail !== "far") {
      opaque.add(vColorBox([1.28, 0.062, 0.062], "hull", [0, 1.34, -1.66], 0.016));
    }

    // Twin modular EVA sample / battery cases strapped in the cargo bed (white + hull, zero yellow/ochre!)
    for (const side of [-1, 1] as const) {
      opaque.add(vWhiteBox([0.48, 0.32, 0.78], [side * 0.28, 1.01, -0.98], 0.028, ["bottom"]));
      opaque.add(vColorBox([0.50, 0.08, 0.80], "hull", [side * 0.28, 1.19, -0.98], 0.02));
      if (detail !== "far") {
        opaque.add(vStrip([0.52, 0.34, 0.06], "darkGray", [side * 0.28, 1.03, -0.78]));
        opaque.add(vStrip([0.52, 0.34, 0.06], "darkGray", [side * 0.28, 1.03, -1.18]));
        emissive.add(vStrip([0.18, 0.035, 0.035], "cyan", [side * 0.28, 1.19, -1.38]));
      }
    }

    // Rear comms whip antenna + cyan beacon tip
    if (detail !== "far") {
      opaque.add(vColorBox([0.11, 0.12, 0.11], "darkGray", [-0.54, 1.26, -1.52], 0.02, ["bottom"]));
      opaque.add(vStrut([-0.54, 1.30, -1.52], [-0.54, 2.08, -1.56], 0.042, "gray"));
      emissive.add(vColorBox([0.065, 0.08, 0.065], "cyan", [-0.54, 2.12, -1.56], 0.014));
    }

    // Rear tailgate bumper, tow hitch & twin cyan + red tail-lights (v3-t040.00 signature rear cyan bars)
    opaque.add(vColorBox([1.56, 0.24, 0.22], "hull", [0, 0.72, -1.78], 0.035));
    opaque.add(vColorBox([0.82, 0.26, 0.08], "black", [0, 0.94, -1.76], 0.02, ["front"]));
    for (const side of [-1, 1] as const) {
      opaque.add(vColorBox([0.28, 0.13, 0.08], "black", [side * 0.60, 0.74, -1.87], 0.016, ["front"]));
      emissive.add(vStrip([0.20, 0.065, 0.04], "cyan", [side * 0.60, 0.74, -1.90]));
      emissive.add(vStrip([0.16, 0.04, 0.04], "doorClosed", [side * 0.60, 0.96, -1.78]));
    }

    // Proxy wheel cylinders for realistic wheel-arch & suspension contact AO
    if (detail === "near") {
      for (const [, sideSign, wz] of wheelDefs) {
        wheelProxies.add(
          latheAlongX(
            [[0, -wheelWidth / 2], [wheelRadius, -wheelWidth / 2], [wheelRadius, wheelWidth / 2], [0, wheelWidth / 2]],
            8,
            "black",
            [sideSign * trackX, wheelRadius, wz],
          ),
        );
      }
    }

    return fuseVehicleBody("mv03-buggy-body", opaque, emissive, wheelProxies, detail === "near", 0.80).geometry;
  });

  const bodyMesh = new Mesh(bodyGeo, materials.M_palette);
  bodyMesh.name = "mv03-buggy-body";
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  root.add(bodyMesh);

  // Attach 4 independent articulated wheels centered on their local X axles
  for (const [wid, sideSign, wz] of wheelDefs) {
    const wheel = buildArticulatedWheel({
      cacheKey: "mv03",
      wheelId: wid,
      radius: wheelRadius,
      width: wheelWidth,
      sideSign,
      detail,
      rimColor: "hull",
      accentColor: "cyan",
    });
    wheel.position.set(sideSign * trackX, wheelRadius, wz);
    root.add(wheel);
  }

  const aligned = alignBaseCenter(root);
  aligned.userData.forward = [0, 0, 1];
  return aligned;
}

export function registerMarsReconBuggy(registry: PieceRegistry): void {
  registry.register<ReconBuggyParams>("MV-03", {
    parse: parseReconBuggy,
    variants: {
      near: { detail: "near" },
    },
    metadata: { category: "vehicle", pivot: "base-center" },
    build: ({ detail }) => buildReconBuggy(detail),
  });
}
