import { Color, DirectionalLight, HemisphereLight, Mesh, SphereGeometry, type Material, type PerspectiveCamera } from "three";
import { buildRoomFromLayout, parseRoomLayout, type RoomCameraView } from "../catalog/layout";
import { startLoop } from "../core/loop";
import { createRendering } from "../core/rendering";
import { createShell } from "../core/shell";
import { applyEnvironment } from "../environment/apply";
import { presets } from "../environment/presets";
import { createProductionRegistry } from "../kit/pieces";
import { paletteHex } from "../materials/palette";
import { getScreens } from "../materials/screens";
import { materials as sharedMats } from "../materials/shared";
import { createJoystick } from "../navigation/joystick";
import { createResolutionGovernor, deviceProfile } from "../navigation/mobile-optimizer";
import { createNavigation } from "../navigation/mode-controller";
import { createButton } from "../ui";
import { bakeRoomAO } from "../../tools/bake-room-ao";
import { restoreAOCache, serializeAOCache, type AOCache } from "../../tools/bake-vertex-ao";
import { triangleCount } from "../../tools/geometry-inspection";

export interface RoomViewerMetrics {
  calls: number;
  triangles: number;
  sceneTriangles: number;
  materials: number;
  fps: number;
  frames: number;
  pixelRatio: number;
  aoBakeMs: number;
  pieceCount: number;
  visibility: DocumentVisibilityState;
}

function loadCachedAO(key: string): AOCache {
  try {
    const raw = localStorage.getItem(key);
    return raw ? restoreAOCache(raw) : new Map();
  } catch {
    return new Map();
  }
}

/**
 * Calibrate AMB-02 interior lighting so #D4D2C2 panels read luminous crisp white
 * (barely warm, never sandy beige) and ceilings/columns stay airy with cool gray beams.
 */
export function applyInteriorCalibration(
  rendering: ReturnType<typeof createRendering>,
  environmentId: string,
): void {
  const amb = presets.find(preset => preset.id === environmentId) ?? presets[1];
  applyEnvironment(rendering, amb);

  const skyUniforms = sharedMats.M_sky.uniforms;
  skyUniforms.zenith.value.set("#050c1a");
  skyUniforms.horizon.value.set("#071122");
  skyUniforms.sunHalo.value.set("#0b1b34");
  skyUniforms.stars.value = 1.5;
  rendering.scene.background = new Color(paletteHex("nightSky"));

  if (environmentId === "AMB-02") {
    const sun = rendering.scene.children.find(n => n instanceof DirectionalLight) as DirectionalLight | undefined;
    const hemi = rendering.scene.children.find(n => n instanceof HemisphereLight) as HemisphereLight | undefined;
    if (hemi) {
      hemi.color.set("#f3f1ff");
      hemi.groundColor.set("#ceccdf");
      hemi.intensity = 2.86;
    }
    if (sun) {
      sun.color.set("#f6f4ff");
      sun.intensity = 2.34;
    }
    rendering.renderer.toneMappingExposure = 1.15;
    rendering.bloom.intensity = 0.28;
    rendering.bloom.mipmapBlurPass.radius = 0.36;
  } else if (environmentId === "AMB-03") {
    // Shelter alert: keep fill lighting neutral so white/gray walls read crisp (|R-B| < 8);
    // amber lives exclusively in emergency LED strips and localized bunk point lights.
    const sun = rendering.scene.children.find(n => n instanceof DirectionalLight) as DirectionalLight | undefined;
    const hemi = rendering.scene.children.find(n => n instanceof HemisphereLight) as HemisphereLight | undefined;
    if (hemi) {
      hemi.color.set("#f3f1ff");
      hemi.groundColor.set("#d4d2e4");
      hemi.intensity = 3.04;
    }
    if (sun) {
      sun.color.set("#f6f4ff");
      sun.intensity = 2.42;
    }
    rendering.renderer.toneMappingExposure = 1.18;
    rendering.bloom.intensity = 0.28;
    rendering.bloom.mipmapBlurPass.radius = 0.35;
  }
}

/** Optional hooks so overlays (the game HUD preview) can follow the camera without owning the scene. */
export interface InteriorRoomHooks {
  onReady?: (context: { camera: PerspectiveCamera; viewport: HTMLElement }) => void;
  onFrame?: (dt: number) => void;
}

export function mountInteriorRoom(
  rawLayout: unknown, cacheKey: string, walkStart?: [number, number, number], hooks: InteriorRoomHooks = {},
): void {
  const shell = createShell(false);
  const query = new URLSearchParams(location.search);
  const rendering = createRendering(shell.viewport);
  getScreens();
  const { renderer, scene, camera, composer, stats } = rendering;
  if (query.get("clean") === "1") stats.dom.style.display = "none";

  const registry = createProductionRegistry();
  const layout = parseRoomLayout(rawLayout, registry);
  document.title = `${layout.name} | Mars Colony`;

  applyInteriorCalibration(rendering, layout.environment);

  const built = buildRoomFromLayout(layout, registry);
  const aoCache = loadCachedAO(cacheKey);
  const baked = bakeRoomAO(built.staticGroup, { samples: 48, radius: 0.95, strength: 0.92 }, aoCache);
  try {
    localStorage.setItem(cacheKey, serializeAOCache(aoCache));
  } catch {
    // Ignore storage quota errors
  }
  built.staticGroup.traverse(node => {
    if (node instanceof Mesh) node.geometry.dispose();
  });
  const skyDome = new Mesh(new SphereGeometry(90, 24, 16), sharedMats.M_sky);
  skyDome.position.y = -16;
  skyDome.name = "interior_sky_dome";
  scene.add(skyDome, baked.group, built.lightsGroup);

  const joystick = createJoystick(shell.joystick);
  const navigation = createNavigation(camera, renderer.domElement, joystick.state, layout);

  const applyView = (view: RoomCameraView) => {
    navigation.setMode("orbit");
    camera.fov = view.fov;
    camera.position.fromArray(view.position);
    navigation.orbit.target.fromArray(view.target);
    camera.updateProjectionMatrix();
    navigation.orbit.update();
    joystick.setVisible(false);
    shell.orbit.setAttribute("aria-pressed", "true");
    shell.walk.setAttribute("aria-pressed", "false");
    shell.status.textContent = "ORBIT";
    shell.fade.style.opacity = "0";
  };

  const viewParam = Number(query.get("view") ?? "1");
  const initialIndex = Number.isInteger(viewParam) && viewParam >= 1 ? viewParam - 1 : 0;
  applyView(layout.views[initialIndex] ?? layout.views[0]);

  const controls = document.getElementById("controls");
  if (controls && layout.views.length > 0) {
    const viewBar = document.createElement("div");
    viewBar.className = "modes";
    layout.views.forEach((view, idx) => {
      const btn = createButton({
        id: `room-view-${idx + 1}`,
        label: `Ref View ${idx + 1}`,
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
    scopeNote.textContent = `JSON layout (${built.pieceCount} pieces) + raytraced vertex AO + ${layout.environment}.`;
  }

  const defaultWalk: [number, number, number] = walkStart ?? [
    layout.size[0] * layout.module * 0.5,
    1.5,
    layout.size[1] * layout.module * 0.5,
  ];
  shell.reset.onclick = () => applyView(layout.views[0]);
  shell.orbit.onclick = () => applyView(layout.views[0]);
  shell.walk.onclick = () => {
    camera.position.fromArray(defaultWalk);
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

  const usedMaterials = new Set<Material>();
  baked.group.traverse(node => {
    if (node instanceof Mesh) {
      const list = Array.isArray(node.material) ? node.material : [node.material];
      list.forEach(mat => usedMaterials.add(mat));
    }
  });

  const metrics: RoomViewerMetrics = {
    calls: 0,
    triangles: 0,
    sceneTriangles: triangleCount(baked.group),
    materials: usedMaterials.size,
    fps: 0,
    frames: 0,
    pixelRatio: renderer.getPixelRatio(),
    aoBakeMs: Number(baked.milliseconds.toFixed(1)),
    pieceCount: built.pieceCount,
    visibility: document.visibilityState,
  };

  let elapsed = 0;
  let sampleFrames = 0;
  const stop = startLoop(shell.viewport, dt => {
    renderer.info.reset();
    stats.begin();
    navigation.update(dt);
    composer.render(dt);
    hooks.onFrame?.(dt);
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
        `materials ${metrics.materials}`,
        `fps ${metrics.fps}`,
        `AO ${metrics.aoBakeMs} ms`,
      ].join(" | ");
    }
    if (shell.balanced.checked) governor.update(dt);
  });

  window.addEventListener("pagehide", () => {
    stop();
    skyDome.geometry.dispose();
    navigation.dispose();
    joystick.dispose();
    rendering.dispose();
  }, { once: true });

  const handle = {
    metrics,
    setView: (index: number) => {
      const targetView = layout.views[index];
      if (targetView) applyView(targetView);
    },
  };
  hooks.onReady?.({ camera, viewport: shell.viewport });
  window.__room = handle;
  window.__canteen = handle;
}

declare global {
  interface Window {
    __room?: { metrics: RoomViewerMetrics; setView: (index: number) => void };
    __canteen?: { metrics: RoomViewerMetrics; setView: (index: number) => void };
  }
}
