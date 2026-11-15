import { describe, expect, it } from "vitest";
import { partidaDorada } from "@solar-shield/engine";
import { LUGARES } from "../escena/mundo.js";
import { traducir } from "../i18n.js";
import { guiaBase, objetivoBase, pasoEnBase, usoDelLugar } from "./objetivo.js";

describe("objetivo y uso de lugares en la base (E6, mundo/01)", () => {
  const estado = partidaDorada();

  it("todo lugar tiene un uso y su etiqueta existe en inglés y en español", () => {
    for (const l of LUGARES) {
      const uso = usoDelLugar(l.id, estado);
      const vars = "labelVars" in uso ? uso.labelVars : undefined;
      for (const idioma of ["en", "es"] as const) {
        const texto = traducir(idioma, uso.labelKey, vars);
        expect(texto).not.toContain("ui.");
        expect(texto).not.toContain("agentes.");
      }
    }
  });

  it("panel solar y escudo abren su plan; las expertas atienden en su lugar", () => {
    expect(usoDelLugar("panel_solar", estado)).toMatchObject({ tipo: "plan", accion: { tipo: "salida_exterior" } });
    expect(usoDelLugar("escudo", estado)).toMatchObject({ tipo: "plan", accion: { tipo: "subir_escudo" } });
    expect(usoDelLugar("sensor", estado)).toMatchObject({ tipo: "experto", experto: "meteorologa" });
    expect(usoDelLugar("habitat", estado)).toMatchObject({ tipo: "experto", experto: "doctora" });
    expect(usoDelLugar("antena", estado).tipo).toBe("iris");
  });

  it("con Iris dañada, el taller propone repararla", () => {
    expect(usoDelLugar("taller", { ...estado, iaBase: "danada" })).toMatchObject({ tipo: "plan", accion: { tipo: "reparar", equipo: "ia_base" } });
  });

  it("el objetivo del HUD sale de la guía de Iris y se traduce completo", () => {
    expect(pasoEnBase(estado)).toBe(5);
    const o = objetivoBase(guiaBase(estado));
    for (const idioma of ["en", "es"] as const) {
      const texto = traducir(idioma, o.clave, o.vars);
      expect(texto).not.toMatch(/ui\.|agentes\.|\{/);
    }
    expect(objetivoBase(null).clave).toBe("ui.mapa.sinObjetivo");
  });
});
