import { Group, Mesh, Shape } from "three";
import { pipeRun, polygonRing, polygonShape } from "../../primitives";
import type { PieceRegistry } from "../../registry";
import { materials } from "../../../materials/shared";
import {
  boostVertexLuminance, boxAt, extrudedMesh, parseChoice, parseRecord,
  segmentedFloorTop, weldedColoredGeometry,
} from "./helpers";

const w05Modes = ["vent", "sprayer"] as const;
interface Wall05Params { mode: typeof w05Modes[number] }

function parseWall05(input: unknown): Wall05Params {
  const rec = parseRecord(input, ["mode"]);
  return { mode: parseChoice(rec.mode, w05Modes, "vent") };
}

const f03Patterns = ["angular", "grate"] as const;
interface Floor03Params { pattern: typeof f03Patterns[number] }

function parseFloor03(input: unknown): Floor03Params {
  const rec = parseRecord(input, ["pattern"]);
  return { pattern: parseChoice(rec.pattern, f03Patterns, "angular") };
}

const r05Modes = ["cyan", "bright"] as const;
interface Ceiling05Params { mode: typeof r05Modes[number] }

function parseCeiling05(input: unknown): Ceiling05Params {
  const rec = parseRecord(input, ["mode"]);
  return { mode: parseChoice(rec.mode, r05Modes, "cyan") };
}

function angularBandShape(): Shape {
  const shape = new Shape();
  const pts: [number, number][] = [
    [-0.96, -0.96], [0.22, -0.96], [0.96, 0.18], [0.96, 0.96], [-0.18, 0.96], [-0.96, -0.18],
  ];
  pts.forEach(([x, y], i) => (i ? shape.lineTo(x, y) : shape.moveTo(x, y)));
  shape.closePath();
  return shape;
}

export function registerAirlockArchitecture(registry: PieceRegistry): void {
  registry.register<Wall05Params>("ST-W05", {
    parse: parseWall05,
    variants: {
      vent: { mode: "vent" },
      sprayer: { mode: "sprayer" },
    },
    metadata: {
      category: "architecture",
      pivot: "module-corner",
      placement: "wall-line",
      grid: { size: [2, 3, 0.26], module: 2 },
    },
    build: ({ mode }) => {
      const group = new Group();
      group.add(boxAt([2, 0.14, 0.26], "darkGray", [1, 0, 0], 0.015, ["bottom"]));
      group.add(boxAt([2, 0.3, 0.26], "gray", [1, 2.7, 0], 0.02, ["top"]));
      group.add(boxAt([2, 2.58, 0.18], "white", [1, 0.13, 0], 0.02));

      if (mode === "vent") {
        // Upper chamfered exhaust grille + lower ribbed wall panels (v2-t053.50).
        group.add(boxAt([0.62, 0.62, 0.05], "white", [1, 1.92, 0.098], 0.018, ["back"]));
        group.add(boxAt([0.5, 0.5, 0.045], "black", [1, 1.98, 0.104], 0.012, ["back"]));
        for (let i = 0; i < 4; i++) {
          group.add(boxAt([0.42, 0.055, 0.03], "darkGray", [1, 2.04 + i * 0.11, 0.112], 0.006, ["back"]));
        }
        for (const x of [0.46, 1.0, 1.54]) {
          group.add(boxAt([0.44, 1.5, 0.035], "offWhite", [x, 0.26, 0.096], 0.012, ["back"]));
        }
      } else {
        // Decontamination cabin wall: overhead cyan wash bar, louvers, and mist sprayer rails.
        group.add(boxAt([1.72, 0.18, 0.05], "black", [1, 2.38, 0.1], 0.012, ["back"]));
        group.add(boxAt([1.56, 0.055, 0.03], "cyan", [1, 2.3, 0.112], 0.008, ["back"]));
        for (const x of [0.48, 1.52]) {
          const pipe = new Mesh(
            weldedColoredGeometry(pipeRun([[x, 0.28, 0.1], [x, 2.18, 0.1]], 0.028, 6), "gray"),
            materials.M_palette,
          );
          group.add(pipe);
          for (const y of [0.72, 1.28, 1.84]) {
            group.add(boxAt([0.1, 0.08, 0.05], "darkGray", [x, y, 0.1], 0.01, ["back"]));
            group.add(boxAt([0.05, 0.03, 0.025], "cyan", [x, y + 0.025, 0.116], 0.005, ["back"]));
          }
        }
        group.add(boxAt([0.74, 1.46, 0.035], "offWhite", [1, 0.34, 0.096], 0.012, ["back"]));
      }
      return group;
    },
  });

  registry.register<Floor03Params>("ST-F03", {
    parse: parseFloor03,
    variants: {
      angular: { pattern: "angular" },
      grate: { pattern: "grate" },
    },
    metadata: {
      category: "architecture",
      pivot: "module-corner",
      placement: "cell",
      grid: { size: [2, 0.2, 2], module: 2 },
    },
    build: ({ pattern }) => {
      const group = new Group();
      group.add(boxAt([2, 0.14, 2], "black", [1, 0, 1], 0.015, ["bottom"]));
      group.add(boxAt([1.96, 0.052, 1.96], "offWhite", [1, 0.14, 1], 0.012, ["bottom"]));
      group.add(segmentedFloorTop([1.88, 1.88], [6, 6], "offWhite", [1, 0.194, 1]));
      if (pattern === "angular") {
        // Bold dark charcoal & slate diagonal inlay zone ordering the room floor (v2-t053.50)
        const band = extrudedMesh(angularBandShape(), 0.038, 0.006, "black", [1, 0.181, 1]);
        band.rotation.x = -Math.PI / 2;
        group.add(band);
      } else {
        group.add(boxAt([1.76, 0.056, 1.76], "darkGray", [1, 0.141, 1], 0.01, ["bottom"]));
        for (const x of [0.52, 1.0, 1.48]) {
          group.add(boxAt([0.14, 0.059, 1.44], "black", [x, 0.141, 1], 0.008, ["bottom"]));
        }
        group.add(boxAt([1.62, 0.059, 0.08], "cyan", [1, 0.141, 0.20], 0.006, ["bottom"]));
      }
      return group;
    },
  });

  registry.register<Ceiling05Params>("ST-R05", {
    parse: parseCeiling05,
    variants: {
      cyan: { mode: "cyan" },
      bright: { mode: "bright" },
    },
    metadata: {
      category: "architecture",
      pivot: "module-corner",
      placement: "cell",
      grid: { size: [2, 0.6, 2], module: 2 },
    },
    build: ({ mode }) => {
      const group = new Group();
      group.add(boxAt([2, 0.22, 2], "gray", [1, 0.38, 1], 0.02, ["top"]));
      group.add(boxAt([1.8, 0.16, 1.8], "white", [1, 0.22, 1], 0.02, ["top"]));
      const housing = extrudedMesh(polygonRing(0.68, 0.48, 10), 0.14, 0.016, "darkGray", [1, 0.14, 1]);
      housing.rotation.x = -Math.PI / 2;
      const glowRing = extrudedMesh(
        polygonRing(0.62, 0.5, 10),
        0.05,
        0.008,
        mode === "cyan" ? "cyan" : "white",
        [1, 0.025, 1],
      );
      if (mode === "bright") glowRing.geometry = boostVertexLuminance(glowRing.geometry, [2.1, 2.25, 2.55]);
      glowRing.rotation.x = -Math.PI / 2;
      const hub = extrudedMesh(polygonShape(0.18, 8), 0.1, 0.012, "gray", [1, 0.1, 1]);
      hub.rotation.x = -Math.PI / 2;
      group.add(housing, glowRing, hub);
      for (let b = 0; b < 4; b++) {
        const blade = boxAt([0.82, 0.035, 0.09], "black", [1, 0.08, 1], 0.006);
        blade.rotation.y = (b * Math.PI) / 4;
        group.add(blade);
      }
      return group;
    },
  });
}
