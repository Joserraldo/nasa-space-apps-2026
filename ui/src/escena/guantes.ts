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
  /** Reancla las manos a las esquinas inferiores para este aspecto y campo visual (grados). */
  anclar(aspecto: number, fov: number): void;
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

/** Un guante con el antebrazo hacia +Y; lado −1 izquierdo, +1 derecho. Dedos con volumen y pulgar separado. */
function guante(lado: -1 | 1): THREE.BufferGeometry[] {
  const cian = colorToken("cian");
  const marfil = colorToken("traje-marfil");
  const partes = [
    pieza(new THREE.CylinderGeometry(0.066, 0.074, 0.07, 8), marfil, mat(0, 0.035, 0)),
    pieza(new THREE.BoxGeometry(0.12, 0.085, 0.07), cian, mat(0, 0.11, 0)),
  ];
  // Cuatro dedos de dos falanges, curvados hacia la palma (−Z hacia delante, el guante mira al centro).
  for (let i = 0; i < 4; i++) {
    const x = (i - 1.5) * 0.031;
    const largo = i === 0 || i === 3 ? 0.05 : 0.06;
    partes.push(pieza(new THREE.BoxGeometry(0.029, largo, 0.034), cian, mat(x, 0.15 + largo / 2, -0.004, -0.3)));
    partes.push(pieza(new THREE.BoxGeometry(0.027, 0.04, 0.032), cian, mat(x, 0.15 + largo + 0.012, -0.03, -1.0)));
  }
  // Pulgar separado, hacia el centro de la pantalla.
  partes.push(pieza(new THREE.BoxGeometry(0.034, 0.055, 0.038), cian, mat(-lado * 0.08, 0.12, 0.01, 0, lado * 0.9)));
  partes.push(pieza(new THREE.BoxGeometry(0.03, 0.04, 0.034), cian, mat(-lado * 0.105, 0.165, 0.0, 0, lado * 0.5)));
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

/** Escala de los guantes respecto de su modelo (≈ 40 % menos que la primera versión). */
const ESCALA = 0.72;
/** Fracción del semiancho visible (a 0,5 m de la cámara) a la que se ancla cada guante. */
const ANCLA_X = 0.74;
/** Altura del puño en el espacio de la cámara: solo asoma la mano por abajo. */
const Y_PUNO = -0.36;

/** Una sola vez: ambas manos centradas en x = 0 (el lado se reparte al anclar). Devuelve los vértices de la izquierda. */
function construir(): { geometria: THREE.BufferGeometry; izquierda: number } {
  const geos: THREE.BufferGeometry[] = [];
  let izquierda = 0;
  for (const lado of [-1, 1] as const) {
    // Espacio de la cámara (mira hacia −Z): abajo, inclinado hacia delante, palma al centro.
    const m = new THREE.Matrix4().compose(
      new THREE.Vector3(0, Y_PUNO, -0.5),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.8, 0, -lado * 0.25, "ZXY")),
      new THREE.Vector3(ESCALA, ESCALA, ESCALA),
    );
    for (const g of guante(lado)) {
      g.applyMatrix4(m);
      geos.push(g);
      if (lado === -1) izquierda += g.getAttribute("position").count;
    }
  }
  return { geometria: unir(geos), izquierda };
}

export function crearGuantes(materiales: Materiales): Guantes {
  const { geometria, izquierda } = construir();
  const pos = geometria.getAttribute("position") as THREE.BufferAttribute;
  const base = Float32Array.from(pos.array);
  const malla = new THREE.Mesh(geometria, materiales.Rock);
  malla.name = "Gloves_FirstPerson";
  malla.visible = false;
  malla.frustumCulled = false;
  let semianchoActual = NaN;
  const anclar = (aspecto: number, fov: number) => {
    if (!(aspecto > 0)) return;
    const x = 0.5 * Math.tan((fov * Math.PI) / 360) * aspecto * ANCLA_X;
    if (x === semianchoActual) return;
    semianchoActual = x;
    // Solo mueve en X los vértices de cada mano: sin reconstruir geometrías.
    for (let i = 0; i < pos.count; i++) pos.setX(i, base[i * 3]! + (i < izquierda ? -x : x));
    pos.needsUpdate = true;
  };
  anclar(1.5, 70);
  return {
    raiz: malla,
    mostrar(v) {
      malla.visible = v;
    },
    anclar,
  };
}
