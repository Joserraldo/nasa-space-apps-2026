import { describe, expect, it } from "vitest";
import en from "../i18n/en.json";
import es from "../i18n/es.json";

/** Público de 7 a 12 años: cada frase corta y cada línea de diálogo cabe en un globo. */
const MAX_PALABRAS_FRASE = 20;
const MAX_PALABRAS_LINEA = 28;

describe("frases cortas para niños", () => {
  for (const [idioma, textos] of [["en", en], ["es", es]] as const) {
    it(`${idioma}: ninguna frase pasa de ${MAX_PALABRAS_FRASE} palabras ni una línea de ${MAX_PALABRAS_LINEA}`, () => {
      const largas: string[] = [];
      for (const [clave, texto] of Object.entries(textos)) {
        if (texto.split(/\s+/).length > MAX_PALABRAS_LINEA) largas.push(clave);
        for (const frase of texto.split(/(?<=[.!?:])\s+/)) if (frase.split(/\s+/).length > MAX_PALABRAS_FRASE) largas.push(`${clave}: ${frase}`);
      }
      expect(largas).toEqual([]);
    });
  }
});
