/**
 * Procedural stylized Martian rock & regolith shader for M_terrain (Jezero biome).
 * Keeps all variation strictly within warm earthy oxide / garnet-brown (zero grey or mauve),
 * forming irregular stepped rock outcrops partially buried under broad drifts of loose
 * regolith, without tile-like polygon crack nets or distant shimmer.
 */
export const TERRAIN_STONE_FRAGMENT_PARS = /* glsl */ `
  uniform vec3 oxide;
  uniform vec3 shade;
  uniform vec3 ice;
  uniform vec3 sunDirection;
  uniform float biome;
  uniform float useMask;
  varying float terrainIce;
  varying float terrainSun;
  varying vec3 vTerrainWorld;
  varying float vTerrainCamDist;

  float tHash21(vec2 p) {
    p = fract(p * vec2(127.1, 311.7));
    p += dot(p, p + 34.23);
    return fract(p.x * p.y);
  }

  vec2 tHash22(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.xx + p3.yz) * p3.zy);
  }

  float tVNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = tHash21(i);
    float b = tHash21(i + vec2(1.0, 0.0));
    float c = tHash21(i + vec2(0.0, 1.0));
    float d = tHash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  float tFbm4(vec2 p) {
    mat2 m = mat2(0.80, -0.60, 0.60, 0.80);
    float v = 0.52 * tVNoise(p);
    p = m * p * 2.05 + vec2(11.3, 7.9);
    v += 0.27 * tVNoise(p);
    p = m * p * 2.13 + vec2(5.1, 19.4);
    v += 0.14 * tVNoise(p);
    p = m * p * 2.09 + vec2(17.8, 3.6);
    v += 0.07 * tVNoise(p);
    return v;
  }

  vec3 computeJezeroStone(vec2 worldXZ, float camDist, float sunTerm) {
    float pxSize = max(length(fwidth(worldXZ)), 0.001);
    vec2 sunXZ = normalize(sunDirection.xz + vec2(1e-4));
    mat2 rotA = mat2(0.85, -0.53, 0.53, 0.85);
    mat2 rotB = mat2(0.58, 0.81, -0.81, 0.58);

    // Strong multi-scale organic domain warp for irregular jagged rock borders
    vec2 warpBig = vec2(
      tFbm4(rotA * worldXZ * 0.048),
      tFbm4(rotB * worldXZ * 0.048 + vec2(31.2, 12.6))
    ) - 0.5;
    vec2 warpMed = vec2(
      tFbm4(rotB * worldXZ * 0.21 + vec2(8.4, 19.1)),
      tFbm4(rotA * worldXZ * 0.21 + vec2(21.7, 5.3))
    ) - 0.5;
    vec2 wp = worldXZ + warpBig * 9.5 + warpMed * 2.1;

    // Muted earthy garnet-oxide family (R > B >= G, zero salmon or flat grey)
    vec3 looseDustLight = oxide * vec3(1.02, 1.02, 1.02);
    vec3 looseDustMid = mix(shade, oxide, 0.72);
    vec3 rockTerraceHi = mix(shade, oxide, 0.58);
    vec3 rockTerraceMid = mix(shade, oxide, 0.34) * vec3(0.97, 0.97, 0.98);
    vec3 rockScarpDark = shade * vec3(0.86, 0.86, 0.87);

    float slopeLight = smoothstep(0.14, 0.70, sunTerm);

    // 1. Broad sweeping drifts of loose oxide regolith (28m - 90m) that bury part of the rock shelves
    float driftMacro = tFbm4(rotA * wp * 0.019 + vec2(3.7, 8.2));
    float driftRipples = tVNoise((rotA * worldXZ + warpMed * 0.8) * vec2(0.16, 0.55));
    float dustTone = clamp(driftMacro * 0.78 + driftRipples * 0.22, 0.0, 1.0);
    vec3 regolithCol = mix(looseDustMid, looseDustLight, smoothstep(0.28, 0.74, dustTone));
    regolithCol *= mix(0.78, 1.07, slopeLight);

    // 2. Irregular stepped rock strata outcrops emerging through loose regolith (no tile grid!)
    float detailFade = (1.0 - smoothstep(0.75, 2.40, pxSize)) * (1.0 - smoothstep(220.0, 580.0, camDist));
    float edgeAA = clamp(pxSize * 0.16, 0.010, 0.085);

    vec2 rockUV = (mat2(0.92, -0.39, 0.39, 0.92) * wp) * vec2(0.075, 0.19);
    float rockElev = tFbm4(rockUV) * 0.66 + tFbm4(rotB * wp * 0.26) * 0.34;

    // Loose regolith blanket buries lower areas; only higher rocky ridges emerge with irregular edges
    float regolithBlanket = smoothstep(0.38, 0.62, driftMacro);
    float emergeThreshold = mix(0.42, 0.62, regolithBlanket);
    float rockOutcrop = smoothstep(emergeThreshold - edgeAA, emergeThreshold + 0.035 + edgeAA, rockElev) * detailFade;

    // Three distinct irregular rock strata steps with strong height/tone contrast
    float step1 = smoothstep(0.50 - edgeAA, 0.525 + edgeAA, rockElev);
    float step2 = smoothstep(0.60 - edgeAA, 0.625 + edgeAA, rockElev);
    float step3 = smoothstep(0.70 - edgeAA, 0.725 + edgeAA, rockElev);

    vec3 rockCol = mix(rockTerraceMid, rockTerraceHi, step1);
    rockCol = mix(rockCol, rockScarpDark * 1.15, step2 * 0.65);
    rockCol = mix(rockCol, looseDustLight * 0.96, step3 * 0.75);

    // Directional sunlit scarp lip & shadow drop on irregular rock ledges
    float scarpFade = (1.0 - smoothstep(0.20, 0.68, pxSize)) * (1.0 - smoothstep(65.0, 180.0, camDist));
    float eps = 0.045;
    float gx = tFbm4(rockUV + vec2(eps, 0.0)) - tFbm4(rockUV - vec2(eps, 0.0));
    float gz = tFbm4(rockUV + vec2(0.0, eps)) - tFbm4(rockUV - vec2(0.0, eps));
    float scarpSun = dot(normalize(vec2(gx, gz) + vec2(1e-4)), sunXZ);

    float onLedge = max(
      smoothstep(0.47, 0.51, rockElev) * (1.0 - smoothstep(0.52, 0.57, rockElev)),
      smoothstep(0.57, 0.61, rockElev) * (1.0 - smoothstep(0.62, 0.67, rockElev))
    );
    rockCol *= (1.0 + scarpSun * onLedge * 0.34 * scarpFade) * mix(0.76, 1.08, slopeLight);

    // Rare, short, organic rock crevices only inside exposed high rock shelves (never pavement lines)
    float creviceVis = (1.0 - smoothstep(0.04, 0.13, pxSize)) * (1.0 - smoothstep(24.0, 68.0, camDist));
    if (creviceVis > 0.005 && rockOutcrop > 0.25) {
      float cr = abs(tFbm4(rotA * wp * vec2(0.34, 0.78)) - 0.51);
      float maskShort = smoothstep(0.60, 0.78, tVNoise(wp * 0.31 + vec2(6.4, 13.8)));
      float cw = max(0.008, pxSize * 0.25);
      float crevice = (1.0 - smoothstep(0.002, 0.002 + cw, cr)) * maskShort * step1 * creviceVis;
      rockCol = mix(rockCol, rockScarpDark * 0.68, crevice * 0.75);
    }

    vec3 groundCol = mix(regolithCol, rockCol, rockOutcrop);

    // 3. Irregular warm-oxide scree & gravel clustered near outcrop margins (distance-faded)
    float screeVis = (1.0 - smoothstep(0.030, 0.095, pxSize)) * (1.0 - smoothstep(12.0, 38.0, camDist));
    if (screeVis > 0.005) {
      float marginZone = mix(0.35, 1.0, smoothstep(0.34, 0.56, rockElev));
      vec2 sp = (rotB * (worldXZ + warpMed * 0.30)) * 2.1;
      vec2 sn = floor(sp);
      vec2 sf = fract(sp);
      vec2 sr = tHash22(sn);
      vec2 dVec = (0.24 + 0.52 * sr - sf);
      float polyDist = max(abs(dVec.x * 0.8 + dVec.y * 0.6), max(abs(dVec.y), abs(dVec.x * 0.7 - dVec.y * 0.7)));
      float angStone = (1.0 - smoothstep(0.08, 0.15, polyDist)) * step(0.84, fract(sr.x * 9.1 + sr.y * 5.7));
      vec3 screeTone = mix(rockScarpDark, looseDustLight * 1.05, step(0.6, sr.y));
      groundCol = mix(groundCol, screeTone, angStone * marginZone * 0.58 * screeVis);
    }

    return groundCol;
  }
`;
