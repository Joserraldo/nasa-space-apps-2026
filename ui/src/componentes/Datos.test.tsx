import { readFileSync } from "node:fs";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { datosUsados } from "@solar-shield/data";
import { partidaDorada } from "@solar-shield/engine";
import { IdiomaContext, traducir, type Idioma } from "../i18n.js";
import { DatosUsados } from "./DatosUsados.js";
import { Glosario, Termino, TERMINOS_GLOSARIO } from "./Glosario.js";
import { FuenteTerreno, TarjetaFuente } from "./TarjetaFuente.js";

const html = (el: ReactElement, idioma: Idioma = "en") => renderToStaticMarkup(<IdiomaContext.Provider value={idioma}>{el}</IdiomaContext.Provider>);

describe("TarjetaFuente v8 (ui/03, ui/04)", () => {
  const fuente = partidaDorada().tormenta!.fuente;

  it("conserva los textos que revisa el e2e: título, curado y enlace a la fuente real", () => {
    const h = html(<TarjetaFuente fuente={fuente} />);
    expect(h).toContain("Where does this data come from?");
    expect(h).toContain("Real curated data, not live");
    expect(h).toMatch(/<a class="fuente-enlace" href="https:\/\/[^"]+" target="_blank" rel="noreferrer">See the source/);
    expect(h).toContain("(opens in a new window)");
  });

  it("identificador y fecha solo si existen en los datos", () => {
    expect(html(<TarjetaFuente fuente={fuente} />)).toContain(`Event ID: ${fuente.idFuente}`);
    const sin = html(<TarjetaFuente fuente={{ ...fuente, idFuente: "" }} />);
    expect(sin).not.toContain("Event ID");
  });

  it("la fuente de terreno muestra cada enlace y el aviso de dato derivado", () => {
    const h = html(<FuenteTerreno fuente={{ nombreKey: "fuente.marsTrek", consultadoEl: "2026-11-13", urls: ["https://trek.nasa.gov/mars/", "https://trek.nasa.gov/moon/"], derivadoKey: "datos.terreno.derivado" }} />);
    expect(h.match(/class="fuente-enlace"/g)).toHaveLength(2);
    expect(h).toContain("Retrieved on 2026-11-13");
  });
});

describe("DatosUsados y Glosario", () => {
  it("una línea por conjunto de datos de data/, y las generales al final", () => {
    const h = html(<DatosUsados />);
    const { tituloKey, lineas } = datosUsados();
    expect(h).toContain(traducir("en", tituloKey));
    for (const l of lineas) expect(h).toContain(traducir("en", l.clave).replace(/&/g, "&amp;").replace(/'/g, "&#x27;").replace(/"/g, "&quot;"));
    expect(h.lastIndexOf("datos-general")).toBeGreaterThan(h.lastIndexOf("<li"));
  });

  it("el glosario trae todos los términos de data/ con su definición en en y es", () => {
    expect(TERMINOS_GLOSARIO.length).toBeGreaterThanOrEqual(20);
    for (const id of TERMINOS_GLOSARIO) for (const l of ["en", "es"] as const) {
      expect(traducir(l, `datos.glosario.${id}.palabra`), `${l}/${id}`).not.toBe(`datos.glosario.${id}.palabra`);
      expect(traducir(l, `datos.glosario.${id}.def`), `${l}/${id}`).not.toBe(`datos.glosario.${id}.def`);
    }
    expect(html(<Glosario />).match(/<dt>/g)).toHaveLength(TERMINOS_GLOSARIO.length);
  });

  it("un término en contexto es un botón que abre su definición (cerrado al empezar)", () => {
    const h = html(<Termino id="dosis" />);
    expect(h).toContain(`aria-expanded="false"`);
    expect(h).toContain(`>${traducir("en", "datos.glosario.dosis.palabra")}<`);
    expect(h).not.toContain("termino-def");
  });

  it("datos.css solo usa tokens", () => {
    const css = readFileSync(new URL("./base/datos.css", import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/);
  });
});
