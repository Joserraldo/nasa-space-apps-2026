import { describe, expect, it } from "vitest";
import { alturaSuelo, resolver, type Terreno } from "./fisica.js";
import { BANCO, TERRENO } from "./mundo.js";
import { planearRuta } from "./navegacion.js";

const RADIO = 0.38;

function libre(a: { x: number; z: number }, b: { x: number; z: number }, terreno: Terreno): boolean {
  const distancia = Math.hypot(b.x - a.x, b.z - a.z);
  const pasos = Math.ceil(distancia / 0.1);
  let altura = alturaSuelo(a.x, a.z, terreno);
  for (let i = 0; i <= pasos; i++) {
    const t = i / pasos;
    const p = { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t };
    const resuelto = { ...p };
    resolver(resuelto, RADIO, terreno);
    if (Math.hypot(p.x - resuelto.x, p.z - resuelto.z) > 1e-7) return false;
    const suelo = alturaSuelo(p.x, p.z, terreno);
    if (suelo - altura > 0.3 + 1e-7) return false;
    altura = suelo;
  }
  return true;
}

function expectRutaContinua(ruta: { x: number; z: number }[], inicio: { x: number; z: number }, destino: { x: number; z: number }): void {
  expect(ruta.length).toBeGreaterThan(0);
  expect(ruta.at(-1)).toEqual(destino);
  let desde = inicio;
  for (const hasta of ruta) {
    expect(libre(desde, hasta, TERRENO)).toBe(true);
    desde = hasta;
  }
}

describe("planearRuta", () => {
  it("rodea la mesa en el trayecto inicial al hábitat con segmentos transitables", () => {
    const inicio = { x: 0, z: 3.4 };
    const destino = { x: 0, z: -4.3 };
    const ruta = planearRuta(inicio, destino, TERRENO, RADIO);
    expectRutaContinua(ruta, inicio, destino);
    expect(ruta.length).toBeGreaterThan(1);
  });

  it("alcanza plataforma subiendo por el borde bajo de la rampa", () => {
    const inicio = { x: -4.6, z: 4.4 };
    const destino = { x: -7.7, z: 6.5 };
    const ruta = planearRuta(inicio, destino, TERRENO, RADIO);
    expectRutaContinua(ruta, inicio, destino);
    expect(alturaSuelo(destino.x, destino.z, TERRENO)).toBe(BANCO.alto);
  });
});
