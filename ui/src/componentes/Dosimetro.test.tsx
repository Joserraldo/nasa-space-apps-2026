import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { IdiomaContext } from "../i18n.js";
import type { DatosDosimetro } from "../juego/dosis.js";
import { Dosimetro } from "./Dosimetro.js";

const html = (datos: DatosDosimetro, idioma: "en" | "es" = "en") => renderToStaticMarkup(
  <IdiomaContext.Provider value={idioma}><Dosimetro datos={datos} /></IdiomaContext.Provider>,
);

const diccionario = (nombre: "en" | "es") => JSON.parse(readFileSync(new URL(`../../i18n/${nombre}.json`, import.meta.url), "utf8")) as Record<string, string>;

describe("dosímetro del HUD", () => {
  it("con límite muestra la dosis y el límite de entrenamiento", () => {
    const h = html({ dosis: 1.46, limite: 4, protegido: false });
    expect(h).toContain("Radiation 1.5");
    expect(h).toContain("training limit 4");
  });

  it("en español usa 'límite de entrenamiento'", () => {
    const h = html({ dosis: 1.46, limite: 4, protegido: false }, "es");
    expect(h).toContain("Radiación 1.5");
    expect(h).toContain("límite de entrenamiento 4");
  });

  it("sin límite no muestra barra, NaN, Infinity ni 'training limit'", () => {
    const h = html({ dosis: 0.25, protegido: false });
    expect(h).toContain("Radiation 0.3");
    expect(h).not.toContain("NaN");
    expect(h).not.toContain("Infinity");
    expect(h).not.toMatch(/training limit/i);
    expect(h).not.toContain("%");
  });

  it("con tasa muestra el incremento del turno", () => {
    expect(html({ dosis: 1, limite: 4, tasa: 0.44, protegido: false })).toContain("+0.4 this turn");
  });

  it("con protección lo anuncia", () => {
    expect(html({ dosis: 1, limite: 4, protegido: true })).toContain("Protected next turn");
  });

  it("nunca habla de 'budget'", () => {
    for (const datos of [{ dosis: 1, limite: 4, protegido: false }, { dosis: 1, tasa: 0.2, protegido: true }] as DatosDosimetro[]) {
      expect(html(datos)).not.toMatch(/budget/i);
      expect(html(datos)).not.toMatch(/presupuesto/i);
    }
  });

  it("el estado va en texto y con aria-label completo", () => {
    const h = html({ dosis: 1.2, limite: 4, tasa: 0.3, protegido: true });
    expect(h).toContain(`role="status"`);
    expect(h).toContain(`aria-live="polite"`);
    expect(h).toMatch(/aria-label="Radiation 1\.2 \/ training limit 4 · \+0\.3 this turn · Protected next turn"/);
  });
});

describe("claves i18n del dosímetro", () => {
  const claves = ["ui.dosimetro.con_limite", "ui.dosimetro.sin_limite", "ui.dosimetro.tasa", "ui.dosimetro.protegido"];

  it.each(["en", "es"] as const)("%s.json tiene las cuatro claves sin 'budget' ni 'presupuesto'", (idioma) => {
    const d = diccionario(idioma);
    for (const clave of claves) {
      expect(d[clave]).toBeTypeOf("string");
      expect(d[clave]).not.toMatch(/budget/i);
      expect(d[clave]).not.toMatch(/presupuesto/i);
    }
    expect(d["ui.dosimetro.con_limite"]).toContain(idioma === "en" ? "training limit" : "límite de entrenamiento");
  });
});
