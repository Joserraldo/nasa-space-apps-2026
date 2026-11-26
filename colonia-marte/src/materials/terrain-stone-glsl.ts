/**
 * Stylized Martian stone strata & wind-swept regolith shader for M_terrain (Jezero biome, DV-07).
 *
 * Matches the painterly low-poly ground of `v3-t079.90.jpg` and `v3-t054.60.jpg`:
 * - Sweeping, anisotropic domain-warped stone outcrops & wind-carved strata bands with crisp
 *   stylized contour edges (NEVER Voronoi/cobblestone tile grids, NEVER `fwidth` screen-derivative
 *   triangle seams).
 * - Analytical world-space directional bevels along `sunDirection.xz` give rock ledges a subtle
 *   sunlit rim and step shadow with C-continuous transitions across every mesh triangle.
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

  // Sinless hash with prime offset so origin and world axes never mirror or collapse.
  float tHash21(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx + vec2(47.31, 91.17).xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
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

  float tFbm3(vec2 p) {
    mat2 m = mat2(0.80, -0.60, 0.60, 0.80);
    float v = 0.56 * tVNoise(p);
    p = m * p * 2.03 + vec2(11.3, 7.9);
    v += 0.30 * tVNoise(p);
    p = m * p * 2.07 + vec2(5.1, 19.4);
    v += 0.14 * tVNoise(p);
    return v;
  }

  // Sweeping anisotropic stone-strata field matching the elongated dark outcrops in v3-t079.90.jpg.
  // edgeSoft widens smoothly with radial camDist (zero fwidth!) so foreground ledges stay crisp
  // while grazing mid-to-far plains never stipple near the horizon.
  float tSweptStrata(vec2 wp, float detailWeight, float medWeight, float edgeSoft) {
    mat2 windRot = mat2(0.91, -0.41, 0.41, 0.91);
    vec2 sp = windRot * wp;
    float broad = tFbm3(sp * vec2(0.082, 0.265) + vec2(4.9, 11.6));
    float medium = mix(0.5, tFbm3(sp * vec2(0.175, 0.46) + vec2(18.7, 6.3)), medWeight);
    float fine = (tVNoise(sp * vec2(0.36, 0.88) + vec2(13.1, 29.4)) - 0.5) * 0.11 * detailWeight;
    float f = broad * 0.68 + medium * 0.32 + fine;

    float shelfLow = smoothstep(0.472 - edgeSoft * 0.5, 0.472 + edgeSoft * 0.5, f);
    float shelfHigh = smoothstep(0.565 - edgeSoft * 0.5, 0.565 + edgeSoft * 0.5, f);
    return shelfLow * 0.64 + shelfHigh * 0.36;
  }

  vec3 computeJezeroStone(vec2 worldXZ, float camDist, float sunTerm) {
    mat2 rotA = mat2(0.85, -0.53, 0.53, 0.85);
    mat2 rotB = mat2(0.58, 0.81, -0.81, 0.58);

    // Organic multi-scale domain warp
    vec2 macroWarp = vec2(
      tFbm3(rotA * worldXZ * 0.034 + vec2(14.2, 6.8)),
      tFbm3(rotB * worldXZ * 0.034 + vec2(31.2, 19.6))
    ) - 0.5;
    vec2 midWarp = vec2(
      tVNoise(rotA * worldXZ * 0.13 + vec2(5.4, 17.1)),
      tVNoise(rotB * worldXZ * 0.13 + vec2(23.8, 9.3))
    ) - 0.5;
    vec2 wp = worldXZ + macroWarp * 9.5 + midWarp * 2.1;

    // Continuous radial camera-distance fades (zero fwidth! Silky horizon + crisp foreground)
    float midVis   = 1.0 - smoothstep(42.0, 128.0, camDist);
    float medVis   = 1.0 - smoothstep(26.0, 74.0, camDist);
    float nearVis  = 1.0 - smoothstep(18.0, 54.0, camDist);
    float edgeSoft = 0.026 + smoothstep(24.0, 95.0, camDist) * 0.15;

    // DV-07 S4 earthy garnet palette (R > B >= G, legible two-tone contrast between warm garnet sand & plum-garnet stone)
    vec3 sandLight    = oxide * vec3(1.12, 1.09, 1.10);
    vec3 sandMid      = mix(shade, oxide, 0.88);
    vec3 sandSwale    = mix(shade, oxide, 0.68);
    vec3 stoneShelf   = shade * vec3(0.84, 0.82, 0.92);
    vec3 stoneDeep    = shade * vec3(0.66, 0.65, 0.75);
    vec3 stoneRimGlow = oxide * vec3(1.20, 1.16, 1.17);

    float slopeLight = smoothstep(0.16, 0.74, sunTerm);

    // 1. Broad wind-swept regolith mantle & gentle sand ribbons (carries cleanly out to far DEM)
    float macroVis = 1.0 - smoothstep(140.0, 520.0, camDist);
    float macroSand = tFbm3(rotA * wp * 0.024 + vec2(3.7, 8.2));
    float sandRibbon = mix(0.5, tFbm3((rotB * worldXZ + macroWarp * 3.6) * vec2(0.055, 0.18)), midVis);
    float sandMix = clamp(macroSand * 0.68 + sandRibbon * 0.32, 0.0, 1.0);
    vec3 farCol = mix(sandMid, sandLight, 0.35);
    vec3 groundCol = mix(sandSwale, sandMid, smoothstep(0.22, 0.54, sandMix));
    groundCol = mix(groundCol, sandLight, smoothstep(0.55, 0.84, sandMix));
    groundCol = mix(farCol, groundCol, macroVis);

    // 2. Sweeping stratified stone bands & ledges (matching v3-t079.90 foreground/midground)
    if (midVis > 0.001) {
      float strata = tSweptStrata(wp, nearVis, medVis, edgeSoft);
      float sandCover = smoothstep(0.64, 0.84, macroSand);
      float stoneMask = strata * (1.0 - sandCover * 0.65) * midVis;

      // Analytical sun-facing bevel along contour edges (zero fwidth!)
      vec2 sunXZ = normalize(sunDirection.xz + vec2(0.0001, 0.0001));
      float dStrata = (
        tSweptStrata(wp + sunXZ * 0.20, nearVis, medVis, edgeSoft) -
        tSweptStrata(wp - sunXZ * 0.20, nearVis, medVis, edgeSoft)
      ) * (1.0 - sandCover * 0.65) * medVis;

      vec3 rockBandCol = mix(stoneShelf, stoneDeep, smoothstep(0.55, 0.92, strata));
      groundCol = mix(groundCol, rockBandCol, clamp(stoneMask * 1.15, 0.0, 0.92));
      groundCol = mix(groundCol, stoneRimGlow, clamp(-dStrata * 0.85, 0.0, 0.42));
      groundCol *= 1.0 - clamp(dStrata * 0.78, 0.0, 0.24);

      // 3. Subtle near-field wind-scoured micro-streaks in loose sand
      if (nearVis > 0.001) {
        float grain = (tVNoise((rotA * worldXZ + midWarp * 0.9) * vec2(0.35, 1.25)) - 0.5) * 0.06;
        groundCol *= 1.0 + grain * (1.0 - stoneMask * 0.5) * nearVis;
      }
    }

    groundCol *= mix(0.87, 1.04, slopeLight);
    return groundCol;
  }
`;
