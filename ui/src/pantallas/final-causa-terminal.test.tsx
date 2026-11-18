import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { GameState } from "@solar-shield/contracts";
import { aterrizar, avanzarTick, aplicarAccion, elegirDilema, partidaDorada, paso } from "@solar-shield/engine";
import { MISION_JEZERO } from "@solar-shield/missions";
import { IdiomaContext, type Idioma } from "../i18n.js";
import { PantallaFinal } from "./PantallaFinal.js";

const html = (el: ReactElement, idioma: Idioma = "en") => renderToStaticMarkup(<IdiomaContext.Provider value={idioma}>{el}</IdiomaContext.Provider>);

function hastaElFinal(s: GameState): GameState {
  let n = 0;
  while (s.resultado === "en_curso" && n < 50) {
    s = avanzarTick(s, MISION_JEZERO);
    n++;
  }
  return s;
}

/** Estado final de la derrota por radiación (misma ruta que la prueba del motor). */
function derrotaPorRadiacion(): GameState {
  let s = partidaDorada();
  s = aterrizar(s, "cerca-de-perseverance", MISION_JEZERO);
  s = paso(s, { tipo: "colocar_modulo", modulo: "panel_solar" }, MISION_JEZERO);
  s = paso(s, { tipo: "colocar_modulo", modulo: "escudo" }, MISION_JEZERO);
  s = paso(s, undefined, MISION_JEZERO);
  s = elegirDilema(s, "aguantar", MISION_JEZERO);
  s = avanzarTick(s, MISION_JEZERO);
  s = aplicarAccion(s, { tipo: "enviar_telemetria" }, MISION_JEZERO);
  return hastaElFinal(s);
}

function victoria(): GameState {
  let s = partidaDorada();
  s = aterrizar(s, "cerca-de-perseverance", MISION_JEZERO);
  s = paso(s, { tipo: "colocar_modulo", modulo: "panel_solar" }, MISION_JEZERO);
  s = paso(s, { tipo: "colocar_modulo", modulo: "escudo" }, MISION_JEZERO);
  s = paso(s, undefined, MISION_JEZERO);
  s = elegirDilema(s, "refugio_y_apagar_invernadero", MISION_JEZERO);
  s = avanzarTick(s, MISION_JEZERO);
  s = aplicarAccion(s, { tipo: "enviar_telemetria" }, MISION_JEZERO);
  return hastaElFinal(s);
}

/** QA-445: la pantalla final explica por qué terminó la partida (radiación, recurso a cero o plazo). */
describe("PantallaFinal: causa terminal (QA-445)", () => {
  it("en inglés dice por qué terminó y traduce la causa de radiación", () => {
    const estado = derrotaPorRadiacion();
    expect(estado.resultado).toBe("fallo");
    const h = html(<PantallaFinal estado={estado} onOtra={() => undefined} />);
    expect(h).toContain("Why it ended");
    expect(h).toContain("The crew took too much radiation for this mission");
    expect(h).not.toContain("ui.causa.limite_radiacion");
  });

  it("en español dice por qué terminó y traduce la causa de radiación", () => {
    const h = html(<PantallaFinal estado={derrotaPorRadiacion()} onOtra={() => undefined} />, "es");
    expect(h).toContain("Por qué terminó");
    expect(h).toContain("La tripulación recibió más radiación");
  });

  it("una victoria no muestra el motivo", () => {
    const h = html(<PantallaFinal estado={victoria()} onOtra={() => undefined} />);
    expect(h).not.toContain("Why it ended");
  });

  it("una derrota por recurso a cero explica el recurso y no menciona la radiación", () => {
    const inicial = partidaDorada();
    const estado = hastaElFinal({ ...inicial, tormenta: null, recursos: { ...inicial.recursos, energia: 1 } });
    expect(estado.resultado).toBe("fallo");
    const en = html(<PantallaFinal estado={estado} onOtra={() => undefined} />);
    expect(en).toContain("Why it ended");
    expect(en).toContain("The base ran out of energy");
    expect(en).not.toContain("too much radiation");
    const es = html(<PantallaFinal estado={estado} onOtra={() => undefined} />, "es");
    expect(es).toContain("La base se quedó sin energía");
    expect(es).not.toContain("más radiación");
  });

  it("una derrota por plazo dice que se acabó el tiempo", () => {
    const estado: GameState = { ...partidaDorada(), resultado: "fallo", tick: MISION_JEZERO.fin.tickLimite };
    expect(html(<PantallaFinal estado={estado} onOtra={() => undefined} />)).toContain("Time ran out before the mission was complete");
    expect(html(<PantallaFinal estado={estado} onOtra={() => undefined} />, "es")).toContain("Se acabó el tiempo antes de completar la misión");
  });
});
