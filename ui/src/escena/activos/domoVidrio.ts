/**
 * Domo de vidrio del invernadero (Etapa D3), pieza original según `ss-referencias\kits-previas\dome\all.png` y
 * `catalogo\domos\domos-vidrio-tres-variantes.png`: media esfera de vidrio con marco blanco en cuadrícula (meridianos y
 * paralelos), anillo de base y esclusa en caja al frente. Tres variantes de vidrio, como las de la referencia: celeste
 * claro, azul oscuro y transparente. Adentro, estantes con plantas verdes bajo luces de crecimiento rosadas (las luces
 * rojas y azules del Veggie de la ISS), así se ve el proceso de la tarjeta `plantas`.
 * Frente (esclusa) hacia +z, base en y = 0, medidas en metros. Acento verde de invernadero en la esclusa. [E]
 */
import * as THREE from "three";
import { caja, crearPosteLuz, franjaPeligro, grupo, luzCaja, parteKit, parteLuz, parteMarco, pintar, tonear, type MaterialesColonia } from "./coloniaPiezas";

export const VIDRIOS = {
  celeste: "#5fbfd6",
  azul: "#1c5a8e",
  claro: "#b4dbe8",
} as const;
export type Vidrio = keyof typeof VIDRIOS;

export interface OpcionesDomo {
  radio: number;
  vidrio: Vidrio;
  /** Estantes de cultivo adentro (cuántos). */
  estantes: number;
}

/** Meridianos y paralelos del marco (la referencia tiene 16 gajos y 5 anillos). */
const MARCO = { meridianos: 16, paralelos: 5, grueso: 0.07 } as const;

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

/** Estante de cultivo (silueta de `SM_Hydro_Rack`): cuatro patas, tres bandejas con plantas y su barra de luz encima. */
function estante(m: MaterialesColonia, alto: number): THREE.Group {
  const g = new THREE.Group();
  const ancho = 1.1, fondo = 0.45;
  for (const x of [-ancho / 2, ancho / 2]) for (const z of [-fondo / 2, fondo / 2]) g.add(parteKit(caja(0.04, alto, 0.04, "aluminio"), m, [x, alto / 2, z]));
  const planta = tonear(new THREE.OctahedronGeometry(0.12, 0), "verde");
  for (let i = 0; i < 3; i++) {
    const y = 0.25 + i * (alto - 0.3) / 3;
    g.add(parteKit(caja(ancho, 0.04, fondo, "blanco"), m, [0, y, 0]));
    for (let k = 0; k < 4; k++) g.add(parteKit(planta.clone(), m, [-0.4 + k * 0.27, y + 0.1, 0]));
    g.add(parteLuz(luzCaja(ancho * 0.9, 0.025, 0.06, "#ff5fc8", 2.0), m, [0, y + (alto - 0.3) / 3 - 0.06, 0]));
  }
  planta.dispose();
  return g;
}

/** Domo completo, sin fusionar (la colonia lo fusiona por material con el resto). */
export function crearDomoVidrio(m: MaterialesColonia, o: OpcionesDomo): THREE.Group {
  const g = grupo("Colony_GlassDome");
  const r = o.radio;
  // Vidrio: media esfera de 16 × 5 caras (las mismas del marco).
  const vidrio = new THREE.SphereGeometry(r * 0.985, MARCO.meridianos, MARCO.paralelos, 0, Math.PI * 2, 0, Math.PI / 2);
  const cv = new THREE.Color(VIDRIOS[o.vidrio]);
  const v = new THREE.Mesh(pintar(vidrio, cv), m.vidrio);
  v.name = "Dome_Glass";
  v.castShadow = false;
  v.renderOrder = 2;
  g.add(v);
  // Marco blanco en cuadrícula.
  const barras: THREE.BufferGeometry[] = [];
  for (let i = 0; i < MARCO.meridianos; i++) for (let k = 0; k < MARCO.paralelos; k++) barras.push(barra(punto(r, i, k), punto(r, i, k + 1), MARCO.grueso));
  for (let k = 1; k < MARCO.paralelos; k++) for (let i = 0; i < MARCO.meridianos; i++) barras.push(barra(punto(r, i, k), punto(r, i + 1, k), MARCO.grueso));
  for (const b of barras) g.add(parteMarco(tonear(b, "blanco"), m, [0, 0, 0]));
  g.add(parteMarco(tonear(new THREE.CylinderGeometry(r * 1.03, r * 1.05, 0.32, 16, 1, true), "blanco"), m, [0, 0.16, 0]));
  g.add(parteMarco(tonear(new THREE.CylinderGeometry(0.5, 0.5, 0.12, 10), "blanco"), m, [0, r, 0]));
  // Esclusa: caja blanca al frente con marco de puerta verde, barra de luz y franja de peligro.
  const ex = Math.min(1.7, r * 0.55);
  const esclusa = grupo(
    "Dome_Airlock",
    parteMarco(caja(ex, ex * 0.95, ex, "blanco"), m, [0, (ex * 0.95) / 2, 0]),
    parteKit(caja(ex * 0.62, ex * 0.72, 0.06, "verde"), m, [0, ex * 0.36, ex / 2 + 0.01]),
    parteKit(caja(ex * 0.48, ex * 0.64, 0.05, "oscuro"), m, [0, ex * 0.33, ex / 2 + 0.03]),
    parteLuz(luzCaja(ex * 0.5, 0.06, 0.05, "verde", 1.9), m, [0, ex * 0.76, ex / 2 + 0.04]),
  );
  const franja = franjaPeligro(m, ex * 0.9, 0.02, 0.14, 6);
  franja.position.set(0, 0.03, ex / 2 + 0.3);
  esclusa.add(franja);
  esclusa.position.z = r * 0.92;
  g.add(esclusa);
  if (r > 3) {
    for (const s of [-1, 1]) {
      const p = crearPosteLuz(m, "verde", 1.0);
      p.position.set(s * (ex / 2 + 0.4), 0, r * 0.92 + ex / 2 + 0.5);
      g.add(p);
    }
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
