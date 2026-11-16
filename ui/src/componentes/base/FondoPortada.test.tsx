import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FondoPortada, PIEZAS_PORTADA, rutaIlustracion, type PiezaPortada } from "./FondoPortada.js";

const css = readFileSync(new URL("./inicio.css", import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
const archivo = (pieza: PiezaPortada, ancho: number) => readFileSync(new URL(`../../../public${rutaIlustracion(pieza, ancho)}`, import.meta.url));

describe("fondo ilustrado de la portada (inicio/01)", () => {
  it("es decorado: todo aria-hidden, imágenes sin texto alternativo y con srcset de sus dos anchos", () => {
    const h = renderToStaticMarkup(<FondoPortada />);
    expect(h).toMatch(/^<div class="portada-fondo" aria-hidden="true">/);
    expect(h.match(/<img /g)).toHaveLength(5);
    expect(h).not.toMatch(/alt="[^"]+"/);
    for (const [pieza, { anchos }] of Object.entries(PIEZAS_PORTADA)) {
      expect(h).toContain(`srcSet="${anchos.map((a) => `/ilustraciones/${pieza}-${a}.webp ${a}w`).join(", ")}"`);
    }
    expect(h).toContain(`class="portada-cable"`);
  });

  it("cada pieza existe en WebP con su ancho y la proporción que reserva el componente, dentro del presupuesto", () => {
    let grandes = 0;
    for (const [nombre, { anchos, proporcion }] of Object.entries(PIEZAS_PORTADA)) {
      const pieza = nombre as PiezaPortada;
      for (const a of anchos) {
        const b = archivo(pieza, a);
        expect(b.toString("ascii", 0, 4) + b.toString("ascii", 8, 12), `${pieza}-${a}`).toBe("RIFFWEBP");
        expect(b.toString("ascii", 12, 16)).toBe("VP8X");
        const w = b.readUIntLE(24, 3) + 1, h = b.readUIntLE(27, 3) + 1;
        expect(w, `${pieza}-${a}`).toBe(a);
        expect(Math.abs(h - a * proporcion), `${pieza}-${a}`).toBeLessThanOrEqual(1);
        expect(b.length, `${pieza}-${a}`).toBeLessThanOrEqual(70_000);
      }
      grandes += archivo(pieza, anchos[anchos.length - 1]!).length;
    }
    // Lo más que baja una pantalla de alta densidad: la variante grande de cada pieza.
    expect(grandes).toBeLessThanOrEqual(150_000);
  });

  it("entra una sola vez en 700 ms o menos, flota en bucle y queda quieta con movimiento reducido", () => {
    expect(css).toMatch(/\.portada-nino\s*\{[^}]*animation:\s*ilu-entra\s+700ms[^,]*,\s*ilu-flota/);
    const reducido = [...css.matchAll(/@media \(prefers-reduced-motion: reduce\)\s*\{([^}]*\})\s*\}/g)].map((m) => m[1]).join(" ");
    expect(reducido).toContain(".portada-fondo .ilu");
    expect(reducido).toContain(".portada-cable");
    expect(reducido).toMatch(/animation:\s*none/);
  });
});
