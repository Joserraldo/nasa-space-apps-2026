import { CylinderGeometry, Group, Mesh } from "three";
import type { PieceRegistry } from "../../registry";
import { materials } from "../../../materials/shared";
import { coloredGeometry } from "../../../materials/uv";
import { boxCenter, parseRecord } from "../station/helpers";
import { fusedParts } from "./transit-details";

export function registerStreetLamp(registry: PieceRegistry): void {
  registry.register("MI-02", {
    parse: input => parseRecord(input, []),
    variants: { standard: {} },
    metadata: { category: "furniture", pivot: "base-center" },
    build: () => {
      const group = new Group();
      const shaft = new Mesh(coloredGeometry(new CylinderGeometry(0.044, 0.061, 3.21, 10), "darkGray"), materials.M_palette);
      shaft.position.y = 1.71;
      group.add(
        shaft,
        boxCenter([0.29, 0.12, 0.25], "darkGray", [0, 0.06, 0], 0.022),
        boxCenter([0.14, 0.12, 0.14], "gray", [0, 0.31, 0], 0.015),
        boxCenter([0.35, 0.047, 0.086], "darkGray", [0, 2.68, 0], 0.012),
        boxCenter([0.37, 0.046, 0.083], "gray", [0, 3.21, 0], 0.012),
      );
      for (const side of [-1, 1]) {
        const x = side * 0.129;
        group.add(
          boxCenter([0.068, 0.62, 0.079], "darkGray", [x, 2.94, 0], 0.012),
          boxCenter([0.036, 0.47, 0.021], "cyan", [x, 2.94, 0.041], 0.006),
          boxCenter([0.034, 0.47, 0.021], "cyan", [x, 2.94, -0.041], 0.006),
        );
      }
      return fusedParts("Recessed twin lenses on a street mast", group, true);
    },
  });
}
