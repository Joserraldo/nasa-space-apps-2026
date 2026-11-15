import { describe, expect, it } from "vitest";
import { MISION_JEZERO, type EventoPolvo, type Mision } from "./jezero.js";

/**
 * El evento de polvo de Jezero, ya estrechado: `Mision.eventoPolvo` es opcional porque una misión
 * sin panel dañado no debe inventarlo. Aserción real en vez de `!` o un cast.
 */
function polvoDeJezero(): EventoPolvo {
  const eventoPolvo = MISION_JEZERO.eventoPolvo;
  if (eventoPolvo === undefined) throw new Error("Jezero debe traer eventoPolvo");
  return eventoPolvo;
}

describe("Mision: causa del evento de mala suerte", () => {
  it("acepta otra causa distinta de la tormenta de polvo", () => {
    const eventoPolvo: EventoPolvo = { ...polvoDeJezero(), descripcionKey: "mala_suerte.micrometeorito" };
    const m: Mision = { ...MISION_JEZERO, eventoPolvo };
    expect(m.eventoPolvo).toBe(eventoPolvo);
    expect(m.eventoPolvo?.descripcionKey).toBe("mala_suerte.micrometeorito");
  });
  it("Jezero conserva la tormenta de polvo", () => {
    expect(polvoDeJezero().descripcionKey).toBe("mala_suerte.tormenta_polvo");
  });
});
