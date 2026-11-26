import * as THREE from "three";
import {
  BloomEffect, EffectComposer, EffectPass, RenderPass, SMAAEffect, SMAAPreset,
  ToneMappingEffect, ToneMappingMode,
} from "postprocessing";
import { N8AOPostPass } from "n8ao";
import Stats from "stats-gl";

/** Keep the approved-spike WebGL2 pipeline; do not create dynamic interior shadows. */
export function createRendering(container: HTMLElement) {
  const renderer = new THREE.WebGLRenderer({antialias:false,stencil:false,powerPreference:"high-performance"});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.info.autoReset = false;
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute("aria-label","Interactive 3D kit preview. Equivalent asset list is available in the catalog.");
  container.append(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#19232d");
  scene.add(new THREE.HemisphereLight("#edf5ff","#596372",2.2));
  const key = new THREE.DirectionalLight("#fff5e5",2.8);
  key.position.set(2,8,5); scene.add(key);
  const camera = new THREE.PerspectiveCamera(54,1,0.05,150);
  const composer = new EffectComposer(renderer,{frameBufferType:THREE.HalfFloatType});
  composer.addPass(new RenderPass(scene,camera));
  const ao = new N8AOPostPass(scene,camera,1,1);
  ao.configuration.aoRadius = 0.6;
  ao.configuration.distanceFalloff = 1;
  ao.configuration.intensity = 3.5;
  ao.configuration.color = new THREE.Color("#101725");
  ao.configuration.gammaCorrection = false;
  ao.setQualityMode("Medium"); composer.addPass(ao);
  const bloom = new BloomEffect({luminanceThreshold:1,luminanceSmoothing:0.15,intensity:0.55,mipmapBlur:true});
  composer.addPass(new EffectPass(camera,
    bloom,
    new ToneMappingEffect({mode:ToneMappingMode.ACES_FILMIC}),
  ));
  composer.addPass(new EffectPass(camera,new SMAAEffect({preset:SMAAPreset.HIGH})));
  const stats = new Stats({trackGPU:true,horizontal:true});
  // Use explicit begin/end so GPU timing encloses every composer pass, not each scene render.
  void stats.init(renderer.domElement);
  stats.dom.classList.add("stats"); container.append(stats.dom);
  const resize = () => {
    const {width,height} = container.getBoundingClientRect();
    camera.aspect=width/height; camera.updateProjectionMatrix();
    renderer.setSize(width,height); composer.setSize(width,height);
  };
  const observer = new ResizeObserver(resize); observer.observe(container); resize();
  return { renderer,scene,camera,composer,stats,resize,ao,bloom,
    dispose() { observer.disconnect(); composer.dispose(); renderer.dispose(); stats.dom.remove(); },
  };
}
