import * as THREE from "three";
import { fusionar } from "../fusionar";
import { cajaBandas, cajaRejilla, matafuego, tanqueO2, traje } from "./propsEstacion";
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
 * Life along the corridor, code-built props (`propsEstacion.ts`): fire extinguishers on the walls by the end
 * doors, a stack of crates and a gas tank against the walls of the crossings, a spare suit by the airlock branch.
 * [builder, x, z, y (metres; the floor panels are ALTURA_PISO up), turn in radians, collision radius in m].
 */
const EQUIPO: readonly (readonly [() => THREE.Object3D, number, number, number, number, number])[] = [
  [matafuego, -2 * TRAMO - 0.6, 1.35, ALTURA_PISO + 0.45, Math.PI, 0.3],
  [matafuego, 2 * TRAMO + 0.6, -1.35, ALTURA_PISO + 0.45, 0, 0.3],
  [cajaRejilla, -TRAMO - 0.6, -1.15, ALTURA_PISO, 0, 0.55],
  [cajaBandas, -TRAMO - 0.6, -1.15, ALTURA_PISO + 0.8, 0.4, 0],
  [tanqueO2, 1.3, 1.3, ALTURA_PISO, 0, 0],
  [traje, 1.25, -TRAMO - 0.6, ALTURA_PISO, -Math.PI / 2, 0.35],
];

/** Obstacles of the corridor (the equipment above, by its centre). */
export const PUNTOS_PASILLO: PuntoSala[] = EQUIPO.filter(([, , , , , r]) => r > 0)
  .map(([f, x, z, , , radio], i) => ({ id: `${f.name}_${i}`, x, z, radio, interactivo: false }));

/** Builds the corridor. Returns the group at once and adds the kit shell when it arrives. */
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
  const equipo = new THREE.Group();
  for (const [f, x, z, y, giro] of EQUIPO) {
    const o = f();
    o.position.set(x, y, z);
    o.rotation.y = giro;
    equipo.add(o);
  }
  raiz.add(fusionar(equipo, "Corridor_Equipment"));
  return raiz;
}

export const AMBIENTE_PASILLO = AMBIENTE_KIT;
