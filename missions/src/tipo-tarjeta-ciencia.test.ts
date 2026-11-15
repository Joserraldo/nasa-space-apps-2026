import { describe, expect, it } from "vitest";
import { MISION_JEZERO, type TarjetaCiencia } from "./jezero.js";

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
    for (const t of MISION_JEZERO.tarjetasCiencia) expect(t.fuentesKeys).toBeUndefined();
  });
});
