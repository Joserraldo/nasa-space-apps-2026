/**
 * Portada en 3D (inicio/01, capas de DISEÑO §6): el niño real del juego flotando y saludando, la nave
 * orbital de la lámina (naveOrbital.ts) abajo a la derecha recortada por el borde, el cable de la
 * mochila a su puerto, el planeta con anillo y los asteroides. Cajas de DISEÑO §6 en % del lienzo.
 */
import * as THREE from "three";
import { animar, crearPersonaje, type Personaje } from "../../../escena/personajes/index.js";
import { createElement } from "react";
import { Ilustracion3D } from "./Ilustracion3D.js";
import { mate, mezcla, modoInicio, type Caja, type Ilustracion, type Modo } from "./lienzo.js";
import { crearNaveOrbital } from "./naveOrbital.js";
import { crearAsteroide, crearPlaneta, tubo } from "./piezas.js";

type Cajas = Record<"nino" | "nave" | "planeta" | "asteroide" | "asteroide2" | "asteroide3", Caja | null>;

/** Cajas por modo. En ancho son las de DISEÑO §6; la nave sale del lienzo para quedar recortada. */
export const CAJAS_PORTADA: Record<Modo, Cajas> = {
  ancho: {
    nino: { x: 49, y: 18, w: 31, h: 57 },
    nave: { x: 77, y: 61, w: 31, h: 46 },
    planeta: { x: 79, y: 15, w: 16, h: 14 },
    asteroide: { x: 39, y: 7, w: 10, h: 13 },
    asteroide2: { x: 41, y: 80, w: 9, h: 14 },
    asteroide3: { x: 93, y: 38, w: 3, h: 5 },
  },
  horizontal: {
    nino: { x: 66, y: 14, w: 24, h: 72 },
    nave: { x: 82, y: 64, w: 26, h: 42 },
    planeta: { x: 88, y: 24, w: 10, h: 18 },
    asteroide: { x: 58, y: 80, w: 6, h: 13 },
    asteroide2: null,
    asteroide3: null,
  },
  vertical: {
    nino: { x: 20, y: 31, w: 60, h: 29 },
    nave: { x: 78, y: 47, w: 36, h: 14 },
    planeta: { x: 74, y: 23, w: 22, h: 7 },
    asteroide: { x: 6, y: 27, w: 12, h: 6 },
    asteroide2: null,
    asteroide3: null,
  },
};

/**
 * Cable de inicio/01: sale de la espalda (detrás del cuerpo), baja por la izquierda del niño y se curva
 * hasta el conector. Los primeros puntos van en unidades de la caja del niño desde el torso.
 */
const CABLE_NINO: [number, number][] = [[0, 0], [-0.3, 0.02], [-0.42, 0.2], [-0.38, 0.45], [-0.22, 0.62]];

/**
 * Pose de la lámina: saluda con la mano que queda a la derecha del cuadro (el saludo del juego es con la
 * otra), la otra mano abierta y las piernas dobladas, flotando. Mismo vaivén que el gesto "saludar".
 */
function posar(pj: Personaje, t: number): void {
  animar(pj, "reposo", t, { expresion: "feliz" });
  const h = pj.huesos;
  const vaiven = Math.sin(t * 7.5) * 0.3;
  h.brazoI.rotation.set(0, 0, 1.3);
  h.antebrazoI.rotation.set(0, 0, 1.25 - vaiven);
  h.manoI.rotation.z = -vaiven * 0.5;
  h.brazoD.rotation.set(-0.35, 0, -0.55);
  h.antebrazoD.rotation.set(-0.6, 0, -0.2);
  h.cabeza.rotation.z = 0.07;
  h.musloD.rotation.x = -0.55;
  h.espinillaD.rotation.x = 0.9;
  h.musloI.rotation.x = 0.15;
  h.espinillaI.rotation.x = 0.55;
  h.pieI.rotation.x = 0.3;
}

export function crearPortada3D(): Ilustracion {
  const modo = modoInicio;
  const cajas = (n: keyof Cajas) => (w: number, h: number) => CAJAS_PORTADA[modo(w, h)][n];

  const pj = crearPersonaje("nino");
  posar(pj, 0.2);
  const nino = new THREE.Group();
  nino.add(pj.grupo);
  pj.grupo.rotation.set(0.1, -0.35, 0.45);

  // Nave orbital de la lámina (capas/nave.png), con el puerto del cable en la proa.
  const { grupo: nave, puerto: conector } = crearNaveOrbital();
  nave.rotation.set(0.1, 0.25, 0.2);

  const asteroides = [crearAsteroide(1, 2), crearAsteroide(3, 2), crearAsteroide(5, 1)];
  asteroides[1]!.rotation.set(0.5, 1.2, 0);

  const cable = new THREE.Mesh(new THREE.BufferGeometry(), mate(mezcla("lila", "montana-lejana", 0.45)));
  const mochila = new THREE.Vector3();
  const puerto = new THREE.Vector3();
  const lento = (amp: number, periodo: number, fase = 0) => (t: number) => ({ dx: amp * Math.sin((t * 2 * Math.PI) / periodo + fase) * 0.6, dy: amp * Math.sin((t * 2 * Math.PI) / periodo + fase) });

  return {
    piezas: [
      { objeto: nave, caja: cajas("nave"), capa: 2 },
      {
        objeto: nino,
        caja: cajas("nino"),
        capa: 4,
        // Flota 6 px en 6 s y gira 1° como máximo (DISEÑO §6); el saludo es el gesto del juego.
        mover: (t) => {
          posar(pj, t);
          return { dy: 3 * Math.sin((t * Math.PI) / 3), giro: Math.sin((t * Math.PI) / 3 + 1) };
        },
      },
      { objeto: crearPlaneta(), caja: cajas("planeta"), capa: 1, mover: lento(4, 8) },
      { objeto: asteroides[0]!, caja: cajas("asteroide"), capa: 1, mover: lento(4, 8, 2) },
      { objeto: asteroides[1]!, caja: cajas("asteroide2"), capa: 1, mover: lento(3, 8, 4) },
      { objeto: asteroides[2]!, caja: cajas("asteroide3"), capa: 1 },
    ],
    encajado(w, h, escena) {
      // Cable (capa 3): de la mochila, detrás del cuerpo, al conector de la nave. Solo existe en la portada.
      if (!cable.parent) escena.add(cable);
      cable.visible = CAJAS_PORTADA[modo(w, h)].nave !== null;
      pj.huesos.torso.getWorldPosition(mochila);
      conector.getWorldPosition(puerto);
      const k = CAJAS_PORTADA[modo(w, h)].nino!;
      const [kw, kh] = [(k.w / 100) * w, (k.h / 100) * h];
      const pts = CABLE_NINO.map(([u, v]): [number, number] => [mochila.x + u * kw, -mochila.y + v * kh]);
      const [ux, uy] = pts[pts.length - 1]!;
      const [bx, by] = [puerto.x, -puerto.y];
      pts.push([ux + (bx - ux) * 0.45, uy + (by - uy) * 0.75], [bx, by]);
      tubo(cable, pts, 3 * 2000, Math.max(2, w / 420));
    },
    liberar() {
      pj.liberar();
      cable.geometry.dispose();
      (cable.material as THREE.Material).dispose();
    },
  };
}

/** Capa 3D de la portada, para cargarla aparte (`lazy`): three no frena el primer cuadro del menú. */
export default function IlustracionPortada({ onFallo }: { onFallo?: () => void }) {
  return createElement(Ilustracion3D, { crear: crearPortada3D, className: "inicio-3d", onFallo });
}
