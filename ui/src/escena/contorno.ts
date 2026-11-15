/**
 * Contorno cian del objeto interactivo más cercano (lámina `mundo/01`, la consola resaltada).
 *
 * Barato: un casco invertido (caras traseras) de la consola, un 16 % más grande, con un material
 * básico del token `cian`. Una sola malla y una sola llamada de dibujo, que se recoloca sobre la
 * consola del lugar cercano y se oculta si no hay consola a la mano. Sin pasadas de postproceso.
 */
import * as THREE from "three";
import { CONSOLAS } from "./activos/baseExterior";
import { crearConsola } from "./activos/piezasComunes";
import { giroHacia } from "./activos/modulosArmados";
import { colorToken, type Materiales } from "./materiales";
import { lugar, type LugarId } from "./mundo";

/** Partes de la consola que forman la silueta (sin teclas ni iconos: no cambian el contorno). */
const PARTES_SILUETA = ["Console_ScreenFrame", "Console_Desk", "Console_LegL", "Console_LegR", "Console_BackPanel"];
/** Cuánto crece el casco respecto de la consola (grosor de la línea, ~15 cm). */
const ESCALA_CASCO = 1.16;

export interface Contorno {
  malla: THREE.Mesh;
  /** Pone el contorno en la consola de ese lugar; `null` (o un lugar sin consola) lo oculta. */
  colocar(id: LugarId | null): void;
}

/** Silueta de una consola, centrada en su caja; el centro original queda en `userData.centro`. */
export function geometriaCascoConsola(materiales: Materiales): THREE.BufferGeometry {
  const consola = crearConsola(materiales);
  consola.updateMatrixWorld(true);
  const posiciones: number[] = [];
  consola.traverse((o) => {
    if (!(o instanceof THREE.Mesh) || !PARTES_SILUETA.includes(o.name)) return;
    const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    g.applyMatrix4(o.matrixWorld);
    posiciones.push(...(g.getAttribute("position").array as ArrayLike<number>));
    g.dispose();
  });
  const casco = new THREE.BufferGeometry();
  casco.setAttribute("position", new THREE.Float32BufferAttribute(posiciones, 3));
  casco.computeBoundingBox();
  const c = casco.boundingBox!.getCenter(new THREE.Vector3());
  casco.translate(-c.x, -c.y, -c.z);
  casco.userData.centro = c.toArray();
  casco.computeBoundingSphere();
  return casco;
}

export function crearContorno(materiales: Materiales): Contorno {
  const geometria = geometriaCascoConsola(materiales);
  const centro = new THREE.Vector3(...(geometria.userData.centro as [number, number, number]));
  const material = new THREE.MeshBasicMaterial({ color: colorToken("cian").multiplyScalar(1.25), side: THREE.BackSide, toneMapped: false });
  material.name = "Outline_Cyan";
  const malla = new THREE.Mesh(geometria, material);
  malla.name = "Outline_Interactive";
  malla.visible = false;
  malla.frustumCulled = false;
  let actual: LugarId | null | undefined;
  return {
    malla,
    colocar(id) {
      if (id === actual) return;
      actual = id;
      const k = CONSOLAS.find((c) => c.lugar === id);
      if (!id || !k) {
        malla.visible = false;
        return;
      }
      const l = lugar(id);
      const giro = giroHacia(l, l);
      // El centro de la consola, girado y escalado como la pieza real; el casco crece desde ahí.
      const c = centro.clone().multiplyScalar(k.escala).applyAxisAngle(new THREE.Vector3(0, 1, 0), giro);
      malla.position.set(l.mx + c.x, c.y, l.mz + c.z);
      malla.rotation.set(0, giro, 0);
      malla.scale.setScalar(k.escala * ESCALA_CASCO);
      malla.visible = true;
    },
  };
}
