/** Refugio de tormenta cubierto de regolito (`exterior/03`, abajo a la izquierda). */
import * as THREE from "three";
import { geometriaBase, type Materiales } from "../materiales";
import { caja, chaflan, grupo, parte, tronco } from "./piezasComunes";
import { geometriaMonticulo } from "./modulos";

/** Montículo facetado de regolito, vestíbulo con puerta y escalón al frente (+z) y un tubo de ventilación. */
export function crearRefugio(m: Materiales): THREE.Group {
  const boveda = parte(m, "Rock", geometriaBase("mod-escudo-monticulo", geometriaMonticulo), [0, 0, -0.5], "Shelter_Mound");
  boveda.scale.set(1.7, 1.15, 1.4);
  const tubo = parte(m, "SuitBase", tronco(0.16, 0.2, 1.4, 8), [1.0, 2.3, -0.9], "Shelter_VentPipe");
  const codo = parte(m, "SuitBase", tronco(0.15, 0.15, 0.8, 8), [0.65, 2.95, -0.9], "Shelter_VentElbow");
  codo.rotation.z = Math.PI / 2;
  return grupo(
    "Building_Shelter",
    boveda,
    tubo,
    codo,
    parte(m, "SuitBase", chaflan(2.2, 2.3, 1.5, 0.45), [0, 1.15, 1.55], "Shelter_Vestibule"),
    parte(m, "Accent", caja(2.25, 0.1, 1.55), [0, 2.0, 1.55], "Shelter_Band"),
    parte(m, "Boots", caja(1.1, 1.65, 0.05), [0, 0.95, 2.32], "Shelter_DoorLeaf"),
    parte(m, "Emissive", caja(1.0, 0.1, 0.03), [0, 1.9, 2.32], "Shelter_DoorLight"),
    parte(m, "Emissive", caja(0.12, 0.5, 0.03), [-0.95, 1.2, 2.32], "Shelter_LightL"),
    parte(m, "Emissive", caja(0.12, 0.5, 0.03), [0.95, 1.2, 2.32], "Shelter_LightR"),
    parte(m, "SuitBase", caja(2.2, 0.14, 0.6), [0, 0.07, 2.65], "Shelter_Step"),
  );
}
