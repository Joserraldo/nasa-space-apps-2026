import { Group, Mesh } from "three";
import { materials } from "../../../materials/shared";
import { polygonShape } from "../../primitives";
import { cachedGeometry } from "../../primitives/cache";
import type { PieceRegistry } from "../../registry";
import { alignBaseCenter, extrudedMesh, parseChoice, parseRecord } from "../station/helpers";
import {
  addRecessedLouvers,
  fuseVehicleBody,
  vColorBox,
  vehicleDetailLevels,
  vStrip,
  vStrut,
  vWhiteBox,
  type VehicleDetail,
} from "./rover-truck";

export interface EntranceTowerParams {
  detail: VehicleDetail;
}

export function parseEntranceTower(input: unknown): EntranceTowerParams {
  const rec = parseRecord(input, ["detail"]);
  return { detail: parseChoice(rec.detail, vehicleDetailLevels, "near") };
}

/**
 * Add one of the 4 cardinal facade assemblies (`+Z`, `-Z`, `+X`, `-X`) of the MB-14 landmark shaft:
 * stacked beveled white & light-gray (`hull`/`offWhite`) panels over dark recessed joints, framed exclusively
 * by tall vertical `cyan` emissive light strips inside dark channels (`v3-t026.40`).
 */
function addShaftFacade(
  opaque: Group,
  emissive: Group,
  rotY: number,
  detail: VehicleDetail,
): void {
  const face = new Group();
  face.rotation.y = rotY;

  const faceZ = 1.98;
  const tiers = detail === "far" ? 3 : 6;
  const startY = 4.25;
  const totalH = 10.90;
  const stepH = totalH / tiers;

  // Stacked beveled white & light-gray panels (zero green/teal panels, zero ochre — cyan ONLY on light strips!)
  for (let t = 0; t < tiers; t++) {
    const cy = startY + (t + 0.5) * stepH;
    const panelH = stepH - 0.14;
    const isEven = t % 2 === 0;
    if (detail === "far") {
      face.add(
        isEven
          ? vWhiteBox([1.96, panelH, 0.14], [0, cy, faceZ], 0.032, ["back"])
          : vColorBox([1.96, panelH, 0.14], "hull", [0, cy, faceZ], 0.032, ["back"]),
      );
    } else {
      // Split twin beveled vertical plates with central 5 cm dark seam reveal
      for (const sx of [-0.50, 0.50]) {
        face.add(
          isEven
            ? vWhiteBox([0.94, panelH, 0.15], [sx, cy, faceZ], 0.028, ["back"])
            : vColorBox([0.94, panelH, 0.15], t % 4 === 1 ? "hull" : "offWhite", [sx, cy, faceZ], 0.028, ["back"]),
        );
      }
      // Horizontal darkGray spandrel rib between stories
      face.add(vColorBox([2.06, 0.09, 0.10], "darkGray", [0, cy - stepH / 2 + 0.02, faceZ - 0.02], 0.018, ["back"]));
    }
  }

  // Twin full-height vertical recessed `black` light channels + `cyan` light strips (`x = +-1.18`, `y = 4.20 .. 15.28`)
  const stripMidY = startY + totalH / 2;
  const emFace = new Group();
  emFace.rotation.y = rotY;
  for (const sx of [-1.18, 1.18]) {
    face.add(vColorBox([0.22, totalH + 0.18, 0.14], "black", [sx, stripMidY, faceZ - 0.01], 0.02, ["back"]));
    emFace.add(vStrip([0.105, totalH + 0.04, 0.06], "cyan", [sx, stripMidY, faceZ + 0.055]));
  }
  // Top horizontal cyan arch bar bridging the two vertical strips at `y = 15.22` (`v3-t026.40` arch motif!)
  face.add(vColorBox([2.56, 0.20, 0.14], "black", [0, 15.24, faceZ - 0.01], 0.02, ["back"]));
  emFace.add(vStrip([2.44, 0.095, 0.06], "cyan", [0, 15.24, faceZ + 0.055]));

  // Lower podium recessed bay (`y = 1.05 .. 3.55`)
  if (Math.abs(rotY) < 1e-4) {
    // Front (+Z) ceremonial entrance portal frame
    face.add(vColorBox([2.24, 2.56, 0.28], "darkGray", [0, 1.98, 2.58], 0.04, ["back", "bottom"]));
    face.add(vColorBox([1.68, 2.18, 0.18], "black", [0, 1.82, 2.68], 0.025, ["back", "bottom"]));
    face.add(vColorBox([1.42, 1.98, 0.12], "hull", [0, 1.74, 2.74], 0.025, ["back", "bottom"]));
    emFace.add(vStrip([1.36, 0.075, 0.05], "cyan", [0, 3.04, 2.73]));
  } else if (detail !== "far") {
    addRecessedLouvers(face, 1.48, 0.64, detail === "near" ? 4 : 2, [0, 2.15, 2.56], 0);
  }

  // Horizontal podium collar light line (`v3-t060.40` base accent)
  face.add(vStrip([2.86, 0.11, 0.08], "black", [0, 3.76, 2.42]));
  emFace.add(vStrip([2.68, 0.055, 0.05], "cyan", [0, 3.76, 2.455]));

  opaque.add(face);
  emissive.add(emFace);
}

function buildEntranceTower(detail: VehicleDetail): Group {
  const root = new Group();
  root.name = `MB-14_${detail}`;

  const bodyGeo = cachedGeometry(["mb14EntranceTowerV1", detail], () => {
    const opaque = new Group();
    const emissive = new Group();

    // 1. Deep Octagonal Foundation Plinth + Buttressed Podium (`y = 0.00 .. 3.95 m`, footprint ~6.8 m)
    const basePlinth = extrudedMesh(polygonShape(3.55, 8), 0.48, 0.04, "black", [0, 0.24, 0]);
    basePlinth.rotation.x = -Math.PI / 2;
    const upperStep = extrudedMesh(polygonShape(3.25, 8), 0.26, 0.035, "darkGray", [0, 0.61, 0]);
    upperStep.rotation.x = -Math.PI / 2;
    opaque.add(basePlinth, upperStep);

    // Podium core (`y = 0.72 .. 3.95 m`) + 4 angled white corner buttresses
    opaque.add(vWhiteBox([5.08, 3.24, 5.08], [0, 2.34, 0], 0.12, ["bottom"]));
    for (const sx of [-1, 1] as const) {
      for (const sz of [-1, 1] as const) {
        opaque.add(
          vStrut(
            [sx * 2.18, 3.82, sz * 2.18],
            [sx * 2.68, 0.72, sz * 2.68],
            0.62,
            "hull",
          ),
        );
      }
    }
    opaque.add(vWhiteBox([4.84, 0.28, 4.84], [0, 4.02, 0], 0.055));

    // 2. Tall Sculpted Shaft (`y = 4.10 .. 15.55 m`): `darkGray` seam core + 4 continuous `white` corner pilasters
    const shaftCoreH = 11.45;
    const shaftMidY = 4.10 + shaftCoreH / 2;
    opaque.add(vColorBox([3.92, shaftCoreH, 3.92], "darkGray", [0, shaftMidY, 0], 0.08, ["bottom", "top"]));

    for (const sx of [-1, 1] as const) {
      for (const sz of [-1, 1] as const) {
        // Tall sculpted white corner megacolumn (`v3-t026.40` iconic vertical white framing)
        opaque.add(vWhiteBox([0.82, shaftCoreH + 0.20, 0.82], [sx * 1.72, shaftMidY, sz * 1.72], 0.075, ["bottom"]));

        // Stepped side pilaster pods + thin cyan accent ticks (`near` & `middle`)
        if (detail !== "far") {
          const podTiers = detail === "near" ? 5 : 3;
          for (let p = 0; p < podTiers; p++) {
            const py = 5.15 + p * (9.2 / podTiers);
            opaque.add(vColorBox([0.24, 0.92, 0.56], "hull", [sx * 2.14, py, sz * 1.72], 0.028));
            if (detail === "near") {
              emissive.add(vStrip([0.05, 0.055, 0.42], "cyan", [sx * 2.27, py + 0.34, sz * 1.72]));
            }
          }
        }
      }
    }

    // Add all 4 cardinal facades (`+Z`, `+X`, `-Z`, `-X`) so MB-14 reads as a 360-deg colony landmark!
    for (let i = 0; i < 4; i++) {
      addShaftFacade(opaque, emissive, (i * Math.PI) / 2, detail);
    }

    // 3. Cantilevered Polygonal Control / Observation Crown (`y = 15.55 .. 18.45 m`, `v3-t060.40` + `v3-t026.40`)
    const deckFloor = extrudedMesh(polygonShape(3.05, 8), 0.32, 0.04, "white", [0, 15.72, 0]);
    deckFloor.rotation.x = -Math.PI / 2;
    const deckSub = extrudedMesh(polygonShape(2.72, 8), 0.24, 0.035, "hull", [0, 15.46, 0]);
    deckSub.rotation.x = -Math.PI / 2;
    opaque.add(deckSub, deckFloor);

    // Perimeter maintenance catwalk safety handrail (`near` LOD detail)
    if (detail === "near") {
      for (let i = 0; i < 8; i++) {
        const a0 = ((i + 0.5) / 8) * Math.PI * 2;
        const a1 = ((i + 1.5) / 8) * Math.PI * 2;
        const rRail = 2.84;
        const x0 = Math.cos(a0) * rRail;
        const z0 = Math.sin(a0) * rRail;
        const x1 = Math.cos(a1) * rRail;
        const z1 = Math.sin(a1) * rRail;
        opaque.add(vStrut([x0, 15.88, z0], [x0, 16.42, z0], 0.055, "darkGray"));
        opaque.add(vStrut([x0, 16.40, z0], [x1, 16.40, z1], 0.048, "hull"));
      }
    }

    // Polygonal glazed observation cabin (`black` recessed window band + `darkGray` angled mullions + white visor roof)
    const cabinCore = extrudedMesh(polygonShape(2.38, 8), 1.66, 0.04, "black", [0, 16.70, 0]);
    cabinCore.rotation.x = -Math.PI / 2;
    opaque.add(cabinCore);

    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      // Outward-canted structural mullions around all 8 vertices of the observation deck
      const rBot = 2.26;
      const rTop = 2.48;
      opaque.add(
        vStrut(
          [Math.cos(ang) * rBot, 15.88, Math.sin(ang) * rBot],
          [Math.cos(ang) * rTop, 17.52, Math.sin(ang) * rTop],
          0.16,
          i % 2 === 0 ? "white" : "hull",
        ),
      );
    }
    // Subtle recessed perimeter cyan telemetry horizon band at the top of the control windows
    for (let i = 0; i < 4; i++) {
      const g = new Group();
      g.rotation.y = (i * Math.PI) / 2;
      g.add(vStrip([1.56, 0.065, 0.05], "cyan", [0, 17.36, 2.22]));
      emissive.add(g);
    }

    // Sculpted white + light-gray crown hood (`y = 17.52 .. 18.62 m`, `v3-t026.40` stepped arch crown)
    const crownVisor = extrudedMesh(polygonShape(2.92, 8), 0.36, 0.05, "white", [0, 17.70, 0]);
    crownVisor.rotation.x = -Math.PI / 2;
    const crownUpper = extrudedMesh(polygonShape(2.28, 8), 0.44, 0.05, "hull", [0, 18.08, 0]);
    crownUpper.rotation.x = -Math.PI / 2;
    const crownCap = vWhiteBox([2.86, 0.34, 2.04], [0, 18.46, 0], 0.065);
    opaque.add(crownVisor, crownUpper, crownCap);

    // 4. Triple Illuminated Beacon Spire Array (`y = 18.62 .. 21.85 m`, exact summit silhouette of `v3-t026.40`!)
    const spireOffsets = [-0.88, 0.0, 0.88] as const;
    for (const [idx, sx] of spireOffsets.entries()) {
      const topY = idx === 1 ? 21.85 : 21.35;
      opaque.add(vColorBox([0.28, 0.24, 0.28], "darkGray", [sx, 18.72, 0], 0.035, ["bottom"]));
      opaque.add(vStrut([sx, 18.80, 0], [sx, topY, 0], 0.095, "white"));
      // Glowing cyan beacon collars along each spire (`v3-t026.40` triple-ringed masts!)
      const ringHeights = detail === "far"
        ? [topY - 0.25]
        : [topY - 1.45, topY - 0.82, topY - 0.20];
      for (const ry of ringHeights) {
        emissive.add(vColorBox([0.19, 0.11, 0.19], "cyan", [sx, ry, 0], 0.025));
      }
    }

    return fuseVehicleBody("mb14-entrance-tower", opaque, emissive, null, detail === "near", 1.25).geometry;
  });

  const mesh = new Mesh(bodyGeo, materials.M_palette);
  mesh.name = "mb14-tower-body";
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  root.add(mesh);

  const aligned = alignBaseCenter(root);
  aligned.userData.forward = [0, 0, 1];
  return aligned;
}

export function registerMarsEntranceTower(registry: PieceRegistry): void {
  registry.register<EntranceTowerParams>("MB-14", {
    parse: parseEntranceTower,
    variants: {
      near: { detail: "near" },
    },
    metadata: { category: "building", pivot: "base-center" },
    build: ({ detail }) => buildEntranceTower(detail),
  });
}
