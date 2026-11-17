import * as THREE from "three";
import { cargarKitEstacion, ESCALA_ESTACION, pieza, type PiezaEstacion } from "./kitEstacion";
import type { PuntoSala } from "./salaKit";
import { AMBIENTE_KIT, ALTURA_PISO, colocarTramos, CRUCE_T, FIN, luzTecho, PARED, puertaVisible, TRAMO, type Tramo } from "./kitPastel";
import { guiaPiso, letrero, type Segmento } from "./guias";

/**
 * The corridor at the heart of the base: every room opens off it. Pastel kit pieces (see `kitPastel.ts`).
 * Main run along x, one tile every `TRAMO` m: workshop end, T crossing (greenhouse to +z), T crossing (airlock
 * to -z, where the kid comes in from Mars), T crossing (control room to +z), habitat end. Lit dashes on the
 * floor lead to each door (`guias.ts`).
 */

export { TRAMO };

const TRAMOS: readonly Tramo[] = [
  [-2, 0, 2, FIN],
  [-1, 0, 0, CRUCE_T],
  [0, 0, 2, CRUCE_T],
  [1, 0, 0, CRUCE_T],
  [2, 0, 0, FIN],
  [-1, 1, 3, FIN],
  [0, -1, 1, FIN],
  [1, 1, 3, FIN],
];

const RAMAL = TRAMO + PARED - 0.35;
/** Walkable boxes: the main run and the three branches. A position is valid inside any of them. */
export const ZONAS_PASILLO = [
  { xMin: -2 * TRAMO - PARED + 0.35, xMax: 2 * TRAMO + PARED - 0.35, zMin: -1.15, zMax: 1.15 },
  { xMin: -1.1, xMax: 1.1, zMin: -RAMAL, zMax: 0 },
  { xMin: -TRAMO - 1.1, xMax: -TRAMO + 1.1, zMin: 0, zMax: RAMAL },
  { xMin: TRAMO - 1.1, xMax: TRAMO + 1.1, zMin: 0, zMax: RAMAL },
] as const;

const MARCA = 2 * TRAMO + PARED - 0.45;
const FONDO = TRAMO + PARED - 0.45;
/** Doors at the five ends: where they lead, the marker spot and where the kid appears coming from there. */
export const PUERTAS_PASILLO = [
  { destino: "taller", x: -MARCA, z: 0, entrada: { x: -MARCA + 1.8, z: 0, giro: Math.PI / 2 } },
  { destino: "habitat", x: MARCA, z: 0, entrada: { x: MARCA - 1.8, z: 0, giro: -Math.PI / 2 } },
  { destino: "esclusa", x: 0, z: -FONDO, entrada: { x: 0, z: -FONDO + 1.8, giro: 0 } },
  { destino: "invernadero", x: -TRAMO, z: FONDO, entrada: { x: -TRAMO, z: FONDO - 1.8, giro: Math.PI } },
  { destino: "control", x: TRAMO, z: FONDO, entrada: { x: TRAMO, z: FONDO - 1.8, giro: Math.PI } },
] as const;

/** Which branch a spot is in ("<tile>:<side>"), or null on the main run. The camera turns only between them. */
export function ramalPasillo(x: number, z: number): string | null {
  return Math.abs(z) > 1.4 ? `${Math.round(x / TRAMO)}:${Math.sign(z)}` : null;
}

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
    const fondo = p.z === 0 ? { x: Math.sign(p.x) * (2 * TRAMO + PARED - 0.08), z: 0 } : { x: p.x, z: Math.sign(p.z) * (TRAMO + PARED - 0.08) };
    raiz.add(puertaVisible(p.destino, fondo.x, fondo.z, p.entrada.giro));
    // The room's sign at eye height on the door leaf.
    const placa = letrero(p.destino, 0.46);
    placa.position.set(fondo.x + Math.sin(p.entrada.giro) * 0.13, 1.2, fondo.z + Math.cos(p.entrada.giro) * 0.13);
    placa.rotation.y = p.entrada.giro;
    raiz.add(placa);
  }
  for (const x of [-2 * TRAMO, 0, 2 * TRAMO]) raiz.add(luzTecho(x, 0));
  for (const p of PUERTAS_PASILLO) if (p.z !== 0) raiz.add(luzTecho(p.x, Math.sign(p.z) * TRAMO, 2.5));
  // Lit dashes: down the main run, then up each branch to its door; a yellow line at every threshold.
  const tramos: Segmento[] = [[-MARCA + 0.5, 0, MARCA - 0.5, 0]];
  for (const p of PUERTAS_PASILLO) if (p.z !== 0) tramos.push([p.x, Math.sign(p.z) * 1.3, p.x, p.z - Math.sign(p.z) * 0.5]);
  const umbrales = PUERTAS_PASILLO.map((p) => ({ x: p.x + Math.sin(p.entrada.giro) * 0.15, z: p.z + Math.cos(p.entrada.giro) * 0.15, giro: p.entrada.giro }));
  raiz.add(guiaPiso(tramos, umbrales, ALTURA_PISO + 0.01, 1.7));
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
