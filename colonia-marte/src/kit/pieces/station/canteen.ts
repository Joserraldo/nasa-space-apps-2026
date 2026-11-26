import { Group, Path, Shape, Vector2 } from "three";
import { polygonShape } from "../../primitives";
import type { PieceRegistry } from "../../registry";
import { mealScreenTypes, type MealScreenType, type ScreenType } from "../../../materials/screens";
import {
  alignBaseCenter, boxAt, extrudedMesh, mealScreenMesh, parseChoice, parseRecord, screenMesh,
} from "./helpers";

const tableSizes = ["standard", "compact"] as const;
interface TableParams { size: typeof tableSizes[number] }

function parseTable(input: unknown): TableParams {
  const rec = parseRecord(input, ["size"]);
  return { size: parseChoice(rec.size, tableSizes, "standard") };
}

const cushionColors = ["blue", "teal"] as const;
interface ChairParams { cushion: typeof cushionColors[number] }

function parseChair(input: unknown): ChairParams {
  const rec = parseRecord(input, ["cushion"]);
  return { cushion: parseChoice(rec.cushion, cushionColors, "blue") };
}

const dispenserScreens = ["burger", "salad", "soup", "coffee", "dispenser", "menu"] as const;
interface DispenserParams { screen: typeof dispenserScreens[number] }

function parseDispenser(input: unknown): DispenserParams {
  const rec = parseRecord(input, ["screen"]);
  return { screen: parseChoice(rec.screen, dispenserScreens, "burger") };
}

function isMealScreen(value: string): value is MealScreenType {
  return (mealScreenTypes as readonly string[]).includes(value);
}

/** Smooth semicircular D-shaped cyan emblem arch on the upper dispenser hood. */
function dispenserCyanArchShape(): Shape {
  const outerR = 0.165;
  const innerR = 0.128;
  const steps = 10;
  const outerPts: Vector2[] = [new Vector2(-outerR, 0), new Vector2(outerR, 0)];
  for (let i = 1; i < steps; i++) {
    const angle = (i / steps) * Math.PI;
    outerPts.push(new Vector2(Math.cos(angle) * outerR, Math.sin(angle) * outerR));
  }
  const shape = new Shape(outerPts);
  shape.closePath();

  const innerPts: Vector2[] = [new Vector2(-innerR + 0.01, 0.032), new Vector2(innerR - 0.01, 0.032)];
  for (let i = 1; i < steps; i++) {
    const angle = (i / steps) * Math.PI;
    const y = Math.sin(angle) * innerR;
    if (y > 0.036) innerPts.push(new Vector2(Math.cos(angle) * innerR, y));
  }
  const hole = new Path(innerPts.reverse());
  hole.closePath();
  shape.holes.push(hole);
  return shape;
}

export function registerCanteenPieces(registry: PieceRegistry): void {
  registry.register<TableParams>("DN-01", {
    parse: parseTable,
    variants: {
      standard: { size: "standard" },
      compact: { size: "compact" },
    },
    metadata: { category: "furniture", pivot: "base-center" },
    build: ({ size }) => {
      const group = new Group();
      const width = size === "standard" ? 1.64 : 1.24;
      group.add(boxAt([0.78, 0.055, 0.56], "black", [0, 0, 0], 0.015, ["bottom"]));
      group.add(boxAt([0.26, 0.6, 0.26], "darkGray", [0, 0.055, 0], 0.025, ["bottom"]));
      for (const x of [-0.2, 0.2]) {
        for (const z of [-0.14, 0.14]) {
          group.add(boxAt([0.075, 0.12, 0.075], "black", [x, 0.58, z], 0.01));
        }
      }
      group.add(boxAt([width - 0.24, 0.06, 0.68], "darkGray", [0, 0.655, 0], 0.015, ["bottom"]));
      group.add(boxAt([width, 0.07, 0.92], "white", [0, 0.71, 0], 0.022));
      for (const z of [-0.44, 0.44]) {
        group.add(boxAt([width - 0.36, 0.02, 0.03], "cyan", [0, 0.695, z], 0.005));
      }
      return alignBaseCenter(group);
    },
  });

  registry.register<ChairParams>("DN-02", {
    parse: parseChair,
    variants: {
      blue: { cushion: "blue" },
      teal: { cushion: "teal" },
    },
    metadata: { category: "furniture", pivot: "base-center" },
    build: ({ cushion }) => {
      const group = new Group();
      const foot = extrudedMesh(polygonShape(0.27, 8), 0.05, 0.01, "black", [0, 0.025, 0]);
      foot.rotation.x = -Math.PI / 2;
      group.add(foot);
      group.add(boxAt([0.11, 0.35, 0.11], "darkGray", [0, 0.05, 0], 0.016, ["bottom"]));
      group.add(boxAt([0.38, 0.05, 0.38], "darkGray", [0, 0.38, 0], 0.012));
      group.add(boxAt([0.54, 0.08, 0.52], "white", [0, 0.42, 0.02], 0.024));
      group.add(boxAt([0.46, 0.05, 0.44], cushion, [0, 0.49, 0.03], 0.015));

      const backrest = new Group();
      backrest.add(boxAt([0.52, 0.66, 0.085], "white", [0, 0, 0], 0.024));
      backrest.add(boxAt([0.43, 0.18, 0.04], cushion, [0, 0.06, 0.048], 0.012));
      backrest.add(boxAt([0.43, 0.18, 0.04], cushion, [0, 0.26, 0.048], 0.012));
      backrest.add(boxAt([0.43, 0.16, 0.04], cushion, [0, 0.46, 0.048], 0.012));
      backrest.add(boxAt([0.26, 0.34, 0.03], "darkGray", [0, 0.02, -0.042], 0.008));
      backrest.position.set(0, 0.46, -0.22);
      backrest.rotation.x = -0.1;
      group.add(backrest);
      return alignBaseCenter(group);
    },
  });

  registry.register<DispenserParams>("DN-04", {
    parse: parseDispenser,
    variants: {
      burger: { screen: "burger" },
      salad: { screen: "salad" },
      soup: { screen: "soup" },
      coffee: { screen: "coffee" },
      dispenser: { screen: "dispenser" },
      menu: { screen: "menu" },
    },
    metadata: { category: "furniture", pivot: "base-center" },
    build: ({ screen }) => {
      const group = new Group();
      // Thick plinth cheeks + recessed kick plate with bright cyan base LED strip.
      group.add(boxAt([1.34, 0.16, 0.78], "darkGray", [0, 0, 0], 0.025, ["bottom"]));
      for (const x of [-0.52, 0.52]) {
        group.add(boxAt([0.32, 0.22, 0.84], "white", [x, 0, 0.02], 0.032, ["bottom"]));
      }
      group.add(boxAt([0.72, 0.04, 0.035], "cyan", [0, 0.065, 0.4], 0.008));

      // Thick outer warm-white armor columns + deep dark back housing.
      for (const x of [-0.54, 0.54]) {
        group.add(boxAt([0.28, 1.62, 0.76], "white", [x, 0.22, 0], 0.036, ["bottom"]));
        group.add(boxAt([0.1, 0.9, 0.8], "darkGray", [x * 1.13, 0.54, 0.01], 0.016));
      }
      group.add(boxAt([0.84, 1.72, 0.18], "black", [0, 0.16, -0.3], 0.02, ["bottom"]));

      // Upper chamfered hood + angled shoulder blocks + glowing cyan D-arch emblem.
      group.add(boxAt([1.38, 0.34, 0.8], "white", [0, 1.82, 0.01], 0.044));
      for (const x of [-0.52, 0.52]) {
        group.add(boxAt([0.34, 0.2, 0.84], "gray", [x, 1.98, 0.02], 0.034));
      }
      group.add(boxAt([0.84, 0.24, 0.08], "black", [0, 1.85, 0.38], 0.016));
      group.add(extrudedMesh(dispenserCyanArchShape(), 0.036, 0.007, "cyan", [0, 1.88, 0.425]));
      for (const x of [-0.31, 0.31]) {
        group.add(boxAt([0.12, 0.035, 0.03], "cyan", [x, 1.84, 0.42], 0.006));
      }

      // Dispensing niche: warm counter deck, dark tray, vertical side work lights, and nozzle.
      group.add(boxAt([0.82, 0.1, 0.62], "offWhite", [0, 0.16, 0.06], 0.016, ["bottom"]));
      group.add(boxAt([0.52, 0.025, 0.36], "black", [0, 0.26, 0.12], 0.006, ["bottom"]));
      for (const x of [-0.37, 0.37]) {
        group.add(boxAt([0.04, 0.52, 0.04], "yellow", [x, 0.34, 0.08], 0.008));
      }
      group.add(boxAt([0.24, 0.14, 0.22], "darkGray", [0, 0.84, 0.08], 0.02));
      group.add(boxAt([0.22, 0.035, 0.04], "cyan", [0, 0.96, 0.22], 0.006));

      // Thick wrap-around white screen frame + dark inner bezel + large food illustration screen.
      group.add(boxAt([1.22, 0.78, 0.15], "white", [0, 1.03, 0.29], 0.036));
      group.add(boxAt([1.06, 0.62, 0.07], "black", [0, 1.11, 0.36], 0.018));
      const ui = isMealScreen(screen)
        ? mealScreenMesh(0.92, 0.52, screen)
        : screenMesh(0.92, 0.52, screen as ScreenType);
      ui.position.set(0, 1.42, 0.398);
      group.add(ui);
      return alignBaseCenter(group);
    },
  });
}
