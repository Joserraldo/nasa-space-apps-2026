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
});
