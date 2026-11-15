import { describe, expect, it } from "vitest";
import ui from "../i18n/es.json";
import agentes from "../../agents/i18n/es.json";
import datos from "../../data/i18n/es.json";

const voseo = /(?<!\p{L})(?:vos|sos|tenés|podés|querés|elegí|tocá|mirá|revisá|consultá|hacé|decidí|preguntá|explorá|conocé|repará|confiá)(?!\p{L})/iu;

describe("español del producto", () => {
  for (const [nombre, diccionario] of Object.entries({ ui, agentes, datos })) {
    it(`${nombre}: conserva español neutro sin voseo`, () => {
      const errores = Object.entries(diccionario).filter(([, texto]) => voseo.test(texto));
      expect(errores.map(([clave]) => clave)).toEqual([]);
    });
  }
});
