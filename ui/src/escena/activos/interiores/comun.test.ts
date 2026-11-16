import { describe, expect, it } from "vitest";
import { caja } from "../piezasComunes";
import { tinte } from "./comun";

describe("piezas comunes de las salas (D5)", () => {
  it("tinte no pisa geometrías distintas con el mismo nombre y colores", () => {
    const a = tinte("ranura", caja(0.5, 0.04, 0.01), "traje-marfil", "regolito-medio", 0.4);
    const b = tinte("ranura", caja(0.35, 0.03, 0.01), "traje-marfil", "regolito-medio", 0.4);
    expect(a).not.toBe(b);
    a.computeBoundingBox();
    b.computeBoundingBox();
    expect(a.boundingBox!.max.x).toBeCloseTo(0.25);
    expect(b.boundingBox!.max.x).toBeCloseTo(0.175);
  });

  it("la misma forma con los mismos colores reutiliza la geometría de la caché", () => {
    const g = caja(0.45, 0.02, 0.3);
    expect(tinte("luz", g, "marfil", "ambar", 0.35)).toBe(tinte("luz", g, "marfil", "ambar", 0.35));
  });
});
