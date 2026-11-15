import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EntradaTactil } from "../escena/entradaTactil.js";
import { IdiomaContext } from "../i18n.js";
import { ControlesTactiles, type ControlesTactilesProps } from "./ControlesTactiles.js";

// Igual que los componentes base, este test comprueba el contrato sin necesitar un DOM.
const props: ControlesTactilesProps = {
  entrada: new EntradaTactil({ onRecentrar() {}, permiteZoom: () => true }),
  activa: true, lugarCercano: "taller", camara: "tercera", onUsar() {}, onCamara() {}, onPausar() {},
};
function html(cambios: Partial<ControlesTactilesProps> = {}, idioma: "en" | "es" = "en") {
  return renderToStaticMarkup(<IdiomaContext.Provider value={idioma}><ControlesTactiles {...props} {...cambios} /></IdiomaContext.Provider>);
}
describe("ControlesTactiles", () => {
  it("usa FacetButton y solo ofrece acción cuando hay un lugar cercano", () => {
    expect(html()).toContain("Inspect");
    expect(html()).toContain('class="fb fb-secondary"');
    expect(html({ lugarCercano: null })).not.toContain("Inspect");
    expect(html({ lugarCercano: null })).toContain("First person");
  });
  it("expone ocupado y motivo de rechazo sin perder accesibilidad", () => {
    expect(html({ ocupado: true })).toContain('aria-busy="true"');
    expect(html({ bloqueada: true })).toContain('aria-disabled="true"');
    expect(html({ bloqueada: true })).toContain("This action is not available now.");
  });
  it("traduce al español e indica la cámara de destino", () => {
    expect(html({ camara: "primera" }, "es")).toContain("Tercera persona");
    expect(html({}, "es")).toContain("Inspeccionar");
    expect(html({}, "es")).not.toContain("ui.mapa.");
  });
  // Solo contrato de marcado: el useEffect (punteros, captura y limpieza) no se prueba aquí.
  it("dibuja un único juego de botones por defecto", () => {
    expect(html()).toContain("Inspect");
    expect(html()).toContain("First person");
    expect(html().match(/controles-tactiles__botones/g)).toHaveLength(1);
  });
  it("con mostrarBotones=false no dibuja botones pero conserva la capa y su accesibilidad", () => {
    const sinBotones = html({ mostrarBotones: false });
    expect(sinBotones).not.toContain("Inspect");
    expect(sinBotones).not.toContain("First person");
    expect(sinBotones).not.toContain("controles-tactiles__botones");
    expect(sinBotones).toContain('class="controles-tactiles"');
    expect(sinBotones).toContain('aria-label="Touch controls"');
    expect(sinBotones).toContain("controles-tactiles__pista");
    expect(sinBotones).toContain("controles-tactiles__joystick");
  });
});
