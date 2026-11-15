/**
 * Guantes de la primera persona (lámina `mundo/02`): dos manos low poly pegadas a la cámara, abajo
 * a izquierda y derecha, con puño marfil y guante cian.
 *
 * VERSIÓN SIMPLE Y AISLADA: los personajes y guantes definitivos son de María Paula. No existían en
 * ninguna rama al escribir esto. Para reemplazarlos basta con que `crearGuantes` devuelva otra
 * malla con la misma interfaz; `escena3d.ts` solo usa `raiz` y `mostrar`. Una malla, una llamada de
 * dibujo, color por vértice sobre el material compartido `Rock`.
 */
import * as THREE from "three";
import { colorToken, type Materiales } from "./materiales";

export interface Guantes {
  /** Cuélgala de la cámara (que debe estar dentro de la escena). */
  raiz: THREE.Mesh;
  /** Visible solo en primera persona. */
  mostrar(visible: boolean): void;
}


function mat(x: number, y: number, z: number, rx = 0, rz = 0): THREE.Matrix4 {
  return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, 0, rz)), new THREE.Vector3(1, 1, 1));
}

function pieza(g: THREE.BufferGeometry, color: THREE.Color, m: THREE.Matrix4): THREE.BufferGeometry {
  const n = g.index ? g.toNonIndexed() : g;
  n.applyMatrix4(m);
  const c = new Float32Array(n.getAttribute("position").count * 3);
  for (let i = 0; i < c.length; i += 3) c.set([color.r, color.g, color.b], i);
  n.setAttribute("color", new THREE.BufferAttribute(c, 3));
  n.deleteAttribute("uv");
  return n;
}

/** Un guante con el antebrazo hacia +Y; lado −1 izquierdo, +1 derecho. */
function guante(lado: -1 | 1): THREE.BufferGeometry[] {
  const cian = colorToken("cian");
  const marfil = colorToken("traje-marfil");
  const partes = [
    pieza(new THREE.CylinderGeometry(0.062, 0.07, 0.16, 8), marfil, mat(0, 0.04, 0)),
    pieza(new THREE.BoxGeometry(0.115, 0.1, 0.05), cian, mat(0, 0.16, 0)),
  ];
  // Cuatro dedos con la punta algo curvada hacia delante.
  for (let i = 0; i < 4; i++) {
    const x = (i - 1.5) * 0.029;
    const largo = i === 0 || i === 3 ? 0.07 : 0.085;
    partes.push(pieza(new THREE.BoxGeometry(0.026, largo, 0.032), cian, mat(x, 0.21 + largo / 2, -0.004, -0.15)));
    partes.push(pieza(new THREE.BoxGeometry(0.024, 0.04, 0.03), cian, mat(x, 0.215 + largo + 0.012, -0.03, -0.55)));
  }
  // Pulgar hacia fuera.
  partes.push(pieza(new THREE.BoxGeometry(0.03, 0.08, 0.034), cian, mat(lado * 0.075, 0.19, 0.005, 0, -lado * 0.7)));
  return partes;
}

function unir(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const total = geos.reduce((s, g) => s + g.getAttribute("position").count, 0);
  const salida = new THREE.BufferGeometry();
  for (const nombre of ["position", "normal", "color"]) {
    const a = new Float32Array(total * 3);
    let o = 0;
    for (const g of geos) {
      a.set(g.getAttribute(nombre).array as Float32Array, o);
      o += g.getAttribute(nombre).count * 3;
    }
    salida.setAttribute(nombre, new THREE.BufferAttribute(a, 3));
  }
  for (const g of geos) g.dispose();
  return salida;
}

export function crearGuantes(materiales: Materiales): Guantes {
  const geos: THREE.BufferGeometry[] = [];
  for (const lado of [-1, 1] as const) {
    // Espacio de la cámara (mira hacia −Z): abajo en la esquina, inclinados hacia delante y hacia dentro.
    const m = new THREE.Matrix4().compose(
      new THREE.Vector3(lado * 0.4, -0.4, -0.5),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.95, 0, -lado * 0.35, "ZXY")),
      new THREE.Vector3(1, 1, 1),
    );
    for (const g of guante(lado)) {
      g.applyMatrix4(m);
      geos.push(g);
    }
  }
  const malla = new THREE.Mesh(unir(geos), materiales.Rock);
  malla.name = "Gloves_FirstPerson";
  malla.visible = false;
  malla.frustumCulled = false;
  return {
    raiz: malla,
    mostrar(v) {
      malla.visible = v;
    },
  };
}
