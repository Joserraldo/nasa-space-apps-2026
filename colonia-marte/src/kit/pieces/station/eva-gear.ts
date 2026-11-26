import { Group, Mesh } from "three";
import { geodesicHalf, polygonRing, polygonShape } from "../../primitives";
import type { PieceRegistry } from "../../registry";
import { materials } from "../../../materials/shared";
import {
  alignBaseCenter, boxAt, boxCenter, extrudedMesh, parseChoice, parseRecord, type PaletteKey,
} from "./helpers";

const lockerModes = ["cyan", "warning"] as const;
interface LockerParams { accent: typeof lockerModes[number] }
function parseLocker(input: unknown): LockerParams {
  const rec = parseRecord(input, ["accent"]);
  return { accent: parseChoice(rec.accent, lockerModes, "cyan") };
}

const suitRackColors = ["white", "red", "teal"] as const;
interface SuitRackParams { suit: typeof suitRackColors[number] }
function parseSuitRack(input: unknown): SuitRackParams {
  const rec = parseRecord(input, ["suit"]);
  return { suit: parseChoice(rec.suit, suitRackColors, "white") };
}

const benchVariants = ["eva", "lounge"] as const;
interface BenchParams { style: typeof benchVariants[number] }
function parseBench(input: unknown): BenchParams {
  const rec = parseRecord(input, ["style"]);
  return { style: parseChoice(rec.style, benchVariants, "eva") };
}

export function registerEvaGearPieces(registry: PieceRegistry): void {
  registry.register<LockerParams>("AP-06", {
    parse: parseLocker,
    variants: {
      cyan: { accent: "cyan" },
      warning: { accent: "warning" },
    },
    metadata: { category: "furniture", pivot: "base-center" },
    build: ({ accent }) => {
      const group = new Group();
      // Tall sci-fi EVA equipment locker with dark frame, raised hexagon emblem & under-kick cyan LED (INVENTARIO 1.2).
      group.add(boxAt([0.84, 0.10, 0.62], "black", [0, 0, 0], 0.016, ["bottom"]));
      group.add(boxAt([0.70, 0.04, 0.045], "cyan", [0, 0.025, 0.30], 0.006));
      group.add(boxAt([0.88, 2.02, 0.64], "white", [0, 0.10, 0], 0.026, ["bottom"]));
      group.add(boxAt([0.78, 1.88, 0.05], "black", [0, 0.17, 0.305], 0.014));
      group.add(boxAt([0.70, 1.78, 0.045], "offWhite", [0, 0.22, 0.32], 0.014));

      // Raised dark hexagonal emblem + glowing accent ring
      const hexRim = extrudedMesh(polygonRing(0.22, 0.16, 6), 0.032, 0.006, accent, [0, 1.38, 0.348]);
      const hexCore = extrudedMesh(polygonShape(0.165, 6), 0.038, 0.008, "black", [0, 1.38, 0.352]);
      group.add(hexRim, hexCore);

      for (const y of [0.46, 0.58, 0.70]) {
        group.add(boxAt([0.46, 0.045, 0.025], "darkGray", [0, y, 0.345], 0.006));
      }
      group.add(boxAt([0.04, 0.92, 0.03], accent, [0.37, 0.66, 0.335], 0.006));
      return alignBaseCenter(group);
    },
  });

  registry.register<SuitRackParams>("NW-06-A", {
    parse: parseSuitRack,
    variants: {
      white: { suit: "white" },
      red: { suit: "red" },
      teal: { suit: "teal" },
    },
    metadata: { category: "furniture", pivot: "base-center" },
    build: ({ suit }) => {
      const group = new Group();
      const trim: PaletteKey = suit === "white" ? "blue" : suit;
      // Armored EVA suit alcove rack with helmet visor dome, torso rig, boots & cyan frame LEDs.
      group.add(boxAt([1.08, 0.12, 0.74], "black", [0, 0, 0], 0.018, ["bottom"]));
      group.add(boxAt([0.92, 0.042, 0.045], "cyan", [0, 0.03, 0.36], 0.006));
      group.add(boxAt([1.10, 2.08, 0.16], "white", [0, 0.12, -0.28], 0.024, ["bottom"]));
      group.add(boxAt([0.96, 1.92, 0.06], "black", [0, 0.20, -0.19], 0.014));
      for (const x of [-0.49, 0.49]) {
        group.add(boxAt([0.10, 2.04, 0.56], "darkGray", [x, 0.12, -0.06], 0.018, ["bottom"]));
        group.add(boxAt([0.04, 1.76, 0.035], "cyan", [x, 0.26, 0.22], 0.006));
      }
      group.add(boxAt([1.10, 0.14, 0.64], "white", [0, 2.12, -0.04], 0.022));

      // Stowed rigid EVA suit silhouette: boots, torso chestplate, life-support pack & reflective helmet
      for (const bx of [-0.16, 0.16]) {
        group.add(boxAt([0.18, 0.36, 0.28], "black", [bx, 0.12, 0.04], 0.02, ["bottom"]));
        group.add(boxAt([0.16, 0.42, 0.20], "white", [bx, 0.46, 0.02], 0.02));
      }
      group.add(boxAt([0.52, 0.58, 0.28], "white", [0, 0.88, 0.0], 0.035));
      group.add(boxCenter([0.36, 0.26, 0.06], trim, [0, 1.20, 0.15], 0.015));
      group.add(boxCenter([0.20, 0.05, 0.04], "cyan", [0, 1.22, 0.185], 0.006));
      for (const ax of [-0.33, 0.33]) {
        group.add(boxAt([0.14, 0.50, 0.18], trim, [ax, 0.90, 0.0], 0.02));
      }
      const helmetBase = extrudedMesh(polygonShape(0.20, 10), 0.10, 0.015, "darkGray", [0, 1.52, 0.02]);
      helmetBase.rotation.x = -Math.PI / 2;
      const visor = new Mesh(geodesicHalf(0.21, 1), materials.M_glass);
      visor.position.set(0, 1.56, 0.02);
      group.add(helmetBase, visor);
      return alignBaseCenter(group);
    },
  });

  registry.register<BenchParams>("AT-04", {
    parse: parseBench,
    variants: {
      eva: { style: "eva" },
      lounge: { style: "lounge" },
    },
    metadata: { category: "furniture", pivot: "base-center" },
    build: ({ style }) => {
      const group = new Group();
      const padColor: PaletteKey = style === "eva" ? "black" : "blue";
      // Low modular sci-fi bench with dark recessed base, cushioned pads, and glowing cyan floor-graze strip.
      group.add(boxAt([1.76, 0.10, 0.56], "black", [0, 0, 0], 0.016, ["bottom"]));
      for (const zSign of [-1, 1]) {
        group.add(boxAt([1.58, 0.045, 0.045], "cyan", [0, 0.028, zSign * 0.275], 0.006));
      }
      for (const x of [-0.74, 0.74]) {
        group.add(boxAt([0.22, 0.34, 0.64], "white", [x, 0.08, 0], 0.024, ["bottom"]));
        group.add(boxAt([0.045, 0.22, 0.045], "cyan", [x * 1.12, 0.14, 0.28], 0.006));
      }
      group.add(boxAt([1.88, 0.10, 0.66], "white", [0, 0.34, 0], 0.024));
      for (const cx of [-0.56, 0, 0.56]) {
        group.add(boxAt([0.52, 0.075, 0.56], padColor, [cx, 0.43, 0], 0.018));
      }
      if (style === "lounge") {
        group.add(boxAt([1.84, 0.36, 0.14], "white", [0, 0.44, -0.25], 0.024));
        group.add(boxAt([1.68, 0.26, 0.06], "blue", [0, 0.49, -0.17], 0.014));
      }
      return alignBaseCenter(group);
    },
  });
}
