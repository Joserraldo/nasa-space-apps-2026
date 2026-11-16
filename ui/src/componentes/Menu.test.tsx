import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { IdiomaContext } from "../i18n.js";
import { Menu, type MenuProps } from "./Menu.js";

const nada = () => {};
const html = (p: Partial<MenuProps> = {}) => renderToStaticMarkup(
  <IdiomaContext.Provider value="en">
    <Menu camara="tercera" onCamara={nada} calidad="media" onCalidad={nada} sonido idioma="en" onSonido={nada} onIdioma={nada} onCerrar={nada} {...p} />
  </IdiomaContext.Provider>,
);

describe("menú (E4)", () => {
  it("diálogo modal con su título y los cuatro ajustes", () => {
    const h = html();
    expect(h).toContain(`role="dialog"`);
    expect(h).toContain(`aria-modal="true"`);
    for (const texto of ["Settings", "Camera", "Graphics", "Sound", "Language", "Third person", "First person", "High", "Medium", "Low", "English", "Español", "Close"]) expect(h).toContain(texto);
  });

  it("marca la opción elegida en cada grupo", () => {
    const h = html({ camara: "primera", calidad: "baja", idioma: "es" });
    const presionados = [...h.matchAll(/aria-pressed="true"[^>]*>(?:<[^>]+>)*([^<]+)/g)].map((m) => m[1]);
    expect(presionados.join(" ")).toMatch(/First person/);
    expect(presionados.join(" ")).toMatch(/Low/);
    expect(presionados.join(" ")).toMatch(/Español/);
  });
});
