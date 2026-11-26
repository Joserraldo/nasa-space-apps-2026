import { Group, Path, Shape } from "three";
import { polygonShape } from "../../primitives";
import type { PieceRegistry } from "../../registry";
import {
  boxAt, extrudedMesh, parseChoice, parseRecord, type PaletteKey,
} from "./helpers";

const CLEAR_H = 3;
const COL_W = 0.72;
const PORTAL_D = 0.3;

const columnAccents = ["cyan", "warning"] as const;
interface ColumnParams { accent: typeof columnAccents[number] }

function parseColumn(input: unknown): ColumnParams {
  const rec = parseRecord(input, ["accent"]);
  return { accent: parseChoice(rec.accent, columnAccents, "cyan") };
}

const doorVariants = ["standard", "service"] as const;
interface DoorFrameParams { opening: typeof doorVariants[number]; state: "doorOpen" | "doorClosed" | "cyan" }

function parseDoorFrame(input: unknown): DoorFrameParams {
  const rec = parseRecord(input, ["opening", "state"]);
  return {
    opening: parseChoice(rec.opening, doorVariants, "standard"),
    state: parseChoice(rec.state, ["doorOpen", "doorClosed", "cyan"] as const, "cyan"),
  };
}

const archStyles = ["open", "reinforced"] as const;
interface ArchwayParams { style: typeof archStyles[number] }

function parseArchway(input: unknown): ArchwayParams {
  const rec = parseRecord(input, ["style"]);
  return { style: parseChoice(rec.style, archStyles, "open") };
}

function buildPortalArchShape(outerW: number, outerH: number, openW: number, openH: number, cut: number): Shape {
  const shape = new Shape();
  const hw = outerW / 2;
  shape.moveTo(-hw, 0);
  shape.lineTo(hw, 0);
  shape.lineTo(hw, outerH - cut);
  shape.lineTo(hw - cut, outerH);
  shape.lineTo(-hw + cut, outerH);
  shape.lineTo(-hw, outerH - cut);
  shape.closePath();

  const hole = new Path();
  const ohw = openW / 2;
  const innerCut = cut * 0.75;
  hole.moveTo(-ohw, 0);
  hole.lineTo(-ohw, openH - innerCut);
  hole.lineTo(-ohw + innerCut, openH);
  hole.lineTo(ohw - innerCut, openH);
  hole.lineTo(ohw, openH - innerCut);
  hole.lineTo(ohw, 0);
  hole.closePath();
  shape.holes.push(hole);
  return shape;
}

/**
 * Point-placed octagonal column [0.72 x 3 x 0.72 m] centered on grid node (0, 0).
 * No 2 m four-arm ceiling capital: compact chamfered plinth and collar stay within 0.72 m.
 */
function addColumnShaft(group: Group, accent: PaletteKey): void {
  group.add(boxAt([COL_W, 0.18, COL_W], "black", [0, 0, 0], 0.07, ["bottom"]));
  group.add(boxAt([0.66, 0.035, 0.66], accent, [0, 0.18, 0], 0.03));
  group.add(boxAt([COL_W, 0.2, COL_W], "black", [0, CLEAR_H - 0.2, 0], 0.07, ["top"]));
  group.add(boxAt([0.66, 0.07, 0.66], "darkGray", [0, CLEAR_H - 0.27, 0], 0.05));
  group.add(boxAt([0.64, 0.045, 0.64], accent, [0, CLEAR_H - 0.315, 0], 0.03));

  const shaft = extrudedMesh(polygonShape(0.315, 8), 2.52, 0.018, "white", [0, 1.46, 0]);
  shaft.rotation.x = -Math.PI / 2;
  group.add(shaft);

  for (const [x, z, rotY] of [[0, 0.318, 0], [0, -0.318, 0], [0.318, 0, Math.PI / 2], [-0.318, 0, Math.PI / 2]]) {
    const housing = boxAt([0.095, 1.92, 0.032], "black", [x, 0.44, z], 0.008);
    const led = boxAt([0.048, 1.74, 0.048], accent, [x, 0.53, z], 0.006);
    housing.rotation.y = rotY;
    led.rotation.y = rotY;
    group.add(housing, led);
  }
}

export function registerStationPortals(registry: PieceRegistry): void {
  registry.register<ColumnParams>("ST-C01", {
    parse: parseColumn,
    variants: {
      cyan: { accent: "cyan" },
      warning: { accent: "warning" },
    },
    metadata: {
      category: "architecture",
      pivot: "base-center",
      placement: "point",
      grid: { size: [COL_W, CLEAR_H, COL_W], module: 2 },
    },
    build: ({ accent }) => {
      const group = new Group();
      addColumnShaft(group, accent);
      return group;
    },
  });

  registry.register<DoorFrameParams>("ST-D01", {
    parse: parseDoorFrame,
    variants: {
      standard: { opening: "standard", state: "cyan" },
      service: { opening: "service", state: "doorOpen" },
      locked: { opening: "standard", state: "doorClosed" },
    },
    metadata: {
      category: "architecture",
      pivot: "module-corner",
      placement: "wall-line",
      grid: { size: [2, CLEAR_H, PORTAL_D], module: 2 },
    },
    build: ({ opening, state }) => {
      const group = new Group();
      const openW = opening === "standard" ? 1.08 : 0.96;
      const openH = opening === "standard" ? 2.4 : 2.2;
      const jambW = (2 - openW) / 2;

      // Symmetrical threshold and lintel cornice spanning Z in [-0.15, +0.15] (0.3 m wall-line).
      group.add(boxAt([2, 0.03, PORTAL_D], "black", [1, 0, 0], 0.008, ["bottom"]));
      group.add(boxAt([2, 0.2, PORTAL_D], "darkGray", [1, CLEAR_H - 0.2, 0], 0.02, ["top"]));

      // Side jambs and header bulkhead centered on Z=0.
      group.add(boxAt([jambW, CLEAR_H - 0.2, 0.20], "white", [jambW / 2, 0, 0], 0.02, ["bottom", "left"]));
      group.add(boxAt([jambW, CLEAR_H - 0.2, 0.20], "white", [2 - jambW / 2, 0, 0], 0.02, ["bottom", "right"]));
      group.add(boxAt([openW, CLEAR_H - openH - 0.2, 0.20], "white", [1, openH, 0], 0.02, ["top"]));

      const arch = buildPortalArchShape(1.86, 2.76, openW, openH, 0.24);
      group.add(extrudedMesh(arch, 0.25, 0.014, "black", [1, 0.02, 0]));

      // Recessed split sci-fi door leaves (v1-t016.10) with dark diagonal/center inlays & cyan seam
      const leafW = openW / 2 - 0.02;
      group.add(boxAt([leafW, openH - 0.04, 0.08], "offWhite", [1 - openW / 4 - 0.01, 0.03, 0], 0.012));
      group.add(boxAt([leafW, openH - 0.04, 0.08], "offWhite", [1 + openW / 4 + 0.01, 0.03, 0], 0.012));
      group.add(boxAt([0.055, openH - 0.14, 0.096], "black", [1, 0.07, 0], 0.006));
      group.add(boxAt([0.034, 1.16, 0.112], "cyan", [1, 0.66, 0], 0.005));

      for (const sideSign of [-1, 1]) {
        const zFace = sideSign * 0.132;
        group.add(boxAt([0.76, 0.09, 0.024], "black", [1, openH + 0.09, zFace], 0.007));
        group.add(boxAt([0.64, 0.058, 0.016], state, [1, openH + 0.106, sideSign * 0.141], 0.005));
        for (const x of [1 - openW / 2 - 0.075, 1 + openW / 2 + 0.075]) {
          group.add(boxAt([0.095, 1.84, 0.024], "black", [x, 0.34, zFace], 0.007));
          group.add(boxAt([0.056, 1.68, 0.016], state, [x, 0.42, sideSign * 0.141], 0.005));
        }
      }
      return group;
    },
  });

  registry.register<ArchwayParams>("ST-D03", {
    parse: parseArchway,
    variants: {
      open: { style: "open" },
      reinforced: { style: "reinforced" },
    },
    metadata: {
      category: "architecture",
      pivot: "module-corner",
      placement: "cell",
      grid: { size: [4, CLEAR_H, 2], module: 2 },
    },
    build: ({ style }) => {
      const group = new Group();
      const bodyColor: PaletteKey = style === "open" ? "white" : "gray";
      group.add(boxAt([0.6, CLEAR_H, 1.84], bodyColor, [0.3, 0, 1], 0.03, ["bottom", "left"]));
      group.add(boxAt([0.6, CLEAR_H, 1.84], bodyColor, [3.7, 0, 1], 0.03, ["bottom", "right"]));
      group.add(boxAt([2.8, 0.48, 1.84], "darkGray", [2, 2.52, 1], 0.03, ["top"]));
      const arch = buildPortalArchShape(3.76, 2.86, 2.74, 2.48, 0.34);
      for (const z of [0.11, 1.89]) {
        group.add(extrudedMesh(arch, 0.16, 0.014, "black", [2, 0.02, z]));
      }
      // Proud bright cyan perimeter frame on front & rear black arch faces (v2-t053.50 booth opening)
      for (const zFace of [0.018, 1.982]) {
        group.add(boxAt([2.04, 0.085, 0.03], "cyan", [2, 2.64, zFace], 0.008));
        for (const x of [0.46, 3.54]) {
          group.add(boxAt([0.085, 2.18, 0.03], "cyan", [x, 0.22, zFace], 0.008));
        }
      }
      group.add(boxAt([4, 0.03, 2], "black", [2, 0, 1], 0.008, ["bottom"]));
      group.add(boxAt([2.72, 0.028, 1.84], "darkGray", [2, 0.015, 1], 0.006, ["bottom"]));
      group.add(boxAt([2.62, 0.036, 0.08], "cyan", [2, 0.018, 1.95], 0.006, ["bottom"]));
      for (const z of [0.55, 1.45]) {
        group.add(boxAt([2.24, 0.055, 0.12], "cyan", [2, 2.48, z], 0.008, ["top"]));
      }
      if (style === "reinforced") {
        for (const x of [0.64, 3.36]) {
          group.add(boxAt([0.05, 1.78, 0.1], "cyan", [x, 0.42, 1], 0.008));
        }
      }
      return group;
    },
  });
}
