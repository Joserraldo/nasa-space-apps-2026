import { describe, expect, it } from "vitest";
import { PUERTAS_SALA_PASTEL, puntosSalaPastel, ZONAS_SALA_PASTEL, type SalaPastel } from "./salaPastel";

const [caja] = ZONAS_SALA_PASTEL;
const dentro = (x: number, z: number) => x >= caja.xMin && x <= caja.xMax && z >= caja.zMin && z <= caja.zMax;
const SALAS: readonly SalaPastel[] = ["taller", "habitat"];

describe("salaPastel", () => {
  it.each(SALAS)("%s opens to the corridor and lets the kid in a few steps from the door, clear of everything", (sala) => {
    const [puerta] = PUERTAS_SALA_PASTEL;
    expect(puerta.destino).toBe("pasillo");
    const { x, z } = puerta.entrada;
    expect(dentro(x, z)).toBe(true);
    expect(Math.hypot(puerta.x - x, puerta.z - z)).toBeGreaterThan(0.9);
    for (const s of puntosSalaPastel(sala)) expect(Math.hypot(s.x - x, s.z - z)).toBeGreaterThan(s.radio + 0.3);
  });

  it.each(SALAS)("%s keeps furniture and columns apart, leaving room to pass between them", (sala) => {
    const puntos = puntosSalaPastel(sala);
    for (const [i, a] of puntos.entries()) {
      for (const b of puntos.slice(i + 1)) expect(Math.hypot(a.x - b.x, a.z - b.z)).toBeGreaterThan(a.radio + b.radio - 0.2);
    }
  });
});
