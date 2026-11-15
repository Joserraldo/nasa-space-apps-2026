import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { fondoTranquilo, fuenteCrater, LunaSchema } from "../src/luna";
import { medirAlrededor } from "../src/medicion";
import { medicionLuna, luna, tormentasCuradas } from "../src/index";

const read = (p: string) => JSON.parse(readFileSync(join(__dirname, "..", p), "utf-8"));

describe("regla de medición compartida (RAD y CRaTER)", () => {
  it("con los datos crudos de RAD reproduce la medición curada de la ruta dorada", () => {
    const rad = read("raw/2024-05/RAD.json").data as [string, string, number][];
    const t = tormentasCuradas.find((x) => x.id === "2024-05-20-marte")!;
    const m = medirAlrededor(rad.map(([ts, , v]) => [ts, v] as const), t.fases[0]!.hora)!;
    expect(m.factor).toBe(t.medicionMarte!.factor);
    expect(m.pico).toBe(t.medicionMarte!.pico);
  });
  it("sin muestras suficientes no inventa nada", () => {
    expect(medirAlrededor([["2024-05-01T00:00:00", 5]], "2024-05-02T00:00Z")).toBeUndefined();
  });
  it("fondoTranquilo detecta una tormenta anterior dentro del fondo", () => {
    expect(fondoTranquilo([5, 5.1, 5.2, 5.6, 11])).toBe(false);
    expect(fondoTranquilo([5, 5.1, 5.2, 5.6, 6])).toBe(true);
  });
});

describe("tormentas vistas desde la Luna (CRaTER)", () => {
  it("el JSON valida y cada medición es de una tormenta curada", () => {
    const l = LunaSchema.parse(read("ciencia/luna.json"));
    const ids = new Set(tormentasCuradas.map((t) => t.id));
    for (const m of l.mediciones) expect(ids.has(m.id)).toBe(true);
  });
  it("Gannon (10 may 2024) es la tormenta lunar con fondo limpio y gran aumento", () => {
    const m = medicionLuna("2024-05-10-gannon")!;
    expect(m.fondoTranquilo).toBe(true);
    expect(m.factor).toBeGreaterThan(100);
  });
  it("octubre de 2024 no tiene datos de CRaTER y no se inventan", () => {
    expect(luna.sinDatos).toContain("2024-10-10-g4");
    expect(medicionLuna("2024-10-10-g4")).toBeUndefined();
  });
  it("la tarjeta de fuente atribuye a NASA LRO/CRaTER y tiene texto en en y es", () => {
    const f = fuenteCrater(medicionLuna("2024-05-10-gannon")!, luna.consultadoEl);
    expect(f.dueno).toContain("CRaTER");
    for (const lang of ["en", "es"]) {
      const d = read(`i18n/${lang}.json`);
      expect(d[f.nombreKey]).toBeTruthy();
      expect(d["datos.luna.orbita"]).toBeTruthy();
    }
  });
});
