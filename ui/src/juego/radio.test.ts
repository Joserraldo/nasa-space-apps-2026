import { describe, expect, it } from "vitest";
import type { GameState } from "@solar-shield/contracts";
import { partidaDeMision } from "@solar-shield/engine";
import { MISION_JEZERO, MISION_LUNA_POLO_SUR, MISION_MARTE_POLO_NORTE, MISION_OUTPOST_SORPRESA } from "@solar-shield/missions";
import { UMBRAL_BAJO, avisosDeInicio, avisosDeRadio } from "./radio.js";

const base = (m = MISION_JEZERO): GameState => partidaDeMision(m, "radio-1");

describe("radio de la tripulación", () => {
  it("sin cambios no hay avisos", () => {
    const s = base();
    expect(avisosDeRadio(s, s, MISION_JEZERO)).toEqual([]);
  });

  it("un recurso que cruza el umbral hacia abajo lo avisa su experto, una sola vez", () => {
    const a = base();
    const d = { ...a, tick: a.tick + 1, recursos: { ...a.recursos, energia: UMBRAL_BAJO - 5 } };
    const avisos = avisosDeRadio(a, d, MISION_JEZERO);
    expect(avisos).toContainEqual(expect.objectContaining({ experto: "ingeniera", prioridad: "alerta", lineas: [{ clave: "ui.radio.bajo.energia", vars: { valor: UMBRAL_BAJO - 5 } }] }));
    const e = { ...d, tick: d.tick + 1, recursos: { ...d.recursos, energia: UMBRAL_BAJO - 8 } };
    expect(avisosDeRadio(d, e, MISION_JEZERO).some((x) => x.lineas[0]?.clave === "ui.radio.bajo.energia")).toBe(false);
  });

  it("una avería genérica la avisa la Ingeniera; el micrometeorito lunar usa la voz de la misión", () => {
    const a = base(MISION_LUNA_POLO_SUR);
    const conPanel = { ...a, equipos: { ...a.equipos, panel_solar: "ok" as const, antena: "ok" as const } };
    const roto = { ...conPanel, tick: conPanel.tick + 1, equipos: { ...conPanel.equipos, panel_solar: "averiado" as const } };
    const luna = avisosDeRadio(conPanel, roto, MISION_LUNA_POLO_SUR);
    expect(luna.length).toBeGreaterThan(0);
    expect(luna.every((d) => d.lineas[0]?.clave !== "ui.radio.averia")).toBe(true);
    const antena = { ...conPanel, tick: conPanel.tick + 1, equipos: { ...conPanel.equipos, antena: "averiado" as const } };
    expect(avisosDeRadio(conPanel, antena, MISION_LUNA_POLO_SUR)[0]).toMatchObject({ experto: "ingeniera", lineas: [{ clave: "ui.radio.averia" }] });
  });

  it("al revelarse la tormenta, cada misión trae su voz del paso 7", () => {
    const voz = (m: typeof MISION_JEZERO) => {
      const a = { ...base(m), tick: m.tickTormenta - 1 };
      return avisosDeRadio(a, { ...a, tick: m.tickTormenta }, m).map((d) => d.experto);
    };
    expect(voz(MISION_JEZERO)).toContain("control_mision");
    expect(voz(MISION_LUNA_POLO_SUR)).toContain("control_mision");
    expect(voz(MISION_MARTE_POLO_NORTE)).toContain("ingeniera");
  });

  it("la bienvenida del Outpost es su sorpresa; las demás, Iris", () => {
    expect(avisosDeInicio(MISION_OUTPOST_SORPRESA)[0]?.experto).toBe("ia_base");
    expect(avisosDeInicio(MISION_OUTPOST_SORPRESA)[0]?.lineas[0]?.clave).not.toBe("ui.radio.inicio");
    expect(avisosDeInicio(MISION_JEZERO)[0]?.lineas[0]?.clave).toBe("ui.radio.inicio");
  });
});
