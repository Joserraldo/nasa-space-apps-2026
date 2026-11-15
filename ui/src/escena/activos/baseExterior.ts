/** Configuración y montaje modular del decorado fijo. No mueve los anclajes de interacción. */
import * as THREE from "three";
import type { Materiales } from "../materiales";
import { lugar, type LugarId } from "../mundo";
import { instanciar, type TransformacionPieza } from "./instancias";
import { crearBaliza, crearCaja, crearConsola } from "./piezasComunes";
import { crearHabitat, crearTorreControl } from "./edificios";
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

/** Edificios independientes como en mundo/01. No se colocan tubos sin colisión en el recorrido. */
export const EDIFICIOS = { torre: { x: -13, z: -22 }, escalaTorre: 1 } as const;

export function armarEdificios(m: Materiales): THREE.Group {
  const h = lugar("habitat");
  const t = EDIFICIOS.torre;
  const g = new THREE.Group();
  g.add(
    colocar(crearHabitat(m), [h.mx, 0, h.mz]),
    colocar(crearTorreControl(m), [t.x, 0, t.z], [0, 0, 0], EDIFICIOS.escalaTorre),
  );
  return fusionar(g, "Base_Buildings");
}

