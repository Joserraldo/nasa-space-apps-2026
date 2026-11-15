/** Fusiona mallas de una pieza por material para reducir draw calls. */
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// ---------------------------------------------------------------------------------------------
// Fusión por material
// ---------------------------------------------------------------------------------------------

/**
 * Fusiona una pieza del kit en una malla por material (geometría propia, no compartida: la libera
 * `liberarEscena`). Conserva solo posición, normal y color; proyecta sombra si alguna parte lo hacía.
 */
export function fusionar(pieza: THREE.Object3D, nombre: string): THREE.Group {
  pieza.updateMatrixWorld(true);
  const inversa = new THREE.Matrix4().copy(pieza.matrixWorld).invert();
  const local = new THREE.Matrix4();
  const porMaterial = new Map<THREE.Material, { geos: THREE.BufferGeometry[]; sombra: boolean }>();
  pieza.traverse((o) => {
    if (!(o instanceof THREE.Mesh) || Array.isArray(o.material)) return;
    const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    for (const k of Object.keys(g.attributes)) if (k !== "position" && k !== "normal" && k !== "color") g.deleteAttribute(k);
    g.clearGroups();
    g.applyMatrix4(local.multiplyMatrices(inversa, o.matrixWorld));
    let e = porMaterial.get(o.material);
    if (!e) porMaterial.set(o.material, (e = { geos: [], sombra: false }));
    e.geos.push(g);
    e.sombra ||= o.castShadow;
  });
  const salida = new THREE.Group();
  salida.name = nombre;
  for (const [material, { geos, sombra }] of porMaterial) {
    const g = mergeGeometries(geos, false);
    for (const x of geos) x.dispose();
    if (!g) continue;
    g.computeBoundingSphere();
    const malla = new THREE.Mesh(g, material);
    malla.name = `${nombre}_${material.name}`;
    malla.castShadow = sombra;
    malla.receiveShadow = true;
    salida.add(malla);
  }
  return salida;
}
