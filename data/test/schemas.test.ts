import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { SpaceWeatherEvent } from "../src/spaceWeatherEvent";
import { DonkiCME, DonkiFLR, DonkiGST, DonkiSEP } from "../src/donki";

const root = join(__dirname, "..");
const read = (p: string) => JSON.parse(readFileSync(join(root, p), "utf-8"));

describe("mocks SpaceWeatherEvent", () => {
  const index: string[] = read("mock/index.json");

  it("el índice lista todos los mocks", () => {
    const files = readdirSync(join(root, "mock")).filter((f) => f !== "index.json");
    expect(files.map((f) => f.replace(/\.json$/, "")).sort()).toEqual([...index].sort());
  });

  it.each(index)("%s cumple el contrato y es mock", (id) => {
    const ev = SpaceWeatherEvent.parse(read(`mock/${id}.json`));
    expect(ev.id).toBe(id);
    expect(ev.dataStatus).toBe("mock");
  });

  it("rechaza un curado con IDs MOCK-", () => {
    const ev = { ...read(`mock/${index[0]}.json`), dataStatus: "curated" };
    expect(SpaceWeatherEvent.safeParse(ev).success).toBe(false);
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
    const data = z.array(schema).min(1).parse(read(file));
    expect(data.length).toBeGreaterThan(0);
  });

  it("ninguna muestra contiene una clave de API", () => {
    for (const [file] of cases) {
      expect(readFileSync(join(root, file), "utf-8")).not.toMatch(/api_key/i);
    }
  });
});
