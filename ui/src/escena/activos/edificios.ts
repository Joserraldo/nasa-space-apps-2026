/** Edificios fijos de la base: hábitat, torre, corredor y cápsula (mundo/01). */
import * as THREE from "three";
import { geometriaBase, type Materiales } from "../materiales";
import { caja, chaflan, grupo, parte, tronco } from "./piezasComunes";

// El armado los fusiona por material en una malla por slot; frente hacia +z y base en y = 0.

function girada(o: THREE.Object3D, rx: number, ry: number, rz: number): THREE.Object3D {
  o.rotation.set(rx, ry, rz);
  return o;
}

/** Hábitat alargado (eje x): casco octogonal, remates, puerta central, escalón y ventanas cian. */
export function crearHabitat(m: Materiales, largo = 6.8): THREE.Group {
  const x = largo / 2;
  const partes: THREE.Object3D[] = [
    girada(parte(m, "SuitBase", chaflan(3.6, 3.0, largo, 0.85), [0, 1.5, 0], "Habitat_Hull"), 0, Math.PI / 2, 0),
    girada(parte(m, "SuitBase", tronco(1.25, 1.25, 0.9, 8), [-x - 0.3, 1.45, 0], "Habitat_EndL"), 0, 0, Math.PI / 2),
    girada(parte(m, "SuitBase", tronco(1.25, 1.25, 0.9, 8), [x + 0.3, 1.45, 0], "Habitat_EndR"), 0, 0, Math.PI / 2),
    parte(m, "SuitBase", chaflan(2.2, 2.7, 0.7, 0.5), [0, 1.35, 1.9], "Habitat_Porch"),
    parte(m, "Boots", caja(1.2, 1.9, 0.05), [0, 1.05, 2.27], "Habitat_DoorLeaf"),
    parte(m, "Emissive", caja(1.0, 0.1, 0.03), [0, 2.35, 2.27], "Habitat_DoorLight"),
    parte(m, "SuitBase", caja(2.4, 0.14, 0.7), [0, 0.07, 2.55], "Habitat_Step"),
    parte(m, "SuitBase", chaflan(2.2, 0.5, 1.4, 0.15), [-1.6, 3.15, -0.2], "Habitat_RoofBox"),
    parte(m, "Accent", caja(largo, 0.12, 0.04), [0, 0.55, 1.81], "Habitat_Band"),
  ];
  for (const dx of [-2.6, -1.7, 1.7, 2.6]) {
    partes.push(parte(m, "Emissive", chaflan(0.6, 0.42, 0.04, 0.1), [dx, 1.85, 1.8], "Habitat_Window"));
  }
  return grupo("Building_Habitat", ...partes);
}

/** Anillo de `n` ventanas cian chaflanadas alrededor del eje y, a radio `r` y altura `y`. */
function ventanasAnillo(m: Materiales, r: number, y: number, n: number): THREE.Object3D[] {
  const ancho = 2 * r * Math.tan(Math.PI / n) * 0.78;
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const v = parte(m, "Emissive", chaflan(ancho, 1.0, 0.05, 0.18), [Math.sin(a) * r, y, Math.cos(a) * r], "Control_Pane");
    v.rotation.y = a;
    return v;
  });
}

/** Torre de control (lámina `mundo/01`): tambor, anillo de ventanas, cubierta facetada y mástil. */
export function crearTorreControl(m: Materiales): THREE.Group {
  return grupo(
    "Building_Control",
    parte(m, "SuitBase", tronco(4.2, 4.5, 0.5, 10), [0, 0.25, 0], "Control_Plinth"),
    parte(m, "SuitBase", tronco(2.6, 3.0, 3.4, 8), [0, 2.2, 0], "Control_Drum"),
    parte(m, "SuitBase", tronco(4.3, 3.6, 0.7, 12), [0, 4.2, 0], "Control_FlangeLow"),
    parte(m, "SuitBase", tronco(3.85, 3.85, 1.5, 12), [0, 5.3, 0], "Control_Core"),
    parte(m, "Glass", tronco(4.05, 4.05, 1.5, 12), [0, 5.3, 0], "Control_Windows"),
    ...ventanasAnillo(m, 3.9, 5.3, 12),
    parte(m, "SuitBase", tronco(3.9, 4.4, 0.6, 12), [0, 6.35, 0], "Control_FlangeHigh"),
    parte(m, "SuitBase", tronco(1.6, 3.6, 1.2, 12), [0, 7.25, 0], "Control_Roof"),
    parte(m, "SuitBase", tronco(0.08, 0.1, 1.6, 6), [0.6, 8.6, 0], "Control_Mast"),
    parte(m, "SuitBase", geometriaBase("kit-esfera-mastil", () => new THREE.IcosahedronGeometry(0.2, 0)), [0.6, 9.45, 0], "Control_MastBall"),
    parte(m, "SuitBase", chaflan(2.2, 2.6, 1.4, 0.5), [0, 1.3, 3.1], "Control_Porch"),
    parte(m, "Boots", caja(1.2, 1.8, 0.05), [0, 1.0, 3.82], "Control_DoorLeaf"),
    parte(m, "Emissive", caja(1.0, 0.1, 0.03), [0, 2.2, 3.82], "Control_DoorLight"),
    parte(m, "Emissive", caja(0.12, 0.5, 0.03), [-2.2, 2.3, 2.75], "Control_LightL"),
    parte(m, "Emissive", caja(0.12, 0.5, 0.03), [2.2, 2.3, 2.75], "Control_LightR"),
  );
}

/** Corredor de `largo` m a lo largo de z: tubo octogonal, costillas cada 2 m y ventanas cian. */
export function crearCorredor(m: Materiales, largo: number): THREE.Group {
  const partes: THREE.Object3D[] = [
    girada(parte(m, "SuitBase", tronco(1.05, 1.05, largo, 8), [0, 1.1, 0], "Corridor_Tube"), Math.PI / 2, 0, 0),
  ];
  const n = Math.max(1, Math.round(largo / 2));
  for (let i = 0; i <= n; i++) {
    const z = -largo / 2 + (i * largo) / n;
    partes.push(girada(parte(m, "SuitBase", tronco(1.2, 1.2, 0.25, 8), [0, 1.1, z], "Corridor_Rib"), Math.PI / 2, 0, 0));
    if (i < n) {
      const zc = z + largo / n / 2;
      partes.push(parte(m, "Emissive", caja(0.03, 0.3, 0.8), [-1.0, 1.25, zc], "Corridor_WindowL"));
      partes.push(parte(m, "Emissive", caja(0.03, 0.3, 0.8), [1.0, 1.25, zc], "Corridor_WindowR"));
    }
  }
  return grupo("Building_Corridor", ...partes);
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
  );
}
