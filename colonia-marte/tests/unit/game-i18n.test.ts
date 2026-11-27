import { describe, expect, it } from "vitest";
import en from "../../data/story/i18n/en.json";
import es from "../../data/story/i18n/es.json";
import { existe, idiomaDe, textosDeComponentes, traducir } from "../../src/game/i18n";
import { DEFAULT_SETTINGS } from "../../src/ui/state/settings";

const marcas = (texto: string) => (texto.match(/\{[a-zA-Z]+\}/g) ?? []).sort();

describe("textos del juego", () => {
  it("inglés y español tienen las mismas claves, sin vacíos y con las mismas variables", () => {
    expect(Object.keys(es).sort()).toEqual(Object.keys(en).sort());
    for (const [clave, texto] of Object.entries(en)) {
      const traducido = (es as Record<string, string>)[clave]!;
      expect(texto.trim(), clave).not.toBe("");
      expect(traducido.trim(), clave).not.toBe("");
      expect(marcas(traducido), clave).toEqual(marcas(texto));
    }
  });

  it("traduce textos de misiones, diseño, agentes y datos", () => {
    for (const clave of ["mision.viaje.nombre", "mision.jezero.nombre", "causa.consumo", "agentes.nombre.doctora", "fuente.donki"])
      for (const idioma of ["en", "es"] as const) expect(existe(clave, idioma), `${idioma} ${clave}`).toBe(true);
  });

  it("reemplaza variables, también las que son otra clave", () => {
    expect(traducir("es", "componente.dialogo.habla", { name: "Tess" })).toBe("Tess está hablando");
    expect(traducir("es", "componente.ajustes.volumen", { labelKey: "componente.ajustes.musica", label: "Música" })).toBe("Volumen de Música");
  });

  it("una clave desconocida se devuelve tal cual", () => {
    expect(traducir("es", "no.existe")).toBe("no.existe");
  });

  it("entrega todos los textos fijos de los componentes", () => {
    expect(textosDeComponentes("es")["componente.pausa.opciones"]).toBe("Opciones");
    expect(Object.keys(textosDeComponentes("en")).length).toBeGreaterThan(50);
  });

  it("inglés es el idioma por defecto", () => {
    expect(idiomaDe(DEFAULT_SETTINGS)).toBe("en");
    expect(idiomaDe({ ...DEFAULT_SETTINGS, language: "es" })).toBe("es");
  });
});
