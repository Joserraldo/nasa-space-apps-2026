import { Group, LOD, Mesh, Object3D, SphereGeometry, type Material } from "three";
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

export interface VehicleCameraPreset {
  id: string;
  label: string;
  offset: [number, number, number];
  target: [number, number, number];
  fov: number;
}

export async function mountVehiclesReview(): Promise<void> {
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
  document.title = "C4 Vehicles Review (/vehicles) | Mars Colony";

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
    { x: 0, z: 2.0, radius: 32.0 },
    { x: -9.5, z: 6.0, radius: 16.0 },
    { x: 8.5, z: -2.0, radius: 16.0 },
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
  stage.name = "vehicles_stage";
  const lodList: LOD[] = [];
  const wheelNodes: Object3D[] = [];
  const blinkNodes: Object3D[] = [];

  const placeVehicle = (
    id: string,
    params: Record<string, unknown>,
    x: number,
    z: number,
    rotDeg: number,
    ySink = -0.02,
  ) => {
    const lod = buildVehicleLOD(registry, id, params);
    const groundY = terrainHeight(x, z, terrainOpts);
    lod.position.set(x, groundY + ySink, z);
    lod.rotation.y = (rotDeg * Math.PI) / 180;
    lod.traverse(node => {
      if (node instanceof Mesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
      if (node.userData?.wheel === true) wheelNodes.push(node);
      if (node.name === "stranded-amber-beacon") blinkNodes.push(node);
    });
    stage.add(lod);
    lodList.push(lod);
    return lod;
  };

  const placeAtY = (
    id: string,
    params: Record<string, unknown>,
    x: number,
    y: number,
    z: number,
    rotDeg: number,
    distances?: readonly [number, number, number],
  ) => {
    const lod = buildVehicleLOD(registry, id, params, distances);
    lod.position.set(x, y, z);
    lod.rotation.y = (rotDeg * Math.PI) / 180;
    lod.traverse(node => {
      if (node instanceof Mesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
      if (node.userData?.wheel === true) wheelNodes.push(node);
      if (node.name === "stranded-amber-beacon") blinkNodes.push(node);
    });
    stage.add(lod);
    lodList.push(lod);
    return lod;
  };

  const hasNX01 = registry.ids().includes("NX-01");
  const hasMV11 = registry.ids().includes("MV-11");
  const hasMV03 = registry.ids().includes("MV-03");

  const gx = -2.2;
  const gz = 8.4;
  const footprintSamples = [
    terrainHeight(gx, gz, terrainOpts),
    terrainHeight(gx - 7.0, gz - 4.8, terrainOpts),
    terrainHeight(gx + 7.0, gz - 4.8, terrainOpts),
    terrainHeight(gx - 7.0, gz + 4.8, terrainOpts),
    terrainHeight(gx + 7.0, gz + 4.8, terrainOpts),
    terrainHeight(gx + 3.0, gz - 4.8, terrainOpts),
  ];
  const garageBaseY = Math.max(...footprintSamples) - 0.34;
  const deckY = garageBaseY + 0.48;

  if (hasNX01) {
    // Stage NX-01 3-bay vehicle charging garage facing -Z into AMB-04 sunlight (`local +bx -> world gx - bx`):
    // Bay 1 (Heavy MV-01) at x = gx + 4.60 = +2.40 | Bay 2 (MV-03) at x = gx = -2.20 | Bay 3 (MV-11) at x = gx - 4.60 = -6.80
    placeAtY("NX-01", {}, gx, garageBaseY, gz, 180, [0, 38, 88]);
    placeAtY("MV-01", {}, gx + 4.60, deckY, gz - 3.35, -172);
    if (hasMV03) {
      placeAtY("MV-03", {}, gx, deckY, gz - 2.95, -166);
    }
    if (hasMV11) {
      placeAtY("MV-11", { state: "rescued" }, gx - 4.60, deckY, gz - 1.85, 180);
      placeVehicle("MV-11", { state: "stranded" }, 7.6, -1.8, -138, -0.21);
    }
  } else {
    placeVehicle("MV-01", {}, -4.2, 0.4, -108, -0.02);
    if (hasMV11) {
      placeVehicle("MV-11", { state: "stranded" }, 2.1, -1.6, -138, -0.21);
      placeVehicle("MV-11", { state: "rescued" }, 6.8, -0.4, -132, -0.02);
    }
    if (hasMV03) {
      placeVehicle("MV-03", {}, -9.8, -2.6, -78, -0.02);
    }
  }

  scene.add(stage);

  const baseY = terrainHeight(0, 0, terrainOpts);
  const views: VehicleCameraPreset[] = hasNX01
    ? [
      {
        id: "overview",
        label: "Overview",
        offset: [-0.8, deckY + 6.8, -8.8],
        target: [-0.2, deckY + 1.35, 5.2],
        fov: 46,
      },
      {
        id: "nx-01",
        label: "NX-01 Garage",
        // Elevated 3/4 isometric garage & apron view matching v3-t050.10 composition!
        offset: [-12.6, deckY + 6.4, -3.4],
        target: [-1.8, deckY + 1.55, 6.8],
        fov: 43,
      },
      {
        id: "mv-01",
        label: "MV-01 Truck",
        offset: [7.6, deckY + 2.45, -0.6],
        target: [2.4, deckY + 1.15, 5.05],
        fov: 40,
      },
      {
        id: "mv-03",
        label: "MV-03 Buggy",
        offset: [-6.6, deckY + 1.95, 0.4],
        target: [-2.2, deckY + 0.88, 5.45],
        fov: 39,
      },
      {
        id: "mv-11-stranded",
        label: "MV-11 Stranded",
        offset: [4.45, terrainHeight(7.6, -1.8, terrainOpts) + 1.78, -5.25],
        target: [7.55, terrainHeight(7.6, -1.8, terrainOpts) + 0.72, -1.75],
        fov: 38,
      },
    ]
    : [
      {
        id: "overview",
        label: "Overview",
        offset: [-3.2, baseY + 5.1, -13.6],
        target: [hasMV03 ? -0.9 : 0.9, baseY + 1.05, -0.3],
        fov: 47,
      },
      {
        id: "mv-01",
        label: "MV-01 Truck",
        offset: [-9.25, baseY + 2.72, -5.65],
        target: [-4.05, baseY + 0.98, 0.42],
        fov: 40,
      },
    ];

  const joystick = createJoystick(shell.joystick);
  const navigation = createNavigation(camera, renderer.domElement, joystick.state);

  const applyView = (v: VehicleCameraPreset) => {
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
    shell.status.textContent = "VEHICLES";
    shell.fade.style.opacity = "0";
  };

  const viewParam = query.get("view") ?? "overview";
  const initialView = views.find(v => v.id === viewParam)
    ?? views[Math.max(0, Number(viewParam) - 1)]
    ?? views[0];
  applyView(initialView);

  let spinWheels = query.get("spin") === "1";

  const controls = document.getElementById("controls");
  if (controls) {
    const viewBar = document.createElement("div");
    viewBar.className = "modes";
    for (const v of views) {
      const btn = createButton({
        id: `veh-view-${v.id}`,
        label: v.label,
        style: "Single Stroke",
        size: "Medium",
      });
      btn.onclick = () => applyView(v);
      viewBar.append(btn);
    }
    const spinBtn = createButton({
      id: "veh-spin-toggle",
      label: "Spin Wheels",
      style: "Single Stroke",
      size: "Medium",
    });
    spinBtn.onclick = () => { spinWheels = !spinWheels; };
    viewBar.append(spinBtn);
    controls.prepend(viewBar);
  }

  const sideHeading = document.querySelector("aside h2");
  if (sideHeading) sideHeading.textContent = "C4 Vehicles Review";
  const scopeNote = document.querySelector(".scope-note");
  if (scopeNote) {
    scopeNote.textContent = `Jezero AMB-04 vehicle proving ground (${lodList.length} LOD vehicles, rotatable axles).`;
  }

  shell.reset.onclick = () => applyView(views[0]);
  shell.orbit.onclick = () => applyView(views[0]);
  shell.walk.onclick = () => {
    const wy = terrainHeight(0, 9.5, terrainOpts) + 1.5;
    camera.position.set(0, wy, 9.5);
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
    vehicleTriangles: lod0Tris,
    terrainTriangles: triangleCount(terrain) + triangleCount(rockScatter),
    materials: usedMats.size,
    fps: 0,
    frames: 0,
    pixelRatio: renderer.getPixelRatio(),
    vehicleCount: lodList.length,
    visibility: document.visibilityState,
  };

  let elapsed = 0;
  let sampleFrames = 0;
  let clockSec = 0;
  const stop = startLoop(shell.viewport, dt => {
    clockSec += dt;
    renderer.info.reset();
    stats.begin();
    navigation.update(dt);
    skyMesh.position.copy(camera.position);
    for (const lod of lodList) lod.update(camera);
    if (spinWheels) {
      for (const w of wheelNodes) w.rotation.x += dt * 2.4;
    }
    if (blinkNodes.length > 0 && query.get("static") !== "1") {
      const amberOn = clockSec % 1.4 < 0.85;
      for (const b of blinkNodes) b.visible = amberOn;
    }
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
        `vehicles ${metrics.vehicleTriangles.toLocaleString("en-US")}`,
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

  window.__vehicles = {
    metrics,
    setView: (idOrIndex: string | number) => {
      const v = typeof idOrIndex === "string"
        ? views.find(item => item.id === idOrIndex)
        : views[idOrIndex];
      if (v) applyView(v);
    },
    setCamera: (pos: [number, number, number], target: [number, number, number], fov = 42) => {
      navigation.setMode("orbit");
      camera.fov = fov;
      camera.position.set(pos[0], pos[1], pos[2]);
      navigation.orbit.target.set(target[0], target[1], target[2]);
      camera.updateProjectionMatrix();
      navigation.orbit.update();
      skyMesh.position.copy(camera.position);
    },
    setSpin: (enabled: boolean) => { spinWheels = enabled; },
  };
}

declare global {
  interface Window {
    __vehicles?: {
      metrics: {
        calls: number;
        triangles: number;
        vehicleTriangles: number;
        terrainTriangles: number;
        materials: number;
        fps: number;
        frames: number;
        pixelRatio: number;
        vehicleCount: number;
        visibility: DocumentVisibilityState;
      };
      setView: (idOrIndex: string | number) => void;
      setCamera: (pos: [number, number, number], target: [number, number, number], fov?: number) => void;
      setSpin: (enabled: boolean) => void;
    };
  }
}
