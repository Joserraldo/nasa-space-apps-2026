/**
 * Monta la colonia de la Etapa D2 en la escena armada cuando llegan los GLB: quita el decorado procedural viejo
 * (`Base_Buildings`, balizas y placas de anclaje), conserva las lomas y lo que queda fuera de los encuadres, y cambia
 * los sólidos de invernadero, escudo y reciclador por las piezas del kit. Las huellas y colisiones no cambian.
 */
import * as THREE from "three";
import type { Materiales } from "../materiales";
import { liberarEscena } from "../liberar";
import { decorado, alCentro } from "./baseExterior";
import { armarColonia, fusionarConUV, kitDesdeGltf } from "./colonia";
import { crearEscudoColonia, crearRecicladorColonia, type MaterialesColonia } from "./coloniaPiezas";
import { prepararMallas, type ModelosModulos } from "./modelosModulos";
import { reemplazarSolido, type ModuloArmado } from "./modulosArmados";
import type { ModuloBase } from "./modulos";
import { crearPlataformaNave } from "./nave";
import { colocar } from "./modulos";
import { fusionar } from "./fusionar";
import { crearPaleta, materialKit, materialRegolito } from "./polvoKit";

/** Escala del invernadero del kit (`Farm`) en el anclaje del módulo (huella 5,6 m). [E] */
const ESCALA_INVERNADERO = 0.34;

function quitar(o: THREE.Object3D | undefined): void {
  if (!o) return;
  o.removeFromParent();
  liberarEscena(o);
}

export function ponerColonia(
  base: THREE.Group,
  materiales: Materiales,
  modulos: Readonly<Record<ModuloBase, ModuloArmado>>,
  modelos: ModelosModulos,
): void {
  const kit = kitDesdeGltf(modelos.kit);
  const m: MaterialesColonia = {
    kit: materialKit(crearPaleta()),
    regolito: materialRegolito(),
    luz: new THREE.MeshStandardMaterial({ name: "Colony_Light", color: 0x0b2a2e, emissive: 0x6fdde6, emissiveIntensity: 1.3 }),
    ambar: new THREE.MeshStandardMaterial({ name: "Colony_Amber", color: 0x2a1704, emissive: 0xffa040, emissiveIntensity: 1.6 }),
  };
  // Viejo: decorado fusionado (menos las lomas), balizas con tapa cian y placas octogonales.
  const viejo = base.getObjectByName("Base_Buildings");
  const lomas = viejo?.getObjectByName("Mounds");
  if (lomas) base.attach(lomas);
  quitar(viejo);
  quitar(base.getObjectByName("Kit_Beacon_Instanced"));
  quitar(base.getObjectByName("Module_Anchor_Instanced"));
  // Queda: la plataforma con nave, fuera de los dos encuadres de juicio.
  const nave = decorado("plataforma_nave");
  // `fusionar` deja la geometría en el marco de la pieza: se envuelve para conservar la posición.
  const envoltura = new THREE.Group();
  envoltura.add(colocar(crearPlataformaNave(materiales), [nave.x, 0, nave.z], [0, alCentro(nave.x, nave.z), 0]));
  const quedan = [fusionar(envoltura, "Colony_KeptShipPad")];
  const panel = modelos.panel.clone();
  prepararMallas(panel);
  base.add(armarColonia(kit, m, { panel, quedan }));
  // Módulos del kit y originales (mismo material: una llamada por módulo visible).
  const farm = new THREE.Mesh(kit.Farm, m.kit);
  farm.scale.setScalar(ESCALA_INVERNADERO);
  const grupoFarm = new THREE.Group();
  grupoFarm.add(farm);
  reemplazarSolido(modulos.invernadero, fusionarConUV(grupoFarm, "Module_Greenhouse"));
  reemplazarSolido(modulos.escudo, fusionarConUV(crearEscudoColonia(m), "Module_Shield"), [0.15, 1.5, 1.4]);
  reemplazarSolido(modulos.reciclador_agua, fusionarConUV(crearRecicladorColonia(m), "Module_Recycler"), [1.2, 0.6, 0.55]);
}
