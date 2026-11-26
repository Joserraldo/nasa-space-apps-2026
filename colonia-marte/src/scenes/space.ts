import { DirectionalLight, HemisphereLight, InstancedMesh, Mesh, SphereGeometry } from "three";
import { startLoop } from "../core/loop";
import { createRendering } from "../core/rendering";
import { applyEnvironment } from "../environment/apply";
import { createProductionRegistry } from "../kit/pieces";
import { paletteHex } from "../materials/palette";
import { materials } from "../materials/shared";
import { countColonyTriangles } from "./colony-batches";
import { createSpaceShot, SPACE_DURATION } from "./space-shot";

export function mountSpace(): void {
  const viewport = document.createElement("main");
  viewport.style.cssText = "position:relative;grid-row:1/-1;min-height:0;overflow:hidden";
  document.getElementById("app")!.replaceChildren(viewport);
  document.title = "Transit to Mars | Mars Colony";

  const rendering = createRendering(viewport);
  const { renderer, scene, camera, composer, stats } = rendering;
  const capture = new URLSearchParams(location.search).get("capture");
  const captureAngle = capture === "detail" || capture === "thrusters" ? capture : undefined;
  const shot = createSpaceShot(createProductionRegistry(), camera.aspect, captureAngle);
  camera.copy(shot.camera);
  camera.updateMatrixWorld();
  applyEnvironment(rendering, shot.preset);
  const sun = scene.children.find((node): node is DirectionalLight => node instanceof DirectionalLight)!;
  sun.position.set(-50, 80, -32);
  sun.intensity = 8.4;
  sun.color.set(paletteHex("ice"));
  const fill = scene.children.find((node): node is HemisphereLight => node instanceof HemisphereLight)!;
  fill.color.set(paletteHex("offWhite"));
  fill.groundColor.set(paletteHex("duskHalo"));
  fill.intensity = 0.29;
  const rim = new DirectionalLight(paletteHex("duskHalo"), 1.02);
  rim.position.set(23, -19, 42);
  scene.fog = null;
  rendering.ao.enabled = false;
  const backdrop = materials.M_sky;
  backdrop.uniforms.planetDirection.value.copy(shot.earthCenter).sub(camera.position).normalize();
  backdrop.uniforms.planetRadius.value = shot.earth.scale.x / shot.earthCenter.distanceTo(camera.position);
  const sky = new Mesh(new SphereGeometry(475, 32, 16), backdrop);
  sky.position.copy(camera.position);
  sky.renderOrder = -10;
  sky.onBeforeRender = () => {
    backdrop.uniforms.spaceMode.value = 1;
    backdrop.uniformsNeedUpdate = true;
  };
  sky.onAfterRender = () => {
    backdrop.uniforms.spaceMode.value = 0;
    backdrop.uniformsNeedUpdate = true;
  };
  scene.add(rim, sky, shot.earth, shot.ship);
  renderer.domElement.setAttribute("aria-label", "A transit ship departs, with a small blue Earth in the background");
  stats.dom.hidden = true;

  const still = capture === "1" || captureAngle !== undefined || matchMedia("(prefers-reduced-motion: reduce)").matches;
  let time = still ? 0.8 : 0;
  const metrics = {
    preset: shot.preset.id,
    lodTriangles: shot.ship.levels.map(({ object }) => countColonyTriangles(object)),
    earthTriangles: countColonyTriangles(shot.earth),
    frames: 0,
    calls: 0,
    triangles: 0,
    time,
  };
  Object.assign(window, { __space: metrics });
  let lastSize = "";
  const stop = startLoop(viewport, dt => {
    const size = `${renderer.domElement.width}x${renderer.domElement.height}`;
    if (metrics.frames > 1 && (still || metrics.time === SPACE_DURATION) && size === lastSize) return;
    lastSize = size;
    shot.pose(time);
    if (camera.fov !== shot.camera.fov) {
      camera.fov = shot.camera.fov;
      camera.updateProjectionMatrix();
    }
    renderer.info.reset();
    composer.render(dt);
    metrics.frames++;
    metrics.time = time;
    metrics.calls = renderer.info.render.calls;
    metrics.triangles = renderer.info.render.triangles;
    if (!still) time = Math.min(time + dt, SPACE_DURATION);
  });
  window.addEventListener("pagehide", () => {
    stop();
    scene.traverse(object => {
      if (object instanceof InstancedMesh) {
        object.dispose();
      }
      if (object instanceof Mesh) object.geometry.dispose();
    });
    rendering.dispose();
  }, { once: true });
}
