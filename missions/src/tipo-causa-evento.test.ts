import { describe, expect, it } from "vitest";
import { MISION_JEZERO, type Mision } from "./jezero.js";

describe("Mision: causa del evento de mala suerte", () => {
  it("acepta otra causa distinta de la tormenta de polvo", () => {
    const m: Mision = {
      ...MISION_JEZERO,
      eventoPolvo: { ...MISION_JEZERO.eventoPolvo, descripcionKey: "mala_suerte.micrometeorito" },
    };
    expect(m.eventoPolvo.descripcionKey).toBe("mala_suerte.micrometeorito");
  });
  it("Jezero conserva la tormenta de polvo", () => {
    expect(MISION_JEZERO.eventoPolvo.descripcionKey).toBe("mala_suerte.tormenta_polvo");
  });
});
