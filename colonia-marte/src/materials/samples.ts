import { Group, Mesh, SphereGeometry } from "three";
import { chamferBox } from "../kit/primitives";
import { materials } from "./shared";
import { coloredGeometry } from "./uv";
import { screenGeometry } from "./screens";
import { arrangeSheet } from "../catalog/layout";
import { Vector3 } from "three";

export function materialSamples() {
  const group = new Group();
  const entries = Object.entries(materials).map(([name, material]) => {
    const object = new Group();
    for (const [index, source] of [new SphereGeometry(0.52, 24, 16), chamferBox(0.9, 0.9, 0.9, 0.06)].entries()) {
      const geometry = name === "M_palette" ? coloredGeometry(source, index ? "cyan" : "white")
        : name === "M_screen" ? screenGeometry(source, "dispenser") : source;
      const mesh = new Mesh(geometry, material);
      mesh.position.x = index ? 0.68 : -0.68;
      if (index) mesh.rotation.set(0.2, -0.35, 0);
      object.add(mesh);
    }
    group.add(object);
    return { label: name, object, anchor: new Vector3() };
  });
  arrangeSheet(entries, 3);
  return { group, entries };
}
