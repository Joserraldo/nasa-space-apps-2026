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
import { colorToken, geometriaBase, type Materiales } from "./materiales";
import { liberarEscena } from "./liberar";
import { TERRENO, lugarDelModulo, lugar, type LugarId } from "./mundo";
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

// ---------------------------------------------------------------------------------------------
// Caminos adoquinados, balizas, edificios y kit
// ---------------------------------------------------------------------------------------------

type P2 = readonly [number, number];

/** Plaza adoquinada alrededor de la mesa (claro central, ESCENAS §3.3). [E] */
export const PLAZA = { x: 0, z: 0.6, radio: 2.5 } as const;
/** Ancho del camino y lado de cada adoquín. [E] */
export const CAMINO = { ancho: 2.1, adoquin: 1.0, junta: 0.07 } as const;

/**
 * Red de caminos (ESCENAS §3.2): circuito A (oeste) `mesa → taller → panel_solar → escudo →
 * habitat → mesa`, circuito B (este) `mesa → sensor → invernadero → antena → mesa`, el reciclador
 * desde el hábitat, el atajo del banco y la entrada desde la cámara. Puntos `x, z` de juego; los
 * extremos son los puntos donde se para el jugador (`LUGARES`) y los codos esquivan los módulos.
 */
export const CAMINOS: readonly (readonly P2[])[] = [
  [[-2.2, 0.5], [-4, 0.1], [-8, -0.5]],
  [[-4, 0.1], [-2.9, -2.8], [-4.5, -5.3]],
  [[-4.5, -5.3], [-1.8, -4.6], [0, -4.3], [0, -2.2]],
  [[0, -4.3], [2.6, -4.4], [4.6, -4.2]],
  [[2.2, 0.6], [4.2, 0.9], [6.6, 0.9], [9, -0.4]],
  [[9, -0.4], [10.6, 2.0], [9.6, 4.4]],
  [[9.6, 4.4], [5.5, 4.0], [1.9, 2.5]],
  [[-1.9, 2.5], [-4.6, 4.4]],
  [[-0.5, 3.0], [-1.6, 6.5], [-2.4, 10]],
];

/** Semilla decorativa de la variación de adoquines. */
const SEMILLA_CAMINO = 314;

function azarDecorativo(semilla: number): () => number {
  let s = semilla >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * Geometría de toda la red: adoquines en tronco de pirámide (tapa biselada), dos por fila, con
 * junta, color `camino` con leve variación hacia `lila`; losas octogonales en los cruces y la plaza.
 * Una sola malla (slot Rock, color de vértice): 1 draw call, sin sombra propia.
 */
export function geometriaCaminos(): THREE.BufferGeometry {
  const pos: number[] = [];
  const col: number[] = [];
  const azar = azarDecorativo(SEMILLA_CAMINO);
  const base = colorToken("camino");
  const lila = colorToken("lila");
  const lado = colorToken("camino").lerp(colorToken("regolito-medio"), 0.35);
  const ct = new THREE.Color();
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();
  /** Triángulo con la normal hacia `hacia` (o hacia +y si es null). */
  const tri = (p: number[], q: number[], r: number[], color: THREE.Color, centro: number[] | null) => {
    a.set(p[0]!, p[1]!, p[2]!); b.set(q[0]!, q[1]!, q[2]!); c.set(r[0]!, r[1]!, r[2]!);
    n.subVectors(b, a).cross(c.clone().sub(a));
    const fuera = centro
      ? n.x * ((p[0]! + q[0]! + r[0]!) / 3 - centro[0]!) + n.z * ((p[2]! + q[2]! + r[2]!) / 3 - centro[2]!)
      : n.y;
    if (fuera < 0) pos.push(...p, ...r, ...q);
    else pos.push(...p, ...q, ...r);
    for (let k = 0; k < 3; k++) col.push(color.r, color.g, color.b);
  };
  /** Losa de contorno `anillo` (puntos x, z) con tapa biselada `bisel` hacia el centro. */
  const losa = (anillo: P2[], h: number, bisel: number) => {
    let cx = 0, cz = 0;
    for (const [x, z] of anillo) { cx += x; cz += z; }
    cx /= anillo.length; cz /= anillo.length;
    ct.copy(base).lerp(lila, azar() * 0.45).lerp(lado, azar() * 0.12);
    const arriba = anillo.map(([x, z]) => {
      const dx = cx - x, dz = cz - z, d = Math.hypot(dx, dz) || 1;
      return [x + (dx / d) * bisel, h, z + (dz / d) * bisel];
    });
    const abajo = anillo.map(([x, z]) => [x, 0, z]);
    for (let i = 1; i < arriba.length - 1; i++) tri(arriba[0]!, arriba[i]!, arriba[i + 1]!, ct, null);
    const centro = [cx, 0, cz];
    for (let i = 0; i < anillo.length; i++) {
      const j = (i + 1) % anillo.length;
      tri(abajo[i]!, abajo[j]!, arriba[j]!, lado, centro);
      tri(abajo[i]!, arriba[j]!, arriba[i]!, lado, centro);
    }
  };
  const octogono = (x: number, z: number, r: number, giro = Math.PI / 8): P2[] =>
    Array.from({ length: 8 }, (_, i) => [x + Math.cos(giro + (i * Math.PI) / 4) * r, z + Math.sin(giro + (i * Math.PI) / 4) * r] as const);

  // Plaza: rejilla de adoquines dentro del octógono, con un borde de losas.
  const { ancho, adoquin, junta } = CAMINO;
  for (let i = -3; i <= 3; i++)
    for (let j = -3; j <= 3; j++) {
      const x = PLAZA.x + i * adoquin, z = PLAZA.z + j * adoquin;
      const dx = Math.abs(i * adoquin), dz = Math.abs(j * adoquin);
      if (Math.max(dx, dz) > PLAZA.radio - 0.4 || dx + dz > PLAZA.radio * 1.25) continue;
      const s = (adoquin - junta) / 2;
      losa([[x - s, z - s], [x - s, z + s], [x + s, z + s], [x + s, z - s]], 0.035 + azar() * 0.012, 0.05);
    }
  // Tramos: dos adoquines por fila; losa octogonal en cada nodo.
  for (const tramo of CAMINOS) {
    for (const [x, z] of tramo) losa(octogono(x, z, ancho * 0.55), 0.03, 0.06);
    for (let k = 0; k < tramo.length - 1; k++) {
      const [x0, z0] = tramo[k]!, [x1, z1] = tramo[k + 1]!;
      const largo = Math.hypot(x1 - x0, z1 - z0);
      const ux = (x1 - x0) / largo, uz = (z1 - z0) / largo, vx = -uz, vz = ux;
      const filas = Math.max(1, Math.round(largo / adoquin));
      const paso = largo / filas;
      for (let f = 0; f < filas; f++) {
        const t = (f + 0.5) * paso;
        // Filas alternas desplazadas medio adoquín (aparejo), como en la lámina.
        const corte = f % 2 === 0 ? 0 : (azar() - 0.5) * 0.5;
        for (const [v0, v1] of [[-ancho / 2, corte], [corte, ancho / 2]] as const) {
          const l = paso / 2 - junta / 2, w0 = v0 + junta / 2, w1 = v1 - junta / 2;
          const cx = x0 + ux * t, cz = z0 + uz * t;
          const p = (du: number, dv: number): P2 => [cx + ux * du + vx * dv, cz + uz * du + vz * dv];
          losa([p(-l, w0), p(-l, w1), p(l, w1), p(l, w0)], 0.04 + azar() * 0.012, 0.045);
        }
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

/** Separación entre balizas a lo largo del camino y distancia al eje. [E] */
export const BALIZAS = { cada: 2.6, aparte: 1.55 } as const;

function chocaConBase(x: number, z: number, margen: number): boolean {
  if (TERRENO.circulos.some((c) => Math.hypot(x - c.x, z - c.z) < c.r + margen)) return true;
  if (TERRENO.capsulas.some((c) => x > c.x0 - c.r && x < c.x1 + c.r && Math.abs(z - c.z) < c.r + margen)) return true;
  return Math.hypot(x - PLAZA.x, z - PLAZA.z) < PLAZA.radio + margen;
}

/** Balizas a los lados de los caminos, alternando lado, sin caer sobre módulos ni la plaza. */
export function posicionesBalizas(): P2[] {
  const salida: P2[] = [];
  let lado = 1;
  for (const tramo of CAMINOS) {
    let recorrido = 0; // metros ya recorridos del tramo hasta el inicio del segmento
    let siguiente = BALIZAS.cada / 2;
    for (let k = 0; k < tramo.length - 1; k++) {
      const [x0, z0] = tramo[k]!, [x1, z1] = tramo[k + 1]!;
      const largo = Math.hypot(x1 - x0, z1 - z0);
      const ux = (x1 - x0) / largo, uz = (z1 - z0) / largo;
      for (; siguiente < recorrido + largo; siguiente += BALIZAS.cada) {
        const t = siguiente - recorrido;
        lado = -lado;
        const x = x0 + ux * t - uz * BALIZAS.aparte * lado, z = z0 + uz * t + ux * BALIZAS.aparte * lado;
        if (chocaConBase(x, z, 0.6) || salida.some(([bx, bz]) => Math.hypot(bx - x, bz - z) < 2.0)) continue;
        salida.push([x, z]);
      }
      recorrido += largo;
    }
  }
  return salida;
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
