import { describe, expect, it } from "vitest";
import { briefingIris, guiaIrisLugar } from "@solar-shield/agents";
import { partidaDorada } from "@solar-shield/engine";
import { traducir } from "../i18n.js";
import { irisGuiaAlObjetivo, pedidoDeGuia } from "./pedidoEscena.js";

const en = (clave: string, vars?: Record<string, string | number>) => traducir("en", clave, vars);
const es = (clave: string, vars?: Record<string, string | number>) => traducir("es", clave, vars);

describe("pedido a la escena desde la guía de Iris (A2)", () => {
  const tutorial = { ...partidaDorada(), iaBase: "tutorial" as const };
  const pistas = { ...partidaDorada(), iaBase: "pistas" as const };

  for (let paso = 1; paso <= 8; paso++) {
    it(`paso ${paso}: objetivo, gesto y globo coinciden con la guía, traducidos entero en los dos idiomas`, () => {
      const guia = guiaIrisLugar(tutorial, paso)!;
      const p = pedidoDeGuia(guia, en);
      expect(p.objetivo).toEqual({ lugar: guia.destino, ruta: true });
      expect(p.iris).toEqual({ gesto: "senalar", cara: "normal" });
      expect(p.globo?.actor).toBe("iris");
      for (const t of [en, es]) expect(pedidoDeGuia(guia, t).globo?.texto).not.toMatch(/[{}]|agentes\.|ui\./);
      // En tutorial Iris rueda delante del niño; en pistas solo mira, sin ruta.
      expect(irisGuiaAlObjetivo(p)).toBe(true);
      const conPistas = pedidoDeGuia(guiaIrisLugar(pistas, paso)!, en);
      expect(conPistas.objetivo?.ruta).toBe(false);
      expect(irisGuiaAlObjetivo(conPistas)).toBe(false);
    });
  }

  it("el paso 4 lleva al taller con la Ingeniera y el globo nombra a los dos", () => {
    const p = pedidoDeGuia(guiaIrisLugar(tutorial, 4)!, en);
    expect(p.objetivo?.lugar).toBe("taller");
    expect(p.globo?.texto).toMatch(/Engineer/);
  });

  it("con la avería revelada Iris pide ayuda con cara de error y guía al taller", () => {
    const p = pedidoDeGuia(guiaIrisLugar(tutorial, 6, { averiaRevelada: true })!, en);
    expect(p.iris).toEqual({ gesto: "pedir_reparacion", cara: "error" });
    expect(p.objetivo?.lugar).toBe("taller");
    expect(irisGuiaAlObjetivo(p)).toBe(true);
  });

  it("el briefing explica sin objetivo y offline no pide nada", () => {
    const b = pedidoDeGuia(briefingIris(), en);
    expect(b.objetivo).toBeNull();
    expect(b.iris).toEqual({ gesto: "explicar", cara: "normal" });
    expect(b.globo?.texto).toMatch(/Welcome/);
    expect(irisGuiaAlObjetivo(b)).toBe(false);
    expect(pedidoDeGuia(null, en)).toEqual({ objetivo: null, iris: null, globo: null });
  });
});
