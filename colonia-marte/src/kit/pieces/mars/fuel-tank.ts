import { Group } from "three";
import type { PieceRegistry } from "../../registry";
import { alignBaseCenter, boxCenter, parseRecord, type PaletteKey } from "../station/helpers";
import { axialProfile } from "./transit";
import { fusedParts, pipe } from "./transit-details";

function horizontalProfile(profile: Parameters<typeof axialProfile>[0], color: PaletteKey, x = 0) {
  return axialProfile(profile, 24, color, x, 1.46);
}

export function registerFuelTank(registry: PieceRegistry): void {
  registry.register("MI-10", {
    parse: input => parseRecord(input, []),
    variants: { standard: {} },
    metadata: { category: "furniture", pivot: "base-center" },
    build: () => {
      const group = new Group();
      group.add(horizontalProfile([
        [0, -2.9], [0.51, -2.81], [0.82, -2.54], [0.96, -2.21],
        [0.96, 2.21], [0.82, 2.54], [0.51, 2.81], [0, 2.9],
      ], "darkGray"));
      for (const x of [-1.45, 1.45]) {
        group.add(horizontalProfile([
          [0.957, -0.17], [1, -0.14], [1.018, -0.10], [1.018, 0.10], [1, 0.14], [0.957, 0.17],
        ], "ice", x));
        group.add(
          boxCenter([0.65, 0.18, 2.22], "darkGray", [x, 0.09, 0], 0.045),
          boxCenter([0.46, 0.5, 1.57], "gray", [x, 0.36, 0], 0.075),
        );
        for (const side of [-1, 1]) {
          group.add(boxCenter([0.38, 0.085, 0.09], "gray", [x, 0.159, side * 1.07], 0.012));
        }
      }
      group.add(
        pipe([[2.5, 1.46, 0], [3.06, 1.46, 0], [3.19, 1.3, 0], [3.19, 0.77, 0.16]], 0.07, 5, "gray"),
        boxCenter([0.46, 0.38, 0.24], "darkGray", [0.55, 1.5, 0.98], 0.035),
        boxCenter([0.29, 0.11, 0.025], "cyan", [0.55, 1.54, 1.11], 0.009),
        boxCenter([0.24, 0.13, 0.26], "gray", [3.19, 0.75, 0.16], 0.02),
      );
      return alignBaseCenter(fusedParts("Pressure shell and saddle feet", group, true));
    },
  });
}
