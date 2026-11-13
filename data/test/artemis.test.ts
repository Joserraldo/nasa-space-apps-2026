import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resumir } from "../scripts/artemis";
import { artemis } from "../src";

const read = (p: string) => JSON.parse(readFileSync(join(__dirname, "..", p), "utf-8"));

describe("Artemis I (HERA vía RadLab)", () => {
  it("el resumen es coherente: pico, veces y diario", () => {
    expect(artemis.unidad).toBe("µGy/h");
    expect(artemis.vecesPicoSobreCrucero).toBe(Math.round(artemis.pico.valor / artemis.medianaCrucero));
    expect(Math.max(...artemis.diario.map((d) => d.maximo))).toBe(artemis.pico.valor);
    expect(artemis.pico.hora.startsWith(artemis.diario[0].dia)).toBe(true); // el pico es el primer día
  });

  it("resumir() aplica las reglas (mediana sin primer día ni dos últimos)", () => {
    const d: [string, string, number][] = [
      ["2022-01-01T00:00:00", "x", 100], ["2022-01-02T00:00:00", "x", 2], ["2022-01-03T00:00:00", "x", 4],
      ["2022-01-04T00:00:00", "x", 9], ["2022-01-05T00:00:00", "x", 9],
    ];
    const r = resumir(d, "2026-11-13");
    expect(r.medianaCrucero).toBe(3);
    expect(r.vecesPicoSobreCrucero).toBe(33);
  });

  it("el texto para niños usa la misma cifra y existe en es/en", () => {
    const es = read("i18n/es.json");
    const en = read("i18n/en.json");
    expect(es["datos.artemis.texto"]).toContain(String(artemis.vecesPicoSobreCrucero));
    expect(en["datos.artemis.texto"]).toContain(String(artemis.vecesPicoSobreCrucero));
    expect(es["datos.artemis.titulo"]).toBeTruthy();
  });
});
