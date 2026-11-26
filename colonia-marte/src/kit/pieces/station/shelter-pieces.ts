import { Group, Mesh, Path, Shape } from "three";
import { chamferBox, polygonRing, polygonShape } from "../../primitives";
import type { PieceRegistry } from "../../registry";
import { materials } from "../../../materials/shared";
import {
  alignBaseCenter, boxAt, boxCenter, extrudedMesh, parseChoice, parseRecord, type PaletteKey,
} from "./helpers";

const w06Modes = ["shield", "emblem"] as const;
interface Wall06Params { mode: typeof w06Modes[number] }
function parseWall06(input: unknown): Wall06Params {
  const rec = parseRecord(input, ["mode"]);
  return { mode: parseChoice(rec.mode, w06Modes, "shield") };
}

const d02States = ["sealed", "ready"] as const;
interface Door02Params { state: typeof d02States[number] }
function parseDoor02(input: unknown): Door02Params {
  const rec = parseRecord(input, ["state"]);
  return { state: parseChoice(rec.state, d02States, "sealed") };
}

const bunkStates = ["deployed", "folded"] as const;
interface BunkParams { state: typeof bunkStates[number] }
function parseBunk(input: unknown): BunkParams {
  const rec = parseRecord(input, ["state"]);
  return { state: parseChoice(rec.state, bunkStates, "deployed") };
}

function buildBlastArch(outerW: number, outerH: number, openW: number, openH: number, cut: number): Shape {
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
  const ic = cut * 0.72;
  hole.moveTo(-ohw, 0);
  hole.lineTo(-ohw, openH - ic);
  hole.lineTo(-ohw + ic, openH);
  hole.lineTo(ohw - ic, openH);
  hole.lineTo(ohw, openH - ic);
  hole.lineTo(ohw, 0);
  hole.closePath();
  shape.holes.push(hole);
  return shape;
}

function buildDiagonalStrapShape(): Shape {
  const s = new Shape();
  const pts: [number, number][] = [
    [-0.48, -0.52], [-0.14, -0.52], [0.48, 0.14], [0.48, 0.46], [0.14, 0.46], [-0.48, -0.2],
  ];
  pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
  s.closePath();
  return s;
}

export function registerShelterPieces(registry: PieceRegistry): void {
  registry.register<Wall06Params>("ST-W06", {
    parse: parseWall06,
    variants: {
      shield: { mode: "shield" },
      emblem: { mode: "emblem" },
    },
    metadata: {
      category: "architecture",
      pivot: "module-corner",
      placement: "wall-line",
      grid: { size: [2, 3, 0.44], module: 2 },
    },
    build: ({ mode }) => {
      const group = new Group();
      const accent: PaletteKey = mode === "shield" ? "warning" : "cyan";
      // Extra-thick 0.44m bulkhead module with hexagon emblem & water-ballast radiation shield (v2-t059.80 / NW-14).
      group.add(boxAt([2, 0.16, 0.44], "darkGray", [1, 0, 0], 0.018, ["bottom"]));
      group.add(boxAt([2, 0.24, 0.44], "gray", [1, 2.76, 0], 0.02, ["top"]));
      group.add(boxAt([2, 2.62, 0.28], "offWhite", [1, 0.15, 0], 0.02));

      for (const x of [0.22, 1.78]) {
        group.add(boxAt([0.4, 2.6, 0.38], "gray", [x, 0.16, 0], 0.02));
        group.add(boxAt([0.095, 1.3, 0.036], "black", [x, 0.93, 0.184], 0.008));
        group.add(boxAt([0.055, 1.24, 0.035], accent, [x, 0.96, 0.194], 0.006));
      }

      // Sculpted central white armor plate + upper oblong light bar + raised hexagon emblem.
      group.add(boxAt([1.16, 2.6, 0.36], "white", [1, 0.16, 0], 0.024));
      group.add(boxAt([0.66, 0.16, 0.04], "gray", [1, 2.25, 0.175], 0.01));
      group.add(boxAt([0.56, 0.1, 0.032], accent, [1, 2.28, 0.19], 0.006));

      const hexRim = extrudedMesh(polygonRing(0.24, 0.18, 6), 0.03, 0.006, accent, [1, 0.72, 0.184]);
      const hexPlate = extrudedMesh(polygonShape(0.185, 6), 0.038, 0.008, "gray", [1, 0.72, 0.188]);
      group.add(hexRim, hexPlate);

      if (mode === "shield") {
        // Integrated water-shielding inspection column showing translucent M_glass over backlit water ballast.
        group.add(boxAt([0.58, 0.88, 0.06], "gray", [1, 1.18, 0.165], 0.012));
        group.add(boxAt([0.44, 0.74, 0.04], "cyan", [1, 1.25, 0.175], 0.008));
        for (const y of [1.44, 1.7]) {
          group.add(boxAt([0.48, 0.04, 0.045], "darkGray", [1, y, 0.182], 0.005));
        }
        const visor = new Mesh(chamferBox(0.48, 0.78, 0.026, 0.006), materials.M_glass);
        visor.position.set(1, 1.62, 0.198);
        group.add(visor);
      }
      return group;
    },
  });

  registry.register<Door02Params>("ST-D02", {
    parse: parseDoor02,
    variants: {
      sealed: { state: "sealed" },
      ready: { state: "ready" },
    },
    metadata: {
      category: "architecture",
      pivot: "module-corner",
      placement: "wall-line",
      grid: { size: [2, 3, 0.4], module: 2 },
    },
    build: ({ state }) => {
      const group = new Group();
      const indicator: PaletteKey = state === "sealed" ? "doorClosed" : "doorOpen";
      const trimAccent: PaletteKey = state === "sealed" ? "warning" : "cyan";

      // Heavy 0.40m blast door with chamfered gray portal and crisp white diagonal armor leaf (v2-t049.20).
      group.add(boxAt([2, 0.06, 0.4], "darkGray", [1, 0, 0], 0.012, ["bottom"]));
      group.add(boxAt([2, 0.26, 0.4], "gray", [1, 2.74, 0], 0.02, ["top"]));
      for (const x of [0.2, 1.8]) {
        group.add(boxAt([0.4, 2.68, 0.3], "white", [x, 0.06, 0], 0.02, ["bottom"]));
      }
      group.add(boxAt([1.2, 0.34, 0.3], "white", [1, 2.4, 0], 0.02));

      const arch = buildBlastArch(1.84, 2.72, 1.14, 2.36, 0.24);
      group.add(extrudedMesh(arch, 0.34, 0.016, "gray", [1, 0.04, 0]));

      // Thick white blast leaf + light gray diagonal stepped inlay + locking dog & status indicator.
      group.add(boxAt([1.12, 2.34, 0.18], "white", [1, 0.05, 0], 0.016));
      const diag = buildDiagonalStrapShape();
      for (const sideSign of [-1, 1]) {
        group.add(extrudedMesh(diag, 0.04, 0.008, "gray", [1, 1.24, sideSign * 0.095]));
        group.add(boxAt([0.62, 0.055, 0.024], trimAccent, [1, 2.52, sideSign * 0.176], 0.006));
        group.add(boxAt([0.1, 0.38, 0.032], "darkGray", [1.36, 1.08, sideSign * 0.1], 0.008));
        group.add(boxAt([0.045, 0.24, 0.024], indicator, [1.36, 1.15, sideSign * 0.112], 0.005));
      }
      return group;
    },
  });

  registry.register<BunkParams>("AP-02", {
    parse: parseBunk,
    variants: {
      deployed: { state: "deployed" },
      folded: { state: "folded" },
    },
    metadata: { category: "furniture", pivot: "base-center" },
    build: ({ state }) => {
      const group = new Group();
      const W = 1.92;
      // Armored wall-mounted 2-tier folding shelter bunk frame in crisp white & light gray (v2-t059.80 + NW-14).
      group.add(boxAt([W, 0.34, 0.84], "gray", [0, 0, 0], 0.018, ["bottom"]));
      for (const dx of [-0.46, 0.46]) {
        group.add(boxAt([0.84, 0.24, 0.04], "white", [dx, 0.05, 0.41], 0.01));
        group.add(boxAt([0.22, 0.035, 0.025], "warning", [dx, 0.2, 0.432], 0.005));
      }
      group.add(boxAt([W, 1.88, 0.12], "offWhite", [0, 0.34, -0.36], 0.02, ["bottom"]));
      for (const sx of [-0.91, 0.91]) {
        group.add(boxAt([0.1, 1.88, 0.82], "gray", [sx, 0.34, -0.01], 0.018, ["bottom"]));
      }
      group.add(boxAt([W + 0.04, 0.12, 0.86], "white", [0, 2.16, 0], 0.02));
      group.add(boxAt([1.36, 0.038, 0.08], "warning", [0, 2.13, 0.12], 0.006));

      if (state === "deployed") {
        for (const y of [0.38, 1.28]) {
          group.add(boxAt([1.72, 0.1, 0.78], "white", [0, y, 0.02], 0.018));
          group.add(boxAt([1.62, 0.09, 0.7], "offWhite", [0, y + 0.09, 0.02], 0.018));
          group.add(boxAt([1.06, 0.035, 0.68], "blue", [0.22, y + 0.175, 0.02], 0.01));
          group.add(boxAt([0.38, 0.065, 0.56], "white", [-0.56, y + 0.175, 0.02], 0.015));
          group.add(boxAt([0.92, 0.05, 0.04], "gray", [0.1, y + 0.12, 0.4], 0.008));
        }
        group.add(boxAt([1.18, 0.034, 0.06], "warning", [0, 1.245, 0.02], 0.005));

        // Integrated right-hand vertical bunk ladder with amber safety strip.
        for (const lx of [0.54, 0.82]) {
          group.add(boxAt([0.055, 1.72, 0.06], "gray", [lx, 0.36, 0.43], 0.008, ["bottom"]));
        }
        group.add(boxAt([0.028, 1.48, 0.025], "warning", [0.54, 0.48, 0.465], 0.005));
        for (const ly of [0.64, 0.98, 1.32, 1.66]) {
          group.add(boxCenter([0.28, 0.04, 0.045], "gray", [0.68, ly, 0.43], 0.006));
        }
      } else {
        // Stowed/folded state: both bunk platforms hinged upright in white & light gray with amber trim.
        for (const y of [0.42, 1.3]) {
          const tray = new Group();
          tray.add(boxCenter([1.68, 0.74, 0.1], "white", [0, 0.38, 0], 0.018));
          tray.add(boxCenter([1.48, 0.54, 0.04], "gray", [0, 0.38, 0.055], 0.01));
          tray.add(boxCenter([0.64, 0.055, 0.03], "warning", [0, 0.38, 0.072], 0.006));
          tray.position.set(0, y, -0.22);
          tray.rotation.x = 0.08;
          group.add(tray);
        }
        for (const sx of [-0.58, 0.58]) {
          group.add(boxCenter([0.08, 1.62, 0.05], "gray", [sx, 1.24, -0.14], 0.008));
        }
      }
      return alignBaseCenter(group);
    },
  });
}
