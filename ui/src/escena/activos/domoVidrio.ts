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
import { caja, crearPosteLuz, franjaPeligro, grupo, luzCaja, parteKit, parteLuz, parteMarco, pintar, tonear, type MaterialesColonia } from "./coloniaPiezas";
import { PALETA } from "./polvoKit";

export interface OpcionesDomo {
  radio: number;
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
  // Esclusa: caja blanca con zócalo gris, puerta en panel grafito sin marco (sin acento) y luz cálida encima.
  const ex = Math.min(1.7, r * 0.55);
  const puerta = { ancho: 0.9, alto: 1.9 } as const;
  const esclusa = grupo(
    "Dome_Airlock",
    parteMarco(caja(ex, ex * 0.95, ex, PALETA.blanco), m, [0, (ex * 0.95) / 2, 0]),
    parteMarco(caja(ex + 0.06, 0.16, ex + 0.06, PALETA.gris), m, [0, 0.08, 0]),
    parteKit(caja(Math.min(puerta.ancho, ex * 0.6), Math.min(puerta.alto, ex * 0.8), 0.05, PALETA.grafito), m, [0, Math.min(puerta.alto, ex * 0.8) / 2 + 0.02, ex / 2 + 0.02]),
    parteLuz(luzCaja(ex * 0.45, 0.05, 0.05, PALETA.luzCalida, 1.6), m, [0, Math.min(puerta.alto, ex * 0.8) + 0.12, ex / 2 + 0.04]),
  );
  const franja = franjaPeligro(m, ex * 0.9, 0.02, 0.14, 6, [PALETA.amarillo, PALETA.grafito]);
  franja.position.set(0, 0.03, ex / 2 + 0.3);
  esclusa.add(franja);
  esclusa.position.z = r * 0.92;
  g.add(esclusa);
  if (r > 3) {
    for (const s of [-1, 1]) {
      const p = crearPosteLuz(m, PALETA.luzCalida, 1.0, [PALETA.amarillo, PALETA.grafito], PALETA.gris);
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
