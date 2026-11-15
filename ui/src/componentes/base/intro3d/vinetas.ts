import * as THREE from "three";
import type { Materiales } from "../../../escena/materiales";
import { animar, crearPersonaje, type Expresion, type Gesto, type Personaje } from "../../../escena/personajes";
import { caja, chaflan, crearConsola, grupo, parte } from "../../../escena/activos/piezasComunes";
import { asiento, exteriorMarte, mate, pantallas, pared } from "./cabina";
import type { ArmarVineta, Vineta } from "./escenario";

/**
 * Viñetas de inicio/02 (HISTORIA §3) armadas con los modelos reales del juego. Cada una sigue la
 * composición de su cuadro de la lámina: dónde está el niño, qué hay en la ventana y qué hay al frente.
 * Coordenadas en metros; la cámara mira hacia -z y la pared de la ventana queda al fondo.
 */

type V3 = [number, number, number];

/** Tripulante colocado con su gesto. `pose` corrige huesos después del gesto (sentado, manos al panel). */
interface Actor { pj: Personaje; gesto: Gesto; pose?: ((pj: Personaje) => void) | undefined; expresion: Expresion }

export function actor(id: Parameters<typeof crearPersonaje>[0], pos: V3, giro: number, gesto: Gesto, pose?: (pj: Personaje) => void, expresion: Expresion = "feliz"): Actor {
  const pj = crearPersonaje(id);
  pj.grupo.position.set(...pos);
  pj.grupo.rotation.y = giro;
  return { pj, gesto, pose, expresion };
}

/** Sentado: muslos al frente, rodillas dobladas y pelvis a la altura del asiento. */
export function sentado(pj: Personaje): void {
  const h = pj.huesos;
  const p = pj.proporciones;
  const muslo = p.cadera[1] - p.articulacionRodilla[1];
  h.pelvis.position.y = pj.reposoPelvis - muslo * 0.95;
  h.musloI.rotation.x = h.musloD.rotation.x = -1.5;
  h.espinillaI.rotation.x = h.espinillaD.rotation.x = 1.5;
}

/** Guantes apoyados en el panel que tiene delante. */
export function manosAlPanel(pj: Personaje): void {
  const h = pj.huesos;
  h.brazoI.rotation.set(-0.85, 0, 0.18);
  h.brazoD.rotation.set(-0.85, 0, -0.18);
  h.antebrazoI.rotation.x = h.antebrazoD.rotation.x = -0.25;
}

/** Arma la viñeta con sus actores: los anima y los libera junto con el grupo. */
export function conActores(g: THREE.Group, camara: Vineta["camara"], actores: readonly Actor[], extra?: Pick<Vineta, "animar" | "liberar">): Vineta {
  for (const a of actores) g.add(a.pj.grupo);
  return {
    grupo: g,
    camara,
    animar(t, quieto) {
      for (const a of actores) {
        animar(a.pj, a.gesto, quieto ? 0.4 : t, { quieto, expresion: a.expresion });
        a.pose?.(a.pj);
      }
      extra?.animar?.(t, quieto);
    },
    liberar() {
      for (const a of actores) a.pj.liberar();
      extra?.liberar?.();
    },
  };
}

/** Suelo de la cabina: placa marfil chaflanada. */
export const piso = (ancho: number, fondo: number) => {
  const p = new THREE.Mesh(new THREE.BoxGeometry(ancho, 0.1, fondo), mate("traje-marfil"));
  p.position.y = -0.05;
  return p;
};

/**
 * 01 / A new mission: el niño sentado de medio cuerpo, guantes sobre el panel con su pantalla,
 * consolas y pantallas a los lados y, por la ventana grande, el relieve de Marte con rocas y un planeta arriba.
 */
export const vineta1: ArmarVineta = (m: Materiales) => {
  const g = new THREE.Group();
  const fondo = pared(24, 4.2, [{ x: 1.15, y: 2.15, w: 4.6, h: 2.3, c: 0.45 }]);
  fondo.position.z = -2.4;
  const lado = pared(5, 4.2, [], "lila");
  lado.position.set(-3.1, 0, -2.4);
  lado.rotation.y = Math.PI / 2;
  // Puesto del niño (asiento, panel y niño) girado en tres cuartos hacia la ventana, como la lámina.
  const puesto = new THREE.Group();
  puesto.name = "Cabin_Station";
  const silla = asiento(m);
  silla.position.set(0, 0.25, -0.12);
  silla.scale.setScalar(1.2);
  puesto.add(
    silla,
    parte(m, "SuitBase", chaflan(1.3, 0.1, 0.6, 0.12), [0, 0.9, 0.48], "Desk_Top"),
    parte(m, "SuitBase", caja(1.1, 0.86, 0.4), [0, 0.43, 0.58], "Desk_Body"),
    parte(m, "Emissive", chaflan(0.62, 0.02, 0.3, 0.06), [0, 0.96, 0.42], "Desk_Screen"),
  );
  puesto.position.set(-1.0, 0, 0.95);
  puesto.rotation.y = 1.15;
  g.add(
    piso(26, 10),
    fondo,
    lado,
    exteriorMarte(m, { cielo: "espacio", suelo: -1.2, planeta: [9, 12, -34], globo: { centro: [1.2, -54.5, -52], radio: 60 } }),
    pantallas(m, 3, -2.25, 3.05, 0).translateZ(-2.15),
    puesto,
  );
  // Consola baja de la derecha, al tamaño de la de la lámina.
  const consola = crearConsola(m);
  consola.position.set(2.15, 0, 0.75);
  consola.rotation.y = -0.6;
  consola.scale.setScalar(0.72);
  g.add(consola);
  const nino = actor("nino", [-1.0, 0.7, 0.95], 1.15, "reposo", (pj) => {
    sentado(pj);
    manosAlPanel(pj);
    pj.huesos.cabeza.rotation.y = 0.15;
  });
  return conActores(g, { desde: [0.1, 1.35, 3.5], hacia: [0.15, 1.2, 0], fov: 46 }, [nino]);
};
