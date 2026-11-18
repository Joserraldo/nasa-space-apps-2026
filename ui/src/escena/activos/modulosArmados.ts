/** Andamios, estados y anclajes de los cinco módulos de Jezero. */
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { geometriaBase, type Materiales } from "../materiales";
import { lugarDelModulo } from "../mundo";
import type { EstadoModulo } from "../vista";
import { FORMA_MODULO as FORMA, MODULOS_BASE, crearFormaModulo, partesVisibles, type ModuloBase } from "./modulos";
import { instanciar, type TransformacionPieza } from "./instancias";
import type { Huella } from "./piezasComunes";
import { fusionar } from "./fusionar";
import { liberarEscena } from "../liberar";

// ---------------------------------------------------------------------------------------------
// Andamio
// ---------------------------------------------------------------------------------------------

type V3 = [number, number, number];

function malla(m: Materiales, slot: keyof Materiales, g: THREE.BufferGeometry, pos: V3, sombra = true): THREE.Mesh {
  const x = new THREE.Mesh(g, m[slot]);
  x.position.set(...pos);
  x.castShadow = sombra;
  x.receiveShadow = true;
  return x;
}

const caja = (w: number, h: number, d: number) =>
  geometriaBase(`armado-caja-${w}-${h}-${d}`, () => new THREE.BoxGeometry(w, h, d));

/** Andamio de "instalando": cuatro postes teal y un marco arriba, del tamaño de la huella. */
function crearAndamio(m: Materiales, ancho: number, fondo: number, alto: number): THREE.Group {
  const g = new THREE.Group();
  const x = ancho / 2, z = fondo / 2;
  for (const [px, pz] of [[-x, -z], [x, -z], [-x, z], [x, z]] as const) {
    g.add(malla(m, "Accent", caja(0.12, alto, 0.12), [px, alto / 2, pz]));
  }
  for (const y of [alto, alto / 2]) {
    g.add(malla(m, "Accent", caja(ancho, 0.1, 0.1), [0, y, -z]));
    g.add(malla(m, "Accent", caja(ancho, 0.1, 0.1), [0, y, z]));
    g.add(malla(m, "Accent", caja(0.1, 0.1, fondo), [-x, y, 0]));
    g.add(malla(m, "Accent", caja(0.1, 0.1, fondo), [x, y, 0]));
  }
  return fusionar(g, "Scaffold");
}

// ---------------------------------------------------------------------------------------------
// Módulos
// ---------------------------------------------------------------------------------------------

const NOMBRE_MODULO: Readonly<Record<ModuloBase, string>> = {
  panel_solar: "Module_SolarPanel",
  escudo: "Module_Shield",
  reciclador_agua: "Module_Recycler",
  invernadero: "Module_Greenhouse",
  antena: "Module_Antenna",
};

function crearSolido(m: Materiales, id: ModuloBase): THREE.Object3D {
  return fusionar(crearFormaModulo(m, id), NOMBRE_MODULO[id]);
}

export interface ModuloArmado {
  raiz: THREE.Group;
  solido: THREE.Object3D;
  andamio: THREE.Object3D;
  /** Luz de estado: solo cuando funciona. */
  vivos: THREE.Object3D;
  estado: EstadoModulo;
  /** Momento (ms) en que empezó la transición actual; −1 = empieza en el próximo fotograma. */
  inicio: number;
  /** Momento (ms) del último pulso de evento (avería); −Infinity si no hay. */
  pulso: number;
}

export function giroHacia(desde: { mx: number; mz: number }, hacia: { x: number; z: number }): number {
  return Math.atan2(hacia.x - desde.mx, hacia.z - desde.mz);
}

/** Giro del módulo en su anclaje: el fijo de su forma o mirando al punto del jugador. */
export function giroModulo(id: ModuloBase): number {
  const l = lugarDelModulo(id)!;
  return FORMA[id].giro ?? giroHacia(l, l);
}

/** Huella en planta de cada módulo construido en su anclaje (la misma caja que su placa y su andamio). */
export function huellasModulos(): Huella[] {
  return MODULOS_BASE.map((id) => {
    const l = lugarDelModulo(id)!;
    const [ancho, fondo] = FORMA[id].huella;
    return { id: `modulo:${id}`, x: l.mx, z: l.mz, ancho, fondo, giro: giroModulo(id) };
  });
}

/** Lámpara de estado (Etapa D3): base, lente cilíndrica y tapa, apoyada en y = 0. Unos 60 triángulos. */
function geometriaLampara(): THREE.BufferGeometry {
  const partes = [
    new THREE.CylinderGeometry(0.1, 0.12, 0.05, 8).translate(0, 0.025, 0),
    new THREE.CylinderGeometry(0.075, 0.075, 0.14, 8).translate(0, 0.12, 0),
    new THREE.CylinderGeometry(0.03, 0.09, 0.05, 8).translate(0, 0.215, 0),
  ];
  const g = mergeGeometries(partes, false)!;
  for (const p of partes) p.dispose();
  return g;
}

export function armarModulo(m: Materiales, id: ModuloBase): ModuloArmado {
  const l = lugarDelModulo(id)!;
  const f = FORMA[id];
  const raiz = new THREE.Group();
  raiz.name = `Module_${id}`;
  raiz.position.set(l.mx, 0, l.mz);
  raiz.rotation.y = giroModulo(id);
  const solido = crearSolido(m, id);
  const andamio = crearAndamio(m, f.huella[0], f.huella[1], f.alto);
  // Luz de estado: lámpara baliza baja (lente de 8 caras con tapa), no la gema flotante del estilo viejo.
  const vivos = malla(m, "Emissive", geometriaBase("armado-luz-estado", geometriaLampara), [0, 0, 0], false);
  // Apoyada en el techo del sólido (no flotando a la altura nominal): la luz de estado es parte de la pieza.
  solido.updateMatrixWorld(true);
  vivos.position.y = new THREE.Box3().setFromObject(solido).max.y - 0.02;
  vivos.name = `Module_${id}_Live`;
  raiz.add(solido, andamio, vivos);
  const modulo: ModuloArmado = { raiz, solido, andamio, vivos, estado: "ausente", inicio: 0, pulso: -Infinity };
  aplicarEstado(modulo, "ausente");
  return modulo;
}

/**
 * Cambia el sólido de un módulo por otra pieza (modelo real de la Etapa D) sin tocar su estado: hereda la
 * visibilidad, libera la forma vieja y apoya la luz de estado en `luz` (local) o en el techo de la pieza nueva.
 */
export function reemplazarSolido(mod: ModuloArmado, nuevo: THREE.Object3D, luz?: readonly [number, number, number]): void {
  nuevo.name = mod.solido.name;
  nuevo.visible = mod.solido.visible;
  mod.raiz.remove(mod.solido);
  liberarEscena(mod.solido);
  mod.raiz.add(nuevo);
  mod.solido = nuevo;
  if (luz) {
    // Luz de estado apoyada en un aparato de la pieza (no flotando sobre el punto más alto del modelo).
    mod.vivos.position.set(...luz);
    return;
  }
  nuevo.updateMatrixWorld(true);
  const caja = new THREE.Box3().setFromObject(nuevo);
  mod.vivos.position.y = caja.max.y - mod.raiz.position.y - 0.02;
}

export function aplicarEstado(mod: ModuloArmado, estado: EstadoModulo): void {
  const p = partesVisibles(estado);
  mod.solido.visible = p.solido;
  mod.andamio.visible = p.andamio;
  mod.vivos.visible = p.vivos;
  if (estado !== mod.estado) mod.inicio = -1;
  mod.estado = estado;
}

/** Anclajes: una placa octogonal por módulo, todas en un `InstancedMesh` (siempre visibles). */
export function armarAnclajes(m: Materiales): THREE.Group {
  const placa = geometriaBase("armado-anclaje", () => new THREE.CylinderGeometry(0.5, 0.5, 0.06, 8, 1));
  const t: TransformacionPieza[] = MODULOS_BASE.map((id) => {
    const l = lugarDelModulo(id)!;
    const f = FORMA[id];
    return { posicion: [l.mx, 0.03, l.mz], rotacion: [0, giroModulo(id), 0], escala: [f.huella[0], 1, f.huella[1]] };
  });
  const g = instanciar(() => {
    const p = malla(m, "SuitBase", placa, [0, 0, 0], false);
    const x = new THREE.Group();
    x.name = "Module_Anchor";
    x.add(p);
    return x;
  }, t);
  return g;
}
