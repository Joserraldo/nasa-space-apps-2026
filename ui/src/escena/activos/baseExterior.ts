/** Configuración y montaje modular del decorado fijo. No mueve los anclajes de interacción. */
import * as THREE from "three";
import type { Materiales } from "../materiales";
import { TERRENO, lugar, type LugarId } from "../mundo";
import { instanciar, type TransformacionPieza } from "./instancias";
import { crearBaliza, crearCaja, crearConsola, crearDeposito, crearPanelSolar } from "./piezasComunes";
import { crearCapsula, crearCorredor, crearHabitat, crearPlataformaNave, crearRefugio, crearTorreControl } from "./edificios";
import { colocar } from "./modulos";
import { giroHacia } from "./modulosArmados";
import { fusionar } from "./fusionar";
import { geometriaCaminos, posicionesBalizas } from "./caminos";

export const CONSOLAS = [
  { lugar: "mesa", escala: 1 },
  { lugar: "taller", escala: 0.55 },
  { lugar: "sensor", escala: 0.4 },
] as const;

function mirandoA(id: LugarId, escala = 1): TransformacionPieza {
  const l = lugar(id);
  return { posicion: [l.mx, 0, l.mz], rotacion: [0, giroHacia(l, l), 0], escala };
}

export function armarKit(m: Materiales): THREE.Group {
  const kit = new THREE.Group();
  kit.name = "Base_Kit";
  kit.add(instanciar(() => fusionar(crearConsola(m), "Kit_Console"), CONSOLAS.map(c => mirandoA(c.lugar, c.escala))));
  kit.add(
    instanciar(() => fusionar(crearCaja(m), "Kit_Crate"), [
      { posicion: [-3.5, 0, -2.4], rotacion: [0, 0.3, 0] },
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
 * Decorado de la base completa (`exterior/03`, ESCENAS §3.3). Nada de esto es un `LugarId`: va
 * FUERA del círculo caminable (`TERRENO.limite`), así no hace falta colisión nueva en mundo.ts y
 * ningún tubo queda atravesable. Cada pieza se ubica desde `LUGARES`: la torre detrás del hábitat
 * (su `mx`), la plataforma con nave hacia el sector del escudo y la energía (arriba a la izquierda),
 * la fila de paneles y depósitos a la izquierda del panel solar, y el refugio de regolito abajo a
 * la izquierda, detrás del banco. Radios = huella en planta, en metros. [E]
 */
export interface Decorado {
  readonly id: "torre" | "capsula_oeste" | "capsula_este" | "plataforma_nave" | "energia" | "refugio";
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
/** Largo de cada corredor entre la torre y una cápsula (`exterior/01`). [E] */
export const LARGO_CORREDOR = 4.4;

/** Punto a distancia `d` del centro en la dirección de (x, z). */
function haciaFuera(x: number, z: number, d: number): [number, number] {
  const n = Math.hypot(x, z);
  return [(x / n) * d, (z / n) * d];
}

function decorados(): readonly Decorado[] {
  const h = lugar("habitat");
  const torreZ = -(FUERA + RADIO_TORRE);
  const capX = TAMBOR_TORRE + LARGO_CORREDOR + 2.4;
  const esc = lugar("escudo"), sol = lugar("panel_solar"), banco = lugar("banco");
  const [nx, nz] = haciaFuera((esc.mx + sol.mx) / 2, (esc.mz + sol.mz) / 2, FUERA + 3.6);
  const [rx, rz] = haciaFuera(banco.mx, banco.mz, FUERA + 2.8);
  return [
    { id: "torre", x: h.mx, z: torreZ, radio: RADIO_TORRE },
    { id: "capsula_oeste", x: h.mx - capX, z: torreZ, radio: RADIO_CAPSULA },
    { id: "capsula_este", x: h.mx + capX, z: torreZ, radio: RADIO_CAPSULA },
    { id: "plataforma_nave", x: nx, z: nz, radio: 3.6 },
    { id: "energia", x: -(FUERA + 3.4), z: sol.mz, radio: 3.4 },
    { id: "refugio", x: rx, z: rz, radio: 2.8 },
  ];
}

export const DECORADO: readonly Decorado[] = decorados();
export function decorado(id: Decorado["id"]): Decorado {
  return DECORADO.find((d) => d.id === id)!;
}

/** Fila de cuatro paneles y dos depósitos (grupo de energía, `mundo/01` al fondo a la izquierda). */
function grupoEnergia(m: Materiales): THREE.Group {
  const g = new THREE.Group();
  for (let i = 0; i < 4; i++) g.add(colocar(crearPanelSolar(m), [0.4, 0, -2.4 + i * 1.6], [0, Math.PI / 2, 0], 1.3));
  g.add(colocar(crearDeposito(m), [-1.6, 0, -1.0]), colocar(crearDeposito(m), [-1.6, 0, 1.0], [0, 0, 0], 0.85));
  return g;
}

/** Hábitat en su anclaje y todo el decorado; se fusiona por material (1 llamada por slot). */
export function armarEdificios(m: Materiales): THREE.Group {
  const h = lugar("habitat");
  const pos = (id: Decorado["id"]): [number, number, number] => [decorado(id).x, 0, decorado(id).z];
  const torre = decorado("torre");
  const corredorX = TAMBOR_TORRE + LARGO_CORREDOR / 2;
  const nave = decorado("plataforma_nave"), refugio = decorado("refugio");
  const g = new THREE.Group();
  g.add(
    colocar(crearHabitat(m), [h.mx, 0, h.mz]),
    colocar(crearTorreControl(m), pos("torre")),
    colocar(crearCorredor(m, LARGO_CORREDOR), [torre.x - corredorX, 0, torre.z], [0, Math.PI / 2, 0]),
    colocar(crearCorredor(m, LARGO_CORREDOR), [torre.x + corredorX, 0, torre.z], [0, Math.PI / 2, 0]),
    colocar(crearCapsula(m), pos("capsula_oeste")),
    colocar(crearCapsula(m), pos("capsula_este")),
    colocar(crearPlataformaNave(m), pos("plataforma_nave"), [0, Math.atan2(-nave.x, -nave.z), 0]),
    colocar(grupoEnergia(m), pos("energia")),
    colocar(crearRefugio(m), pos("refugio"), [0, Math.atan2(-refugio.x, -refugio.z), 0]),
  );
  return fusionar(g, "Base_Buildings");
}
