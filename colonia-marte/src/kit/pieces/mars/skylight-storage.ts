import { BoxGeometry, Group, Mesh } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { materials } from "../../../materials/shared";
import { cachedGeometry } from "../../primitives/cache";
import type { HiddenFace } from "../../primitives/normals";
import { alignBaseCenter } from "../station/helpers";
import {
  addRecessedLouvers,
  fuseVehicleBody,
  vColorBox,
  vStrip,
  vStrut,
  vWhiteBox,
  type VehicleDetail,
} from "./rover-truck";

/**
 * Long Skylight Storage / Lab Module (`v3-t050.10` & `v3-t074.80`, proposed standalone ID `MB-15`):
 * - Raised dark open X-truss structural platform base (`0.72 m` high) with continuous glowing `cyan` deck trim
 * - 4-bay beveled white walls (`[ / ] [ panel ] [ panel ] [ \ ]` diagonal end braces matching `v3-t050.10`)
 * - Continuous glowing `cyan` eave cornice strip + vertical corner accent slots
 * - 6 recessed glazed roof skylights (`M_glass`) framed by beveled white roof ribs and interior rafters
 * - `openEnd = true` (`skylightOpen`) opens the `+X` end portal (`v3-t074.80` top-left) for rover/cargo access!
 */
export function buildSkylightStorage(detail: VehicleDetail, openEnd = false): Group {
  const root = new Group();
  root.name = `MB-10_${openEnd ? "skylightOpen" : "skylight"}_${detail}`;

  const w = 12.0;
  const d = 5.6;
  const plinthH = 0.72;
  const wallH = 2.96;
  const eaveY = plinthH + wallH; // 3.68 m

  const bodyGeo = cachedGeometry(["mb10SkylightStorageV1", detail, openEnd], () => {
    const opaque = new Group();
    const emissive = new Group();

    // 1. Open X-Truss Substructure Plinth (`y = 0.00 .. 0.72 m`, `v3-t050.10` bottom-right & `v3-t074.80` top-left)
    opaque.add(vColorBox([w - 0.16, 0.14, d - 0.16], "black", [0, 0.07, 0], 0.025, ["bottom"]));
    opaque.add(vColorBox([w - 0.96, 0.46, d - 0.96], "black", [0, 0.36, 0], 0.02, ["bottom", "top"]));
    opaque.add(vColorBox([w + 0.08, 0.16, d + 0.08], "darkGray", [0, plinthH - 0.08, 0], 0.035));

    // Perimeter vertical stanchions & X-brace lattice along front/back (`Z = +/- 2.62`) and ends (`X = +/- 5.80`)
    const sideCols = 6;
    for (const sz of [-1, 1] as const) {
      const fz = sz * (d / 2 - 0.18);
      for (let i = 0; i <= sideCols; i++) {
        const px = -w / 2 + 0.36 + (i / sideCols) * (w - 0.72);
        opaque.add(vColorBox([0.16, 0.46, 0.16], "darkGray", [px, 0.37, fz], 0.02, ["bottom", "top"]));
        if (i < sideCols && detail !== "far") {
          const nx = -w / 2 + 0.36 + ((i + 1) / sideCols) * (w - 0.72);
          opaque.add(vStrut([px + 0.06, 0.16, fz], [nx - 0.06, 0.58, fz], 0.055, "darkGray"));
          opaque.add(vStrut([px + 0.06, 0.58, fz], [nx - 0.06, 0.16, fz], 0.055, "darkGray"));
        }
      }
    }
    for (const sx of [-1, 1] as const) {
      const fx = sx * (w / 2 - 0.18);
      for (const pz of [-2.25, 0, 2.25]) {
        opaque.add(vColorBox([0.16, 0.46, 0.16], "darkGray", [fx, 0.37, pz], 0.02, ["bottom", "top"]));
      }
      if (detail !== "far") {
        for (const [z0, z1] of [[-2.18, -0.08], [0.08, 2.18]] as const) {
          opaque.add(vStrut([fx, 0.16, z0], [fx, 0.58, z1], 0.055, "darkGray"));
          opaque.add(vStrut([fx, 0.58, z0], [fx, 0.16, z1], 0.055, "darkGray"));
        }
      }
    }

    // Continuous glowing cyan strip along the raised base deck edge (`§1.6`)
    for (const sz of [-1, 1] as const) {
      emissive.add(vStrip([w - 0.24, 0.048, 0.05], "cyan", [0, plinthH - 0.06, sz * (d / 2 + 0.045)]));
    }
    for (const sx of [-1, 1] as const) {
      if (openEnd && sx > 0) {
        // Drive-in threshold ramp on open `+X` end (`v3-t074.80` top-left)
        const ramp = vColorBox([1.15, 0.16, 4.10], "darkGray", [w / 2 + 0.46, 0.36, 0], 0.03);
        ramp.rotation.z = -0.52;
        opaque.add(ramp);
        for (const rz of [-1.72, 1.72]) {
          const rLed = vStrip([0.92, 0.04, 0.06], "cyan", [w / 2 + 0.46, 0.45, rz]);
          rLed.rotation.z = -0.52;
          emissive.add(rLed);
        }
      } else {
        emissive.add(vStrip([0.05, 0.048, d - 0.24], "cyan", [sx * (w / 2 + 0.045), plinthH - 0.06, 0]));
      }
    }

    // 2. Main Wall Shell & 4-Bay Diagonal-Braced Side Facades (`y = 0.72 .. 3.68 m`, `v3-t050.10`)
    const wallMidY = plinthH + wallH / 2;
    const bodyW = w - 0.36; // 11.64 m
    const bodyD = d - 0.36; // 5.24 m

    if (!openEnd) {
      opaque.add(vWhiteBox([bodyW, wallH, bodyD], [0, wallMidY, 0], 0.10, ["bottom"]));
    } else {
      // Hollow `+X` bay (`4.2 m` deep interior garage/storage cavity so vehicles/crates sit inside!)
      const solidW = bodyW - 4.40; // 7.24 m solid section on `-X`
      opaque.add(vWhiteBox([solidW, wallH, bodyD], [-2.20, wallMidY, 0], 0.10, ["bottom"]));
      // Side walls along open `+X` bay (`x = +1.42 .. +5.82`)
      for (const sz of [-1, 1] as const) {
        opaque.add(vWhiteBox([4.48, wallH, 0.52], [3.58, wallMidY, sz * (bodyD / 2 - 0.26)], 0.06, ["bottom"]));
        opaque.add(
          vColorBox(
            [4.24, wallH - 0.34, 0.10],
            "darkGray",
            [3.56, wallMidY - 0.06, sz * (bodyD / 2 - 0.54)],
            0.02,
            ["bottom"],
          ),
        );
      }
      // `+X` Portal header lintel, dark interior back wall, floor & glowing vertical cyan door jambs (`v3-t074.80`)
      opaque.add(vWhiteBox([4.48, 0.44, bodyD], [3.58, eaveY - 0.22, 0], 0.06));
      opaque.add(vColorBox([0.14, wallH - 0.36, bodyD - 1.04], "black", [1.46, wallMidY - 0.10, 0], 0.02, ["bottom"]));
      opaque.add(vColorBox([4.36, 0.08, bodyD - 1.04], "gray", [3.60, plinthH + 0.04, 0], 0.015, ["bottom"]));
      for (const sz of [-1, 1] as const) {
        emissive.add(vStrip([0.06, 1.96, 0.075], "cyan", [bodyW / 2 - 0.02, plinthH + 1.24, sz * 1.98]));
        emissive.add(vStrip([3.40, 0.045, 0.10], "cyan", [3.55, eaveY - 0.46, sz * 1.48]));
      }
      // Floor-level amber safety beacon at open bay corner
      opaque.add(vColorBox([0.24, 0.20, 0.24], "darkGray", [bodyW / 2 + 0.04, plinthH + 0.10, -2.28], 0.03, ["bottom"]));
      emissive.add(vColorBox([0.15, 0.12, 0.15], "warning", [bodyW / 2 + 0.04, plinthH + 0.24, -2.28], 0.025, ["bottom"]));
    }

    // 4-bay side recessed panels + diagonal corner braces (`[ / ] [ rect ] [ rect ] [ \ ]`, `v3-t050.10` foreground!)
    const baySpan = (bodyW - 1.12) / 4; // ~2.63 m per bay
    for (const sz of [-1, 1] as const) {
      const omitBack: HiddenFace[] = sz > 0 ? ["back"] : ["front"];
      const panelZ = sz * (bodyD / 2 + 0.02);
      // Vertical structural pilasters between the 4 bays
      for (let p = 0; p <= 4; p++) {
        const px = -(bodyW - 0.72) / 2 + (p / 4) * (bodyW - 0.72);
        opaque.add(vWhiteBox([0.22, wallH - 0.22, 0.14], [px, wallMidY, panelZ], 0.03, omitBack));
      }
      for (let b = 0; b < 4; b++) {
        const bx = -(bodyW - 0.72) / 2 + ((b + 0.5) / 4) * (bodyW - 0.72);
        const pw = baySpan - 0.24;
        const ph = wallH - 0.62;
        opaque.add(vColorBox([pw, ph, 0.08], "hull", [bx, wallMidY - 0.02, sz * (bodyD / 2 + 0.005)], 0.02, omitBack));
        if (detail !== "far" && (b === 0 || b === 3)) {
          // Iconic diagonal structural strut inside outer bays (`v3-t050.10`)
          const dir = b === 0 ? 1 : -1;
          opaque.add(
            vStrut(
              [bx - dir * (pw / 2 - 0.08), wallMidY - ph / 2 + 0.06, sz * (bodyD / 2 + 0.045)],
              [bx + dir * (pw / 2 - 0.08), wallMidY + ph / 2 - 0.06, sz * (bodyD / 2 + 0.045)],
              0.18,
              "white",
            ),
          );
        }
      }
    }

    // End wall details (`-X` always closed; `+X` closed when `!openEnd`)
    const closedEnds = openEnd ? ([-1] as const) : ([-1, 1] as const);
    for (const sx of closedEnds) {
      const ex = sx * (bodyW / 2 + 0.02);
      const omitIn: HiddenFace[] = sx > 0 ? ["left"] : ["right"];
      opaque.add(vColorBox([0.14, 2.24, 2.56], "darkGray", [ex, plinthH + 1.12, 0], 0.035, [...omitIn, "bottom"]));
      opaque.add(vColorBox([0.10, 1.98, 2.18], "hull", [ex + sx * 0.04, plinthH + 1.02, 0], 0.025, [...omitIn, "bottom"]));
      emissive.add(vStrip([0.05, 0.06, 1.68], "cyan", [ex + sx * 0.08, plinthH + 2.12, 0]));
      if (detail !== "far") {
        addRecessedLouvers(opaque, 1.05, 0.52, detail === "near" ? 4 : 2, [ex, plinthH + 1.95, 1.82], sx * (Math.PI / 2));
        addRecessedLouvers(opaque, 1.05, 0.52, detail === "near" ? 4 : 2, [ex, plinthH + 1.95, -1.82], sx * (Math.PI / 2));
      }
    }

    // Vertical corner cyan indicator slots (`v3-t050.10` right module corner)
    for (const sx of [-1, 1] as const) {
      for (const sz of [-1, 1] as const) {
        emissive.add(vStrip([0.055, 0.92, 0.055], "cyan", [sx * (bodyW / 2 - 0.02), plinthH + 0.72, sz * (bodyD / 2 - 0.02)]));
      }
    }

    // 3. Eave Cornice with Continuous Glowing Cyan Perimeter Strip + 6 Skylight Roof Wells (`y = 3.68 .. 4.18 m`)
    opaque.add(vColorBox([bodyW + 0.20, 0.16, bodyD + 0.20], "black", [0, eaveY + 0.06, 0], 0.025));
    for (const sz of [-1, 1] as const) {
      emissive.add(vStrip([bodyW + 0.16, 0.065, 0.06], "cyan", [0, eaveY + 0.06, sz * (bodyD / 2 + 0.095)]));
    }
    for (const sx of [-1, 1] as const) {
      emissive.add(vStrip([0.06, 0.065, bodyD + 0.16], "cyan", [sx * (bodyW / 2 + 0.095), eaveY + 0.06, 0]));
    }

    // Raised beveled white roof perimeter beams & 7 transverse skylight divider ribs (`6` skylights!)
    const roofW = bodyW + 0.24;
    const roofD = bodyD + 0.24;
    for (const sz of [-1, 1] as const) {
      opaque.add(vWhiteBox([roofW, 0.36, 0.68], [0, eaveY + 0.30, sz * (roofD / 2 - 0.34)], 0.065));
    }
    const skylightCount = 6;
    const wellSpanX = roofW - 0.76;
    const stepX = wellSpanX / skylightCount;
    for (let i = 0; i <= skylightCount; i++) {
      const rx = -wellSpanX / 2 + i * stepX;
      const ribW = i === 0 || i === skylightCount ? 0.56 : 0.32;
      opaque.add(vWhiteBox([ribW, 0.36, roofD - 1.24], [rx, eaveY + 0.30, 0], 0.05));
    }

    // Dark recessed skylight well floors + interior longitudinal steel purlins + subtle cyan ceiling glow
    opaque.add(vColorBox([wellSpanX - 0.20, 0.10, roofD - 1.32], "black", [0, eaveY + 0.16, 0], 0.02));
    if (detail !== "far") {
      for (const pz of [-0.96, 0, 0.96]) {
        opaque.add(vColorBox([wellSpanX - 0.24, 0.08, 0.12], "darkGray", [0, eaveY + 0.24, pz], 0.015));
      }
      for (let i = 0; i < skylightCount; i++) {
        const cx = -wellSpanX / 2 + (i + 0.5) * stepX;
        emissive.add(vStrip([stepX - 0.56, 0.03, 0.08], "cyan", [cx, eaveY + 0.21, 0]));
      }
    }

    return fuseVehicleBody(`mb10-skylight-${openEnd}`, opaque, emissive, null, detail === "near", 1.15).geometry;
  });

  const bodyMesh = new Mesh(bodyGeo, materials.M_palette);
  bodyMesh.name = "mb10-skylight-body";
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  root.add(bodyMesh);

  // Merged `M_glass` skylight panes across all 6 roof wells (`1` transparent draw call)
  const glassGeo = cachedGeometry(["mb10SkylightGlassV1"], () => {
    const roofW = w - 0.12;
    const roofD = d - 0.12;
    const wellSpanX = roofW - 0.76;
    const stepX = wellSpanX / 6;
    const panes = [];
    for (let i = 0; i < 6; i++) {
      const cx = -wellSpanX / 2 + (i + 0.5) * stepX;
      const pane = new BoxGeometry(stepX - 0.30, 0.04, roofD - 1.34);
      pane.translate(cx, eaveY + 0.36, 0);
      panes.push(pane);
    }
    const merged = mergeGeometries(panes)!;
    for (const p of panes) p.dispose();
    return merged;
  });
  const glassMesh = new Mesh(glassGeo, materials.M_glass);
  glassMesh.name = "mb10-skylight-glass";
  root.add(glassMesh);

  const aligned = alignBaseCenter(root);
  aligned.userData.forward = [1, 0, 0];
  return aligned;
}
