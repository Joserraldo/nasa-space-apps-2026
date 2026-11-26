import { Group, Mesh } from "three";
import { chamferBox, polygonShape } from "../../primitives";
import type { PieceRegistry } from "../../registry";
import { materials } from "../../../materials/shared";
import {
  alignBaseCenter, boxAt, boxCenter, extrudedMesh, parseChoice, parseRecord, type PaletteKey,
} from "./helpers";

const rackModes = ["water", "provisions"] as const;
interface RackParams { stock: typeof rackModes[number] }
function parseRack(input: unknown): RackParams {
  const rec = parseRecord(input, ["stock"]);
  return { stock: parseChoice(rec.stock, rackModes, "water") };
}

const cubbyModes = ["rations", "medical"] as const;
interface CubbyParams { stock: typeof cubbyModes[number] }
function parseCubby(input: unknown): CubbyParams {
  const rec = parseRecord(input, ["stock"]);
  return { stock: parseChoice(rec.stock, cubbyModes, "rations") };
}

export function registerShipShelterPieces(registry: PieceRegistry): void {
  registry.register<RackParams>("LD-03", {
    parse: parseRack,
    variants: {
      water: { stock: "water" },
      provisions: { stock: "provisions" },
    },
    metadata: { category: "furniture", pivot: "base-center" },
    build: ({ stock }) => {
      const group = new Group();
      const W = 1.62;
      const D = 0.56;
      // Bright white & light-gray open modular ship storage rack with amber emergency trim (INVENTARIO LD-03 / NW-17).
      group.add(boxAt([W, 0.08, D], "gray", [0, 0, 0], 0.014, ["bottom"]));
      for (const sx of [-0.75, 0.75]) {
        for (const sz of [-0.22, 0.22]) {
          group.add(boxAt([0.08, 2.02, 0.08], "gray", [sx, 0.08, sz], 0.012, ["bottom"]));
        }
      }
      for (const sy of [0.12, 0.76, 1.4, 2.02]) {
        group.add(boxAt([W, 0.065, D], "white", [0, sy, 0], 0.014));
      }
      group.add(boxAt([W - 0.16, 0.72, 0.04], "offWhite", [0, 0.18, -0.24], 0.01));
      group.add(boxAt([W - 0.16, 0.72, 0.04], "offWhite", [0, 0.84, -0.24], 0.01));
      group.add(boxAt([W - 0.16, 0.58, 0.04], "offWhite", [0, 1.46, -0.24], 0.01));
      group.add(boxAt([1.18, 0.036, 0.03], "warning", [0, 2.06, 0.275], 0.005));

      if (stock === "water") {
        // Potable water bladders & jerrycans acting as hydrogen-rich radiation shielding.
        for (const sy of [0.19, 0.83]) {
          for (const x of [-0.38, 0.38]) {
            group.add(boxAt([0.52, 0.5, 0.4], "white", [x, sy, 0.02], 0.016));
            group.add(boxAt([0.32, 0.36, 0.05], "cyan", [x, sy + 0.06, 0.205], 0.008));
            const sight = new Mesh(chamferBox(0.34, 0.38, 0.024, 0.006), materials.M_glass);
            sight.position.set(x, sy + 0.25, 0.23);
            group.add(sight);
            group.add(boxAt([0.12, 0.05, 0.12], "teal", [x, sy + 0.5, 0.06], 0.008));
          }
        }
        for (const x of [-0.36, 0.36]) {
          const drum = extrudedMesh(polygonShape(0.2, 8), 0.48, 0.014, "white", [x, 1.71, 0.02]);
          drum.rotation.x = -Math.PI / 2;
          group.add(drum);
          group.add(boxCenter([0.24, 0.05, 0.04], "cyan", [x, 1.72, 0.21], 0.006));
        }
      } else {
        // Emergency freeze-dried ration crates & labeled supply canisters.
        const bands: PaletteKey[] = ["teal", "yellow", "blue", "teal"];
        let idx = 0;
        for (const sy of [0.19, 0.83]) {
          for (const x of [-0.38, 0.38]) {
            const band = bands[idx % bands.length];
            idx++;
            group.add(boxAt([0.54, 0.44, 0.42], "white", [x, sy, 0.02], 0.016));
            group.add(boxAt([0.56, 0.07, 0.44], "gray", [x, sy + 0.42, 0.02], 0.012));
            group.add(boxAt([0.32, 0.065, 0.03], band, [x, sy + 0.24, 0.23], 0.006));
          }
        }
        for (const x of [-0.42, 0, 0.42]) {
          const canister = extrudedMesh(polygonShape(0.16, 8), 0.44, 0.012, "offWhite", [x, 1.69, 0.02]);
          canister.rotation.x = -Math.PI / 2;
          group.add(canister);
          group.add(boxCenter([0.18, 0.045, 0.03], "red", [x, 1.72, 0.175], 0.005));
        }
      }

      return alignBaseCenter(group);
    },
  });

  registry.register<CubbyParams>("DN-08", {
    parse: parseCubby,
    variants: {
      rations: { stock: "rations" },
      medical: { stock: "medical" },
    },
    metadata: { category: "furniture", pivot: "base-center" },
    build: ({ stock }) => {
      const group = new Group();
      const badge: PaletteKey = stock === "medical" ? "red" : "teal";
      // Wall-mounted 3x2 open cubby storage grid in crisp white & light gray (INVENTARIO DN-08 / NW-17).
      group.add(boxAt([1.56, 0.06, 0.36], "white", [0, 0, 0], 0.012, ["bottom"]));
      group.add(boxAt([1.56, 0.06, 0.36], "white", [0, 0.8, 0], 0.012));
      group.add(boxAt([1.56, 0.05, 0.34], "white", [0, 0.4, 0], 0.01));
      group.add(boxAt([1.52, 0.76, 0.04], "offWhite", [0, 0.05, -0.15], 0.01));

      for (const sx of [-0.75, -0.25, 0.25, 0.75]) {
        group.add(boxAt([0.055, 0.76, 0.34], "gray", [sx, 0.05, 0], 0.01));
      }
      group.add(boxAt([1.12, 0.032, 0.028], "warning", [0, 0.84, 0.175], 0.005));

      for (const cy of [0.06, 0.46]) {
        for (const cx of [-0.5, 0, 0.5]) {
          group.add(boxAt([0.36, 0.26, 0.26], "white", [cx, cy, 0.01], 0.014));
          group.add(boxAt([0.2, 0.055, 0.028], badge, [cx, cy + 0.12, 0.142], 0.005));
        }
      }

      return alignBaseCenter(group);
    },
  });
}
