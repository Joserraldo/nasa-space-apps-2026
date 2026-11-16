import { readFileSync, statSync } from "node:fs";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { IdiomaContext, traducir, type Idioma } from "../../i18n.js";
import { COLORES } from "../../estilos/tokens.js";
import { ExpertPortrait } from "./ExpertPortrait.js";
import { ANCHOS_RETRATO, EXPRESIONES, PERSONAS, Retrato, RetratoSvg, rutaRetratoB } from "./Retrato.js";

const html = (el: ReactElement, idioma: Idioma = "en") => renderToStaticMarkup(<IdiomaContext.Provider value={idioma}>{el}</IdiomaContext.Provider>);

describe("retratos de diálogo (DISEÑO §4.4)", () => {
  it("los cinco personajes tienen las ocho expresiones, y cada expresión dibuja algo distinto (imagen B y SVG de respaldo)", () => {
    expect(EXPRESIONES).toHaveLength(8);
    for (const Componente of [Retrato, RetratoSvg]) for (const p of PERSONAS) {
      const dibujos = EXPRESIONES.map((e) => html(<Componente persona={p} expresion={e} />));
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

  it("solo colores de tokens en el SVG: cada var(--color-…) existe en tokens.ts y no hay hex sueltos", () => {
    for (const p of PERSONAS) for (const e of EXPRESIONES) {
      const h = html(<RetratoSvg persona={p} expresion={e} danada />);
      expect(h, `${p}/${e}`).not.toMatch(/="#[0-9a-fA-F]{3,8}"/);
      for (const m of h.matchAll(/var\(--color-([a-z-]+)\)/g)) expect(Object.keys(COLORES), `${p}/${e}`).toContain(m[1]);
    }
  });

  it("en el SVG de respaldo cada humano usa su propia piel y su propio pelo (no se recolorea a otro)", () => {
    for (const p of ["nino", "ingeniera", "doctora", "meteorologa"] as const) {
      const h = html(<RetratoSvg persona={p} />);
      expect(h).toContain(`var(--color-piel-${p})`);
      expect(h).toContain(`var(--color-cabello-${p})`);
    }
    expect(html(<RetratoSvg persona="doctora" />)).toMatch(/stroke="var\(--color-traje-marfil\)" stroke-width="4"/);
  });

  it("los humanos usan su cara B en WebP con srcset de 160 y 320, del tamaño pedido y decorativa; Iris sigue en SVG", () => {
    for (const p of ["nino", "ingeniera", "doctora", "meteorologa"] as const) {
      const h = html(<Retrato persona={p} expresion="preocupada" tam={72} />);
      expect(h).toMatch(/^<img /);
      expect(h).toContain(`srcSet="/retratos/${p}-preocupada-160.webp 160w, /retratos/${p}-preocupada-320.webp 320w"`);
      expect(h).toContain(`sizes="72px"`);
      expect(h).toContain(`width="72" height="72"`);
      expect(h).toContain(`alt="" aria-hidden="true"`);
    }
    expect(html(<Retrato persona="ia_base" />)).toMatch(/^<svg /);
  });

  it("las 64 caras existen, son WebP cuadradas del ancho de su nombre y entran en el presupuesto de peso", () => {
    const tope = { 160: 12_000, 320: 30_000 } as const;
    for (const p of ["nino", "ingeniera", "doctora", "meteorologa"] as const) for (const e of EXPRESIONES) for (const a of ANCHOS_RETRATO) {
      const archivo = new URL(`../../../public${rutaRetratoB(p, e, a)}`, import.meta.url);
      const b = readFileSync(archivo);
      expect(b.toString("ascii", 0, 4) + b.toString("ascii", 8, 12), `${p}-${e}-${a}`).toBe("RIFFWEBP");
      // Lienzo del contenedor VP8X (ancho y alto menos 1, 24 bits).
      expect(b.toString("ascii", 12, 16)).toBe("VP8X");
      expect(b.readUIntLE(24, 3) + 1).toBe(a);
      expect(b.readUIntLE(27, 3) + 1).toBe(a);
      expect(statSync(archivo).size, `${p}-${e}-${a}`).toBeLessThanOrEqual(tope[a]);
    }
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
