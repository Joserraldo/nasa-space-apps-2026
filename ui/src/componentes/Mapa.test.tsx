import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { IdiomaContext, traducir, type Idioma } from "../i18n.js";
import { INICIO_JUGADOR, LUGARES } from "../escena/mundo.js";
import type { VistaEscena } from "../escena/vista.js";
import { Mapa } from "./Mapa.js";
import en from "../../i18n/en.json";
import es from "../../i18n/es.json";

const modulos: VistaEscena["modulos"] = {
  ia_base: "funcionando", bateria: "ausente", panel_solar: "funcionando",
  escudo: "instalando", invernadero: "averiado", reciclador_agua: "ausente", antena: "ausente",
};
function dibujar(idioma: Idioma, objetivo: "taller" | null = "taller") {
  return renderToStaticMarkup(<IdiomaContext.Provider value={idioma}>
    <Mapa posicion={INICIO_JUGADOR} objetivo={objetivo} modulos={modulos} onIrA={() => {}} />
  </IdiomaContext.Provider>);
}

describe("Mapa de Jezero", () => {
  it.each(["en", "es"] as const)("expone los diez destinos del contrato y sus nombres en %s", idioma => {
    const html = dibujar(idioma);
    expect(html.match(/<button /g)).toHaveLength(LUGARES.length * 2);
    for (const l of LUGARES) {
      expect(html).toContain(`data-lugar="${l.id}"`);
      expect(html).toContain(traducir(idioma, `ui.mapa.lugar.${l.id}`));
    }
    expect(html).not.toContain("ui.mapa.");
  });

  it("distingue los cuatro estados sin ocultar los anclajes vacíos", () => {
    const html = dibujar("en");
    for (const estado of ["ausente", "instalando", "funcionando", "averiado"] as const) {
      expect(html).toContain(`data-estado="${estado}"`);
      expect(html).toContain(en[`ui.mapa.estado.${estado}`]);
    }
  });

  it("representa objetivo y posición, y permite explorar sin objetivo", () => {
    expect(dibujar("en")).toContain("Target: Workshop");
    expect(dibujar("en")).toContain('aria-label="You are here. Nearest place: Mission control"');
    expect(dibujar("en", null)).not.toContain('data-objetivo="true"');
    expect(dibujar("en", null)).toContain("Explore the base");
  });

  it("completa en ambos idiomas todas las claves propias", () => {
    const claves = Object.keys(en).filter(k => k.startsWith("ui.mapa."));
    expect(claves.sort()).toEqual(Object.keys(es).filter(k => k.startsWith("ui.mapa.")).sort());
    for (const k of claves) expect(es[k as keyof typeof es]).toBeTruthy();
  });
});
