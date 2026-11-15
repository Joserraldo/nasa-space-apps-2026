import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { IdiomaContext, type Idioma } from "../../i18n.js";
import { AccesoRecurso, ChipPregunta } from "./Accesos.js";
import { TarjetaFuenteCompacta } from "./FuenteCompacta.js";
import { ChipPausa, PanelFacetado } from "./PanelFacetado.js";
import { CostRow } from "./Piezas.js";
import { TarjetaDecision } from "./TarjetaDecision.js";

const html = (el: ReactElement, idioma: Idioma = "en") => renderToStaticMarkup(<IdiomaContext.Provider value={idioma}>{el}</IdiomaContext.Provider>);
const nada = () => {};

describe("piezas de la E7 (ui/04)", () => {
  it("el panel lleva la cinta numerada como encabezado y las acciones a la derecha", () => {
    const h = html(<PanelFacetado numero={1} tituloKey="ui.tormenta.elegir" acciones={<ChipPausa />}>x</PanelFacetado>);
    expect(h).toContain("01 / Choose your expert");
    expect(h).toContain("<h2");
    expect(h).toContain("Paused");
    expect(html(<PanelFacetado tituloKey="ui.tormenta.elegir">x</PanelFacetado>)).not.toContain(" / Choose");
  });

  it("el acceso por recurso muestra el valor real redondeado y es botón solo con onClick", () => {
    const b = html(<AccesoRecurso recurso="energia" valor={69.6} onClick={nada} />);
    expect(b).toContain("<button");
    expect(b).toContain(">70<");
    expect(html(<AccesoRecurso recurso="blindaje" valor={60} />)).not.toContain("<button");
    expect(html(<AccesoRecurso recurso="soporte_vital" valor={80} />, "es")).toContain("Soporte vital");
  });

  it("la pregunta es un botón con su texto", () => {
    expect(html(<ChipPregunta icono="escudo" labelKey="ui.tormenta.pregunta.proteger" onClick={nada} />)).toContain("What needs protection?");
  });

  it("la fuente compacta dice dueño y tipo, y solo muestra id y fecha si existen", () => {
    const h = html(<TarjetaFuenteCompacta dueno="NASA" id="E-1" fecha="2026-11-13" />);
    expect(h).toContain("NASA / Archived event");
    expect(h).toContain("E-1");
    expect(h).toContain("2026-11-13");
    const sin = html(<TarjetaFuenteCompacta />);
    expect(sin).toContain("Archived event");
    expect(sin).not.toContain("ID");
  });

  it("la tarjeta de decisión pinta el costo aplicado y 'Benefit pending' solo si hay efecto después", () => {
    const h = html(<TarjetaDecision aplicado={{ energia: -6 }} retrasado={{ energia: 14 }} onVolver={nada} onVerRegistro={nada} />);
    expect(h).toContain("Action confirmed");
    expect(h).toContain(`delta-menos">-6<`);
    expect(h).toContain("Benefit pending");
    expect(h).toContain("Return to exploration");
    expect(h).toContain("View decision log");
    const sin = html(<TarjetaDecision aplicado={{ energia: -6 }} onVolver={nada} />);
    expect(sin).not.toContain("Benefit pending");
    expect(sin).not.toContain("View decision log");
  });

  it("CostRow sin retrasado no dibuja el bloque 'Later'", () => {
    expect(html(<CostRow inmediato={{ energia: -6 }} />)).not.toContain("Later");
  });
});
