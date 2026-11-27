import { Group, IcosahedronGeometry, Mesh, Vector3 } from "three";
import { materials } from "../../../materials/shared";
import { coloredGeometry } from "../../../materials/uv";
import type { PieceRegistry } from "../../registry";
import { boxCenter } from "../station/helpers";
import { cleanGeodesicDome } from "./buildings";
import { horizontalBand, registerColonyBuilding, type ColonyBuildingDetail } from "./colony-building-details";
import { beam, fusedParts, location, pipe, repeatMesh } from "./transit-details";

const radius = 3.36;
const spring = 0.70;

function biodomeTree(detail: ColonyBuildingDetail) {
  const tree = new Group(), wood = new Group();
  tree.name = "Biodome tree";
  const floor = 0.85;
  wood.add(pipe([[0, floor, 0], [-0.09, 1.54, 0.03], [0.04, 2.22, -0.08], [0.13, 2.95, -0.09]], 0.13, 7, "regolithShade"));
  const branchCount = detail === "near" ? 11 : detail === "middle" ? 8 : 5;
  const crowns = [[], []] as ReturnType<typeof location>[][];
  for (let i = 0; i < branchCount; i++) {
    const angle = i * 2.39996, t = i / branchCount;
    const reach = 1.23 - 0.66 * t;
    const x = Math.cos(angle) * reach, z = Math.sin(angle) * reach;
    const y = 2.23 + 0.77 * t;
    wood.add(pipe([[0.025, 1.49 + 0.97 * t, 0], [x * 0.54, y - 0.26, z * 0.55], [x, y, z]],
      0.072 - 0.032 * t, 5, "regolithShade"));
    const canopy = location(x, y + 0.07, z);
    canopy.rotation.set(i * 0.51, angle, i * 0.4);
    canopy.scale.set(0.64 - 0.1 * t, 0.42, 0.52 + (i % 3) * 0.04);
    crowns[i % 2].push(canopy);
  }
  const crown = location(0.16, 3.02, -0.12);
  crown.scale.set(0.55, 0.42, 0.58);
  crowns[0].push(crown);
  tree.add(fusedParts("Tree trunk and branches", wood));
  for (const [index, tone] of (["leaf", "leafDark"] as const).entries()) {
    const raw = new IcosahedronGeometry(1, detail === "far" ? 0 : 1);
    const leaf = new Mesh(coloredGeometry(raw, tone, { weld: true }), materials.M_palette);
    raw.dispose();
    tree.add(repeatMesh(leaf, `Layered foliage ${tone}`, crowns[index]));
  }
  return tree;
}

function buildBiodome(detail: ColonyBuildingDetail) {
  const building = new Group(), base = new Group();
  const ribs = detail === "near" ? 12 : detail === "middle" ? 8 : 6;
  const panels = detail === "far" ? 12 : 20;
  base.add(
    horizontalBand(3.48, 0.34, 0.37, panels, "darkGray"),
    horizontalBand(3.45, 0.27, 0.60, panels, "gray", 3.1),
    horizontalBand(3.20, 0.12, 0.71, panels, "gray"),
    horizontalBand(1.43, 0.18, 0.78, panels, "darkGray", 1.22),
    horizontalBand(1.24, 0.13, 0.78, panels, "oxide"),
    boxCenter([1.34, 1.76, 0.65], "hull", [0, 1.12, 3.30], 0.09),
    boxCenter([1.06, 1.44, 0.20], "darkGray", [0, 1.12, 3.65], 0.055),
    boxCenter([0.84, 0.055, 0.060], "cyan", [0, 1.86, 3.76], 0.014),
    boxCenter([1.48, 0.21, 0.83], "gray", [0, 0.11, 3.49], 0.05),
  );
  for (let i = 0; i < 8; i++) {
    const angle = (i + 0.5) * Math.PI / 4;
    const x = Math.cos(angle), z = Math.sin(angle);
    base.add(beam([x * 3.11, 0.40, z * 3.11], [x * 3.56, 0.13, z * 3.56], 0.19, "hull"));
    const foot = boxCenter([0.38, 0.105, 0.34], "darkGray", [x * 3.55, 0.053, z * 3.55], 0.028);
    foot.rotation.y = -angle;
    base.add(foot);
  }
  const strata = detail === "near" ? 6 : detail === "middle" ? 5 : 4;
  const meridians = [];
  const vertical = new Vector3(0, 1, 0);
  for (let rib = 0; rib < ribs; rib++) {
    const azimuth = (rib + 0.5) * 2 * Math.PI / ribs;
    const point = (step: number) => {
      const angle = step * Math.PI / 2 / strata;
      return new Vector3(Math.cos(azimuth) * Math.cos(angle) * radius, spring + Math.sin(angle) * radius,
        Math.sin(azimuth) * Math.cos(angle) * radius);
    };
    for (let step = 0; step < strata; step++) {
      const a = point(step), b = point(step + 1), center = a.clone().lerp(b, 0.5);
      const axis = b.sub(a);
      const transform = location(center.x, center.y, center.z);
      transform.scale.y = axis.length() + 0.025;
      transform.quaternion.setFromUnitVectors(vertical, axis.normalize());
      meridians.push(transform);
    }
  }
  const glazedShell = new Mesh(cleanGeodesicDome(radius - 0.045, detail === "far" ? 1 : 2), materials.M_glass);
  glazedShell.name = "Biodome glazing";
  glazedShell.position.y = spring;
  building.add(fusedParts("Biodome plinth and entrance", base, detail === "near", [
    repeatMesh(boxCenter([0.073, 1, 0.073], "ice", [0, 0, 0], 0.014), "Biodome meridians", meridians),
  ]), glazedShell, biodomeTree(detail));
  return building;
}

export function registerBiodome(registry: PieceRegistry): void {
  registerColonyBuilding(registry, "MB-06", buildBiodome);
}
