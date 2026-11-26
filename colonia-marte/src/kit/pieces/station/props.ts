import {
  BufferGeometry, Float32BufferAttribute, Group, Mesh, Vector3,
} from "three";
import { polygonRing, polygonShape } from "../../primitives";
import { cachedGeometry } from "../../primitives/cache";
import { finishGeometry } from "../../primitives/normals";
import type { PieceRegistry } from "../../registry";
import { screenTypes, type ScreenType } from "../../../materials/screens";
import { materials } from "../../../materials/shared";
import { coloredGeometry } from "../../../materials/uv";
import {
  alignBaseCenter, boxAt, createRng, extrudedMesh, parseChoice, parseRecord, parseSeed, screenMesh,
} from "./helpers";

/** Creased, folded low-poly broad leaf blade extending along +Y and arching toward +Z. */
export function broadLeafGeometry(length = 0.42, width = 0.14, arch = 0.1): BufferGeometry {
  return cachedGeometry(["broadLeaf", length, width, arch], () => {
    const p = {
      baseL: new Vector3(-width * 0.18, 0, 0),
      baseR: new Vector3(width * 0.18, 0, 0),
      midSpine: new Vector3(0, length * 0.48, arch * 0.45),
      midL: new Vector3(-width * 0.5, length * 0.46, arch * 0.22),
      midR: new Vector3(width * 0.5, length * 0.46, arch * 0.22),
      tip: new Vector3(0, length, arch),
      backSpine: new Vector3(0, length * 0.48, arch * 0.36),
      baseBack: new Vector3(0, 0, -0.014),
    };
    const tris: [Vector3, Vector3, Vector3][] = [
      // Upper folded leaf surface (2 facets per half).
      [p.baseL, p.midSpine, p.midL],
      [p.midL, p.midSpine, p.tip],
      [p.baseR, p.midR, p.midSpine],
      [p.midSpine, p.midR, p.tip],
      [p.baseL, p.baseR, p.midSpine],
      // Underside facets so leaves have clean solid thickness from all angles.
      [p.baseBack, p.midL, p.backSpine],
      [p.backSpine, p.midL, p.tip],
      [p.baseBack, p.backSpine, p.midR],
      [p.backSpine, p.tip, p.midR],
      [p.baseL, p.baseBack, p.baseR],
      [p.baseBack, p.baseL, p.midL],
      [p.baseR, p.baseBack, p.midR],
    ];

    const positions: number[] = [];
    const normals: number[] = [];
    for (const [a, b, c] of tris) {
      const normal = b.clone().sub(a).cross(c.clone().sub(a)).normalize();
      for (const v of [a, b, c]) {
        positions.push(v.x, v.y, v.z);
        normals.push(normal.x, normal.y, normal.z);
      }
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    geometry.setAttribute("normal", new Float32BufferAttribute(normals, 3));
    return finishGeometry(geometry);
  });
}

const plantSizes = ["standard", "lush"] as const;
interface PlantParams { seed: number; fullness: typeof plantSizes[number] }

function parsePlant(input: unknown): PlantParams {
  const rec = parseRecord(input, ["seed", "fullness"]);
  return {
    seed: parseSeed(rec.seed, 1),
    fullness: parseChoice(rec.fullness, plantSizes, "standard"),
  };
}

const planterStyles = ["octagonal", "compact"] as const;
interface PlanterParams { style: typeof planterStyles[number] }

function parsePlanter(input: unknown): PlanterParams {
  const rec = parseRecord(input, ["style"]);
  return { style: parseChoice(rec.style, planterStyles, "octagonal") };
}

interface ScreenPropParams { screen: ScreenType; mount: "stand" | "wall" }
function parseScreenProp(input: unknown): ScreenPropParams {
  const rec = parseRecord(input, ["screen", "mount"]);
  return {
    screen: parseChoice(rec.screen, screenTypes, "colony-map"),
    mount: parseChoice(rec.mount, ["stand", "wall"] as const, "stand"),
  };
}

export function registerStationProps(registry: PieceRegistry): void {
  registry.register<PlantParams>("PR-01", {
    parse: parsePlant,
    variants: {
      standard: { seed: 1, fullness: "standard" },
      lush: { seed: 5, fullness: "lush" },
    },
    metadata: { category: "prop", pivot: "base-center" },
    build: ({ seed, fullness }) => {
      const group = new Group();
      const rng = createRng(seed);
      const count = fullness === "lush" ? 13 : 9;
      // Central root collar resting on Y=0.
      const collar = extrudedMesh(polygonShape(0.08, 6), 0.05, 0.008, "oxide", [0, 0.025, 0]);
      collar.rotation.x = -Math.PI / 2;
      group.add(collar);

      const blade = broadLeafGeometry(0.44, 0.15, 0.12);
      const goldenAngle = 2.399963;
      for (let i = 0; i < count; i++) {
        const color = i % 2 === 0 ? "leaf" : "leafDark";
        const mesh = new Mesh(coloredGeometry(blade, color), materials.M_palette);
        const tier = i / count;
        const tilt = 0.28 + tier * 0.62 + (rng() - 0.5) * 0.1;
        const azimuth = i * goldenAngle + (rng() - 0.5) * 0.18;
        const scale = 0.72 + (1 - tier * 0.35) * 0.36;
        mesh.position.y = 0.03;
        mesh.rotation.set(tilt, azimuth, 0, "YXZ");
        mesh.scale.setScalar(scale);
        group.add(mesh);
      }
      return alignBaseCenter(group);
    },
  });

  registry.register<PlanterParams>("PR-02", {
    parse: parsePlanter,
    variants: {
      octagonal: { style: "octagonal" },
      compact: { style: "compact" },
    },
    metadata: { category: "prop", pivot: "base-center" },
    build: ({ style }) => {
      const group = new Group();
      const r = style === "octagonal" ? 0.42 : 0.32;
      const base = extrudedMesh(polygonShape(r * 0.86, 8), 0.07, 0.012, "darkGray", [0, 0.035, 0]);
      base.rotation.x = -Math.PI / 2;
      const ledBand = extrudedMesh(polygonShape(r * 0.94, 8), 0.05, 0.008, "cyan", [0, 0.095, 0]);
      ledBand.rotation.x = -Math.PI / 2;
      const body = extrudedMesh(polygonShape(r, 8), 0.22, 0.02, "white", [0, 0.23, 0]);
      body.rotation.x = -Math.PI / 2;
      const rim = extrudedMesh(polygonRing(r * 1.03, r * 0.78, 8), 0.08, 0.012, "white", [0, 0.38, 0]);
      rim.rotation.x = -Math.PI / 2;
      const soil = extrudedMesh(polygonShape(r * 0.79, 8), 0.04, 0.008, "oxide", [0, 0.35, 0]);
      soil.rotation.x = -Math.PI / 2;
      group.add(base, ledBand, body, rim, soil);
      return alignBaseCenter(group);
    },
  });

  registry.register<ScreenPropParams>("PR-05", {
    parse: parseScreenProp,
    variants: {
      colonyMap: { screen: "colony-map", mount: "stand" },
      communications: { screen: "communications", mount: "stand" },
      energy: { screen: "energy", mount: "wall" },
      solarAlert: { screen: "solar-alert", mount: "wall" },
    },
    metadata: { category: "prop", pivot: "base-center" },
    build: ({ screen, mount }) => {
      const group = new Group();
      const yOffset = mount === "stand" ? 0.16 : 0;
      if (mount === "stand") {
        group.add(boxAt([0.46, 0.04, 0.24], "darkGray", [0, 0, 0], 0.01, ["bottom"]));
        group.add(boxAt([0.12, 0.12, 0.08], "gray", [0, 0.04, 0], 0.012, ["bottom"]));
      }
      group.add(boxAt([0.96, 0.58, 0.07], "black", [0, yOffset, 0], 0.018));
      for (const x of [-0.45, 0.45]) {
        group.add(boxAt([0.025, 0.42, 0.025], "cyan", [x, yOffset + 0.08, 0.036], 0.005));
      }
      const ui = screenMesh(0.84, 0.48, screen);
      ui.position.set(0, yOffset + 0.29, 0.038);
      group.add(ui);
      return alignBaseCenter(group);
    },
  });
}
