/** Edificios fijos de la base: hábitat, torre, corredor y cápsula (mundo/01). */
import * as THREE from "three";
import { geometriaBase, type Materiales } from "../materiales";
import { caja, chaflan, grupo, parte, tenida, tronco } from "./piezasComunes";
import { panelTecho } from "./estaciones";

// El armado los fusiona por material en una malla por slot; frente hacia +z y base en y = 0.

function girada(o: THREE.Object3D, rx: number, ry: number, rz: number): THREE.Object3D {
  o.rotation.set(rx, ry, rz);
  return o;
}

/** Largo del casco del hábitat (eje x), en metros. [E] */
export const LARGO_HABITAT = 6.8;

/**
 * Planta del hábitat (frente hacia +z): `ancho` de remate a remate, `fondo` desde la espalda del
 * casco hasta el borde del escalón, y `dz`, cuánto se adelanta el centro de esa caja respecto del eje.
 */
export function plantaHabitat(largo = LARGO_HABITAT): { ancho: number; fondo: number; dz: number } {
  const espalda = -1.8, escalon = 2.55 + 0.35;
  return { ancho: largo + 2 * (0.3 + 0.45), fondo: escalon - espalda, dz: (escalon + espalda) / 2 };
}

/** Vano de la puerta: 1,2 m de ancho y 1,95 de alto, con las esquinas de arriba recortadas. [E] */
const VANO: readonly [number, number][] = [[-0.6, 0], [0.6, 0], [0.6, 1.7], [0.35, 1.95], [-0.35, 1.95], [-0.6, 1.7]];

/** Hojas de la puerta con la forma del vano, 4 cm de grosor (cara en z = +0,02). */
function hojaPuerta(): THREE.BufferGeometry {
  return geometriaBase("hab-puerta-hoja", () => {
    const g = new THREE.ExtrudeGeometry(new THREE.Shape(VANO.map(([a, b]) => new THREE.Vector2(a, b))), { depth: 0.04, bevelEnabled: false });
    g.translate(0, 0, -0.02);
    return g;
  });
}

/** Marco grueso alrededor del vano: perfil en U de 1,9 x 2,45 con chaflán arriba, 0,22 m de fondo (de z = 0 a 0,22). */
function marcoPuerta(): THREE.BufferGeometry {
  return geometriaBase("hab-puerta-marco", () => {
    // Borde exterior con el vano recortado por abajo: una sola cara en U.
    const contorno: [number, number][] = [[-0.95, 0], [-0.6, 0], [-0.6, 1.7], [-0.35, 1.95], [0.35, 1.95], [0.6, 1.7], [0.6, 0], [0.95, 0], [0.95, 2.2], [0.7, 2.45], [-0.7, 2.45], [-0.95, 2.2]];
    return new THREE.ExtrudeGeometry(new THREE.Shape(contorno.map(([a, b]) => new THREE.Vector2(a, b))), { depth: 0.22, bevelEnabled: false });
  });
}

/** Hábitat alargado (eje x): casco octogonal, remates, puerta central, escalón y ventanas cian. */
export function crearHabitat(m: Materiales, largo = LARGO_HABITAT): THREE.Group {
  const x = largo / 2;
  // Malva grisáceo: índigo de las botas aclarado hacia lila, pintado en el vértice (sin material nuevo).
  const hojas = parte(m, "Rock", tenida("hab-hoja", hojaPuerta(), "indigo-botas", "lila", 0.4), [0, 0.1, 2.27], "Habitat_DoorLeaf");
  const partes: THREE.Object3D[] = [
    girada(parte(m, "SuitBase", chaflan(3.6, 3.0, largo, 0.85), [0, 1.5, 0], "Habitat_Hull"), 0, Math.PI / 2, 0),
    girada(parte(m, "SuitBase", tronco(1.25, 1.25, 0.9, 8), [-x - 0.3, 1.45, 0], "Habitat_EndL"), 0, 0, Math.PI / 2),
    girada(parte(m, "SuitBase", tronco(1.25, 1.25, 0.9, 8), [x + 0.3, 1.45, 0], "Habitat_EndR"), 0, 0, Math.PI / 2),
    parte(m, "SuitBase", chaflan(2.2, 2.7, 0.7, 0.5), [0, 1.35, 1.9], "Habitat_Porch"),
    // Puerta de la lámina `mundo/01` (revisión F3 en #342): vano octogonal hundido 0,2 m tras un marco
    // grueso, hojas malva grisáceo, franja cian arriba y una franja cian vertical a cada lado.
    hojas,
    parte(m, "SuitBase", marcoPuerta(), [0, 0.1, 2.25], "Habitat_DoorFrame"),
    parte(m, "Emissive", caja(0.9, 0.1, 0.02), [0, 2.4, 2.48], "Habitat_DoorLight"),
    parte(m, "Emissive", caja(0.12, 0.9, 0.02), [-0.78, 1.2, 2.48], "Habitat_DoorStripL"),
    parte(m, "Emissive", caja(0.12, 0.9, 0.02), [0.78, 1.2, 2.48], "Habitat_DoorStripR"),
    parte(m, "SuitBase", caja(2.4, 0.14, 0.7), [0, 0.07, 2.55], "Habitat_Step"),
    parte(m, "SuitBase", caja(2.0, 0.14, 0.4), [0, 0.21, 2.45], "Habitat_Step2"),
    parte(m, "SuitBase", caja(0.05, 1.85, 0.03), [0, 1.02, 2.3], "Habitat_DoorSeam"),
    parte(m, "SuitBase", chaflan(2.2, 0.5, 1.4, 0.15), [-1.6, 3.15, -0.2], "Habitat_RoofBox"),
    parte(m, "Accent", caja(largo, 0.12, 0.04), [0, 0.55, 1.81], "Habitat_Band"),
    // Mejillas de la escalera (lámina `mundo/01`).
    parte(m, "SuitBase", caja(0.12, 0.36, 0.7), [-1.26, 0.18, 2.55], "Habitat_StepCheekL"),
    parte(m, "SuitBase", caja(0.12, 0.36, 0.7), [1.26, 0.18, 2.55], "Habitat_StepCheekR"),
  ];
  // Costillas que parten el casco en tramos, entre el porche y las ventanas (lámina `mundo/01`).
  for (const dx of [-1.4, 1.4]) {
    partes.push(girada(parte(m, "SuitBase", chaflan(3.8, 3.12, 0.18, 0.9), [dx, 1.5, 0], "Habitat_Rib"), 0, Math.PI / 2, 0));
  }
  // Ventanas apaisadas, más anchas que altas, como las de las láminas `mundo/01` y `exterior/03`.
  for (const dx of [-3.2, -2.55, -1.9, 1.9, 2.55, 3.2]) {
    partes.push(parte(m, "Emissive", chaflan(0.56, 0.32, 0.04, 0.06), [dx, 1.85, 1.8], "Habitat_Window"));
  }
  // Paneles solares en el techo, a la derecha de la caja de servicio.
  partes.push(...panelTecho(m, [1.4, 3.0, -0.2], 1.3, 1.0), ...panelTecho(m, [2.9, 3.0, -0.2], 1.3, 1.0));
  return grupo("Building_Habitat", ...partes);
}

/** Anillo de `n` montantes marfil entre los paneles de vidrio, a radio `r`, altura `y` y alto `h`. */
function montantesAnillo(m: Materiales, r: number, y: number, h: number, n: number): THREE.Object3D[] {
  return Array.from({ length: n }, (_, i) => {
    const a = ((i + 0.5) / n) * Math.PI * 2;
    const v = parte(m, "SuitBase", caja(0.2, h, 0.22), [Math.sin(a) * r, y, Math.cos(a) * r], "Control_Pane");
    v.rotation.y = a;
    return v;
  });
}

/** Torre de control (lámina `mundo/01`): tambor, anillo de ventanas, cubierta facetada y mástil. */
export function crearTorreControl(m: Materiales): THREE.Group {
  return grupo(
    "Building_Control",
    parte(m, "SuitBase", tronco(4.2, 4.5, 0.5, 10), [0, 0.25, 0], "Control_Plinth"),
    parte(m, "SuitBase", tronco(2.1, 2.5, 3.4, 8), [0, 2.2, 0], "Control_Drum"),
    // Dos tambores delanteros, como en la lámina.
    parte(m, "SuitBase", tronco(1.35, 1.5, 2.7, 8), [-1.9, 1.55, 1.2], "Control_DrumL"),
    parte(m, "SuitBase", tronco(1.35, 1.5, 2.7, 8), [1.9, 1.55, 1.2], "Control_DrumR"),
    parte(m, "Accent", tronco(1.5, 1.5, 0.12, 8), [-1.9, 2.95, 1.2], "Control_CapL"),
    parte(m, "Accent", tronco(1.5, 1.5, 0.12, 8), [1.9, 2.95, 1.2], "Control_CapR"),
    parte(m, "SuitBase", tronco(4.3, 3.6, 0.7, 12), [0, 4.2, 0], "Control_FlangeLow"),
    parte(m, "Emissive", tronco(4.6, 4.6, 2.0, 12), [0, 5.65, 0], "Control_Windows"),
    ...montantesAnillo(m, 4.68, 5.65, 2.1, 12),
    parte(m, "SuitBase", tronco(4.5, 5.0, 0.5, 12), [0, 6.95, 0], "Control_FlangeHigh"),
    parte(m, "SuitBase", tronco(1.4, 3.9, 0.8, 12), [0, 7.6, 0], "Control_Roof"),
    parte(m, "SuitBase", tronco(0.08, 0.1, 1.9, 6), [0.6, 8.9, 0], "Control_Mast"),
    parte(m, "SuitBase", geometriaBase("kit-esfera-mastil", () => new THREE.IcosahedronGeometry(0.2, 0)), [0.6, 9.95, 0], "Control_MastBall"),
    parte(m, "SuitBase", chaflan(2.2, 2.6, 1.4, 0.5), [0, 1.3, 3.1], "Control_Porch"),
    parte(m, "Boots", caja(1.2, 1.8, 0.05), [0, 1.0, 3.82], "Control_DoorLeaf"),
    parte(m, "Emissive", caja(1.0, 0.1, 0.03), [0, 2.2, 3.82], "Control_DoorLight"),
    parte(m, "Emissive", caja(0.12, 0.5, 0.03), [-1.9, 2.0, 2.58], "Control_LightL"),
    parte(m, "Emissive", caja(0.12, 0.5, 0.03), [1.9, 2.0, 2.58], "Control_LightR"),
  );
}
/** Cápsula de servicio: módulo octogonal bajo con cubierta facetada, puerta y luz cian. */
export function crearCapsula(m: Materiales): THREE.Group {
  return grupo(
    "Building_Pod",
    parte(m, "SuitBase", tronco(2.3, 2.5, 2.6, 8), [0, 1.3, 0], "Pod_Body"),
    parte(m, "SuitBase", tronco(1.0, 2.35, 0.9, 8), [0, 3.05, 0], "Pod_Roof"),
    parte(m, "SuitBase", chaflan(1.8, 2.3, 0.8, 0.45), [0, 1.15, 2.4], "Pod_Porch"),
    parte(m, "Boots", caja(1.0, 1.6, 0.05), [0, 0.9, 2.82], "Pod_DoorLeaf"),
    parte(m, "Emissive", caja(0.8, 0.1, 0.03), [0, 1.95, 2.82], "Pod_DoorLight"),
    parte(m, "Accent", tronco(2.42, 2.42, 0.12, 8), [0, 0.5, 0], "Pod_Band"),
    ...panelTecho(m, [0, 3.5, -0.1], 1.0, 0.8),
  );
}


export { crearCorredor } from "./corredores";
export { crearPlataformaNave } from "./nave";
export { crearRefugio } from "./refugio";
