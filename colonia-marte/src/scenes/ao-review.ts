import { createRendering } from "../core/rendering";
import { createReviewShell } from "../core/review-shell";
import { startLoop } from "../core/loop";
import { createAORoom } from "./ao-fixture";
import { bakeRoomAO } from "../../tools/bake-room-ao";
import { restoreAOCache, serializeAOCache, type AOCache } from "../../tools/bake-vertex-ao";

export function mountAOReview() {
  const shell = createReviewShell("Vertex AO", "Left: unbaked. Right: baked. Three 2 m modules per room.");
  const rendering = createRendering(shell.viewport);
  const { scene, camera, renderer, composer, ao } = rendering;
  ao.enabled = false; // Isolate baked AO for this comparison.
  camera.position.set(13, 9, 15); camera.lookAt(6.5, 0.8, 0);
  const room = createAORoom();
  scene.add(room);
  let cache: AOCache = new Map();
  try { cache = restoreAOCache(localStorage.getItem("ao-three-module-room") ?? ""); } catch { /* Cold bake. */ }
  const baked = bakeRoomAO(room, {}, cache);
  baked.group.position.x = 7.5; scene.add(baked.group);
  try { localStorage.setItem("ao-three-module-room", serializeAOCache(cache)); } catch { /* Storage is optional. */ }
  const info = document.createElement("p");
  info.textContent = `Bake: ${baked.milliseconds.toFixed(1)} ms; cache: ${baked.results.every(r => r.cacheHit)}`;
  shell.controls.append(info);
  const stop = startLoop(shell.viewport, dt => {
    renderer.info.reset(); composer.render(dt);
    shell.metrics.textContent = `draw calls ${renderer.info.render.calls} | ` +
      `triangles ${renderer.info.render.triangles}`;
  });
  window.addEventListener("pagehide", () => { stop(); rendering.dispose(); }, { once: true });
}
