import { Color, Vector3 } from "three";
import { paletteHex } from "./palette";

export const spaceSkyUniforms = {
    spaceMode: { value: 0 },
    night: { value: new Color(paletteHex("nightSky")) },
    starlight: { value: new Color(paletteHex("ice")) },
    galacticDust: { value: new Color(paletteHex("duskHalo")) },
    airglow: { value: new Color(paletteHex("cyan")) },
    planetDirection: { value: new Vector3(0, 0, -1) },
    planetRadius: { value: 0 },
};

export const SPACE_SKY_FRAGMENT = `
    uniform float spaceMode;
    uniform vec3 night;
    uniform vec3 starlight;
    uniform vec3 galacticDust;
    uniform vec3 airglow;
    uniform vec3 planetDirection;
    uniform float planetRadius;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    float starLayer(vec2 grid, float threshold, float radius) {
      vec2 tile = floor(grid);
      float seed = hash(tile);
      if (seed < threshold) return 0.0;
      vec2 center = 0.30 + 0.40 * vec2(hash(tile + 71.0), hash(tile - 37.0));
      float d = length(fract(grid) - center);
      return (1.0 - smoothstep(radius * 0.25, radius, d)) * (0.38 + 0.62 * hash(tile + 15.0));
    }

    vec3 computeSpaceSky(vec3 ray) {
      vec2 sky = vec2(atan(ray.x, ray.z), asin(ray.y));
      float bandDistance = abs(dot(ray, normalize(vec3(0.36, 0.88, 0.135))));
      float band = exp(-bandDistance * bandDistance * 38.0);
      float folds = sin(28.0 * sky.x + 4.0 * sin(11.0 * sky.y)) *
        sin(56.0 * sky.y - 14.0 * sky.x);
      float dust = band * (0.021 + 0.009 * folds);
      float stars = starLayer(sky * 163.0, 0.970 - band * 0.016, 0.18) * 0.62
        + starLayer(sky * 64.0 + 18.7, 0.990, 0.17) * 1.23;

      float horizonDistance = length(ray - planetDirection);
      float aboveLimb = max(0.0, horizonDistance - planetRadius);
      float rim = exp(-aboveLimb * 540.0) * (1.0 - smoothstep(0.003, 0.014, aboveLimb));
      float sunward = smoothstep(-0.004, 0.026, dot(ray - planetDirection, normalize(vec3(-0.50, 0.80, -0.32))));
      return night + galacticDust * dust + starlight * stars
        + airglow * rim * (0.075 + 0.20 * sunward);
    }
`;
