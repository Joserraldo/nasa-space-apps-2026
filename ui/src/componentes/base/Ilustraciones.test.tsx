import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { IdiomaContext } from "../../i18n.js";
import { EscenaCarga } from "./EscenaCarga.js";
import { FondoPortada } from "./FondoPortada.js";
import { PIEZAS, rutaIlustracion, type Pieza } from "./Ilustracion.js";

const css = readFileSync(new URL("./inicio.css", import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
const archivo = (pieza: Pieza, ancho: number) => readFileSync(new URL(`../../../public${rutaIlustracion(pieza, ancho)}`, import.meta.url));
const html = (el: JSX.Element) => renderToStaticMarkup(<IdiomaContext.Provider value="en">{el}</IdiomaContext.Provider>);
const reducido = [...css.matchAll(/@media \(prefers-reduced-motion: reduce\)\s*\{([^}]*\})/g)].map((m) => m[1]).join(" ");

describe("ilustraciones de entrada (inicio/01 e inicio/03)", () => {
  it("cada pieza existe en WebP con su ancho real y la proporción que reserva el componente, dentro del presupuesto", () => {
    for (const [nombre, { anchos, proporcion }] of Object.entries(PIEZAS)) {
      const pieza = nombre as Pieza;
      for (const a of anchos) {
        const b = archivo(pieza, a);
        expect(b.toString("ascii", 0, 4) + b.toString("ascii", 8, 12), `${pieza}-${a}`).toBe("RIFFWEBP");
        expect(b.toString("ascii", 12, 16)).toBe("VP8X");
        const w = b.readUIntLE(24, 3) + 1, h = b.readUIntLE(27, 3) + 1;
        expect(w, `${pieza}-${a}`).toBe(a);
        expect(Math.abs(h - a * proporcion), `${pieza}-${a}`).toBeLessThanOrEqual(1);
        expect(b.length, `${pieza}-${a}`).toBeLessThanOrEqual(70_000);
      }
    }
    // Lo más que baja la portada en alta densidad: la variante grande de cada pieza.
    const portada = (Object.keys(PIEZAS) as Pieza[]).filter((p) => p.startsWith("portada-"));
    expect(portada.reduce((t, p) => t + archivo(p, PIEZAS[p].anchos[1]).length, 0)).toBeLessThanOrEqual(150_000);
  });

  it("la portada es decorado: aria-hidden, sin texto alternativo, srcset de sus dos anchos y el cable", () => {
    const h = html(<FondoPortada />);
    expect(h).toMatch(/^<div class="portada-fondo" aria-hidden="true">/);
    expect(h.match(/<img /g)).toHaveLength(5);
    expect(h).not.toMatch(/alt="[^"]+"/);
    expect(h).toContain(`srcSet="/ilustraciones/portada-nino-320.webp 320w, /ilustraciones/portada-nino-640.webp 640w"`);
    expect(h).toContain(`class="portada-cable"`);
  });

  it("la carga muestra el niño y los tres módulos con su insignia, como decorado", () => {
    const h = html(<EscenaCarga />);
    expect(h).toMatch(/^<div class="carga-escena" aria-hidden="true">/);
    for (const p of ["carga-nino", "carga-panel", "carga-invernadero", "carga-habitat"]) expect(h).toContain(`/ilustraciones/${p}-`);
    expect(h.match(/class="carga-icono"/g)).toHaveLength(3);
    expect(h).not.toMatch(/alt="[^"]+"/);
  });

  it("portada: entra una vez en 700 ms y flota; carga: los módulos aparecen de a uno dentro de los 1,8 s que dura; todo quieto con movimiento reducido", () => {
    expect(css).toMatch(/\.portada-nino\s*\{[^}]*animation:\s*ilu-entra\s+700ms[^,]*,\s*ilu-flota/);
    expect(css).toMatch(/\.carga-modulo:nth-of-type\(2\)\s*\{\s*--carga-retraso:\s*450ms/);
    expect(css).toMatch(/\.carga-modulo:nth-of-type\(3\)\s*\{\s*--carga-retraso:\s*750ms/);
    for (const sel of [".portada-fondo .ilu", ".portada-cable", ".carga-modulo", ".carga-nino", ".carga-orbita ellipse"]) expect(reducido, sel).toContain(sel);
    expect(reducido).toMatch(/animation:\s*none/);
  });
});
