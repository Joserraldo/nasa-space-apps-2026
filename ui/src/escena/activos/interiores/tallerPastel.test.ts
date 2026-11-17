import { describe, expect, it } from "vitest";
import { PUERTAS_TALLER_PASTEL, puntosTallerPastel, ZONAS_TALLER_PASTEL } from "./tallerPastel";

const [caja] = ZONAS_TALLER_PASTEL;
const dentro = (x: number, z: number) => x >= caja.xMin && x <= caja.xMax && z >= caja.zMin && z <= caja.zMax;

describe("tallerPastel", () => {
  it("opens to the corridor and lets the kid in a few steps from the door, clear of everything", () => {
    const [puerta] = PUERTAS_TALLER_PASTEL;
    expect(puerta.destino).toBe("pasillo");
    const { x, z } = puerta.entrada;
    expect(dentro(x, z)).toBe(true);
    expect(Math.hypot(puerta.x - x, puerta.z - z)).toBeGreaterThan(0.9);
    for (const s of puntosTallerPastel()) expect(Math.hypot(s.x - x, s.z - z)).toBeGreaterThan(s.radio + 0.3);
  });

  it("keeps the furniture and the columns inside the room", () => {
    for (const s of puntosTallerPastel()) expect(dentro(s.x, s.z)).toBe(true);
  });
});
