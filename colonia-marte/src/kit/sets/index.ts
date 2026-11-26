import { Group } from "three";
import type { PieceRegistry } from "../registry";

export interface DiningSetOptions {
  compact?: boolean;
  cushion?: "blue" | "teal";
  lanternTone?: "warm" | "cyan";
}

/** Canteen table grouped with four inward-facing chairs and a table lantern. */
export function buildDiningTableSet(
  registry: PieceRegistry,
  options: DiningSetOptions = {},
): Group {
  const group = new Group();
  group.name = "set_dining_table";
  const compact = options.compact ?? false;
  const cushion = options.cushion ?? "blue";
  const table = registry.build("DN-01", { size: compact ? "compact" : "standard" });
  group.add(table);

  const dx = compact ? 0.32 : 0.44;
  for (const [x, z, rotY] of [
    [-dx, -0.72, 0],
    [dx, -0.72, 0],
    [-dx, 0.72, Math.PI],
    [dx, 0.72, Math.PI],
  ]) {
    const chair = registry.build("DN-02", { cushion });
    chair.position.set(x, 0, z);
    chair.rotation.y = rotY;
    group.add(chair);
  }

  const lantern = registry.build("DN-06", { tone: options.lanternTone ?? "warm" });
  lantern.position.set(compact ? 0.36 : 0.52, 0.78, 0);
  group.add(lantern);
  return group;
}

/** Illuminated octagonal planter populated with a seeded low-poly plant. */
export function buildPlanterSet(
  registry: PieceRegistry,
  seed = 1,
  style: "octagonal" | "compact" = "octagonal",
): Group {
  const group = new Group();
  group.name = "set_planter";
  const pot = registry.build("PR-02", { style });
  const plant = registry.build("PR-01", {
    seed,
    fullness: style === "octagonal" ? "lush" : "standard",
  });
  plant.position.y = 0.36;
  group.add(pot, plant);
  return group;
}

export interface HydroponicSetOptions {
  powered?: boolean;
  stage?: "seed" | "sprout" | "plant" | "harvest";
  seed?: number;
}

/** Three-level hydroponic rack populated with six NX-05 crop cassettes. */
export function buildHydroponicRackSet(
  registry: PieceRegistry,
  options: HydroponicSetOptions = {},
): Group {
  const group = new Group();
  group.name = "set_hydroponic_rack";
  const powered = options.powered ?? true;
  const stage = options.stage ?? "harvest";
  const baseSeed = options.seed ?? 1;
  group.add(registry.build("NW-02-A", { powered }));

  const cropCycle: ("lettuce" | "tomato" | "potato")[] = ["lettuce", "tomato", "potato"];
  const shelfHeights = [0.31, 0.95, 1.59];
  let idx = 0;
  for (let tier = 0; tier < shelfHeights.length; tier++) {
    for (const x of [-0.42, 0.42]) {
      const tray = registry.build("NX-05", {
        crop: cropCycle[(tier + idx) % cropCycle.length],
        stage,
        seed: baseSeed + idx * 5,
      });
      tray.position.set(x, shelfHeights[tier], 0);
      group.add(tray);
      idx++;
    }
  }
  return group;
}
