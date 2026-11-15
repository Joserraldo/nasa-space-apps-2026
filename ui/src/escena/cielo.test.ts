import { describe, expect, it } from "vitest";
import { LUZ, PALETA_CIELO, colorCielo, hexALineal } from "./cielo";

describe("cielo de Marte", () => {
  it("mantiene cielo diurno salmón y caramelo, sin variante por tormenta solar", () => {
    expect(Object.keys(PALETA_CIELO)).toEqual(["dia", "atardecer"]);
    expect(PALETA_CIELO.dia.cenit).toBe("#D9A38A");
    expect(PALETA_CIELO.dia.horizonte).toBe("#F2CDB0");
    expect(colorCielo(0)).toEqual(hexALineal(PALETA_CIELO.dia.horizonte));
    expect(colorCielo(1)).toEqual(hexALineal(PALETA_CIELO.dia.cenit));
  });

  it("respeta el límite de sombras y el tone mapping previsto", () => {
    expect(LUZ.tamanoSombra.alta).toBeLessThanOrEqual(1024);
    expect(LUZ.tamanoSombra.baja).toBeLessThanOrEqual(512);
    expect(LUZ.toneMapping).toBe("ACESFilmic");
  });
});
