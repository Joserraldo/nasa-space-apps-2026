import { Group, Mesh } from "three";
import { chamferBox, geodesicHalf, pipeRun, polygonRing, polygonShape } from "../../primitives";
import type { PieceRegistry } from "../../registry";
import { materials } from "../../../materials/shared";
import { coloredGeometry } from "../../../materials/uv";
import {
  alignBaseCenter, boxAt, createRng, extrudedMesh, parseChoice, parseRecord, parseSeed,
  skyViewportMesh, weldedColoredGeometry, type PaletteKey,
} from "./helpers";
import { broadLeafGeometry } from "./props";

const skylightModes = ["starry", "grow"] as const;
interface SkylightParams { mode: typeof skylightModes[number] }
function parseSkylight(input: unknown): SkylightParams {
  const rec = parseRecord(input, ["mode"]);
  return { mode: parseChoice(rec.mode, skylightModes, "starry") };
}

const tankStates = ["full", "low"] as const;
interface WaterTankParams { level: typeof tankStates[number] }
function parseWaterTank(input: unknown): WaterTankParams {
  const rec = parseRecord(input, ["level"]);
  return { level: parseChoice(rec.level, tankStates, "full") };
}

const planterTypes = ["lush", "edible"] as const;
interface TroughParams { style: typeof planterTypes[number]; seed: number }
function parseTrough(input: unknown): TroughParams {
  const rec = parseRecord(input, ["style", "seed"]);
  return {
    style: parseChoice(rec.style, planterTypes, "lush"),
    seed: parseSeed(rec.seed, 1),
  };
}

export function registerGreenhousePieces(registry: PieceRegistry): void {
  registry.register<SkylightParams>("ST-R06", {
    parse: parseSkylight,
    variants: {
      starry: { mode: "starry" },
      grow: { mode: "grow" },
    },
    metadata: {
      category: "architecture",
      pivot: "module-corner",
      placement: "cell",
      grid: { size: [4, 0.6, 4], module: 2 },
    },
    build: ({ mode }) => {
      const group = new Group();
      const sideAccent: PaletteKey = mode === "grow" ? "growLight" : "cyan";
      // Perimeter 4x0.6x4 structural ceiling beams framing a 3.04m glazed geodesic skylight opening.
      for (const z of [0.24, 3.76]) {
        group.add(boxAt([4, 0.6, 0.48], "gray", [2, 0, z], 0.022, ["top"]));
      }
      for (const x of [0.24, 3.76]) {
        group.add(boxAt([0.48, 0.6, 3.04], "gray", [x, 0, 2], 0.022, ["top"]));
      }
      for (const z of [0.52, 3.48]) {
        group.add(boxAt([2.86, 0.075, 0.1], sideAccent, [2, 0.01, z], 0.008));
      }

      // Octagonal white coffer bezel, black structural collar, and glowing cyan skylight ring.
      const whiteBezel = extrudedMesh(polygonRing(1.72, 1.38, 8), 0.2, 0.02, "white", [2, 0.12, 2]);
      whiteBezel.rotation.x = -Math.PI / 2;
      const blackCollar = extrudedMesh(polygonRing(1.42, 1.24, 8), 0.26, 0.016, "black", [2, 0.18, 2]);
      blackCollar.rotation.x = -Math.PI / 2;
      const cyanRing = extrudedMesh(polygonRing(1.34, 1.2, 8), 0.055, 0.008, "cyan", [2, 0.028, 2]);
      cyanRing.rotation.x = -Math.PI / 2;
      group.add(whiteBezel, blackCollar, cyanRing);

      // Eight radial geodesic ribs converging on a central octagonal crown boss.
      for (let i = 0; i < 4; i++) {
        const rib = boxAt([2.56, 0.075, 0.095], "white", [2, 0.34, 2], 0.012);
        rib.rotation.y = (i * Math.PI) / 4;
        group.add(rib);
      }
      const crown = extrudedMesh(polygonShape(0.24, 8), 0.12, 0.014, "black", [2, 0.36, 2]);
      crown.rotation.x = -Math.PI / 2;
      const crownLed = extrudedMesh(polygonShape(0.14, 8), 0.04, 0.006, "cyan", [2, 0.295, 2]);
      crownLed.rotation.x = -Math.PI / 2;
      group.add(crown, crownLed);

      // Translucent M_glass geodesic dome panes beneath starry sky backdrop (INVENTARIO ST-R06 + NW-02).
      const glassDome = new Mesh(geodesicHalf(1.28, 1), materials.M_glass);
      glassDome.scale.set(1, 0.32, 1);
      glassDome.position.set(2, 0.14, 2);
      const sky = skyViewportMesh(2.96, 2.96);
      sky.rotation.x = Math.PI / 2;
      sky.position.set(2, 0.56, 2);
      group.add(glassDome, sky);
      return group;
    },
  });

  registry.register<WaterTankParams>("NW-02-C", {
    parse: parseWaterTank,
    variants: {
      full: { level: "full" },
      low: { level: "low" },
    },
    metadata: { category: "furniture", pivot: "base-center" },
    build: ({ level }) => {
      const group = new Group();
      const statusColor: PaletteKey = level === "full" ? "cyan" : "warning";
      const waterH = level === "full" ? 1.32 : 0.64;

      // Dark octagonal plinth with cyan floor-graze ring + armored white cylindrical tank + M_glass sight strip.
      const base = extrudedMesh(polygonShape(0.54, 8), 0.12, 0.016, "black", [0, 0.06, 0]);
      base.rotation.x = -Math.PI / 2;
      const floorGlow = extrudedMesh(polygonRing(0.56, 0.49, 8), 0.042, 0.006, "cyan", [0, 0.024, 0]);
      floorGlow.rotation.x = -Math.PI / 2;
      const shell = extrudedMesh(polygonShape(0.46, 10), 1.82, 0.022, "white", [0, 1.03, 0]);
      shell.rotation.x = -Math.PI / 2;
      const cap = extrudedMesh(polygonShape(0.42, 10), 0.14, 0.02, "darkGray", [0, 2.0, 0]);
      cap.rotation.x = -Math.PI / 2;
      group.add(base, floorGlow, shell, cap);

      for (const y of [0.38, 1.04, 1.7]) {
        const band = extrudedMesh(polygonRing(0.49, 0.44, 10), 0.075, 0.01, "black", [0, y, 0]);
        band.rotation.x = -Math.PI / 2;
        group.add(band);
      }
      const statusRing = extrudedMesh(polygonRing(0.495, 0.45, 10), 0.045, 0.007, statusColor, [0, 1.82, 0]);
      statusRing.rotation.x = -Math.PI / 2;
      group.add(statusRing);

      // Front sight-glass recess: black frame + luminous water column + M_glass visor pane.
      group.add(boxAt([0.22, 1.48, 0.08], "black", [0, 0.28, 0.43], 0.014));
      group.add(boxAt([0.13, waterH, 0.055], "cyan", [0, 0.32, 0.452], 0.008));
      const visorGlass = new Mesh(chamferBox(0.16, 1.4, 0.032, 0.008), materials.M_glass);
      visorGlass.position.set(0, 1.02, 0.478);
      group.add(visorGlass);

      // Side feed pipe with glowing cyan coupling ring.
      const pipe = new Mesh(
        weldedColoredGeometry(
          pipeRun([[0.42, 0.26, 0], [0.54, 0.4, 0], [0.54, 1.88, 0], [0.22, 2.12, 0]], 0.042, 8),
          "teal",
        ),
        materials.M_palette,
      );
      const pipeGlow = extrudedMesh(polygonShape(0.068, 8), 0.07, 0.008, "cyan", [0.54, 1.14, 0]);
      pipeGlow.rotation.x = -Math.PI / 2;
      group.add(pipe, pipeGlow);
      return alignBaseCenter(group);
    },
  });

  registry.register<TroughParams>("AT-05", {
    parse: parseTrough,
    variants: {
      lush: { style: "lush", seed: 1 },
      edible: { style: "edible", seed: 4 },
    },
    metadata: { category: "furniture", pivot: "base-center" },
    build: ({ style, seed }) => {
      const group = new Group();
      const rng = createRng(seed);
      // Rectangular botanical planter box with black base, cyan kick-strip, white trough & low-poly foliage.
      group.add(boxAt([1.56, 0.1, 0.56], "black", [0, 0, 0], 0.016, ["bottom"]));
      for (const zSign of [-1, 1]) {
        group.add(boxAt([1.38, 0.04, 0.042], "cyan", [0, 0.025, zSign * 0.275], 0.005));
      }
      group.add(boxAt([1.68, 0.42, 0.66], "white", [0, 0.1, 0], 0.024, ["bottom"]));
      group.add(boxAt([1.52, 0.06, 0.5], "black", [0, 0.48, 0], 0.01, ["bottom"]));
      group.add(boxAt([1.46, 0.045, 0.44], "oxide", [0, 0.5, 0], 0.008, ["bottom"]));

      const blade = broadLeafGeometry(0.42, 0.15, 0.11);
      for (const cx of [-0.48, 0, 0.48]) {
        for (let i = 0; i < 6; i++) {
          const leafColor: PaletteKey = i % 2 === 0 ? "leaf" : "leafDark";
          const leaf = new Mesh(coloredGeometry(blade, leafColor), materials.M_palette);
          leaf.position.set(cx, 0.53, 0);
          leaf.rotation.set(0.36 + (i % 3) * 0.16, (i / 6) * Math.PI * 2 + rng() * 0.3, 0, "YXZ");
          leaf.scale.setScalar(0.76 + rng() * 0.24);
          group.add(leaf);
        }
        if (style === "edible") {
          const berry = extrudedMesh(polygonShape(0.048, 6), 0.06, 0.01, "red", [cx, 0.66, 0.05]);
          berry.rotation.x = -Math.PI / 2;
          group.add(berry);
        }
      }
      return alignBaseCenter(group);
    },
  });
}
