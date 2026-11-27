import { Group, Mesh, Vector3 } from "three";
import type { PieceRegistry } from "../../registry";
import { materials } from "../../../materials/shared";
import { boxCenter } from "../station/helpers";
import { cleanGeodesicDome, extractDomeEdgesAndNodes } from "./buildings";
import { horizontalBand, registerColonyBuilding, type ColonyBuildingDetail } from "./colony-building-details";
import { fusedParts, location, repeatMesh } from "./transit-details";

function buildDome(detail: ColonyBuildingDetail) {
  const group = new Group();
  const subdivision = detail === "near" ? 2 : detail === "middle" ? 1 : 0;
  const sides = detail === "far" ? 12 : 20;
  const radius = 3.7;
  const spring = 0.69;
  group.add(
    horizontalBand(3.94, 0.28, 0.14, sides, "darkGray"),
    horizontalBand(3.85, 0.34, 0.48, sides, "ice", 3.34),
    horizontalBand(3.52, 0.12, 0.42, sides, "gray"),
    horizontalBand(1.40, 0.23, 0.59, 12, "darkGray"),
    boxCenter([1.96, 2.05, 0.72], "ice", [0, 1.35, 3.45], 0.12),
    boxCenter([1.58, 1.76, 0.24], "darkGray", [0, 1.24, 3.82], 0.07),
    boxCenter([1.32, 0.058, 0.062], "cyan", [0, 2.25, 3.87], 0.012),
  );
  const shell = new Mesh(cleanGeodesicDome(radius, subdivision), materials.M_glass);
  shell.position.y = spring;
  group.add(shell);
  const { edges, nodes } = extractDomeEdgesAndNodes(radius + 0.02, subdivision);
  const up = new Vector3(0, 1, 0);
  const struts = edges.filter(([a, b]) => a.distanceToSquared(b) > 0.025).map(([a, b]) => {
    const midpoint = a.clone().lerp(b, 0.5);
    const placement = location(midpoint.x, midpoint.y + spring, midpoint.z);
    const axis = b.clone().sub(a);
    placement.scale.y = axis.length() + 0.04;
    placement.quaternion.setFromUnitVectors(up, axis.normalize());
    return placement;
  });
  const repeat = [repeatMesh(boxCenter([0.11, 1, 0.11], "ice", [0, 0, 0], 0.021), "White geodesic struts", struts)];
  if (detail !== "far") {
    repeat.push(repeatMesh(boxCenter([0.168, 0.14, 0.168], "gray", [0, 0, 0], 0.025), "Recessed joint collars",
      nodes.map(node => location(node.x, node.y + spring, node.z))));
    for (const z of [-1.25, 1.25]) {
      group.add(boxCenter([1.32, 0.39, 0.38], "ice", [0, 0.79, z], 0.055));
    }
  }
  if (detail === "near") {
    for (const side of [-1, 1]) {
      for (const z of [-1.9, 0, 1.9]) {
        group.add(boxCenter([0.38, 0.34, 1.12], "darkGray", [side * 2.20, 0.63, z], 0.035));
      }
    }
  }
  return fusedParts("Structure and glazed atrium", group, detail === "near", repeat);
}

export function registerOpenFrameDome(registry: PieceRegistry): void {
  registerColonyBuilding(registry, "MB-05", buildDome);
}
