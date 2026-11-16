import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { IdiomaContext } from "../../i18n.js";
import { ICONO_RECURSO } from "./Piezas.js";
import { PildoraBoton, PildoraObjetivo } from "./Pildoras.js";

const html = (el: JSX.Element) => renderToStaticMarkup(<IdiomaContext.Provider value="en">{el}</IdiomaContext.Provider>);

describe("Píldoras del HUD (mundo/01)", () => {
  it("Life support usa el icono de pulmones, no el brote", () => {
    expect(ICONO_RECURSO.soporte_vital).toBe("pulmones");
  });
  it("el objetivo lleva anillo cian y texto, y se anuncia como estado", () => {
    const h = html(<PildoraObjetivo labelKey="ui.comun.muestrario.objetivo" />);
    expect(h).toContain("pildora-anillo");
    expect(h).toContain("Inspect the solar controller");
    expect(h).toContain(`role="status"`);
  });
  it("el botón con tecla la dibuja aparte y la expone como atajo", () => {
    const h = html(<PildoraBoton labelKey="ui.comun.hud.primera" tecla={{ letra: "V", tono: "camara" }} onClick={() => {}} />);
    expect(h).toContain(`aria-keyshortcuts="V"`);
    expect(h).toContain("First person");
  });
});
