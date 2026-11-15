import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SourceCardSchema } from "@solar-shield/contracts";
import { ID_RUTA_DORADA, datosUsados, tarjetaTormentaPorEvento, tarjetasCienciaFinal } from "../src";

const read = (p: string) => JSON.parse(readFileSync(join(__dirname, "..", p), "utf-8"));
const en: Record<string, string> = read("i18n/en.json");
const es: Record<string, string> = read("i18n/es.json");
const existe = (k: string) => {
  expect(en[k], `en ${k}`).toBeTruthy();
  expect(es[k], `es ${k}`).toBeTruthy();
};

describe("pantallas para ui", () => {
  it("datosUsados: todas las claves existen en en y es", () => {
    const d = datosUsados();
    existe(d.tituloKey);
    expect(d.lineas.length).toBeGreaterThan(3);
    d.lineas.forEach((l) => existe(l.clave));
    for (const fuente of ["lunaLuz", "lunaSur", "crater", "marteNorte"]) {
      expect(d.lineas.map((l) => l.clave)).toContain(`datos.usados.${fuente}`);
    }
  });

  it("tarjetasCienciaFinal: SourceCard válida, claves existentes, orden estable, CSA con crédito", () => {
    const t = tarjetasCienciaFinal();
    expect(t.length).toBeGreaterThan(2);
    expect(tarjetasCienciaFinal().map((c) => c.id)).toEqual(t.map((c) => c.id));
    for (const c of t) {
      existe(c.tituloKey);
      existe(c.textoKey);
      existe(c.fuente.nombreKey);
      expect(SourceCardSchema.safeParse(c.fuente).success).toBe(true);
      expect(c.fuente.idFuente).toBe(c.id);
      if (c.fuente.nombreKey === "fuente.csa") {
        expect(c.creditoKey).toBe("datos.credito.csa");
        existe(c.creditoKey!);
        expect(en[c.creditoKey!]).toContain("© Canadian Space Agency");
      } else expect(c.creditoKey).toBeUndefined();
    }
    expect(tarjetasCienciaFinal({ max: 2 })).toHaveLength(2);
    expect(tarjetasCienciaFinal({ temas: ["comida"] }).every((c) => ["fuente.osdr", "fuente.csa"].includes(c.fuente.nombreKey))).toBe(true);
  });

  it("tarjetaTormentaPorEvento: la ruta dorada incluye la medición de RAD; id inexistente da null", () => {
    const c = tarjetaTormentaPorEvento(ID_RUTA_DORADA)!;
    expect(c).not.toBeNull();
    const claves = c.lineas.map((l) => l.clave);
    expect(claves).toContain("datos.tarjeta.medicion");
    expect(claves).toContain("datos.medicion.rad");
    c.lineas.forEach((l) => existe(l.clave));
    expect(tarjetaTormentaPorEvento("no-existe")).toBeNull();
  });
});
