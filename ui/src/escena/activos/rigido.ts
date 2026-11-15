/**
 * Personajes en UNA malla (APLICACION §8: la base ya usa ~71 de los 80 draw calls).
 *
 * Cada personaje es un `SkinnedMesh` rígido: cada pieza low-poly se pega al 100 % a un hueso (sin
 * deformar), así los pivotes giran como piezas sueltas pero todo se dibuja en 1 draw call. El
 * color va por vértice desde los tokens (DISEÑO §2), con facetas planas como las láminas. Lo que
 * necesita otro material (vidrio del casco, pantallas con lienzo) va como malla hija de su hueso.
 */
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import { type TokenColor } from "../../estilos/tokens";
import { colorToken } from "../materiales";

type V3 = readonly [number, number, number];

/** Pieza en el espacio del personaje en pose de reposo (y = 0 en el suelo, mira a +Z). */
export interface Pieza {
  geo: THREE.BufferGeometry;
  color: TokenColor;
  hueso: THREE.Bone;
  pos: V3;
  rot?: V3;
  esc?: V3;
}

/** Hueso con nombre en `pos` (relativa al padre), ya colgado del padre si se da. */
export function hueso(nombre: string, pos: V3, padre?: THREE.Object3D): THREE.Bone {
  const h = new THREE.Bone();
  h.name = nombre;
  h.position.set(...pos);
  padre?.add(h);
  return h;
}

/** Material mate, facetado y con color por vértice: uno por personaje (lo libera `liberarEscena`). */
export function materialFacetado(nombre: string): THREE.MeshStandardMaterial {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88, metalness: 0, flatShading: true });
  m.name = nombre;
  return m;
}

/**
 * Funde las piezas en un `SkinnedMesh` atado a `raizHuesos`. Cuelga huesos y malla de `rig`
 * (que debe estar sin transformar al llamar). Las geometrías de entrada no se tocan.
 */
export function mallaRigida(nombre: string, rig: THREE.Object3D, raizHuesos: THREE.Bone, piezas: readonly Pieza[], material: THREE.Material): THREE.SkinnedMesh {
  rig.add(raizHuesos);
  rig.updateMatrixWorld(true);
  const huesos: THREE.Bone[] = [];
  raizHuesos.traverse((o) => { if (o instanceof THREE.Bone) huesos.push(o); });
  const matriz = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const geos = piezas.map((p) => {
    const g = p.geo.index ? p.geo.toNonIndexed() : p.geo.clone();
    for (const k of Object.keys(g.attributes)) if (k !== "position" && k !== "normal") g.deleteAttribute(k);
    g.clearGroups();
    q.setFromEuler(new THREE.Euler(...(p.rot ?? [0, 0, 0])));
    g.applyMatrix4(matriz.compose(new THREE.Vector3(...p.pos), q, new THREE.Vector3(...(p.esc ?? [1, 1, 1]))));
    const n = g.getAttribute("position").count;
    const c = colorToken(p.color);
    const indice = huesos.indexOf(p.hueso);
    if (indice < 0) throw new Error(`${nombre}: el hueso ${p.hueso.name} no cuelga de ${raizHuesos.name}`);
    const colores = new Float32Array(n * 3), idx = new Uint16Array(n * 4), pesos = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      colores.set([c.r, c.g, c.b], i * 3);
      idx[i * 4] = indice;
      pesos[i * 4] = 1;
    }
    g.setAttribute("color", new THREE.BufferAttribute(colores, 3));
    g.setAttribute("skinIndex", new THREE.BufferAttribute(idx, 4));
    g.setAttribute("skinWeight", new THREE.BufferAttribute(pesos, 4));
    return g;
  });
  const geo = mergeGeometries(geos, false);
  for (const g of geos) g.dispose();
  if (!geo) throw new Error(`${nombre}: no se pudieron fundir las piezas`);
  geo.name = nombre;
  const malla = new THREE.SkinnedMesh(geo, material);
  malla.name = nombre;
  malla.castShadow = true;
  malla.receiveShadow = true;
  rig.add(malla);
  rig.updateMatrixWorld(true);
  malla.bind(new THREE.Skeleton(huesos));
  malla.computeBoundingSphere();
  // El radio cubre los gestos (brazo arriba, rodilla en el suelo) sin recalcular por cuadro.
  if (malla.boundingSphere) malla.boundingSphere.radius *= 1.3;
  return malla;
}

/** Cuenta triángulos de un árbol (para tests y la ficha del PR). */
export function triangulos(raiz: THREE.Object3D): number {
  let t = 0;
  raiz.traverse((o) => {
    if (o instanceof THREE.Mesh) t += (o.geometry.index?.count ?? o.geometry.getAttribute("position").count) / 3;
  });
  return t;
}
