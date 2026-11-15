/** Estaciones vistas por fuera (`exterior/03`): laboratorio, enfermería y comedor, solo volumen exterior. */
import * as THREE from "three";
import type { Materiales } from "../materiales";
import { TERRENO } from "../mundo";
import { caja, chaflan, grupo, parte, tronco } from "./piezasComunes";

export type EstacionId = "laboratorio" | "enfermeria" | "comedor";

/**
 * Posición de las estaciones: anillo exterior, a la derecha (ángulo 0 = −z, positivo hacia −x, como
 * en `baseExterior`). Constantes propias: no son `LugarId` ni tocan `LUGARES`. Radio = huella. [E]
 */
export const ESTACIONES: readonly { id: EstacionId; grados: number; radio: number }[] = [
  { id: "laboratorio", grados: -60, radio: 3 },
  { id: "enfermeria", grados: -82, radio: 3 },
  { id: "comedor", grados: -104, radio: 3 },
];
const D = TERRENO.limite + 1 + 3;
export const POS_ESTACIONES = ESTACIONES.map((e) => ({
  id: e.id,
  radio: e.radio,
  x: -Math.sin((e.grados * Math.PI) / 180) * D,
  z: -Math.cos((e.grados * Math.PI) / 180) * D,
}));

/** Panel solar plano de techo: marco y cuatro celdas, a la altura `y` del techo. */
export function panelTecho(m: Materiales, pos: [number, number, number], w = 1.1, d = 0.8): THREE.Object3D[] {
  const [x, y, z] = pos;
  const out: THREE.Object3D[] = [parte(m, "SuitBase", caja(w, 0.08, d), [x, y + 0.04, z], "Roof_PanelFrame")];
  for (const s of [-1, 1]) out.push(parte(m, "Boots", caja(w / 2 - 0.1, 0.04, d - 0.14), [x + (s * w) / 4, y + 0.09, z], "Roof_PanelCell"));
  return out;
}

/** Placa con icono al frente (+z) a la altura `y` y distancia `z`: laboratorio = matraz, enfermería = cruz. */
function placa(m: Materiales, tipo: "matraz" | "cruz", y: number, z: number): THREE.Object3D[] {
  const out: THREE.Object3D[] = [
    parte(m, "Accent", chaflan(1.0, 1.0, 0.06, 0.25), [0, y, z], "Plaque_Frame"),
    parte(m, "Boots", chaflan(0.84, 0.84, 0.05, 0.2), [0, y, z + 0.03], "Plaque_Face"),
  ];
  if (tipo === "cruz") {
    out.push(parte(m, "Emissive", caja(0.5, 0.16, 0.03), [0, y, z + 0.07], "Plaque_CrossH"));
    out.push(parte(m, "Emissive", caja(0.16, 0.5, 0.03), [0, y, z + 0.07], "Plaque_CrossV"));
  } else {
    out.push(parte(m, "Emissive", caja(0.2, 0.3, 0.03), [0, y + 0.18, z + 0.07], "Plaque_FlaskNeck"));
    out.push(parte(m, "Emissive", chaflan(0.54, 0.3, 0.03, 0.14), [0, y - 0.14, z + 0.07], "Plaque_FlaskBody"));
  }
  return out;
}

/**
 * Edificio cerrado de planta octogonal: cuerpo bajo, cubierta facetada, banda, puerta con porche, ventanas
 * y luces cian, paneles solares en el techo y placa de icono. Frente hacia +z, base en y = 0.
 */
export function crearEstacion(m: Materiales, id: EstacionId): THREE.Group {
  const partes: THREE.Object3D[] = [
    parte(m, "SuitBase", tronco(2.5, 2.7, 2.3, 8), [0, 1.15, 0], "Station_Body"),
    parte(m, "SuitBase", tronco(1.5, 2.55, 0.8, 8), [0, 2.7, 0], "Station_Roof"),
    parte(m, "SuitBase", tronco(1.5, 1.5, 0.25, 8), [0, 3.22, 0], "Station_Cap"),
    parte(m, "Accent", tronco(2.72, 2.72, 0.12, 8), [0, 0.45, 0], "Station_Band"),
    parte(m, "SuitBase", chaflan(1.9, 2.4, 0.8, 0.45), [0, 1.2, 2.5], "Station_Porch"),
    parte(m, "Boots", caja(1.0, 1.6, 0.05), [0, 0.9, 2.92], "Station_DoorLeaf"),
    parte(m, "Emissive", caja(0.8, 0.1, 0.03), [0, 1.95, 2.92], "Station_DoorLight"),
    parte(m, "Emissive", caja(0.1, 0.5, 0.03), [-0.75, 1.1, 2.92], "Station_LightL"),
    parte(m, "Emissive", caja(0.1, 0.5, 0.03), [0.75, 1.1, 2.92], "Station_LightR"),
  ];
  if (id === "comedor") {
    // Comedor: ventanal corrido de vidrio cian alrededor del cuerpo.
    partes.push(parte(m, "Glass", tronco(2.58, 2.62, 1.0, 8), [0, 1.35, 0], "Station_Glass"));
    for (let i = 0; i < 8; i++) {
      const a = ((i + 0.5) / 8) * Math.PI * 2;
      if (Math.cos(a) > 0.85) continue; // el frente es la puerta
      const w = parte(m, "Emissive", chaflan(1.3, 0.8, 0.05, 0.2), [Math.sin(a) * 2.6, 1.4, Math.cos(a) * 2.6], "Station_Window");
      w.rotation.y = a;
      partes.push(w);
    }
  } else {
    for (const a of [-1.57, -0.785, 1.57]) {
      const w = parte(m, "Emissive", chaflan(0.7, 0.55, 0.05, 0.14), [Math.sin(a) * 2.62, 1.6, Math.cos(a) * 2.62], "Station_Window");
      w.rotation.y = a;
      partes.push(w);
    }
    const p = grupo("Station_Plaque", ...placa(m, id === "enfermeria" ? "cruz" : "matraz", 1.55, 0));
    p.position.set(Math.sin(0.785) * 2.5, 0, Math.cos(0.785) * 2.5);
    p.rotation.y = 0.785;
    partes.push(p);
  }
  // Paneles solares sobre la cubierta, inclinados hacia el frente en la parte trasera.
  const paneles = new THREE.Group();
  paneles.add(...panelTecho(m, [-0.55, 0, 0], 0.9, 0.7), ...panelTecho(m, [0.55, 0, 0], 0.9, 0.7));
  paneles.position.set(0, 3.34, -0.1);
  paneles.rotation.x = -0.25;
  partes.push(paneles);
  return grupo(`Building_${id}`, ...partes);
}
