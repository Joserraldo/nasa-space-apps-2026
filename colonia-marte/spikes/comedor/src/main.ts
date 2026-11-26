import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import {
  BloomEffect, EffectComposer, EffectPass, RenderPass, SMAAEffect, SMAAPreset,
  ToneMappingEffect, ToneMappingMode,
} from "postprocessing";
import { N8AOPostPass } from "n8ao";
import "./kit/pieces/architecture";
import "./kit/pieces/furniture";
import { registeredIds } from "./kit/registry";
import { geometryCount } from "./kit/primitives/geometry";
import { materialCount } from "./materials/palette";
import { buildRoom, mergeStatic, type RoomLayout } from "./room";
import layout from "../data/canteen.json";

const renderer = new THREE.WebGLRenderer({ powerPreference: "high-performance", antialias: false, stencil: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.NoToneMapping;
renderer.info.autoReset = false;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color("#0d1014");
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.3;

scene.add(new THREE.HemisphereLight("#e8f1ff", "#5b6470", 0.8));
const key = new THREE.DirectionalLight("#ffffff", 0.45);
key.position.set(4, 8, 12);
scene.add(key);

const { group, stats } = buildRoom(layout as RoomLayout);
const merged = mergeStatic(group);
scene.add(merged);

const camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.05, 60);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const VIEWS: Record<string, { pos: [number, number, number]; target: [number, number, number]; fov: number }> = {
  reference: { pos: [4.6, 1.5, 6.4], target: [7.8, 1.25, 0.6], fov: 70 },
  wide: { pos: [12.6, 2.3, 9.3], target: [6.0, 0.9, 3.0], fov: 62 },
  tables: { pos: [1.6, 1.6, 9.0], target: [8.0, 0.8, 5.0], fov: 60 },
};
function setView(name: string): void {
  const v = VIEWS[name] ?? VIEWS.reference;
  camera.position.set(...v.pos);
  controls.target.set(...v.target);
  camera.fov = v.fov;
  camera.updateProjectionMatrix();
  controls.update();
}
setView(new URLSearchParams(location.search).get("view") ?? "reference");

const composer = new EffectComposer(renderer, { frameBufferType: THREE.HalfFloatType });
composer.addPass(new RenderPass(scene, camera));
const ao = new N8AOPostPass(scene, camera, window.innerWidth, window.innerHeight);
ao.configuration.aoRadius = 0.9;
ao.configuration.distanceFalloff = 1.0;
ao.configuration.intensity = 4.5;
ao.configuration.color = new THREE.Color("#0b1018");
ao.setQualityMode("Medium");
composer.addPass(ao);
composer.addPass(new EffectPass(
  camera,
  new BloomEffect({ luminanceThreshold: 0.95, luminanceSmoothing: 0.12, intensity: 0.75, mipmapBlur: true, radius: 0.7 }),
  new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC }),
));
composer.addPass(new EffectPass(camera, new SMAAEffect({ preset: SMAAPreset.HIGH })));

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
});
addEventListener("keydown", (e) => {
  if (e.key === "1") setView("reference");
  if (e.key === "2") setView("wide");
  if (e.key === "3") setView("tables");
});

const hud = document.getElementById("hud")!;
const metrics = { calls: 0, triangles: 0, fps: 0, materials: 0, geometries: 0, pieces: stats.pieces, ids: registeredIds().length };
let frames = 0;
let last = performance.now();
function loop(): void {
  renderer.info.reset();
  controls.update();
  composer.render();
  metrics.calls = renderer.info.render.calls;
  metrics.triangles = renderer.info.render.triangles;
  frames++;
  const now = performance.now();
  if (now - last >= 1000) {
    metrics.fps = Math.round((frames * 1000) / (now - last));
    frames = 0;
    last = now;
    metrics.materials = materialCount();
    metrics.geometries = geometryCount();
    hud.textContent =
      `canteen spike | pieces ${metrics.pieces} (${metrics.ids} ids) | draw calls ${metrics.calls} | ` +
      `tris ${metrics.triangles.toLocaleString("en-US")} | materials ${metrics.materials} | fps ${metrics.fps} | keys 1-3 views`;
  }
  requestAnimationFrame(loop);
}
loop();

declare global {
  interface Window { __spike: { setView: typeof setView; metrics: typeof metrics } }
}
window.__spike = { setView, metrics };
