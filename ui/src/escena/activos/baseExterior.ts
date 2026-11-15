/** Configuración y montaje modular del decorado fijo. No mueve los anclajes de interacción. */
import * as THREE from "three";
import type { Materiales } from "../materiales";
import { TERRENO, lugar, type LugarId } from "../mundo";
import { instanciar } from "./instancias";
import { PLANTA_KIT, crearBaliza, crearCaja, crearConsola, crearDeposito, crearPanelSolar, crearPanelSolarInclinado, type Huella } from "./piezasComunes";
import { crearCapsula, crearCorredor, crearHabitat, crearPlataformaNave, crearRefugio, crearTorreControl, plantaHabitat } from "./edificios";
import { colocar, crearFormaModulo } from "./modulos";
import { giroHacia, huellasModulos } from "./modulosArmados";
import { fusionar } from "./fusionar";
import { corredorEntre } from "./corredores";
import { POS_ESTACIONES, crearEstacion } from "./estaciones";
import { geometriaCaminos, posicionesBalizas } from "./caminos";

// ---------------------------------------------------------------------------------------------
// Piezas sueltas del kit: consolas de los puestos y cajas del taller
// ---------------------------------------------------------------------------------------------

export const CONSOLAS = [
  { lugar: "mesa", escala: 1.2 },
  { lugar: "taller", escala: 0.7 },
  { lugar: "sensor", escala: 0.55 },
] as const;

/**
 * Cajas de suministros sueltas: ninguna. `mundo/01` no muestra cajas en el exterior y la que había
 * quedaba sola en primer plano. La lista sigue para que `sinSolapes.test` cubra cualquier caja
 * futura (fuera de caminos, módulos, banco y balizas). [E]
 */
export const CAJAS: readonly { readonly x: number; readonly z: number; readonly giro: number }[] = [];

/**
 * Equipo solar de la plataforma de la mesa (`mundo/01`): dos paneles decorativos a la derecha de la
 * consola, mirando a la cámara. `x` es relativo a la consola de la mesa; `z` a su centro. [E]
 */
export const PANELES_MESA = { dx: [2.3, 3.95], dz: -0.1, escala: 1.3, ancho: 1.3, fondo: 1.0 } as const;

/** Consola de un lugar: en el centro del modelo, mirando al punto donde se para el jugador. */
function consola(id: LugarId, escala: number): { x: number; z: number; giro: number; escala: number } {
  const l = lugar(id);
  return { x: l.mx, z: l.mz, giro: giroHacia(l, l), escala };
}

// ---------------------------------------------------------------------------------------------
// Decorado de la base completa
// ---------------------------------------------------------------------------------------------

/**
 * Decorado de la base completa (`exterior/03`, ESCENAS §3.3, `mundo/01`). Nada de esto es un
 * `LugarId`: va FUERA del círculo caminable (`TERRENO.limite`), así no hace falta colisión nueva en
 * mundo.ts y ningún tubo queda atravesable. Cada pieza se ubica en el anillo exterior por su
 * ángulo visto desde el centro (0 = detrás de la mesa, hacia −z; positivo hacia la izquierda, −x):
 * la torre arriba a la izquierda del hábitat, con un corredor hasta su cápsula detrás del hábitat;
 * la antena parabólica detrás de la fila de paneles; la plataforma con nave, el grupo de energía y
 * el refugio de regolito hacia la izquierda; y la segunda cúpula detrás del invernadero. Radios =
 * huella en planta, en metros. [E]
 */
export interface Decorado {
  readonly id: "torre" | "capsula" | "parabolica" | "plataforma_nave" | "energia" | "refugio" | "cupula";
  readonly x: number;
  readonly z: number;
  readonly radio: number;
}

/** Primer anillo fuera del círculo caminable, con 1 m de aire. */
export const FUERA = TERRENO.limite + 1;
const RADIO_TORRE = 4.5;
const RADIO_CAPSULA = 2.6;
/** Radio del tambor de la torre: ahí nace el corredor. */
const TAMBOR_TORRE = 2.8;
/** Largo del corredor entre la torre y su cápsula (`exterior/01`). [E] */
export const LARGO_CORREDOR = 4.4;
/** Ancho del corredor en planta (diámetro de sus costillas). */
const ANCHO_CORREDOR = 2.4;
/** Escala de la antena parabólica del fondo respecto de la forma del módulo `antena`. [E] */
const ESCALA_PARABOLICA = 1.6;
/** Radio en planta de la parabólica: el plato de la forma del módulo mide 1,3 m de radio. */
const RADIO_PARABOLICA = 1.3 * ESCALA_PARABOLICA;
/** La segunda cúpula es la misma forma del invernadero (ya escalada a 0,72), entera. */
const RADIO_CUPULA = 2.9;

/**
 * Ángulo de la torre: el mínimo (en grados, hacia la izquierda) con el que su silueta se separa del
 * hábitat desde `CAMARAS.tercera` (`mundo/01`: torre entera a la izquierda del hábitat). Lo comprueba
 * `escena3d.test`. [E]
 */
export const ANGULO_TORRE = 33;

const rad = (g: number) => (g * Math.PI) / 180;
/** Punto del anillo a distancia `d` del centro, con ángulo `g` (grados, positivo hacia −x). */
function enAnillo(g: number, d: number): [number, number] {
  return [-Math.sin(rad(g)) * d, -Math.cos(rad(g)) * d];
}
/** Punto a distancia `d` del centro en la dirección de (x, z). */
function haciaFuera(x: number, z: number, d: number): [number, number] {
  const n = Math.hypot(x, z);
  return [(x / n) * d, (z / n) * d];
}
/** Giro que pone el frente (+z local) de una pieza en (x, z) mirando al centro de la base. */
const alCentro = (x: number, z: number) => Math.atan2(-x, -z);

/** Dirección tangente del anillo en la torre, hacia la derecha (hacia el hábitat). */
function tangenteTorre(): [number, number] {
  return [Math.cos(rad(ANGULO_TORRE)), -Math.sin(rad(ANGULO_TORRE))];
}

function decorados(): readonly Decorado[] {
  const [tx, tz] = enAnillo(ANGULO_TORRE, FUERA + RADIO_TORRE);
  const [ux, uz] = tangenteTorre();
  const capsula = TAMBOR_TORRE + LARGO_CORREDOR + 2.4;
  const sol = lugar("panel_solar"), banco = lugar("banco");
  const [px, pz] = enAnillo(49, FUERA + RADIO_PARABOLICA);
  const [nx, nz] = enAnillo(64, FUERA + 3.6);
  const [rx, rz] = haciaFuera(banco.mx, banco.mz, FUERA + 2.8);
  const [cx, cz] = enAnillo(-30.5, FUERA + RADIO_CUPULA);
  return [
    { id: "torre", x: tx, z: tz, radio: RADIO_TORRE },
    { id: "capsula", x: tx + ux * capsula, z: tz + uz * capsula, radio: RADIO_CAPSULA },
    { id: "parabolica", x: px, z: pz, radio: RADIO_PARABOLICA },
    { id: "plataforma_nave", x: nx, z: nz, radio: 3.6 },
    { id: "energia", x: -(FUERA + 3.4), z: sol.mz, radio: 3.4 },
    { id: "refugio", x: rx, z: rz, radio: 2.8 },
    { id: "cupula", x: cx, z: cz, radio: RADIO_CUPULA },
  ];
}

export const DECORADO: readonly Decorado[] = decorados();
export function decorado(id: Decorado["id"]): Decorado {
  return DECORADO.find((d) => d.id === id)!;
}

/** Corredor torre → cápsula: centro, giro (su tubo corre por z local) y largo. */
function corredor(): { x: number; z: number; giro: number } {
  const t = decorado("torre");
  const [ux, uz] = tangenteTorre();
  const d = TAMBOR_TORRE + LARGO_CORREDOR / 2;
  return { x: t.x + ux * d, z: t.z + uz * d, giro: Math.atan2(ux, uz) };
}

// ---------------------------------------------------------------------------------------------
// Huellas en planta de todo lo que monta este archivo
// ---------------------------------------------------------------------------------------------

/** Balizas de `caminos.ts` que no pisan módulos, edificios ni piezas del kit. */
export function balizasLibres(): [number, number][] {
  const r = PLANTA_KIT.baliza;
  const ocupado = [...huellasModulos(), ...huellasFijas()];
  return posicionesBalizas()
    .filter(([x, z]) => !ocupado.some((h) => distanciaAHuella(h, x, z) < r))
    .map(([x, z]) => [x, z]);
}

/** Distancia de un punto al borde de una huella (0 si cae dentro). */
export function distanciaAHuella(h: Huella, x: number, z: number): number {
  if ("r" in h) return Math.max(0, Math.hypot(x - h.x, z - h.z) - h.r);
  const c = Math.cos(h.giro), s = Math.sin(h.giro);
  const dx = x - h.x, dz = z - h.z;
  // Inversa de rotation.y: lleva el punto a los ejes locales de la caja.
  const lx = c * dx - s * dz, lz = s * dx + c * dz;
  const ex = Math.max(0, Math.abs(lx) - h.ancho / 2), ez = Math.max(0, Math.abs(lz) - h.fondo / 2);
  return Math.hypot(ex, ez);
}

/** Hábitat, decorado, corredor, consolas y cajas (sin balizas). */
function huellasFijas(): Huella[] {
  const h = lugar("habitat"), ph = plantaHabitat();
  const c = corredor();
  const { consola: pc, caja: pk } = PLANTA_KIT;
  return [
    { id: "habitat", x: h.mx, z: h.mz + ph.dz, ancho: ph.ancho, fondo: ph.fondo, giro: 0 },
    ...DECORADO.map((d) => ({ id: `decorado:${d.id}`, x: d.x, z: d.z, r: d.radio })),
    ...POS_ESTACIONES.map((e) => ({ id: `estacion:${e.id}`, x: e.x, z: e.z, r: e.radio })),
    { id: "corredor", x: c.x, z: c.z, ancho: ANCHO_CORREDOR, fondo: LARGO_CORREDOR, giro: c.giro },
    ...CONSOLAS.map((k) => {
      const p = consola(k.lugar, k.escala);
      return { id: `consola:${k.lugar}`, x: p.x, z: p.z, ancho: pc.ancho * p.escala, fondo: pc.fondo * p.escala, giro: p.giro };
    }),
    ...PANELES_MESA.dx.map((dx, i) => ({ id: `panel_mesa:${i}`, x: lugar("mesa").mx + dx, z: lugar("mesa").mz + PANELES_MESA.dz, ancho: PANELES_MESA.ancho, fondo: PANELES_MESA.fondo, giro: 0 })),
    ...CAJAS.map((k, i) => ({ id: `caja:${i}`, x: k.x, z: k.z, ancho: pk.ancho, fondo: pk.fondo, giro: k.giro })),
  ];
}

/** Huella en planta de todo lo que colocan `armarKit` y `armarEdificios`. */
export function huellasBase(): Huella[] {
  return [
    ...huellasFijas(),
    ...balizasLibres().map(([x, z], i) => ({ id: `baliza:${i}`, x, z, r: PLANTA_KIT.baliza })),
  ];
}

// ---------------------------------------------------------------------------------------------
// Montaje
// ---------------------------------------------------------------------------------------------

/** Caminos (una malla) y balizas instanciadas. */
export function armarKit(m: Materiales): THREE.Group {
  const kit = new THREE.Group();
  kit.name = "Base_Kit";
  const caminos = new THREE.Mesh(geometriaCaminos(), m.Rock);
  caminos.name = "Kit_Paths";
  caminos.receiveShadow = true;
  kit.add(caminos);
  kit.add(instanciar(() => fusionar(crearBaliza(m), "Kit_Beacon"), balizasLibres().map(([x, z]) => ({ posicion: [x, 0, z] }))));
  return kit;
}

/** Fila de cuatro paneles y dos depósitos (grupo de energía, `exterior/03` a la izquierda). */
function grupoEnergia(m: Materiales): THREE.Group {
  const g = new THREE.Group();
  for (let i = 0; i < 4; i++) g.add(colocar(crearPanelSolar(m), [0.4, 0, -2.4 + i * 1.6], [0, Math.PI / 2, 0], 1.3));
  g.add(colocar(crearDeposito(m), [-1.6, 0, -1.0]), colocar(crearDeposito(m), [-1.6, 0, 1.0], [0, 0, 0], 0.85));
  return g;
}

/**
 * Hábitat en su anclaje, todo el decorado y las piezas sueltas del kit (consolas y cajas), fusionado
 * por material en `Base_Buildings`: 1 llamada por slot, sin importar cuántas piezas haya.
 */
export function armarEdificios(m: Materiales): THREE.Group {
  const h = lugar("habitat");
  const g = new THREE.Group();
  const en = (id: Decorado["id"], o: THREE.Object3D, esc = 1) => {
    const d = decorado(id);
    return colocar(o, [d.x, 0, d.z], [0, alCentro(d.x, d.z), 0], esc);
  };
  const c = corredor();
  g.add(
    colocar(crearHabitat(m), [h.mx, 0, h.mz]),
    en("torre", crearTorreControl(m)),
    colocar(crearCorredor(m, LARGO_CORREDOR), [c.x, 0, c.z], [0, c.giro, 0]),
    en("capsula", crearCapsula(m)),
    en("parabolica", crearFormaModulo(m, "antena"), ESCALA_PARABOLICA),
    en("plataforma_nave", crearPlataformaNave(m)),
    colocar(grupoEnergia(m), [decorado("energia").x, 0, decorado("energia").z]),
    en("refugio", crearRefugio(m)),
    en("cupula", crearFormaModulo(m, "invernadero")),
  );
  // Estaciones por fuera y corredores de vidrio entre edificios vecinos.
  for (const e of POS_ESTACIONES) g.add(colocar(crearEstacion(m, e.id), [e.x, 0, e.z], [0, alCentro(e.x, e.z), 0]));
  for (const [a, b] of [[decorado("capsula"), decorado("plataforma_nave")], [POS_ESTACIONES[0], POS_ESTACIONES[1]], [POS_ESTACIONES[1], POS_ESTACIONES[2]]]) {
    const k = corredorEntre(a, b);
    if (k) g.add(colocar(crearCorredor(m, k.largo), [k.x, 0, k.z], [0, k.giro, 0]));
  }
  for (const k of CONSOLAS) {
    const p = consola(k.lugar, k.escala);
    g.add(colocar(crearConsola(m), [p.x, 0, p.z], [0, p.giro, 0], p.escala));
  }
  const mesa = lugar("mesa");
  for (const dx of PANELES_MESA.dx) g.add(colocar(crearPanelSolarInclinado(m), [mesa.mx + dx, 0.1, mesa.mz + PANELES_MESA.dz], [0, 0, 0], PANELES_MESA.escala));
  for (const k of CAJAS) g.add(colocar(crearCaja(m), [k.x, 0, k.z], [0, k.giro, 0]));
  return fusionar(g, "Base_Buildings");
}
