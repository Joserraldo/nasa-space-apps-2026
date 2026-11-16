import { describe, expect, it } from "vitest";
import type { Dialogo } from "@solar-shield/agents";
import { EXPERTAS_BASE } from "../escena/tripulacionBase.js";
import { ACTORES_CON_GLOBO, actorDeExperto, duracionGlobo, formaDeDialogo, LETRAS_GLOBO } from "./DialogoExperto.js";

const d = (extra: Partial<Record<string, unknown>> = {}, lineas = 1): Dialogo =>
  ({ experto: "meteorologa", prioridad: "normal", lineas: Array.from({ length: lineas }, () => ({ clave: "ui.continuar" })), ...extra } as unknown as Dialogo);

describe("conversación corta o larga (E5)", () => {
  it("hasta 2 líneas, sin acción, fuente ni alerta: globo", () => {
    expect(formaDeDialogo(d({}, 1))).toBe("globo");
    expect(formaDeDialogo(d({}, 2))).toBe("globo");
  });

  it("un texto que no entra cómodo en el globo va a la franja aunque sean 2 líneas", () => {
    expect(formaDeDialogo(d({}, 2), "x".repeat(LETRAS_GLOBO))).toBe("globo");
    expect(formaDeDialogo(d({}, 2), "x".repeat(LETRAS_GLOBO + 1))).toBe("franja");
  });

  it("más de 2 líneas, una acción, una fuente o una alerta: franja con retrato", () => {
    expect(formaDeDialogo(d({}, 3))).toBe("franja");
    expect(formaDeDialogo(d({ accion: { tipo: "esperar" } }))).toBe("franja");
    expect(formaDeDialogo(d({ fuente: { id: "x" } }))).toBe("franja");
    expect(formaDeDialogo(d({ prioridad: "alerta" }))).toBe("franja");
  });

  it("solo quien está montado en la escena tiene globo: Iris (el rover) y las tres expertas", () => {
    expect(actorDeExperto("ia_base")).toBe("iris");
    for (const e of ["ingeniera", "doctora", "meteorologa"]) expect(actorDeExperto(e)).toBe(e);
    for (const e of ["control_mision", "matematico"]) expect(actorDeExperto(e)).toBeNull();
  });

  it("la lista coincide con las expertas que monta la escena (A6)", () => {
    expect([...ACTORES_CON_GLOBO].sort()).toEqual(["iris", ...EXPERTAS_BASE].sort());
  });

  it("el globo dura lo que tarda en leerse, entre 4 y 9 s", () => {
    expect(duracionGlobo("Hi")).toBe(4000);
    expect(duracionGlobo("x".repeat(50))).toBe(6000);
    expect(duracionGlobo("x".repeat(500))).toBe(9000);
  });
});
