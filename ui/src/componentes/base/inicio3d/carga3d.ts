/**
 * Carga en 3D (inicio/03): los tres módulos del juego en fila (panel solar del kit, invernadero con
 * cultivos y refugio de domo) unidos por una órbita fina con dos rocas, y el niño de cuerpo entero a la
 * izquierda con la tableta del Sol. Las insignias de cada módulo y el panel de texto son DOM.
 */
import * as THREE from "three";
import { createElement } from "react";
import { fusionar } from "../../../escena/activos/fusionar.js";
import { crearFormaModulo } from "../../../escena/activos/modulos.js";
import { crearPanelSolar } from "../../../escena/activos/piezasComunes.js";
import { liberarMateriales } from "../../../escena/liberar.js";
import { crearMateriales } from "../../../escena/materiales.js";
import { animar, crearPersonaje, type Personaje } from "../../../escena/personajes/index.js";
import { Ilustracion3D } from "./Ilustracion3D.js";
import { color, mate, modoInicio, type Caja, type Ilustracion, type Modo } from "./lienzo.js";
import { crearSombra, tubo } from "./piezas.js";

type Cajas = Record<"nino" | "panel" | "invernadero" | "domo" | "roca1" | "roca2", Caja | null>;
/** Órbita: centro, radios (en % del ancho y del alto) y giro en grados. */
interface Orbita { cx: number; cy: number; rx: number; ry: number; giro: number }

/**
 * Cajas por modo, medidas en inicio/03 (1024 x 683). Los centros de los módulos coinciden con las
 * insignias DOM de `inicio.css` (`.carga-icono`): si cambia uno, cambia el otro.
 */
export const CAJAS_CARGA: Record<Modo, Cajas & { orbita: Orbita | null }> = {
  ancho: {
    nino: { x: 3, y: 34, w: 25, h: 56 },
    panel: { x: 27, y: 22, w: 18, h: 21 },
    invernadero: { x: 49.5, y: 21, w: 16, h: 22 },
    domo: { x: 70.5, y: 19, w: 25, h: 24 },
    roca1: { x: 43, y: 5, w: 2.4, h: 3.6 },
    roca2: { x: 66, y: 45, w: 2.4, h: 3.6 },
    orbita: { cx: 57.5, cy: 26, rx: 40.5, ry: 21, giro: -5 },
  },
  horizontal: {
    nino: { x: 2, y: 30, w: 24, h: 66 },
    panel: { x: 27, y: 11, w: 14, h: 20 },
    invernadero: { x: 43, y: 10, w: 13, h: 21 },
    domo: { x: 57, y: 10, w: 16, h: 21 },
    roca1: null,
    roca2: null,
    orbita: null,
  },
  vertical: {
    nino: { x: 26, y: 29.5, w: 48, h: 25 },
    panel: { x: 3, y: 18, w: 28, h: 11 },
    invernadero: { x: 36, y: 18, w: 28, h: 11 },
    domo: { x: 68, y: 18, w: 29, h: 11 },
    roca1: null,
    roca2: null,
    orbita: null,
  },
};

/** Sol de la tableta: octógono ámbar con ocho rayos, en la cara de la pantalla (cuerpo.ts, tableta). */
function crearSol(): THREE.Mesh {
  const g = new THREE.CircleGeometry(0.026, 8);
  const formas = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2;
    const [c, s] = [Math.cos(a), Math.sin(a)];
    const v = (r: number, d: number) => new THREE.Vector2(c * r - s * d, s * r + c * d);
    return new THREE.Shape([v(0.033, 0.007), v(0.05, 0), v(0.033, -0.007)]);
  });
  const rayos = new THREE.ShapeGeometry(formas);
  const sol = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: color("ambar") }));
  sol.add(new THREE.Mesh(rayos, sol.material));
  sol.scale.setScalar(0.85);
  return sol;
}

/** Pose de inicio/03: sostiene la tableta con las dos manos y mira al jugador, contento. */
function posar(pj: Personaje, t: number): void {
  animar(pj, "inspeccionar", t);
  const h = pj.huesos;
  // La pantalla mira al jugador (en el juego mira al niño), apaisada, entre las dos manos y del tamaño de la lámina.
  h.tableta.rotation.set(1.3, 0, Math.PI / 2);
  h.tableta.scale.setScalar(2.6);
  h.tableta.position.set(0.1, 0, -0.04);
  h.cabeza.rotation.set(-0.05, 0.25, 0);
  pj.expresion("feliz");
}

export function crearCarga3D(): Ilustracion {
  const modo = modoInicio;
  const cajas = (n: keyof Cajas) => (w: number, h: number) => CAJAS_CARGA[modo(w, h)][n];

  const pj = crearPersonaje("nino");
  posar(pj, 0.5);
  const sol = crearSol();
  sol.position.set(-0.025, 0.045, 0.069);
  pj.huesos.tableta.add(sol);
  // Girado hacia el panel de texto, como en la lámina.
  pj.grupo.rotation.y = 0.7;
  const sombra = crearSombra();
  sombra.scale.set(0.42, 0.07, 1);
  sombra.position.set(0, 0.01, -0.5);
  const nino = new THREE.Group();
  nino.add(pj.grupo, sombra);

  const m = crearMateriales();
  const modulo = (o: THREE.Object3D, nombre: string, giro: [number, number]) => {
    const g = new THREE.Group();
    g.add(fusionar(o, nombre));
    g.rotation.set(giro[0], giro[1], 0);
    return g;
  };
  const roca = () => new THREE.Mesh(new THREE.IcosahedronGeometry(1, 0), mate("traje-marfil"));
  const orbita = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color: color("marfil"), transparent: true, opacity: 0.75 }));

  return {
    piezas: [
      { objeto: modulo(crearPanelSolar(m), "Carga_Panel", [0.3, -0.55]), caja: cajas("panel"), capa: 2 },
      { objeto: modulo(crearFormaModulo(m, "invernadero"), "Carga_Invernadero", [0.42, 0]), caja: cajas("invernadero"), capa: 2 },
      { objeto: modulo(crearFormaModulo(m, "escudo"), "Carga_Domo", [0.32, -0.35]), caja: cajas("domo"), capa: 2 },
      { objeto: roca(), caja: cajas("roca1"), capa: 1 },
      { objeto: roca(), caja: cajas("roca2"), capa: 3 },
      { objeto: nino, caja: cajas("nino"), capa: 4, mover: (t) => void posar(pj, t) },
    ],
    encajado(w, h, escena) {
      if (!orbita.parent) escena.add(orbita);
      const o = CAJAS_CARGA[modo(w, h)].orbita;
      orbita.visible = o !== null;
      if (!o) return;
      const g = THREE.MathUtils.degToRad(o.giro);
      const pts: [number, number][] = Array.from({ length: 24 }, (_, i) => {
        const a = (i / 24) * Math.PI * 2;
        const [x, y] = [Math.cos(a) * (o.rx / 100) * w, Math.sin(a) * (o.ry / 100) * h];
        return [(o.cx / 100) * w + x * Math.cos(g) - y * Math.sin(g), (o.cy / 100) * h + x * Math.sin(g) + y * Math.cos(g)];
      });
      tubo(orbita, pts, 0, Math.max(1, w / 900), true);
    },
    liberar() {
      pj.liberar();
      liberarMateriales(Object.values(m));
    },
  };
}

/** Capa 3D de la carga, para cargarla aparte (`lazy`). */
export default function IlustracionCarga({ onFallo }: { onFallo?: () => void }) {
  return createElement(Ilustracion3D, { crear: crearCarga3D, className: "inicio-3d", onFallo });
}
