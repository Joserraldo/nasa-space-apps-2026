import { describe, expect, it } from "vitest";
import en from "../../i18n/en.json";
import es from "../../i18n/es.json";
import type { Interactivo } from "../escena/frontera.js";
import { esTeclaUsar, verboDe } from "./MundoBase.js";

/** E2 (PLAN-JUGABILIDAD): una sola vía para `[E]`; el verbo depende de lo que hay al alcance. */
describe("verboDe: un verbo por tipo de interactivo", () => {
  it("actor → Talk", () => {
    expect(verboDe({ tipo: "actor", actor: "ingeniera" }, "base")).toBe("hablar");
    expect(verboDe({ tipo: "actor", actor: "iris" }, "tormenta")).toBe("hablar");
  });
  it("puerta → Enter al entrar y Exit al salir", () => {
    expect(verboDe({ tipo: "puerta", sala: "taller", entrar: true }, "base")).toBe("entrar");
    expect(verboDe({ tipo: "puerta", sala: "taller", entrar: false }, "base")).toBe("salir");
  });
  it("anclaje de módulo en E5 → Build; fuera de E5 o sin módulo → Use", () => {
    expect(verboDe({ tipo: "lugar", lugar: "panel_solar" }, "modulos")).toBe("construir");
    expect(verboDe({ tipo: "lugar", lugar: "panel_solar" }, "base")).toBe("usar");
    expect(verboDe({ tipo: "lugar", lugar: "taller" }, "modulos")).toBe("usar");
  });
  it("cada verbo tiene texto en inglés y en español", () => {
    const casos: Interactivo[] = [
      { tipo: "actor", actor: "doctora" },
      { tipo: "puerta", sala: "habitat", entrar: true },
      { tipo: "puerta", sala: "habitat", entrar: false },
      { tipo: "lugar", lugar: "escudo" },
      { tipo: "lugar", lugar: "taller" },
    ];
    for (const i of casos) {
      const clave = `ui.interaccion.${verboDe(i, "modulos")}`;
      expect((en as Record<string, string>)[clave], clave).toBeTruthy();
      expect((es as Record<string, string>)[clave], clave).toBeTruthy();
    }
  });
});

describe("esTeclaUsar: la tecla de la única vía", () => {
  const tecla = (p: Partial<Parameters<typeof esTeclaUsar>[0]>) =>
    esTeclaUsar({ key: "e", code: "KeyE", repeat: false, ctrlKey: false, metaKey: false, altKey: false, target: null, ...p });
  it("E y su código cuentan", () => {
    expect(tecla({})).toBe(true);
    expect(tecla({ key: "E" })).toBe(true);
    expect(tecla({ key: "é", code: "KeyE" })).toBe(true);
  });
  it("repetida o con modificadores no cuenta (una pulsación, un uso)", () => {
    expect(tecla({ repeat: true })).toBe(false);
    expect(tecla({ ctrlKey: true })).toBe(false);
    expect(tecla({ metaKey: true })).toBe(false);
    expect(tecla({ altKey: true })).toBe(false);
  });
  it("otras teclas no cuentan", () => {
    expect(tecla({ key: "v", code: "KeyV" })).toBe(false);
  });
});
