import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EntradaTactil } from "../escena/entradaTactil.js";
import { IdiomaContext } from "../i18n.js";
import { ControlesTactiles } from "./ControlesTactiles.js";

const html = (entrada: EntradaTactil | null) => renderToStaticMarkup(
  <IdiomaContext.Provider value="en"><ControlesTactiles entrada={entrada} camara="tercera" onCamara={() => {}} /></IdiomaContext.Provider>,
);

describe("botón táctil de salto (E9)", () => {
  it("con la escena lista hay un botón Jump, solo icono y con su nombre accesible", () => {
    const h = html(new EntradaTactil({ onRecentrar() {}, permiteZoom: () => false, onSaltar: () => true }));
    expect(h).toMatch(/<button[^>]*class="ct-salto"[^>]*aria-label="Jump"/);
    expect(h).toContain(`aria-keyshortcuts="Space"`);
  });

  it("sin entrada (la escena todavía no la entregó) no hay botón de salto", () => {
    expect(html(null)).not.toContain("ct-salto");
  });
});
