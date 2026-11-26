import { Group, Mesh, Shape } from "three";
import { chamferRect, panelInset, polygonRing } from "../../primitives";
import type { PieceRegistry } from "../../registry";
import { materials } from "../../../materials/shared";
import { coloredGeometry } from "../../../materials/uv";
import {
  boxAt, extrudedMesh, parseChoice, parseRecord, skyViewportMesh,
  type PaletteKey,
} from "./helpers";

const MODULE = 2;
const CLEAR_H = 3;
const WALL_D = 0.26;
const WIN_WALL_D = 0.28;

const w01Styles = ["standard", "split", "banded", "alcove"] as const;
interface Wall01Params { style: typeof w01Styles[number] }

function parseWall01(input: unknown): Wall01Params {
  const rec = parseRecord(input, ["style"]);
  return { style: parseChoice(rec.style, w01Styles, "standard") };
}

/**
 * Wall-line shell straddling Z=0 symmetrically:
 * X in [0, 2], Y in [0, 3], Z in [-0.13, +0.13] (real thickness 0.26 m, zero rear filler ribs).
 */
function addBaseWallShell(group: Group, panelColor: PaletteKey = "white"): void {
  group.add(boxAt([MODULE, 0.14, WALL_D], "darkGray", [1, 0, 0], 0.015, ["bottom"]));
  group.add(boxAt([MODULE, 0.3, WALL_D], "gray", [1, CLEAR_H - 0.3, 0], 0.02, ["top"]));
  group.add(boxAt([MODULE, 0.045, 0.24], "darkGray", [1, CLEAR_H - 0.345, 0], 0.01));
  group.add(boxAt([MODULE, 2.54, 0.18], panelColor, [1, 0.13, 0], 0.02));
}

const w02Modes = ["vertical", "horizontal", "dual"] as const;
interface Wall02Params { mode: typeof w02Modes[number]; accent: "cyan" | "warning" }

function parseWall02(input: unknown): Wall02Params {
  const rec = parseRecord(input, ["mode", "accent"]);
  return {
    mode: parseChoice(rec.mode, w02Modes, "vertical"),
    accent: parseChoice(rec.accent, ["cyan", "warning"] as const, "cyan"),
  };
}

const w03Styles = ["standard", "reinforced"] as const;
interface Wall03Params { style: typeof w03Styles[number] }

function parseWall03(input: unknown): Wall03Params {
  const rec = parseRecord(input, ["style"]);
  return { style: parseChoice(rec.style, w03Styles, "standard") };
}

const w07Patterns = ["chevron", "stepped"] as const;
interface Wall07Params { pattern: typeof w07Patterns[number] }

function parseWall07(input: unknown): Wall07Params {
  const rec = parseRecord(input, ["pattern"]);
  return { pattern: parseChoice(rec.pattern, w07Patterns, "chevron") };
}

function buildBrokenTrimRibbon(pattern: typeof w07Patterns[number]): Shape {
  const shape = new Shape();
  if (pattern === "chevron") {
    const pts: [number, number][] = [
      [-0.88, -0.14], [-0.42, -0.14], [-0.18, 0.08], [0.18, 0.08], [0.42, -0.14], [0.88, -0.14],
      [0.88, -0.03], [0.46, -0.03], [0.22, 0.19], [-0.22, 0.19], [-0.46, -0.03], [-0.88, -0.03],
    ];
    pts.forEach(([x, y], i) => (i ? shape.lineTo(x, y) : shape.moveTo(x, y)));
  } else {
    const pts: [number, number][] = [
      [-0.88, -0.16], [-0.3, -0.16], [-0.1, 0.04], [0.35, 0.04], [0.52, 0.18], [0.88, 0.18],
      [0.88, 0.28], [0.48, 0.28], [0.31, 0.14], [-0.14, 0.14], [-0.34, -0.06], [-0.88, -0.06],
    ];
    pts.forEach(([x, y], i) => (i ? shape.lineTo(x, y) : shape.moveTo(x, y)));
  }
  shape.closePath();
  return shape;
}

export function registerStationWalls(registry: PieceRegistry): void {
  registry.register<Wall01Params>("ST-W01", {
    parse: parseWall01,
    variants: {
      standard: { style: "standard" },
      split: { style: "split" },
      banded: { style: "banded" },
      alcove: { style: "alcove" },
    },
    metadata: {
      category: "architecture",
      pivot: "module-corner",
      placement: "wall-line",
      grid: { size: [2, 3, WALL_D], module: 2 },
    },
    build: ({ style }) => {
      const group = new Group();
      if (style === "alcove") {
        // Recessed dark cavity [y = 0.14..2.18] + dark surround frame + cyan cove LED + white header
        group.add(boxAt([MODULE, 0.14, WALL_D], "black", [1, 0, 0], 0.015, ["bottom"]));
        group.add(boxAt([MODULE, 2.06, 0.14], "black", [1, 0.13, -0.06], 0.015));
        group.add(boxAt([1.78, 0.045, 0.05], "cyan", [1, 2.12, 0.06], 0.006));
        group.add(boxAt([MODULE, 0.82, WALL_D], "white", [1, 2.18, 0], 0.022, ["top"]));
        group.add(boxAt([1.96, 0.52, 0.036], "black", [1, 2.32, 0.105], 0.01, ["back"]));
        group.add(boxAt([1.86, 0.38, 0.038], "white", [1, 2.39, 0.108], 0.01, ["back"]));
        return group;
      }
      addBaseWallShell(group, "white");
      if (style === "standard") {
        const rim = new Mesh(coloredGeometry(panelInset(1.64, 1.92, 0.05, 0.1), "gray"), materials.M_palette);
        rim.position.set(1, 1.38, 0.1);
        group.add(rim);
        group.add(boxAt([1.42, 1.7, 0.035], "white", [1, 0.53, 0.095], 0.01, ["back"]));
        group.add(boxAt([1.1, 0.08, 0.025], "darkGray", [1, 2.04, 0.112], 0.006, ["back"]));
      } else if (style === "split") {
        for (const cx of [0.54, 1.46]) {
          const rim = new Mesh(coloredGeometry(panelInset(0.82, 1.92, 0.05, 0.08), "gray"), materials.M_palette);
          rim.position.set(cx, 1.38, 0.1);
          group.add(rim);
          group.add(boxAt([0.64, 1.72, 0.035], "white", [cx, 0.52, 0.095], 0.01, ["back"]));
        }
        group.add(boxAt([0.08, 2.1, 0.04], "black", [1, 0.32, 0.1], 0.01, ["back"]));
      } else {
        group.add(boxAt([1.76, 1.16, 0.04], "white", [1, 1.18, 0.1], 0.015, ["back"]));
        group.add(boxAt([1.76, 0.68, 0.04], "offWhite", [1, 0.34, 0.1], 0.015, ["back"]));
        group.add(boxAt([1.84, 0.1, 0.045], "darkGray", [1, 1.05, 0.102], 0.012, ["back"]));
      }
      return group;
    },
  });

  registry.register<Wall02Params>("ST-W02", {
    parse: parseWall02,
    variants: {
      vertical: { mode: "vertical", accent: "cyan" },
      horizontal: { mode: "horizontal", accent: "cyan" },
      dual: { mode: "dual", accent: "warning" },
    },
    metadata: {
      category: "architecture",
      pivot: "module-corner",
      placement: "wall-line",
      grid: { size: [2, 3, WALL_D], module: 2 },
    },
    build: ({ mode, accent }) => {
      const group = new Group();
      addBaseWallShell(group, "white");
      group.add(boxAt([1.48, 1.88, 0.04], "white", [1, 0.44, 0.1], 0.015, ["back"]));
      group.add(boxAt([1.68, 0.025, 0.02], accent, [1, 0.05, 0.118], 0.005, ["back"]));
      if (mode === "vertical" || mode === "dual") {
        for (const x of [0.16, 1.84]) {
          group.add(boxAt([0.1, 1.88, 0.04], "black", [x, 0.44, 0.1], 0.01, ["back"]));
          group.add(boxAt([0.045, 1.68, 0.025], accent, [x, 0.54, 0.115], 0.006, ["back"]));
        }
      }
      if (mode === "horizontal" || mode === "dual") {
        for (const y of [0.28, 2.38]) {
          group.add(boxAt([1.76, 0.09, 0.04], "black", [1, y, 0.1], 0.01, ["back"]));
          group.add(boxAt([1.56, 0.04, 0.025], accent, [1, y + 0.025, 0.115], 0.006, ["back"]));
        }
      }
      return group;
    },
  });

  registry.register<Wall03Params>("ST-W03", {
    parse: parseWall03,
    variants: {
      standard: { style: "standard" },
      reinforced: { style: "reinforced" },
    },
    metadata: {
      category: "architecture",
      pivot: "module-corner",
      placement: "wall-line",
      grid: { size: [2, 3, WIN_WALL_D], module: 2 },
    },
    build: ({ style }) => {
      const group = new Group();
      group.add(boxAt([MODULE, 0.18, WIN_WALL_D], "black", [1, 0, 0], 0.015, ["bottom"]));
      group.add(boxAt([MODULE, 0.34, WIN_WALL_D], "darkGray", [1, CLEAR_H - 0.34, 0], 0.02, ["top"]));
      group.add(boxAt([MODULE, 0.62, 0.2], "white", [1, 0.16, 0], 0.02));
      group.add(boxAt([MODULE, 0.36, 0.2], "white", [1, 2.32, 0], 0.02));
      for (const x of [0.22, 1.78]) {
        group.add(boxAt([0.44, 1.54, 0.2], "white", [x, 0.78, 0], 0.02));
      }
      const octRing = polygonRing(0.78, 0.54, 8);
      group.add(extrudedMesh(octRing, 0.12, 0.02, "black", [1, 1.55, 0.06]));
      const innerRim = chamferRect(1.16, 1.16, 0.28);
      innerRim.holes.push(chamferRect(0.96, 0.96, 0.22));
      group.add(extrudedMesh(innerRim, 0.08, 0.012, "darkGray", [1, 1.55, 0.04]));
      const sky = skyViewportMesh(1.06, 1.06);
      sky.position.set(1, 1.55, 0);
      group.add(sky);
      for (const x of [0.22, 1.78]) {
        group.add(boxAt([0.055, 0.92, 0.03], "cyan", [x, 1.09, 0.118], 0.006, ["back"]));
      }
      group.add(boxAt([0.84, 0.05, 0.03], "cyan", [1, 2.34, 0.118], 0.006, ["back"]));
      if (style === "reinforced") {
        for (const y of [1.28, 1.82]) {
          group.add(boxAt([1.04, 0.045, 0.035], "darkGray", [1, y, 0.09], 0.008));
        }
      }
      return group;
    },
  });

  registry.register<Wall07Params>("ST-W07", {
    parse: parseWall07,
    variants: {
      chevron: { pattern: "chevron" },
      stepped: { pattern: "stepped" },
    },
    metadata: {
      category: "architecture",
      pivot: "module-corner",
      placement: "wall-line",
      grid: { size: [2, 3, WALL_D], module: 2 },
    },
    build: ({ pattern }) => {
      const group = new Group();
      addBaseWallShell(group, "white");
      group.add(boxAt([1.76, 0.72, 0.035], "gray", [1, 0.22, 0.098], 0.012, ["back"]));
      group.add(extrudedMesh(buildBrokenTrimRibbon(pattern), 0.05, 0.01, "black", [1, 1.48, 0.1]));
      group.add(boxAt([0.52, 0.04, 0.025], "cyan", [1, 1.66, 0.115], 0.006, ["back"]));
      for (const x of [0.38, 1.62]) {
        group.add(boxAt([0.28, 0.12, 0.035], "darkGray", [x, 1.12, 0.1], 0.008, ["back"]));
      }
      return group;
    },
  });
}
