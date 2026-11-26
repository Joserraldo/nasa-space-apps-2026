import { Group, Mesh, Object3D, PlaneGeometry } from "three";
import { materials } from "../../../materials/shared";
import type { PieceRegistry } from "../../registry";
import { boxCenter, parseRecord, weldedColoredGeometry } from "../station/helpers";
import { fusedParts, repeatMesh } from "./transit-details";

export function registerRunwayBeacon(registry: PieceRegistry): void {
  registry.register("NX-02", {
    parse: input => parseRecord(input, []),
    variants: { standard: {} },
    metadata: { category: "prop", pivot: "base-center" },
    build: () => {
      const parts = new Group();
      const plane = new PlaneGeometry(0.17, 0.073);
      const lens = new Mesh(weldedColoredGeometry(plane, "cyan"), materials.M_palette);
      plane.dispose();
      lens.rotation.x = -Math.PI / 2;
      lens.position.set(0, 0.173, 0.043);
      parts.add(
        boxCenter([0.32, 0.075, 0.26], "hull", [0, 0.0375, 0], 0.022),
        boxCenter([0.25, 0.11, 0.20], "darkGray", [0, 0.117, 0], 0.019),
        lens,
      );
      return fusedParts("NX-02", parts, true);
    },
  });
}

export function instanceRunwayEdge(registry: PieceRegistry, apothem: number, surface: number) {
  const fixture = registry.build("NX-02").children[0] as Mesh;
  const placements: Object3D[] = [];
  const inset = apothem - 0.22;
  for (let edge = 0; edge < 8; edge++) {
    const angle = edge * Math.PI / 4;
    const sin = Math.sin(angle), cos = Math.cos(angle);
    // Straddle the midpoint, leaving the stair head and each seam clear.
    for (const tangent of [-1.08, 1.08]) {
      const marker = new Object3D();
      marker.position.set(inset * sin + tangent * cos, surface, inset * cos - tangent * sin);
      marker.rotation.y = angle;
      placements.push(marker);
    }
  }
  return repeatMesh(fixture, "NX-02 runway edge", placements);
}
