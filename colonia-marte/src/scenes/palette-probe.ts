import {
  AmbientLight, Mesh, PerspectiveCamera, Scene, WebGLRenderer, WebGLRenderTarget,
} from "three";
import { chamferBox } from "../kit/primitives";
import { coloredGeometry } from "../materials/uv";
import { materials } from "../materials/shared";

/** Real WebGL readback, independent of postprocessing, AO and screenshots. */
export function probePalettePixel() {
  const renderer = new WebGLRenderer({ antialias: false });
  const target = new WebGLRenderTarget(32, 32);
  const scene = new Scene();
  const camera = new PerspectiveCamera(45, 1, 0.1, 10);
  camera.position.z = 3;
  const geometry = coloredGeometry(chamferBox(1, 1, 1, 0.04), "white").clone();
  scene.add(new Mesh(geometry, materials.M_palette), new AmbientLight(0xffffff, 2));
  const read = () => {
    renderer.render(scene, camera);
    const pixel = new Uint8Array(4);
    renderer.readRenderTargetPixels(target, 16, 16, 1, 1, pixel);
    return Array.from(pixel);
  };
  try {
    renderer.setRenderTarget(target);
    const white = read();
    geometry.getAttribute("color").array.fill(0);
    geometry.getAttribute("color").needsUpdate = true;
    const black = read();
    return { white, black, webgl: renderer.getContext().getParameter(renderer.getContext().VERSION) };
  } finally {
    geometry.dispose(); target.dispose(); renderer.dispose();
  }
}

/** Diagnostic page exposes the same readback for manual inspection or any browser runner. */
export function mountPaletteProbe() {
  const app = document.getElementById("app")!;
  const heading = document.createElement("h1"); heading.textContent = "Palette pixel probe";
  const result = document.createElement("pre"); result.id = "pixel-result";
  app.replaceChildren(heading, result);
  try {
    const pixels = probePalettePixel();
    const passed = Math.min(...pixels.white.slice(0, 3)) > 40 &&
      Math.max(...pixels.black.slice(0, 3)) < 5 && pixels.white[3] === 255;
    result.textContent = JSON.stringify({ passed, ...pixels }, null, 2);
    document.title = `${passed ? "PASS" : "FAIL"} | Palette pixel probe`;
  } catch (error) {
    result.textContent = `UNVERIFIED: ${String(error)}`;
    document.title = "UNVERIFIED | Palette pixel probe";
  }
}
