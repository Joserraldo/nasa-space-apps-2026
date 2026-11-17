/**
 * Post del exterior (Etapa A), solo cuando la calidad pide AO o bloom (`conPost`, hoy solo `alta`):
 *
 *   escena (HDR lineal, MSAA) → GTAO (AO de pantalla donde se tocan las superficies) → bloom (umbral alto:
 *   solo el disco del Sol y las luces emisivas) → gradación final (la misma `CustomToneMapping` de
 *   `atmosfera.ts` que usan los materiales sin post) + sRGB.
 *
 * Pases verificados en three 0.160.1: `GTAOPass`, `UnrealBloomPass`, `RenderPass`, `EffectComposer`.
 * `OutputPass` de r160 no conoce `CustomToneMapping`: por eso el pase final es propio (misma forma que `OutputShader`).
 *
 * Presupuesto: GTAO dibuja la escena otra vez (normales y profundidad). Las draw calls que miden el
 * presupuesto de la vista son las del pase de escena (`cuenta`), igual que antes del post.
 */
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { GTAOPass } from "three/examples/jsm/postprocessing/GTAOPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { FullScreenQuad, Pass } from "three/examples/jsm/postprocessing/Pass.js";
import { SMAAPass } from "three/examples/jsm/postprocessing/SMAAPass.js";
import { LUZ } from "./cielo";

/**
 * AO: radio en metros de mundo, mezcla, muestras y escala de resolución. A resolución completa con DPR 1,5
 * costaba ~10 ms por fotograma (medido sin vsync: 432 → 70 fps); a la mitad y con menos muestras alcanza
 * para el contacto entre superficies. [E]
 */
export const AO = { radio: 0.9, mezcla: 0.85, muestras: 8, muestrasFiltro: 8, grosor: 1.2, escala: 0.5 } as const;
/**
 * Bloom con umbral alto (luminancia lineal antes de AgX). De día solo pasa el disco del Sol (las luces
 * con el Sol encima quedan por debajo); de noche baja el umbral y brillan las luces emisivas. [E]
 */
export const BLOOM = { fuerza: 0.5, radio: 0.5, umbralDia: 1.6, umbralNoche: 0.55 } as const;

/** Umbral del bloom según la noche (0 a 1). */
export function umbralBloom(noche: number): number {
  const q = Math.min(1, Math.max(0, noche));
  return BLOOM.umbralDia + (BLOOM.umbralNoche - BLOOM.umbralDia) * q;
}

/** Pase de escena que guarda las draw calls y triángulos de la escena (sin los pases de post). */
class PaseEscena extends RenderPass {
  cuenta = { calls: 0, triangles: 0 };
  override render(renderer: THREE.WebGLRenderer, writeBuffer: THREE.WebGLRenderTarget, readBuffer: THREE.WebGLRenderTarget, deltaTime: number, maskActive: boolean): void {
    super.render(renderer, writeBuffer, readBuffer, deltaTime, maskActive);
    this.cuenta.calls = renderer.info.render.calls;
    this.cuenta.triangles = renderer.info.render.triangles;
  }
}

/** GTAO a menor resolución: normales, AO y filtro en `AO.escala`; la mezcla final escala la textura. */
class PaseAO extends GTAOPass {
  override setSize(ancho: number, alto: number): void {
    super.setSize(Math.max(1, Math.round(ancho * AO.escala)), Math.max(1, Math.round(alto * AO.escala)));
  }
}

/** Gradación final: `CustomToneMapping` (AgX + gradación) y transferencia sRGB. */
class PaseGradacion extends Pass {
  private readonly material: THREE.RawShaderMaterial;
  private readonly cuadro: FullScreenQuad;
  constructor() {
    super();
    this.material = new THREE.RawShaderMaterial({
      name: "Exterior_Grading",
      uniforms: { tDiffuse: { value: null }, toneMappingExposure: { value: LUZ.exposicion } },
      vertexShader: /* glsl */ `
        precision highp float;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        attribute vec3 position;
        attribute vec2 uv;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }`,
      fragmentShader: /* glsl */ `
        precision highp float;
        uniform sampler2D tDiffuse;
        #include <tonemapping_pars_fragment>
        #include <colorspace_pars_fragment>
        varying vec2 vUv;
        void main() {
          gl_FragColor = texture2D( tDiffuse, vUv );
          gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
          gl_FragColor = sRGBTransferOETF( gl_FragColor );
        }`,
    });
    this.cuadro = new FullScreenQuad(this.material);
  }
  override render(renderer: THREE.WebGLRenderer, writeBuffer: THREE.WebGLRenderTarget, readBuffer: THREE.WebGLRenderTarget): void {
    this.material.uniforms.tDiffuse!.value = readBuffer.texture;
    this.material.uniforms.toneMappingExposure!.value = renderer.toneMappingExposure;
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
    this.cuadro.render(renderer);
  }
  override dispose(): void {
    this.material.dispose();
    this.cuadro.dispose();
  }
}

export interface Postproceso {
  /** `noche` (0 a 1) baja el umbral del bloom. */
  render(dt: number, noche?: number): void;
  /** Tamaño en píxeles CSS y DPR (los mismos del renderer). */
  tamano(ancho: number, alto: number, dpr: number): void;
  /** Draw calls y triángulos del pase de escena del último fotograma. */
  readonly cuenta: Readonly<{ calls: number; triangles: number }>;
  dispose(): void;
}

export function crearPostproceso(
  renderer: THREE.WebGLRenderer,
  escena: THREE.Scene,
  camara: THREE.PerspectiveCamera,
  ajuste: Readonly<{ ao: boolean; bloom: boolean }>,
): Postproceso {
  const tam = renderer.getDrawingBufferSize(new THREE.Vector2());
  // Sin MSAA: ×4 sobre HalfFloat costaba ~3,8 ms (medido sin vsync: 113 → 199 fps). El borde lo suaviza SMAA al final.
  const objetivo = new THREE.WebGLRenderTarget(Math.max(1, tam.x), Math.max(1, tam.y), { type: THREE.HalfFloatType });
  const compositor = new EffectComposer(renderer, objetivo);
  const escenaPase = new PaseEscena(escena, camara);
  compositor.addPass(escenaPase);
  if (ajuste.ao) {
    const ao = new PaseAO(escena, camara, Math.round(tam.x * AO.escala), Math.round(tam.y * AO.escala));
    ao.blendIntensity = AO.mezcla;
    ao.updateGtaoMaterial({ radius: AO.radio, thickness: AO.grosor, samples: AO.muestras, distanceExponent: 1, scale: 1 });
    ao.updatePdMaterial({ samples: AO.muestrasFiltro });
    compositor.addPass(ao);
  }
  const bloom = ajuste.bloom ? new UnrealBloomPass(new THREE.Vector2(tam.x, tam.y), BLOOM.fuerza, BLOOM.radio, BLOOM.umbralDia) : null;
  if (bloom) compositor.addPass(bloom);
  compositor.addPass(new PaseGradacion());
  // SMAA sobre la imagen ya gradada (sRGB), como pide el algoritmo.
  compositor.addPass(new SMAAPass(tam.x, tam.y));
  return {
    render(dt, noche = 0) {
      if (bloom) bloom.threshold = umbralBloom(noche);
      compositor.render(dt);
    },
    tamano(ancho, alto, dpr) {
      compositor.setPixelRatio(dpr);
      compositor.setSize(ancho, alto);
    },
    get cuenta() {
      return escenaPase.cuenta;
    },
    dispose() {
      for (const p of compositor.passes) p.dispose();
      compositor.dispose();
      objetivo.dispose();
    },
  };
}
