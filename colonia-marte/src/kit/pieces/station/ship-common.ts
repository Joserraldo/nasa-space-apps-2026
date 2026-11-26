import { Group, Mesh, Shape } from "three";
import { pipeRun, polygonRing, polygonShape } from "../../primitives";
import type { PieceRegistry } from "../../registry";
import { materials } from "../../../materials/shared";
import {
  alignBaseCenter, boxAt, boxCenter, extrudedMesh, parseChoice, parseRecord,
  screenMesh, weldedColoredGeometry, type PaletteKey,
} from "./helpers";

const dockModes = ["iris", "rover"] as const;
interface DockParams { mode: typeof dockModes[number] }
function parseDock(input: unknown): DockParams {
  const rec = parseRecord(input, ["mode"]);
  return { mode: parseChoice(rec.mode, dockModes, "iris") };
}

const sofaColors = ["blue", "teal"] as const;
interface LoungeSofaParams { cushion: typeof sofaColors[number] }
function parseLoungeSofa(input: unknown): LoungeSofaParams {
  const rec = parseRecord(input, ["cushion"]);
  return { cushion: parseChoice(rec.cushion, sofaColors, "blue") };
}

function sofaSideProfile(): Shape {
  const s = new Shape();
  const pts: [number, number][] = [
    [-0.4, 0], [0.42, 0], [0.42, 0.42], [0.22, 0.46], [-0.14, 0.46], [-0.28, 1.08], [-0.42, 1.08],
  ];
  pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
  s.closePath();
  return s;
}

export function registerShipCommonPieces(registry: PieceRegistry): void {
  registry.register<DockParams>("NW-03-A", {
    parse: parseDock,
    variants: {
      iris: { mode: "iris" },
      rover: { mode: "rover" },
    },
    metadata: { category: "furniture", pivot: "base-center" },
    build: ({ mode }) => {
      const group = new Group();
      const isIris = mode === "iris";
      const padR = isIris ? 0.72 : 0.92;
      const pillarH = isIris ? 1.56 : 1.92;

      // Floor docking pad with glowing cyan alignment ring where Iris (CH-09) or a rover couples.
      const pad = extrudedMesh(polygonShape(padR, 10), 0.045, 0.008, "offWhite", [0, 0.0225, 0.24]);
      pad.rotation.x = -Math.PI / 2;
      const padRing = extrudedMesh(polygonRing(padR + 0.03, padR - 0.06, 10), 0.05, 0.006, "cyan", [0, 0.025, 0.24]);
      padRing.rotation.x = -Math.PI / 2;
      group.add(pad, padRing);

      // Rear charging & telemetry pylon in crisp white and light gray.
      group.add(boxAt([0.96, 0.1, 0.44], "gray", [0, 0, -0.38], 0.016, ["bottom"]));
      group.add(boxAt([0.78, pillarH, 0.34], "white", [0, 0.1, -0.4], 0.024, ["bottom"]));
      for (const sx of [-0.42, 0.42]) {
        group.add(boxAt([0.1, pillarH - 0.12, 0.4], "gray", [sx, 0.1, -0.38], 0.018, ["bottom"]));
        group.add(boxAt([0.035, pillarH - 0.38, 0.032], "cyan", [sx, 0.26, -0.175], 0.005));
      }
      group.add(boxAt([0.94, 0.14, 0.44], "white", [0, pillarH + 0.04, -0.36], 0.02));
      group.add(boxAt([0.52, 0.045, 0.035], "doorOpen", [0, pillarH + 0.08, -0.135], 0.006));

      // Telemetry screen & inductive coupling bumper facing the docked rover.
      group.add(boxCenter([0.54, 0.36, 0.05], "darkGray", [0, pillarH - 0.28, -0.21], 0.012));
      const ui = screenMesh(0.46, 0.28, "energy");
      ui.position.set(0, pillarH - 0.28, -0.178);
      group.add(ui);

      group.add(boxAt([0.56, 0.18, 0.22], "gray", [0, 0.32, -0.22], 0.016));
      group.add(boxAt([0.38, 0.06, 0.04], "cyan", [0, 0.38, -0.105], 0.006));

      // Umbilical power/data cable curving from side manifold toward the docked chassis.
      const cable = new Mesh(
        weldedColoredGeometry(
          pipeRun([
            [0.36, 0.92, -0.26],
            [0.54, 0.62, -0.1],
            [0.48, 0.36, 0.12],
            [0.28, 0.38, 0.18],
          ], 0.032, 8),
          "teal",
        ),
        materials.M_palette,
      );
      group.add(cable);

      return alignBaseCenter(group);
    },
  });

  registry.register<LoungeSofaParams>("BA-02", {
    parse: parseLoungeSofa,
    variants: {
      blue: { cushion: "blue" },
      teal: { cushion: "teal" },
    },
    metadata: { category: "furniture", pivot: "base-center" },
    build: ({ cushion }) => {
      const group = new Group();
      const accent: PaletteKey = cushion;
      // High-back ship common-room lounge sofa from extruded side profile + crisp white shell (INVENTARIO BA-02).
      group.add(boxAt([1.76, 0.1, 0.82], "gray", [0, 0, 0], 0.016, ["bottom"]));
      group.add(boxAt([1.42, 0.036, 0.038], "cyan", [0, 0.03, 0.405], 0.005));

      for (const sx of [-0.84, 0.84]) {
        const cheek = extrudedMesh(sofaSideProfile(), 0.1, 0.016, "white", [sx, 0.08, 0]);
        cheek.rotation.y = Math.PI / 2;
        group.add(cheek);
      }

      group.add(boxAt([1.6, 0.28, 0.74], "white", [0, 0.1, -0.02], 0.02, ["bottom"]));
      group.add(boxAt([1.6, 0.74, 0.14], "white", [0, 0.38, -0.32], 0.022));
      group.add(boxAt([1.68, 0.09, 0.18], "gray", [0, 1.08, -0.32], 0.016));

      for (const cx of [-0.4, 0.4]) {
        group.add(boxAt([0.74, 0.11, 0.58], accent, [cx, 0.38, 0.06], 0.02));
        group.add(boxAt([0.74, 0.54, 0.1], accent, [cx, 0.5, -0.21], 0.02));
      }

      return alignBaseCenter(group);
    },
  });
}
