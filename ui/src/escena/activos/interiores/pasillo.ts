import * as THREE from "three";
import { cargarKitEstacion, ESCALA_ESTACION, pieza, type PiezaEstacion } from "./kitEstacion";
import type { PuntoSala } from "./salaKit";
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
  { destino: "esclusa", x: 0, z: -(TRAMO + PARED - 0.45), entrada: { x: 0, z: -(TRAMO + PARED - 0.45) + 1.8, giro: 0 } },
] as const;

/**
 * Life along the corridor, from the station kit (CC BY, Likh0i): fire extinguishers by the doors, gas tanks
 * and crates in the T crossing's side bays, a spare suit by the airlock branch. [piece, x, z (metres, grid
 * corner), quarter turns, collision radius in m].
 */
const EQUIPO: readonly (readonly [PiezaEstacion, number, number, number, number])[] = [
  ["Fire_Extinguisher_1", -2 * TRAMO + 0.4, 1.0, 2, 0.3],
  ["Fire_Extinguisher_1", 2 * TRAMO - 0.4, -1.0, 0, 0.3],
  ["Tank_O2_46", 1.3, 1.45, 0, 0],
  ["Cube_1_26", -1.9, 0.85, 0, 0.45],
  ["Cube_2_27", -TRAMO - 0.6, -1.35, 0, 0.45],
  ["Spacesuite_full_4", 1.25, -TRAMO - 0.6, 3, 0.35],
  ["Fire_Extinguisher_Base_18", -1.25, -TRAMO, 1, 0],
];

/** Obstacles of the corridor (the equipment above). */
export const PUNTOS_PASILLO: PuntoSala[] = EQUIPO.filter(([, , , , r]) => r > 0)
  .map(([nombre, x, z, , radio], i) => ({ id: `${nombre.replace(/_\d+$/, "")}_${i}`, x: x + 0.3, z: z + 0.3, radio, interactivo: false }));

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
  void cargarKitEstacion().then((kit) => {
    for (const [nombre, x, z, cuartos] of EQUIPO) {
      const o = pieza(kit, nombre, x, z, cuartos);
      o.scale.setScalar(ESCALA_ESTACION);
      raiz.add(o);
    }
  });
  return raiz;
}

export const AMBIENTE_PASILLO = AMBIENTE_KIT;
