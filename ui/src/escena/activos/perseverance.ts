/**
 * Perseverance low poly, dibujado en código (Etapa D3). Sigue la forma del "Mars 2020 Perseverance Rover" de NASA 3D
 * Resources en la pose con el mástil arriba y el brazo afuera: caja de electrónica blanca, mástil al frente a la
 * derecha con la cabeza de cámaras, brazo robótico al frente con la torreta, generador (MMRTG) inclinado atrás con
 * aletas negras, antena de alta ganancia hexagonal, seis ruedas de aluminio con balancín (rocker-bogie). Sin insignia.
 *
 * El modelo de NASA reducido por colapso de aristas a 8.000 triángulos perdía la forma (decisión de María Paula, 18
 * nov): se dibuja propio, con sus colores planos en color por vértice, una sola malla y un material. Medidas en metros,
 * frente hacia +z, base en y = 0 (el rover real mide unos 3 m de largo, 2,7 de ancho y 2,2 de alto). [E]
 */
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { conPolvo } from "./polvoKit";

/** Colores planos (sRGB) tomados del modelo de NASA. */
const COLOR = {
  blanco: 0xe4e2dc,
  gris: 0x8f8d88,
  aluminio: 0xb4b2ac,
  oscuro: 0x3a3836,
  negro: 0x161514,
  oro: 0xc9962e,
} as const;
type Tono = keyof typeof COLOR;

type V3 = readonly [number, number, number];

/** Pieza: geometría colocada y pintada (color por vértice), lista para fusionar. */
function pieza(g: THREE.BufferGeometry, tono: Tono, pos: V3, rot: V3 = [0, 0, 0], escala: V3 = [1, 1, 1]): THREE.BufferGeometry {
  const x = g.index ? g.toNonIndexed() : g;
  if (x !== g) g.dispose();
  for (const k of Object.keys(x.attributes)) if (k !== "position" && k !== "normal") x.deleteAttribute(k);
  const m = new THREE.Matrix4().compose(new THREE.Vector3(...pos), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)), new THREE.Vector3(...escala));
  x.applyMatrix4(m);
  const c = new THREE.Color(COLOR[tono]);
  const n = x.getAttribute("position").count;
  const col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) col.set([c.r, c.g, c.b], i * 3);
  x.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return x;
}

const caja = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
const cil = (r0: number, r1: number, h: number, lados: number) => new THREE.CylinderGeometry(r0, r1, h, lados);

/** Barra de `a` a `b` (sección cuadrada `s`). */
function barra(a: V3, b: V3, s: number, tono: Tono): THREE.BufferGeometry {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
  const largo = va.distanceTo(vb);
  const g = caja(s, largo, s);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
  const e = new THREE.Euler().setFromQuaternion(q);
  const c = va.add(vb).multiplyScalar(0.5);
  return pieza(g, tono, [c.x, c.y, c.z], [e.x, e.y, e.z]);
}

/** Rueda de aluminio con banda oscura de rodadura y cubo (eje sobre x). */
function rueda(x: number, z: number, r: number): THREE.BufferGeometry[] {
  const giro: V3 = [0, 0, Math.PI / 2];
  return [
    pieza(cil(r, r, 0.26, 12), "aluminio", [x, r, z], giro),
    pieza(cil(r * 1.02, r * 1.02, 0.2, 12), "oscuro", [x, r, z], giro),
    pieza(cil(r * 0.3, r * 0.3, 0.3, 6), "gris", [x, r, z], giro),
  ];
}

/** Geometría completa del rover (una sola, con color por vértice). Unos 1.500 triángulos. */
export function geometriaPerseverance(): THREE.BufferGeometry {
  const p: THREE.BufferGeometry[] = [];
  const r = 0.3;
  const alto = 0.66; // base de la caja de electrónica (0,6 m del suelo en el real)
  // Caja de electrónica (WEB) y cubierta.
  p.push(pieza(caja(1.15, 0.42, 1.75), "blanco", [0, alto + 0.21, -0.05]));
  p.push(pieza(caja(1.25, 0.05, 1.85), "gris", [0, alto + 0.44, -0.05]));
  p.push(pieza(caja(1.16, 0.12, 1.4), "oscuro", [0, alto - 0.04, -0.05]));
  // Lámina dorada y panel gris del costado (como el modelo de NASA).
  for (const s of [-1, 1]) {
    p.push(pieza(caja(0.02, 0.24, 0.5), "oro", [s * 0.585, alto + 0.22, 0.35]));
    p.push(pieza(caja(0.02, 0.2, 0.4), "gris", [s * 0.585, alto + 0.2, -0.45]));
  }
  // Equipos sobre la cubierta: caja de muestras, cajas grises y la antena de alta ganancia hexagonal (atrás a la izquierda).
  p.push(pieza(caja(0.55, 0.18, 0.5), "blanco", [0.15, alto + 0.56, 0.25]));
  p.push(pieza(caja(0.3, 0.12, 0.35), "gris", [-0.32, alto + 0.53, 0.35]));
  p.push(pieza(cil(0.06, 0.06, 0.25, 6), "gris", [-0.38, alto + 0.6, -0.42]));
  p.push(pieza(cil(0.28, 0.28, 0.04, 6), "gris", [-0.38, alto + 0.76, -0.42], [0.5, 0, 0]));
  p.push(pieza(cil(0.05, 0.05, 0.3, 6), "blanco", [0.4, alto + 0.6, -0.55])); // antena UHF
  // Generador (MMRTG) atrás, inclinado hacia arriba, con aletas negras.
  const rtg: V3 = [0, alto + 0.42, -1.05];
  p.push(pieza(cil(0.2, 0.2, 0.75, 8), "negro", rtg, [-0.55, 0, 0]));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    p.push(pieza(caja(0.02, 0.62, 0.14), "negro", [Math.cos(a) * 0.24, rtg[1] + Math.sin(a) * 0.24 * Math.cos(0.55), rtg[2] + Math.sin(a) * 0.24 * Math.sin(0.55)], [-0.55, 0, a]));
  }
  p.push(pieza(caja(0.5, 0.06, 0.5), "gris", [0, alto + 0.3, -0.92]));
  // Mástil (Remote Sensing Mast) al frente a la derecha y su cabeza: caja con SuperCam y las dos Mastcam-Z.
  const mx = 0.42, mz = 0.72;
  p.push(pieza(caja(0.1, 0.85, 0.1), "blanco", [mx, alto + 0.85, mz]));
  p.push(pieza(caja(0.16, 0.12, 0.16), "oscuro", [mx, alto + 1.3, mz]));
  const cy = alto + 1.46;
  p.push(pieza(caja(0.42, 0.24, 0.26), "blanco", [mx, cy, mz + 0.04]));
  p.push(pieza(cil(0.07, 0.07, 0.08, 8), "negro", [mx, cy + 0.02, mz + 0.2], [Math.PI / 2, 0, 0])); // SuperCam
  for (const s of [-1, 1]) p.push(pieza(caja(0.08, 0.08, 0.12), "oscuro", [mx + s * 0.16, cy - 0.08, mz + 0.16]));
  // Brazo robótico al frente (2 tramos) y torreta con instrumentos.
  const hombro: V3 = [-0.3, alto + 0.25, 0.85];
  const codo: V3 = [-0.28, alto + 0.42, 1.5];
  const muneca: V3 = [-0.12, alto + 0.1, 1.9];
  p.push(pieza(cil(0.09, 0.09, 0.18, 8), "oscuro", hombro, [0, 0, Math.PI / 2]));
  p.push(barra(hombro, codo, 0.08, "blanco"));
  p.push(pieza(cil(0.07, 0.07, 0.16, 8), "oscuro", codo, [0, 0, Math.PI / 2]));
  p.push(barra(codo, muneca, 0.07, "blanco"));
  p.push(pieza(cil(0.17, 0.17, 0.2, 6), "gris", [muneca[0], muneca[1] - 0.12, muneca[2]]));
  p.push(pieza(caja(0.1, 0.16, 0.1), "oro", [muneca[0] + 0.15, muneca[1] - 0.18, muneca[2]]));
  p.push(pieza(caja(0.08, 0.2, 0.08), "oscuro", [muneca[0] - 0.14, muneca[1] - 0.2, muneca[2] + 0.04]));
  // Cámaras de peligro al frente y atrás.
  p.push(pieza(caja(0.5, 0.08, 0.06), "negro", [0, alto + 0.1, 0.84]));
  p.push(pieza(caja(0.4, 0.08, 0.06), "negro", [0, alto + 0.1, -0.94]));
  // Ruedas (dos ejes de 1,4 m de trocha) y balancín: rocker del pivote del costado a la rueda delantera y al bogie;
  // bogie entre la del medio y la de atrás.
  const x = 1.32 / 2 + 0.2;
  const zf = 1.05, zm = 0.0, zt = -0.95;
  for (const s of [-1, 1]) {
    for (const z of [zf, zm, zt]) p.push(...rueda(s * x, z, r));
    const pivote: V3 = [s * (x - 0.02), alto + 0.05, 0.25];
    const bogie: V3 = [s * (x - 0.02), r + 0.38, -0.48];
    p.push(pieza(cil(0.07, 0.07, 0.12, 6), "gris", pivote, [0, 0, Math.PI / 2]));
    p.push(barra(pivote, [s * (x - 0.02), r + 0.32, zf], 0.07, "oscuro"));
    p.push(barra([s * (x - 0.02), r + 0.32, zf], [s * x, r, zf], 0.06, "oscuro"));
    p.push(barra(pivote, bogie, 0.07, "oscuro"));
    p.push(barra(bogie, [s * x, r + 0.22, zm], 0.06, "oscuro"));
    p.push(barra(bogie, [s * x, r + 0.22, zt], 0.06, "oscuro"));
    p.push(barra([s * x, r + 0.22, zm], [s * x, r, zm], 0.05, "oscuro"));
    p.push(barra([s * x, r + 0.22, zt], [s * x, r, zt], 0.05, "oscuro"));
  }
  // Barra diferencial que cruza la cubierta.
  p.push(pieza(caja(1.5, 0.05, 0.06), "oscuro", [0, alto + 0.47, 0.25]));
  const g = mergeGeometries(p, false)!;
  for (const x of p) x.dispose();
  g.computeVertexNormals();
  g.computeBoundingSphere();
  return g;
}

/** Material mate con polvo desde abajo (el rover lleva años en Jezero). */
export function materialPerseverance(): THREE.MeshStandardMaterial {
  return conPolvo(new THREE.MeshStandardMaterial({ name: "Perseverance", vertexColors: true, roughness: 0.85, metalness: 0.05 }), {
    base: 0.12,
    suelo: 0.55,
    arriba: 0.4,
    chorreado: 0.1,
  });
}

export function crearPerseverance(): THREE.Mesh {
  const m = new THREE.Mesh(geometriaPerseverance(), materialPerseverance());
  m.name = "NASA_Perseverance";
  m.castShadow = m.receiveShadow = true;
  return m;
}
