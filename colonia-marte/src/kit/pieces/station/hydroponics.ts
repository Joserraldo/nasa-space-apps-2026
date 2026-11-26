import { Group, Mesh } from "three";
import { pipeRun, polygonShape } from "../../primitives";
import type { PieceRegistry } from "../../registry";
import { materials } from "../../../materials/shared";
import { coloredGeometry } from "../../../materials/uv";
import {
  alignBaseCenter, boostVertexLuminance, boxAt, createRng, extrudedMesh, parseChoice, parseRecord, parseSeed,
  weldedColoredGeometry, type PaletteKey,
} from "./helpers";
import { broadLeafGeometry } from "./props";

const crops = ["lettuce", "tomato", "potato"] as const;
type CropKind = typeof crops[number];

const growthSizes = ["small", "medium", "large"] as const;
type GrowthSize = typeof growthSizes[number];

const campaignStages = ["seed", "sprout", "plant", "harvest"] as const;
type CampaignStage = typeof campaignStages[number];

interface RackParams { powered: boolean }
function parseRack(input: unknown): RackParams {
  const rec = parseRecord(input, ["powered"]);
  if (rec.powered !== undefined && typeof rec.powered !== "boolean") {
    throw new Error("powered must be a boolean");
  }
  return { powered: (rec.powered as boolean | undefined) ?? true };
}

interface CropParams { crop: CropKind; size: GrowthSize; seed: number }
function parseCrop(input: unknown): CropParams {
  const rec = parseRecord(input, ["crop", "size", "seed"]);
  return {
    crop: parseChoice(rec.crop, crops, "lettuce"),
    size: parseChoice(rec.size, growthSizes, "medium"),
    seed: parseSeed(rec.seed, 1),
  };
}

interface StagedCropParams { crop: CropKind; stage: CampaignStage; seed: number }
function parseStagedCrop(input: unknown): StagedCropParams {
  const rec = parseRecord(input, ["crop", "stage", "seed"]);
  return {
    crop: parseChoice(rec.crop, crops, "tomato"),
    stage: parseChoice(rec.stage, campaignStages, "plant"),
    seed: parseSeed(rec.seed, 1),
  };
}

function addPlantCell(
  group: Group,
  crop: CropKind,
  stage: CampaignStage,
  x: number,
  z: number,
  rng: () => number,
): void {
  const plug = extrudedMesh(polygonShape(0.075, 6), 0.04, 0.007, "oxide", [x, 0.06, z]);
  plug.rotation.x = -Math.PI / 2;
  group.add(plug);
  if (stage === "seed") return;

  const leafCount = stage === "sprout" ? 2 : stage === "plant" ? 4 : 4;
  const scaleBase = stage === "sprout" ? 0.34 : stage === "plant" ? 0.64 : 0.84;
  const blade = broadLeafGeometry(
    crop === "lettuce" ? 0.28 : 0.34,
    crop === "lettuce" ? 0.14 : 0.11,
    0.09,
  );

  for (let i = 0; i < leafCount; i++) {
    const leafColor: PaletteKey = i % 2 === 0 ? "leaf" : "leafDark";
    const leaf = new Mesh(coloredGeometry(blade, leafColor), materials.M_palette);
    const angle = (i / leafCount) * Math.PI * 2 + rng() * 0.35;
    const tilt = (crop === "lettuce" ? 0.55 : 0.42) + (i % 3) * 0.14;
    const yLift = crop === "tomato" && stage !== "sprout" ? 0.09 + (i % 2) * 0.05 : 0.08;
    leaf.position.set(x, yLift, z);
    leaf.rotation.set(tilt, angle, 0, "YXZ");
    leaf.scale.setScalar(scaleBase * (0.88 + rng() * 0.22));
    group.add(leaf);
  }

  if (stage === "harvest") {
    const fruitColor: PaletteKey = crop === "tomato"
      ? "red"
      : crop === "potato" ? "yellow" : "leaf";
    const fruit = extrudedMesh(polygonShape(0.042, 5), 0.055, 0.009, fruitColor, [x, 0.16, z]);
    fruit.rotation.x = -Math.PI / 2;
    group.add(fruit);
  }
}

function buildCropTray(crop: CropKind, stage: CampaignStage, seed: number): Group {
  const group = new Group();
  const rng = createRng(seed);
  // Modular 0.52 x 0.36m hydroponic cultivation cassette tray.
  group.add(boxAt([0.52, 0.05, 0.36], "gray", [0, 0, 0], 0.01, ["bottom"]));
  group.add(boxAt([0.46, 0.02, 0.3], "black", [0, 0.04, 0], 0.005, ["bottom"]));
  const statusColor: PaletteKey = stage === "harvest" ? "doorOpen" : "cyan";
  group.add(boxAt([0.14, 0.022, 0.022], statusColor, [0, 0.028, 0.182], 0.005));

  for (const x of [-0.13, 0.13]) {
    addPlantCell(group, crop, stage, x, 0, rng);
  }
  return alignBaseCenter(group);
}

export function registerHydroponicPieces(registry: PieceRegistry): void {
  registry.register<RackParams>("NW-02-A", {
    parse: parseRack,
    variants: {
      powered: { powered: true },
      unpowered: { powered: false },
    },
    metadata: { category: "furniture", pivot: "base-center" },
    build: ({ powered }) => {
      const group = new Group();
      const lightColor: PaletteKey = powered ? "growLight" : "darkGray";
      const width = 1.76;
      const depth = 0.74;
      // Dark structural plinth with glowing cyan floor-graze strips + corner uprights + top frame.
      group.add(boxAt([width, 0.09, depth], "black", [0, 0, 0], 0.016, ["bottom"]));
      for (const zSign of [-1, 1]) {
        group.add(boxAt([1.54, 0.038, 0.042], "cyan", [0, 0.024, zSign * 0.36], 0.005));
      }
      for (const x of [-0.82, 0.82]) {
        for (const z of [-0.31, 0.31]) {
          group.add(boxAt([0.085, 2.02, 0.085], "darkGray", [x, 0.08, z], 0.012, ["bottom"]));
        }
        group.add(boxAt([0.034, 1.84, 0.032], "cyan", [x, 0.16, 0.355], 0.005));
      }
      group.add(boxAt([width, 0.09, depth], "white", [0, 2.08, 0], 0.018));

      // Three hydroponic nutrient trays with black liners and overhead grow-light bars.
      for (const y of [0.22, 0.86, 1.5]) {
        group.add(boxAt([1.58, 0.09, 0.66], "white", [0, y, 0], 0.016));
        group.add(boxAt([1.46, 0.032, 0.54], "black", [0, y + 0.075, 0], 0.006, ["bottom"]));
        group.add(boxAt([1.5, 0.055, 0.2], "black", [0, y + 0.49, 0], 0.01));
        const bar = boxAt([1.4, 0.032, 0.11], lightColor, [0, y + 0.466, 0], 0.006);
        if (powered) bar.geometry = boostVertexLuminance(bar.geometry, [1.85, 0.92, 1.65]);
        group.add(bar);
      }

      // Nutrient supply manifold with cyan collar ring along the side of the rack.
      const pipe = new Mesh(
        weldedColoredGeometry(pipeRun([[0.87, 0.14, 0], [0.91, 1.05, 0], [0.87, 1.96, 0]], 0.03, 8), "teal"),
        materials.M_palette,
      );
      const pipeRing = extrudedMesh(polygonShape(0.052, 8), 0.06, 0.008, "cyan", [0.91, 1.05, 0]);
      pipeRing.rotation.x = -Math.PI / 2;
      group.add(pipe, pipeRing);
      return alignBaseCenter(group);
    },
  });

  registry.register<CropParams>("NW-02-B", {
    parse: parseCrop,
    variants: {
      lettuce: { crop: "lettuce", size: "medium", seed: 1 },
      tomato: { crop: "tomato", size: "large", seed: 2 },
      potato: { crop: "potato", size: "medium", seed: 3 },
      smallLettuce: { crop: "lettuce", size: "small", seed: 4 },
    },
    metadata: { category: "prop", pivot: "base-center" },
    build: ({ crop, size, seed }) => {
      const stage: CampaignStage = size === "small"
        ? "sprout"
        : size === "medium" ? "plant" : "harvest";
      return buildCropTray(crop, stage, seed);
    },
  });

  registry.register<StagedCropParams>("NX-05", {
    parse: parseStagedCrop,
    variants: {
      seed: { crop: "tomato", stage: "seed", seed: 1 },
      sprout: { crop: "tomato", stage: "sprout", seed: 2 },
      plant: { crop: "tomato", stage: "plant", seed: 3 },
      harvest: { crop: "tomato", stage: "harvest", seed: 4 },
    },
    metadata: { category: "prop", pivot: "base-center" },
    build: ({ crop, stage, seed }) => buildCropTray(crop, stage, seed),
  });
}
