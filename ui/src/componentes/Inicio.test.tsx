import { existsSync, readFileSync } from "node:fs";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { IdiomaContext, type Idioma } from "../i18n.js";
import { Carga, TOTAL_CONSEJOS } from "./Carga.js";
import { Intro, TOTAL_VINETAS } from "./Intro.js";
import { Portada, type PortadaProps } from "./Portada.js";

const html = (el: ReactElement, idioma: Idioma = "en") => renderToStaticMarkup(<IdiomaContext.Provider value={idioma}>{el}</IdiomaContext.Provider>);
const nada = () => {};
const portada = (p: Partial<PortadaProps> = {}) =>
  <Portada idioma="en" onIdioma={nada} sonido={false} onSonido={nada} puedeContinuar={false} onEmpezar={nada} onContinuar={nada} onAjustes={nada} onCreditos={nada} {...p} />;

describe("Portada (inicio/01)", () => {
  it("logo oficial como imagen con texto alternativo, subtítulo, menú de tres y lema", () => {
    const h = html(portada());
    expect(h).toContain(`src="/logo-solar-shield.png"`);
    expect(h).toContain(`alt="Solar Shield"`);
    for (const texto of ["Mars training adventure", "Start mission", "Continue", "Settings", "Explore. Ask. Decide.", "Sources &amp; credits", "Sound off"]) expect(h).toContain(texto);
    expect(existsSync(new URL("../../public/logo-solar-shield.png", import.meta.url))).toBe(true);
  });

  it("sin guardado, Continue queda no disponible, con candado y el motivo escrito", () => {
    const h = html(portada());
    expect(h).toContain("No saved mission yet");
    expect(h.match(/aria-disabled="true"/g)).toHaveLength(1);
    expect(html(portada({ puedeContinuar: true }))).not.toContain("No saved mission yet");
  });

  it("el idioma elegido queda marcado y todo se traduce", () => {
    expect(html(portada({ idioma: "es" }), "es")).toMatch(/aria-pressed="true"[^>]*>.*?ES</);
    expect(html(portada(), "es")).toContain("Empezar misión");
  });
});

describe("Intro (inicio/02, HISTORIA §3)", () => {
  it("cuatro viñetas con su número, su título y su texto; se puede saltar salvo en la última", () => {
    expect(TOTAL_VINETAS).toBe(4);
    const primera = html(<Intro onTerminar={nada} />);
    expect(primera).toContain("01 / A new mission");
    expect(primera).toContain("A new training mission begins.");
    expect(primera).toContain("Skip intro");
    const ultima = html(<Intro onTerminar={nada} inicial={3} />);
    expect(ultima).toContain("04 / Your turn");
    expect(ultima).toContain("Explore. Ask. Decide.");
    expect(ultima).not.toContain("Skip intro");
    expect(html(<Intro onTerminar={nada} inicial={2} />, "es")).toContain("Tu tripulación ayuda. Tú decides.");
  });
});

describe("Carga (inicio/03)", () => {
  it("indicador indeterminado y honesto: sin porcentajes; estado ocupado para el lector", () => {
    const h = html(<Carga />);
    expect(h).toContain(`role="status"`);
    expect(h).toContain(`aria-busy="true"`);
    expect(h).toContain("Preparing your mission");
    expect(h).not.toMatch(/\d+\s*%/);
  });

  it("el consejo es el que se pide (sin azar) y da la vuelta", () => {
    expect(html(<Carga consejo={0} />)).toContain("Panels collect sunlight.");
    expect(html(<Carga consejo={TOTAL_CONSEJOS} />)).toContain("Panels collect sunlight.");
    expect(html(<Carga consejo={-1} />)).toContain("Send them early.");
  });
});

describe("inicio.css solo usa tokens", () => {
  it("ningún color literal", () => {
    const css = readFileSync(new URL("./base/inicio.css", import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/);
  });
});
