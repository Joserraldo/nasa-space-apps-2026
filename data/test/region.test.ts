import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { GRAVEDAD_LUNA_MS2, GRAVEDAD_MARTE_MS2, LATITUD_NOCHE_POLAR, regionPoloNorte, solMaxVerano } from "../src/region";

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

describe("gravedad [V] NASA NSSDC (#141)", () => {
  it("Marte 3,73 m/s² (0,380 de la Tierra) y Luna 1,62 m/s², iguales a fuentes.md", () => {
    expect(GRAVEDAD_MARTE_MS2).toBe(3.73);
    expect(GRAVEDAD_LUNA_MS2).toBe(1.62);
    const fuentes = readFileSync(join(__dirname, "..", "..", "docs", "science", "fuentes.md"), "utf-8");
    expect(fuentes).toContain("gravedad superficial 3,73 m/s²");
    expect(fuentes).toContain("Luna 1,62 m/s²");
    expect(GRAVEDAD_MARTE_MS2 / 9.80665).toBeCloseTo(0.38, 2);
  });
});
