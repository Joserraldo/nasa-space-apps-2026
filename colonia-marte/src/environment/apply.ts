import { Color, DirectionalLight, Fog, HemisphereLight, PCFSoftShadowMap, Vector3 } from "three";
import type { createRendering } from "../core/rendering";
import { materials, terrainUniforms } from "../materials/shared";
import { paletteHex } from "../materials/palette";
import type { EnvironmentPreset } from "./presets";

/** Hot application reuses lights, materials and composer. It never changes the comparison camera. */
export function applyEnvironment(rendering: ReturnType<typeof createRendering>, preset: EnvironmentPreset) {
  const { scene, renderer, ao, bloom } = rendering;
  const sun = scene.children.find(n => n instanceof DirectionalLight) as DirectionalLight;
  const hemisphere = scene.children.find(n => n instanceof HemisphereLight) as HemisphereLight;
  sun.color.set(paletteHex(preset.light.sun)); sun.intensity = preset.light.intensity;
  const direction = new Vector3(-0.4, preset.light.height, -0.7).normalize();
  sun.position.copy(direction).multiplyScalar(100);
  sun.castShadow = preset.shadows;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 220 });
  sun.shadow.camera.updateProjectionMatrix(); sun.shadow.bias = -0.0002; sun.shadow.normalBias = 0.05;
  hemisphere.color.set(paletteHex(preset.light.sky ?? preset.sky.horizon));
  hemisphere.groundColor.set(paletteHex(preset.light.ground)); hemisphere.intensity = preset.light.ambient;
  renderer.shadowMap.enabled = preset.shadows; renderer.shadowMap.type = PCFSoftShadowMap;
  scene.fog = new Fog(paletteHex(preset.fog.color), preset.fog.near, preset.fog.far);
  scene.background = new Color(paletteHex(preset.sky.horizon));
  const uniforms = materials.M_sky.uniforms;
  uniforms.zenith.value.set(paletteHex(preset.sky.zenith));
  uniforms.horizon.value.set(paletteHex(preset.sky.horizon));
  uniforms.sunHalo.value.set(paletteHex(preset.sky.halo));
  uniforms.sunDirection.value.copy(direction); uniforms.haloSize.value = preset.sky.size;
  uniforms.stars.value = preset.sky.stars; uniforms.earth.value = preset.sky.earth;
  terrainUniforms.sunDirection.value.copy(direction);
  renderer.toneMappingExposure = preset.post.exposure;
  bloom.intensity = preset.post.bloom; ao.configuration.intensity = preset.post.ao;
}
