import { Group, Mesh } from "three";
import { pipeRun, polygonRing, polygonShape } from "../../primitives";
import type { PieceRegistry } from "../../registry";
import { materials } from "../../../materials/shared";
import {
  alignBaseCenter, boxAt, extrudedMesh, parseChoice, parseRecord, weldedColoredGeometry,
} from "../station/helpers";
import { stickerPlacard, valveRedBoxCenter, whiteBoxAt } from "./mars-helpers";

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

/** Ribbed cyan emissive sleeve along X axis matching v3-t054.60 arched & ground pipelines. */
function addRibbedCyanSleeve(group: Group, cx: number, cy: number, cz: number, radius = 0.39, len = 0.88): void {
  const core = extrudedMesh(polygonShape(radius, 8), len, 0.02, "cyan", [cx, cy, cz]);
  core.rotation.y = Math.PI / 2;
  group.add(core);
  for (const offset of [-len * 0.22, len * 0.22]) {
    const rib = extrudedMesh(polygonShape(radius + 0.032, 8), 0.048, 0.008, "darkGray", [cx + offset, cy, cz]);
    rib.rotation.y = Math.PI / 2;
    group.add(rib);
  }
}

export function registerMarsInfrastructure(registry: PieceRegistry): void {
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
        // Prominent arched pipeline bridging directly between hub roof and adjacent module (v3-t054.60).
        const pts: [number, number, number][] = [
          [-4.6, 1.42, 0], [-2.85, 1.42, 0], [-2.85, 7.35, 0], [2.85, 7.35, 0], [2.85, 2.65, 0], [4.6, 2.65, 0],
        ];
        group.add(new Mesh(weldedColoredGeometry(pipeRun(pts, 0.50, 8), "gray"), materials.M_palette));
        for (const x of [-4.05, -2.85]) {
          group.add(boxAt([0.68, 1.42, 0.96], "darkGray", [x, 0, 0], 0.04, ["bottom"]));
        }
        const roofPad = extrudedMesh(polygonShape(0.76, 8), 0.28, 0.03, "darkGray", [2.85, 2.65, 0]);
        roofPad.rotation.x = -Math.PI / 2;
        group.add(roofPad);

        for (const [x, y] of [[-2.85, 3.05], [-2.85, 5.35], [2.85, 4.95]]) {
          const collar = extrudedMesh(polygonShape(0.60, 8), 0.26, 0.025, "darkGray", [x, y, 0]);
          collar.rotation.x = -Math.PI / 2;
          group.add(collar);
        }
        for (const x of [-0.70, 0.70]) {
          const topCollar = extrudedMesh(polygonShape(0.60, 8), 0.26, 0.025, "darkGray", [x, 7.35, 0]);
          topCollar.rotation.y = Math.PI / 2;
          group.add(topCollar);
        }
        addRibbedCyanSleeve(group, -1.85, 7.35, 0, 0.56, 1.22);
        addRibbedCyanSleeve(group, 1.85, 7.35, 0, 0.56, 1.22);
        addRibbedCyanSleeve(group, -3.75, 1.42, 0, 0.56, 1.08);
        addRibbedCyanSleeve(group, 3.75, 2.65, 0, 0.56, 1.08);

        group.add(valveRedBoxCenter([0.48, 0.36, 0.50], [-2.85, 2.15, 0.48], 0.03));
      } else {
        const pts: [number, number, number][] = [[-4.5, 1.42, 0], [0, 1.42, 0], [4.5, 1.42, 0]];
        group.add(new Mesh(weldedColoredGeometry(pipeRun(pts, 0.44, 8), "gray"), materials.M_palette));
        for (const x of [-3.85, -1.28, 1.28, 3.85]) {
          group.add(boxAt([0.56, 1.42, 0.84], "darkGray", [x, 0, 0], 0.035, ["bottom"]));
        }
        addRibbedCyanSleeve(group, -2.56, 1.42, 0, 0.49, 1.12);
        addRibbedCyanSleeve(group, 0, 1.42, 0, 0.49, 1.12);
        addRibbedCyanSleeve(group, 2.56, 1.42, 0, 0.49, 1.12);
        group.add(valveRedBoxCenter([0.42, 0.32, 0.46], [1.28, 1.84, 0.36], 0.03));
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
      const plinth = extrudedMesh(polygonShape(1.18, 8), 0.28, 0.03, "black", [0, 0.14, 0]);
      plinth.rotation.x = -Math.PI / 2;
      const core = extrudedMesh(polygonShape(0.72, 8), 1.45, 0.035, "gray", [0, 0.96, 0]);
      core.rotation.x = -Math.PI / 2;
      const mast = extrudedMesh(polygonShape(0.22, 8), 2.35, 0.02, "gray", [0, 2.75, 0]);
      mast.rotation.x = -Math.PI / 2;
      group.add(plinth, core, mast);

      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const leg = new Group();
        leg.add(boxAt([0.28, 1.32, 0.48], "darkGray", [0, 0.18, 0.92], 0.03, ["bottom"]));
        leg.add(boxAt([0.14, 0.06, 0.08], "cyan", [0, 0.26, 1.18], 0.008));
        leg.rotation.y = angle;
        group.add(leg);
      }

      const decal = stickerPlacard(0.46, 0.28, "bay-utility", "black");
      decal.position.set(0, 1.05, 0.74);
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
      array.position.set(0, 3.95, 0);
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
      const base = extrudedMesh(polygonShape(0.62, 8), 0.24, 0.025, "black", [0, 0.12, 0]);
      base.rotation.x = -Math.PI / 2;
      const lowerCore = extrudedMesh(polygonShape(0.46, 8), 0.78, 0.02, tone, [0, 0.62, 0]);
      lowerCore.rotation.x = -Math.PI / 2;
      const midBand = extrudedMesh(polygonRing(0.54, 0.42, 8), 0.14, 0.018, "darkGray", [0, 1.08, 0]);
      midBand.rotation.x = -Math.PI / 2;
      const upperCore = extrudedMesh(polygonShape(0.44, 8), 0.68, 0.02, tone, [0, 1.48, 0]);
      upperCore.rotation.x = -Math.PI / 2;
      const cap = extrudedMesh(polygonShape(0.50, 8), 0.26, 0.035, "gray", [0, 1.94, 0]);
      cap.rotation.x = -Math.PI / 2;
      const tip = extrudedMesh(polygonShape(0.26, 8), 0.18, 0.025, "darkGray", [0, 2.14, 0]);
      tip.rotation.x = -Math.PI / 2;
      group.add(base, lowerCore, midBand, upperCore, cap, tip);

      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const fin = new Group();
        fin.add(boxAt([0.14, 1.62, 0.16], "darkGray", [0, 0.24, 0.48], 0.02, ["bottom"]));
        fin.add(boxAt([0.20, 0.56, 0.34], "black", [0, 0, 0.62], 0.025, ["bottom"]));
        fin.add(boxAt([0.11, 0.08, 0.08], "yellow", [0, 0.06, 0.78], 0.012));
        fin.rotation.y = angle;
        group.add(fin);
      }
      return alignBaseCenter(group);
    },
  });
}
