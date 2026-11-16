/// <reference types="node" />
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  ALTURA_SALTO_TIERRA, FUENTE_GRAVEDAD, GRAVEDAD_MARTE, GRAVEDAD_TIERRA, PASO_FISICO, RELACION_MARTE_TIERRA,
  VEL_DESPEGUE, alturaSalto, pasoCaida, tiempoEnElAire,
} from "./fisica";
import { ANTICIPACION, crearMovimiento } from "./movimientoBase";

/** Simula un tiro vertical con el paso fijo del juego: altura máxima y tiempo hasta volver al suelo. */
function simular(v: number, g: number): { altura: number; tiempo: number } {
  let c = { y: 0, vy: v, apoyado: false };
  let altura = 0;
  let pasos = 0;
  while (!c.apoyado && pasos < 10_000) {
    c = pasoCaida(c, 0, g, PASO_FISICO);
    altura = Math.max(altura, c.y);
    pasos++;
  }
  return { altura, tiempo: pasos * PASO_FISICO };
}

describe("salto con la gravedad de Marte (A5)", () => {
  it("la gravedad es la de la ficha NASA NSSDC y la terrestre sale de la relación 0,380", () => {
    expect(GRAVEDAD_MARTE).toBe(3.73);
    expect(RELACION_MARTE_TIERRA).toBe(0.38);
    expect(FUENTE_GRAVEDAD.url).toBe("https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html");
    expect(GRAVEDAD_TIERRA).toBeCloseTo(9.816, 3);
  });

  it("la velocidad de despegue es una suposición declarada: la de un salto de 0,30 m en la Tierra", () => {
    expect(ALTURA_SALTO_TIERRA).toBe(0.3);
    expect(VEL_DESPEGUE).toBeCloseTo(Math.sqrt(2 * GRAVEDAD_TIERRA * 0.3), 12);
    expect(alturaSalto(VEL_DESPEGUE, GRAVEDAD_TIERRA)).toBeCloseTo(0.3, 12);
  });

  for (const [mundo, g] of [["Marte", GRAVEDAD_MARTE], ["Tierra", GRAVEDAD_TIERRA]] as const) {
    it(`en ${mundo} la altura y el tiempo simulados coinciden con h = v²/2g y t = 2v/g`, () => {
      const { altura, tiempo } = simular(VEL_DESPEGUE, g);
      // Cinemática exacta: el máximo se pierde solo entre dos pasos (≤ g·(dt/2)²/2) y el aterrizaje cae en el paso siguiente.
      expect(Math.abs(altura - alturaSalto(VEL_DESPEGUE, g))).toBeLessThanOrEqual((g * (PASO_FISICO / 2) ** 2) / 2 + 1e-9);
      expect(tiempo).toBeGreaterThanOrEqual(tiempoEnElAire(VEL_DESPEGUE, g) - 1e-9);
      expect(tiempo - tiempoEnElAire(VEL_DESPEGUE, g)).toBeLessThanOrEqual(PASO_FISICO + 1e-9);
    });
  }

  it("con la misma v, en Marte sube 1/0,380 ≈ 2,6 veces más alto y dura 2,6 veces más", () => {
    const marte = simular(VEL_DESPEGUE, GRAVEDAD_MARTE);
    const tierra = simular(VEL_DESPEGUE, GRAVEDAD_TIERRA);
    expect(alturaSalto(VEL_DESPEGUE, GRAVEDAD_MARTE) / alturaSalto(VEL_DESPEGUE, GRAVEDAD_TIERRA)).toBeCloseTo(1 / 0.38, 10);
    expect(tiempoEnElAire(VEL_DESPEGUE, GRAVEDAD_MARTE) / tiempoEnElAire(VEL_DESPEGUE, GRAVEDAD_TIERRA)).toBeCloseTo(1 / 0.38, 10);
    expect(marte.altura / tierra.altura).toBeCloseTo(1 / 0.38, 2);
    expect(marte.tiempo / tierra.tiempo).toBeCloseTo(1 / 0.38, 1);
    // Números que verá el niño: unos 0,79 m y 1,30 s en Marte, frente a 0,30 m y 0,49 s en la Tierra.
    expect(alturaSalto(VEL_DESPEGUE, GRAVEDAD_MARTE)).toBeCloseTo(0.789, 3);
    expect(tiempoEnElAire(VEL_DESPEGUE, GRAVEDAD_MARTE)).toBeCloseTo(1.301, 3);
  });
});

describe("saltar en el mundo (A5)", () => {
  const VACIO = { circulos: [], cajas: [] };

  it("se agacha, despega, alcanza h = v²/2g y vuelve al suelo en t = 2v/g", () => {
    const m = crearMovimiento(VACIO);
    expect(m.saltar()).toBe(true);
    let t = 0, despegue = -1, aterrizaje = -1, maximo = 0;
    const fases = new Set<string>();
    while (t < 3 && aterrizaje < 0) {
      m.avanzar(PASO_FISICO);
      t += PASO_FISICO;
      fases.add(m.salto.fase);
      if (despegue < 0 && !m.jugador.apoyado) despegue = t - PASO_FISICO;
      if (despegue >= 0 && m.jugador.apoyado) aterrizaje = t;
      maximo = Math.max(maximo, m.jugador.y);
    }
    expect(despegue).toBeCloseTo(ANTICIPACION, 1);
    expect(Math.abs(maximo - alturaSalto(VEL_DESPEGUE, GRAVEDAD_MARTE))).toBeLessThan(0.002);
    expect(Math.abs(aterrizaje - despegue - tiempoEnElAire(VEL_DESPEGUE, GRAVEDAD_MARTE))).toBeLessThanOrEqual(2 * PASO_FISICO);
    expect([...fases]).toEqual(expect.arrayContaining(["anticipa", "aire", "aterriza"]));
    expect(m.jugador.y).toBe(0);
  });

  it("no salta en el aire, ni dos veces durante la anticipación, ni bloqueado", () => {
    const m = crearMovimiento(VACIO);
    expect(m.saltar()).toBe(true);
    expect(m.saltar()).toBe(false);
    for (let i = 0; i < 20; i++) m.avanzar(PASO_FISICO);
    expect(m.jugador.apoyado).toBe(false);
    expect(m.saltar()).toBe(false);
    const b = crearMovimiento(VACIO);
    b.fijarBloqueado(true);
    expect(b.saltar()).toBe(false);
  });

  it("caminando, el salto conserva el avance; con movimiento reducido despega sin anticipación", () => {
    const m = crearMovimiento(VACIO);
    m.fijarEntrada(0, -1);
    for (let i = 0; i < 30; i++) m.avanzar(PASO_FISICO);
    const z0 = m.jugador.z;
    m.saltar();
    for (let i = 0; i < 30; i++) m.avanzar(PASO_FISICO);
    expect(m.jugador.y).toBeGreaterThan(0);
    expect(m.jugador.z).toBeLessThan(z0 - 1);
    const r = crearMovimiento(VACIO);
    r.saltar();
    r.avanzar(PASO_FISICO, true);
    expect(r.jugador.apoyado).toBe(false);
  });

  it("saltar nunca da ni quita recursos: la física y el movimiento no conocen el estado del juego", () => {
    let total = 0;
    for (const archivo of ["./fisica.ts", "./movimientoBase.ts"]) {
      const fuente = readFileSync(new URL(archivo, import.meta.url), "utf-8");
      const importa = [...fuente.matchAll(/^import .* from "([^"]+)";$/gm)].map((m) => m[1]!);
      total += importa.length;
      // Solo three y módulos de la escena: nada del motor, los contratos, la misión ni el estado del juego.
      for (const ruta of importa) expect(ruta, archivo).toMatch(/^(three|\.\/[a-zA-Zá-ú]+)$/);
    }
    expect(total).toBeGreaterThan(0); // la búsqueda de imports funciona (movimientoBase tiene varios)
  });
});
