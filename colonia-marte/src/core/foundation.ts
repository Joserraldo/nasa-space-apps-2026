import { Mesh, type Material } from "three";
import { createDemoRegistry } from "./demo-pieces";
import { createRendering } from "./rendering";
import { createShell } from "./shell";
import { buildBaseScene } from "./base-scene";
import { startLoop } from "./loop";
import { createCatalog } from "../catalog/catalog";
import { createProductionRegistry } from "../kit/pieces";
import { addCatalogAtlas } from "../materials/review";
import { createJoystick } from "../navigation/joystick";
import { createNavigation } from "../navigation/mode-controller";
import { createResolutionGovernor, deviceProfile } from "../navigation/mobile-optimizer";
import { triangleCount } from "../../tools/geometry-inspection";
import { getScreens } from "../materials/screens";

export function mountFoundation(catalog: boolean) {
  document.title = `${catalog ? "Kit catalog" : "Kit foundation"} | Mars Colony`;
  const shell = createShell(catalog);
  const rendering = createRendering(shell.viewport);
  getScreens();
  const { renderer, scene, camera, composer, stats } = rendering;
  const registry = createDemoRegistry();
  // The catalog reviews production pieces once WS3/WS4 register any; until then it shows the WS0 fixtures.
  const production = createProductionRegistry();
  const catalogRegistry = production.ids().length ? production : registry;
  const joystick = createJoystick(shell.joystick);
  const navigation = createNavigation(camera, renderer.domElement, joystick.state);
  const sheet = catalog ? createCatalog(catalogRegistry, shell.viewport, shell.list) : undefined;
  const content = sheet?.group ?? buildBaseScene(registry);
  scene.add(content);
  if (catalog) addCatalogAtlas();
  const resetView = () => {
    navigation.setMode("orbit");
    camera.position.set(8, 5, 10);
    navigation.orbit.target.set(3, 0.3, 3);
    camera.fov = catalog ? 48 : 54;
    camera.updateProjectionMatrix();
    navigation.orbit.update();
    if (sheet) {
      sheet.fit(camera);
      navigation.orbit.enabled = false;
    }
    joystick.setVisible(false);
    shell.orbit.setAttribute("aria-pressed", "true");
    shell.walk.setAttribute("aria-pressed", "false");
    shell.status.textContent = catalog ? "CATALOG" : "ORBIT";
    shell.fade.style.opacity = "0";
  };
  resetView();
  shell.reset.onclick = resetView;
  shell.orbit.onclick = resetView;
  shell.walk.onclick = () => {
    camera.position.set(3, 1.5, 5);
    navigation.setMode("walk");
    joystick.setVisible(true);
    shell.fade.style.opacity = "0";
    shell.orbit.setAttribute("aria-pressed", "false");
    shell.walk.setAttribute("aria-pressed", "true");
    shell.status.textContent = "WALK";
    renderer.domElement.focus({ preventScroll: true });
  };
  const profile = deviceProfile(matchMedia("(pointer: coarse)").matches, innerWidth, innerHeight, devicePixelRatio);
  const applyRatio = (ratio: number) => { renderer.setPixelRatio(ratio); rendering.resize(); };
  const governor = createResolutionGovernor(profile.maxPixelRatio, applyRatio);
  shell.balanced.checked = profile.mode === "balanced";
  applyRatio(profile.maxPixelRatio);
  shell.balanced.onchange = () => governor.reset();

  const extensions = import.meta.glob<{ attach: (context: unknown) => void }>("../camera/demo.ts", { eager: true });
  if (!catalog) {
    for (const extension of Object.values(extensions)) extension.attach({ camera, navigation, shell });
  }
  const materials = new Set<Material>();
  content.traverse(node => {
    if (node instanceof Mesh) {
      const list = Array.isArray(node.material) ? node.material : [node.material];
      list.forEach(material => materials.add(material));
    }
  });
  const metrics = {
    calls: 0, triangles: 0, sceneTriangles: triangleCount(content), materials: materials.size,
    fps: 0, frames: 0, pixelRatio: renderer.getPixelRatio(),
  };
  let elapsed = 0;
  let frames = 0;
  const stop = startLoop(shell.viewport, dt => {
    renderer.info.reset();
    stats.begin();
    if (sheet) sheet.fit(camera);
    else navigation.update(dt);
    composer.render(dt);
    stats.end();
    stats.update();
    sheet?.updateLabels(camera);
    metrics.calls = renderer.info.render.calls;
    metrics.triangles = renderer.info.render.triangles;
    metrics.frames++;
    elapsed += dt;
    frames++;
    if (elapsed >= 0.5) {
      metrics.fps = Math.round(frames / elapsed);
      metrics.pixelRatio = renderer.getPixelRatio();
      elapsed = frames = 0;
      shell.metrics.textContent = [
        `draw calls ${metrics.calls}`, `triangles ${metrics.triangles.toLocaleString("en-US")}`,
        `materials ${metrics.materials}`, `fps ${metrics.fps}`, `DPR ${metrics.pixelRatio.toFixed(2)}`,
      ].join(" | ");
    }
    if (shell.balanced.checked) governor.update(dt);
  });
  window.addEventListener("pagehide", () => {
    stop(); navigation.dispose(); joystick.dispose(); rendering.dispose();
  }, { once: true });
  window.__ws0 = {
    metrics, registry, catalog: sheet?.entries.map(({ label, triangles }) => ({ label, triangles })) ?? [],
    navigation, camera, joystick,
  };
}

declare global {
  interface Window {
    __ws0: {
      metrics: {
        calls: number; triangles: number; sceneTriangles: number; materials: number;
        fps: number; frames: number; pixelRatio: number;
      };
      registry: ReturnType<typeof createDemoRegistry>;
      catalog: { label: string; triangles: number }[];
      navigation: ReturnType<typeof createNavigation>;
      camera: ReturnType<typeof createRendering>["camera"];
      joystick: ReturnType<typeof createJoystick>;
    };
  }
}
