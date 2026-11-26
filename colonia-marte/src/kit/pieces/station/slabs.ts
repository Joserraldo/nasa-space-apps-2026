import { Group, Path, Shape, Vector2 } from "three";
import { polygonRing, polygonShape } from "../../primitives";
import type { PieceRegistry } from "../../registry";
import {
  boostVertexLuminance, boxAt, extrudedMesh, parseChoice, parseRecord,
  segmentedFloorTop, type PaletteKey,
} from "./helpers";

const floorStyles = ["standard", "quad", "accent", "dark"] as const;
interface Floor01Params { style: typeof floorStyles[number] }

function parseFloor01(input: unknown): Floor01Params {
  const rec = parseRecord(input, ["style"]);
  return { style: parseChoice(rec.style, floorStyles, "standard") };
}

const inlayStyles = ["slate", "blue"] as const;
interface Floor02Params { style: typeof inlayStyles[number] }

function parseFloor02(input: unknown): Floor02Params {
  const rec = parseRecord(input, ["style"]);
  return { style: parseChoice(rec.style, inlayStyles, "slate") };
}

const daisAccents = ["cyan", "warning"] as const;
interface Floor04Params { accent: typeof daisAccents[number] }

function parseFloor04(input: unknown): Floor04Params {
  const rec = parseRecord(input, ["accent"]);
  return { accent: parseChoice(rec.accent, daisAccents, "cyan") };
}

const ceiling01Layouts = ["single", "twin"] as const;
interface Ceiling01Params { layout: typeof ceiling01Layouts[number] }

function parseCeiling01(input: unknown): Ceiling01Params {
  const rec = parseRecord(input, ["layout"]);
  return { layout: parseChoice(rec.layout, ceiling01Layouts, "single") };
}

const lightTones = ["cyan", "warm"] as const;
interface LampToneParams { tone: typeof lightTones[number] }

function parseLampTone(input: unknown): LampToneParams {
  const rec = parseRecord(input, ["tone"]);
  return { tone: parseChoice(rec.tone, lightTones, "cyan") };
}

function roundedRectPoints(width: number, depth: number, radius: number, arcSteps = 5): Vector2[] {
  const hx = width / 2 - radius;
  const hy = depth / 2 - radius;
  const corners: [number, number, number][] = [
    [hx, -hy, -Math.PI / 2],
    [hx, hy, 0],
    [-hx, hy, Math.PI / 2],
    [-hx, -hy, Math.PI],
  ];
  const points: Vector2[] = [];
  for (const [cx, cy, start] of corners) {
    for (let step = 0; step <= arcSteps; step++) {
      const angle = start + (step / arcSteps) * (Math.PI / 2);
      points.push(new Vector2(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius));
    }
  }
  return points;
}

function roundedRectRing(
  outerW: number,
  outerD: number,
  outerR: number,
  innerW: number,
  innerD: number,
  innerR: number,
): Shape {
  const outerPts = roundedRectPoints(outerW, outerD, outerR, 5);
  const shape = new Shape(outerPts);
  shape.closePath();
  const holePts = roundedRectPoints(innerW, innerD, innerR, 5).reverse();
  const hole = new Path(holePts);
  hole.closePath();
  shape.holes.push(hole);
  return shape;
}

export function registerStationSlabs(registry: PieceRegistry): void {
  registry.register<Floor01Params>("ST-F01", {
    parse: parseFloor01,
    variants: {
      standard: { style: "standard" },
      quad: { style: "quad" },
      accent: { style: "accent" },
      dark: { style: "dark" },
    },
    metadata: {
      category: "architecture",
      pivot: "module-corner",
      placement: "cell",
      grid: { size: [2, 0.2, 2], module: 2 },
    },
    build: ({ style }) => {
      const group = new Group();
      group.add(boxAt([2, 0.14, 2], "black", [1, 0, 1], 0.015, ["bottom"]));
      if (style === "quad") {
        for (const x of [0.51, 1.49]) {
          for (const z of [0.51, 1.49]) {
            group.add(boxAt([0.95, 0.058, 0.95], "offWhite", [x, 0.14, z], 0.012, ["bottom"]));
            group.add(segmentedFloorTop([0.86, 0.86], [4, 4], "offWhite", [x, 0.2, z]));
          }
        }
      } else if (style === "dark") {
        // Deep charcoal floor zone for workstation bays, racks, and thresholds (v1-t016.10 / v2-t053.50)
        group.add(boxAt([1.96, 0.056, 1.96], "darkGray", [1, 0.14, 1], 0.012, ["bottom"]));
        group.add(segmentedFloorTop([1.80, 1.80], [6, 6], "black", [1, 0.1975, 1]));
        for (const z of [0.14, 1.86]) {
          group.add(boxAt([1.84, 0.059, 0.055], "cyan", [1, 0.141, z], 0.005, ["bottom"]));
        }
      } else {
        group.add(boxAt([1.95, 0.056, 1.95], "offWhite", [1, 0.14, 1], 0.014, ["bottom"]));
        group.add(segmentedFloorTop([1.84, 1.84], [8, 8], "offWhite", [1, 0.1975, 1]));
        for (const [x, z] of [[0.2, 0.2], [1.8, 0.2], [0.2, 1.8], [1.8, 1.8]]) {
          group.add(boxAt([0.18, 0.06, 0.18], "darkGray", [x, 0.14, z], 0.008, ["bottom"]));
        }
        if (style === "accent") {
          for (const z of [0.26, 1.74]) {
            group.add(boxAt([1.78, 0.058, 0.26], "black", [1, 0.14, z], 0.008, ["bottom"]));
            group.add(boxAt([1.48, 0.059, 0.058], "cyan", [1, 0.141, z], 0.006, ["bottom"]));
          }
        }
      }
      return group;
    },
  });

  registry.register<Floor02Params>("ST-F02", {
    parse: parseFloor02,
    variants: {
      slate: { style: "slate" },
      blue: { style: "blue" },
    },
    metadata: {
      category: "architecture",
      pivot: "module-corner",
      placement: "cell",
      grid: { size: [4, 0.2, 4], module: 2 },
    },
    build: ({ style }) => {
      const group = new Group();
      const outerColor: PaletteKey = style === "slate" ? "darkGray" : "blue";
      const innerColor: PaletteKey = style === "slate" ? "blue" : "darkGray";
      group.add(boxAt([4, 0.14, 4], "black", [2, 0, 2], 0.018, ["bottom"]));
      group.add(boxAt([3.95, 0.055, 3.95], "offWhite", [2, 0.14, 2], 0.014, ["bottom"]));

      const outerTrack = extrudedMesh(
        roundedRectRing(3.68, 2.96, 0.58, 3.24, 2.52, 0.36),
        0.04,
        0.008,
        outerColor,
        [2, 0.18, 2],
      );
      outerTrack.rotation.x = -Math.PI / 2;

      const innerTrack = extrudedMesh(
        roundedRectRing(3.18, 2.46, 0.32, 3.02, 2.3, 0.24),
        0.036,
        0.007,
        innerColor,
        [2, 0.18, 2],
      );
      innerTrack.rotation.x = -Math.PI / 2;
      group.add(outerTrack, innerTrack);
      group.add(segmentedFloorTop([2.98, 2.26], [12, 10], "offWhite", [2, 0.197, 2]));
      return group;
    },
  });

  registry.register<Floor04Params>("ST-F04", {
    parse: parseFloor04,
    variants: {
      cyan: { accent: "cyan" },
      warning: { accent: "warning" },
    },
    metadata: {
      category: "architecture",
      pivot: "module-corner",
      placement: "cell",
      grid: { size: [4, 0.2, 4], module: 2 },
    },
    build: ({ accent }) => {
      const group = new Group();
      group.add(boxAt([4, 0.09, 4], "gray", [2, 0, 2], 0.018, ["bottom"]));
      const outerRing = extrudedMesh(polygonRing(1.96, 1.70, 12), 0.058, 0.008, "darkGray", [2, 0.112, 2]);
      outerRing.rotation.x = -Math.PI / 2;
      const apron = extrudedMesh(polygonShape(1.70, 12), 0.052, 0.01, "gray", [2, 0.11, 2]);
      apron.rotation.x = -Math.PI / 2;
      const glowRing = extrudedMesh(polygonRing(1.66, 1.38, 12), 0.056, 0.008, accent, [2, 0.14, 2]);
      glowRing.rotation.x = -Math.PI / 2;
      const dais = extrudedMesh(polygonShape(1.34, 12), 0.088, 0.014, "white", [2, 0.156, 2]);
      dais.rotation.x = -Math.PI / 2;
      group.add(outerRing, apron, glowRing, dais);
      const bridges: [number, number, number, number][] = [
        [2, 0.28, 0.44, 0.52], [2, 3.72, 0.44, 0.52], [0.28, 2, 0.52, 0.44], [3.72, 2, 0.52, 0.44],
      ];
      for (const [x, z, w, d] of bridges) {
        group.add(boxAt([w, 0.045, d], "darkGray", [x, 0.085, z], 0.01, ["bottom"]));
      }
      return group;
    },
  });

  registry.register<Ceiling01Params>("ST-R01", {
    parse: parseCeiling01,
    variants: {
      single: { layout: "single" },
      twin: { layout: "twin" },
    },
    metadata: {
      category: "architecture",
      pivot: "module-corner",
      placement: "cell",
      grid: { size: [2, 0.6, 2], module: 2 },
    },
    build: ({ layout }) => {
      const group = new Group();
      group.add(boxAt([2, 0.22, 2], "gray", [1, 0.38, 1], 0.02, ["top"]));
      group.add(boxAt([1.76, 0.16, 1.76], "white", [1, 0.22, 1], 0.02, ["top"]));
      for (const z of [0.12, 1.88]) {
        group.add(boxAt([2, 0.3, 0.24], "darkGray", [1, 0.08, z], 0.018, ["top"]));
      }
      if (layout === "single") {
        group.add(boxAt([1.76, 0.14, 0.26], "black", [1, 0.08, 1], 0.016, ["top"]));
        const mainBar = boxAt([1.62, 0.085, 0.11], "white", [1, 0, 1], 0.01, ["top"]);
        mainBar.geometry = boostVertexLuminance(mainBar.geometry, [2.05, 2.05, 2.28]);
        group.add(mainBar);
      } else {
        group.add(boxAt([1.76, 0.14, 0.22], "black", [1, 0.08, 0.52], 0.015, ["top"]));
        const mainBar = boxAt([1.62, 0.085, 0.11], "white", [1, 0, 0.52], 0.01, ["top"]);
        mainBar.geometry = boostVertexLuminance(mainBar.geometry, [2.05, 2.05, 2.28]);
        group.add(mainBar);
        group.add(boxAt([1.76, 0.14, 0.14], "black", [1, 0.08, 1.54], 0.012, ["top"]));
        group.add(boxAt([1.56, 0.085, 0.055], "cyan", [1, 0, 1.54], 0.008, ["top"]));
      }
      return group;
    },
  });

  registry.register<LampToneParams>("ST-R02", {
    parse: parseLampTone,
    variants: {
      cyan: { tone: "cyan" },
      warm: { tone: "warm" },
    },
    metadata: {
      category: "architecture",
      pivot: "module-corner",
      placement: "cell",
      grid: { size: [4, 0.6, 4], module: 2 },
    },
    build: ({ tone }) => {
      const group = new Group();
      const glowScale: [number, number, number] = tone === "cyan"
        ? [2.18, 2.20, 2.46]
        : [2.32, 2.18, 1.96];
      group.add(boxAt([4, 0.18, 4], "gray", [2, 0.42, 2], 0.025, ["top"]));
      group.add(boxAt([3.6, 0.08, 3.6], "white", [2, 0.34, 2], 0.02, ["top"]));
      for (const z of [0.22, 3.78]) {
        group.add(boxAt([3.32, 0.06, 0.11], "cyan", [2, 0.32, z], 0.008, ["top"]));
      }
      for (const [x, z] of [[0.58, 2], [3.42, 2], [2, 0.58], [2, 3.42]]) {
        group.add(boxAt([0.22, 0.28, 0.22], "black", [x, 0.06, z], 0.016));
      }
      const housing = extrudedMesh(polygonRing(1.48, 0.9, 10), 0.2, 0.02, "white", [2, 0.14, 2]);
      housing.rotation.x = -Math.PI / 2;
      const innerCollar = extrudedMesh(polygonRing(0.95, 0.85, 10), 0.16, 0.012, "gray", [2, 0.15, 2]);
      innerCollar.rotation.x = -Math.PI / 2;
      const diffuser = extrudedMesh(polygonRing(1.38, 0.96, 10), 0.055, 0.009, "white", [2, 0.0275, 2]);
      diffuser.geometry = boostVertexLuminance(diffuser.geometry, glowScale);
      diffuser.rotation.x = -Math.PI / 2;
      group.add(housing, innerCollar, diffuser);
      return group;
    },
  });

  registry.register<LampToneParams>("ST-R04", {
    parse: parseLampTone,
    variants: {
      cyan: { tone: "cyan" },
      warm: { tone: "warm" },
    },
    metadata: {
      category: "architecture",
      pivot: "module-corner",
      placement: "cell",
      grid: { size: [2, 0.6, 2], module: 2 },
    },
    build: ({ tone }) => {
      const group = new Group();
      group.add(boxAt([2, 0.22, 2], "gray", [1, 0.38, 1], 0.02, ["top"]));
      group.add(boxAt([1.84, 0.16, 1.84], "white", [1, 0.22, 1], 0.02, ["top"]));
      const collar = extrudedMesh(polygonShape(0.42, 8), 0.1, 0.014, "gray", [1, 0.17, 1]);
      collar.rotation.x = -Math.PI / 2;
      const bezel = extrudedMesh(polygonRing(0.35, 0.2, 8), 0.12, 0.014, "white", [1, 0.08, 1]);
      bezel.rotation.x = -Math.PI / 2;
      const lens = extrudedMesh(
        polygonShape(0.21, 8),
        0.05,
        0.008,
        tone === "cyan" ? "cyan" : "white",
        [1, 0.025, 1],
      );
      if (tone === "warm") lens.geometry = boostVertexLuminance(lens.geometry, [2.15, 2.25, 2.55]);
      lens.rotation.x = -Math.PI / 2;
      group.add(collar, bezel, lens);
      return group;
    },
  });
}
