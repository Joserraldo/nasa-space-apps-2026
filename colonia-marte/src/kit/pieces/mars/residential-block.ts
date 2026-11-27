import { BufferGeometry, Float32BufferAttribute, Group, Mesh, PlaneGeometry, type Object3D } from "three";
import type { PieceRegistry } from "../../registry";
import { materials } from "../../../materials/shared";
import { coloredGeometry } from "../../../materials/uv";
import { boxCenter } from "../station/helpers";
import { registerColonyBuilding, type ColonyBuildingDetail } from "./colony-building-details";
import { beam, fusedParts, location, repeatMesh } from "./transit-details";

function windowBezel() {
  const positions: number[] = [], faces: number[] = [];
  const rings = [
    [0.375, 0.320, 0.043, -0.055], [0.348, 0.294, 0.036, 0.093],
    [0.280, 0.226, 0.022, 0.093], [0.246, 0.192, 0.016, -0.023],
  ];
  for (const [w, h, c, z] of rings) {
    for (const [x, y] of [[-w+c, -h], [w-c, -h], [w, -h+c], [w, h-c],
      [w-c, h], [-w+c, h], [-w, h-c], [-w, -h+c]]) positions.push(x, y, z);
  }
  for (let ring = 0; ring < rings.length - 1; ring++) for (let corner = 0; corner < 8; corner++) {
    const a = ring * 8 + corner, b = ring * 8 + (corner + 1) % 8;
    faces.push(a, b, b + 8, a, b + 8, a + 8);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setIndex(faces);
  geometry.computeVertexNormals();
  return new Mesh(coloredGeometry(geometry, "ice"), materials.M_palette);
}

function buildResidential(detail: ColonyBuildingDetail) {
  const shell = new Group();
  const frames: Object3D[] = [], panes: Object3D[] = [], lamps: Object3D[] = [];
  const railPosts: Object3D[] = [], louvers: Object3D[] = [];
  shell.add(
    boxCenter([8.80, 0.30, 4.72], "darkGray", [0, 0.15, 0], 0.12),
    boxCenter([8.64, 0.24, 4.54], "gray", [0, 0.42, 0], 0.065),
    boxCenter([1.62, 4.27, 2.94], "darkGray", [0, 2.65, -0.31], 0.13),
    boxCenter([2.26, 2.26, 1.72], "ice", [0, 1.55, 1.43], 0.18),
    boxCenter([1.62, 1.78, 0.3], "gray", [0, 1.38, 2.28], 0.09),
    boxCenter([1.13, 1.56, 0.12], "darkGray", [0, 1.24, 2.47], 0.07),
    boxCenter([0.87, 0.046, 0.053], "cyan", [0, 2.08, 2.51], 0.011),
  );
  for (const [x, z, floors] of [[-2.69, -0.26, 4], [2.69, 0.25, 3]] as const) {
    shell.add(boxCenter([2.78, 0.61, 3.19], "gray", [x, 0.83, z], 0.12));
    for (let floor = 0; floor < floors; floor++) {
      const y = 1.67 + floor * 1.15;
      const aboveTerrace = floor === floors - 1;
      const depth = aboveTerrace ? 2.69 : 3.20;
      const face = depth / 2;
      shell.add(
        boxCenter([2.72, 1.03, depth - 0.07], "darkGray", [x, y, z], 0.10),
        boxCenter([3.08, 0.17, depth + 0.16], "ice", [x, y - 0.47, z], 0.059),
        boxCenter([2.98, 0.16, depth + 0.09], "ice", [x, y + 0.49, z], 0.054),
      );
      for (const side of [-1, 1]) {
        for (const bay of [-0.80, 0, 0.80]) {
          if (detail === "far" && bay === 0) continue;
          const surround = location(x + bay, y + 0.10, z + side * (face + 0.058));
          surround.rotation.y = side > 0 ? 0 : Math.PI;
          frames.push(surround);
          const pane = location(x + bay, y + 0.10, z + side * (face + 0.043));
          pane.rotation.y = side > 0 ? 0 : Math.PI;
          panes.push(pane);
          shell.add(boxCenter([0.73, 0.19, 0.16], "gray", [x + bay, y - 0.24, z + side * (face + 0.033)], 0.028));
        }
        const outerX = x + side * 1.37;
        for (const segment of detail === "near" ? [-0.91, 0, 0.91] : [0]) {
          shell.add(boxCenter([0.17, 0.76, segment === 0 && detail !== "near" ? depth - 0.28 : 0.81],
            "ice", [outerX, y - 0.012, z + segment * depth / 3.20], 0.055));
        }
      }
      if (detail === "near") {
        const balcony = z + face + 0.32;
        shell.add(
          boxCenter([2.64, 0.13, 0.69], "gray", [x, y - 0.40, z + face + 0.25], 0.042),
          boxCenter([2.54, 0.045, 0.058], "darkGray", [x, y - 0.025, balcony + 0.26], 0.011),
        );
        for (const offset of [-1.18, -0.39, 0.39, 1.18]) {
          railPosts.push(location(x + offset, y - 0.195, balcony + 0.26));
        }
      }
      if (detail !== "far") lamps.push(location(x + 1.08, y + 0.38, z + face + 0.084));
    }
    const roof = 1.67 + (floors - 1) * 1.15 + 0.61;
    shell.add(boxCenter([2.66, 0.25, 2.47], "gray", [x, roof, z], 0.08));
    if (detail !== "far") {
      shell.add(
        boxCenter([1.48, 0.43, 0.98], "darkGray", [x, roof + 0.29, z + 0.14], 0.057),
        boxCenter([1.60, 0.11, 1.04], "ice", [x, roof + 0.52, z + 0.14], 0.031),
        boxCenter([2.43, 0.064, 0.053], "gray", [x, roof + 0.44, z + 1.23], 0.013),
        beam([x - 1.52, 0.46, z + 1.48], [x - 1.52, 1.41, z + 1.12], 0.19, "gray"),
        beam([x + 1.52, 0.46, z + 1.48], [x + 1.52, 1.41, z + 1.12], 0.19, "gray"),
      );
      for (const offset of [-1.16, -0.39, 0.39, 1.16]) {
        railPosts.push(location(x + offset, roof + 0.27, z + 1.23));
      }
      if (detail === "near") {
        for (const offset of [-0.12, -0.041, 0.041, 0.12]) louvers.push(location(x, roof + 0.29 + offset, z + 0.66));
        shell.add(beam([x + 0.7, roof + 0.21, z], [x + 1.12, roof + 0.15, z - 0.63], 0.096, "gray"));
      }
    }
  }
  const details = [
    repeatMesh(windowBezel(), "Recessed window surrounds", frames),
    repeatMesh(new Mesh(new PlaneGeometry(0.49, 0.38), materials.M_glass), "Residential glazing", panes),
  ];
  if (railPosts.length) details.push(repeatMesh(boxCenter([0.044, 0.35, 0.045], "darkGray", [0, 0, 0], 0.01), "Balcony rail posts", railPosts));
  if (louvers.length) details.push(repeatMesh(boxCenter([1.28, 0.037, 0.086], "gray", [0, 0, 0], 0.009), "Roof cooling louvers", louvers));
  if (lamps.length) details.push(repeatMesh(boxCenter([0.48, 0.038, 0.055], "cyan", [0, 0, 0], 0.009), "Cabin status LEDs", lamps));
  return fusedParts("Stepped residential stacks", shell, detail === "near", details);
}

export function registerResidentialBlock(registry: PieceRegistry): void {
  registerColonyBuilding(registry, "MB-08", buildResidential);
}
