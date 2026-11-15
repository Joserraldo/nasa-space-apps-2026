import { describe, expect, it } from "vitest";
import { alturaSuelo, moverPersonaje, resolver, subpasos, type Cuerpo, type Terreno } from "./fisica.js";
import { INICIO_JUGADOR, LUGARES, TERRENO } from "./mundo.js";
import { planearRuta } from "./navegacion.js";

const RADIO = 0.38;
const suelo: Terreno = { limite: 20, circulos: [], capsulas: [], rampas: [], plataformas: [] };
const cuerpo = (x = 0, z = 0): Cuerpo => ({ x, z, y: 0, vy: 0, apoyado: true });

describe("caminar y contactos", () => {
  it("resuelve el centro exacto de círculos y cápsulas, con desempate reproducible", () => {
    for (const t of [
      { ...suelo, circulos: [{ x: 0, z: 0, r: 1 }] },
      { ...suelo, capsulas: [{ x0: -2, x1: 2, z: 0, r: 1 }] },
    ]) {
      const p = { x: 0, z: 0 };
      resolver(p, RADIO, t);
      // Una segunda resolución debe dejar el punto estable y fuera del sólido.
      const otra = { ...p };
      resolver(otra, RADIO, t);
      expect(otra).toEqual(p);
      expect(Math.hypot(p.x, p.z)).toBeGreaterThan(1);
    }
  });

  it("conserva el cuerpo completo dentro del límite del terreno", () => {
    const p = { x: 30, z: 0 };
    resolver(p, RADIO, suelo);
    expect(p.x + RADIO).toBeCloseTo(suelo.limite);
  });

  it("no atraviesa un círculo aunque el destino final esté libre", () => {
    const t = { ...suelo, circulos: [{ x: 0, z: 0, r: 1 }] };
    const fin = moverPersonaje(cuerpo(-4), 8, 0, 1, t, RADIO);
    expect(fin.x).toBeLessThanOrEqual(-1 - RADIO + 1e-8);
  });

  it("no atraviesa el hábitat ni colisionadores dinámicos", () => {
    const t = { ...suelo, capsulas: [{ x0: -3, x1: 3, z: 0, r: 2 }] };
    expect(moverPersonaje(cuerpo(0, 5), 0, -10, 1, t, RADIO).z).toBeGreaterThanOrEqual(2 + RADIO - 1e-8);
    expect(moverPersonaje(cuerpo(-4), 8, 0, 1, suelo, RADIO, [{ x: 0, z: 0, r: 1 }]).x).toBeLessThan(0);
  });

  it("rechaza tiempos inválidos y limita los subpasos al volver a la pestaña", () => {
    const c = cuerpo();
    for (const dt of [-1, 0, NaN, Infinity]) expect(moverPersonaje(c, 1, 0, dt, suelo, RADIO)).toBe(c);
    expect(subpasos(0, 100).pasos).toBe(5);
  });

  it.each(LUGARES)("alcanza $id caminando por la ruta, sin modificar la misión", destino => {
    let actual = cuerpo(INICIO_JUGADOR.x, INICIO_JUGADOR.z);
    const ruta = planearRuta(actual, destino, TERRENO, RADIO);
    expect(ruta.length).toBeGreaterThan(0);
    for (const p of ruta) {
      let intentos = 0;
      while (Math.hypot(p.x - actual.x, p.z - actual.z) > 0.02 && intentos++ < 5000) {
        const dx = p.x - actual.x, dz = p.z - actual.z;
        const d = Math.hypot(dx, dz);
        const v = Math.min(3, d * 60);
        actual = moverPersonaje(actual, dx / d * v, dz / d * v, 1 / 60, TERRENO, RADIO);
      }
      expect(intentos).toBeLessThan(5000);
      expect(actual.y).toBeCloseTo(alturaSuelo(actual.x, actual.z, TERRENO));
    }
    expect(Math.hypot(destino.x - actual.x, destino.z - actual.z)).toBeLessThan(0.02);
  });
});
