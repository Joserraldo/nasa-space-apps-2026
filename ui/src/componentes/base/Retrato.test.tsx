import { readFileSync } from "node:fs";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { IdiomaContext, traducir, type Idioma } from "../../i18n.js";
import { COLORES } from "../../estilos/tokens.js";
import { ExpertPortrait } from "./ExpertPortrait.js";
import { EXPRESIONES, PERSONAS, Retrato } from "./Retrato.js";

const html = (el: ReactElement, idioma: Idioma = "en") => renderToStaticMarkup(<IdiomaContext.Provider value={idioma}>{el}</IdiomaContext.Provider>);

describe("retratos de diálogo (DISEÑO §4.4)", () => {
  it("los cinco personajes tienen las ocho expresiones, y cada expresión dibuja algo distinto", () => {
    expect(EXPRESIONES).toHaveLength(8);
    for (const p of PERSONAS) {
      const dibujos = EXPRESIONES.map((e) => html(<Retrato persona={p} expresion={e} />));
      expect(new Set(dibujos).size, p).toBe(8);
    }
  });

  it("decorativos: aria-hidden; el nombre y la especialidad van en texto al lado", () => {
    expect(html(<Retrato persona="ingeniera" />)).toContain(`aria-hidden="true"`);
    const ficha = html(<ExpertPortrait persona="ingeniera" />);
    expect(ficha).toContain("Engineer");
    expect(ficha).toContain("Power &amp; repairs");
    expect(html(<ExpertPortrait persona="doctora" />, "es")).toContain("Doctora de radiación");
  });

  it("solo colores de tokens: cada var(--color-…) existe en tokens.ts y no hay hex sueltos", () => {
    for (const p of PERSONAS) for (const e of EXPRESIONES) {
      const h = html(<Retrato persona={p} expresion={e} danada />);
      expect(h, `${p}/${e}`).not.toMatch(/="#[0-9a-fA-F]{3,8}"/);
      for (const m of h.matchAll(/var\(--color-([a-z-]+)\)/g)) expect(Object.keys(COLORES), `${p}/${e}`).toContain(m[1]);
    }
  });

  it("cada humano usa su propia piel y su propio pelo (no se recolorea a otro)", () => {
    for (const p of ["nino", "ingeniera", "doctora", "meteorologa"] as const) {
      const h = html(<Retrato persona={p} />);
      expect(h).toContain(`var(--color-piel-${p})`);
      expect(h).toContain(`var(--color-cabello-${p})`);
    }
    expect(html(<Retrato persona="doctora" />)).toMatch(/stroke="var\(--color-traje-marfil\)" stroke-width="4"/);
  });

  it("Iris dañada lo dice en texto además de verse: ojos de error y aviso escrito", () => {
    const h = html(<ExpertPortrait persona="ia_base" danada />);
    expect(h).toContain("var(--color-error)");
    expect(h).toContain(traducir("en", "ui.comun.retrato.danada"));
  });

  it("como botón para elegir a quién preguntar: aria-pressed y check en la elegida", () => {
    const h = html(<ExpertPortrait persona="meteorologa" seleccionado onElegir={() => {}} />);
    expect(h).toContain(`aria-pressed="true"`);
    expect(h).toContain("retrato-check");
  });

  it("retratos.css solo usa tokens", () => {
    const css = readFileSync(new URL("./retratos.css", import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/);
  });
});
