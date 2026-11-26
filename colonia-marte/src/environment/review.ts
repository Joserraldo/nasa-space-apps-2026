import { Mesh, SphereGeometry } from "three";
import demURL from "../../data/terrain/jezero-elevation.bin?url";
import { createRendering } from "../core/rendering";
import { createReviewShell, addSelect } from "../core/review-shell";
import { startLoop } from "../core/loop";
import { materials, terrainUniforms } from "../materials/shared";
import { paletteHex } from "../materials/palette";
import { presets } from "./presets";
import { applyEnvironment } from "./apply";
import { applyExteriorLightingCalibration } from "../scenes/exterior-pilot";
import { decodeJezeroDEM } from "./dem";
import { createJezeroRockScatter, disposeRockScatter } from "./rock-scatter";
import { createTerrain, type Biome } from "./terrain";
import { triangleCount } from "../../tools/geometry-inspection";

export async function mountEnvironmentReview() {
  const shell = createReviewShell("Environment", "Review at eye height or above the colony site. Polar biome: C5.");
  const biome = addSelect(shell.controls, "biome", "Biome", ["jezero", "polar"]);
  const preset = addSelect(shell.controls, "preset", "Environment preset", presets.map(p => `${p.id} ${p.name}`));
  const lod = addSelect(shell.controls, "terrain-lod", "Terrain detail", ["0", "1", "2"]);
  const viewpoint = addSelect(shell.controls, "terrain-camera", "Review camera", ["Eye height · 1.5 m", "Elevated · 25 m"]);
  const rendering = createRendering(shell.viewport);
  const { scene, camera, renderer, composer } = rendering;
  camera.far = 60000; camera.near = 0.1; camera.fov = 54; camera.updateProjectionMatrix();
  camera.position.set(0, 1.5, 12); camera.lookAt(0, 1.5, -100);
  viewpoint.onchange = () => {
    const elevated = viewpoint.selectedIndex === 1;
    camera.position.set(0, elevated ? 25 : 1.5, elevated ? 45 : 12);
    camera.lookAt(0, elevated ? 0 : 1.5, elevated ? -220 : -100);
    sky.position.copy(camera.position);
  };
  const response = await fetch(demURL);
  if (!response.ok) throw new Error(`DEM load failed: ${response.status}`);
  const dem = decodeJezeroDEM(await response.arrayBuffer());
  const sky = new Mesh(new SphereGeometry(48000, 48, 24), materials.M_sky);
  sky.position.copy(camera.position); sky.renderOrder = -10; sky.material.depthWrite = false;
  scene.add(sky);
  let terrain = createTerrain({ biome: "jezero", seed: 42, dem }); scene.add(terrain);
  const reviewExclusions = [{ x: 0, z: 12, radius: 3.4 }];
  let rocks = createJezeroRockScatter({ seed: 42, lod: 0, dem, exclusions: reviewExclusions });
  scene.add(rocks);
  terrainUniforms.useMask.value = 1;
  terrainUniforms.oxide.value.set(paletteHex("oxide"));
  terrainUniforms.shade.value.set(paletteHex("regolithShade"));
  const updateTerrainCount = () => {
    metrics.terrainTriangles = triangleCount(terrain) + (rocks.visible ? triangleCount(rocks) : 0);
  };
  const metrics = { calls: 0, triangles: 0, terrainTriangles: 0, frames: 0, preset: "AMB-04" };
  updateTerrainCount();
  const syncRocksVisibility = (chosenId: string) => {
    rocks.visible = biome.value === "jezero" && chosenId !== "AMB-01";
    updateTerrainCount();
  };
  const apply = () => {
    const chosen = presets.find(p => preset.value.startsWith(p.id))!;
    applyEnvironment(rendering, chosen); metrics.preset = chosen.id;
    if (chosen.id === "AMB-04" && biome.value === "jezero") {
      applyExteriorLightingCalibration(rendering);
    }
    syncRocksVisibility(chosen.id);
    shell.status.textContent = chosen.context.toUpperCase();
  };
  preset.value = preset.options[3].value; preset.onchange = apply; apply();
  const rebuild = () => {
    scene.remove(terrain);
    terrain.children.forEach(node => (node as Mesh).geometry.dispose());
    scene.remove(rocks);
    disposeRockScatter(rocks);
    const nextLod = Number(lod.value) as 0 | 1 | 2;
    terrain = createTerrain({ biome: biome.value as Biome, seed: 42, lod: nextLod, dem });
    rocks = createJezeroRockScatter({ seed: 42, lod: nextLod, dem, exclusions: reviewExclusions });
    terrainUniforms.biome.value = biome.value === "polar" ? 1 : 0;
    scene.add(terrain);
    scene.add(rocks);
    syncRocksVisibility(metrics.preset);
  };
  biome.onchange = rebuild; lod.onchange = rebuild;
  const note = document.createElement("p");
  note.textContent = "Ground: DV-07 #82463E / #542B28 warm oxide rock + 3-scale MT-* formations. " +
    "DEM beyond 800 m; rim at real distance, 1.4× vertical scale.";
  shell.controls.append(note);
  const stop = startLoop(shell.viewport, dt => {
    renderer.info.reset(); composer.render(dt);
    metrics.calls = renderer.info.render.calls; metrics.triangles = renderer.info.render.triangles; metrics.frames++;
    shell.metrics.textContent = `draw calls ${metrics.calls} | triangles ${metrics.triangles} | ` +
      `terrain ${metrics.terrainTriangles}`;
  });
  window.__environment = { metrics, camera, scene };
  window.addEventListener("pagehide", () => { stop(); rendering.dispose(); }, { once: true });
}

declare global {
  interface Window { __environment: {
    metrics: { calls: number; triangles: number; terrainTriangles: number; frames: number; preset: string };
    camera: ReturnType<typeof createRendering>["camera"]; scene: ReturnType<typeof createRendering>["scene"];
  } }
}
