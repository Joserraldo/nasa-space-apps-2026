/**
 * Domo de vidrio del invernadero (Etapa D3), pieza original según `ss-referencias\kits-previas\dome\all.png` y
 * `catalogo\domos\domos-vidrio-tres-variantes.png` (variante azul): media esfera de vidrio con marco blanco en
 * cuadrícula (meridianos y paralelos), anillo de base y esclusa en caja al frente. Adentro, estantes con plantas verdes
 * bajo luz cálida encendida, así se ve el proceso de la tarjeta `plantas`.
 *
 * Paleta del sistema estético (`clasificacion-objetos.md`): vidrio en el azul único, marco y paredes en blanco cálido,
 * bases y soportes en gris cálido claro, puerta en panel grafito sin marco (el invernadero no tiene acento) y el verde
 * solo en las plantas. Sin rosa: las luces de crecimiento rojas y azules del Veggie real se leerían rosadas.
 * Frente (esclusa) hacia +z, base en y = 0, medidas en metros. [E]
 */
import * as THREE from "three";
import { ESCLUSA, caja, crearEsclusa, grupo, luzCaja, parteKit, parteLuz, parteMarco, pintar, tonear, type MaterialesColonia, type PiezasQuaternius } from "./coloniaPiezas";
import { PALETA } from "./polvoKit";

export interface OpcionesDomo {
  radio: number;
  /** Estantes de cultivo adentro (cuántos). */
  estantes: number;
  /** Esclusa al frente (la misma de toda la colonia; el invernadero no tiene acento). Por defecto, sí. */
  esclusa?: boolean;
  /** Piezas del kit Quaternius (esclusa `House_Long` y rampa). */
  q?: PiezasQuaternius | undefined;
}

/** Meridianos y paralelos del marco (la referencia tiene 16 gajos y 5 anillos). */
const MARCO = { meridianos: 16, paralelos: 5, grueso: 0.045 } as const;

/** Barra triangular (3 caras, sin tapas) de `a` a `b`: lo mínimo que se lee como marco. */
function barra(a: THREE.Vector3, b: THREE.Vector3, grueso: number): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(grueso, grueso, a.distanceTo(b), 3, 1, true);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  g.applyQuaternion(q);
  g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
  return g;
}

function punto(r: number, meridiano: number, paralelo: number): THREE.Vector3 {
  const az = (meridiano / MARCO.meridianos) * Math.PI * 2;
  const el = (paralelo / MARCO.paralelos) * (Math.PI / 2);
  return new THREE.Vector3(Math.sin(az) * Math.cos(el) * r, Math.sin(el) * r, Math.cos(az) * Math.cos(el) * r);
}

/** Estante de cultivo (silueta de `SM_Hydro_Rack`): patas grises, tres bandejas blancas con plantas y luz encima. */
function estante(m: MaterialesColonia, alto: number): THREE.Group {
  const g = new THREE.Group();
  const ancho = 1.1, fondo = 0.45;
  for (const x of [-ancho / 2, ancho / 2]) for (const z of [-fondo / 2, fondo / 2]) g.add(parteKit(caja(0.04, alto, 0.04, PALETA.gris), m, [x, alto / 2, z]));
  const planta = tonear(new THREE.OctahedronGeometry(0.12, 0), PALETA.planta);
  for (let i = 0; i < 3; i++) {
    const y = 0.25 + (i * (alto - 0.3)) / 3;
    g.add(parteKit(caja(ancho, 0.04, fondo, PALETA.blanco), m, [0, y, 0]));
    for (let k = 0; k < 4; k++) g.add(parteKit(planta.clone(), m, [-0.4 + k * 0.27, y + 0.1, 0]));
    g.add(parteLuz(luzCaja(ancho * 0.9, 0.025, 0.06, PALETA.luzCalida, 1.6), m, [0, y + (alto - 0.3) / 3 - 0.06, 0]));
  }
  planta.dispose();
  return g;
}

/** Domo completo, sin fusionar (la colonia lo fusiona por material con el resto). */
export function crearDomoVidrio(m: MaterialesColonia, o: OpcionesDomo): THREE.Group {
  const g = grupo("Colony_GlassDome");
  const r = o.radio;
  // Vidrio: media esfera de 16 × 5 caras (las mismas del marco), en el azul único de la paleta.
  const vidrio = new THREE.SphereGeometry(r * 0.985, MARCO.meridianos, MARCO.paralelos, 0, Math.PI * 2, 0, Math.PI / 2);
  const v = new THREE.Mesh(pintar(vidrio, new THREE.Color(PALETA.azul)), m.vidrio);
  v.name = "Dome_Glass";
  v.castShadow = false;
  v.renderOrder = 2;
  g.add(v);
  // Marco blanco en cuadrícula; anillo de base gris (las bases van en gris cálido claro).
  const barras: THREE.BufferGeometry[] = [];
  for (let i = 0; i < MARCO.meridianos; i++) for (let k = 0; k < MARCO.paralelos; k++) barras.push(barra(punto(r, i, k), punto(r, i, k + 1), MARCO.grueso));
  for (let k = 1; k < MARCO.paralelos; k++) for (let i = 0; i < MARCO.meridianos; i++) barras.push(barra(punto(r, i, k), punto(r, i + 1, k), MARCO.grueso));
  for (const b of barras) g.add(parteMarco(tonear(b, PALETA.blanco), m, [0, 0, 0]));
  g.add(parteMarco(tonear(new THREE.CylinderGeometry(r * 1.03, r * 1.05, 0.32, 16, 1, true), PALETA.gris), m, [0, 0.16, 0]));
  g.add(parteMarco(tonear(new THREE.CylinderGeometry(0.5, 0.5, 0.12, 10), PALETA.blanco), m, [0, r, 0]));
  // Esclusa única de la colonia (sin acento: puerta grafito sin marco), apoyada en el vidrio.
  if (o.esclusa !== false) {
    // En los domos chicos la esclusa va a menor escala para no tapar el domo (excepción a la regla 8, anotada).
    const tamano = r < 3 ? 0.62 : 1;
    const e = crearEsclusa(m, null, o.q, tamano);
    // La escotilla asoma 0,9 m del vidrio; el resto del módulo entra en el domo (se ve como túnel a través del vidrio).
    e.position.z = r + 0.9 * tamano - ESCLUSA.fondo * tamano;
    g.add(e);
  }
  // Estantes de cultivo en fila por el centro, bajo la parte alta del domo.
  const alto = Math.min(1.7, r * 0.6);
  for (let i = 0; i < o.estantes; i++) {
    const e = estante(m, alto);
    e.position.set((i - (o.estantes - 1) / 2) * 1.35, 0.05, -r * 0.1);
    g.add(e);
  }
  return g;
}

/**
 * Emisor del escudo (módulo `escudo`, huella 2,2 × 4,0): el escudo es la cúpula que rodea la base
 * (`sistemas/escudoTormenta.ts`, pedido de María Paula del 18 nov), así que en su anclaje va el mismo domo de vidrio en
 * chico, sobre un anillo gris, con un núcleo de luz azul claro que proyecta la cúpula. Sin caja ni generador sueltos. [E]
 */
export function crearEmisorEscudo(m: MaterialesColonia): THREE.Group {
  const g = grupo("Shield_Emitter");
  g.add(parteMarco(tonear(new THREE.CylinderGeometry(1.15, 1.25, 0.28, 16), PALETA.gris), m, [0, 0.14, 0]));
  g.add(parteMarco(tonear(new THREE.CylinderGeometry(1.0, 1.0, 0.06, 16), PALETA.blanco), m, [0, 0.31, 0]));
  const domo = crearDomoVidrio(m, { radio: 0.95, estantes: 0, esclusa: false });
  domo.position.y = 0.3;
  g.add(domo);
  g.add(parteLuz(pintar(new THREE.IcosahedronGeometry(0.32, 1), new THREE.Color(PALETA.azulClaro).multiplyScalar(1.8)), m, [0, 0.72, 0]));
  return g;
}
