import { Group } from "three";
import { polygonShape } from "../../primitives";
import type { PieceRegistry } from "../../registry";
import {
  alignBaseCenter, boxAt, extrudedMesh, parseChoice, parseRecord, type PaletteKey,
} from "./helpers";

const lanternTones = ["warm", "cyan"] as const;
interface LanternParams { tone: typeof lanternTones[number] }

function parseLantern(input: unknown): LanternParams {
  const rec = parseRecord(input, ["tone"]);
  return { tone: parseChoice(rec.tone, lanternTones, "warm") };
}

const condimentStyles = ["standard", "compact"] as const;
interface CondimentParams { style: typeof condimentStyles[number] }

function parseCondiment(input: unknown): CondimentParams {
  const rec = parseRecord(input, ["style"]);
  return { style: parseChoice(rec.style, condimentStyles, "standard") };
}

const binStyles = ["twin", "single"] as const;
interface WasteBinParams { style: typeof binStyles[number] }

function parseWasteBin(input: unknown): WasteBinParams {
  const rec = parseRecord(input, ["style"]);
  return { style: parseChoice(rec.style, binStyles, "twin") };
}

export function registerCanteenProps(registry: PieceRegistry): void {
  registry.register<LanternParams>("DN-06", {
    parse: parseLantern,
    variants: {
      warm: { tone: "warm" },
      cyan: { tone: "cyan" },
    },
    metadata: { category: "prop", pivot: "base-center" },
    build: ({ tone }) => {
      const group = new Group();
      const glow: PaletteKey = tone === "warm" ? "yellow" : "cyan";
      group.add(boxAt([0.16, 0.028, 0.16], "black", [0, 0, 0], 0.006, ["bottom"]));
      group.add(boxAt([0.11, 0.155, 0.11], glow, [0, 0.028, 0], 0.012, ["bottom"]));
      for (const x of [-0.064, 0.064]) {
        for (const z of [-0.064, 0.064]) {
          group.add(boxAt([0.022, 0.165, 0.022], "black", [x, 0.024, z], 0.005, ["bottom"]));
        }
      }
      group.add(boxAt([0.165, 0.028, 0.165], "darkGray", [0, 0.188, 0], 0.007));
      return alignBaseCenter(group);
    },
  });

  registry.register<CondimentParams>("DN-07", {
    parse: parseCondiment,
    variants: {
      standard: { style: "standard" },
      compact: { style: "compact" },
    },
    metadata: { category: "prop", pivot: "base-center" },
    build: ({ style }) => {
      const group = new Group();
      const trayW = style === "standard" ? 0.34 : 0.26;
      group.add(boxAt([trayW, 0.026, 0.16], "gray", [0, 0, 0], 0.006, ["bottom"]));
      group.add(boxAt([0.12, 0.014, 0.018], "cyan", [0, 0.008, 0.08], 0.004));
      for (const x of [-0.08, -0.01]) {
        const shaker = extrudedMesh(polygonShape(0.026, 6), 0.095, 0.006, "white", [x, 0.074, 0]);
        shaker.rotation.x = -Math.PI / 2;
        const cap = extrudedMesh(polygonShape(0.022, 6), 0.024, 0.005, "black", [x, 0.132, 0]);
        cap.rotation.x = -Math.PI / 2;
        group.add(shaker, cap);
      }
      if (style === "standard") {
        group.add(boxAt([0.08, 0.09, 0.1], "darkGray", [0.09, 0.026, 0], 0.008, ["bottom"]));
        group.add(boxAt([0.05, 0.11, 0.075], "white", [0.09, 0.032, 0], 0.006, ["bottom"]));
      }
      return alignBaseCenter(group);
    },
  });

  registry.register<WasteBinParams>("DN-09", {
    parse: parseWasteBin,
    variants: {
      twin: { style: "twin" },
      single: { style: "single" },
    },
    metadata: { category: "prop", pivot: "base-center" },
    build: ({ style }) => {
      const group = new Group();
      const width = style === "twin" ? 0.68 : 0.44;
      group.add(boxAt([width, 0.06, 0.42], "black", [0, 0, 0], 0.014, ["bottom"]));
      group.add(boxAt([width - 0.02, 0.78, 0.4], "darkGray", [0, 0.06, 0], 0.024, ["bottom"]));
      group.add(boxAt([width, 0.1, 0.42], "black", [0, 0.82, 0], 0.02));
      if (style === "twin") {
        for (const x of [-0.15, 0.15]) {
          group.add(boxAt([0.24, 0.16, 0.05], "black", [x, 0.62, 0.19], 0.01));
          group.add(boxAt([0.24, 0.44, 0.03], "black", [x, 0.12, 0.195], 0.008));
        }
      } else {
        group.add(boxAt([0.28, 0.16, 0.05], "black", [0, 0.62, 0.19], 0.01));
        group.add(boxAt([0.28, 0.44, 0.03], "black", [0, 0.12, 0.195], 0.008));
      }
      return alignBaseCenter(group);
    },
  });
}
