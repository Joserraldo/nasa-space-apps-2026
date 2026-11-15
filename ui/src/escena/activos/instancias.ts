/**
 * Instanciado de piezas del kit: repetir balizas, cajas y tramos de camino con pocos draw calls.
 */
import * as THREE from "three";

export interface TransformacionPieza {
  posicion?: [number, number, number];
  /** Euler XYZ en radianes. */
  rotacion?: [number, number, number];
  /** Escala uniforme o por eje. */
  escala?: number | [number, number, number];
}

/**
 * Convierte la pieza maestra que devuelve `fabrica` en un `Group` con una `InstancedMesh` por
 * cada (geometría, material) distinto de la pieza (no por malla), con `transformaciones.length`
 * copias de cada parte. Geometrías y materiales son los de la maestra (compartidos, no se
 * clonan); la maestra en sí no se añade. Sin transformaciones devuelve un grupo vacío.
 */
export function instanciar(fabrica: () => THREE.Group, transformaciones: readonly TransformacionPieza[]): THREE.Group {
  const maestra = fabrica();
  maestra.updateMatrixWorld(true);
  const inversa = new THREE.Matrix4().copy(maestra.matrixWorld).invert();

  // Agrupa partes por (geometría, material) con su matriz relativa a la maestra.
  const partes = new Map<string, { malla: THREE.Mesh; locales: THREE.Matrix4[] }>();
  maestra.traverse((o) => {
    if (!(o instanceof THREE.Mesh) || Array.isArray(o.material)) return;
    const clave = `${o.geometry.uuid}|${o.material.uuid}`;
    let e = partes.get(clave);
    if (!e) partes.set(clave, (e = { malla: o, locales: [] }));
    e.locales.push(new THREE.Matrix4().multiplyMatrices(inversa, o.matrixWorld));
  });

  const salida = new THREE.Group();
  salida.name = `${maestra.name}_Instanced`;
  const cada = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  const matrices = transformaciones.map((t) => {
    const sc = t.escala ?? 1;
    return new THREE.Matrix4().compose(
      p.set(...(t.posicion ?? [0, 0, 0])),
      q.setFromEuler(e.set(...(t.rotacion ?? [0, 0, 0]))),
      typeof sc === "number" ? s.set(sc, sc, sc) : s.set(...sc),
    );
  });
  if (matrices.length === 0) return salida;

  for (const { malla, locales } of partes.values()) {
    const im = new THREE.InstancedMesh(malla.geometry, malla.material, matrices.length * locales.length);
    im.name = malla.name;
    im.castShadow = malla.castShadow;
    im.receiveShadow = malla.receiveShadow;
    let i = 0;
    for (const t of matrices) for (const l of locales) im.setMatrixAt(i++, cada.multiplyMatrices(t, l));
    im.instanceMatrix.needsUpdate = true;
    im.computeBoundingSphere();
    salida.add(im);
  }
  return salida;
}
