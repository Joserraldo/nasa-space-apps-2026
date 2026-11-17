import * as THREE from "three";
import type { Materiales } from "../../materiales";
import { fusionar } from "../fusionar";
import { caja, chaflan, grupo, parte, tronco } from "../piezasComunes";
import { botiquin, camilla, comedor, litera } from "./habitat";
import { AMBIENTE_KIT, colocarTramos, CRUCE_T, CURVA, luzTecho, PARED, puertaVisible, TRAMO, type Tramo } from "./kitPastel";
import type { PuntoSala } from "./puntoSala";
import { banco, dock, estanteBaterias } from "./taller";

/**
 * Experimental: the workshop and the habitat as pastel kit halls (see `kitPastel.ts`), 3 x 2 tiles each:
 * sharp bends at the corners and T crossings on the long walls, whose open sides meet in the middle and
 * leave the kit's columns between them. The door to the corridor is in the front wall.
 *
 * - Workshop (engineer): battery shelf, bench, rover dock.
 * - Habitat (doctor): bunk, dining table, med bed and med kit, plus a crew terminal and a Veggie plant
 *   growth unit: the ISS garden where red romaine lettuce grew (NASA OSDR OSD-269, already a science card
 *   in the game); Veggie lights its plants with red and blue LEDs, which is the pink glow here.
 * The terminal and the Veggie unit are our own builds, in the game's low poly style.
 */

export type SalaPastel = "taller" | "habitat";

/** Inner faces of the walls. */
const MURO_X = TRAMO + PARED;
const MURO_Z = TRAMO / 2 + PARED;

const TRAMOS: readonly Tramo[] = [
  [-1, -0.5, 1, CURVA], [0, -0.5, 0, CRUCE_T], [1, -0.5, 0, CURVA],
  [-1, 0.5, 2, CURVA], [0, 0.5, 2, CRUCE_T], [1, 0.5, 3, CURVA],
];

/** Veggie's LEDs: red and blue light that reads pink-magenta. */
const LED_VEGGIE = new THREE.MeshStandardMaterial({ name: "Veggie_LED", color: "#FF8FC8", emissive: "#FF5FB0", emissiveIntensity: 1.2 });

/** Crew terminal: white chamfered body, dark screen with cyan lines, teal keypad. */
export function terminal(m: Materiales): THREE.Group {
  const pantalla = parte(m, "Boots", caja(0.62, 0.42, 0.04), [0, 1.22, 0.2], "Terminal_Screen");
  pantalla.rotation.x = -0.18;
  const lineas = [0.08, 0, -0.08].map((y, i) => {
    const l = parte(m, "Emissive", caja(0.4 - i * 0.1, 0.03, 0.01), [-0.05 + i * 0.05, 1.22 + y, 0.225], `Terminal_Line_${i}`);
    l.rotation.x = -0.18;
    return l;
  });
  const teclado = parte(m, "Accent", chaflan(0.6, 0.06, 0.28, 0.03), [0, 0.9, 0.34], "Terminal_Keypad");
  teclado.rotation.x = 0.25;
  return grupo(
    "Habitat_Terminal",
    parte(m, "SuitBase", chaflan(0.8, 0.85, 0.55, 0.1), [0, 0.43, 0], "Terminal_Base"),
    parte(m, "SuitBase", chaflan(0.78, 0.7, 0.4, 0.12), [0, 1.2, -0.02], "Terminal_Head"),
    pantalla, ...lineas, teclado,
  );
}

/** Veggie plant growth unit: open frame, three plant pillows with lettuce, LED bank on top. */
export function cultivoVeggie(m: Materiales): THREE.Group {
  const plantas = [-0.3, 0, 0.3].flatMap((x, i) => [
    parte(m, "SuitBase", caja(0.22, 0.08, 0.22), [x, 0.62, 0], `Veggie_Pillow_${i}`),
    // Lettuce as a low rosette: wide open top, narrow base.
    parte(m, "Plant", tronco(0.14, 0.05, 0.14, 7), [x, 0.73, 0], `Veggie_Lettuce_${i}`),
  ]);
  const leds = new THREE.Mesh(caja(0.86, 0.04, 0.34), LED_VEGGIE);
  leds.name = "Veggie_LEDs";
  leds.position.set(0, 1.12, 0);
  return grupo(
    "Habitat_Veggie",
    parte(m, "SuitBase", chaflan(1.0, 0.56, 0.5, 0.06), [0, 0.28, 0], "Veggie_Cabinet"),
    parte(m, "SuitBase", caja(1.0, 0.08, 0.5), [0, 1.18, 0], "Veggie_Top"),
    parte(m, "Accent", caja(0.05, 0.62, 0.05), [-0.47, 0.87, -0.2], "Veggie_Post_L"),
    parte(m, "Accent", caja(0.05, 0.62, 0.05), [0.47, 0.87, -0.2], "Veggie_Post_R"),
    parte(m, "Glass", caja(0.94, 0.56, 0.02), [0, 0.87, 0.24], "Veggie_Bellows"),
    leds, ...plantas,
  );
}

type Mueble = readonly [(m: Materiales) => THREE.Object3D, number, number, number, number];

/** [builder, x, z, turn, collision radius]. Kept off the middle lane from the door. */
const MUEBLES: Readonly<Record<SalaPastel, readonly Mueble[]>> = {
  taller: [
    [estanteBaterias, -MURO_X + 1.2, -MURO_Z + 0.7, 0, 0.95],
    [banco, 0, -MURO_Z + 0.7, 0, 0.95],
    [dock, MURO_X - 1.2, 0.9, -Math.PI / 2, 0.95],
  ],
  habitat: [
    // Rest at the back left; the crew terminal and the garden share the straight stretch of the back wall
    // (the corners close in a diagonal wall that would swallow them).
    [litera, -MURO_X + 1.6, -MURO_Z + 1.1, 0, 1.2],
    [terminal, -1.0, -MURO_Z + 0.45, 0, 0.6],
    [cultivoVeggie, 1.1, -MURO_Z + 0.45, 0, 0.7],
    // Meals on the left wall and the infirmary on the right one, level with the columns: the camera looks
    // at the back wall, so anything in the front half would sit beside or behind it. The front half stays
    // clear as the way in from the door.
    [comedor, -MURO_X + 1.4, -0.3, 0, 1.1],
    [camilla, MURO_X - 1.6, -0.2, 0, 1.0],
    [botiquin, MURO_X - 0.45, -1.7, -Math.PI / 2, 0.5],
  ],
};

export const ZONAS_SALA_PASTEL = [{ xMin: -MURO_X + 0.4, xMax: MURO_X - 0.4, zMin: -MURO_Z + 0.4, zMax: MURO_Z - 0.4 }] as const;

const MARCA_Z = MURO_Z - 0.45;
export const PUERTAS_SALA_PASTEL = [
  { destino: "pasillo", x: 0, z: MARCA_Z, entrada: { x: 0, z: MARCA_Z - 1.8, giro: Math.PI } },
] as const;

/** Furniture to bump into and use, and the two columns where the open sides of the tiles meet. */
export function puntosSalaPastel(sala: SalaPastel): PuntoSala[] {
  const muebles = MUEBLES[sala].map(([f, x, z, , radio]) => ({ id: f.name, x, z, radio, interactivo: true }));
  const columnas = [-1, 1].map((lado, i) => ({ id: `columna_${i}`, x: (lado * TRAMO) / 2, z: 0, radio: 0.55, interactivo: false }));
  return [...muebles, ...columnas];
}

export function crearSalaPastel(sala: SalaPastel, materiales: Materiales): THREE.Group {
  const raiz = new THREE.Group();
  raiz.name = `Room_Kit_${sala}`;
  const muebles = new THREE.Group();
  for (const [f, x, z, giro] of MUEBLES[sala]) {
    const o = f(materiales);
    o.position.set(x, 0, z);
    o.rotation.y = giro;
    muebles.add(o);
  }
  raiz.add(fusionar(muebles, `Room_Own_Furniture_${sala}`));
  raiz.add(puertaVisible("pasillo", 0, MURO_Z - 0.08, Math.PI));
  // Lights pulled toward the middle, so none sits close to a wall and burns a spot on it.
  for (const [tx, tz] of TRAMOS) raiz.add(luzTecho(tx * TRAMO * 0.7, tz * TRAMO * 0.6, 1.8));
  if (sala === "habitat") {
    // The garden's own glow on the wall behind it.
    const brillo = new THREE.PointLight("#FF7FC0", 1.2, 3, 2);
    brillo.position.set(1.1, 1.0, -MURO_Z + 0.9);
    raiz.add(brillo);
  }
  colocarTramos(raiz, TRAMOS);
  return raiz;
}

export const AMBIENTE_SALA_PASTEL = AMBIENTE_KIT;
