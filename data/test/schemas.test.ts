import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { DonkiCME, DonkiFLR, DonkiGST, DonkiSEP } from "../src/donki";
import { aConvenio, eventosMock, SpaceWeatherEventSchema, tormentasMock, TormentaSchema } from "../src";

const root = join(__dirname, "..");
const read = (p: string) => JSON.parse(readFileSync(join(root, p), "utf-8"));

describe("mocks", () => {
  const index: string[] = read("mock/index.json");

  it("el índice lista todos los mocks y todos cargan", () => {
    const files = readdirSync(join(root, "mock")).filter((f) => f !== "index.json");
    expect(files.map((f) => f.replace(/\.json$/, "")).sort()).toEqual([...index].sort());
    expect(tormentasMock.map((t) => t.id).sort()).toEqual([...index].sort());
  });

  it("cada mock se convierte en un SpaceWeatherEvent válido marcado mock", () => {
    for (const ev of eventosMock) {
      expect(SpaceWeatherEventSchema.safeParse(ev).success).toBe(true);
      expect(ev.fuente.estadoDato).toBe("mock");
      expect(ev.fuente.idFuente.startsWith("MOCK-")).toBe(true);
    }
  });

  it("rechaza un curado con IDs MOCK- y un GST fuera de la Tierra", () => {
    const t = read("mock/mock-tormenta-fuerte.json");
    expect(TormentaSchema.safeParse({ ...t, estadoDato: "curado" }).success).toBe(false);
    const gst = structuredClone(t);
    gst.fases[3].observadoEn = "Marte";
    expect(TormentaSchema.safeParse(gst).success).toBe(false);
  });

  it("convierte horas a offsets y elige la CME como tipo principal", () => {
    const ev = aConvenio(TormentaSchema.parse(read("mock/mock-tormenta-fuerte.json")));
    expect(ev.tipo).toBe("CME");
    expect(ev.fases?.map((f) => f.offsetHoras)).toEqual([0, 0.33, 2.67, 35.67]);
    expect(ev.duracionHoras).toBe(35.67);
    expect(ev.intensidad).toBe(1); // Kp 9
  });
});

describe("i18n", () => {
  const es = read("i18n/es.json");
  const en = read("i18n/en.json");
  it("es y en tienen las mismas claves, sin textos vacíos", () => {
    expect(Object.keys(es).sort()).toEqual(Object.keys(en).sort());
    for (const v of [...Object.values(es), ...Object.values(en)]) expect(String(v).trim()).not.toBe("");
  });
  it("toda clave que usan los mocks existe", () => {
    for (const t of tormentasMock)
      for (const k of [t.nombreKey, t.queOcurrioKey, t.fuente.nombreKey]) expect(es[k], k).toBeDefined();
  });
});

describe("muestras reales de DONKI", () => {
  const cases: [string, z.ZodTypeAny][] = [
    ["samples/donki-flr-2024-05.json", DonkiFLR],
    ["samples/donki-cme-2024-05.json", DonkiCME],
    ["samples/donki-gst-2024-05.json", DonkiGST],
    ["samples/donki-sep-2024-05.json", DonkiSEP],
  ];
  it.each(cases)("%s valida", (file, schema) => {
    expect(z.array(schema).min(1).parse(read(file)).length).toBeGreaterThan(0);
  });
  it("ninguna muestra contiene una clave de API", () => {
    for (const [file] of cases) expect(readFileSync(join(root, file), "utf-8")).not.toMatch(/api_key/i);
  });
});
