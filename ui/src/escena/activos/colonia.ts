/**
 * Colonia de Jezero (Etapas D2 y D3, `docs/referenciapau/exterior/etapa-D.md` y `clasificacion-objetos.md`).
 * - Hábitat y torre de comunicaciones: modelos CC BY (`coloniaEscena.ts` los coloca con `HABITAT_COLONIA` y la torre).
 * - Invernaderos del fondo: domos de vidrio originales (`domoVidrio.ts`).
 * - Módulos habitables restantes (enfermería, comedor, laboratorio, cápsula, refugio) y depósito: kit Craftpix.
 * - Lo que ningún kit trae (corredores elevados, bermas, entrada, balizas, losas): original (`coloniaPiezas.ts`).
 * Todo se fusiona por material: kit, regolito, luces y vidrio cuestan una llamada cada uno.
 *
 * Las posiciones son las de siempre (`DECORADO`, `LUGARES`, `POS_ESTACIONES`). Las estaciones (comedor, enfermería,
 * laboratorio) son módulos cerrados conectados al hábitat; los instrumentos automáticos van en el puesto de la
 * Meteoróloga (restricción del 17 nov, línea 7). Ese cambio espera la confirmación de María Paula (`traspaso-D.md`).
 */
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { LUGARES, lugar, lugarDelModulo, type LugarId } from "../mundo";
import { FILA_PANELES, LOMA_BASE, PANELES_MESA, alCentro, balizasLibres, decorado, type Decorado } from "./baseExterior";
import { sobreCamino } from "./caminos";
import { POS_ESTACIONES, type EstacionId } from "./estaciones";
import { giroHacia, giroModulo } from "./modulosArmados";
import { FORMA_MODULO, MODULOS_BASE } from "./modulos";
import { fusionar } from "./fusionar";
import {
  berma,
  caja,
  cilindro,
  crearBalizaColonia,
  crearBarril,
  crearCarrete,
  crearContenedor,
  crearEntrada,
  crearEstacionMeteo,
  crearLosa,
  crearManguera,
  crearSismometro,
  crearTerminal,
  luzCil,
  parteKit,
  parteLuz,
  puntosBerma,
  type MaterialesColonia,
} from "./coloniaPiezas";
import { crearDomoVidrio } from "./domoVidrio";
import { crearPanelSolar, geometriaCeldas, geometriaCuerpoPanel } from "./panelSolar";
import type { Huella } from "./piezasComunes";

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

/** Nodo de la colonia: un módulo habitable o un domo, con su centro y su radio en planta. */
export interface NodoColonia {
  id: string;
  x: number;
  z: number;
  giro: number;
  radio: number;
}

export interface PiezaColocada extends NodoColonia {
  pieza: PiezaKit;
  escala: number;
  /** Hundimiento (m): refugio y depósito semienterrados. */
  y?: number;
}

/**
 * Hábitat (domo geodésico CC BY, 7,2 m de ancho): su puerta queda a 0,6 m del puesto del jugador (0; −4,3) y su borde
 * trasero libra el anillo exterior (z −12,9). [E]
 */
export const HABITAT_COLONIA = { x: 0, z: -8.5, ancho: 7.2 } as const;
/** Torre de comunicaciones (CC BY, 6,4 m de ancho) en el lugar de la torre de control vieja. [E] */
export const TORRE_COLONIA = { ancho: 6.0 } as const;

/** Domos de vidrio del fondo: radio y variante de vidrio de la referencia (nunca dos iguales juntas). [E] */
export const DOMOS_FONDO = [
  { id: "cupula", radio: 4.8, vidrio: "celeste", estantes: 3 },
  { id: "cupula2", radio: 3.6, vidrio: "claro", estantes: 2 },
] as const;

const dec = (id: Decorado["id"]) => decorado(id);
const est = (id: EstacionId) => POS_ESTACIONES.find((e) => e.id === id)!;

/**
 * Piezas del kit Craftpix en su lugar (escalas por huella vieja). La cápsula usa `Main_house_2lv`, libre desde que el
 * hábitat es CC BY: así no se repite edificio en el cuadro (corrección 3 de `etapa-D.md`). [E]
 */
export function colocacionesKit(): PiezaColocada[] {
  const en = (pieza: PiezaKit, id: string, x: number, z: number, escala: number, radio: number, y = 0): PiezaColocada =>
    ({ pieza, id, x, z, giro: alCentro(x, z), escala, radio, y });
  return [
    en("Main_house", "enfermeria", est("enfermeria").x, est("enfermeria").z - 0.3, 0.45, 2.6),
    en("Home_colonists", "comedor", est("comedor").x, est("comedor").z, 0.4, 2.4),
    en("Home_colonists", "laboratorio", est("laboratorio").x, est("laboratorio").z, 0.4, 2.4),
    en("Main_house_2lv", "capsula", dec("capsula").x, dec("capsula").z, 0.34, 2.6),
    en("Main_house", "refugio", dec("refugio").x, dec("refugio").z, 0.42, 2.6, -0.55),
    en("Resource_warehouse", "deposito", LOMA_BASE.x - 1.5, LOMA_BASE.z + 11.5, 0.7, 4, 0.9),
  ];
}

/** Todos los nodos que conectan los corredores: kit, hábitat, torre y domos. */
export function nodosColonia(): NodoColonia[] {
  const t = dec("torre");
  return [
    { id: "habitat", x: HABITAT_COLONIA.x, z: HABITAT_COLONIA.z, giro: 0, radio: HABITAT_COLONIA.ancho / 2 - 0.1 },
    { id: "torre", x: t.x, z: t.z, giro: alCentro(t.x, t.z), radio: TORRE_COLONIA.ancho / 2 - 0.2 },
    ...DOMOS_FONDO.map((d) => ({ id: d.id, x: dec(d.id).x, z: dec(d.id).z, giro: alCentro(dec(d.id).x, dec(d.id).z), radio: d.radio })),
    ...colocacionesKit(),
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

/**
 * El corredor hábitat–enfermería cruza el anillo exterior (z −12,9): va elevado sobre soportes (Quaternius Connector
 * sobre Metal Support, `clasificacion-objetos.md`) y el sendero pasa por debajo. Del lado del hábitat lo sostiene el
 * domo; las patas (fracción del tramo) van junto a la enfermería, fuera del sendero. Solo chocan las patas. [E]
 */
export const CORREDOR_ELEVADO = { a: "habitat", b: "enfermeria", alto: 2.35, patas: [0.92] } as const;

/** Escala de los tubos (`Section`, `Connecting_gateway`): 1,4 m de diámetro. [E] */
const ESCALA_TUBO = 0.5;
/** Ancho en planta de un corredor (para su colisión). */
export const ANCHO_CORREDOR_COLONIA = 1.5;

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

/** Centro, giro y largo libre de un corredor entre dos nodos. */
export function tramoCorredor(a: NodoColonia, b: NodoColonia): { x: number; z: number; giro: number; largo: number; desde: number } {
  const dx = b.x - a.x, dz = b.z - a.z;
  const d = Math.hypot(dx, dz);
  const largo = Math.max(0.6, d - a.radio - b.radio);
  const mitad = a.radio + largo / 2;
  return { x: a.x + (dx / d) * mitad, z: a.z + (dz / d) * mitad, giro: Math.atan2(dx, dz), largo, desde: a.radio };
}

/**
 * Tubo de `a` a `b`: secciones `Section` del kit y un anillo oscuro en cada extremo, donde entra al módulo; elevado si
 * es el que cruza el anillo. Sin las compuertas `Connecting_gateway` (835 triángulos cada una): fusionada, la colonia
 * se dibuja entera aunque el tubo quede detrás de un edificio, y el presupuesto no alcanzaba. [E]
 */
function corredor(kit: KitColonia, m: MaterialesColonia, a: NodoColonia, b: NodoColonia, elevado: boolean): THREE.Group {
  const g = new THREE.Group();
  g.name = `Colony_Corridor_${a.id}_${b.id}`;
  const t = tramoCorredor(a, b);
  // El tubo entra un poco en cada módulo para no quedar suelto.
  const largo = t.largo + (elevado ? 1.0 : 0.5);
  g.position.set(t.x, 0, t.z);
  g.rotation.y = t.giro;
  const s = ESCALA_TUBO;
  const y = elevado ? CORREDOR_ELEVADO.alto - 0.7 : 0;
  // Una sola sección estirada (572 triángulos por corredor, no una por cada 2 m).
  const sec = piezaKit(kit, m.kit, "Section", new THREE.Vector3(s, s, largo / 3.95));
  sec.position.y = y;
  g.add(sec);
  for (const lado of [-1, 1]) g.add(parteKit(cilindro(0.82, 0.82, 0.22, 10, "oscuro"), m, [0, y + 0.72, lado * (t.largo / 2 - 0.05)], [Math.PI / 2, 0, 0]));
  if (elevado) {
    // Soportes de celosía (Metal Support): dos patas, travesaño bajo el tubo y riostras en cruz.
    for (const f of CORREDOR_ELEVADO.patas) {
      const z = -t.largo / 2 + f * t.largo;
      for (const x of [-0.75, 0.75]) g.add(parteKit(caja(0.12, y + 0.05, 0.12, "oscuro"), m, [x, (y + 0.05) / 2, z]));
      g.add(parteKit(caja(1.65, 0.12, 0.2, "oscuro"), m, [0, y + 0.02, z]));
      const diag = Math.hypot(1.5, y);
      for (const sgn of [-1, 1]) g.add(parteKit(caja(0.05, diag, 0.05, "oscuro"), m, [0, y / 2, z], [0, 0, sgn * Math.atan2(1.5, y)]));
      for (const x of [-0.75, 0.75]) g.add(parteKit(caja(0.3, 0.3, 0.3, "oscuro"), m, [x, 0.15, z]));
    }
    // Luces cian del hábitat bajo el tubo: se ve por dónde se pasa.
    g.add(parteLuz(luzCil(0.06, 0.05, 6, "cian", 1.8), m, [0, y - 0.02, 0]));
  }
  return g;
}

/** Bermas de sacos de regolito: [nodo, radio, ángulo inicial, ángulo final, hileras]. 0 rad = frente del nodo. [E] */
export const BERMAS: readonly (readonly [string, number, number, number, number])[] = [
  // Hábitat: a los costados, entre la entrada y el anillo trasero (libran el escudo, el reciclador y su tubería).
  ["habitat", 3.95, 1.5, 2.25, 3],
  ["habitat", 3.95, -2.25, -1.5, 3],
  ["refugio", 2.9, 0.75, Math.PI * 2 - 0.75, 3],
  ["torre", 3.5, 1.3, 2.5, 2],
  ["torre", 3.5, -2.5, -1.3, 2],
  ["comedor", 2.8, 2.2, 4.1, 2],
  ["laboratorio", 2.8, 2.2, 4.1, 2],
  ["enfermeria", 2.8, 2.2, 4.1, 2],
  ["capsula", 3.0, 2.2, 4.1, 2],
];

function bermas(m: MaterialesColonia, nodos: NodoColonia[]): THREE.Group {
  const g = new THREE.Group();
  g.name = "Colony_Berms";
  BERMAS.forEach(([id, r, a0, a1, filas], i) => {
    const p = nodos.find((n) => n.id === id)!;
    const b = berma(m, r, a0, a1, filas, i + 1);
    b.position.set(p.x, 0, p.z);
    b.rotation.y = p.giro;
    g.add(b);
  });
  return g;
}

/**
 * Huellas de colisión de la colonia (`solidosBase`): domo del hábitat, corredores a ras del suelo, patas del elevado y
 * bermas. Las bermas no tapan senderos ni puestos: el tramo que cae sobre uno no choca (y no se ve encima). [E]
 */
export function huellasColonia(): Huella[] {
  const nodos = nodosColonia();
  const por = (id: string) => nodos.find((n) => n.id === id)!;
  const h: Huella[] = [{ id: "colonia:habitat", x: HABITAT_COLONIA.x, z: HABITAT_COLONIA.z, r: HABITAT_COLONIA.ancho / 2 - 0.25 }];
  for (const [a, b] of CORREDORES) {
    const t = tramoCorredor(por(a), por(b));
    if (a === CORREDOR_ELEVADO.a && b === CORREDOR_ELEVADO.b) {
      for (const f of CORREDOR_ELEVADO.patas) {
        const d = -t.largo / 2 + f * t.largo;
        for (const x of [-0.75, 0.75]) {
          const c = Math.cos(t.giro), s = Math.sin(t.giro);
          h.push({ id: `colonia:pata_${a}_${b}`, x: t.x + c * x + s * d, z: t.z - s * x + c * d, r: 0.25 });
        }
      }
      continue;
    }
    h.push({ id: `colonia:corredor_${a}_${b}`, x: t.x, z: t.z, ancho: ANCHO_CORREDOR_COLONIA, fondo: t.largo, giro: t.giro });
  }
  const puestos = LUGARES.map((l) => [l.x, l.z] as const);
  BERMAS.forEach(([id, r, a0, a1], i) => {
    const p = por(id);
    const c = Math.cos(p.giro), s = Math.sin(p.giro);
    for (const q of puntosBerma(r, a0, a1)) {
      const x = p.x + c * q.x + s * q.z, z = p.z - s * q.x + c * q.z;
      if (sobreCamino(x, z, 0.6) || puestos.some(([px, pz]) => Math.hypot(px - x, pz - z) < 1.2)) continue;
      h.push({ id: `colonia:berma_${i}`, x, z, r: 0.42 });
    }
  });
  return h;
}

/** Fusiona por material conservando posición, normal, UV y color (la paleta vive en la UV, el acento en el color). */
export function fusionarConUV(pieza: THREE.Object3D, nombre: string): THREE.Group {
  pieza.updateMatrixWorld(true);
  const inversa = new THREE.Matrix4().copy(pieza.matrixWorld).invert();
  const local = new THREE.Matrix4();
  const porMaterial = new Map<THREE.Material, THREE.BufferGeometry[]>();
  pieza.traverse((o) => {
    if (!(o instanceof THREE.Mesh) || Array.isArray(o.material)) return;
    const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    for (const k of Object.keys(g.attributes)) if (k !== "position" && k !== "normal" && k !== "uv" && k !== "color") g.deleteAttribute(k);
    const n = g.getAttribute("position").count;
    if (!g.getAttribute("uv")) g.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(n * 2), 2));
    if (!g.getAttribute("normal")) g.computeVertexNormals();
    const col = g.getAttribute("color");
    if (!col || col.itemSize !== 3) {
      if (col) g.deleteAttribute("color");
      g.setAttribute("color", new THREE.Float32BufferAttribute(new Float32Array(n * 3).fill(1), 3));
    }
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
    malla.castShadow = material.name !== "Colony_Light" && material.name !== "Colony_Glass";
    malla.receiveShadow = material.name !== "Colony_Light";
    if (material.name === "Colony_Glass") malla.renderOrder = 2;
    salida.add(malla);
  }
  return salida;
}

/** Centro de los sectores de la colonia y cuántos hay (cuadrantes alrededor del hábitat). [E] */
const SECTORES = { x: 0, z: -6, n: 4 } as const;

/**
 * Fusiona por material y por sector (cuadrante alrededor de `SECTORES`): con una sola malla, three dibujaba la colonia
 * entera aunque el refugio o el depósito quedaran detrás de la cámara. Así descarta los sectores fuera de cuadro. Las
 * bermas se reparten berma por berma.
 */
export function fusionarPorSector(todo: THREE.Group, nombre: string): THREE.Group {
  const piezas: THREE.Object3D[] = [];
  for (const h of [...todo.children]) {
    if (h.name === "Colony_Berms") piezas.push(...h.children);
    else piezas.push(h);
  }
  const grupos = Array.from({ length: SECTORES.n }, () => new THREE.Group());
  const p = new THREE.Vector3();
  todo.updateMatrixWorld(true);
  for (const h of piezas) {
    h.getWorldPosition(p);
    const a = Math.atan2(p.x - SECTORES.x, p.z - SECTORES.z) + Math.PI;
    const s = Math.min(SECTORES.n - 1, Math.floor((a / (Math.PI * 2)) * SECTORES.n));
    grupos[s]!.attach(h);
  }
  const salida = new THREE.Group();
  salida.name = nombre;
  grupos.forEach((g, i) => {
    if (g.children.length) salida.add(fusionarConUV(g, `${nombre}_S${i}`));
  });
  return salida;
}

/** Punto de una consola vieja: modelo del lugar, mirando a donde se para el jugador. */
function puesto(id: LugarId): { x: number; z: number; giro: number } {
  const l = lugar(id);
  return { x: l.mx, z: l.mz, giro: giroHacia(l, l) };
}

export interface PiezasExtra {
  /** Procedural que queda fuera de los dos encuadres (plataforma con la cápsula de llegada). */
  quedan: THREE.Object3D[];
}

/** Materiales de los paneles decorativos (bastidor y celdas, estas sin polvo del evento). */
export interface MaterialesPanel {
  cuerpo: THREE.Material;
  celdas: THREE.Material;
}

/** Entrada del hábitat y detalles de vida al lado (foto del HDU): barriles azules, carrete y manguera al domo. */
function vidaHabitat(m: MaterialesColonia): THREE.Group {
  const g = new THREE.Group();
  const r = HABITAT_COLONIA.ancho / 2;
  const entrada = crearEntrada(m, "cian", 2.0, 1.95);
  entrada.position.z = r - 0.05;
  g.add(entrada);
  const barriles = [[2.1, r - 0.2], [2.6, r - 0.75], [2.75, r - 0.05]] as const;
  for (const [x, z] of barriles) {
    const b = crearBarril(m, "azul");
    b.position.set(x, 0, z);
    g.add(b);
  }
  const carrete = crearCarrete(m);
  carrete.position.set(-2.3, 0, r - 0.3);
  carrete.rotation.y = 0.5;
  g.add(carrete, crearManguera(m, [2.1, 0.7, r - 0.2], [1.5, 0.5, r - 1.0]));
  g.position.set(HABITAT_COLONIA.x, 0, HABITAT_COLONIA.z);
  return g;
}

/** Arma la colonia fusionada: kit, domos, corredores, bermas, entrada, terminales, instrumentos, balizas y losas. */
export function armarColonia(kit: KitColonia, m: MaterialesColonia, panel: MaterialesPanel, extra: PiezasExtra): THREE.Group {
  const piezas = colocacionesKit();
  const nodos = nodosColonia();
  const todo = new THREE.Group();
  for (const p of piezas) {
    const x = piezaKit(kit, m.kit, p.pieza, p.escala);
    x.position.set(p.x, p.y ?? 0, p.z);
    x.rotation.y = p.giro;
    todo.add(x);
  }
  for (const d of DOMOS_FONDO) {
    const domo = crearDomoVidrio(m, { radio: d.radio, vidrio: d.vidrio, estantes: d.estantes });
    const n = nodos.find((x) => x.id === d.id)!;
    domo.position.set(n.x, 0, n.z);
    domo.rotation.y = n.giro;
    todo.add(domo);
  }
  const por = (id: string) => nodos.find((p) => p.id === id)!;
  for (const [a, b] of CORREDORES) todo.add(corredor(kit, m, por(a), por(b), a === CORREDOR_ELEVADO.a && b === CORREDOR_ELEVADO.b));
  todo.add(bermas(m, nodos), vidaHabitat(m));
  // Torre de comunicaciones: luz roja que parpadea arriba (la anima `coloniaEscena`) va aparte; aquí su entrada roja.
  const torre = por("torre");
  const entradaTorre = crearEntrada(m, "rojo", 1.6, 1.6);
  entradaTorre.position.set(torre.x + Math.sin(torre.giro) * (torre.radio + 0.1), 0, torre.z + Math.cos(torre.giro) * (torre.radio + 0.1));
  entradaTorre.rotation.y = torre.giro;
  todo.add(entradaTorre);
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
  // Contenedores de depósito junto al taller (carga sin abrir, con polvo).
  for (const [x, z, giro] of [[-6.6, -0.3, 0.3], [-6.4, 0.75, -0.2], [-7.6, 0.2, 1.2]] as const) {
    const c = crearContenedor(m);
    c.position.set(x, 0, z);
    c.rotation.y = giro;
    todo.add(c);
  }
  const salida = fusionarPorSector(todo, "Colony");
  // Paneles decorativos (los mismos del módulo): junto a la mesa y la fila de energía. Fusionados por material.
  const paneles = new THREE.Group();
  const geos = { cuerpo: geometriaCuerpoPanel(), celdas: geometriaCeldas() };
  const mesa = lugar("mesa");
  for (const dx of PANELES_MESA.dx) {
    const p = crearPanelSolar(panel.cuerpo, panel.celdas, geos);
    p.position.set(mesa.mx + dx, 0, mesa.mz + PANELES_MESA.dz);
    p.scale.setScalar(0.62);
    paneles.add(p);
  }
  const f = FILA_PANELES;
  for (let i = 0; i < f.n; i++) {
    const t = (i - (f.n - 1) / 2) * f.paso;
    const p = crearPanelSolar(panel.cuerpo, panel.celdas, geos);
    p.position.set(f.x + Math.cos(f.giro) * t, 0, f.z - Math.sin(f.giro) * t);
    p.rotation.y = f.giro;
    paneles.add(p);
  }
  salida.add(fusionar(paneles, "Colony_Panels"));
  geos.cuerpo.dispose();
  geos.celdas.dispose();
  for (const q of extra.quedan) salida.add(q);
  return salida;
}
