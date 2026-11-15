import * as THREE from "three";
import { it } from "vitest";
import { CAMARAS, fovParaAspecto } from "./escena3d";
import { rocaPrimerPlanoLibre } from "./armado";
it("scan", () => {
  for (const [w, h] of [[1024, 683], [844, 390]] as const) {
    const c = new THREE.PerspectiveCamera(fovParaAspecto("tercera", w / h), 60, w / h, 0.1);
    c.fov = fovParaAspecto("tercera", w / h); c.aspect = w / h; c.updateProjectionMatrix();
    c.position.set(...CAMARAS.tercera.pos); c.lookAt(new THREE.Vector3(...CAMARAS.tercera.mira)); c.updateMatrixWorld(true);
    for (const esc of [1.4]) {
      const r = esc * 1.2, out: string[] = [];
      for (let x = -9; x <= 10; x += 0.25) for (let z = 0; z <= 5; z += 0.25) {
        const p = new THREE.Vector3(x, esc * 0.6, z).project(c);
        if (rocaPrimerPlanoLibre(x, z, r)) out.push(`${x},${z}:${p.x.toFixed(2)},${p.y.toFixed(2)}`);
      }
      console.log("SCAN", w, esc, out.join(" "));
    }
  }
});
