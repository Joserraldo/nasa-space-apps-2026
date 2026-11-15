/// <reference types="node" />
/**
 * Nada colocado en la base se monta sobre otra cosa en planta: módulos en sus anclajes, hábitat,
 * decorado con su corredor, consolas, cajas, balizas, rocas de primer plano y rocas grandes.
 * Cada archivo expone las huellas de lo que coloca; aquí solo se cruzan.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { CLARO, MALLA_JEZERO, huellasRocas, rejillaJezero } from "../armado";
import { CAJAS, huellasBase } from "./baseExterior";
import { sobreCamino } from "./caminos";
import { huellasModulos } from "./modulosArmados";
import { PLANTA_KIT, type Huella } from "./piezasComunes";
import { aplanarClaro } from "./terreno";

const archivo = readFileSync(fileURLToPath(new URL("../../../../data/terreno/jezero/elevacion.bin", import.meta.url)));
const rejilla = rejillaJezero(archivo.buffer.slice(archivo.byteOffset, archivo.byteOffset + archivo.byteLength) as ArrayBuffer);
const claro = aplanarClaro(rejilla, MALLA_JEZERO, CLARO.radio, CLARO.borde).rejilla;

/**
 * Pares que van unidos a propósito (prefijos de id). El corredor nace en el tambor de la torre y
 * entra en la cápsula (`exterior/01`); por eso sus huellas se tocan.
 */
const UNIDOS: readonly (readonly [string, string])[] = [
  ["corredor", "decorado:torre"],
  ["corredor", "decorado:capsula"],
];

/** Aire mínimo entre dos cosas que no van unidas: así nada se lee "pegado" desde la cámara. [E] */
const AIRE = 0.25;

type V2 = [number, number];

/** Vértices de una caja en planta (o null si es un círculo). */
function esquinas(h: Huella): V2[] | null {
  if ("r" in h) return null;
  const c = Math.cos(h.giro), s = Math.sin(h.giro);
  // rotation.y: x' = c·x + s·z, z' = −s·x + c·z.
  return ([[-1, -1], [1, -1], [1, 1], [-1, 1]] as const).map(([a, b]) => {
    const x = (a * h.ancho) / 2, z = (b * h.fondo) / 2;
    return [h.x + c * x + s * z, h.z - s * x + c * z];
  });
}

/** Distancia de un punto a una caja (0 dentro). */
function distanciaCaja(h: Extract<Huella, { ancho: number }>, x: number, z: number): number {
  const c = Math.cos(h.giro), s = Math.sin(h.giro);
  const dx = x - h.x, dz = z - h.z;
  const lx = c * dx - s * dz, lz = s * dx + c * dz;
  return Math.hypot(Math.max(0, Math.abs(lx) - h.ancho / 2), Math.max(0, Math.abs(lz) - h.fondo / 2));
}

/** Separación entre dos cajas por ejes separadores (SAT); > 0 si no se tocan. */
function separacionCajas(a: V2[], b: V2[]): number {
  let mejor = -Infinity;
  for (const p of [a, b])
    for (let i = 0; i < 4; i++) {
      const [x0, z0] = p[i]!, [x1, z1] = p[(i + 1) % 4]!;
      const n = Math.hypot(x1 - x0, z1 - z0);
      const eje: V2 = [-(z1 - z0) / n, (x1 - x0) / n];
      const proy = (q: V2[]) => q.map(([x, z]) => x * eje[0] + z * eje[1]);
      const pa = proy(a), pb = proy(b);
      mejor = Math.max(mejor, Math.min(...pb) - Math.max(...pa), Math.min(...pa) - Math.max(...pb));
    }
  return mejor;
}

/** Holgura entre dos huellas (negativa = se pisan). */
function holgura(a: Huella, b: Huella): number {
  if ("r" in a && "r" in b) return Math.hypot(a.x - b.x, a.z - b.z) - a.r - b.r;
  if ("r" in a) return distanciaCaja(b as Extract<Huella, { ancho: number }>, a.x, a.z) - a.r;
  if ("r" in b) return distanciaCaja(a, b.x, b.z) - b.r;
  return separacionCajas(esquinas(a)!, esquinas(b)!);
}

/**
 * Los módulos y el hábitat se arman en los anclajes de `LUGARES` (mundo.ts, de Camilo): entre ellos
 * basta con no pisarse. Todo lo demás lo coloca la escena y además deja `AIRE`.
 */
const enLugares = (id: string) => id.startsWith("modulo:") || id === "habitat";
const aireEntre = (a: string, b: string) => (enLugares(a) && enLugares(b) ? 0 : AIRE);

const unidos = (a: string, b: string) => UNIDOS.some(([p, q]) => (a.startsWith(p) && b.startsWith(q)) || (a.startsWith(q) && b.startsWith(p)));

describe("sin solapes en planta", () => {
  const todas: Huella[] = [...huellasModulos(), ...huellasBase(), ...huellasRocas(claro)];

  it("reúne las huellas de todo lo colocado, con ids únicos", () => {
    const ids = todas.map((h) => h.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const prefijo of ["modulo:", "habitat", "decorado:torre", "corredor", "consola:", "caja:", "baliza:", "roca_primer_plano:", "roca_grande:"])
      expect(ids.some((id) => id.startsWith(prefijo)), prefijo).toBe(true);
  });

  it("ningún par se intersecta ni se pega (menos de AIRE), salvo los unidos a propósito", () => {
    const solapes: string[] = [];
    for (let i = 0; i < todas.length; i++)
      for (let j = i + 1; j < todas.length; j++) {
        const a = todas[i]!, b = todas[j]!;
        if (unidos(a.id, b.id)) continue;
        const d = holgura(a, b);
        if (d < aireEntre(a.id, b.id)) solapes.push(`${a.id} / ${b.id} (${d.toFixed(2)} m)`);
      }
    expect(solapes).toEqual([]);
  });

  it("los pares unidos a propósito de verdad se tocan", () => {
    for (const [p, q] of UNIDOS) {
      const a = todas.find((h) => h.id.startsWith(p))!, b = todas.find((h) => h.id.startsWith(q))!;
      expect(holgura(a, b), `${p} / ${q}`).toBeLessThanOrEqual(0);
    }
  });

  it("las cajas no pisan los caminos", () => {
    const r = Math.hypot(PLANTA_KIT.caja.ancho, PLANTA_KIT.caja.fondo) / 2;
    for (const c of CAJAS) expect(sobreCamino(c.x, c.z, r), `${c.x},${c.z}`).toBe(false);
  });
});
