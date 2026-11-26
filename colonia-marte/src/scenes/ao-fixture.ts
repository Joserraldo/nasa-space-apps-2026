import { Group, Mesh, PlaneGeometry } from "three";
import { chamferBox } from "../kit/primitives";
import { coloredGeometry } from "../materials/uv";
import { materials } from "../materials/shared";

/** Three adjacent 2m bays. Segmented flat surfaces make contact shading visible between corners. */
export function createAORoom(): Group {
  const room = new Group(); room.name = "three_module_room";
  for (let module = 0; module < 3; module++) {
    const floor = new Mesh(coloredGeometry(new PlaneGeometry(2, 4, 10, 20), "offWhite"), materials.M_palette);
    floor.rotation.x = -Math.PI / 2; floor.position.set(module * 2 + 1, 0, 0); room.add(floor);
    const back = new Mesh(coloredGeometry(new PlaneGeometry(2, 3, 10, 15), "white"), materials.M_palette);
    back.position.set(module * 2 + 1, 1.5, -2); room.add(back);
    const block = new Mesh(coloredGeometry(chamferBox(1.1, 0.8, 0.7), "blue"), materials.M_palette);
    block.position.set(module * 2 + 1, 0.4, -1.1); room.add(block);
  }
  const side = new Mesh(coloredGeometry(new PlaneGeometry(4, 3, 20, 15), "white"), materials.M_palette);
  side.rotation.y = Math.PI / 2; side.position.set(0, 1.5, 0); room.add(side);
  return room;
}
