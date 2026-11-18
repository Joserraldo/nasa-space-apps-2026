import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { BaseAction, GameState } from "@solar-shield/contracts";
import { MISION_JEZERO } from "@solar-shield/missions";
import { IdiomaContext } from "../i18n.js";
import { inicial, reducir, type Juego } from "../juego/reductor.js";
import { DosisEstimada } from "./DosisEstimada.js";

/** De la portada a la base viva (sitio y dos módulos), como la ruta dorada. */
function enBase(): Juego {
  let j = reducir(inicial(), { tipo: "fase", fase: "modulos" });
  j = reducir(j, { tipo: "modulo", modulo: MISION_JEZERO.modulosDisponibles[0]! });
  j = reducir(j, { tipo: "modulo", modulo: MISION_JEZERO.modulosDisponibles[1]! });
  return reducir(j, { tipo: "fase", fase: "base" });
}
/** Avanza el reloj hasta que llegue la tormenta. */
function conTormenta(): GameState {
  let j = enBase();
  for (let i = 0; i < 60 && j.fase !== "tormenta"; i++) j = reducir(reducir(j, { tipo: "pausa", pausado: false }), { tipo: "tick" });
  return j.estado;
}

const html = (estado: GameState, accion: BaseAction, idioma: "en" | "es" = "en") => renderToStaticMarkup(
  <IdiomaContext.Provider value={idioma}><DosisEstimada estado={estado} accion={accion} mision={MISION_JEZERO} /></IdiomaContext.Provider>,
);

describe("dosis proyectada en los paneles de decisión", () => {
  it("en inglés anuncia la estimación de los próximos turnos", () => {
    const h = html(conTormenta(), { tipo: "refugiarse" });
    expect(h).toContain("Estimate for the next 2 turns");
    expect(h).toContain("dosis-estimada");
  });

  it("en español usa 'Estimación'", () => {
    expect(html(conTormenta(), { tipo: "refugiarse" }, "es")).toContain("Estimación");
  });

  it("solo habla de radiación: no muestra energía, soporte vital ni blindaje proyectados", () => {
    const h = html(conTormenta(), { tipo: "refugiarse" });
    expect(h).not.toMatch(/Energy/i);
    expect(h).not.toMatch(/Shielding/i);
    expect(h).not.toMatch(/Life support/i);
  });

  it("no pinta nada cuando la acción no se puede aplicar", () => {
    const estado = conTormenta();
    const pobre = { ...estado, recursos: { ...estado.recursos, energia: 1 } };
    expect(html(pobre, { tipo: "subir_escudo", nivel: 3 })).toBe("");
  });
});
