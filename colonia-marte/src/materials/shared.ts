import {
  AdditiveBlending, Color, DataTexture, DoubleSide, MeshBasicMaterial, MeshStandardMaterial,
  NearestFilter, RGBAFormat, ShaderMaterial, SRGBColorSpace, Vector2, Vector3, type Material,
} from "three";
import { atlas } from "./atlas";
import { M_hallPlume } from "./hall-discharge";
import { paletteHex } from "./palette";
import { SPACE_SKY_FRAGMENT, spaceSkyUniforms } from "./space-backdrop";
import { TERRAIN_STONE_FRAGMENT_PARS } from "./terrain-stone-glsl";

function atlasTexture(pixels: Uint8Array): DataTexture {
  const texture = new DataTexture(pixels, atlas.width, atlas.height, RGBAFormat);
  texture.colorSpace = SRGBColorSpace;
  texture.magFilter = texture.minFilter = NearestFilter;
  texture.generateMipmaps = false;
  texture.flipY = true;
  texture.needsUpdate = true;
  return texture;
}

export const paletteMap = atlasTexture(atlas.pixels);
export const emissiveMap = atlasTexture(atlas.emission);
const M_palette = new MeshStandardMaterial({
  map: paletteMap, emissiveMap, emissive: "#FFFFFF", emissiveIntensity: 2.5, roughness: 0.48,
  vertexColors: true,
});
const M_glass = new MeshStandardMaterial({
  color: paletteHex("teal"), transparent: true, opacity: 0.38, roughness: 0.12,
  metalness: 0.15, depthWrite: false, side: DoubleSide,
});
const vertexShader = `
  varying vec2 surfaceUV;
  varying vec3 skyDirection;
  void main() {
    surfaceUV = uv;
    skyDirection = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const M_sky = new ShaderMaterial({
  uniforms: {
    ...spaceSkyUniforms,
    zenith: { value: new Color(paletteHex("skyZenith")) },
    horizon: { value: new Color(paletteHex("skyHorizon")) },
    sunHalo: { value: new Color(paletteHex("sunHalo")) },
    sunPosition: { value: new Vector2(0.25, 0.8) }, stars: { value: 0 },
    sunDirection: { value: new Vector3(-0.4, 0.6, -0.7).normalize() },
    haloSize: { value: 0.08 }, earth: { value: 0 },
    earthColor: { value: new Color(paletteHex("duskHalo")) },
    atmosphereEvent: { value: 0 },
    eventDust: { value: new Color(paletteHex("regolithShade")) },
    eventSolar: { value: new Color(paletteHex("cyan")) },
  },
  vertexShader,
  side: DoubleSide,
  fragmentShader: `
    uniform vec3 zenith;
    uniform vec3 horizon;
    uniform vec3 sunHalo;
    uniform vec2 sunPosition;
    uniform float stars;
    uniform vec3 sunDirection;
    uniform vec3 earthColor;
    uniform float earth;
    uniform float haloSize;
    uniform float atmosphereEvent;
    uniform vec3 eventDust;
    uniform vec3 eventSolar;
    varying vec2 surfaceUV;
    varying vec3 skyDirection;
    ${SPACE_SKY_FRAGMENT}
    vec3 computePresetSky(vec3 direction) {
      vec3 day = mix(horizon, zenith, pow(clamp(direction.y, 0.0, 1.0), 0.65));
      float halo = 1.0 - smoothstep(0.0, haloSize, distance(direction, sunDirection));
      day = mix(day, sunHalo, halo);
      vec2 starUV = vec2(atan(direction.z, direction.x), asin(direction.y)) * vec2(180.0, 180.0);
      vec2 cell = floor(starUV);
      float seed = fract(sin(dot(cell, vec2(127.1, 311.7))) * 43758.5453);
      float disk = 1.0 - smoothstep(0.08, 0.24, length(fract(starUV) - 0.5));
      float point = step(0.985, seed) * disk;
      vec3 color = day + vec3(0.75, 0.85, 1.0) * point * stars * step(0.02, direction.y);
      float earthPoint = 1.0 - smoothstep(0.001, 0.004, distance(direction, normalize(vec3(-0.12, 0.18, -1.0))));
      color += earthColor * earthPoint * earth * 2.0;
      if (atmosphereEvent == 1.0) {
        float azimuth = atan(direction.z, direction.x);
        float arc = 0.042 + 0.014 * sin(azimuth * 3.0);
        float bands = exp(-90.0 * abs(direction.y - arc)) +
          0.45 * exp(-135.0 * abs(direction.y - arc * 0.42));
        color = mix(color, eventDust, 0.33 * bands);
      }
      if (atmosphereEvent == 2.0) {
        float streak = 1.0 - smoothstep(0.06, 0.32, length((fract(starUV) - 0.5) * vec2(0.55, 3.0)));
        color += eventSolar * streak * step(0.996, seed) * smoothstep(0.03, 0.27, direction.y) * 1.2;
      }
      return color;
    }
    void main() {
      vec3 direction = normalize(skyDirection);
      gl_FragColor = vec4(spaceMode > 0.5 ? computeSpaceSky(direction) : computePresetSky(direction), 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `,
});
// Biome shading uses the standard lighting pipeline. WS2 owns geometry, masks and environments.
export const terrainUniforms = {
  oxide: { value: new Color(paletteHex("oxide")) }, ice: { value: new Color(paletteHex("ice")) },
  shade: { value: new Color(paletteHex("regolithShade")) },
  sunDirection: { value: new Vector3(-0.4, 0.6, -0.7).normalize() },
  biome: { value: 0 }, // 0: Jezero oxide; 1: polar ice. Never use polar ice in Jezero.
  useMask: { value: 0 },
};
const M_terrain = new MeshStandardMaterial({ roughness: 0.95 });
M_terrain.onBeforeCompile = shader => {
  Object.assign(shader.uniforms, terrainUniforms);
  shader.vertexShader = `attribute float iceBias; attribute int iceSeed;
    varying vec2 terrainXZ; varying float terrainIceBias; flat varying int terrainIceSeed; varying float terrainSun;
    varying vec3 vTerrainWorld; varying float vTerrainCamDist; varying float terrainIce;
    uniform vec3 sunDirection;\n${shader.vertexShader}`;
  shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", `
    #include <begin_vertex>
    terrainXZ = position.xz;
    vec4 terrainWorldPos = modelMatrix * vec4(transformed, 1.0);
    vTerrainWorld = terrainWorldPos.xyz;
    vTerrainCamDist = distance(terrainWorldPos.xyz, cameraPosition);
    terrainIce = 0.0; // declared by the stone fragment chunk; the ice edge is computed per fragment
    terrainIceBias = iceBias;
    terrainIceSeed = iceSeed;
    terrainSun = dot(normalize(mat3(modelMatrix) * normal), sunDirection);
  `);
  // TERRAIN_STONE_FRAGMENT_PARS declares the terrain uniforms, terrainSun and the world-position varyings.
  shader.fragmentShader = `${TERRAIN_STONE_FRAGMENT_PARS}
    varying vec2 terrainXZ; varying float terrainIceBias; flat varying int terrainIceSeed;

    // Same 32-bit hash and smooth lattice interpolation as environment/noise.ts.
    float terrainIceHash(ivec2 cell, uint seed) {
      uint value = uint(cell.x) * 374761393u ^ uint(cell.y) * 668265263u ^ seed * 1442695041u;
      value = (value ^ (value >> 13u)) * 1274126177u;
      return float(value ^ (value >> 16u)) / 4294967295.0;
    }

    float terrainIceNoise(vec2 point, uint seed) {
      ivec2 cell = ivec2(floor(point));
      vec2 blend = smoothstep(vec2(0.0), vec2(1.0), fract(point));
      float a = mix(terrainIceHash(cell, seed), terrainIceHash(cell + ivec2(1, 0), seed), blend.x);
      float b = mix(terrainIceHash(cell + ivec2(0, 1), seed), terrainIceHash(cell + ivec2(1, 1), seed), blend.x);
      return mix(a, b, blend.y);
    }
    \n${shader.fragmentShader}`;
  shader.fragmentShader = shader.fragmentShader.replace("#include <color_fragment>", `
    #include <color_fragment>
    float mask = 0.0;
    if (biome > 0.0) {
      // Only the terrain bias is interpolated; the patch boundary is classified per fragment.
      float field = terrainIceNoise(terrainXZ / 32.0, uint(terrainIceSeed)) + terrainIceBias;
      mask = mix(1.0, field > 0.29 ? 1.0 : 0.0, useMask) * clamp(biome, 0.0, 1.0);
    }
    // Polar keeps the C3 per-fragment ice edge; Jezero uses the stylized stone (DV-07).
    vec3 polarRegolith = mix(shade, oxide, smoothstep(0.35, 0.68, terrainSun));
    vec3 regolith = biome < 0.5 ? computeJezeroStone(vTerrainWorld.xz, vTerrainCamDist, terrainSun) : polarRegolith;
    diffuseColor.rgb *= mix(regolith, ice, mask);
  `);
};
M_terrain.customProgramCacheKey = () => "WS2_terrain_biome_v15";
const M_hologram = new MeshBasicMaterial({
  color: paletteHex("cyan"), transparent: true, opacity: 0.5, blending: AdditiveBlending,
  depthWrite: false, side: DoubleSide,
});
const M_screen = new MeshBasicMaterial({ color: "#FFFFFF" });
const M_roverTracks = new MeshBasicMaterial({
  color: paletteHex("black"),
  transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
});
M_roverTracks.onBeforeCompile = shader => {
  shader.vertexShader = `attribute float treadCoverage;\nvarying float vTreadCoverage;\n${shader.vertexShader}`
    .replace("#include <begin_vertex>", "#include <begin_vertex>\nvTreadCoverage = treadCoverage;");
  shader.fragmentShader = `varying float vTreadCoverage;\n${shader.fragmentShader}`
    .replace("#include <color_fragment>", "#include <color_fragment>\ndiffuseColor.a *= vTreadCoverage;");
};

export const materials = { M_palette, M_glass, M_sky, M_terrain, M_hologram, M_screen, M_hallPlume, M_roverTracks };
Object.entries(materials).forEach(([name, material]) => { material.name = name; });
export const sharedMaterials = new Set<Material>(Object.values(materials));
