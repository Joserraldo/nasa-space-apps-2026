import { describe, expect, it } from "vitest";
import { SourceCardSchema } from "@solar-shield/contracts";
import en from "../i18n/en.json";
import es from "../i18n/es.json";
import { FUENTES_APROBADAS, fuenteAprobada, type IdFuenteAprobada } from "../src/fuentes";

describe("fuentes aprobadas fuera de la lista", () => {
  const ids = Object.keys(FUENTES_APROBADAS) as IdFuenteAprobada[];

  it.each(ids)("%s cumple el contrato SourceCard, es de NASA y tiene nombre en en/es", (id) => {
    const f = SourceCardSchema.parse(fuenteAprobada(id));
    expect(new URL(f.url).hostname).toMatch(/(^|\.)nasa\.gov$/);
    expect(f.estadoDato).toBe("curado");
    expect((en as Record<string, string>)[f.nombreKey]).toBeTruthy();
    expect((es as Record<string, string>)[f.nombreKey]).toBeTruthy();
  });

  it("devuelve una copia (nadie cambia la fuente compartida)", () => {
    const a = fuenteAprobada("insight");
    a.url = "https://example.com";
    expect(fuenteAprobada("insight").url).toContain("jpl.nasa.gov");
  });

  it("las fuentes de las misiones nuevas (#152) existen con url https de NASA y nombre en en/es", () => {
    const nuevas: IdFuenteAprobada[] = ["nssdcMoon", "hieloLuna", "orionRefugio", "orionPaneles", "casqueteMarte", "spiritInclinacion", "phoenix"];
    for (const id of nuevas) {
      const f = SourceCardSchema.parse(fuenteAprobada(id));
      expect(f.url.startsWith("https://")).toBe(true);
      expect(f.nombreKey.startsWith("fuente.")).toBe(true);
      expect(f.dueno).toBeTruthy();
      expect(f.consultadoEl).toBe("2026-11-14");
    }
  });

  it("no hay dos fuentes con la misma clave de nombre ni el mismo idFuente", () => {
    const todas = ids.map((id) => FUENTES_APROBADAS[id]);
    expect(new Set(todas.map((f) => f.nombreKey)).size).toBe(todas.length);
    expect(new Set(todas.map((f) => f.idFuente)).size).toBe(todas.length);
  });
});
