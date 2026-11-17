import * as THREE from "three";
import type { Materiales } from "../../materiales";
import { caja, chaflan, grupo, parte, tronco } from "../piezasComunes";

/**
 * Furniture of the control room and the greenhouse, our own low poly builds after Santiago's sheets
 * (santiago/01_Escenario/01_Interiores/01_control_operaciones and 03_invernadero): the map table, lockers,
 * potted plants, raised beds (lettuce, pepper, wheat), seedling racks and a water tank. Origin at the floor,
 * centre of the piece, front toward +z. Each one is a few dozen faces; the room fuses them by material.
 */

const plano = (nombre: string, color: string, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ name: nombre, color, roughness: 0.8, metalness: 0, flatShading: true, ...extra });
const HOJA = plano("Plant_Leaf", "#5DBB4A");
const TIERRA = plano("Plant_Soil", "#5A3B2E");
const PIMIENTO_ROJO = plano("Plant_Pepper_Red", "#E0473A");
const PIMIENTO_AMARILLO = plano("Plant_Pepper_Yellow", "#F2C230");
const TRIGO = plano("Plant_Wheat", "#E3B85A");
const AGUA = plano("Station_Water", "#7FE3F0", { transparent: true, opacity: 0.6, roughness: 0.2 });
const MAPA = plano("Station_Map_Terrain", "#C9805E");

const malla = (g: THREE.BufferGeometry, mat: THREE.Material, pos: [number, number, number], nombre: string, sombra = true) => {
  const o = new THREE.Mesh(g, mat);
  o.name = nombre;
  o.position.set(...pos);
  o.castShadow = sombra;
  o.receiveShadow = true;
  return o;
};

/** Low terrain for the map table: a small grid with seeded heights, Jezero-like ridge and floor. */
function relieve(): THREE.BufferGeometry {
  const g = new THREE.PlaneGeometry(1.7, 1.1, 6, 4);
  g.rotateX(-Math.PI / 2);
  const pos = g.getAttribute("position");
  let s = 5;
  const azar = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const borde = Math.abs(x) > 0.8 || Math.abs(z) > 0.5;
    pos.setY(i, borde ? 0 : Math.max(0, 0.16 - Math.hypot(x + 0.3, z) * 0.25) + azar() * 0.04);
  }
  g.computeVertexNormals();
  return g;
}

/** Mission table: the planning surface in the middle of the control room, with the crater in relief. */
export function mesaMapa(m: Materiales): THREE.Group {
  return grupo(
    "mesaMapa",
    parte(m, "Boots", chaflan(2.0, 0.55, 1.4, 0.2), [0, 0.275, 0], "Map_Base"),
    parte(m, "SuitBase", chaflan(2.3, 0.14, 1.65, 0.25), [0, 0.62, 0], "Map_Rim"),
    malla(relieve(), MAPA, [0, 0.7, 0], "Map_Terrain", false),
    parte(m, "Emissive", caja(0.6, 0.08, 0.02), [-0.5, 0.3, 0.71], "Map_Glow_L"),
    parte(m, "Emissive", caja(0.6, 0.08, 0.02), [0.5, 0.3, 0.71], "Map_Glow_R"),
    parte(m, "Accent", caja(0.14, 0.04, 0.1), [-0.2, 0.71, 0.72], "Map_Key_1"),
    parte(m, "Accent", caja(0.14, 0.04, 0.1), [0, 0.71, 0.72], "Map_Key_2"),
  );
}

/** Three crew lockers with vents and a status light each. */
export function casilleros(m: Materiales): THREE.Group {
  const puertas = [-0.5, 0, 0.5].flatMap((x, i) => [
    parte(m, "Boots", caja(0.02, 1.6, 0.01), [x + 0.25, 0.95, 0.255], `Locker_Gap_${i}`),
    ...[1.6, 1.5, 1.4].map((y, j) => parte(m, "Boots", caja(0.28, 0.03, 0.01), [x, y, 0.255], `Locker_Vent_${i}_${j}`)),
    parte(m, "Emissive", caja(0.1, 0.03, 0.01), [x, 1.15, 0.255], `Locker_Light_${i}`),
  ]);
  return grupo("casilleros", parte(m, "SuitBase", caja(1.5, 1.9, 0.5), [0, 0.95, 0], "Locker_Body"), ...puertas);
}

/** A potted plant: white pot, five leaves. */
export function maceta(m: Materiales): THREE.Group {
  const hoja = new THREE.ConeGeometry(0.1, 0.5, 4);
  const hojas = [0, 1, 2, 3, 4].map((i) => {
    const o = malla(hoja, HOJA, [Math.sin(i * 1.26) * 0.08, 0.6, Math.cos(i * 1.26) * 0.08], `Pot_Leaf_${i}`);
    o.rotation.set(Math.cos(i * 1.26) * 0.5, 0, -Math.sin(i * 1.26) * 0.5);
    return o;
  });
  return grupo("maceta", parte(m, "SuitBase", tronco(0.22, 0.17, 0.36, 6), [0, 0.18, 0], "Pot"), ...hojas);
}

type Cultivo = "lechuga" | "pimiento" | "trigo";

function planta(tipo: Cultivo, x: number, z: number, i: number): THREE.Object3D[] {
  if (tipo === "lechuga") {
    const o = malla(new THREE.IcosahedronGeometry(0.2, 0), HOJA, [x, 0.6, z], `Lettuce_${i}`);
    o.scale.set(1, 0.7, 1);
    return [o];
  }
  if (tipo === "pimiento") {
    const fruto = i % 2 ? PIMIENTO_ROJO : PIMIENTO_AMARILLO;
    return [
      malla(new THREE.ConeGeometry(0.17, 0.42, 5), HOJA, [x, 0.72, z], `Pepper_Bush_${i}`),
      malla(caja(0.08, 0.1, 0.08), fruto, [x + 0.1, 0.66, z + 0.08], `Pepper_${i}`),
    ];
  }
  return [-0.06, 0.06].map((d, j) => malla(new THREE.ConeGeometry(0.035, 0.5, 3), TRIGO, [x + d, 0.75, z + d * 0.5], `Wheat_${i}_${j}`));
}

/** Raised bed, 2.4 x 1 m, with eight plants of one crop. */
function jardinera(tipo: Cultivo, m: Materiales): THREE.Group {
  const plantas = [-0.84, -0.28, 0.28, 0.84].flatMap((x, i) => [-0.2, 0.2].flatMap((z, j) => planta(tipo, x, z, i * 2 + j)));
  return grupo(
    `jardinera_${tipo}`,
    parte(m, "Boots", caja(2.3, 0.1, 0.9), [0, 0.05, 0], "Bed_Base"),
    parte(m, "SuitBase", chaflan(2.4, 0.42, 1.0, 0.1), [0, 0.31, 0], "Bed_Body"),
    malla(caja(2.2, 0.04, 0.8), TIERRA, [0, 0.53, 0], "Bed_Soil", false),
    parte(m, "Emissive", caja(1.0, 0.06, 0.02), [0, 0.28, 0.51], "Bed_Glow"),
    ...plantas,
  );
}
export const jardineraLechuga = (m: Materiales) => jardinera("lechuga", m);
export const jardineraPimiento = (m: Materiales) => jardinera("pimiento", m);
export const jardineraTrigo = (m: Materiales) => jardinera("trigo", m);

/** Seedling rack: three lit shelves of sprouts. */
export function estantePlantulas(m: Materiales): THREE.Group {
  const brote = new THREE.ConeGeometry(0.05, 0.14, 4);
  const pisos = [0.45, 0.95, 1.45].flatMap((y, i) => [
    parte(m, "SuitBase", caja(1.2, 0.05, 0.5), [0, y, 0], `Rack_Shelf_${i}`),
    parte(m, "Emissive", caja(1.0, 0.03, 0.04), [0, y + 0.42, 0.2], `Rack_Light_${i}`),
    ...[-0.4, -0.2, 0, 0.2, 0.4].map((x, j) => malla(brote, HOJA, [x, y + 0.1, 0.05], `Sprout_${i}_${j}`, false)),
  ]);
  return grupo(
    "estantePlantulas",
    parte(m, "SuitBase", caja(0.08, 1.9, 0.5), [-0.62, 0.95, 0], "Rack_Side_L"),
    parte(m, "SuitBase", caja(0.08, 1.9, 0.5), [0.62, 0.95, 0], "Rack_Side_R"),
    ...pisos,
  );
}

/** Water tank for the irrigation, a glass column on a white base. */
export function tanqueAgua(m: Materiales): THREE.Group {
  return grupo(
    "tanqueAgua",
    parte(m, "SuitBase", tronco(0.42, 0.46, 0.3, 8), [0, 0.15, 0], "Tank_Base"),
    malla(tronco(0.34, 0.34, 1.0, 8), AGUA, [0, 0.8, 0], "Tank_Water", false),
    parte(m, "SuitBase", tronco(0.4, 0.4, 0.14, 8), [0, 1.37, 0], "Tank_Cap"),
    parte(m, "Emissive", caja(0.18, 0.05, 0.02), [0, 0.18, 0.45], "Tank_Light"),
  );
}
