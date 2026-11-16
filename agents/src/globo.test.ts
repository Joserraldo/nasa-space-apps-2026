import { describe, expect, it } from "vitest";
import { bienvenidaGlobo, lineasGlobo } from "./globo.js";
import en from "../i18n/en.json";
import es from "../i18n/es.json";

describe("globos bilingües de Iris", () => {
  it("cubre los ocho pasos y cuatro niveles con una o dos líneas traducidas", () => {
    for (const nivel of ["tutorial", "pistas", "danada", "offline"] as const) {
      for (let paso = 1; paso <= 8; paso++) {
        const lineas = lineasGlobo(paso, nivel);
        expect(lineas.length).toBeGreaterThan(0);
        expect(lineas.length).toBeLessThanOrEqual(2);
        for (const l of [...lineas, ...bienvenidaGlobo(nivel)]) {
          for (const dic of [en, es]) {
            const texto = (dic as Record<string, string>)[l.clave];
            expect(texto).toBeTruthy();
            expect(texto).not.toMatch(/[{}\d]/);
          }
        }
      }
    }
  });
  it("offline no da pistas ni cambia con el paso", () => {
    expect(lineasGlobo(1, "offline")).toEqual(lineasGlobo(8, "offline"));
    expect(bienvenidaGlobo("offline")).toEqual(lineasGlobo(1, "offline"));
  });
  it("un paso inválido nunca inventa una instrucción", () => {
    for (const paso of [0, 9, 1.5, NaN]) expect(lineasGlobo(paso, "tutorial")).toEqual([]);
  });
});
