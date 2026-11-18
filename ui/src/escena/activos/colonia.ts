/**
 * Colonia de Jezero con un solo kit (Etapa D2, `docs/referenciapau/exterior/etapa-D.md`): toda la arquitectura sale del
 * kit Craftpix Space Colony (`kit-colonia.glb`) y las piezas que el kit no trae son originales del mismo lenguaje
 * (`coloniaPiezas.ts`). Todo se fusiona por material: el kit entero cuesta una llamada de dibujo.
 *
 * Las posiciones son las de siempre (`DECORADO`, `LUGARES`, `POS_ESTACIONES`): las huellas y colisiones no cambian. Las
 * estaciones (comedor, enfermería, laboratorio) son módulos cerrados, así que pasan a módulos habitables del kit
 * conectados al hábitat; los instrumentos automáticos van en el puesto de la Meteoróloga (restricción del 17 nov, línea 7).
 */
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { lugar, lugarDelModulo, type LugarId } from "../mundo";
import { PANELES_MESA, FILA_PANELES, LOMA_BASE, alCentro, balizasLibres, decorado, type Decorado } from "./baseExterior";
import { POS_ESTACIONES, type EstacionId } from "./estaciones";
import { giroHacia, giroModulo } from "./modulosArmados";
import { FORMA_MODULO, MODULOS_BASE } from "./modulos";
import { fusionar } from "./fusionar";
import {
  berma,
  crearBalizaColonia,
  crearContenedor,
  crearEstacionMeteo,
  crearLosa,
  crearSismometro,
  crearTerminal,
  type MaterialesColonia,
} from "./coloniaPiezas";

export const PIEZAS_KIT = [
  "Main_house",
  "Main_house_2lv",
  "Home_colonists",
  "Research_center",
  "Resource_warehouse",
  "Connecting_gateway",
  "Section",
  "Farm",
] as const;
export type PiezaKit = (typeof PIEZAS_KIT)[number];
/** Geometrías del kit a escala original (base en y = 0, entrada hacia +z), listas para clonar. */
export type KitColonia = Readonly<Record<PiezaKit, THREE.BufferGeometry>>;

/** Geometrías del GLB del kit (`construir_modelos.py` nombra cada malla `Kit_<pieza>`). */
export function kitDesdeGltf(raiz: THREE.Object3D): KitColonia {
  const kit: Partial<Record<PiezaKit, THREE.BufferGeometry>> = {};
  raiz.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    const nombre = [o.name, o.parent?.name ?? ""].find((n) => n.startsWith("Kit_"));
    const pieza = PIEZAS_KIT.find((p) => nombre === `Kit_${p}`);
    if (pieza) kit[pieza] = o.geometry;
  });
  for (const p of PIEZAS_KIT) if (!kit[p]) throw new Error(`kit-colonia.glb sin la pieza ${p}`);
  return kit as KitColonia;
}

// ---------------------------------------------------------------------------------------------
// Distribución
// ---------------------------------------------------------------------------------------------

export interface PiezaColocada {
  pieza: PiezaKit;
  id: string;
  x: number;
  z: number;
  giro: number;
  escala: number;
  /** Hundimiento (m): refugio y depósito semienterrados. */
  y?: number;
  /** Radio en planta aproximado, para los corredores. */
  radio: number;
}

/** Hábitat: 8,8 m de ancho (libra el escudo y el reciclador a los lados); su rampa de esclusa queda a 5,2 m de la plaza. [E] */
export const HABITAT_KIT = { z: -8.7, escala: 0.5 } as const;

const dec = (id: Decorado["id"]) => decorado(id);
const est = (id: EstacionId) => POS_ESTACIONES.find((e) => e.id === id)!;

/** Todas las piezas del kit en su lugar (escalas por huella vieja). [E] */
export function colocacionesKit(): PiezaColocada[] {
  const h = lugar("habitat");
  const en = (pieza: PiezaKit, id: string, x: number, z: number, escala: number, radio: number, y = 0): PiezaColocada =>
    ({ pieza, id, x, z, giro: alCentro(x, z), escala, radio, y });
  return [
    { pieza: "Main_house_2lv", id: "habitat", x: h.mx, z: HABITAT_KIT.z, giro: 0, escala: HABITAT_KIT.escala, radio: 3.9 },
    en("Main_house", "enfermeria", est("enfermeria").x, est("enfermeria").z - 0.3, 0.45, 2.6),
    en("Home_colonists", "comedor", est("comedor").x, est("comedor").z, 0.4, 2.4),
    en("Home_colonists", "laboratorio", est("laboratorio").x, est("laboratorio").z, 0.4, 2.4),
    en("Research_center", "torre", dec("torre").x, dec("torre").z, 0.55, 4.2),
    en("Home_colonists", "capsula", dec("capsula").x, dec("capsula").z, 0.38, 2.3),
    en("Farm", "cupula", dec("cupula").x, dec("cupula").z, 0.75, 5.2),
    en("Farm", "cupula2", dec("cupula2").x, dec("cupula2").z, 0.55, 3.8),
    en("Main_house", "refugio", dec("refugio").x, dec("refugio").z, 0.42, 2.6, -0.55),
    en("Resource_warehouse", "deposito", LOMA_BASE.x - 1.5, LOMA_BASE.z + 11.5, 0.7, 4, 0.9),
  ];
}

/** Corredores entre módulos habitables (módulos #5: todo módulo habitable conectado). */
export const CORREDORES: readonly (readonly [string, string])[] = [
  ["habitat", "enfermeria"],
  ["enfermeria", "comedor"],
  ["enfermeria", "laboratorio"],
  ["comedor", "torre"],
  ["torre", "capsula"],
  ["laboratorio", "cupula"],
  ["cupula", "cupula2"],
];

/** Escala de los tubos (`Section`, `Connecting_gateway`): 1,4 m de diámetro. [E] */
const ESCALA_TUBO = 0.5;

// ---------------------------------------------------------------------------------------------
// Armado
// ---------------------------------------------------------------------------------------------

function piezaKit(kit: KitColonia, mat: THREE.Material, p: PiezaKit, escala: number | THREE.Vector3): THREE.Mesh {
  const m = new THREE.Mesh(kit[p], mat);
  if (typeof escala === "number") m.scale.setScalar(escala);
  else m.scale.copy(escala);
  m.castShadow = m.receiveShadow = true;
  return m;
}

/** Tubo de `a` a `b` (centros y radios en planta): compuertas en los extremos y secciones estiradas en el medio. */
function corredor(kit: KitColonia, mat: THREE.Material, a: PiezaColocada, b: PiezaColocada): THREE.Group {
  const g = new THREE.Group();
  g.name = `Colony_Corridor_${a.id}_${b.id}`;
  const dx = b.x - a.x, dz = b.z - a.z;
  const d = Math.hypot(dx, dz);
  const largo = Math.max(0.6, d - a.radio - b.radio);
  const giro = Math.atan2(dx, dz);
  const mitad = a.radio + largo / 2;
  g.position.set(a.x + (dx / d) * mitad, 0, a.z + (dz / d) * mitad);
  g.rotation.y = giro;
  const s = ESCALA_TUBO;
  const compuerta = 3.69 * s;
  if (largo > compuerta * 2 + 0.4) {
    for (const lado of [-1, 1]) {
      const c = piezaKit(kit, mat, "Connecting_gateway", s);
      c.position.z = lado * (largo / 2 - compuerta / 2);
      c.rotation.y = lado > 0 ? 0 : Math.PI;
      g.add(c);
    }
    const resto = largo - compuerta * 2;
    const n = Math.max(1, Math.round(resto / (3.95 * s)));
    for (let i = 0; i < n; i++) {
      const sec = piezaKit(kit, mat, "Section", new THREE.Vector3(s, s, resto / n / 3.95));
      sec.position.z = -resto / 2 + (i + 0.5) * (resto / n);
      g.add(sec);
    }
  } else {
    g.add(piezaKit(kit, mat, "Section", new THREE.Vector3(s, s, largo / 3.95)));
  }
  return g;
}

/** Bermas de sacos de regolito: detrás del hábitat, alrededor del refugio y al pie de la torre y las estaciones. */
function bermas(m: MaterialesColonia, piezas: PiezaColocada[]): THREE.Group {
  const g = new THREE.Group();
  g.name = "Colony_Berms";
  const por = (id: string) => piezas.find((p) => p.id === id)!;
  const poner = (p: PiezaColocada, r: number, a0: number, a1: number, filas: number, s: number) => {
    const b = berma(m, r, a0, a1, filas, s);
    b.position.set(p.x, 0, p.z);
    b.rotation.y = p.giro;
    g.add(b);
  };
  const hab = por("habitat");
  // Al frente, a los dos lados de la rampa de la esclusa: lo primero que ve la cámara de inicio.
  poner(hab, 4.5, 0.6, 1.35, 3, 11);
  poner(hab, 4.5, -1.35, -0.6, 3, 12);
  poner(hab, 4.4, 1.75, 2.75, 3, 1);
  poner(hab, 4.4, -2.75, -1.75, 3, 2);
  poner(por("refugio"), 2.9, 0.75, Math.PI * 2 - 0.75, 3, 3);
  poner(por("torre"), 4.5, 1.2, 2.6, 2, 4);
  poner(por("torre"), 4.5, -2.6, -1.2, 2, 5);
  for (const [id, s] of [["comedor", 6], ["laboratorio", 7], ["enfermeria", 8], ["capsula", 9]] as const) poner(por(id), 2.8, 2.2, 4.1, 2, s);
  return g;
}

/** Fusiona por material conservando posición, normal y UV (la paleta del kit vive en la UV). */
export function fusionarConUV(pieza: THREE.Object3D, nombre: string): THREE.Group {
  pieza.updateMatrixWorld(true);
  const inversa = new THREE.Matrix4().copy(pieza.matrixWorld).invert();
  const local = new THREE.Matrix4();
  const porMaterial = new Map<THREE.Material, THREE.BufferGeometry[]>();
  pieza.traverse((o) => {
    if (!(o instanceof THREE.Mesh) || Array.isArray(o.material)) return;
    const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    for (const k of Object.keys(g.attributes)) if (k !== "position" && k !== "normal" && k !== "uv") g.deleteAttribute(k);
    if (!g.getAttribute("uv")) g.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(g.getAttribute("position").count * 2), 2));
    g.clearGroups();
    g.morphAttributes = {};
    g.applyMatrix4(local.multiplyMatrices(inversa, o.matrixWorld));
    const lista = porMaterial.get(o.material) ?? [];
    lista.push(g);
    porMaterial.set(o.material, lista);
  });
  const salida = new THREE.Group();
  salida.name = nombre;
  for (const [material, geos] of porMaterial) {
    const g = mergeGeometries(geos, false);
    for (const x of geos) x.dispose();
    if (!g) continue;
    g.computeBoundingSphere();
    const malla = new THREE.Mesh(g, material);
    malla.name = `${nombre}_${material.name}`;
    malla.castShadow = material.name !== "Colony_Light" && material.name !== "Colony_Amber";
    malla.receiveShadow = true;
    salida.add(malla);
  }
  return salida;
}

/** Punto de una consola vieja: modelo del lugar, mirando a donde se para el jugador. */
function puesto(id: LugarId): { x: number; z: number; giro: number } {
  const l = lugar(id);
  return { x: l.mx, z: l.mz, giro: giroHacia(l, l) };
}

export interface PiezasExtra {
  /** Panel Craftpix ya preparado (el de PR #452), para las filas decorativas. */
  panel: THREE.Object3D;
  /** Procedural que queda fuera de los dos encuadres (plataforma con nave). */
  quedan: THREE.Object3D[];
}

/** Arma la colonia entera fusionada: kit, corredores, bermas, terminales, instrumentos, balizas y losas. */
export function armarColonia(kit: KitColonia, m: MaterialesColonia, extra: PiezasExtra): THREE.Group {
  const piezas = colocacionesKit();
  const todo = new THREE.Group();
  for (const p of piezas) {
    const x = piezaKit(kit, m.kit, p.pieza, p.escala);
    x.position.set(p.x, p.y ?? 0, p.z);
    x.rotation.y = p.giro;
    todo.add(x);
  }
  const por = (id: string) => piezas.find((p) => p.id === id)!;
  for (const [a, b] of CORREDORES) todo.add(corredor(kit, m.kit, por(a), por(b)));
  todo.add(bermas(m, piezas));
  // Terminales en poste (mesa y taller) e instrumentos automáticos (puesto de la Meteoróloga).
  for (const id of ["mesa", "taller"] as const) {
    const p = puesto(id);
    const t = crearTerminal(m);
    t.position.set(p.x, 0, p.z);
    t.rotation.y = p.giro;
    todo.add(t);
  }
  const sensor = puesto("sensor");
  const meteo = crearEstacionMeteo(m);
  meteo.position.set(sensor.x, 0, sensor.z);
  meteo.rotation.y = sensor.giro;
  const sismo = crearSismometro(m);
  sismo.position.set(sensor.x + 1.8, 0, sensor.z - 0.6);
  todo.add(meteo, sismo);
  for (const [x, z] of balizasLibres()) {
    const b = crearBalizaColonia(m);
    b.position.set(x, 0, z);
    todo.add(b);
  }
  // Losas de anclaje a ras del suelo (reemplazan las placas octogonales blancas).
  for (const id of MODULOS_BASE) {
    const l = lugarDelModulo(id)!;
    const [ancho, fondo] = FORMA_MODULO[id].huella;
    const g = new THREE.Group();
    g.add(crearLosa(m, ancho, fondo));
    g.position.set(l.mx, 0, l.mz);
    g.rotation.y = giroModulo(id);
    todo.add(g);
  }
  // Contenedores junto al taller (vida de base: carga sin abrir, con polvo).
  for (const [x, z, giro] of [[-6.6, -0.3, 0.3], [-6.4, 0.75, -0.2], [-7.6, 0.2, 1.2]] as const) {
    const c = crearContenedor(m);
    c.position.set(x, 0, z);
    c.rotation.y = giro;
    todo.add(c);
  }
  const salida = fusionarConUV(todo, "Colony");
  // Paneles decorativos del kit (los mismos del módulo): junto a la mesa y la fila de energía. Fusionados por material.
  const paneles = new THREE.Group();
  const mesa = lugar("mesa");
  for (const dx of PANELES_MESA.dx) {
    const p = extra.panel.clone();
    p.position.set(mesa.mx + dx, 0, mesa.mz + PANELES_MESA.dz);
    p.scale.setScalar(0.6);
    paneles.add(p);
  }
  const f = FILA_PANELES;
  for (let i = 0; i < f.n; i++) {
    const t = (i - (f.n - 1) / 2) * f.paso;
    const p = extra.panel.clone();
    p.position.set(f.x + Math.cos(f.giro) * t, 0, f.z - Math.sin(f.giro) * t);
    p.rotation.y = f.giro;
    paneles.add(p);
  }
  salida.add(fusionar(paneles, "Colony_Panels"));
  for (const q of extra.quedan) salida.add(q);
  return salida;
}
