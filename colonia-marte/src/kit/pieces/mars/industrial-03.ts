import { Group, Mesh, PlaneGeometry, Shape } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { decalScreenGeometry } from "../../../materials/screens";
import { materials } from "../../../materials/shared";
import { extrudeProfile, polygonRing, polygonShape } from "../../primitives";
import { cachedGeometry } from "../../primitives/cache";
import type { PieceRegistry } from "../../registry";
import { alignBaseCenter, extrudedMesh, parseChoice, parseRecord } from "../station/helpers";
import { exteriorWhiteGeometry } from "./mars-helpers";
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
import type { HiddenFace } from "../../primitives/normals";

function vHullBox(
  size: [number, number, number],
  center: [number, number, number],
  chamfer = 0.02,
  omit: HiddenFace[] = [],
): Mesh {
  return vColorBox(size, "hull", center, chamfer, omit);
}

export interface Industrial03Params {
  detail: VehicleDetail;
}

export function parseIndustrial03(input: unknown): Industrial03Params {
  const rec = parseRecord(input, ["detail"]);
  return { detail: parseChoice(rec.detail, vehicleDetailLevels, "near") };
}

/** Extrude a 2D YZ side profile across the X axis in crisp exterior white. */
function whiteProfileX(pts: [number, number][], widthX: number, bevel: number, xCenter = 0): Mesh {
  const s = new Shape();
  s.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
  s.closePath();
  const geo = exteriorWhiteGeometry(extrudeProfile(s, widthX, bevel));
  const mesh = new Mesh(geo, materials.M_palette);
  // Shape X -> world Z, Shape Y -> world Y, extrude Z -> world X
  mesh.rotation.y = Math.PI / 2;
  mesh.position.x = xCenter;
  return mesh;
}

/** Stadium-rounded horizontal scrubber/pressure vessel (`v3-t010.60` & `v3-t044.90` mid-terrace). */
function addScrubberVessel(
  opaque: Group,
  cx: number,
  baseY: number,
  cz: number,
  widthX: number,
  heightY: number,
  depthZ: number,
  detail: VehicleDetail,
): void {
  const r = depthZ / 2 - 0.04;
  const halfSpan = Math.max(0.2, widthX / 2 - r);
  const segs = detail === "near" ? 12 : detail === "middle" ? 8 : 6;
  const s = new Shape();
  for (let i = 0; i <= segs; i++) {
    const a = -Math.PI / 2 + (i / segs) * Math.PI;
    const px = halfSpan + Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (i === 0) s.moveTo(px, py);
    else s.lineTo(px, py);
  }
  for (let i = 0; i <= segs; i++) {
    const a = Math.PI / 2 + (i / segs) * Math.PI;
    s.lineTo(-halfSpan + Math.cos(a) * r, Math.sin(a) * r);
  }
  s.closePath();

  const shell = extrudedMesh(s, heightY, 0.06, "gray", [cx, baseY + heightY / 2, cz]);
  shell.rotation.x = -Math.PI / 2;
  opaque.add(shell);

  if (detail !== "far") {
    // Recessed dark top trough + transverse stiffening ribs (`v3-t010.60`)
    opaque.add(
      vColorBox(
        [widthX - 0.86, 0.14, depthZ - 0.56],
        "darkGray",
        [cx, baseY + heightY + 0.02, cz],
        0.025,
        ["bottom"],
      ),
    );
    const ribCount = detail === "near" ? 6 : 4;
    for (let i = 0; i < ribCount; i++) {
      const rx = cx - (widthX - 1.56) / 2 + (i / (ribCount - 1)) * (widthX - 1.56);
      opaque.add(
        vHullBox(
          [0.14, 0.16, depthZ - 0.66],
          [rx, baseY + heightY + 0.08, cz],
          0.02,
          ["bottom"],
        ),
      );
    }
  }
}

/** Add one recessed X-braced structural truss frame (`[X][X][X]` terrace fascia in `v3-t010.60`). */
function addXTrussBay(
  opaque: Group,
  center: [number, number, number],
  bayW: number,
  bayH: number,
  rotY: number,
  detail: VehicleDetail,
): void {
  const bay = new Group();
  bay.position.set(center[0], center[1], center[2]);
  bay.rotation.y = rotY;

  bay.add(vColorBox([bayW, bayH, 0.14], "hull", [0, 0, 0], 0.02, ["back"]));
  bay.add(vColorBox([bayW - 0.18, bayH - 0.18, 0.08], "gray", [0, 0, 0.045], 0.015, ["back"]));
  if (detail !== "far") {
    const hw = bayW / 2 - 0.12;
    const hh = bayH / 2 - 0.12;
    bay.add(vStrut([-hw, -hh, 0.075], [hw, hh, 0.075], 0.085, "white"));
    bay.add(vStrut([-hw, hh, 0.075], [hw, -hh, 0.075], 0.085, "white"));
  }
  opaque.add(bay);
}

/** Rooftop parabolic telemetry dish + tripod feedhorn (`v3-t010.60` & `v3-t044.90`). */
function addRooftopDish(opaque: Group, emissive: Group, base: [number, number, number], detail: VehicleDetail): void {
  const [bx, by, bz] = base;
  // Pedestal & azimuth turret
  opaque.add(vColorBox([1.24, 0.34, 1.24], "darkGray", [bx, by + 0.17, bz], 0.035, ["bottom"]));
  const mast = extrudedMesh(polygonShape(0.32, detail === "far" ? 6 : 10), 0.92, 0.025, "hull", [bx, by + 0.78, bz]);
  mast.rotation.x = -Math.PI / 2;
  opaque.add(mast);

  // Tilted parabolic dish assembly facing colony approach (+Z / +X)
  const head = new Group();
  head.position.set(bx, by + 1.38, bz + 0.08);
  head.rotation.y = 0.32;
  head.rotation.x = -0.58;

  const segs = detail === "near" ? 14 : detail === "middle" ? 10 : 8;
  const outerRim = extrudedMesh(polygonRing(1.42, 0.92, segs), 0.16, 0.025, "white", [0, 0, 0]);
  const midBowl = extrudedMesh(polygonRing(0.95, 0.42, segs), 0.16, 0.02, "hull", [0, 0, -0.08]);
  const innerHub = extrudedMesh(polygonShape(0.46, segs), 0.18, 0.02, "darkGray", [0, 0, -0.14]);
  head.add(outerRim, midBowl, innerHub);

  if (detail !== "far") {
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      head.add(
        vStrut(
          [Math.cos(a) * 0.28, Math.sin(a) * 0.28, -0.06],
          [Math.cos(a) * 1.28, Math.sin(a) * 1.28, 0.05],
          0.055,
          "gray",
        ),
      );
    }
    // Tripod feedhorn arms + receiver pod
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 - Math.PI / 2;
      head.add(
        vStrut(
          [Math.cos(a) * 1.05, Math.sin(a) * 1.05, 0.04],
          [0, 0, 0.92],
          0.045,
          "darkGray",
        ),
      );
    }
    head.add(vColorBox([0.26, 0.26, 0.22], "hull", [0, 0, 0.96], 0.03));
    emissive.add(
      vStrip(
        [0.12, 0.12, 0.06],
        "cyan",
        [bx + 0.18, by + 2.02, bz + 0.64],
      ),
    );
  }
  opaque.add(head);

  // Adjacent vertical whip antenna spire
  if (detail !== "far") {
    opaque.add(vStrut([bx - 1.15, by + 0.10, bz - 0.35], [bx - 1.15, by + 2.35, bz - 0.35], 0.055, "darkGray"));
    emissive.add(vStrip([0.10, 0.12, 0.10], "cyan", [bx - 1.15, by + 2.40, bz - 0.35]));
  }
}

export function buildIndustrial03(detail: VehicleDetail): Group {
  const root = new Group();
  root.name = `MB-13_${detail}`;

  const bodyGeo = cachedGeometry(["mb13Industrial03V1", detail], () => {
    const opaque = new Group();
    const emissive = new Group();

    // 1. Heavy Dark Foundation Plinth (`11.4 x 13.6 m`)
    opaque.add(vColorBox([11.4, 0.34, 13.6], "black", [0, 0.17, 0], 0.04, ["bottom"]));
    opaque.add(vColorBox([10.9, 0.20, 13.1], "darkGray", [0, 0.42, 0], 0.035, ["bottom"]));

    // 2. Front (+Z) and Rear (-Z) Sloped Battered Apron Podiums (`v3-t044.90`)
    opaque.add(
      whiteProfileX(
        [
          [2.85, 0.48],
          [6.55, 0.48],
          [6.42, 0.82],
          [4.88, 2.38],
          [2.85, 2.38],
        ],
        9.40,
        0.08,
      ),
    );
    opaque.add(
      whiteProfileX(
        [
          [-6.55, 0.48],
          [-2.85, 0.48],
          [-2.85, 2.38],
          [-4.88, 2.38],
          [-6.42, 0.82],
        ],
        9.40,
        0.08,
      ),
    );

    // Recessed sloped gray armor plates & glowing cyan status slot on front/rear aprons (`v3-t044.90`)
    for (const sz of [-1, 1] as const) {
      for (const sx of [-2.95, 2.95]) {
        const plate = vColorBox([2.35, 0.10, 1.56], "gray", [sx, 1.48, sz * 5.62], 0.025, ["bottom"]);
        plate.rotation.x = sz * 0.76;
        opaque.add(plate);
      }
      const centerPod = vColorBox([1.72, 0.12, 0.82], "darkGray", [0, 1.18, sz * 5.94], 0.02, ["bottom"]);
      centerPod.rotation.x = sz * 0.76;
      opaque.add(centerPod);
      const led = vStrip([1.18, 0.055, 0.12], "cyan", [0, 1.24, sz * 5.99]);
      led.rotation.x = sz * 0.76;
      emissive.add(led);
    }

    // 3. Twin Tall Monolith Columns Separated by a Deep Recessed Dark Canyon (`v3-t044.90` left flank)
    // Dark recessed central spine core (`y = 0.50 .. 12.60 m`)
    opaque.add(vColorBox([6.80, 12.10, 4.90], "black", [0, 6.55, -0.10], 0.06, ["bottom"]));

    // Horizontal dark louver rungs inside the side vertical canyon slots (`x = +/- 3.45, z = -0.10`)
    if (detail !== "far") {
      const rungCount = detail === "near" ? 11 : 6;
      for (let r = 0; r < rungCount; r++) {
        const ry = 2.60 + r * (8.60 / rungCount);
        opaque.add(vColorBox([7.28, 0.16, 0.76], "darkGray", [0, ry, -0.10], 0.02));
      }
    }

    // Rear Tower Monolith (`z = -2.05`, height `14.10 m`) & Front Tower Monolith (`z = +1.85`, height `13.45 m`)
    opaque.add(vWhiteBox([8.60, 13.62, 2.68], [0, 7.29, -2.05], 0.14, ["bottom"]));
    opaque.add(vWhiteBox([8.60, 12.96, 2.68], [0, 6.96, 1.85], 0.14, ["bottom"]));

    // Side buttress piers, dark ground service alcoves, upper shoulder notches & cyan neck collars (`v3-t010.60` / `v3-t044.90`)
    for (const sx of [-1, 1] as const) {
      for (const tz of [-2.05, 1.85]) {
        // Lower battered buttress cheek + dark vertical service bay
        opaque.add(vStrut([sx * 4.18, 4.20, tz], [sx * 4.92, 0.54, tz], 0.76, "white"));
        opaque.add(vColorBox([0.36, 2.85, 1.24], "black", [sx * 4.26, 1.96, tz], 0.03, ["bottom"]));
        opaque.add(vColorBox([0.22, 2.55, 0.98], "darkGray", [sx * 4.34, 1.88, tz], 0.025, ["bottom"]));

        // Glowing cyan neck collar wrapping each monolith shoulder (`y = 11.08 m`)
        opaque.add(vStrip([0.24, 0.15, 2.74], "black", [sx * 4.28, 11.08, tz]));
        emissive.add(vStrip([0.12, 0.075, 2.58], "cyan", [sx * 4.34, 11.08, tz]));

        // Vertical dark shoulder vent slot near crown (`v3-t010.60` upper left)
        if (detail !== "far") {
          opaque.add(vColorBox([0.26, 1.38, 0.36], "black", [sx * 4.26, 12.42, tz + (tz > 0 ? 0.96 : -0.96)], 0.025));
        }
      }
    }

    // 4. Cantilevered `[X][X][X]` X-Braced Scrubber Terrace (`+Z` front, `y = 2.38 .. 6.25 m`, `v3-t010.60`)
    for (const sx of [-3.92, 3.92]) {
      opaque.add(vWhiteBox([0.92, 2.95, 2.65], [sx, 3.82, 4.15], 0.09, ["bottom"]));
    }
    opaque.add(vWhiteBox([8.76, 1.62, 2.78], [0, 4.46, 4.18], 0.10));
    // Recessed terrace floor tray cradling the scrubber tank
    opaque.add(vColorBox([6.88, 0.24, 2.26], "darkGray", [0, 5.24, 4.14], 0.03, ["bottom"]));

    // 3 X-braced structural bays across the front fascia (`[X][X][X]`) + 1 on each side cheek!
    for (const bx of [-2.42, 0, 2.42]) {
      addXTrussBay(opaque, [bx, 4.46, 5.56], 2.28, 1.34, 0, detail);
    }
    for (const sx of [-1, 1] as const) {
      addXTrussBay(opaque, [sx * 4.38, 4.46, 4.18], 2.24, 1.34, sx * (Math.PI / 2), detail);
    }

    // Elongated stadium-rounded scrubber tank on front terrace (`v3-t010.60` & `v3-t044.90`)
    addScrubberVessel(opaque, 0, 5.32, 4.12, 5.86, 1.32, 1.92, detail);

    // Secondary scrubber vessel + deck on rear (-Z) terrace (`v3-t044.90` bottom-left)
    opaque.add(vHullBox([7.80, 0.42, 2.15], [0, 2.58, -4.15], 0.06, ["bottom"]));
    addScrubberVessel(opaque, 0, 2.78, -4.12, 5.20, 1.48, 1.76, detail);

    // 5. Sloped Mid-Tower Louvered Vent Hood (`+Z` front, `y = 6.25 .. 10.20 m`, `v3-t010.60`)
    opaque.add(
      whiteProfileX(
        [
          [3.05, 5.25],
          [4.22, 5.25],
          [3.36, 8.35],
          [2.95, 8.35],
        ],
        6.92,
        0.08,
      ),
    );
    // Projecting beveled hood visor & recessed horizontal intake fin gallery (`y = 8.35 .. 9.88 m`)
    opaque.add(vColorBox([6.68, 0.68, 0.48], "black", [0, 8.68, 3.24], 0.03));
    if (detail !== "far") {
      const fins = detail === "near" ? 8 : 4;
      for (let f = 0; f < fins; f++) {
        const fx = -2.86 + (f / (fins - 1)) * 5.72;
        opaque.add(vColorBox([0.14, 0.56, 0.36], "darkGray", [fx, 8.68, 3.34], 0.02));
      }
    }
    opaque.add(
      whiteProfileX(
        [
          [2.95, 8.98],
          [3.76, 8.98],
          [3.76, 9.52],
          [3.12, 10.12],
          [2.95, 10.12],
        ],
        6.96,
        0.07,
      ),
    );

    // 6. Upper Crown Blocks, Glowing Cyan Collar & Penthouse Dish Deck (`y = 10.10 .. 16.40 m`)
    // Upper-right stepped "03" fascia block (`x = +2.15`, `y = 10.20 .. 13.72 m`, projecting cleanly on `+Z`)
    opaque.add(vWhiteBox([4.16, 3.52, 2.48], [2.15, 11.96, 2.38], 0.12, ["bottom"]));
    // Glowing cyan collar wrapping the "03" block (`v3-t010.60` & `v3-t044.90`)
    opaque.add(vStrip([4.24, 0.15, 2.56], "black", [2.15, 11.08, 2.38]));
    emissive.add(vStrip([4.18, 0.08, 0.10], "cyan", [2.15, 11.08, 3.63]));
    emissive.add(vStrip([0.10, 0.08, 2.48], "cyan", [4.24, 11.08, 2.38]));

    // Upper-left stepped tower cap (`x = -2.35`, `y = 10.20 .. 14.08 m`)
    opaque.add(vWhiteBox([3.76, 3.88, 2.36], [-2.35, 12.14, 2.24], 0.12, ["bottom"]));
    emissive.add(vStrip([3.68, 0.08, 0.10], "cyan", [-2.35, 11.08, 3.43]));

    // Rear-side technical louvers for all-around readability
    if (detail !== "far") {
      addRecessedLouvers(opaque, 3.40, 1.15, detail === "near" ? 5 : 3, [-2.15, 9.10, -3.40], Math.PI);
      addRecessedLouvers(opaque, 3.40, 1.15, detail === "near" ? 5 : 3, [2.15, 9.10, -3.40], Math.PI);
    }

    // Elevated rear-central dish penthouse (`y = 13.80 .. 14.82 m`) + parabolic dish (`y = 14.82 .. 16.55 m`)
    opaque.add(vWhiteBox([4.48, 1.04, 3.12], [0.35, 14.30, -1.75], 0.10, ["bottom"]));
    opaque.add(vHullBox([3.86, 0.18, 2.56], [0.35, 14.88, -1.75], 0.04, ["bottom"]));
    addRooftopDish(opaque, emissive, [0.55, 14.94, -1.55], detail);

    return fuseVehicleBody("mb13-industrial-03", opaque, emissive, null, detail === "near", 1.25).geometry;
  });

  const bodyMesh = new Mesh(bodyGeo, materials.M_palette);
  bodyMesh.name = "mb13-body";
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  root.add(bodyMesh);

  // Flush "03" painted hull stencil decals on shared `M_screen` (`+Z` front and `+X` side of upper block, `v3-t010.60` / `v3-t044.90`)
  if (detail !== "far") {
    const decalGeo = cachedGeometry(["mb13Decal03V1"], () => {
      const frontPlane = decalScreenGeometry(new PlaneGeometry(1.76, 1.06), "sector-03");
      frontPlane.translate(2.38, 12.42, 3.632);

      const sidePlane = decalScreenGeometry(new PlaneGeometry(1.52, 0.92), "sector-03");
      sidePlane.rotateY(Math.PI / 2);
      sidePlane.translate(4.242, 12.42, 2.38);

      const merged = mergeGeometries([frontPlane, sidePlane])!;
      frontPlane.dispose();
      sidePlane.dispose();
      return merged;
    });
    const decalMesh = new Mesh(decalGeo, materials.M_screen);
    decalMesh.name = "mb13-decal-03";
    root.add(decalMesh);
  }

  const aligned = alignBaseCenter(root);
  aligned.userData.forward = [0, 0, 1];
  return aligned;
}

export function registerMarsIndustrial03(registry: PieceRegistry): void {
  registry.register<Industrial03Params>("MB-13", {
    parse: parseIndustrial03,
    variants: {
      near: { detail: "near" },
    },
    metadata: { category: "building", pivot: "base-center" },
    build: ({ detail }) => buildIndustrial03(detail),
  });
}
