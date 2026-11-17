/** Edificios fijos de la base: hábitat, torre, corredor y cápsula (mundo/01). */
import * as THREE from "three";
import { geometriaBase, type Materiales } from "../materiales";
import { caja, chaflan, grupo, parte, tronco } from "./piezasComunes";
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

/** Media esfera facetada (low poly) de la caché, con la base en y = 0. */
const cupulaGeo = (r: number, lados: number, pisos: number) =>
  geometriaBase(`hub-cupula-${r}-${lados}-${pisos}`, () => new THREE.SphereGeometry(r, lados, pisos, 0, Math.PI * 2, 0, Math.PI / 2));

/**
 * Hábitat central como domo de la colonia (lámina `04_Organizacion/01_distribucion_exterior` e imagen de la
 * colonia): tambor con anillo de ventanas, cúpula facetada con lucernario de vidrio y mástil, y dos alas con
 * remates redondos a los lados. Misma huella, puerta y escalón que el casco alargado de antes (`plantaHabitat`),
 * así que la colisión y la entrada a la base no cambian.
 */
export function crearHabitat(m: Materiales, largo = LARGO_HABITAT): THREE.Group {
  const x = largo / 2;
  const ala = x - 1.5; // largo de cada ala, del tambor al remate
  const partes: THREE.Object3D[] = [
    parte(m, "SuitBase", tronco(1.95, 2.05, 1.3, 12), [0, 0.65, 0], "Habitat_Drum"),
    parte(m, "Accent", tronco(1.97, 1.97, 0.1, 12), [0, 1.32, 0], "Habitat_DrumBand"),
    parte(m, "SuitBase", cupulaGeo(1.9, 12, 4), [0, 1.35, 0], "Habitat_Dome"),
    parte(m, "Glass", cupulaGeo(0.85, 8, 2), [0, 3.05, 0], "Habitat_Skylight"),
    parte(m, "SuitBase", tronco(0.95, 0.95, 0.14, 8), [0, 3.0, 0], "Habitat_SkylightRing"),
    parte(m, "SuitBase", tronco(0.05, 0.05, 0.9, 6), [0, 4.1, 0], "Habitat_Mast"),
    parte(m, "Emissive", tronco(0.1, 0.1, 0.12, 6), [0, 4.6, 0], "Habitat_MastLight"),
    parte(m, "SuitBase", chaflan(2.2, 2.7, 0.7, 0.5), [0, 1.35, 1.9], "Habitat_Porch"),
    parte(m, "Boots", caja(1.2, 1.9, 0.05), [0, 1.05, 2.27], "Habitat_DoorLeaf"),
    parte(m, "Emissive", caja(1.0, 0.1, 0.03), [0, 2.35, 2.27], "Habitat_DoorLight"),
    parte(m, "SuitBase", caja(2.4, 0.14, 0.7), [0, 0.07, 2.55], "Habitat_Step"),
    parte(m, "SuitBase", caja(2.0, 0.14, 0.4), [0, 0.21, 2.45], "Habitat_Step2"),
    parte(m, "SuitBase", caja(0.05, 1.9, 0.03), [0, 1.05, 2.31], "Habitat_DoorSeam"),
  ];
  // Ventanas del tambor, de lado a lado por detrás del porche.
  for (const a of [-1.15, -0.75, 0.75, 1.15]) {
    const v = parte(m, "Emissive", chaflan(0.42, 0.36, 0.04, 0.08), [Math.sin(a) * 2.0, 0.95, Math.cos(a) * 2.0], "Habitat_Window");
    v.rotation.y = a;
    partes.push(v);
  }
  for (const s of [-1, 1]) {
    const cx = s * (1.5 + ala / 2);
    partes.push(
      girada(parte(m, "SuitBase", chaflan(2.6, 2.3, ala + 0.6, 0.6), [cx, 1.15, 0], "Habitat_Wing"), 0, Math.PI / 2, 0),
      girada(parte(m, "SuitBase", tronco(1.15, 1.15, 0.8, 8), [s * (x + 0.3), 1.15, 0], s < 0 ? "Habitat_EndL" : "Habitat_EndR"), 0, 0, Math.PI / 2),
      parte(m, "Accent", caja(ala + 0.4, 0.1, 0.04), [cx, 0.5, 1.31], "Habitat_Band"),
      ...[-0.5, 0.15].map((dx) => parte(m, "Emissive", chaflan(0.42, 0.38, 0.04, 0.1), [cx + dx * s, 1.45, 1.3], "Habitat_Window")),
      ...panelTecho(m, [cx, 2.32, -0.1], 1.2, 0.9),
    );
  }
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
