import { describe, expect, it } from "vitest";
import { fechaHoraUtcValida, HoraUtc } from "../src/tormenta";

describe("horas UTC de DONKI: forma y calendario", () => {
  it("acepta horas reales, con y sin segundos, y días sueltos", () => {
    for (const h of ["2024-05-10T15:00Z", "2024-10-09T01:25:30Z", "2024-02-29T00:00Z", "2024-12-31T23:59Z"]) {
      expect(HoraUtc.safeParse(h).success, h).toBe(true);
    }
    expect(fechaHoraUtcValida("2024-05-20")).toBe(true);
  });

  it("rechaza fechas y horas que no existen aunque tengan la forma", () => {
    for (const h of ["2024-13-45T99:99Z", "2023-02-29T00:00Z", "2024-04-31T12:00Z", "2024-05-10T24:00Z", "2024-05-10T12:60Z"]) {
      expect(HoraUtc.safeParse(h).success, h).toBe(false);
    }
    expect(fechaHoraUtcValida("2024-02-30")).toBe(false);
  });

  it("sigue rechazando lo que no tiene forma de hora DONKI", () => {
    expect(HoraUtc.safeParse("2024-05-10 15:00").success).toBe(false);
    expect(HoraUtc.safeParse("10/05/2024").success).toBe(false);
  });
});
