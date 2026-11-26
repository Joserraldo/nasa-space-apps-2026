import { Group, Mesh } from "three";
import { pipeRun, polygonRing, polygonShape } from "../../primitives";
import type { PieceRegistry } from "../../registry";
import { materials } from "../../../materials/shared";
import {
  alignBaseCenter, boxAt, boxCenter, extrudedMesh, parseChoice, parseRecord,
  weldedColoredGeometry, type PaletteKey,
} from "../station/helpers";

const dishModes = ["tracking", "stowed"] as const;
interface DishParams { mode: typeof dishModes[number] }

function parseDish(input: unknown): DishParams {
  const rec = parseRecord(input, ["mode"]);
  return { mode: parseChoice(rec.mode, dishModes, "tracking") };
}

export function registerMarsCommsDish(registry: PieceRegistry): void {
  registry.register<DishParams>("MI-05", {
    parse: parseDish,
    variants: {
      tracking: { mode: "tracking" },
      stowed: { mode: "stowed" },
    },
    metadata: { category: "largeFurniture", pivot: "base-center" },
    build: ({ mode }) => {
      const group = new Group();
      const tilt = mode === "tracking" ? 0.62 : 0.16;

      // Quad-buttress Mars ground pedestal with black pads, hull turret & cyan status ring (v3-t016.40).
      const plinth = extrudedMesh(polygonShape(0.66, 8), 0.14, 0.018, "black", [0, 0.07, 0]);
      plinth.rotation.x = -Math.PI / 2;
      const column = extrudedMesh(polygonShape(0.42, 8), 0.86, 0.02, "hull", [0, 0.56, 0]);
      column.rotation.x = -Math.PI / 2;
      const collar = extrudedMesh(polygonRing(0.46, 0.39, 8), 0.07, 0.008, "cyan", [0, 0.94, 0]);
      collar.rotation.x = -Math.PI / 2;
      group.add(plinth, column, collar);

      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2 + Math.PI / 4;
        const leg = new Group();
        leg.add(boxAt([0.16, 0.72, 0.24], "darkGray", [0, 0.08, 0.50], 0.018, ["bottom"]));
        leg.add(boxAt([0.22, 0.10, 0.28], "black", [0, 0, 0.54], 0.014, ["bottom"]));
        leg.rotation.y = angle;
        group.add(leg);
      }

      // Steerable elevation yoke & hexagonal-cell parabolic reflector array.
      const head = new Group();
      head.position.set(0, 1.18, 0);
      head.rotation.x = tilt;

      head.add(boxCenter([0.52, 0.24, 0.32], "darkGray", [0, -0.14, 0], 0.02));
      const outerRim = extrudedMesh(polygonRing(1.38, 1.16, 6), 0.14, 0.018, "white", [0, 0.06, 0]);
      outerRim.rotation.x = -Math.PI / 2;
      const bowlBack = extrudedMesh(polygonShape(1.22, 6), 0.10, 0.016, "black", [0, 0.01, 0]);
      bowlBack.rotation.x = -Math.PI / 2;
      head.add(outerRim, bowlBack);

      // Six glowing cyan & amber rim brackets around the hexagonal dish perimeter (v3-t016.40).
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        const bracketColor: PaletteKey = i % 2 === 0 ? "cyan" : "yellow";
        const bracket = boxCenter([0.36, 0.055, 0.075], bracketColor, [Math.cos(a) * 1.16, 0.145, Math.sin(a) * 1.16], 0.008);
        bracket.rotation.y = -a + Math.PI / 2;
        head.add(bracket);
      }

      // 19 individual beveled hexagonal reflector cells (center + 6 inner + 12 outer).
      const cellPositions: [number, number][] = [[0, 0]];
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        cellPositions.push([Math.cos(a) * 0.40, Math.sin(a) * 0.40]);
      }
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6;
        const r = i % 2 === 0 ? 0.80 : 0.72;
        cellPositions.push([Math.cos(a) * r, Math.sin(a) * r]);
      }
      cellPositions.forEach(([cx, cz], idx) => {
        const cellColor: PaletteKey = idx === 0 ? "cyan" : idx % 3 === 0 ? "teal" : "blue";
        const hex = extrudedMesh(polygonShape(0.175, 6), 0.045, 0.007, cellColor, [cx, 0.082, cz]);
        hex.rotation.x = -Math.PI / 2;
        head.add(hex);
      });

      // Central feedhorn mast & glowing cyan emitter tip.
      const feedMast = new Mesh(
        weldedColoredGeometry(pipeRun([[0, 0.08, 0], [0, 0.78, 0]], 0.032, 6), "white"),
        materials.M_palette,
      );
      const feedTip = extrudedMesh(polygonShape(0.085, 6), 0.07, 0.009, "cyan", [0, 0.80, 0]);
      feedTip.rotation.x = -Math.PI / 2;
      head.add(feedMast, feedTip);

      group.add(head);
      return alignBaseCenter(group);
    },
  });
}
