import { describe, expect, it } from "vitest";
import { pideGirar } from "./orientacion";

const vertical = { ancho: 390, alto: 844 };
const horizontal = { ancho: 844, alto: 390 };
const escritorio = { ancho: 1024, alto: 683 };

describe("aviso para girar el teléfono (ESCENAS §2.7)", () => {
  it("lo pide en vertical en satélite, módulos, base y tormenta", () => {
    for (const fase of ["satelite", "modulos", "base", "tormenta"] as const) {
      expect(pideGirar(fase, vertical)).toBe(true);
    }
  });

  it("no lo pide en horizontal ni en escritorio", () => {
    for (const fase of ["satelite", "modulos", "base", "tormenta"] as const) {
      expect(pideGirar(fase, horizontal)).toBe(false);
      expect(pideGirar(fase, escritorio)).toBe(false);
    }
  });

  it("portada, sitio y final se juegan también en vertical", () => {
    for (const fase of ["inicio", "sitio", "final"] as const) {
      expect(pideGirar(fase, vertical)).toBe(false);
    }
  });

  it("una pantalla cuadrada no pide girar", () => {
    expect(pideGirar("base", { ancho: 600, alto: 600 })).toBe(false);
  });
});
