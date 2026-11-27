import {
  AdditiveBlending, Color, ConeGeometry, DoubleSide, Float32BufferAttribute, InstancedMesh, MeshBasicMaterial,
  Object3D, PlaneGeometry, ShaderMaterial,
} from "three";
import { LANDER_ENGINES, LANDER_ENGINE_Y } from "../kit/pieces/mars/family-lander";
import { paletteHex } from "../materials/palette";

export function createLandingEffects() {
  const flameGeometry = new ConeGeometry(0.116, 0.72, 12, 1, true);
  flameGeometry.rotateX(Math.PI);
  flameGeometry.translate(0, -0.36, 0);
  const colors = new Float32Array(flameGeometry.attributes.position.count * 3);
  const bright = new Color(paletteHex("ice")).multiplyScalar(2.6);
  const warm = new Color(paletteHex("warning")).multiplyScalar(2.1);
  for (let i = 0; i < colors.length / 3; i++) {
    (flameGeometry.attributes.position.getY(i) < -0.6 ? warm : bright).toArray(colors, i * 3);
  }
  flameGeometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  const flameMaterial = new MeshBasicMaterial({
    vertexColors: true, side: DoubleSide, transparent: true, depthWrite: false,
    opacity: 0.83, blending: AdditiveBlending,
  });
  flameMaterial.forceSinglePass = true;
  const flames = new InstancedMesh(flameGeometry, flameMaterial, LANDER_ENGINES.length);
  flames.name = "descent-exhaust";
  const transform = new Object3D();
  LANDER_ENGINES.forEach(([x, z], i) => {
    transform.position.set(x, LANDER_ENGINE_Y, z);
    transform.updateMatrix();
    flames.setMatrixAt(i, transform.matrix);
  });
  flames.instanceMatrix.needsUpdate = true;

  const dustGeometry = new PlaneGeometry(1, 1);
  const dustMaterial = new ShaderMaterial({
    side: DoubleSide, transparent: true, depthWrite: false,
    uniforms: { tint: { value: new Color(paletteHex("dustSky")) }, opacity: { value: 0 } },
    vertexShader: `
      varying vec2 stamp;
      void main() {
        stamp = uv;
        gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform vec3 tint;
      uniform float opacity;
      varying vec2 stamp;
      void main() {
        vec2 p = 2.0 * stamp - 1.0;
        float edge = 1.0 - smoothstep(0.12, 1.0, length(p));
        float grain = 0.78 + 0.22 * sin(16.0 * p.x + 10.0 * p.y) * sin(17.0 * p.y);
        gl_FragColor = vec4(tint, edge * edge * grain * opacity);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  dustMaterial.forceSinglePass = true;
  const dust = new InstancedMesh(dustGeometry, dustMaterial, 36);
  dust.name = "touchdown-dust-ring";
  dust.frustumCulled = false;
  const turn = (2 * Math.PI) / dust.count;

  return {
    flames, dust,
    updateDust(strength: number, spread: number) {
      dust.visible = strength > 0;
      if (!dust.visible) return;
      dustMaterial.uniforms.opacity.value = strength * 0.30;
      for (let i = 0; i < dust.count; i++) {
        const angle = turn * i;
        const radius = 1.09 + 3.20 * spread + 0.25 * Math.sin(i * 1.93);
        const height = 0.32 + 0.38 * spread + 0.12 * Math.cos(i * 2.25);
        transform.position.set(Math.cos(angle) * radius, height * 0.54, Math.sin(angle) * radius);
        transform.rotation.set(0, Math.PI / 2 - angle, 0);
        transform.scale.set(1.02 + spread * 0.35, height, 1);
        transform.updateMatrix();
        dust.setMatrixAt(i, transform.matrix);
      }
      dust.instanceMatrix.needsUpdate = true;
    },
    dispose() {
      flames.dispose();
      dust.dispose();
      flameGeometry.dispose();
      dustGeometry.dispose();
      flameMaterial.dispose();
      dustMaterial.dispose();
    },
  };
}
