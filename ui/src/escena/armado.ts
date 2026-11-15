/**
 * Armado de la escena exterior de Jezero, sin renderer ni DOM (así se mide y se prueba sin WebGL).
 *
 * Monta cielo de día, terreno con un claro llano en el centro, rocas fuera del claro, los cinco
 * anclajes de módulo con su sólido / andamio / vivos, consolas y cajas del kit, y un anillo de
 * camino con balizas instanciadas. La escena solo lee `VistaEscena`: nunca `GameState` ni el motor.
 *
 * Presupuesto (APLICACION §8): las piezas del kit se fusionan por material (`fusionar`) y las
 * repetidas se instancian, así cada familia cuesta 1 llamada por material (+1 de sombra).
 */
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { crearCielo, type Calidad, type Cielo } from "./cielo";
import { geometriaBase, type Materiales } from "./materiales";
import { liberarEscena } from "./liberar";
import { lugarDelModulo, lugar, type LugarId } from "./mundo";
import type { VistaEscena, EstadoModulo } from "./vista";
import { MODULOS_BASE, TIEMPOS_MODULO_MS, partesVisibles, type ModuloBase } from "./activos/modulos";
import { instanciar, type TransformacionPieza } from "./activos/instancias";
import {
  crearAntena,
  crearBaliza,
  crearCaja,
  crearCamino,
  crearConsola,
  crearDeposito,
  crearPanelSolar,
} from "./activos/piezasComunes";
import {
  ESCALA_VERTICAL_POR_DEFECTO,
  PASO_POR_DEFECTO,
  TAMANO_MUNDO_POR_DEFECTO,
  aplanarClaro,
  crearRocas,
  crearTerreno,
  leerDem,
  submuestrear,
  type OpcionesMalla,
  type Rejilla,
} from "./activos/terreno";

// ---------------------------------------------------------------------------------------------
// Datos del DEM y del claro
// ---------------------------------------------------------------------------------------------

/** Copia de `data/terreno/jezero/jezero.json` (campo `dem`); un test comprueba que coinciden. */
export const DEM_JEZERO = { ancho: 280, alto: 280, metrosPorPixel: 289 } as const;

export const MALLA_JEZERO: OpcionesMalla = {
  metrosPorPixel: DEM_JEZERO.metrosPorPixel * PASO_POR_DEFECTO,
  escalaVertical: ESCALA_VERTICAL_POR_DEFECTO,
  tamañoMundo: TAMANO_MUNDO_POR_DEFECTO,
};

/** Rejilla submuestreada del DEM de Jezero (`elevacion.bin`, Int16LE). */
export function rejillaJezero(buffer: ArrayBuffer): Rejilla {
  const { ancho, alto } = DEM_JEZERO;
  return submuestrear(leerDem(buffer, ancho, alto), ancho, alto, PASO_POR_DEFECTO);
}

/**
 * Claro llano: la base ocupa ±11 u, el camino en anillo llega a ~16. El terreno se aplana hasta
 * `radio` (con margen de una celda del DEM, ~4,3 u) y sube suave hasta `borde`. [E]
 */
export const CLARO = { radio: 22, borde: 36 } as const;
/** Rocas sueltas fuera del claro. [E] */
export const ROCAS = { n: 70, semilla: 42, radioMin: 24, radio: 110 } as const;
/** Anillo de camino con balizas (provisional hasta los dos circuitos de la tarea 7). [E] */
export const ANILLO = { radio: 15, tramos: 40, radioBalizas: 16.3, balizas: 18 } as const;

// ---------------------------------------------------------------------------------------------
// Fusión por material
// ---------------------------------------------------------------------------------------------

/**
 * Fusiona una pieza del kit en una malla por material (geometría propia, no compartida: la libera
 * `liberarEscena`). Conserva solo posición, normal y color; proyecta sombra si alguna parte lo hacía.
 */
export function fusionar(pieza: THREE.Object3D, nombre: string): THREE.Group {
  pieza.updateMatrixWorld(true);
  const inversa = new THREE.Matrix4().copy(pieza.matrixWorld).invert();
  const local = new THREE.Matrix4();
  const porMaterial = new Map<THREE.Material, { geos: THREE.BufferGeometry[]; sombra: boolean }>();
  pieza.traverse((o) => {
    if (!(o instanceof THREE.Mesh) || Array.isArray(o.material)) return;
    const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    for (const k of Object.keys(g.attributes)) if (k !== "position" && k !== "normal" && k !== "color") g.deleteAttribute(k);
    g.clearGroups();
    g.applyMatrix4(local.multiplyMatrices(inversa, o.matrixWorld));
    let e = porMaterial.get(o.material);
    if (!e) porMaterial.set(o.material, (e = { geos: [], sombra: false }));
    e.geos.push(g);
    e.sombra ||= o.castShadow;
  });
  const salida = new THREE.Group();
  salida.name = nombre;
  for (const [material, { geos, sombra }] of porMaterial) {
    const g = mergeGeometries(geos, false);
    for (const x of geos) x.dispose();
    if (!g) continue;
    g.computeBoundingSphere();
    const malla = new THREE.Mesh(g, material);
    malla.name = `${nombre}_${material.name}`;
    malla.castShadow = sombra;
    malla.receiveShadow = true;
    salida.add(malla);
  }
  return salida;
}

// ---------------------------------------------------------------------------------------------
// Formas provisionales y andamio
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

/**
 * Escudo PROVISIONAL (TODO tarea 5: forma final del módulo): tres bóvedas hexagonales en fila sobre
 * los tramos de colisión de `TERRENO`, con banda teal y luz de estado.
 */
function crearEscudoProvisional(m: Materiales): THREE.Group {
  const boveda = geometriaBase("prov-escudo-boveda", () => {
    const g = new THREE.CylinderGeometry(1.1, 1.1, 1.15, 6, 1, false, -Math.PI / 2, Math.PI);
    g.rotateX(Math.PI / 2);
    return g;
  });
  const g = new THREE.Group();
  // Tramos en z = −6,4 / −7,6 / −8,8 relativos al centro del modelo (mz = −7,2).
  for (const dz of [0.8, -0.4, -1.6]) {
    g.add(malla(m, "SuitBase", boveda, [0, 0, dz]));
    g.add(malla(m, "Accent", caja(0.25, 0.06, 1.1), [0, 1.1, dz]));
  }
  g.add(malla(m, "Emissive", caja(0.5, 0.12, 0.04), [0, 0.7, 1.4], false));
  return g;
}

/**
 * Invernadero PROVISIONAL (TODO tarea 5: cúpula geodésica triangulada): zócalo octogonal, media
 * esfera de vidrio low poly, bandejas y tres plantas facetadas adentro.
 */
function crearInvernaderoProvisional(m: Materiales): THREE.Group {
  const cupula = geometriaBase("prov-inv-cupula", () => new THREE.SphereGeometry(3.6, 8, 3, 0, Math.PI * 2, 0, Math.PI / 2));
  const zocalo = geometriaBase("prov-inv-zocalo", () => new THREE.CylinderGeometry(3.7, 3.85, 0.35, 8, 1));
  const planta = geometriaBase("prov-inv-planta", () => new THREE.ConeGeometry(0.55, 1.3, 5, 1));
  const g = new THREE.Group();
  g.add(malla(m, "SuitBase", zocalo, [0, 0.175, 0]));
  g.add(malla(m, "Glass", cupula, [0, 0.3, 0], false));
  for (const x of [-1.4, 0, 1.4]) {
    g.add(malla(m, "SuitBase", caja(1.1, 0.4, 2.2), [x, 0.55, 0]));
    g.add(malla(m, "Plant", planta, [x, 1.4, 0]));
  }
  return g;
}

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

interface FormaModulo {
  /** Ancho (x) y fondo (z) de la huella, en metros. */
  huella: [number, number];
  alto: number;
  /** Giro fijo; si falta, el módulo mira al punto donde se para el jugador. */
  giro?: number;
}

/** Huellas a partir de los círculos de colisión de `TERRENO` (mundo.ts). [E] */
const FORMA: Readonly<Record<ModuloBase, FormaModulo>> = {
  panel_solar: { huella: [6.6, 4.0], alto: 1.9, giro: 0 },
  escudo: { huella: [2.6, 3.9], alto: 2.3, giro: 0 },
  reciclador_agua: { huella: [2.8, 1.8], alto: 2.5 },
  invernadero: { huella: [7.8, 7.8], alto: 3.9, giro: 0 },
  antena: { huella: [2.8, 2.8], alto: 3.3 },
};

function crearSolido(m: Materiales, id: ModuloBase): THREE.Object3D {
  switch (id) {
    case "panel_solar": {
      // 3 × 2 paneles sobre los círculos de colisión del panel (separación 2,15 × 1,9).
      const t: TransformacionPieza[] = [];
      for (const dz of [-0.95, 0.95]) for (const dx of [-2.15, 0, 2.15]) t.push({ posicion: [dx, 0, dz] });
      return instanciar(() => fusionar(crearPanelSolar(m), "Module_SolarPanel"), t);
    }
    case "reciclador_agua":
      // "Dos depósitos y conexiones" (ESCENAS §3.2); las conexiones llegan con la tarea 5.
      return instanciar(() => fusionar(crearDeposito(m), "Module_Recycler"), [
        { posicion: [-0.62, 0, 0] },
        { posicion: [0.62, 0, 0], escala: 0.85 },
      ]);
    case "antena": {
      const a = fusionar(crearAntena(m), "Module_Antenna");
      a.scale.setScalar(2.4);
      return a;
    }
    case "escudo":
      return fusionar(crearEscudoProvisional(m), "Module_Shield");
    case "invernadero":
      return fusionar(crearInvernaderoProvisional(m), "Module_Greenhouse");
  }
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

function giroHacia(desde: { mx: number; mz: number }, hacia: { x: number; z: number }): number {
  return Math.atan2(hacia.x - desde.mx, hacia.z - desde.mz);
}

function armarModulo(m: Materiales, id: ModuloBase): ModuloArmado {
  const l = lugarDelModulo(id)!;
  const f = FORMA[id];
  const raiz = new THREE.Group();
  raiz.name = `Module_${id}`;
  raiz.position.set(l.mx, 0, l.mz);
  raiz.rotation.y = f.giro ?? giroHacia(l, l);
  const solido = crearSolido(m, id);
  const andamio = crearAndamio(m, f.huella[0], f.huella[1], f.alto);
  const vivos = malla(m, "Emissive", geometriaBase("armado-luz-estado", () => new THREE.IcosahedronGeometry(0.2, 0)), [0, f.alto + 0.35, 0], false);
  vivos.name = `Module_${id}_Live`;
  raiz.add(solido, andamio, vivos);
  const modulo: ModuloArmado = { raiz, solido, andamio, vivos, estado: "ausente", inicio: 0, pulso: -Infinity };
  aplicarEstado(modulo, "ausente");
  return modulo;
}

function aplicarEstado(mod: ModuloArmado, estado: EstadoModulo): void {
  const p = partesVisibles(estado);
  mod.solido.visible = p.solido;
  mod.andamio.visible = p.andamio;
  mod.vivos.visible = p.vivos;
  if (estado !== mod.estado) mod.inicio = -1;
  mod.estado = estado;
}

/** Anclajes: una placa octogonal por módulo, todas en un `InstancedMesh` (siempre visibles). */
function armarAnclajes(m: Materiales): THREE.Group {
  const placa = geometriaBase("armado-anclaje", () => new THREE.CylinderGeometry(0.5, 0.5, 0.06, 8, 1));
  const t: TransformacionPieza[] = MODULOS_BASE.map((id) => {
    const l = lugarDelModulo(id)!;
    const f = FORMA[id];
    return { posicion: [l.mx, 0.03, l.mz], rotacion: [0, f.giro ?? giroHacia(l, l), 0], escala: [f.huella[0], 1, f.huella[1]] };
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

// ---------------------------------------------------------------------------------------------
// Kit: consolas, cajas, camino y balizas
// ---------------------------------------------------------------------------------------------

function mirandoA(id: LugarId, escala = 1): TransformacionPieza {
  const l = lugar(id);
  return { posicion: [l.mx, 0, l.mz], rotacion: [0, giroHacia(l, l), 0], escala };
}

function armarKit(m: Materiales): THREE.Group {
  const kit = new THREE.Group();
  kit.name = "Base_Kit";
  kit.add(instanciar(() => fusionar(crearConsola(m), "Kit_Console"), [mirandoA("mesa"), mirandoA("taller"), mirandoA("sensor", 0.85)]));
  kit.add(
    instanciar(() => fusionar(crearCaja(m), "Kit_Crate"), [
      { posicion: [-3.5, 0, -2.4], rotacion: [0, 0.3, 0] },
      { posicion: [-2.7, 0, -2.0], rotacion: [0, -0.2, 0], escala: 0.8 },
      { posicion: [6.0, 0, -1.7], rotacion: [0, 0.5, 0] },
    ]),
  );
  const tramos: TransformacionPieza[] = [];
  for (let i = 0; i < ANILLO.tramos; i++) {
    const a = (i / ANILLO.tramos) * Math.PI * 2;
    tramos.push({ posicion: [Math.cos(a) * ANILLO.radio, 0, Math.sin(a) * ANILLO.radio], rotacion: [0, -a, 0], escala: [1.4, 1, 2.0] });
  }
  kit.add(instanciar(() => fusionar(crearCamino(m), "Kit_Path"), tramos));
  const balizas: TransformacionPieza[] = [];
  for (let i = 0; i < ANILLO.balizas; i++) {
    const a = ((i + 0.5) / ANILLO.balizas) * Math.PI * 2;
    balizas.push({ posicion: [Math.cos(a) * ANILLO.radioBalizas, 0, Math.sin(a) * ANILLO.radioBalizas] });
  }
  kit.add(instanciar(() => fusionar(crearBaliza(m), "Kit_Beacon"), balizas));
  return kit;
}

// ---------------------------------------------------------------------------------------------
// Escena
// ---------------------------------------------------------------------------------------------

export interface EscenaArmada {
  escena: THREE.Scene;
  cielo: Cielo;
  modulos: Readonly<Record<ModuloBase, ModuloArmado>>;
  /** Grupo del terreno y las rocas (vacío hasta `ponerTerreno`). */
  terreno: THREE.Group;
  /** Reconcilia los módulos con la vista (sin reconstruir mallas: solo visibilidad). */
  aplicarVista(vista: VistaEscena): void;
  /** Pone (o reemplaza) el terreno de Jezero con el claro aplanado y las rocas. */
  ponerTerreno(rejilla: Rejilla): void;
  /** Marca un pulso corto en un módulo (evento de avería). */
  pulsar(id: ModuloBase, ahoraMs: number): void;
  /** Avanza animaciones; sin asignaciones. Con `movimientoReducido`: estados finales sin bamboleo. */
  animar(ahoraMs: number, movimientoReducido: boolean): void;
  /** Quita el cielo y libera geometrías propias. Materiales y caché son del dueño (no se tocan). */
  liberar(): void;
}

/**
 * Arma la escena completa. `vista` null = todos los módulos ausentes (solo anclajes).
 * `rejilla` opcional: en el navegador el DEM llega después (`ponerTerreno`); en los tests, ya.
 */
export function armarEscena(
  materiales: Materiales,
  vista: VistaEscena | null,
  rejilla: Rejilla | null = null,
  calidad: Calidad = "alta",
): EscenaArmada {
  const escena = new THREE.Scene();
  escena.name = "Exterior_Jezero";
  const cielo = crearCielo(escena, "dia", calidad);
  const terreno = new THREE.Group();
  terreno.name = "Terrain_Group";
  const base = new THREE.Group();
  base.name = "Base";
  const modulos = Object.fromEntries(MODULOS_BASE.map((id) => [id, armarModulo(materiales, id)])) as Record<ModuloBase, ModuloArmado>;
  base.add(armarAnclajes(materiales), armarKit(materiales), ...MODULOS_BASE.map((id) => modulos[id].raiz));
  escena.add(terreno, base);

  const armada: EscenaArmada = {
    escena,
    cielo,
    modulos,
    terreno,
    aplicarVista(v) {
      for (const id of MODULOS_BASE) aplicarEstado(modulos[id], v.modulos[id]);
    },
    ponerTerreno(r) {
      for (const hijo of [...terreno.children]) {
        terreno.remove(hijo);
        liberarEscena(hijo);
      }
      const claro = aplanarClaro(r, MALLA_JEZERO, CLARO.radio, CLARO.borde);
      const t = crearTerreno(materiales, { rejilla: claro.rejilla, malla: MALLA_JEZERO });
      const rocas = crearRocas(materiales, t, ROCAS.n, ROCAS.semilla, { radioMin: ROCAS.radioMin, radio: ROCAS.radio });
      terreno.add(t.malla, rocas);
      terreno.position.y = -claro.altura;
    },
    pulsar(id, ahora) {
      modulos[id].pulso = ahora;
    },
    animar(ahora, reducido) {
      for (const id of MODULOS_BASE) {
        const mod = modulos[id];
        if (mod.inicio < 0) mod.inicio = ahora;
        const dt = ahora - mod.inicio;
        // Instalando: el andamio crece en 400 ms. Operativo: la luz aparece en 240 ms.
        const kA = reducido ? 1 : Math.min(1, dt / TIEMPOS_MODULO_MS.instalando);
        mod.andamio.scale.set(1, Math.max(0.001, kA), 1);
        const kV = reducido ? 1 : Math.min(1, dt / TIEMPOS_MODULO_MS.operativo);
        const bamboleo = reducido ? 1 : 1 + 0.15 * Math.sin(ahora / 320);
        mod.vivos.scale.setScalar(Math.max(0.001, kV * bamboleo));
        // Pulso de avería: un leve latido de 400 ms (nunca sacudidas, APLICACION §7).
        const dp = ahora - mod.pulso;
        const latido = !reducido && dp >= 0 && dp < 400 ? 1 + 0.05 * Math.sin((dp / 400) * Math.PI) : 1;
        mod.raiz.scale.setScalar(latido);
      }
    },
    liberar() {
      cielo.quitar();
      liberarEscena(escena);
    },
  };
  if (vista) armada.aplicarVista(vista);
  if (rejilla) armada.ponerTerreno(rejilla);
  return armada;
}
