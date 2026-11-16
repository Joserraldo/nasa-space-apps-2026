import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Globo } from "./Globo.js";
import { Icono } from "./Iconos.js";

const leer = (ruta: string) => readFileSync(new URL(ruta, import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
const globo = leer("./globo.css");
const pildoras = leer("./pildoras.css");
const tactiles = leer("../controlesTactiles.css");
const tokens = readFileSync(new URL("../../estilos/tokens.css", import.meta.url), "utf8");
const ms = (token: string) => Number(tokens.match(new RegExp(`${token}:\\s*(\\d+)ms`))?.[1]);

describe("globo, aviso [E] y salto (F4)", () => {
  it("el globo se anuncia como estado y nombra a quien habla solo para el lector", () => {
    const h = renderToStaticMarkup(<Globo texto="Follow me to the solar panels!" quien="Iris" />);
    expect(h).toContain(`role="status"`);
    expect(h).toContain(`<span class="oculto-visual">Iris: </span>Follow me to the solar panels!`);
    expect(h).toContain(`data-punta="abajo"`);
    expect(h).toContain(`data-tono="normal"`);
  });

  it("punta arriba y tono de aviso se respetan", () => {
    const h = renderToStaticMarkup(<Globo texto="x" punta="arriba" tono="aviso" />);
    expect(h).toContain(`data-punta="arriba"`);
    expect(h).toContain(`data-tono="aviso"`);
  });

  it("el globo, el aviso [E] y el botón de acción táctil aparecen entre 120 y 200 ms, y quietos con movimiento reducido", () => {
    const casos: Array<[string, string, string]> = [[globo, "globo-aparece", ".globo"], [pildoras, "aviso-aparece", ".pb-accion"], [tactiles, "ct-aparece", ".ct-accion"]];
    for (const [css, animacion, selector] of casos) {
      const token = css.match(new RegExp(`animation:\\s*${animacion}\\s+var\\((--dur-[a-z]+)\\)`))?.[1];
      expect(token, animacion).toBeTruthy();
      expect(ms(token!)).toBeGreaterThanOrEqual(120);
      expect(ms(token!)).toBeLessThanOrEqual(200);
      const reducido = [...css.matchAll(/@media \(prefers-reduced-motion: reduce\)\s*\{(.*)\}/g)].map((m) => m[1]).join(" ");
      expect(reducido, selector).toContain(selector);
      expect(reducido, selector).toMatch(/animation:\s*none/);
    }
  });

  it("el botón de salto mide al menos 48 px (controles del juego, §6)", () => {
    const regla = tactiles.match(/\.ct-salto\s*\{([^}]*)\}/)?.[1] ?? "";
    for (const prop of ["min-inline-size", "min-block-size"]) {
      expect(Number(regla.match(new RegExp(`${prop}:\\s*(\\d+)px`))?.[1]), prop).toBeGreaterThanOrEqual(48);
    }
  });

  it("el icono de salto existe y es decorativo", () => {
    const h = renderToStaticMarkup(<Icono nombre="salto" />);
    expect(h).toContain(`aria-hidden="true"`);
    expect(h).toContain("<polygon");
  });

  it("globo.css solo usa tokens: sin hex, rgb ni hsl", () => {
    expect(globo).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/);
  });
});
