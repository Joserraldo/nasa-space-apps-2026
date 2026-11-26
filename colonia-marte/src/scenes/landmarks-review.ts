import { Group, LOD, Mesh, SphereGeometry, type Material } from "three";
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
import { buildVehicleLOD } from "../kit/pieces/mars/rover-truck";
import { paletteHex } from "../materials/palette";
import { getScreens } from "../materials/screens";
import { materials, terrainUniforms } from "../materials/shared";
import { createJoystick } from "../navigation/joystick";
import { createResolutionGovernor, deviceProfile } from "../navigation/mobile-optimizer";
import { createNavigation } from "../navigation/mode-controller";
import { createButton } from "../ui";
import { triangleCount } from "../../tools/geometry-inspection";
import { applyExteriorLightingCalibration } from "./exterior-pilot";

export interface LandmarkCameraPreset {
  id: string;
  label: string;
  offset: [number, number, number];
  target: [number, number, number];
  fov: number;
}

export async function mountLandmarksReview(): Promise<void> {
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
  document.title = "Colony Landmarks Review (/landmarks) | Mars Colony";

  const response = await fetch(demURL);
  if (!response.ok) throw new Error(`DEM load failed: ${response.status}`);
  const dem = decodeJezeroDEM(await response.arrayBuffer());

  const sky = new SphereGeometry(48000, 48, 24);
  const skyMesh = new Mesh(sky, materials.M_sky);
  skyMesh.renderOrder = -10;
  skyMesh.material.depthWrite = false;
  scene.add(skyMesh);

  const terrainOpts = { biome: "jezero" as const, seed: 42, dem };
  const exclusions: RockExclusionZone[] = [
    { x: 0, z: 0, radius: 28.0 },
  ];
  const terrain = createTerrain(terrainOpts);
  const rockScatter = createJezeroRockScatter({
    seed: 42,
    lod: 0,
    dem,
    exclusions,
  });
  terrainUniforms.biome.value = 0;
  terrainUniforms.useMask.value = 1;
  terrainUniforms.oxide.value.set(paletteHex("oxide"));
  terrainUniforms.shade.value.set(paletteHex("regolithShade"));
  scene.add(terrain, rockScatter);

  const preset = presets.find(p => p.id === "AMB-04") ?? presets[3];
  applyEnvironment(rendering, preset);
  applyExteriorLightingCalibration(rendering);

  const stage = new Group();
  stage.name = "landmarks_stage";
  const lodList: LOD[] = [];

  const placeLandmark = (
    id: string,
    params: Record<string, unknown>,
    x: number,
    z: number,
    rotDeg: number,
    ySink = -0.22,
  ) => {
    const lod = buildVehicleLOD(registry, id, params, [0, 55, 130]);
    const groundY = Math.max(
      terrainHeight(x, z, terrainOpts),
      terrainHeight(x - 3.2, z - 3.2, terrainOpts),
      terrainHeight(x + 3.2, z - 3.2, terrainOpts),
      terrainHeight(x - 3.2, z + 3.2, terrainOpts),
      terrainHeight(x + 3.2, z + 3.2, terrainOpts),
    );
    lod.position.set(x, groundY + ySink, z);
    lod.rotation.y = (rotDeg * Math.PI) / 180;
    lod.traverse(node => {
      if (node instanceof Mesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });
    stage.add(lod);
    lodList.push(lod);
    return lod;
  };

  // Stage MB-14 entrance tower facing -Z (`rotDeg = 180`) into AMB-04 sunlight so front entrance & 3/4 pilasters shine!
  placeLandmark("MB-14", {}, 0, 0, 180, -0.24);
  scene.add(stage);

  const baseY = terrainHeight(0, 0, terrainOpts);
  const views: LandmarkCameraPreset[] = [
    {
      id: "mb-14",
      label: "MB-14 Entrance Tower",
      // Balanced 3/4 landmark perspective framing full 23.6 m slender glowing-panel tower across Jezero horizon
      offset: [-15.4, baseY + 13.6, -24.8],
      target: [0.0, baseY + 11.2, 0.0],
      fov: 45,
    },
    {
      id: "mb-14-crown",
      label: "MB-14 Crown & Spires",
      offset: [-9.2, baseY + 15.8, -11.4],
      target: [0.0, baseY + 17.2, 0.0],
      fov: 42,
    },
    {
      id: "overview",
      label: "Wide Landmark View",
      offset: [-21.0, baseY + 11.5, -28.0],
      target: [0.0, baseY + 9.8, 0.0],
      fov: 46,
    },
  ];

  const joystick = createJoystick(shell.joystick);
  const navigation = createNavigation(camera, renderer.domElement, joystick.state);

  const applyView = (v: LandmarkCameraPreset) => {
    navigation.setMode("orbit");
    camera.fov = v.fov;
    camera.position.set(v.offset[0], v.offset[1], v.offset[2]);
    navigation.orbit.target.set(v.target[0], v.target[1], v.target[2]);
    camera.updateProjectionMatrix();
    navigation.orbit.update();
    skyMesh.position.copy(camera.position);
    joystick.setVisible(false);
    shell.orbit.setAttribute("aria-pressed", "true");
    shell.walk.setAttribute("aria-pressed", "false");
    shell.status.textContent = "LANDMARKS";
    shell.fade.style.opacity = "0";
  };

  const viewParam = query.get("view") ?? "mb-14";
  const initialView = views.find(v => v.id === viewParam) ?? views[0];
  applyView(initialView);

  const controls = document.getElementById("controls");
  if (controls) {
    const viewBar = document.createElement("div");
    viewBar.className = "modes";
    for (const v of views) {
      const btn = createButton({
        id: `lm-view-${v.id}`,
        label: v.label,
        style: "Single Stroke",
        size: "Medium",
      });
      btn.onclick = () => applyView(v);
      viewBar.append(btn);
    }
    controls.prepend(viewBar);
  }

  const sideHeading = document.querySelector("aside h2");
  if (sideHeading) sideHeading.textContent = "Colony Landmarks Review";
  const scopeNote = document.querySelector(".scope-note");
  if (scopeNote) {
    scopeNote.textContent = `Jezero AMB-04 landmark proving ground (${lodList.length} LOD pieces).`;
  }

  shell.reset.onclick = () => applyView(views[0]);
  shell.orbit.onclick = () => applyView(views[0]);
  shell.walk.onclick = () => {
    const wy = terrainHeight(0, -18.0, terrainOpts) + 1.6;
    camera.position.set(0, wy, -18.0);
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
  stage.traverse(node => {
    if (node instanceof Mesh) {
      const list = Array.isArray(node.material) ? node.material : [node.material];
      list.forEach(m => usedMats.add(m));
    }
  });

  const lod0Tris = lodList.reduce((acc, lod) => acc + triangleCount(lod.levels[0].object), 0);

  const metrics = {
    calls: 0,
    triangles: 0,
    landmarkTriangles: lod0Tris,
    terrainTriangles: triangleCount(terrain) + triangleCount(rockScatter),
    materials: usedMats.size,
    fps: 0,
    frames: 0,
    pixelRatio: renderer.getPixelRatio(),
    landmarkCount: lodList.length,
    visibility: document.visibilityState,
  };

  let elapsed = 0;
  let sampleFrames = 0;
  const stop = startLoop(shell.viewport, dt => {
    renderer.info.reset();
    stats.begin();
    navigation.update(dt);
    skyMesh.position.copy(camera.position);
    for (const lod of lodList) lod.update(camera);
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
        `landmarks ${metrics.landmarkTriangles.toLocaleString("en-US")}`,
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

  window.__landmarks = {
    metrics,
    setView: (idOrIndex: string | number) => {
      const v = typeof idOrIndex === "string"
        ? views.find(item => item.id === idOrIndex)
        : views[idOrIndex];
      if (v) applyView(v);
    },
  };
}

declare global {
  interface Window {
    __landmarks?: {
      metrics: {
        calls: number;
        triangles: number;
        landmarkTriangles: number;
        terrainTriangles: number;
        materials: number;
        fps: number;
        frames: number;
        pixelRatio: number;
        landmarkCount: number;
        visibility: DocumentVisibilityState;
      };
      setView: (idOrIndex: string | number) => void;
    };
  }
}
