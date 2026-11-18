/**
 * Panel solar original (Etapa D3), por la silueta del Solar Panel de Quaternius (`HOJA-quaternius.jpg`, 16_solar_panel)
 * y la corrección 1 de `etapa-D.md`: celdas azul oscuro en cuadrícula con separación (se ve el marco entre ellas),
 * marco de aluminio, soporte inclinado a la vista y acento amarillo de energía en el borde bajo. Las celdas usan el
 * material `Panel_Cells`: el polvo de Jezero se pinta y se limpia cambiando ese material (`pintarPolvo`).
 * Frente (borde bajo) hacia +z, base en y = 0, medidas en metros. Unos 220 triángulos. [E]
 */
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { PALETA } from "./polvoKit";

/** Medidas del panel: ancho, largo inclinado, inclinación, alto del borde bajo, cuadrícula de celdas. [E] */
export const PANEL = { ancho: 1.6, largo: 2.2, inclinacion: (30 * Math.PI) / 180, bajo: 0.55, columnas: 3, filas: 6, junta: 0.045 } as const;

function pintada(g: THREE.BufferGeometry, c: THREE.Color, m?: THREE.Matrix4): THREE.BufferGeometry {
  const x = g.index ? g.toNonIndexed() : g;
  if (x !== g) g.dispose();
  for (const k of Object.keys(x.attributes)) if (k !== "position" && k !== "normal") x.deleteAttribute(k);
  if (m) x.applyMatrix4(m);
  const n = x.getAttribute("position").count;
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) a.set([c.r, c.g, c.b], i * 3);
  x.setAttribute("color", new THREE.BufferAttribute(a, 3));
  return x;
}

const en = (x: number, y: number, z: number, rx = 0) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, 0, 0)), new THREE.Vector3(1, 1, 1));

/** Marco, patas y acento: una geometría con color por vértice. */
export function geometriaCuerpoPanel(): THREE.BufferGeometry {
  const { ancho, largo, inclinacion, bajo } = PANEL;
  const alto = bajo + Math.sin(inclinacion) * largo;
  const cz = (Math.cos(inclinacion) * largo) / 2;
  // Bastidor blanco cálido, patas grises (soportes), borde amarillo de energía; las celdas son el grafito/azul oscuro.
  const aluminio = new THREE.Color(PALETA.blanco), oscuro = new THREE.Color(PALETA.gris);
  const amarillo = new THREE.Color(PALETA.amarillo);
  const p: THREE.BufferGeometry[] = [];
  const centro = (bajo + alto) / 2;
  // Bastidor inclinado (la cara de arriba queda bajo las celdas) y borde bajo amarillo.
  p.push(pintada(new THREE.BoxGeometry(ancho, 0.05, largo), aluminio, en(0, centro, 0, inclinacion)));
  p.push(pintada(new THREE.BoxGeometry(ancho + 0.04, 0.07, 0.07), amarillo, en(0, bajo, cz)));
  // Patas: dos cortas adelante, dos largas atrás, travesaño y riostras.
  for (const s of [-1, 1]) {
    const x = s * (ancho / 2 - 0.12);
    p.push(pintada(new THREE.BoxGeometry(0.06, bajo, 0.06), oscuro, en(x, bajo / 2, cz - 0.1)));
    p.push(pintada(new THREE.BoxGeometry(0.06, alto - 0.05, 0.06), oscuro, en(x, (alto - 0.05) / 2, -cz + 0.12)));
    p.push(pintada(new THREE.BoxGeometry(0.04, 0.04, Math.cos(inclinacion) * largo - 0.2), oscuro, en(x, 0.25, 0)));
  }
  p.push(pintada(new THREE.BoxGeometry(ancho - 0.2, 0.05, 0.05), oscuro, en(0, alto * 0.55, -cz + 0.12)));
  const g = mergeGeometries(p, false)!;
  for (const x of p) x.dispose();
  return g;
}

/** Celdas: `columnas × filas` placas separadas por la junta, apoyadas sobre el bastidor. */
export function geometriaCeldas(): THREE.BufferGeometry {
  const { ancho, largo, inclinacion, bajo, columnas, filas, junta } = PANEL;
  const alto = bajo + Math.sin(inclinacion) * largo;
  const w = (ancho - 0.08 - junta * (columnas - 1)) / columnas;
  const d = (largo - 0.08 - junta * (filas - 1)) / filas;
  const marco = en(0, (bajo + alto) / 2, 0, inclinacion);
  const p: THREE.BufferGeometry[] = [];
  for (let i = 0; i < columnas; i++)
    for (let k = 0; k < filas; k++) {
      const x = -ancho / 2 + 0.04 + w / 2 + i * (w + junta);
      const z = -largo / 2 + 0.04 + d / 2 + k * (d + junta);
      const local = new THREE.Matrix4().multiplyMatrices(marco, new THREE.Matrix4().makeTranslation(x, 0.032, z));
      const g = new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2);
      p.push(pintada(g, new THREE.Color(1, 1, 1), local));
    }
  const g = mergeGeometries(p, false)!;
  for (const x of p) x.dispose();
  return g;
}

/** Material del bastidor (mate, color por vértice). */
export function materialCuerpoPanel(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ name: "Panel_Frame", vertexColors: true, roughness: 0.75, metalness: 0.15 });
}

/** Material de las celdas (lo pinta `pintarPolvo`). */
export function materialCeldasPanel(nombre = "Panel_Cells"): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ name: nombre, color: new THREE.Color(PALETA.grafito), roughness: 0.42, metalness: 0 });
}

/** Un panel con sus dos mallas (bastidor y celdas). */
export function crearPanelSolar(cuerpo: THREE.Material, celdas: THREE.Material, geos?: { cuerpo: THREE.BufferGeometry; celdas: THREE.BufferGeometry }): THREE.Group {
  const g = new THREE.Group();
  g.name = "Solar_Panel";
  const a = new THREE.Mesh(geos?.cuerpo ?? geometriaCuerpoPanel(), cuerpo);
  a.name = "Panel_Body";
  const b = new THREE.Mesh(geos?.celdas ?? geometriaCeldas(), celdas);
  b.name = "Panel_CellsMesh";
  for (const x of [a, b]) x.castShadow = x.receiveShadow = true;
  g.add(a, b);
  return g;
}
