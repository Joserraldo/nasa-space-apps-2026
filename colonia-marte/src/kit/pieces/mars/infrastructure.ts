import { CylinderGeometry, Group, Mesh, TorusGeometry } from "three";
import { cachedGeometry } from "../../primitives/cache";
import { finishGeometry } from "../../primitives/normals";
import { polygonRing, polygonShape } from "../../primitives";
import type { PieceRegistry } from "../../registry";
import { materials } from "../../../materials/shared";
import { coloredGeometry } from "../../../materials/uv";
import {
  alignBaseCenter, boxAt, extrudedMesh, parseChoice, parseRecord, type PaletteKey,
} from "../station/helpers";
import { stickerPlacard, valveRedBoxCenter, whiteBoxAt } from "./mars-helpers";
import { registerLandingPad } from "./landing-pad";

const pipeVariants = ["bridge", "ground"] as const;
interface PipeInfraParams { layout: typeof pipeVariants[number] }
function parsePipeInfra(input: unknown): PipeInfraParams {
  const rec = parseRecord(input, ["layout"]);
  return { layout: parseChoice(rec.layout, pipeVariants, "bridge") };
}

const solarModes = ["tracking", "stowed"] as const;
interface SolarMastParams { mode: typeof solarModes[number] }
function parseSolarMast(input: unknown): SolarMastParams {
  const rec = parseRecord(input, ["mode"]);
  return { mode: parseChoice(rec.mode, solarModes, "tracking") };
}

const beaconStates = ["cyan", "warning"] as const;
interface BeaconParams { tone: typeof beaconStates[number] }
function parseBeacon(input: unknown): BeaconParams {
  const rec = parseRecord(input, ["tone"]);
  return { tone: parseChoice(rec.tone, beaconStates, "cyan") };
}

function pipeCylinderMesh(
  radius: number,
  length: number,
  color: PaletteKey = "gray",
  openEnded = false,
): Mesh {
  const geo = cachedGeometry(["marsPipeCyl", radius, length, color, openEnded ? 1 : 0], () =>
    coloredGeometry(finishGeometry(new CylinderGeometry(radius, radius, length, 8, 1, openEnded)), color, { weld: true }),
  );
  return new Mesh(geo, materials.M_palette);
}

function pipeElbowMesh(bendR: number, tubeR: number, arc: number, tubularSegs: number, color: PaletteKey): Mesh {
  const geo = cachedGeometry(["marsPipeElbow", bendR, tubeR, arc, tubularSegs, color], () =>
    coloredGeometry(finishGeometry(new TorusGeometry(bendR, tubeR, 8, tubularSegs, arc)), color, { weld: true }),
  );
  return new Mesh(geo, materials.M_palette);
}

/** Add a 90-degree XY elbow with a framed ribbed cyan glowing sleeve matching v3-t054.60.jpg. */
function addLitElbowXY(
  group: Group,
  cx: number,
  cy: number,
  startAngle: number,
  bendR: number,
  tubeR: number,
): void {
  const elbow = pipeElbowMesh(bendR, tubeR, Math.PI / 2, 6, "gray");
  elbow.position.set(cx, cy, 0);
  elbow.rotation.z = startAngle;
  group.add(elbow);

  const pad = 0.07;
  const glowArc = Math.PI / 2 - pad * 2;
  const glow = pipeElbowMesh(bendR, tubeR + 0.022, glowArc, 4, "cyan");
  glow.position.set(cx, cy, 0);
  glow.rotation.z = startAngle + pad;
  group.add(glow);

  // Bolted flange collars framing both ends of the 90-degree elbow + central rib divider
  for (const [ang, rAdd, thickness] of [
    [startAngle + 0.05, 0.062, 0.14],
    [startAngle + Math.PI / 4, 0.042, 0.07],
    [startAngle + Math.PI / 2 - 0.05, 0.062, 0.14],
  ] as const) {
    const fx = cx + Math.cos(ang) * bendR;
    const fy = cy + Math.sin(ang) * bendR;
    const collar = pipeCylinderMesh(tubeR + rAdd, thickness, "darkGray", false);
    collar.position.set(fx, fy, 0);
    collar.rotation.z = ang;
    group.add(collar);
  }
}

/** Straight horizontal cyan sleeve along X axis with twin dark-gray retaining collars and mid rib. */
function addStraightCyanSleeveX(group: Group, cx: number, cy: number, tubeR: number, len = 0.88): void {
  const core = pipeCylinderMesh(tubeR + 0.022, len, "cyan", true);
  core.position.set(cx, cy, 0);
  core.rotation.z = Math.PI / 2;
  group.add(core);
  for (const [dx, rAdd, w] of [
    [-len * 0.5, 0.058, 0.11],
    [0, 0.04, 0.06],
    [len * 0.5, 0.058, 0.11],
  ] as const) {
    const rib = pipeCylinderMesh(tubeR + rAdd, w, "darkGray", false);
    rib.position.set(cx + dx, cy, 0);
    rib.rotation.z = Math.PI / 2;
    group.add(rib);
  }
}

export function registerMarsInfrastructure(registry: PieceRegistry): void {
  registerLandingPad(registry);
  registry.register<PipeInfraParams>("MI-03", {
    parse: parsePipeInfra,
    variants: {
      bridge: { layout: "bridge" },
      ground: { layout: "ground" },
    },
    metadata: { category: "furniture", pivot: "base-center" },
    build: ({ layout }) => {
      const group = new Group();
      if (layout === "bridge") {
        // Crisp analytical expansion-arch pipeline (v3-t054.60.jpg): zero spline twist or duck-foot distortion.
        const R = 0.36;
        const B = 0.88;
        const lowY = 1.24;
        const highY = 5.96;
        const archHalfX = 2.48;

        // Lower horizontal entry/exit runs: x in [-4.50 .. -(archHalfX + B)] and [+(archHalfX + B) .. +4.50]
        const outerStart = archHalfX + B; // 3.36
        const sideLen = 4.56 - outerStart; // 1.20
        for (const sign of [-1, 1] as const) {
          const hLow = pipeCylinderMesh(R, sideLen, "gray", true);
          hLow.position.set(sign * (outerStart + sideLen / 2), lowY, 0);
          hLow.rotation.z = Math.PI / 2;
          group.add(hLow);

          const endCap = pipeCylinderMesh(R + 0.06, 0.14, "darkGray", false);
          endCap.position.set(sign * 4.56, lowY, 0);
          endCap.rotation.z = Math.PI / 2;
          group.add(endCap);

          // Heavy ground support stanchion under each lower straight run
          group.add(boxAt([0.62, lowY - 0.18, 0.86], "darkGray", [sign * 3.85, 0.12, 0], 0.035, ["bottom"]));
          group.add(boxAt([0.74, 0.14, 0.96], "black", [sign * 3.85, 0, 0], 0.025, ["bottom"]));
        }

        // Bottom-left elbow: center (-outerStart, lowY + B), sweeps -90 deg (-PI/2) to 0 deg (+X)
        addLitElbowXY(group, -outerStart, lowY + B, -Math.PI / 2, B, R);
        // Bottom-right elbow: center (+outerStart, lowY + B), sweeps -180 deg (PI) to -90 deg (3*PI/2)
        addLitElbowXY(group, outerStart, lowY + B, Math.PI, B, R);

        // Twin vertical risers at x = +-archHalfX from y = lowY + B (2.12) to y = highY - B (5.08)
        const vBot = lowY + B;
        const vTop = highY - B;
        const vLen = vTop - vBot;
        for (const sign of [-1, 1] as const) {
          const riser = pipeCylinderMesh(R, vLen, "gray", true);
          riser.position.set(sign * archHalfX, (vBot + vTop) / 2, 0);
          group.add(riser);

          const midCollar = pipeCylinderMesh(R + 0.065, 0.16, "darkGray", false);
          midCollar.position.set(sign * archHalfX, (vBot + vTop) / 2, 0);
          group.add(midCollar);
        }

        // Top-left elbow: center (-archHalfX + B, highY - B), sweeps 90 deg (PI/2) to 180 deg (PI)
        addLitElbowXY(group, -archHalfX + B, highY - B, Math.PI / 2, B, R);
        // Top-right elbow: center (+archHalfX - B, highY - B), sweeps 0 deg to 90 deg (PI/2)
        addLitElbowXY(group, archHalfX - B, highY - B, 0, B, R);

        // Top horizontal crossbar from -(archHalfX - B) to +(archHalfX - B) at y = highY with center flange collar (v3-t054.60.jpg)
        const topHalf = archHalfX - B; // 1.60
        const topBar = pipeCylinderMesh(R, topHalf * 2, "gray", true);
        topBar.position.set(0, highY, 0);
        topBar.rotation.z = Math.PI / 2;
        group.add(topBar);
        const topCollar = pipeCylinderMesh(R + 0.065, 0.16, "darkGray", false);
        topCollar.position.set(0, highY, 0);
        topCollar.rotation.z = Math.PI / 2;
        group.add(topCollar);

        group.add(valveRedBoxCenter([0.42, 0.32, 0.44], [-archHalfX, vBot + 0.55, R + 0.14], 0.025));
      } else {
        // Clean horizontal ground pipeline on heavy stanchions with three cyan sleeves (v3-t054.60.jpg).
        const R = 0.36;
        const pipeY = 1.24;
        const mainPipe = pipeCylinderMesh(R, 9.0, "gray", true);
        mainPipe.position.set(0, pipeY, 0);
        mainPipe.rotation.z = Math.PI / 2;
        group.add(mainPipe);

        for (const x of [-4.5, 4.5]) {
          const flange = pipeCylinderMesh(R + 0.06, 0.14, "darkGray");
          flange.position.set(x, pipeY, 0);
          flange.rotation.z = Math.PI / 2;
          group.add(flange);
        }
        for (const x of [-3.75, -1.25, 1.25, 3.75]) {
          group.add(boxAt([0.54, pipeY - 0.16, 0.82], "darkGray", [x, 0.12, 0], 0.032, ["bottom"]));
          group.add(boxAt([0.66, 0.14, 0.92], "black", [x, 0, 0], 0.024, ["bottom"]));
        }
        addStraightCyanSleeveX(group, -2.5, pipeY, R, 0.92);
        addStraightCyanSleeveX(group, 0, pipeY, R, 0.92);
        addStraightCyanSleeveX(group, 2.5, pipeY, R, 0.92);
        group.add(valveRedBoxCenter([0.38, 0.3, 0.42], [1.25, pipeY + 0.38, 0.22], 0.025));
      }
      return alignBaseCenter(group);
    },
  });

  registry.register<SolarMastParams>("MI-04", {
    parse: parseSolarMast,
    variants: {
      tracking: { mode: "tracking" },
      stowed: { mode: "stowed" },
    },
    metadata: { category: "furniture", pivot: "base-center" },
    build: ({ mode }) => {
      const group = new Group();
      const plinth = extrudedMesh(polygonShape(1.18, 8), 0.38, 0.03, "black", [0, 0.19, 0]);
      plinth.rotation.x = -Math.PI / 2;
      const core = extrudedMesh(polygonShape(0.72, 8), 1.45, 0.035, "gray", [0, 1.04, 0]);
      core.rotation.x = -Math.PI / 2;
      const mast = extrudedMesh(polygonShape(0.22, 8), 2.35, 0.02, "gray", [0, 2.82, 0]);
      mast.rotation.x = -Math.PI / 2;
      group.add(plinth, core, mast);

      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const leg = new Group();
        leg.add(boxAt([0.28, 1.32, 0.48], "darkGray", [0, 0.24, 0.92], 0.03, ["bottom"]));
        leg.add(boxAt([0.14, 0.06, 0.08], "cyan", [0, 0.32, 1.18], 0.008));
        leg.rotation.y = angle;
        group.add(leg);
      }

      const decal = stickerPlacard(0.46, 0.28, "bay-utility", "black");
      decal.position.set(0, 1.12, 0.74);
      group.add(decal);

      const array = new Group();
      array.add(whiteBoxAt([4.65, 0.10, 0.26], [0, -0.05, 0], 0.02));
      for (const wingSign of [-1, 1]) {
        const wx = wingSign * 1.28;
        array.add(whiteBoxAt([2.26, 0.08, 2.88], [wx, 0.0, 0], 0.02));
        for (const cx of [-0.52, 0.52]) {
          for (const cz of [-0.90, 0, 0.90]) {
            array.add(boxAt([0.94, 0.05, 0.82], "blue", [wx + cx, 0.06, cz], 0.012));
          }
        }
      }
      array.position.set(0, 4.02, 0);
      array.rotation.x = mode === "tracking" ? 0.46 : 0.08;
      group.add(array);
      return alignBaseCenter(group);
    },
  });

  registry.register<BeaconParams>("MI-06", {
    parse: parseBeacon,
    variants: {
      cyan: { tone: "cyan" },
      warning: { tone: "warning" },
    },
    metadata: { category: "furniture", pivot: "base-center" },
    build: ({ tone }) => {
      const group = new Group();
      const base = extrudedMesh(polygonShape(0.62, 8), 0.32, 0.025, "black", [0, 0.16, 0]);
      base.rotation.x = -Math.PI / 2;
      const lowerCore = extrudedMesh(polygonShape(0.46, 8), 0.78, 0.02, tone, [0, 0.68, 0]);
      lowerCore.rotation.x = -Math.PI / 2;
      const midBand = extrudedMesh(polygonRing(0.54, 0.42, 8), 0.14, 0.018, "darkGray", [0, 1.14, 0]);
      midBand.rotation.x = -Math.PI / 2;
      const upperCore = extrudedMesh(polygonShape(0.44, 8), 0.68, 0.02, tone, [0, 1.54, 0]);
      upperCore.rotation.x = -Math.PI / 2;
      const cap = extrudedMesh(polygonShape(0.50, 8), 0.26, 0.035, "gray", [0, 2.0, 0]);
      cap.rotation.x = -Math.PI / 2;
      const tip = extrudedMesh(polygonShape(0.26, 8), 0.18, 0.025, "darkGray", [0, 2.2, 0]);
      tip.rotation.x = -Math.PI / 2;
      group.add(base, lowerCore, midBand, upperCore, cap, tip);

      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const fin = new Group();
        fin.add(boxAt([0.14, 1.62, 0.16], "darkGray", [0, 0.28, 0.48], 0.02, ["bottom"]));
        fin.add(boxAt([0.20, 0.56, 0.34], "black", [0, 0, 0.62], 0.025, ["bottom"]));
        fin.add(boxAt([0.11, 0.08, 0.08], "yellow", [0, 0.10, 0.78], 0.012));
        fin.rotation.y = angle;
        group.add(fin);
      }
      return alignBaseCenter(group);
    },
  });
}
