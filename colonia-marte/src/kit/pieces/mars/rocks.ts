import { Group, Mesh, type BufferGeometry } from "three";
import { extrudeProfile } from "../../primitives";
import type { PieceRegistry } from "../../registry";
import { materials } from "../../../materials/shared";
import { coloredGeometry } from "../../../materials/uv";
import { boostVertexLuminance, createRng, parseChoice, parseRecord, parseSeed } from "../station/helpers";

function garnetRockGeometry(geo: BufferGeometry): BufferGeometry {
  return boostVertexLuminance(coloredGeometry(geo, "oxide"), [0.70, 0.64, 0.66]);
}
import {
  boulderGeometry, centerOnGround, irregularCapShape, stratifiedRockGeometry,
} from "./terrain-geometry";

const biomes = ["jezero", "polar"] as const;
type Biome = typeof biomes[number];

interface HoodooParams { seed: number; biome: Biome; scale: "standard" | "tall" }
function parseHoodoo(input: unknown): HoodooParams {
  const rec = parseRecord(input, ["seed", "biome", "scale"]);
  return {
    seed: parseSeed(rec.seed, 1),
    biome: parseChoice(rec.biome, biomes, "jezero"),
    scale: parseChoice(rec.scale, ["standard", "tall"] as const, "standard"),
  };
}

interface RockParams { seed: number; biome: Biome; formation: "single" | "cluster" }
function parseRocks(input: unknown): RockParams {
  const rec = parseRecord(input, ["seed", "biome", "formation"]);
  return {
    seed: parseSeed(rec.seed, 1),
    biome: parseChoice(rec.biome, biomes, "jezero"),
    formation: parseChoice(rec.formation, ["single", "cluster"] as const, "single"),
  };
}

interface MesaParams { seed: number; biome: Biome }
function parseMesa(input: unknown): MesaParams {
  const rec = parseRecord(input, ["seed", "biome"]);
  return {
    seed: parseSeed(rec.seed, 1),
    biome: parseChoice(rec.biome, biomes, "jezero"),
  };
}

export function registerMarsRocks(registry: PieceRegistry): void {
  registry.register<HoodooParams>("MT-T04", {
    parse: parseHoodoo,
    variants: {
      jezero: { seed: 1, biome: "jezero", scale: "standard" },
      tallJezero: { seed: 4, biome: "jezero", scale: "tall" },
      polarCap: { seed: 2, biome: "polar", scale: "standard" },
    },
    metadata: { category: "terrain", pivot: "base-center" },
    build: ({ seed, biome, scale }) => {
      const group = new Group();
      const totalH = scale === "tall" ? 4.4 : 3.2;
      const profile: [number, number][] = [
        [0, 1.0], [0.28, 0.74], [0.54, 0.86], [0.8, 0.62], [0.96, 0.48], [1, 0.22],
      ];
      const mainGeo = stratifiedRockGeometry("hoodoo", seed, 0.95, totalH, 10, profile, 0.18);
      group.add(new Mesh(garnetRockGeometry(mainGeo), materials.M_palette));

      const spurGeo = boulderGeometry(seed + 17, 0.62, 1.35, 1);
      const spur = new Mesh(garnetRockGeometry(spurGeo), materials.M_palette);
      spur.position.set(0.55, 0, 0.28);
      group.add(spur);

      if (biome === "polar") {
        // Hard-edged polar ice cap only in polar biome (INVENTARIO 7.1).
        const crown = new Mesh(
          coloredGeometry(boulderGeometry(seed + 31, 0.56, 0.62, 1), "ice"),
          materials.M_palette,
        );
        crown.position.set(0, totalH * 0.86, 0);
        const ledgeShape = irregularCapShape(seed + 41, 0.46, 8, 0.12);
        const ledgeIce = new Mesh(
          coloredGeometry(extrudeProfile(ledgeShape, 0.14, 0.02), "ice"),
          materials.M_palette,
        );
        ledgeIce.rotation.x = -Math.PI / 2;
        ledgeIce.position.set(0.52, 0.74, 0.26);
        group.add(crown, ledgeIce);
      }
      return centerOnGround(group);
    },
  });

  registry.register<RockParams>("MT-T05", {
    parse: parseRocks,
    variants: {
      single: { seed: 1, biome: "jezero", formation: "single" },
      cluster: { seed: 3, biome: "jezero", formation: "cluster" },
      polar: { seed: 5, biome: "polar", formation: "cluster" },
    },
    metadata: { category: "terrain", pivot: "base-center" },
    build: ({ seed, biome, formation }) => {
      const group = new Group();
      const primary = new Mesh(
        garnetRockGeometry(boulderGeometry(seed, 0.55, 0.72, 1)),
        materials.M_palette,
      );
      group.add(primary);

      if (formation === "cluster") {
        const rng = createRng(seed + 100);
        for (let i = 0; i < 2; i++) {
          const angle = i * 2.2 + rng() * 0.6;
          const dist = 0.52 + rng() * 0.18;
          const pebble = new Mesh(
            garnetRockGeometry(boulderGeometry(seed + 11 + i * 7, 0.32 + i * 0.06, 0.68, 1)),
            materials.M_palette,
          );
          pebble.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
          pebble.rotation.y = rng() * Math.PI;
          group.add(pebble);
        }
      }

      if (biome === "polar") {
        const frost = new Mesh(
          coloredGeometry(boulderGeometry(seed + 53, 0.42, 0.36, 1), "ice"),
          materials.M_palette,
        );
        frost.position.set(0.03, 0.27, -0.02);
        group.add(frost);
      }
      return centerOnGround(group);
    },
  });

  registry.register<MesaParams>("MT-T06", {
    parse: parseMesa,
    variants: {
      jezero: { seed: 1, biome: "jezero" },
      polar: { seed: 2, biome: "polar" },
    },
    metadata: { category: "terrain", pivot: "base-center" },
    build: ({ seed, biome }) => {
      const group = new Group();
      const profile: [number, number][] = [
        [0, 1.08], [0.35, 0.98], [0.78, 0.92], [0.97, 0.86], [1, 0.78],
      ];
      const cliffGeo = stratifiedRockGeometry("mesa", seed, 3.2, 1.65, 16, profile, 0.1);
      group.add(new Mesh(garnetRockGeometry(cliffGeo), materials.M_palette));

      const terrace = new Mesh(
        garnetRockGeometry(boulderGeometry(seed + 19, 1.35, 0.58, 1)),
        materials.M_palette,
      );
      terrace.position.set(2.35, 0, 0.9);
      group.add(terrace);

      if (biome === "polar") {
        const snowCapShape = irregularCapShape(seed + 71, 2.58, 14, 0.09);
        const snowCap = new Mesh(
          coloredGeometry(extrudeProfile(snowCapShape, 0.2, 0.035), "ice"),
          materials.M_palette,
        );
        snowCap.rotation.x = -Math.PI / 2;
        snowCap.position.set(0, 1.62, 0);
        group.add(snowCap);
      } else {
        const rimRock = new Mesh(
          garnetRockGeometry(boulderGeometry(seed + 83, 0.58, 0.55, 1)),
          materials.M_palette,
        );
        rimRock.position.set(-1.2, 1.48, 0.65);
        group.add(rimRock);
      }
      return centerOnGround(group);
    },
  });
}
