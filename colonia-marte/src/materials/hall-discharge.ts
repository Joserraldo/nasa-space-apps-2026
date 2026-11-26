import { AdditiveBlending, Color, DoubleSide, ShaderMaterial } from "three";
import { paletteHex } from "./palette";

const xenon = new Color(paletteHex("xenonGlow"));

export const M_hallPlume = new ShaderMaterial({
  transparent: true,
  depthWrite: false,
  side: DoubleSide,
  forceSinglePass: true,
  blending: AdditiveBlending,
  uniforms: { xenon: { value: xenon } },
  vertexShader: `
    varying float travel;
    varying vec3 facing;
    varying vec3 eye;
    void main() {
      #include <beginnormal_vertex>
      #include <defaultnormal_vertex>
      #include <begin_vertex>
      #include <project_vertex>
      travel = uv.y;
      facing = transformedNormal;
      eye = -mvPosition.xyz;
    }
  `,
  fragmentShader: `
    uniform vec3 xenon;
    varying float travel;
    varying vec3 facing;
    varying vec3 eye;
    void main() {
      float fade = 1.0 - smoothstep(0.06, 1.0, travel);
      float edge = pow(abs(dot(normalize(facing), normalize(eye))), 0.7);
      gl_FragColor = vec4(xenon, 0.14 * fade * fade * (0.25 + 0.75 * edge));
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `,
});
