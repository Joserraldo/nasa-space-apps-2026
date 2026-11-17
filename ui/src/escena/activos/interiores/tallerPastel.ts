import * as THREE from "three";
import type { Materiales } from "../../materiales";
import { fusionar } from "../fusionar";
import { AMBIENTE_KIT, colocarTramos, CRUCE_T, CURVA, luzTecho, PARED, puertaVisible, TRAMO, type Tramo } from "./kitPastel";
import type { PuntoSala } from "./salaKit";
import { banco, dock, estanteBaterias } from "./taller";

/**
 * Experimental: the workshop as a pastel kit hall (see `kitPastel.ts`), 3 x 2 tiles: sharp bends at the
 * corners and T crossings on the long walls, whose open sides meet in the middle and leave the kit's
 * columns between them. The door to the corridor is in the front wall; the engineer's own furniture
 * (battery shelf, bench, rover dock) stands against the walls.
 */

/** Inner faces of the walls. */
const MURO_X = TRAMO + PARED;
const MURO_Z = TRAMO / 2 + PARED;

const TRAMOS: readonly Tramo[] = [
  [-1, -0.5, 1, CURVA], [0, -0.5, 0, CRUCE_T], [1, -0.5, 0, CURVA],
  [-1, 0.5, 2, CURVA], [0, 0.5, 2, CRUCE_T], [1, 0.5, 3, CURVA],
];

/** [builder, x, z, turn]. */
const MUEBLES: readonly (readonly [(m: Materiales) => THREE.Object3D, number, number, number])[] = [
  [estanteBaterias, -MURO_X + 1.2, -MURO_Z + 0.7, 0],
  [banco, 0, -MURO_Z + 0.7, 0],
  [dock, MURO_X - 1.2, 0.9, -Math.PI / 2],
];

export const ZONAS_TALLER_PASTEL = [{ xMin: -MURO_X + 0.4, xMax: MURO_X - 0.4, zMin: -MURO_Z + 0.4, zMax: MURO_Z - 0.4 }] as const;

const MARCA_Z = MURO_Z - 0.45;
export const PUERTAS_TALLER_PASTEL = [
  { destino: "pasillo", x: 0, z: MARCA_Z, entrada: { x: 0, z: MARCA_Z - 1.8, giro: Math.PI } },
] as const;

/** Furniture to bump into and use, and the two columns where the open sides of the tiles meet. */
export function puntosTallerPastel(): PuntoSala[] {
  const muebles = MUEBLES.map(([f, x, z]) => ({ id: f.name, x, z, radio: 0.95, interactivo: true }));
  const columnas = [-1, 1].map((lado, i) => ({ id: `columna_${i}`, x: (lado * TRAMO) / 2, z: 0, radio: 0.55, interactivo: false }));
  return [...muebles, ...columnas];
}

export function crearTallerPastel(materiales: Materiales): THREE.Group {
  const raiz = new THREE.Group();
  raiz.name = "Workshop_Kit";
  const muebles = new THREE.Group();
  for (const [f, x, z, giro] of MUEBLES) {
    const o = f(materiales);
    o.position.set(x, 0, z);
    o.rotation.y = giro;
    muebles.add(o);
  }
  raiz.add(fusionar(muebles, "Workshop_Own_Furniture"));
  raiz.add(puertaVisible("pasillo", 0, MURO_Z - 0.08, Math.PI));
  // Lights pulled toward the middle, so none sits close to a wall and burns a spot on it.
  for (const [tx, tz] of TRAMOS) raiz.add(luzTecho(tx * TRAMO * 0.7, tz * TRAMO * 0.6, 1.8));
  colocarTramos(raiz, TRAMOS);
  return raiz;
}

export const AMBIENTE_TALLER_PASTEL = AMBIENTE_KIT;
