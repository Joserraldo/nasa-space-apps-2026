/**
 * Material único de la colonia (Etapa D2): paleta del kit Craftpix Space Colony más polvo y desgaste en el shader.
 * Restricción del 17 nov (línea 8): la base no puede leerse como catálogo de edificios limpios. El polvo se junta
 * abajo (salpicado del suelo), sobre las caras que miran al cielo y en manchones; las paredes llevan chorreado.
 * Todo en espacio de mundo: piezas fusionadas en una sola malla comparten el mismo desgaste sin costuras.
 */
import * as THREE from "three";

/**
 * Bandas de la paleta (filas de 16 px de una imagen de 64 px). Con `flipY = false`, como el GLB, la coordenada v del
 * glTF cae así: [0, .25) negro, [.25, .5) rojo, [.5, .75) gris oscuro, [.75, 1] cuerpo. Las piezas originales
 * apuntan su UV al centro de una banda (`V_BANDA`).
 */
export const V_BANDA = { negro: 0.125, rojo: 0.375, oscuro: 0.625, cuerpo: 0.875 } as const;
export type Banda = keyof typeof V_BANDA;

/** Paleta propia del kit (sRGB): cuerpo gris cálido, rojo óxido apagado, gris oscuro y casi negro. [E] */
export const COLORES_PALETA: Readonly<Record<Banda, readonly [number, number, number]>> = {
  negro: [28, 27, 27],
  rojo: [126, 50, 38],
  oscuro: [66, 63, 60],
  cuerpo: [182, 174, 164],
};

/** Polvo de Jezero: tono del suelo cercano de la Etapa BC. */
export const COLOR_POLVO = "#a0705a";
/** Regolito de los sacos y las losas: más oscuro y frío que el polvo suelto. */
export const COLOR_REGOLITO = "#5f4034";

/** Textura de 64 × 4 px con las cuatro bandas (sin archivo: la paleta vive en el código). */
export function crearPaleta(): THREE.DataTexture {
  const filas: Banda[] = ["negro", "rojo", "oscuro", "cuerpo"];
  const datos = new Uint8Array(4 * 4 * 4);
  filas.forEach((b, f) => {
    for (let x = 0; x < 4; x++) datos.set([...COLORES_PALETA[b], 255], (f * 4 + x) * 4);
  });
  const t = new THREE.DataTexture(datos, 4, 4, THREE.RGBAFormat);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.flipY = false;
  t.needsUpdate = true;
  return t;
}

/** Cuánto polvo lleva cada material (0 a 1). [E] */
export interface OpcionesPolvo {
  /** Película pareja sobre todo (nada queda limpio). */
  base: number;
  /** Salpicado desde el suelo hasta ~1,4 m. */
  suelo: number;
  /** Caras que miran al cielo. */
  arriba: number;
  /** Fuerza del chorreado vertical que oscurece paredes. */
  chorreado: number;
}

const POLVO_KIT: OpcionesPolvo = { base: 0.16, suelo: 0.6, arriba: 0.55, chorreado: 0.22 };

/** Inyecta el polvo en un `MeshStandardMaterial` (mismo programa para todos los que lo usan). */
export function conPolvo(m: THREE.MeshStandardMaterial, o: OpcionesPolvo = POLVO_KIT): THREE.MeshStandardMaterial {
  const color = new THREE.Color(COLOR_POLVO);
  m.onBeforeCompile = (s) => {
    s.uniforms.uPolvo = { value: color };
    s.uniforms.uPolvoOp = { value: new THREE.Vector4(o.base, o.suelo, o.arriba, o.chorreado) };
    s.vertexShader = s.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vPosMundo;\nvarying vec3 vNormMundo;")
      .replace(
        "#include <worldpos_vertex>",
        "#include <worldpos_vertex>\nvPosMundo = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvNormMundo = normalize(mat3(modelMatrix) * objectNormal);",
      );
    s.fragmentShader = s.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
varying vec3 vPosMundo;
varying vec3 vNormMundo;
uniform vec3 uPolvo;
uniform vec4 uPolvoOp;
float hashP(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float ruidoP(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hashP(i), hashP(i + vec2(1, 0)), u.x), mix(hashP(i + vec2(0, 1)), hashP(i + vec2(1, 1)), u.x), u.y);
}`,
      )
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
{
  vec3 n = normalize(vNormMundo);
  float manchas = ruidoP(vPosMundo.xz * 0.45) * 0.6 + ruidoP(vPosMundo.xz * 2.3 + vPosMundo.y) * 0.4;
  float suelo = (1.0 - smoothstep(0.0, 1.4, vPosMundo.y)) * uPolvoOp.y;
  float arriba = smoothstep(0.35, 0.9, n.y) * uPolvoOp.z;
  float polvo = clamp(uPolvoOp.x + (suelo + arriba) * (0.45 + 0.75 * manchas), 0.0, 0.88);
  // Chorreado: franjas verticales finas en paredes (n.y ~ 0), más oscuras arriba de cada franja.
  float pared = 1.0 - abs(n.y);
  float franja = ruidoP(vec2((vPosMundo.x + vPosMundo.z) * 3.1, vPosMundo.y * 0.35));
  diffuseColor.rgb *= 1.0 - uPolvoOp.w * pared * smoothstep(0.55, 0.95, franja);
  diffuseColor.rgb = mix(diffuseColor.rgb, uPolvo, polvo);
}`,
      );
  };
  m.customProgramCacheKey = () => `polvo-kit-${o.base}-${o.suelo}-${o.arriba}-${o.chorreado}`;
  return m;
}

/** Material del kit (paleta + polvo). Lo liberan `liberarEscena` (material y textura) con la escena. */
export function materialKit(paleta: THREE.Texture): THREE.MeshStandardMaterial {
  return conPolvo(new THREE.MeshStandardMaterial({ name: "Colony_Kit", map: paleta, roughness: 0.86, metalness: 0.08 }));
}

/** Material de los sacos de regolito y las losas sinterizadas. */
export function materialRegolito(): THREE.MeshStandardMaterial {
  // Poco polvo arriba: con más, las losas horizontales quedaban más claras que el suelo que las rodea.
  return conPolvo(
    new THREE.MeshStandardMaterial({ name: "Colony_Regolith", color: COLOR_REGOLITO, roughness: 1, metalness: 0 }),
    { base: 0.06, suelo: 0.2, arriba: 0.12, chorreado: 0 },
  );
}
