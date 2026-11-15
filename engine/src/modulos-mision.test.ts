import { describe, expect, it } from "vitest";
import { MODULOS } from "@solar-shield/design";
import { MISION_JEZERO, type Mision } from "@solar-shield/missions";
import { aplicarAccion, costoDe } from "./acciones.js";
import { partidaDeMision } from "./dorada.js";

const OTRA: Mision = { ...MISION_JEZERO, modulos: { panel_solar: { energia: 3 } } };
const colocar = { tipo: "colocar_modulo", modulo: "panel_solar" } as const;

describe("módulos por misión (#152)", () => {
  it("sin el campo usa MODULOS de design", () => {
    expect(costoDe(colocar).retrasado).toEqual(MODULOS.panel_solar);
    expect(costoDe(colocar, MISION_JEZERO).retrasado).toEqual(MODULOS.panel_solar);
  });
  it("con el campo sobrescribe solo ese módulo", () => {
    expect(costoDe(colocar, OTRA).retrasado).toEqual({ energia: 3 });
    expect(costoDe({ tipo: "colocar_modulo", modulo: "escudo" }, OTRA).retrasado).toEqual(MODULOS.escudo);
  });
  it("el efecto encolado usa el valor de la misión", () => {
    const s = aplicarAccion(partidaDeMision(OTRA, "s"), colocar, OTRA);
    expect(s.efectosPendientes.find((e) => e.recurso === "energia")?.delta).toBe(3);
  });
});
