import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { RETRASO_MARTE_MIN, minutosLuz } from "../src/comunicaciones";

const read = (p: string) => JSON.parse(readFileSync(join(__dirname, "..", p), "utf-8"));

describe("retraso de comunicaciones Marte–Tierra", () => {
  it("de unos 3 a unos 22 minutos en un sentido (no 4–24)", () => {
    expect(RETRASO_MARTE_MIN.min).toBe(3);
    expect(RETRASO_MARTE_MIN.max).toBe(22.3);
    expect(minutosLuz(299_792.458 * 60)).toBe(1);
  });

  it("el texto para niños usa las mismas cifras redondeadas, en en y es", () => {
    for (const lang of ["en", "es"]) {
      const t: string = read(`i18n/${lang}.json`)["datos.comunicaciones.retraso"];
      expect(t).toContain(String(Math.round(RETRASO_MARTE_MIN.min)));
      expect(t).toContain(String(Math.round(RETRASO_MARTE_MIN.max)));
    }
  });
});
