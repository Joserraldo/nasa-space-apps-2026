import { describe, expect, it } from "vitest";
import { MISION_JEZERO, type Mision } from "./jezero.js";

describe("Mision: sin carpeta de terreno", () => {
  it("acepta una misión sin terrenoId (la nave del outpost)", () => {
    const { terrenoId: _quitado, ...resto } = MISION_JEZERO;
    const m: Mision = resto;
    expect(m.terrenoId).toBeUndefined();
  });
  it("Jezero conserva su terreno", () => {
    expect(MISION_JEZERO.terrenoId).toBe("jezero");
  });
});
