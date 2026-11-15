import { describe, expect, it } from "vitest";
import { MISION_JEZERO, type TarjetaCiencia } from "./jezero.js";

// Vista ancha del tipo: `satisfies` deja la constante estrecha y los campos opcionales no se infieren.
const tarjetas: TarjetaCiencia[] = MISION_JEZERO.tarjetasCiencia;

describe("TarjetaCiencia: varias fuentes", () => {
  it("acepta fuentesKeys además de fuenteKey", () => {
    const t: TarjetaCiencia = {
      id: "prueba",
      textoKey: "mision.jezero.ciencia.tormenta",
      fuenteKey: "fuente.radlab",
      fuentesKeys: ["fuente.nasa.bitflip", "fuente.dosis.marte"],
    };
    expect(t.fuentesKeys).toHaveLength(2);
  });
  it("las tarjetas de Jezero no cambian", () => {
    for (const t of tarjetas) expect(t.fuentesKeys).toBeUndefined();
  });
});

describe("TarjetaCiencia: aviso de dato curado", () => {
  it("acepta curado y etiquetaKey", () => {
    const t: TarjetaCiencia = {
      id: "prueba",
      textoKey: "mision.jezero.ciencia.tormenta",
      fuenteKey: "fuente.radlab",
      curado: true,
      etiquetaKey: "ui.dato_curado",
    };
    expect(t.curado).toBe(true);
  });
  it("las tarjetas de Jezero no llevan el aviso", () => {
    for (const t of tarjetas) expect(t.curado).toBeUndefined();
  });
});
