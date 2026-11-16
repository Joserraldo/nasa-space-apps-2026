import { describe, expect, it } from "vitest";
import { CARAS_IRIS } from "./personajes/iris";
import { EXPRESIONES } from "./personajes/cabeza";
import {
  CARAS_RETRATO_IRIS,
  CARAS_RETRATO_PERSONA,
  caraIrisModelo,
  interactivoDeLugar,
  rutaRetrato,
} from "./frontera";

describe("frontera de la escena (PLAN-JUGABILIDAD §3)", () => {
  it("el lugar al alcance pasa a Interactivo de tipo lugar, y nada al alcance a null", () => {
    expect(interactivoDeLugar("taller")).toEqual({ tipo: "lugar", lugar: "taller" });
    expect(interactivoDeLugar(null)).toBeNull();
  });

  it("la cara de la guía de Iris existe en el modelo 3D", () => {
    expect(caraIrisModelo("normal")).toBe("atenta");
    expect(caraIrisModelo("error")).toBe("error");
    for (const c of ["normal", "error"] as const) expect(CARAS_IRIS).toContain(caraIrisModelo(c));
  });

  it("las caras de retrato existen en los modelos y no incluyen cuadros de habla", () => {
    for (const c of CARAS_RETRATO_PERSONA) expect(EXPRESIONES).toContain(c);
    for (const c of CARAS_RETRATO_IRIS) expect(CARAS_IRIS).toContain(c);
    expect(CARAS_RETRATO_PERSONA.some((c) => c.startsWith("habla"))).toBe(false);
  });

  it("la ruta del retrato es relativa a ui/public y sin barra inicial", () => {
    expect(rutaRetrato("ingeniera", "feliz")).toBe("retratos/ingeniera-feliz.png");
    expect(rutaRetrato("iris", "error")).toBe("retratos/iris-error.png");
  });
});
