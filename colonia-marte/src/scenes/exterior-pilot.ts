import { DirectionalLight, HemisphereLight, Mesh, SphereGeometry, type Material } from "three";
import colonyJson from "../../data/layouts/colonies/exterior-pilot.json";
import demURL from "../../data/terrain/jezero-elevation.bin?url";
import { startLoop } from "../core/loop";
import { createRendering } from "../core/rendering";
import { createShell } from "../core/shell";
import { applyEnvironment } from "../environment/apply";
import { decodeJezeroDEM } from "../environment/dem";
import { presets } from "../environment/presets";
import { createJezeroRockScatter, disposeRockScatter, type RockExclusionZone } from "../environment/rock-scatter";
import { createTerrain, terrainHeight } from "../environment/terrain";
import { createProductionRegistry } from "../kit/pieces";
import { paletteHex } from "../materials/palette";
import { getScreens } from "../materials/screens";
import { materials, terrainUniforms } from "../materials/shared";
import { createJoystick } from "../navigation/joystick";
import { createResolutionGovernor, deviceProfile } from "../navigation/mobile-optimizer";
import { createNavigation } from "../navigation/mode-controller";
import { createButton } from "../ui";
import { triangleCount } from "../../tools/geometry-inspection";
import { buildColonyGroup, parseColonyLayout, type ColonyLayout, type ColonyViewSpec } from "./colony-layout";

export { buildColonyGroup, parseColonyLayout };

function buildColonyExclusions(layout: ColonyLayout): RockExclusionZone[] {
  const zones: RockExclusionZone[] = [
    { x: 0, z: 2, radius: 11.4 },
    { x: -3.6, z: -10.2, radius: 6.4 },
  ];
  for (const item of layout.placements) {
    if (item.id.startsWith("MT-")) continue;
    const radius = item.id === "MB-04" ? 7.8 : (item.id === "MB-10" || item.id === "MB-07" ? 5.6 : 3.1);
    zones.push({ x: item.at[0], z: item.at[1], radius });
  }
  for (const view of layout.views) {
    zones.push({ x: view.position[0], z: view.position[2], radius: 3.4 });
  }
  zones.push({ x: -4.8, z: 15.2, radius: 4.4 });
  return zones;
}

/**
 * Keep canonical Martian sky dome (AMB-04 caramel horizon/zenith) while balancing direct/hemisphere
 * lighting so exterior hulls read crisp white and cool gray (zero sandy beige tint) and Jezero
 * ground retains its warm earthy garnet-oxide read.
 */
export function applyExteriorLightingCalibration(rendering: ReturnType<typeof createRendering>): void {
  const sun = rendering.scene.children.find(n => n instanceof DirectionalLight) as DirectionalLight | undefined;
  const hemi = rendering.scene.children.find(n => n instanceof HemisphereLight) as HemisphereLight | undefined;
  if (sun) {
    sun.color.set("#f2f4f8");
    sun.intensity = 2.68;
  }
  if (hemi) {
    hemi.color.set("#e2e8f0");
    hemi.groundColor.set("#5c3d42");
    hemi.intensity = 1.58;
  }
  rendering.renderer.toneMappingExposure = 1.03;
  rendering.bloom.intensity = 0.22;
}

export async function mountExteriorPilot(): Promise<void> {
  const shell = createShell(false);
  const query = new URLSearchParams(location.search);
  const rendering = createRendering(shell.viewport);
  getScreens();
  const { renderer, scene, camera, composer, stats } = rendering;
  if (query.get("clean") === "1") stats.dom.style.display = "none";

  camera.far = 60000;
  camera.near = 0.1;
  camera.updateProjectionMatrix();

  const registry = createProductionRegistry();
  const layout = parseColonyLayout(colonyJson, registry);
  document.title = `${layout.name} | Mars Colony`;

  const response = await fetch(demURL);
  if (!response.ok) throw new Error(`DEM load failed: ${response.status}`);
  const dem = decodeJezeroDEM(await response.arrayBuffer());

  const sky = new SphereGeometry(48000, 48, 24);
  const skyMesh = new Mesh(sky, materials.M_sky);
  skyMesh.renderOrder = -10;
  skyMesh.material.depthWrite = false;
  scene.add(skyMesh);

  const terrainOpts = { biome: layout.biome, seed: layout.terrainSeed, dem };
  const terrain = createTerrain(terrainOpts);
  const rockScatter = createJezeroRockScatter({
    seed: layout.terrainSeed,
    lod: 0,
    dem,
    exclusions: buildColonyExclusions(layout),
  });
  terrainUniforms.biome.value = 0;
  terrainUniforms.useMask.value = 1;
  terrainUniforms.oxide.value.set(paletteHex("oxide"));
  terrainUniforms.shade.value.set(paletteHex("regolithShade"));
  scene.add(terrain, rockScatter);

  const preset = presets.find(p => p.id === layout.environment) ?? presets[3];
  applyEnvironment(rendering, preset);
  applyExteriorLightingCalibration(rendering);

  const colony = buildColonyGroup(layout, registry, dem);
  scene.add(colony);

  const joystick = createJoystick(shell.joystick);
  const navigation = createNavigation(camera, renderer.domElement, joystick.state);

  const applyView = (view: ColonyViewSpec) => {
    navigation.setMode("orbit");
    camera.fov = view.fov;
    const py = view.eyeHeight !== undefined
      ? terrainHeight(view.position[0], view.position[2], terrainOpts) + view.eyeHeight
      : view.position[1];
    camera.position.set(view.position[0], py, view.position[2]);
    navigation.orbit.target.fromArray(view.target);
    camera.updateProjectionMatrix();
    navigation.orbit.update();
    skyMesh.position.copy(camera.position);
    joystick.setVisible(false);
    shell.orbit.setAttribute("aria-pressed", "true");
    shell.walk.setAttribute("aria-pressed", "false");
    shell.status.textContent = "EXTERIOR";
    shell.fade.style.opacity = "0";
  };

  const viewParam = Number(query.get("view") ?? "1");
  const initialIdx = Number.isInteger(viewParam) && viewParam >= 1 ? viewParam - 1 : 0;
  applyView(layout.views[initialIdx] ?? layout.views[0]);

  const controls = document.getElementById("controls");
  if (controls) {
    const viewBar = document.createElement("div");
    viewBar.className = "modes";
    layout.views.forEach((view, idx) => {
      const btn = createButton({
        id: `ext-view-${idx + 1}`,
        label: idx === 0 ? "Overview (v3)" : "Eye 1.5 m",
        style: "Single Stroke",
        size: "Medium",
      });
      btn.onclick = () => applyView(view);
      viewBar.append(btn);
    });
    controls.prepend(viewBar);
  }

  const sideHeading = document.querySelector("aside h2");
  if (sideHeading) sideHeading.textContent = layout.name;
  const scopeNote = document.querySelector(".scope-note");
  if (scopeNote) {
    scopeNote.textContent = `Jezero stylized stone (DV-07) + ${layout.environment} + ${layout.placements.length} assets.`;
  }

  shell.reset.onclick = () => applyView(layout.views[0]);
  shell.orbit.onclick = () => applyView(layout.views[0]);
  shell.walk.onclick = () => {
    const y = terrainHeight(-5.2, 20.8, terrainOpts) + 1.5;
    camera.position.set(-5.2, y, 20.8);
    navigation.setMode("walk");
    joystick.setVisible(true);
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

  const usedMats = new Set<Material>([materials.M_terrain, materials.M_sky, materials.M_palette]);
  colony.traverse(node => {
    if (node instanceof Mesh) {
      const list = Array.isArray(node.material) ? node.material : [node.material];
      list.forEach(m => usedMats.add(m));
    }
  });

  const metrics = {
    calls: 0,
    triangles: 0,
    colonyTriangles: triangleCount(colony),
    terrainTriangles: triangleCount(terrain) + triangleCount(rockScatter),
    materials: usedMats.size,
    fps: 0,
    frames: 0,
    pixelRatio: renderer.getPixelRatio(),
    pieceCount: layout.placements.length,
    visibility: document.visibilityState,
  };

  let elapsed = 0;
  let sampleFrames = 0;
  const stop = startLoop(shell.viewport, dt => {
    renderer.info.reset();
    stats.begin();
    navigation.update(dt);
    skyMesh.position.copy(camera.position);
    composer.render(dt);
    stats.end();
    stats.update();

    metrics.calls = renderer.info.render.calls;
    metrics.triangles = renderer.info.render.triangles;
    metrics.frames += 1;
    metrics.visibility = document.visibilityState;
    elapsed += dt;
    sampleFrames += 1;
    if (elapsed >= 0.5) {
      metrics.fps = Math.round(sampleFrames / elapsed);
      metrics.pixelRatio = renderer.getPixelRatio();
      elapsed = 0;
      sampleFrames = 0;
      shell.metrics.textContent = [
        `draw calls ${metrics.calls}`,
        `triangles ${metrics.triangles.toLocaleString("en-US")}`,
        `colony ${metrics.colonyTriangles.toLocaleString("en-US")}`,
        `fps ${metrics.fps}`,
      ].join(" | ");
    }
    if (shell.balanced.checked) governor.update(dt);
  });

  window.addEventListener("pagehide", () => {
    stop();
    navigation.dispose();
    joystick.dispose();
    sky.dispose();
    disposeRockScatter(rockScatter);
    rendering.dispose();
  }, { once: true });

  window.__exterior = {
    metrics,
    setView: (index: number) => {
      const v = layout.views[index];
      if (v) applyView(v);
    },
  };
}

declare global {
  interface Window {
    __exterior?: {
      metrics: {
        calls: number;
        triangles: number;
        colonyTriangles: number;
        terrainTriangles: number;
        materials: number;
        fps: number;
        frames: number;
        pixelRatio: number;
        pieceCount: number;
        visibility: DocumentVisibilityState;
      };
      setView: (index: number) => void;
    };
  }
}
