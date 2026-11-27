import { InstancedMesh, MathUtils, Mesh, SphereGeometry, type Material, type Object3D } from "three";
import districtJson from "../../data/layouts/colonies/base-district.json";
import demURL from "../../data/terrain/jezero-elevation.bin?url";
import { startLoop } from "../core/loop";
import { createRendering } from "../core/rendering";
import { createShell } from "../core/shell";
import { applyEnvironment } from "../environment/apply";
import { decodeJezeroDEM } from "../environment/dem";
import { presets } from "../environment/presets";
import { createJezeroRockScatter, disposeRockScatter, type RockExclusionZone } from "../environment/rock-scatter";
import { createTerrain } from "../environment/terrain";
import { createProductionRegistry } from "../kit/pieces";
import { plazaContains, plazaOutline } from "../kit/pieces/mars/colony-plaza";
import { parseColonyPaving, streetClearance } from "../kit/pieces/mars/colony-street";
import { paletteHex } from "../materials/palette";
import { getScreens } from "../materials/screens";
import { materials, terrainUniforms } from "../materials/shared";
import { createJoystick } from "../navigation/joystick";
import { createResolutionGovernor, deviceProfile } from "../navigation/mobile-optimizer";
import { createNavigation } from "../navigation/mode-controller";
import { createButton } from "../ui";
import { countColonyTriangles } from "./colony-batches";
import {
  buildColonyGroup,
  computeFlatPlatformHeight,
  parseColonyLayout,
  type ColonyLayout,
  type ColonyViewSpec,
} from "./colony-layout";
import { applyExteriorLightingCalibration } from "./exterior-pilot";

export function countVisibleDrawCalls(root: Object3D): number {
  let calls = 0;
  const walk = (node: Object3D) => {
    if (!node.visible) return;
    if (node instanceof Mesh) calls += 1;
    for (const child of node.children) walk(child);
  };
  walk(root);
  return calls;
}

export function countVisibleTriangles(root: Object3D): number {
  let tris = 0;
  const walk = (node: Object3D) => {
    if (!node.visible) return;
    if (node instanceof Mesh) {
      const idx = node.geometry.index?.count ?? node.geometry.getAttribute("position").count;
      tris += (idx / 3) * (node instanceof InstancedMesh ? node.count : 1);
    }
    for (const child of node.children) walk(child);
  };
  walk(root);
  return tris;
}

function buildDistrictRockExclusions(layout: ColonyLayout): RockExclusionZone[] {
  const zones: RockExclusionZone[] = [{ x: 0, z: 2, radius: 34.0 }];
  for (const item of layout.placements) {
    if (item.id === "MI-01") {
      const spec = parseColonyPaving(item.params ?? {});
      const angle = MathUtils.degToRad(item.rot ?? 0);
      const c = Math.cos(angle), s = Math.sin(angle);
      const addZone = (x: number, z: number, radius: number) =>
        zones.push({ x: item.at[0] + x * c + z * s, z: item.at[1] + z * c - x * s, radius });
      if (spec.layout === "plaza") {
        const [width, depth] = spec.size;
        const boundary = plazaOutline(spec);
        const cols = Math.ceil(width / 3.2), rows = Math.ceil(depth / 3.2);
        for (let i = 0; i < cols; i++) {
          for (let j = 0; j < rows; j++) {
            const x = width * ((i + 0.5) / cols - 0.5);
            const z = depth * ((j + 0.5) / rows - 0.5);
            if (plazaContains(boundary, x, z)) addZone(x, z, 3.6);
          }
        }
      } else {
        for (const { center, radius } of streetClearance(spec)) {
          addZone(center.x, center.y, radius + 1.2);
        }
      }
      continue;
    }
    zones.push({ x: item.at[0], z: item.at[1], radius: 6.5 });
  }
  for (const view of layout.views) {
    zones.push({ x: view.position[0], z: view.position[2], radius: 4.5 });
  }
  return zones;
}

export async function mountBaseDistrict(): Promise<void> {
  const shell = createShell(false);
  const query = new URLSearchParams(location.search);
  const rendering = createRendering(shell.viewport);
  getScreens();
  const { renderer, scene, camera, composer, stats } = rendering;
  if (query.get("clean") === "1") stats.dom.style.display = "none";

  camera.far = 60000;
  camera.near = 0.15;
  camera.updateProjectionMatrix();

  const registry = createProductionRegistry();
  const layout = parseColonyLayout(districtJson, registry);
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
    exclusions: buildDistrictRockExclusions(layout),
  });
  terrainUniforms.biome.value = 0;
  terrainUniforms.useMask.value = 1;
  terrainUniforms.oxide.value.set(paletteHex("oxide"));
  terrainUniforms.shade.value.set(paletteHex("regolithShade"));
  scene.add(terrain, rockScatter);

  const preset = presets.find(p => p.id === layout.environment) ?? presets[3];
  applyEnvironment(rendering, preset);
  applyExteriorLightingCalibration(rendering);
  rendering.ao.configuration.halfRes = true;

  const platformY = computeFlatPlatformHeight(layout, dem);
  const colony = buildColonyGroup(layout, registry, dem);
  scene.add(colony);

  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;

  const joystick = createJoystick(shell.joystick);
  const navigation = createNavigation(camera, renderer.domElement, joystick.state);

  const applyView = (view: ColonyViewSpec) => {
    navigation.setMode("orbit");
    camera.fov = view.fov;
    camera.position.set(view.position[0], platformY + view.position[1], view.position[2]);
    navigation.orbit.target.set(view.target[0], platformY + view.target[1], view.target[2]);
    camera.updateProjectionMatrix();
    navigation.orbit.update();
    camera.updateMatrixWorld();
    colony.updateLods(camera);
    renderer.shadowMap.needsUpdate = true;
    skyMesh.position.copy(camera.position);
    joystick.setVisible(false);
    shell.orbit.setAttribute("aria-pressed", "true");
    shell.walk.setAttribute("aria-pressed", "false");
    shell.status.textContent = "BASE DISTRICT";
    shell.fade.style.opacity = "0";
  };

  const rawView = query.get("view") ?? "1";
  const byId = layout.views.find(v => v.id === rawView);
  const numIdx = Number(rawView);
  const initialView = byId ?? (Number.isInteger(numIdx) && numIdx >= 1 ? layout.views[numIdx - 1] : undefined) ?? layout.views[0];
  applyView(initialView);

  const controls = document.getElementById("controls");
  if (controls) {
    const viewBar = document.createElement("div");
    viewBar.className = "modes";
    viewBar.style.flexWrap = "wrap";
    layout.views.forEach((view, idx) => {
      const btn = createButton({
        id: `district-view-${idx + 1}`,
        label: view.label,
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
    scopeNote.textContent = `Dense urban-industrial Mars base district (${layout.placements.length} placements, mid-gray plaza, <= 80 draw calls).`;
  }

  shell.reset.onclick = () => applyView(layout.views[0]);
  shell.orbit.onclick = () => applyView(layout.views[0]);
  shell.walk.onclick = () => {
    camera.position.set(-9.2, platformY + 1.65, 22.0);
    navigation.setMode("walk");
    joystick.setVisible(true);
    shell.orbit.setAttribute("aria-pressed", "false");
    shell.walk.setAttribute("aria-pressed", "true");
    shell.status.textContent = "WALK";
    renderer.domElement.focus({ preventScroll: true });
  };

  const profile = deviceProfile(matchMedia("(pointer: coarse)").matches, innerWidth, innerHeight, devicePixelRatio);
  const applyRatio = (ratio: number) => {
    renderer.setPixelRatio(ratio);
    rendering.resize();
  };
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
    districtCalls: countVisibleDrawCalls(colony),
    triangles: 0,
    districtTriangles: countVisibleTriangles(colony),
    detailedDistrictTriangles: colony.detailedTriangles,
    terrainTriangles: countColonyTriangles(terrain) + countColonyTriangles(rockScatter),
    materials: usedMats.size,
    fps: 0,
    frames: 0,
    pixelRatio: renderer.getPixelRatio(),
    pieceCount: layout.placements.length,
    platformY,
    visibility: document.visibilityState,
  };

  let elapsed = 0;
  let sampleFrames = 0;
  const stop = startLoop(shell.viewport, dt => {
    renderer.info.reset();
    stats.begin();
    navigation.update(dt);
    camera.updateMatrixWorld();
    if (colony.updateLods(camera)) {
      renderer.shadowMap.needsUpdate = true;
      metrics.districtCalls = countVisibleDrawCalls(colony);
      metrics.districtTriangles = countVisibleTriangles(colony);
    }
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
      metrics.districtCalls = countVisibleDrawCalls(colony);
      metrics.districtTriangles = countVisibleTriangles(colony);
      elapsed = 0;
      sampleFrames = 0;
      shell.metrics.textContent = [
        `district calls ${metrics.districtCalls} (scene ${metrics.calls})`,
        `district tris ${metrics.districtTriangles.toLocaleString("en-US")}`,
        `fps ${metrics.fps}`,
      ].join(" | ");
    }
    if (shell.balanced.checked) governor.update(dt);
  });

  window.addEventListener(
    "pagehide",
    () => {
      stop();
      navigation.dispose();
      joystick.dispose();
      sky.dispose();
      disposeRockScatter(rockScatter);
      colony.dispose();
      rendering.dispose();
    },
    { once: true },
  );

  window.__baseDistrict = {
    metrics,
    setView: (idOrIndex: string | number) => {
      const v = typeof idOrIndex === "string" ? layout.views.find(x => x.id === idOrIndex) : layout.views[idOrIndex];
      if (v) applyView(v);
    },
    setCamera: (pos: [number, number, number], target: [number, number, number], fov = 40) => {
      navigation.setMode("orbit");
      camera.fov = fov;
      camera.position.set(pos[0], platformY + pos[1], pos[2]);
      navigation.orbit.target.set(target[0], platformY + target[1], target[2]);
      camera.updateProjectionMatrix();
      navigation.orbit.update();
      camera.updateMatrixWorld();
      colony.updateLods(camera);
      renderer.shadowMap.needsUpdate = true;
      skyMesh.position.copy(camera.position);
    },
  };
}

declare global {
  interface Window {
    __baseDistrict?: {
      metrics: {
        calls: number;
        districtCalls: number;
        triangles: number;
        districtTriangles: number;
        detailedDistrictTriangles: number;
        terrainTriangles: number;
        materials: number;
        fps: number;
        frames: number;
        pixelRatio: number;
        pieceCount: number;
        platformY: number;
        visibility: DocumentVisibilityState;
      };
      setView: (idOrIndex: string | number) => void;
      setCamera: (pos: [number, number, number], target: [number, number, number], fov?: number) => void;
    };
  }
}
