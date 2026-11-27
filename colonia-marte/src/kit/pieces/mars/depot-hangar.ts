import { Group, Mesh } from "three";
import { materials } from "../../../materials/shared";
import { cachedGeometry } from "../../primitives/cache";
import type { Point3 } from "../../primitives/details";
import type { HiddenFace } from "../../primitives/normals";
import { alignBaseCenter } from "../station/helpers";
import {
  addRecessedLouvers,
  fuseVehicleBody,
  latheAlongX,
  vColorBox,
  vStrip,
  vStrut,
  vWhiteBox,
  type VehicleDetail,
} from "./rover-truck";

/** Low-poly circular shrouded HVAC / exhaust fan pod for hangar rooftops (`v3-t074.80` / `v3-t050.10`). */
export function addHangarRoofFan(
  opaque: Group,
  center: Point3,
  radius: number,
  detail: VehicleDetail,
): void {
  const segs = detail === "near" ? 10 : 8;
  const [x, y, z] = center;
  const shroud = latheAlongX(
    [
      [radius * 0.68, -0.02],
      [radius, -0.02],
      [radius, 0.16],
      [radius * 0.80, 0.21],
      [radius * 0.68, 0.12],
      [radius * 0.68, 0.0],
    ],
    segs,
    "hull",
  );
  shroud.rotation.z = Math.PI / 2;
  shroud.position.set(x, y, z);
  opaque.add(shroud);

  const well = latheAlongX([[0, 0.02], [radius * 0.70, 0.02]], 8, "black");
  well.rotation.z = Math.PI / 2;
  well.position.set(x, y, z);
  opaque.add(well);

  const hub = latheAlongX([[0, 0.17], [radius * 0.26, 0.15], [radius * 0.28, 0.02]], 8, "darkGray");
  hub.rotation.z = Math.PI / 2;
  hub.position.set(x, y, z);
  opaque.add(hub);

  if (detail === "near") {
    for (let b = 0; b < 4; b++) {
      const blade = vStrip([radius * 1.32, 0.032, radius * 0.14], "gray", [x, y + 0.09, z]);
      blade.rotation.y = (b * Math.PI) / 4;
      opaque.add(blade);
    }
  }
}

/**
 * Large `MB-10` depot hangar (`style: "depot"`, `v3-t074.80` centerpiece):
 * 16.4 x 12.6 x 5.85 m vertically striped industrial hangar with sloped structural A-frame buttresses,
 * 10 rooftop shrouded fans, twin central HVAC penthouses, manifold pipes, access hatches, and a recessed
 * double vehicle portal sized for `MV-01` (6x6 rover truck) emerging onto the plaza.
 */
export function buildDepotHangar(detail: VehicleDetail = "near"): Group {
  const root = new Group();
  root.name = `MB-10_depot_${detail}`;

  const geo = cachedGeometry(["mb10DepotHangarV1", detail], () => {
    const opaque = new Group();
    const emissive = new Group();

    const bodyW = 14.8;
    const bodyD = 11.4;
    const wallH = 5.18;
    const deckY = 0.22;
    const roofY = deckY + wallH; // 5.40 m

    // 1. Base Plinth & Recessed Hangar Interior Bay (`5.6 m` wide x `4.12 m` tall x `5.8 m` deep)
    opaque.add(vColorBox([bodyW + 1.50, deckY, bodyD + 1.20], "black", [0, deckY / 2, 0.10], 0.04, ["bottom"]));
    opaque.add(vColorBox([bodyW + 0.40, 0.08, bodyD + 0.40], "darkGray", [0, deckY + 0.02, 0.05], 0.02, ["bottom"]));

    const portalW = 5.60;
    const portalH = 4.12;
    const bayDepth = 6.20;
    const sideMassW = (bodyW - portalW) / 2; // 4.60 m each side

    // Left, right & rear solid `darkGray` structural wall volumes leaving a true hollow central hangar bay!
    for (const sx of [-1, 1] as const) {
      opaque.add(
        vColorBox(
          [sideMassW, wallH, bodyD],
          "darkGray",
          [sx * (portalW / 2 + sideMassW / 2), deckY + wallH / 2, 0],
          0.06,
          ["bottom"],
        ),
      );
    }
    // Rear solid structural block behind the open hangar bay (`z = -5.70 .. -0.50`)
    opaque.add(vColorBox([portalW + 0.20, wallH, bodyD - bayDepth], "darkGray", [0, deckY + wallH / 2, -bodyD / 2 + (bodyD - bayDepth) / 2], 0.05, ["bottom"]));
    // Upper portal header block above the double doors (`y = deckY + portalH .. roofY`)
    const headerH = wallH - portalH;
    opaque.add(vColorBox([portalW + 0.20, headerH, bayDepth], "darkGray", [0, deckY + portalH + headerH / 2, bodyD / 2 - bayDepth / 2], 0.05));

    // Interior hangar bay floor, recessed rear equipment bulkhead, partially raised double doors & ceiling cyan lights
    opaque.add(vColorBox([portalW, 0.06, bayDepth + 0.60], "gray", [0, deckY + 0.04, bodyD / 2 - bayDepth / 2 + 0.20], 0.015, ["bottom"]));
    // Partially retracted double-leaf sectional doors under lintel + amber safety edge
    opaque.add(vColorBox([portalW - 0.16, 0.56, 0.16], "hull", [0, deckY + portalH - 0.24, bodyD / 2 - 0.28], 0.025));
    opaque.add(vStrip([portalW - 0.32, 0.07, 0.18], "warning", [0, deckY + portalH - 0.50, bodyD / 2 - 0.28]));
    // Beveled chamfered portal surround (`v3-t074.80` double hangar portal frame)
    for (const sx of [-1, 1] as const) {
      opaque.add(vColorBox([0.42, portalH + 0.28, 0.44], "hull", [sx * (portalW / 2 + 0.16), deckY + portalH / 2 + 0.08, bodyD / 2 + 0.08], 0.045, ["bottom"]));
      // Floor-level amber warning beacon by the hangar doors (`carbon-distrito-base.md` §1b!)
      opaque.add(vColorBox([0.24, 0.18, 0.24], "black", [sx * (portalW / 2 + 0.42), deckY + 0.09, bodyD / 2 + 0.42], 0.025, ["bottom"]));
      emissive.add(vColorBox([0.14, 0.10, 0.14], "warning", [sx * (portalW / 2 + 0.42), deckY + 0.20, bodyD / 2 + 0.42], 0.02));
    }
    opaque.add(vColorBox([portalW + 0.76, 0.42, 0.46], "hull", [0, deckY + portalH + 0.20, bodyD / 2 + 0.08], 0.045));
    emissive.add(vStrip([portalW - 0.80, 0.07, 0.05], "cyan", [0, deckY + portalH + 0.20, bodyD / 2 + 0.32]));
    // Interior hangar ceiling worklights
    for (const iz of [1.2, 3.4]) {
      emissive.add(vStrip([3.80, 0.05, 0.22], "cyan", [0, deckY + portalH - 0.02, iz]));
    }

    // 2. Vertically Striped Industrial Facade (`v3-t074.80` signature alternating vertical armor ribs!)
    const stripePitch = detail === "far" ? 1.56 : 1.04;
    const stripeW = detail === "far" ? 1.08 : 0.72;
    const stripeH = wallH - 0.24;
    const stripeY = deckY + wallH / 2;

    // Front (+Z) side wings flanking the portal (`x in [-7.1 .. -3.2]` and `[+3.2 .. +7.1]`)
    for (const sx of [-1, 1] as const) {
      for (let xAbs = 3.48; xAbs <= 6.95; xAbs += stripePitch) {
        const tone = Math.round(xAbs / stripePitch) % 2 === 0 ? "hull" : "offWhite";
        const omitIn: HiddenFace[] = ["back", "bottom"];
        opaque.add(vColorBox([stripeW, stripeH, 0.16], tone, [sx * xAbs, stripeY, bodyD / 2 + 0.06], 0.028, omitIn));
      }
    }
    // Rear (-Z) full-width vertical stripes
    const rearCount = Math.floor((bodyW - 0.8) / stripePitch);
    for (let i = 0; i <= rearCount; i++) {
      const rx = -((rearCount * stripePitch) / 2) + i * stripePitch;
      const tone = i % 2 === 0 ? "hull" : "gray";
      opaque.add(vColorBox([stripeW, stripeH, 0.16], tone, [rx, stripeY, -bodyD / 2 - 0.06], 0.028, ["front", "bottom"]));
    }
    // Left (-X) & Right (+X) full-depth vertical stripes (`v3-t074.80` right-hand striped hangar wall!)
    const sideCount = Math.floor((bodyD - 0.9) / stripePitch);
    for (const sx of [-1, 1] as const) {
      const omitIn: HiddenFace[] = sx > 0 ? ["left", "bottom"] : ["right", "bottom"];
      for (let i = 0; i <= sideCount; i++) {
        const sz = -((sideCount * stripePitch) / 2) + i * stripePitch;
        const tone = i % 2 === 0 ? "hull" : "offWhite";
        opaque.add(vColorBox([0.16, stripeH, stripeW], tone, [sx * (bodyW / 2 + 0.06), stripeY, sz], 0.028, omitIn));
      }
    }

    // 3. Heavy Sloped A-Frame Buttress Piers (`v3-t074.80` signature angled frame legs!)
    for (const sx of [-1, 1] as const) {
      // Front portal-flanking buttresses
      opaque.add(
        vStrut(
          [sx * 3.55, roofY + 0.10, bodyD / 2 - 0.10],
          [sx * 3.85, deckY + 0.08, bodyD / 2 + 1.48],
          0.62,
          "hull",
        ),
      );
      // Corner front & rear sloped buttresses
      for (const sz of [-1, 1] as const) {
        opaque.add(
          vStrut(
            [sx * (bodyW / 2 - 0.10), roofY + 0.10, sz * (bodyD / 2 - 0.45)],
            [sx * (bodyW / 2 + 1.18), deckY + 0.08, sz * (bodyD / 2 - 0.25)],
            0.58,
            "hull",
          ),
        );
      }
    }

    // 4. Beveled Roof Cornice + 10 Shrouded Fans + Twin Penthouses + Manifold Pipes + Access Hatches (`v3-t074.80`)
    opaque.add(vColorBox([bodyW + 0.72, 0.42, bodyD + 0.72], "hull", [0, roofY + 0.20, 0], 0.11));
    opaque.add(vColorBox([bodyW - 0.24, 0.12, bodyD - 0.24], "gray", [0, roofY + 0.39, 0], 0.03));
    const rDeckY = roofY + 0.45;

    // 10 rooftop circular fans (`5` per side bank: `z = -4.2, -2.1, 0.0, +2.1, +4.2`, `x = +-5.35`)
    const fanZs = detail === "far" ? [-3.4, 0, 3.4] : [-4.2, -2.1, 0.0, 2.1, 4.2];
    for (const sx of [-1, 1] as const) {
      for (const fz of fanZs) {
        addHangarRoofFan(opaque, [sx * 5.35, rDeckY, fz], 0.84, detail);
      }
    }

    // Twin central beveled HVAC / power penthouses (`x = 0`, `z = +-2.45`) with red status ticks (`v3-t074.80`)
    for (const pz of [-2.45, 2.45]) {
      opaque.add(vColorBox([3.70, 0.64, 2.18], "hull", [0, rDeckY + 0.30, pz], 0.075, ["bottom"]));
      opaque.add(vWhiteBox([2.10, 0.16, 2.22], [0, rDeckY + 0.64, pz], 0.035));
      emissive.add(vStrip([0.36, 0.045, 0.05], "doorClosed", [0, rDeckY + 0.68, pz + (pz > 0 ? 1.12 : -1.12)]));
    }

    // Rooftop access hatches (`x = +-2.75, z = 0`) & interconnected pipe manifolds (`near` & `middle`)
    if (detail !== "far") {
      for (const sx of [-1, 1] as const) {
        opaque.add(vColorBox([1.18, 0.20, 1.42], "darkGray", [sx * 2.75, rDeckY + 0.10, 0], 0.035, ["bottom"]));
        opaque.add(vWhiteBox([0.96, 0.08, 1.20], [sx * 2.75, rDeckY + 0.22, 0], 0.02, ["bottom"]));
        // Longitudinal collector pipe along fan bank
        opaque.add(vColorBox([0.15, 0.14, 8.80], "darkGray", [sx * 4.05, rDeckY + 0.08, 0], 0.025));
        // Cross-manifold pipes feeding into the two central penthouses
        for (const pz of [-2.45, 2.45]) {
          opaque.add(vColorBox([2.30, 0.14, 0.15], "gray", [sx * 2.90, rDeckY + 0.08, pz], 0.025));
        }
        // Short stub branches into each fan shroud
        for (const fz of fanZs) {
          opaque.add(vStrip([0.62, 0.10, 0.10], "darkGray", [sx * 4.38, rDeckY + 0.07, fz]));
        }
      }
      // Side maintenance louver grilles
      addRecessedLouvers(opaque, 1.48, 0.64, detail === "near" ? 4 : 2, [-bodyW / 2 - 0.15, deckY + 1.65, 0], -Math.PI / 2);
      addRecessedLouvers(opaque, 1.48, 0.64, detail === "near" ? 4 : 2, [bodyW / 2 + 0.15, deckY + 1.65, 0], Math.PI / 2);
    }

    return fuseVehicleBody("mb10-depot-hangar", opaque, emissive, null, detail === "near", 1.25).geometry;
  });

  const mesh = new Mesh(geo, materials.M_palette);
  mesh.name = "mb10-depot-body";
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  root.add(mesh);

  const aligned = alignBaseCenter(root);
  aligned.userData.forward = [0, 0, 1];
  return aligned;
}

/**
 * Smaller `MB-10` open-door garage / workshop (`style: "workshop"`, `v3-t050.10` & `v3-t074.80` foreground):
 * 8.8 x 6.8 x 3.92 m beveled module with horizontal `darkGray` corner strakes, 3 side windows, armored personnel
 * door, open vehicle bay with interior lighting + floor warning beacon (sized for `MV-03` buggy / `MV-11` rover),
 * and rooftop twin shrouded fans + penthouse + L-pipe manifold.
 */
export function buildWorkshopGarage(detail: VehicleDetail = "near"): Group {
  const root = new Group();
  root.name = `MB-10_workshop_${detail}`;

  const geo = cachedGeometry(["mb10WorkshopGarageV2", detail], () => {
    const opaque = new Group();
    const emissive = new Group();

    const w = 8.8;
    const d = 6.8;
    const wallH = 3.44;
    const deckY = 0.20;
    const roofY = deckY + wallH; // 3.64 m

    // Base plinth
    opaque.add(vColorBox([w + 0.32, deckY, d + 0.32], "black", [0, deckY / 2, 0], 0.035, ["bottom"]));

    // Open vehicle portal on the right half (`x = +1.45`, clear width `3.80 m`, clear height `2.62 m`)
    const portalX = 1.45;
    const portalW = 3.80;
    const portalH = 2.62;
    const bayDepth = 4.90;

    // Left solid workshop room (`x = -4.40 .. -0.45`, width `3.95 m`)
    opaque.add(vWhiteBox([3.95, wallH, d], [-2.425, deckY + wallH / 2, 0], 0.085, ["bottom"]));
    // Right outer pier (`x = +3.35 .. +4.40`, width `1.05 m`)
    opaque.add(vWhiteBox([1.05, wallH, d], [3.875, deckY + wallH / 2, 0], 0.085, ["bottom"]));
    // Rear wall behind vehicle bay (`z = -3.40 .. -1.50`) + taller header lintel above portal (`0.82 m` for the 3 circular vents!)
    opaque.add(vWhiteBox([portalW + 0.16, wallH, d - bayDepth], [portalX, deckY + wallH / 2, -d / 2 + (d - bayDepth) / 2], 0.06, ["bottom"]));
    opaque.add(vWhiteBox([portalW + 0.16, wallH - portalH, bayDepth], [portalX, deckY + portalH + (wallH - portalH) / 2, d / 2 - bayDepth / 2], 0.06));

    // Signature row of 3 circular shrouded exhaust ports above the open workshop bay (`v3-t074.80` foreground-right!)
    if (detail !== "far") {
      const portSegs = detail === "near" ? 12 : 8;
      for (const px of [portalX - 1.12, portalX, portalX + 1.12]) {
        const py = deckY + portalH + 0.42;
        const ring = latheAlongX(
          [[0.22, -0.02], [0.34, -0.02], [0.34, 0.10], [0.24, 0.12], [0.22, 0.02]],
          portSegs,
          "darkGray",
        );
        ring.rotation.y = -Math.PI / 2;
        ring.position.set(px, py, d / 2 + 0.02);
        opaque.add(ring);

        const cavity = latheAlongX([[0, 0.02], [0.23, 0.02]], 8, "black");
        cavity.rotation.y = -Math.PI / 2;
        cavity.position.set(px, py, d / 2 + 0.02);
        opaque.add(cavity);

        if (detail === "near") {
          for (let b = 0; b < 3; b++) {
            const vane = vStrip([0.40, 0.028, 0.04], "hull", [px, py, d / 2 + 0.06]);
            vane.rotation.z = (b * Math.PI) / 3;
            opaque.add(vane);
          }
        }
      }
    }

    // Interior workshop bay floor, service pit grate, tool rack, overhead hoist & ceiling cyan worklight
    opaque.add(vColorBox([portalW + 0.04, 0.05, bayDepth + 0.10], "gray", [portalX, deckY + 0.025, d / 2 - bayDepth / 2], 0.012, ["bottom"]));
    opaque.add(vColorBox([portalW - 0.12, 0.34, 0.14], "darkGray", [portalX, deckY + portalH - 0.15, d / 2 - 0.22], 0.02));
    emissive.add(vStrip([2.60, 0.045, 0.16], "cyan", [portalX, deckY + portalH - 0.02, 1.05]));
    emissive.add(vStrip([portalW - 0.40, 0.055, 0.04], "cyan", [portalX, deckY + 0.04 + portalH, d / 2 + 0.03]));

    if (detail === "near") {
      // Interior inspection pit grate + wheel chock + wall tool rack + diagnostic bench + overhead hoist beam
      opaque.add(vStrip([1.18, 0.03, 2.40], "black", [portalX, deckY + 0.045, 0.85]));
      for (let g = 0; g < 6; g++) {
        opaque.add(vColorBox([1.10, 0.028, 0.12], "darkGray", [portalX, deckY + 0.055, -0.15 + g * 0.40], 0.006));
      }
      // Interior left wall tool rack & diagnostic terminal (`x = -0.42`)
      opaque.add(vColorBox([0.08, 1.18, 1.86], "darkGray", [-0.41, deckY + 1.32, 0.55], 0.016, ["left"]));
      for (let t = 0; t < 4; t++) {
        opaque.add(vColorBox([0.06, 0.52, 0.09], "hull", [-0.34, deckY + 1.32, 0.0 + t * 0.36], 0.012));
      }
      opaque.add(vColorBox([0.42, 0.78, 1.12], "hull", [-0.18, deckY + 0.42, -0.75], 0.025, ["bottom"]));
      emissive.add(vStrip([0.04, 0.18, 0.36], "cyan", [-0.34, deckY + 1.36, -0.75]));
      // Overhead workshop I-beam hoist rail
      opaque.add(vColorBox([0.16, 0.14, 3.80], "hull", [portalX, deckY + portalH - 0.10, 0.60], 0.02));
      opaque.add(vColorBox([0.26, 0.20, 0.28], "warning", [portalX, deckY + portalH - 0.24, 0.10], 0.025));
    }

    // Floor-level safety beacon beside workshop portal (`v3-t074.80` small glowing pod at garage corner!)
    opaque.add(vColorBox([0.32, 0.34, 0.32], "darkGray", [-0.68, deckY + 0.17, d / 2 + 0.20], 0.03, ["bottom"]));
    emissive.add(vColorBox([0.18, 0.12, 0.18], "cyan", [-0.68, deckY + 0.28, d / 2 + 0.22], 0.02));

    // Front-left armored personnel door (`x = -2.15`, `v3-t050.10` & `v3-t074.80` signature door!)
    opaque.add(vColorBox([1.36, 2.16, 0.18], "hull", [-2.15, deckY + 1.08, d / 2 + 0.05], 0.035, ["back", "bottom"]));
    opaque.add(vColorBox([1.04, 1.92, 0.12], "darkGray", [-2.15, deckY + 0.98, d / 2 + 0.12], 0.022, ["back", "bottom"]));
    opaque.add(vStrip([0.08, 1.72, 0.06], "black", [-2.15, deckY + 0.98, d / 2 + 0.17]));
    emissive.add(vStrip([0.06, 0.28, 0.04], "doorClosed", [-1.74, deckY + 0.88, d / 2 + 0.18]));

    // Horizontal `darkGray` corner strakes + 3 recessed side windows + rear shop gas cylinders (`v3-t074.80`)
    if (detail !== "far") {
      for (const sy of [deckY + 2.02, deckY + 2.45, deckY + 2.88]) {
        opaque.add(vColorBox([0.12, 0.22, d + 0.08], "darkGray", [-w / 2 - 0.02, sy, 0], 0.02, ["right"]));
        opaque.add(vColorBox([0.12, 0.22, d + 0.08], "darkGray", [w / 2 + 0.02, sy, 0], 0.02, ["left"]));
        opaque.add(vColorBox([2.10, 0.22, 0.12], "darkGray", [-w / 2 + 1.02, sy, d / 2 + 0.02], 0.02, ["back"]));
        opaque.add(vColorBox([1.10, 0.22, 0.12], "darkGray", [w / 2 - 0.52, sy, d / 2 + 0.02], 0.02, ["back"]));
      }
      for (const wz of [-1.85, 0.0, 1.85]) {
        opaque.add(vColorBox([0.10, 0.68, 0.86], "darkGray", [-w / 2 - 0.02, deckY + 1.08, wz], 0.02, ["right"]));
        opaque.add(vStrip([0.06, 0.52, 0.70], "black", [-w / 2 - 0.055, deckY + 1.08, wz]));
      }
      addRecessedLouvers(opaque, 1.36, 0.58, detail === "near" ? 4 : 2, [w / 2 + 0.04, deckY + 1.24, -1.2], Math.PI / 2);
      addRecessedLouvers(opaque, 1.56, 0.62, detail === "near" ? 4 : 2, [-2.20, deckY + 1.45, -d / 2 - 0.04], Math.PI);

      // Twin vertical shop gas cylinders mounted on rear bulkhead (`detail === "near"`)
      if (detail === "near") {
        for (const gx of [0.65, 1.35]) {
          const tank = latheAlongX(
            [[0, -0.82], [0.22, -0.78], [0.24, -0.62], [0.24, 0.62], [0.18, 0.78], [0, 0.86]],
            10,
            "offWhite",
          );
          tank.rotation.z = Math.PI / 2;
          tank.position.set(gx, deckY + 1.02, -d / 2 - 0.26);
          opaque.add(tank);
          opaque.add(vColorBox([0.52, 0.10, 0.32], "darkGray", [gx, deckY + 1.28, -d / 2 - 0.18], 0.018));
        }
      }
    }

    // Beveled roof cornice + 2 large 14-seg circular shrouded fans + raised penthouse + L-pipe loop (`v3-t050.10`)
    opaque.add(vColorBox([w + 0.36, 0.36, d + 0.36], "hull", [0, roofY + 0.16, 0], 0.095));
    opaque.add(vColorBox([w - 0.36, 0.10, d - 0.36], "gray", [0, roofY + 0.32, 0], 0.025));
    const rTop = roofY + 0.37;

    const fanSegs = detail === "near" ? 14 : 8;
    for (const fx of [-2.75, -0.65]) {
      const shroud = latheAlongX(
        [[0.66, -0.02], [0.96, -0.02], [0.96, 0.17], [0.78, 0.22], [0.66, 0.12], [0.66, 0.0]],
        fanSegs,
        "hull",
      );
      shroud.rotation.z = Math.PI / 2;
      shroud.position.set(fx, rTop, 1.55);
      opaque.add(shroud);
      const well = latheAlongX([[0, 0.02], [0.68, 0.02]], 10, "black");
      well.rotation.z = Math.PI / 2;
      well.position.set(fx, rTop, 1.55);
      opaque.add(well);
      const hub = latheAlongX([[0, 0.18], [0.25, 0.15], [0.27, 0.02]], 10, "darkGray");
      hub.rotation.z = Math.PI / 2;
      hub.position.set(fx, rTop, 1.55);
      opaque.add(hub);
      if (detail === "near") {
        for (let b = 0; b < 4; b++) {
          const blade = vStrip([1.26, 0.032, 0.13], "gray", [fx, rTop + 0.09, 1.55]);
          blade.rotation.y = (b * Math.PI) / 4;
          opaque.add(blade);
        }
      }
    }

    opaque.add(vColorBox([2.15, 0.56, 1.68], "hull", [2.15, rTop + 0.26, -1.35], 0.065, ["bottom"]));
    opaque.add(vWhiteBox([1.22, 0.14, 1.72], [2.15, rTop + 0.56, -1.35], 0.03));

    if (detail !== "far") {
      opaque.add(vColorBox([3.85, 0.13, 0.14], "darkGray", [-0.70, rTop + 0.07, -1.35], 0.022));
      opaque.add(vColorBox([0.14, 0.13, 2.95], "darkGray", [-2.60, rTop + 0.07, 0.08], 0.022));
      opaque.add(vColorBox([2.10, 0.13, 0.14], "gray", [-1.65, rTop + 0.07, 0.42], 0.022));
    }

    return fuseVehicleBody("mb10-workshop-garage", opaque, emissive, null, detail === "near", 1.05).geometry;
  });

  const mesh = new Mesh(geo, materials.M_palette);
  mesh.name = "mb10-workshop-body";
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  root.add(mesh);

  const aligned = alignBaseCenter(root);
  aligned.userData.forward = [0, 0, 1];
  return aligned;
}
