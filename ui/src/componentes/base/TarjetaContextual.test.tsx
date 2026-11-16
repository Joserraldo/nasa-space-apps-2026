import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { faseTarjeta, TarjetaContextual } from "./TarjetaContextual.js";

const css = readFileSync(new URL("./tarjetas.css", import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
const tokens = readFileSync(new URL("../../estilos/tokens.css", import.meta.url), "utf8");

/** Milisegundos de un token de duración (`--dur-realce: 180ms;`). */
function ms(token: string): number {
  const m = tokens.match(new RegExp(`${token}:\\s*(\\d+)ms`));
  if (!m) throw new Error(`falta ${token} en tokens.css`);
  return Number(m[1]);
}

describe("tarjeta contextual (F2, mundo/04, mundo/03, ui/01)", () => {
  it("abierta: diálogo no modal cuyo nombre es el título; trae encabezado, cuerpo y acciones", () => {
    const h = renderToStaticMarkup(
      <TarjetaContextual abierta titulo="Engineer" bajada="More power needs resources now." acciones={<button>Place panel</button>}>
        <p>Costs now</p>
      </TarjetaContextual>,
    );
    expect(h).toContain(`role="dialog"`);
    expect(h).toContain(`aria-modal="false"`);
    const id = h.match(/aria-labelledby="([^"]+)"/)?.[1];
    expect(id).toBeTruthy();
    expect(h).toContain(`<h2 id="${id}" class="tc-titulo">Engineer</h2>`);
    for (const parte of ["tc-bajada", "tc-cuerpo", "tc-acciones"]) expect(h).toContain(parte);
  });

  it("cerrada: no deja nada en la página", () => {
    expect(renderToStaticMarkup(<TarjetaContextual abierta={false} titulo="Engineer" />)).toBe("");
  });

  it("origen: auto por defecto; lado y hoja se respetan", () => {
    expect(renderToStaticMarkup(<TarjetaContextual abierta titulo="x" />)).toContain(`data-origen="auto"`);
    expect(renderToStaticMarkup(<TarjetaContextual abierta titulo="x" origen="hoja" />)).toContain(`data-origen="hoja"`);
    expect(renderToStaticMarkup(<TarjetaContextual abierta titulo="x" origen="lado" />)).toContain(`data-origen="lado"`);
  });

  it("la figura es decorativa: el nombre va en el título", () => {
    expect(renderToStaticMarkup(<TarjetaContextual abierta titulo="x" figura={<span>retrato</span>} />)).toContain(`class="tc-figura" aria-hidden="true"`);
  });

  it("fases: sale animada, el final de la entrada no la cierra y se puede reabrir mientras sale", () => {
    expect(faseTarjeta("cerrada", "abrir", false)).toBe("abierta");
    expect(faseTarjeta("abierta", "fin", false)).toBe("abierta");
    expect(faseTarjeta("abierta", "cerrar", false)).toBe("saliendo");
    expect(faseTarjeta("saliendo", "abrir", false)).toBe("abierta");
    expect(faseTarjeta("saliendo", "fin", false)).toBe("cerrada");
    expect(faseTarjeta("cerrada", "cerrar", false)).toBe("cerrada");
  });

  it("con movimiento reducido se cierra enseguida y el CSS no la desplaza", () => {
    expect(faseTarjeta("abierta", "cerrar", true)).toBe("cerrada");
    const reducido = css.match(/@media \(prefers-reduced-motion: reduce\)\s*\{([^}]*)\}/)?.[1] ?? "";
    for (const sel of [".tc", ".tc-cab", ".tc-cuerpo", ".tc-acciones"]) expect(reducido, sel).toContain(sel);
    expect(reducido).toMatch(/transition:\s*none/);
  });

  it("entra y sale entre 120 y 200 ms con tokens, la salida es más corta y no usa la curva ease-in", () => {
    const entra = css.match(/\.tc\s*\{[^}]*transition:\s*opacity\s+var\((--dur-[a-z]+)\)\s+var\(--curva-entrada\)/)?.[1];
    const regla = css.match(/\.tc\[data-fase="saliendo"\]\s*\{([^}]*)\}/)?.[1] ?? "";
    const sale = regla.match(/transition-duration:\s*var\((--dur-[a-z]+)\)/)?.[1];
    expect(entra && sale).toBeTruthy();
    for (const d of [ms(entra!), ms(sale!)]) {
      expect(d).toBeGreaterThanOrEqual(120);
      expect(d).toBeLessThanOrEqual(200);
    }
    expect(ms(sale!)).toBeLessThan(ms(entra!));
    expect(regla).not.toContain("--curva-salida");
    expect(regla).toMatch(/opacity:\s*0/);
  });

  it("aparece con @starting-style (se puede interrumpir) y el contenido entra escalonado", () => {
    expect(css).toMatch(/@starting-style\s*\{\s*\.tc\s*\{[^}]*opacity:\s*0/);
    expect(css).toMatch(/\.tc-cuerpo\s*\{\s*transition-delay/);
    expect(css).toMatch(/\.tc-acciones\s*\{\s*transition-delay/);
  });

  it("tarjetas.css solo usa tokens: sin hex, rgb ni hsl", () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/);
  });
});
