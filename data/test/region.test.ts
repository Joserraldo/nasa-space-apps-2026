import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LATITUD_NOCHE_POLAR, regionPoloNorte, solMaxVerano } from "../src/region";

const read = (p: string) => JSON.parse(readFileSync(join(__dirname, "..", p), "utf-8"));

describe("polo norte (plan B, sin mapa)", () => {
  it("la luz sale de la inclinación verificada: 90 − 82 + 25,19 ≈ 33,2°", () => {
    expect(solMaxVerano(82)).toBeCloseTo(33.19, 2);
    expect(solMaxVerano(18.4)).toBe(90); // Jezero: el Sol puede pasar por encima
    expect(LATITUD_NOCHE_POLAR).toBeCloseTo(64.81, 2);
  });

  it("no inventa sitios ni puntajes de terreno y tiene textos es/en", () => {
    const r = regionPoloNorte();
    expect(r.tieneMapa).toBe(false);
    expect(r.hayNochePolar).toBe(true);
    expect(r).not.toHaveProperty("sitios");
    const es = read("i18n/es.json");
    const en = read("i18n/en.json");
    for (const k of [r.nombreKey, r.descripcionKey, r.fuente.nombreKey, r.fuente.derivadoKey]) {
      expect(es[k], k).toBeTruthy();
      expect(en[k], k).toBeTruthy();
    }
  });

  it("el texto para niños usa la misma cifra que el cálculo", () => {
    const r = regionPoloNorte();
    expect(read("i18n/es.json")[r.descripcionKey]).toContain(String(Math.round(r.solMaxVeranoGrados)));
  });
});
