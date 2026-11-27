import { Group } from "three";
import type { PieceRegistry } from "../../registry";
import { alignBaseCenter, boxCenter, parseChoice, parseRecord } from "../station/helpers";
import { fusedParts } from "./transit-details";

export const AIRLOCK_ENTRY_LODS = ["near", "middle", "far"] as const;
type EntryDetail = typeof AIRLOCK_ENTRY_LODS[number];

function pressureCollar(detail: EntryDetail, principal: boolean) {
  const shell = new Group();
  shell.add(
    boxCenter([2.50, 0.27, 2.47], "darkGray", [0, 0.135, -0.06], 0.045),
    boxCenter([2.50, 0.31, 1.94], "offWhite", [0, 2.82, -0.26], 0.054),
    boxCenter([2.18, 0.10, 0.56], "gray", [0, 0.05, 1.26], 0.022),
  );
  for (const side of [-1, 1]) {
    shell.add(
      boxCenter([0.33, 2.49, 1.95], "offWhite", [side * 1.09, 1.50, -0.27], 0.054),
      boxCenter([0.13, 2.59, 0.20], "darkGray", [side * 0.96, 1.50, 0.54], 0.022),
    );
    if (detail === "far") continue;
    shell.add(
      boxCenter([0.28, 2.62, 0.28], "hull", [side * 1.11, 1.53, 0.65], 0.038),
      boxCenter([0.25, 0.093, 0.048], "cyan", [side * 1.11, 2.24, 0.793]),
    );
    if (detail === "near") {
      for (const y of [0.66, 1.14, 1.62]) {
        shell.add(boxCenter([0.050, 0.34, 0.80], "hull", [side * 1.247, y, -0.16], 0.020));
      }
      shell.add(boxCenter([0.19, 0.37, 0.058], "gray", [side * 1.10, 1.28, 0.795], 0.014));
    }
  }
  if (detail !== "far") {
    shell.add(boxCenter([1.84, 0.15, 0.14], "darkGray", [0, 2.74, 0.646], 0.022));
  }
  if (principal) {
    shell.add(
      boxCenter([1.56, 0.23, 0.09], "darkGray", [0, 2.82, 0.75], 0.025),
      boxCenter([1.32, 0.064, 0.025], "cyan", [0, 2.83, 0.805]),
    );
  }
  return fusedParts("Pressure collar", shell, detail === "near");
}

export function registerAirlockEntry(registry: PieceRegistry): void {
  registry.register<{ detail: EntryDetail; principal: boolean }>("NX-04", {
    parse: input => {
      const { detail, principal } = parseRecord(input, ["detail", "principal"]);
      if (principal !== undefined && typeof principal !== "boolean") throw new Error("principal must be a boolean");
      return { detail: parseChoice(detail, AIRLOCK_ENTRY_LODS, "near"), principal: principal ?? false };
    },
    variants: { standard: { detail: "near", principal: false }, principal: { detail: "near", principal: true } },
    metadata: { category: "largeFurniture", pivot: "base-center" },
    build: ({ detail, principal }) => {
      const entry = new Group();
      const hatch = registry.build("NW-05-A", { state: "sealed" });
      hatch.position.set(0, 0.22, 0.40);
      entry.add(pressureCollar(detail, principal), hatch);
      return alignBaseCenter(entry);
    },
  });
}
