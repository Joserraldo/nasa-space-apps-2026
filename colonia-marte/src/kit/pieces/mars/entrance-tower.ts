import { Group, Mesh } from "three";
import { materials } from "../../../materials/shared";
import { polygonShape } from "../../primitives";
import { cachedGeometry } from "../../primitives/cache";
import type { PieceRegistry } from "../../registry";
import { alignBaseCenter, boostVertexLuminance, extrudedMesh, parseChoice, parseRecord } from "../station/helpers";
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

/** Beveled glowing cyan vertical light panel with subtle diffuse depth modulation (`M_palette` emissive). */
function vCyanGlowPanel(
  size: [number, number, number],
  center: [number, number, number],
  chamfer: number,
  diffuseScale = 0.88,
): Mesh {
  const base = vColorBox(size, "cyan", center, chamfer, ["back"]);
  const tinted = boostVertexLuminance(base.geometry, [diffuseScale * 0.85, diffuseScale * 0.96, diffuseScale]);
  base.geometry.dispose();
  const mesh = new Mesh(tinted, materials.M_palette);
  mesh.position.copy(base.position);
  return mesh;
}

/**
 * Add one of the 4 cardinal facade assemblies (`+Z`, `+X`, `-Z`, `-X`) of the slender MB-14 landmark shaft:
 * tall recessed vertical panels that GLOW CYAN down almost the entire height of the tower between sculpted
 * white architectural frames (`v3-t026.40`), with thin horizontal structural mullions and a heavy podium portal/louver bay.
 */
function addGlowingShaftFacade(
  opaque: Group,
  emissive: Group,
  rotY: number,
  detail: VehicleDetail,
): void {
  const face = new Group();
  face.rotation.y = rotY;
  const emFace = new Group();
  emFace.rotation.y = rotY;

  const faceZ = 1.66;
  const startY = 4.35;
  const totalH = 14.30; // Spans almost the entire height of the tower (`y = 4.35 .. 18.65 m`)!
  const midY = startY + totalH / 2;

  // Deep recessed dark bezel framing the vertical glowing cyan panel bay
  face.add(vColorBox([1.86, totalH + 0.24, 0.16], "black", [0, midY, faceZ - 0.03], 0.025, ["back"]));
  // Central vertical structural spine dividing the bay into twin slender glowing vertical columns (`v3-t026.40`)
  face.add(vColorBox([0.14, totalH + 0.12, 0.16], "hull", [0, midY, faceZ + 0.01], 0.022, ["back"]));

  const tiers = detail === "far" ? 3 : 7;
  const stepH = totalH / tiers;

  for (let t = 0; t < tiers; t++) {
    const cy = startY + (t + 0.5) * stepH;
    const panelH = stepH - 0.11;
    // Twin vertical beveled panels glowing bright cyan down the whole facade!
    for (const sx of [-0.46, 0.46]) {
      emFace.add(
        vCyanGlowPanel(
          [0.74, panelH, 0.11],
          [sx, cy, faceZ + 0.025],
          0.022,
          t % 2 === 0 ? 0.96 : 0.84,
        ),
      );
      if (detail === "near") {
        // Crisp inner bright-core vertical light bar down each glowing panel
        emFace.add(vStrip([0.12, panelH - 0.10, 0.04], "cyan", [sx, cy, faceZ + 0.072]));
      }
    }
    // Thin horizontal structural mullion bar between glowing vertical segments
    if (t > 0 && detail !== "far") {
      face.add(vColorBox([1.76, 0.085, 0.15], "hull", [0, startY + t * stepH, faceZ + 0.02], 0.016, ["back"]));
    }
  }

  // Outer vertical white frame cheek trim + recessed side light hairline
  for (const sx of [-1.02, 1.02]) {
    face.add(vWhiteBox([0.18, totalH + 0.28, 0.20], [sx, midY, faceZ + 0.03], 0.028, ["back"]));
  }
  // Stepped top white arch lintel bridging the twin white columns (`y = 18.78 m`)
  face.add(vWhiteBox([2.24, 0.30, 0.24], [0, startY + totalH + 0.16, faceZ + 0.03], 0.04, ["back"]));

  // Heavy lower podium bay (`y = 0.95 .. 3.85 m`)
  if (Math.abs(rotY) < 1e-4) {
    // Front (+Z) reinforced airlock/entrance portal frame
    face.add(vColorBox([2.18, 2.62, 0.30], "darkGray", [0, 2.02, 2.48], 0.042, ["back", "bottom"]));
    face.add(vColorBox([1.62, 2.22, 0.18], "black", [0, 1.84, 2.58], 0.025, ["back", "bottom"]));
    face.add(vColorBox([1.36, 2.00, 0.12], "hull", [0, 1.75, 2.64], 0.025, ["back", "bottom"]));
    emFace.add(vStrip([1.32, 0.09, 0.055], "cyan", [0, 3.08, 2.63]));
  } else if (detail !== "far") {
    addRecessedLouvers(face, 1.44, 0.68, detail === "near" ? 4 : 2, [0, 2.15, 2.46], 0);
  }

  // Glowing cyan collar line wrapping the top of the heavy base (`v3-t060.40` / `v3-t026.40`)
  face.add(vStrip([2.72, 0.12, 0.09], "black", [0, 3.84, 2.34]));
  emFace.add(vStrip([2.56, 0.065, 0.055], "cyan", [0, 3.84, 2.38]));

  opaque.add(face);
  emissive.add(emFace);
}

function buildEntranceTower(detail: VehicleDetail): Group {
  const root = new Group();
  root.name = `MB-14_${detail}`;

  const bodyGeo = cachedGeometry(["mb14EntranceTowerV2", detail], () => {
    const opaque = new Group();
    const emissive = new Group();

    // 1. Heavy Buttressed Base (`y = 0.00 .. 4.15 m`, footprint ~6.6 m)
    const subPlinth = extrudedMesh(polygonShape(3.52, 8), 0.52, 0.04, "black", [0, 0.26, 0]);
    subPlinth.rotation.x = -Math.PI / 2;
    const midPlinth = extrudedMesh(polygonShape(3.22, 8), 0.28, 0.035, "darkGray", [0, 0.66, 0]);
    midPlinth.rotation.x = -Math.PI / 2;
    opaque.add(subPlinth, midPlinth);

    opaque.add(vWhiteBox([4.88, 3.26, 4.88], [0, 2.42, 0], 0.12, ["bottom"]));
    for (const sx of [-1, 1] as const) {
      for (const sz of [-1, 1] as const) {
        // Heavy battered corner buttresses anchoring the slender tower to the plaza
        opaque.add(
          vStrut(
            [sx * 1.96, 3.96, sz * 1.96],
            [sx * 2.64, 0.76, sz * 2.64],
            0.66,
            "hull",
          ),
        );
        opaque.add(vColorBox([0.74, 0.36, 0.74], "darkGray", [sx * 2.62, 0.90, sz * 2.62], 0.04, ["bottom"]));
      }
    }
    opaque.add(vWhiteBox([4.56, 0.30, 4.56], [0, 4.12, 0], 0.055));

    // 2. Tall, Slender White-Framed Monolith Shaft (`y = 4.20 .. 19.10 m` — NO control-tower window belt!)
    const shaftH = 14.90;
    const shaftMidY = 4.20 + shaftH / 2;
    opaque.add(vColorBox([3.36, shaftH, 3.36], "darkGray", [0, shaftMidY, 0], 0.075, ["bottom"]));

    // Four continuous sculpted white corner megacolumns + side technical rib pods (`v3-t026.40`)
    for (const sx of [-1, 1] as const) {
      for (const sz of [-1, 1] as const) {
        opaque.add(vWhiteBox([0.78, shaftH + 0.16, 0.78], [sx * 1.44, shaftMidY, sz * 1.44], 0.075, ["bottom"]));

        if (detail !== "far") {
          const podCount = detail === "near" ? 6 : 3;
          for (let p = 0; p < podCount; p++) {
            const py = 5.20 + p * (12.6 / podCount);
            opaque.add(vWhiteBox([0.24, 1.12, 0.54], [sx * 1.88, py, sz * 1.44], 0.03));
            opaque.add(vColorBox([0.24, 0.22, 0.48], "hull", [sx * 1.89, py - 0.44, sz * 1.44], 0.02));
            if (detail === "near") {
              emissive.add(vStrip([0.055, 0.56, 0.08], "cyan", [sx * 2.01, py + 0.06, sz * 1.44]));
            }
          }
        }
      }
    }

    // 4-sided full-height glowing cyan vertical panel facades
    for (let i = 0; i < 4; i++) {
      addGlowingShaftFacade(opaque, emissive, (i * Math.PI) / 2, detail);
    }

    // 3. Sculpted Tapered White Arch Crown (`y = 19.10 .. 20.35 m`, `v3-t026.40` rounded/chamfered white top)
    opaque.add(vWhiteBox([3.72, 0.44, 3.72], [0, 19.28, 0], 0.085));
    const crownMid = extrudedMesh(polygonShape(2.26, 8), 0.46, 0.055, "hull", [0, 19.72, 0]);
    crownMid.rotation.x = -Math.PI / 2;
    opaque.add(crownMid);
    opaque.add(vWhiteBox([2.76, 0.42, 2.16], [0, 20.14, 0], 0.075));
    // Glowing cyan crown trim slots on front/back of top cap
    for (const sz of [-1.09, 1.09]) {
      emissive.add(vStrip([1.68, 0.075, 0.05], "cyan", [0, 20.14, sz]));
    }

    // 4. Triple Ringed Colony Beacon Antennas on Summit (`y = 20.35 .. 23.60 m`, `v3-t026.40` signature!)
    const spireOffsets = [-0.82, 0.0, 0.82] as const;
    for (const [idx, sx] of spireOffsets.entries()) {
      const topY = idx === 1 ? 23.60 : 23.05;
      opaque.add(vColorBox([0.26, 0.24, 0.26], "darkGray", [sx, 20.44, 0], 0.035, ["bottom"]));
      opaque.add(vStrut([sx, 20.52, 0], [sx, topY, 0], 0.09, "white"));
      const ringHeights = detail === "far"
        ? [topY - 0.25]
        : [topY - 1.50, topY - 0.85, topY - 0.20];
      for (const ry of ringHeights) {
        emissive.add(vColorBox([0.19, 0.11, 0.19], "cyan", [sx, ry, 0], 0.025));
      }
    }

    return fuseVehicleBody("mb14-entrance-tower", opaque, emissive, null, detail === "near", 1.20).geometry;
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
