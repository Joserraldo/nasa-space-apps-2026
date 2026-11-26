import { Group, PointLight } from "three";
import { startLoop } from "../core/loop";
import { createRendering } from "../core/rendering";
import { createReviewShell } from "../core/review-shell";
import { applyEnvironment } from "../environment/apply";
import { presets } from "../environment/presets";
import { createProductionRegistry } from "../kit/pieces";
import { getScreens } from "../materials/screens";
import { bakeRoomAO } from "../../tools/bake-room-ao";

/**
 * K1 verification scene: 3 walls (ST-W02, ST-W01, ST-W07), 1 portal (ST-D01),
 * and 1 corner column (ST-C01) assembled in an L on the 2 m grid with zero filler ribs.
 */
export function mountK1Review(): void {
  const shell = createReviewShell(
    "K1 Wall & Column Assembly",
    "Three walls (ST-W02, ST-W01, ST-W07), one portal (ST-D01), and one corner column (ST-C01) in an L.",
  );
  const rendering = createRendering(shell.viewport);
  getScreens();
  const { scene, camera, renderer, composer } = rendering;

  const amb02 = presets.find(preset => preset.id === "AMB-02") ?? presets[0];
  applyEnvironment(rendering, amb02);

  const registry = createProductionRegistry();
  const assembly = new Group();
  assembly.name = "k1_l_assembly";

  for (let gx = 0; gx < 3; gx++) {
    for (let gz = 0; gz < 2; gz++) {
      const tile = registry.build("ST-F01", { style: gx === 1 && gz === 0 ? "accent" : "standard" });
      tile.position.set(gx * 2, -0.2, gz * 2);
      assembly.add(tile);
    }
  }

  // North leg along Z=0: 2 walls + 1 portal [x = 0..6]
  const wall1 = registry.build("ST-W02", { mode: "vertical", accent: "cyan" });
  wall1.position.set(0, 0, 0);
  const wall2 = registry.build("ST-W01", { style: "standard" });
  wall2.position.set(2, 0, 0);
  const portal = registry.build("ST-D01", { opening: "standard", state: "cyan" });
  portal.position.set(4, 0, 0);

  // West leg turning 90 degrees in L along X=0 [z = 0..4]: corner column + 3rd wall
  const column = registry.build("ST-C01", { accent: "cyan" });
  column.position.set(0, 0, 0);
  const wall3 = registry.build("ST-W07", { pattern: "chevron" });
  wall3.position.set(0, 0, 2);
  wall3.rotation.y = Math.PI / 2;

  assembly.add(wall1, wall2, portal, column, wall3);

  const baked = bakeRoomAO(assembly, { samples: 48, radius: 1.1, strength: 0.8 });
  scene.add(baked.group);

  const fill = new PointLight("#fff4e6", 5, 14, 2);
  fill.position.set(3.4, 2.8, 3.6);
  scene.add(fill);

  camera.fov = 50;
  camera.position.set(6.8, 3.5, 6.2);
  camera.lookAt(2.3, 1.35, 0.8);
  camera.updateProjectionMatrix();

  let frames = 0;
  const stop = startLoop(shell.viewport, dt => {
    renderer.info.reset();
    composer.render(dt);
    frames += 1;
    shell.metrics.textContent =
      `K1 L-assembly | draw calls ${renderer.info.render.calls} | ` +
      `triangles ${renderer.info.render.triangles.toLocaleString("en-US")} | bake ${baked.milliseconds.toFixed(1)} ms`;
  });

  (window as Window & { __k1?: { ready: () => boolean } }).__k1 = {
    ready: () => frames > 6,
  };
  window.addEventListener("pagehide", () => { stop(); rendering.dispose(); }, { once: true });
}
