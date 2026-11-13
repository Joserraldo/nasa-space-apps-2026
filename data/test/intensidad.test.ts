import { describe, expect, it } from "vitest";
import { flujoGoes, intensidadCme, intensidadFulguracion, intensidadKp, redondear } from "../src/intensidad";

describe("escala de intensidad del equipo", () => {
  it("GOES: clase → flujo", () => {
    expect(flujoGoes("X8.7")).toBeCloseTo(8.7e-4);
    expect(flujoGoes("M1.9")).toBeCloseTo(1.9e-5);
    expect(() => flujoGoes("Z1")).toThrow();
  });
  it("FLR: C1 = 0, M1 ≈ 0.33, X1 ≈ 0.67, X10+ = 1", () => {
    expect(redondear(intensidadFulguracion("C1.0"))).toBe(0);
    expect(redondear(intensidadFulguracion("M1.0"))).toBe(0.33);
    expect(redondear(intensidadFulguracion("X1.0"))).toBe(0.67);
    expect(intensidadFulguracion("X20")).toBe(1);
    expect(intensidadFulguracion("B5.0")).toBe(0);
  });
  it("CME y Kp", () => {
    expect(intensidadCme(300)).toBe(0);
    expect(intensidadCme(2500)).toBe(1);
    expect(redondear(intensidadCme(870))).toBe(0.26);
    expect(intensidadKp(9)).toBe(1);
  });
});
