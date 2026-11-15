import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { IdiomaContext, type Idioma } from "../../i18n.js";
import { FacetButton, type FacetButtonProps } from "./FacetButton.js";
import { Icono, NOMBRES_ICONO } from "./Iconos.js";

const nada = () => {};
const html = (p: Partial<FacetButtonProps>, idioma: Idioma = "en") =>
  renderToStaticMarkup(
    <IdiomaContext.Provider value={idioma}>
      <FacetButton labelKey="ui.comun.atras" onClick={nada} {...p} />
    </IdiomaContext.Provider>,
  );

describe("FacetButton (APLICACION §5, láminas ui/02 y ui/03)", () => {
  it("es un botón nativo con el texto traducido, en inglés y en español", () => {
    expect(html({})).toMatch(/<button type="button" class="fb fb-secondary"/);
    expect(html({})).toContain(">Back<");
    expect(html({}, "es")).toContain(">Atrás<");
  });

  it("no disponible: enfocable (sin atributo disabled), aria-disabled y el motivo escrito enlazado", () => {
    const h = html({ disabled: true, disabledReasonKey: "ui.comun.motivo.sin_energia" });
    expect(h).not.toMatch(/ disabled[ =>]/);
    expect(h).toContain(`aria-disabled="true"`);
    const id = /aria-describedby="([^"]+)"/.exec(h)?.[1];
    expect(id).toBeTruthy();
    expect(h).toContain(`id="${id}" class="fb-motivo">Not enough energy<`);
  });

  it("seleccionado: aria-pressed y check; sin la prop no se anuncia como interruptor", () => {
    expect(html({ selected: true })).toContain(`aria-pressed="true"`);
    expect(html({ selected: true })).toContain("fb-sel");
    expect(html({ selected: false })).toContain(`aria-pressed="false"`);
    expect(html({})).not.toContain("aria-pressed");
  });

  it("procesando: aria-busy, bloqueado y las dos etiquetas superpuestas para que no cambie el ancho", () => {
    const h = html({ busy: true });
    expect(h).toContain(`aria-busy="true"`);
    expect(h).toContain(`aria-disabled="true"`);
    expect(h).toContain(`<span class="fb-oculta">Back</span><span class="fb-encima">Working…</span>`);
  });

  it("primario más grande; el icono siempre va con texto y oculto al lector", () => {
    const h = html({ variant: "primary", icon: "check", labelKey: "ui.comun.muestrario.colocar_panel" });
    expect(h).toContain("fb-primary");
    expect(h).toMatch(/<svg class="fb-icono" width="26" height="26"[^>]*aria-hidden="true"/);
    expect(h).toContain(">Place panel<");
  });
});

describe("iconos facetados propios", () => {
  it("cada icono es un SVG de 24x24 sin colores sueltos (solo tokens o currentColor)", () => {
    for (const nombre of NOMBRES_ICONO) {
      const h = renderToStaticMarkup(<Icono nombre={nombre} />);
      expect(h, nombre).toContain(`viewBox="0 0 24 24"`);
      const colores = [...h.matchAll(/(?:fill|stroke)="([^"]+)"/g)].map((m) => m[1]!);
      for (const c of colores) expect(c, nombre).toMatch(/^(currentColor|none|var\(--color-[a-z-]+\))$/);
    }
  });
});

describe("facetado.css solo usa tokens", () => {
  it("ningún color literal: todo es var(--color-…) o color-mix de tokens", () => {
    const css = readFileSync(new URL("./facetado.css", import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/);
  });
});
