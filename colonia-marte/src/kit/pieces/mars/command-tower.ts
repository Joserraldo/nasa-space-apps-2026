import { CylinderGeometry, Group, LatheGeometry, Mesh, Vector2 } from "three";
import type { PieceRegistry } from "../../registry";
import { materials } from "../../../materials/shared";
import { coloredGeometry } from "../../../materials/uv";
import { boxCenter } from "../station/helpers";
import { horizontalBand, registerColonyBuilding, type ColonyBuildingDetail } from "./colony-building-details";
import { beam, fusedParts, location, repeatMesh } from "./transit-details";

function buildCommandTower(detail: ColonyBuildingDetail) {
  const group = new Group();
  const sides = detail === "near" ? 32 : detail === "middle" ? 20 : 12;
  const radius = 3.11;
  const glazing = new Mesh(new CylinderGeometry(radius, radius, 1.66, sides, 1, true), materials.M_glass);
  glazing.position.y = 1.48;
  group.add(glazing,
    horizontalBand(4.20, 0.35, 0.175, sides, "darkGray"),
    horizontalBand(4.03, 0.33, 0.46, sides, "gray"),
    horizontalBand(3.83, 0.19, 0.69, sides, "ice", 3.38),
    horizontalBand(3.99, 0.28, 2.39, sides, "ice", 2.33),
    horizontalBand(3.47, 0.12, 2.59, sides, "gray", 2.34),
    horizontalBand(2.24, 5.16, 3.18, sides, "darkGray"),
    horizontalBand(2.76, 0.28, 5.85, sides, "ice"),
    horizontalBand(2.48, 0.28, 6.10, sides, "gray"),
    horizontalBand(1.95, 0.38, 6.39, sides, "ice"),
    horizontalBand(0.44, 0.49, 6.79, 12, "darkGray"),
  );
  const panelCount = detail === "far" ? 8 : 16;
  const radialPlaces = (radius: number, y: number) => Array.from({ length: panelCount }, (_, i) => {
    const angle = i / panelCount * Math.PI * 2;
    const mount = location(radius * Math.sin(angle), y, radius * Math.cos(angle));
    mount.rotation.y = angle;
    return mount;
  });
  const repeated = [
    repeatMesh(boxCenter([0.105, 1.69, 0.13], "ice", [0, 0, 0], 0.018), "Lobby mullions", radialPlaces(radius, 1.48)),
    repeatMesh(boxCenter([0.11, 3, 0.23], "gray", [0, 0, 0], 0.02), "Drum panel seams", radialPlaces(2.25, 4.16)),
  ];
  for (const y of [2.83, 3.68, 4.53, 5.37]) {
    group.add(horizontalBand(2.42, 0.15, y, sides, "ice", 2.19));
  }
  group.add(
    boxCenter([1.74, 1.92, 0.48], "ice", [0, 1.28, 3.05], 0.09),
    boxCenter([1.32, 1.59, 0.16], "darkGray", [0, 1.16, 3.32], 0.06),
    boxCenter([1.1, 0.044, 0.065], "cyan", [0, 2.02, 3.42], 0.01),
  );
  if (detail !== "far") {
    const chairs = radialPlaces(2.69, 0.91);
    repeated.push(repeatMesh(boxCenter([0.48, 0.33, 0.41], "gray", [0, 0, 0], 0.04), "Lobby console seats", chairs));
  }
  const dish = new Group();
  const profile = [[0.035, 0], [0.30, 0.05], [0.65, 0.19], [0.79, 0.31], [0.78, 0.35], [0.62, 0.23], [0.27, 0.10], [0.03, 0.05]];
  const bowl = new LatheGeometry(profile.map(([r, y]) => new Vector2(r, y)), detail === "near" ? 20 : 12);
  dish.add(new Mesh(coloredGeometry(bowl, "ice", { weld: true }), materials.M_palette));
  dish.add(beam([0, 0.06, 0], [0, 0.57, 0], 0.084, "darkGray"));
  dish.add(boxCenter([0.17, 0.13, 0.17], "gray", [0, 0.60, 0], 0.02));
  dish.rotation.z = -0.41;
  dish.position.y = 7.06;
  group.add(dish);
  return fusedParts("Stepped command drum and transparent lobby", group, detail === "near", repeated);
}

export function registerCommandTower(registry: PieceRegistry): void {
  registerColonyBuilding(registry, "MB-09", buildCommandTower);
}
