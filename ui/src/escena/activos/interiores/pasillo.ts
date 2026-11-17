import * as THREE from "three";
import { AMBIENTE_KIT, colocarTramos, CRUCE_T, FIN, luzTecho, PARED, puertaVisible, RECTO, TRAMO, type Tramo } from "./kitPastel";

/**
 * Experimental: the corridor that joins the workshop and the habitat, with a side branch to the airlock.
 * Pastel kit pieces (see `kitPastel.ts`). Layout along x, one tile every `TRAMO` m: workshop end, straight,
 * T crossing (branch to -z, the airlock), straight, habitat end.
 */

export { TRAMO };

const TRAMOS: readonly Tramo[] = [
  [-2, 0, 2, FIN],
  [-1, 0, 0, RECTO],
  [0, 0, 2, CRUCE_T],
  [1, 0, 0, RECTO],
  [2, 0, 0, FIN],
  [0, -1, 1, FIN],
];

/** Walkable boxes: the main run and the branch. A position is valid inside any of them. */
export const ZONAS_PASILLO = [
  { xMin: -2 * TRAMO - PARED + 0.35, xMax: 2 * TRAMO + PARED - 0.35, zMin: -1.15, zMax: 1.15 },
  { xMin: -1.1, xMax: 1.1, zMin: -TRAMO - PARED + 0.35, zMax: 0 },
] as const;

const MARCA = 2 * TRAMO + PARED - 0.45;
/** Doors at the three ends: where they lead, the marker spot and where the kid appears coming from there. */
export const PUERTAS_PASILLO = [
  { destino: "taller", x: -MARCA, z: 0, entrada: { x: -MARCA + 1.8, z: 0, giro: Math.PI / 2 } },
  { destino: "habitat", x: MARCA, z: 0, entrada: { x: MARCA - 1.8, z: 0, giro: -Math.PI / 2 } },
  { destino: "base", x: 0, z: -(TRAMO + PARED - 0.45), entrada: { x: 0, z: -(TRAMO + PARED - 0.45) + 1.8, giro: 0 } },
] as const;

/** Builds the corridor. Returns the group at once and adds the kit pieces when they arrive. */
export function crearPasillo(): THREE.Group {
  const raiz = new THREE.Group();
  raiz.name = "Corridor_Kit";
  for (const p of PUERTAS_PASILLO) {
    const fondo = p.z === 0 ? { x: Math.sign(p.x) * (2 * TRAMO + PARED - 0.08), z: 0 } : { x: 0, z: -(TRAMO + PARED - 0.08) };
    raiz.add(puertaVisible(p.destino, fondo.x, fondo.z, p.entrada.giro));
  }
  for (const x of [-2 * TRAMO, -TRAMO, 0, TRAMO, 2 * TRAMO]) raiz.add(luzTecho(x, 0));
  raiz.add(luzTecho(0, -TRAMO, 2.5));
  colocarTramos(raiz, TRAMOS);
  return raiz;
}

export const AMBIENTE_PASILLO = AMBIENTE_KIT;
