/**
 * Armado de la escena exterior de Jezero, sin renderer ni DOM (así se mide y se prueba sin WebGL).
 *
 * Monta cielo de día, cordillera lejana, terreno con un claro llano en el centro, rocas (pequeñas
 * lejos, grandes en el borde del claro), los cinco anclajes de módulo con su sólido / andamio /
 * vivos, hábitat, torre de control y corredores, consolas y cajas del kit, y la red de caminos
 * adoquinados de los circuitos A y B con balizas instanciadas. La escena solo lee `VistaEscena`: nunca `GameState` ni el motor.
 *
 * Presupuesto (APLICACION §8): las piezas del kit se fusionan por material (`fusionar`) y las
 * repetidas se instancian, así cada familia cuesta 1 llamada por material (+1 de sombra).
 */
import * as THREE from "three";
import { crearCielo, type Calidad, type Cielo } from "./cielo";
import { geometriaBase, type Materiales } from "./materiales";
import { liberarEscena } from "./liberar";
import { lugarDelModulo, lugar, type LugarId } from "./mundo";
import type { VistaEscena, EstadoModulo } from "./vista";
import { FORMA_MODULO as FORMA, MODULOS_BASE, TIEMPOS_MODULO_MS, colocar, crearFormaModulo, partesVisibles, type ModuloBase } from "./activos/modulos";
import { instanciar, type TransformacionPieza } from "./activos/instancias";
import {
  crearBaliza,
  crearCaja,
  crearConsola,
} from "./activos/piezasComunes";
import { crearCapsula, crearCorredor, crearHabitat, crearTorreControl } from "./activos/edificios";
import { fusionar } from "./activos/fusionar";
import { geometriaCaminos, posicionesBalizas } from "./activos/caminos";
export { PLAZA, CAMINO, CAMINOS, BALIZAS, geometriaCaminos, posicionesBalizas } from "./activos/caminos";
export { fusionar } from "./activos/fusionar";
import {
  ESCALA_VERTICAL_POR_DEFECTO,
  PASO_POR_DEFECTO,
  TAMANO_MUNDO_POR_DEFECTO,
  aplanarClaro,
  crearMontanas,
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
/** Rocas grandes facetadas en el borde del claro (lámina `mundo/01`). [E] */
export const ROCAS_GRANDES = { n: 18, semilla: 9, radioMin: 15, radio: 28, escalaMin: 1.2, escalaMax: 2.6 } as const;

/** Las rocas grandes no caen sobre la torre de control, las cápsulas ni sus corredores. */
export function rocaGrandeLibre(x: number, z: number): boolean {
  return !(z < -12 && Math.abs(x) < 16) && Math.hypot(x, z - 9) > 3;
}

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
  const vivos = malla(m, "Emissive", geometriaBase("armado-luz-estado", () => new THREE.IcosahedronGeometry(0.13, 0)), [0, f.alto + 0.2, 0], false);
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
  const caminos = new THREE.Mesh(geometriaCaminos(), m.Rock);
  caminos.name = "Kit_Paths";
  caminos.receiveShadow = true;
  kit.add(caminos);
  kit.add(instanciar(() => fusionar(crearBaliza(m), "Kit_Beacon"), posicionesBalizas().map(([x, z]) => ({ posicion: [x, 0, z] }))));
  return kit;
}

/**
 * Edificios fijos (decorado, no módulos): hábitat en su `LugarId`, torre de control detrás unida
 * por un corredor, y dos cápsulas laterales con corredores (lámina `exterior/01` y `exterior/03`).
 * Todo fusionado por material: ~1 llamada por slot (+ sombra).
 * La torre y las cápsulas quedan fuera del límite de juego (r = 20); el corredor no tiene colisión
 * todavía (es de `mundo.ts`).
 */
export const EDIFICIOS = { torre: { x: 0, z: -24.5 }, capsulaX: 11, capsulaZ: -22.5 } as const;

function armarEdificios(m: Materiales): THREE.Group {
  const h = lugar("habitat");
  const t = EDIFICIOS.torre;
  const g = new THREE.Group();
  const fondoHabitat = h.mz - 1.85;
  const frenteTorre = t.z + 5.4;
  const largo = fondoHabitat - frenteTorre;
  g.add(
    colocar(crearHabitat(m), [h.mx, 0, h.mz]),
    colocar(crearTorreControl(m), [t.x, 0, t.z], [0, 0, 0], 1.3),
    colocar(crearCorredor(m, largo), [0, 0, (fondoHabitat + frenteTorre) / 2]),
  );
  for (const s of [-1, 1]) {
    const x0 = t.x + s * 4.2, x1 = EDIFICIOS.capsulaX * s - s * 2.3;
    g.add(
      colocar(crearCapsula(m), [EDIFICIOS.capsulaX * s, 0, EDIFICIOS.capsulaZ], [0, -s * 0.5, 0]),
      colocar(crearCorredor(m, Math.abs(x1 - x0)), [(x0 + x1) / 2, 0, t.z + 1], [0, Math.PI / 2, 0]),
    );
  }
  return fusionar(g, "Base_Buildings");
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
  base.add(armarAnclajes(materiales), armarKit(materiales), armarEdificios(materiales), ...MODULOS_BASE.map((id) => modulos[id].raiz));
  escena.add(terreno, base, crearMontanas(materiales));

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
      const g = ROCAS_GRANDES;
      const grandes = crearRocas(materiales, t, g.n, g.semilla, {
        radioMin: g.radioMin, radio: g.radio, escalaMin: g.escalaMin, escalaMax: g.escalaMax,
        excluir: (x, z) => !rocaGrandeLibre(x, z),
      });
      grandes.name = "Rocks_Basalt_Large";
      terreno.add(t.malla, rocas, grandes);
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
