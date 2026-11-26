import { Box3, LOD, PerspectiveCamera, Vector3 } from "three";
import { presets } from "../environment/presets";
import type { PieceRegistry } from "../kit/registry";

export const SPACE_DURATION = 6;
export type SpaceCapture = "detail" | "thrusters";

export function createSpaceShot(registry: PieceRegistry, aspect: number, capture?: SpaceCapture) {
  const preset = presets.find(({ id }) => id === "AMB-01");
  if (!preset) throw new Error("Missing AMB-01 space environment");

  const camera = new PerspectiveCamera(39, aspect, 0.1, 550);
  camera.position.set(8.8, 2.2, -23);
  camera.lookAt(-1.45, 3.55, 0);
  camera.updateMatrixWorld();

  const ship = new LOD();
  ship.name = "MV-09";
  ship.scale.setScalar(0.29);
  for (const [detail, distance] of [["near", 0], ["middle", 28], ["far", 30]] as const) {
    const model = registry.build("MV-09", { detail });
    model.position.y = -new Box3().setFromObject(model).getCenter(new Vector3()).y;
    ship.addLevel(model, distance, 0.07);
  }
  ship.levels.slice(1).forEach(({ object }) => { object.visible = false; });
  const navigationLights = ship.levels.flatMap(({ object }) =>
    ["nav-red", "nav-green"].flatMap(name => object.getObjectByName(name) ?? []));

  const earth = registry.build("BG-01");
  earth.scale.setScalar(3.85);
  const earthCenter = new Vector3(-0.59, 0.43, 0.9985).unproject(camera);
  earth.position.copy(earthCenter);
  earth.position.y -= earth.scale.y;
  earth.rotation.y = 0.17;
  function pose(seconds: number) {
    const t = Math.min(Math.max(seconds / SPACE_DURATION, 0), 1);
    camera.fov = 39 - 4.5 * t;
    camera.updateProjectionMatrix();
    ship.position.set(-0.45 - 4.7 * t, 3.0 + 0.54 * t, 4.8 * t);
    ship.rotation.y = 0.16 + 0.12 * t;
    ship.rotation.z = -0.08 - 0.05 * t;
    const navigationOn = seconds % 2.8 < 1.1;
    for (const light of navigationLights) light.visible = navigationOn;
    ship.updateMatrixWorld();
  }
  pose(capture ? 0.8 : 0);
  if (capture === "detail") {
    camera.position.set(7.2, 8.4, -19.5);
    camera.lookAt(-0.8, 3.0, 0.65);
    camera.zoom = 1.76;
  } else if (capture === "thrusters") {
    const target = ship.localToWorld(new Vector3(15.1, 0, 0));
    camera.position.copy(target).add(new Vector3(4.6, 1.85, -4.15));
    camera.lookAt(target.add(new Vector3(0.40, 0, 0)));
    camera.zoom = 2.1;
  }
  if (capture) {
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  }
  return { preset, camera, ship, earth, earthCenter, pose };
}
