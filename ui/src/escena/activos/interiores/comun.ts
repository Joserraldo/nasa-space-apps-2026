/**
 * Piezas comunes de las salas interiores (D5): tonos por color de vértice y la caja de una sala en corte
 * (piso, pared del fondo con el vano de la puerta, laterales y un tramo de pasillo detrás del vano).
 * El taller todavía tiene su copia; se unifica cuando se fusione #381.
 */
import * as THREE from "three";
import { colorToken, geometriaBase, type Materiales } from "../../materiales";
import { caja, chaflan, crearPuerta, grupo, parte } from "../piezasComunes";

export type Token = Parameters<typeof colorToken>[0];

/** Copia de `g` pintada con color de vértice (`a` hacia `b` en `t`), para el slot `Rock`: sin materiales nuevos. */
export function tinte(clave: string, g: THREE.BufferGeometry, a: Token, b: Token, t: number): THREE.BufferGeometry {
  return geometriaBase(`int-tinte-${clave}-${a}-${b}-${t}`, () => {
    const c = g.clone();
    const color = colorToken(a).lerp(colorToken(b), t);
    const n = c.getAttribute("position").count;
    const col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) col.set([color.r, color.g, color.b], i * 3);
    c.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return c;
  });
}

/** Medidas de una sala en corte y la x del centro de la puerta del fondo. */
export interface MedidasSala { ancho: number; fondo: number; alto: number; puertaX: number }

/** Ancho y alto del vano de `crearPuerta` (kit). */
export const VANO_PUERTA = { ancho: 1.3, alto: 2.05 } as const;

/**
 * Caja de la sala: piso lila claro, paredes marfil lila (fondo partido por el vano), zócalo teal, marco
 * de puerta del kit y un tramo de pasillo detrás del vano con luces guía. Ejes: x a lo ancho, z hacia la
 * cámara, piso en y = 0; el frente queda abierto.
 */
export function salaEnCorte(m: Materiales, s: MedidasSala, nombre: string): THREE.Group {
  const g = 0.25;
  const { ancho: w, fondo: f, alto: h, puertaX: px } = s;
  const pared = tinte("pared", caja(1, 1, 1), "traje-marfil", "lila", 0.45);
  const raiz = grupo(nombre);
  const muro = (sx: number, sy: number, sz: number, x: number, y: number, z: number, n: string) => {
    const p = parte(m, "Rock", pared, [x, y, z], n);
    p.scale.set(sx, sy, sz);
    raiz.add(p);
  };
  const zf = -f / 2 - g / 2, izq = px - VANO_PUERTA.ancho / 2, der = px + VANO_PUERTA.ancho / 2;
  raiz.add(parte(m, "Rock", tinte(`piso-${w}-${f}`, chaflan(w, f, 0.12, 0.8), "lila", "traje-marfil", 0.35), [0, -0.06, 0], `${nombre}_Floor`).rotateX(-Math.PI / 2));
  muro(izq + w / 2 + g, h, g, (-w / 2 - g + izq) / 2, h / 2, zf, `${nombre}_BackWall`);
  muro(w / 2 + g - der, h, g, (der + w / 2 + g) / 2, h / 2, zf, `${nombre}_BackWall`);
  muro(VANO_PUERTA.ancho, h - VANO_PUERTA.alto, g, px, (h + VANO_PUERTA.alto) / 2, zf, `${nombre}_BackWall`);
  muro(g, h, f, -w / 2 - g / 2, h / 2, 0, `${nombre}_LeftWall`);
  muro(g, h, f, w / 2 + g / 2, h / 2, 0, `${nombre}_RightWall`);
  raiz.add(
    parte(m, "SuitBase", caja(w + 2 * g + 0.1, 0.18, g + 0.1), [0, h + 0.09, zf], `${nombre}_BackTrim`),
    parte(m, "Accent", caja(w, 0.06, 0.03), [0, 0.18, -f / 2 + 0.02], `${nombre}_Skirting`),
  );
  const puerta = crearPuerta(m);
  puerta.position.set(px, 0, -f / 2 - 0.05);
  raiz.add(puerta);
  // Tramo de pasillo detrás del vano.
  const zc = -f / 2 - g - 1.2;
  raiz.add(parte(m, "Rock", tinte("piso-corredor", caja(1.6, 0.1, 2.4), "indigo-botas", "roca-basalto", 0.35), [px, -0.05, zc], `${nombre}_CorridorFloor`));
  muro(0.15, 2.4, 2.4, px - 0.85, 1.2, zc, `${nombre}_CorridorWall`);
  muro(0.15, 2.4, 2.4, px + 0.85, 1.2, zc, `${nombre}_CorridorWall`);
  muro(1.85, 2.4, 0.15, px, 1.2, zc - 1.2, `${nombre}_CorridorEnd`);
  muro(1.85, 0.15, 2.4, px, 2.4, zc, `${nombre}_CorridorCeiling`);
  const luz = tinte("luz-piso", caja(0.45, 0.02, 0.3), "marfil", "ambar", 0.35);
  for (const dz of [-0.8, 0, 0.8]) raiz.add(parte(m, "Rock", luz, [px, 0.01, zc + dz], `${nombre}_CorridorLight`));
  return raiz;
}
