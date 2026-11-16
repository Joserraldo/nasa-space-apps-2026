import { describe, expect, it } from "vitest";
import type { Dialogo } from "@solar-shield/agents";
import { actorDeExperto, duracionGlobo, formaDeDialogo } from "./DialogoExperto.js";

const d = (extra: Partial<Record<string, unknown>> = {}, lineas = 1): Dialogo =>
  ({ experto: "meteorologa", prioridad: "normal", lineas: Array.from({ length: lineas }, () => ({ clave: "ui.continuar" })), ...extra } as unknown as Dialogo);

describe("conversación corta o larga (E5)", () => {
  it("hasta 2 líneas, sin acción, fuente ni alerta: globo", () => {
    expect(formaDeDialogo(d({}, 1))).toBe("globo");
    expect(formaDeDialogo(d({}, 2))).toBe("globo");
  });

  it("más de 2 líneas, una acción, una fuente o una alerta: franja con retrato", () => {
    expect(formaDeDialogo(d({}, 3))).toBe("franja");
    expect(formaDeDialogo(d({ accion: { tipo: "esperar" } }))).toBe("franja");
    expect(formaDeDialogo(d({ fuente: { id: "x" } }))).toBe("franja");
    expect(formaDeDialogo(d({ prioridad: "alerta" }))).toBe("franja");
  });

  it("solo quien está montado en la escena tiene globo: Iris (el rover) y la Ingeniera", () => {
    expect(actorDeExperto("ia_base")).toBe("iris");
    expect(actorDeExperto("ingeniera")).toBe("ingeniera");
    // Hasta A6 (#382) la Doctora y la Meteoróloga no están en el mundo: su línea va a la franja.
    for (const e of ["doctora", "meteorologa", "control_mision", "matematico"]) expect(actorDeExperto(e)).toBeNull();
  });

  it("el globo dura lo que tarda en leerse, entre 4 y 9 s", () => {
    expect(duracionGlobo("Hi")).toBe(4000);
    expect(duracionGlobo("x".repeat(50))).toBe(6000);
    expect(duracionGlobo("x".repeat(500))).toBe(9000);
  });
});
