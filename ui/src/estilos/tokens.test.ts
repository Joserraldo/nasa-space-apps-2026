import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { tokensCss } from "./generar-tokens-css.js";
import { COLORES, colorNum, conAlfa, ESTADO, TIPO, UI, variablesCss } from "./tokens.js";

const css = readFileSync(new URL("./tokens.css", import.meta.url), "utf8");

/** Variables declaradas en tokens.css, tal como las lee el navegador. */
function declaradas(texto: string): Record<string, string> {
  const v: Record<string, string> = {};
  for (const m of texto.matchAll(/^\s*(--[a-z0-9-]+):\s*(.+?);\s*$/gm)) v[m[1]!] = m[2]!;
  return v;
}

/** Contraste WCAG entre dos hex de 6 dígitos. */
function contraste(a: string, b: string): number {
  const lum = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * bl!;
  };
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x! + 0.05) / (y! + 0.05);
}

describe("tokens v8: tokens.ts y tokens.css son la misma fuente (FLUJO §3)", () => {
  it("tokens.css declara exactamente las variables de tokens.ts, con los mismos valores", () => {
    expect(declaradas(css)).toEqual(variablesCss());
  });

  it("tokens.css es el que genera tokens.ts (nadie lo editó a mano)", () => {
    expect(css.replace(/\r\n/g, "\n")).toBe(tokensCss());
  });

  it("todos los colores son hex de 6 dígitos en mayúsculas y no se repite ningún nombre", () => {
    for (const [k, hex] of Object.entries(COLORES)) expect(hex, k).toMatch(/^#[0-9A-F]{6}$/);
    const nombres = [UI, ESTADO].flatMap((g) => Object.keys(g));
    expect(new Set(nombres).size).toBe(nombres.length);
  });

  it("los hex de la UI son los aprobados en DISEÑO §2.1", () => {
    expect(UI).toEqual({ marfil: "#F3EEE5", lila: "#EEE5F1", ciruela: "#53306D", cian: "#73D4E1", "indigo-texto": "#30255F", espacio: "#1C1248", ambar: "#F2B531" });
  });

  it("los textos cumplen contraste AA (4,5) sobre su fondo, como pide DISEÑO §2.1.1", () => {
    expect(contraste(UI["indigo-texto"], UI.marfil)).toBeGreaterThanOrEqual(11.5);
    expect(contraste(UI["indigo-texto"], UI.lila)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(UI.marfil, UI.espacio)).toBeGreaterThanOrEqual(14.5);
    expect(contraste(UI.marfil, UI.ciruela)).toBeGreaterThanOrEqual(4.5);
    for (const t of ["error", "exito", "aviso-texto"] as const) expect(contraste(ESTADO[t], UI.marfil), t).toBeGreaterThanOrEqual(4.5);
    expect(contraste(ESTADO["deshabilitado-texto"], ESTADO.deshabilitado)).toBeGreaterThanOrEqual(4.5);
  });

  it("no queda ningún color del tema oscuro descartado (DISEÑO §8)", () => {
    const prohibidos = ["#0B1026", "#1A2350", "#323272", "#141A2B", "#9BE15D"];
    const todo = (css + JSON.stringify(COLORES)).toUpperCase();
    for (const p of prohibidos) expect(todo, p).not.toContain(p);
  });

  it("la tipografía es Nunito servida desde el juego, sin Google Fonts", () => {
    expect(TIPO.familia.startsWith(`"Nunito"`)).toBe(true);
    expect(css).toContain(`url("/fuentes/nunito-latin.woff2")`);
    expect(css).toContain(`url("/fuentes/nunito-italic-latin.woff2")`);
    expect(css).not.toMatch(/googleapis|gstatic/);
  });

  it("colorNum y conAlfa sirven al 3D y a las sombras sin hex sueltos", () => {
    expect(colorNum("marfil")).toBe(0xf3eee5);
    expect(conAlfa("ciruela", 0.3)).toBe("#53306D4D");
    expect(conAlfa("ciruela", 2)).toBe("#53306DFF");
  });
});
