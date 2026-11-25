import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { partidaDorada } from "@solar-shield/engine";
import { IdiomaContext } from "../i18n.js";
import { HudBase, hudVisible, PROGRESO_INICIAL, type HudMundo } from "./HudBase.js";

const html = (el: ReactElement) => renderToStaticMarkup(<IdiomaContext.Provider value="en">{el}</IdiomaContext.Provider>);
const nada = () => {};
const mundo: HudMundo = { onTripulacion: nada, onMapa: nada, camara: "tercera", onCamara: nada };
const reloj = { velocidad: 1, onPausa: nada, onVelocidad: nada };

describe("HUD progresivo (E3, PLAN-JUGABILIDAD §1)", () => {
  it("al entrar a la base: sin Crew ni Map; la velocidad, solo con los módulos puestos", () => {
    expect(hudVisible({ progreso: PROGRESO_INICIAL, sin3d: false, modulosListos: true })).toEqual({ crew: false, mapa: false, velocidad: true });
    expect(hudVisible({ progreso: PROGRESO_INICIAL, sin3d: false, modulosListos: false }).velocidad).toBe(false);
  });

  it("Map llega con el primer objetivo; Crew, después de la primera conversación", () => {
    expect(hudVisible({ progreso: { conversado: false, objetivo: true }, sin3d: false, modulosListos: true })).toMatchObject({ crew: false, mapa: true });
    expect(hudVisible({ progreso: { conversado: true, objetivo: false }, sin3d: false, modulosListos: true })).toMatchObject({ crew: true, mapa: true });
  });

  it("en el respaldo 2D Crew y Map se ven siempre", () => {
    expect(hudVisible({ progreso: PROGRESO_INICIAL, sin3d: true, modulosListos: true })).toMatchObject({ crew: true, mapa: true });
  });

  it("lo oculto no se dibuja; Pause y los recursos, siempre", () => {
    const h = html(<HudBase estado={partidaDorada()} reloj={reloj} mundo={mundo} visible={{ crew: false, mapa: false, velocidad: false }} />);
    for (const oculto of [">Crew<", ">Map<", "Speed"]) expect(h).not.toContain(oculto);
    for (const siempre of ["Pause", "Energy", "Life support", "Shielding"]) expect(h).toContain(siempre);
  });

  it("sin `visible` se ve todo (muestrario)", () => {
    const h = html(<HudBase estado={partidaDorada()} reloj={reloj} mundo={mundo} />);
    for (const texto of [">Crew<", ">Map<", "Speed 1x"]) expect(h).toContain(texto);
  });
});

describe("plazo de la telemetría en el HUD", () => {
  it("con plazo, el turno se muestra con su límite", () => {
    const h = html(<HudBase estado={partidaDorada()} plazo={{ limite: 10 }} />);
    expect(h).toContain("Turn 0 of 10");
  });
  it("sin plazo, solo el turno", () => {
    const h = html(<HudBase estado={partidaDorada()} />);
    expect(h).toContain("Turn 0");
    expect(h).not.toContain(" of 10");
  });
  it("si enviar ahora llega a tiempo, dice en qué turno responde la Tierra", () => {
    const h = html(<HudBase estado={partidaDorada()} plazo={{ limite: 10, llegadaSiEnvia: 6 }} />);
    expect(h).toContain("Earth&#x27;s answer arrives at turn 6 of 10");
    expect(h).not.toContain("Too late");
  });
  it("si ya no llega a tiempo, el texto lo dice (no solo el color)", () => {
    const h = html(<HudBase estado={partidaDorada()} plazo={{ limite: 10, llegadaSiEnvia: 12 }} />);
    expect(h).toContain("Too late");
    expect(h).toContain("hud-plazo-tarde");
  });
});

