import { describe, expect, it } from "vitest";
import { MISION_JEZERO } from "@solar-shield/missions";
import { aplicarAccion, avanzarTick } from "./acciones.js";
import { elegirDilema } from "./dilema.js";
import { partidaDorada } from "./dorada.js";

const conModulos = (...m: ("panel_solar" | "invernadero" | "escudo")[]) =>
  m.reduce((s, x) => aplicarAccion(s, { tipo: "colocar_modulo", modulo: x }), partidaDorada());

const totalExtra = (s: ReturnType<typeof partidaDorada>) =>
  [...s.causas, ...s.efectosPendientes].filter((c) => c.descripcionKey === "causa.apagar_invernadero");

describe("dilema del paso 6 en el motor (#88, plan B)", () => {
  it("refugio CON invernadero construido: además se pierde la comida del invernadero", () => {
    const s = elegirDilema(conModulos("panel_solar", "invernadero"), "refugio_y_apagar_invernadero");
    expect(s.causas.some((c) => c.descripcionKey === "causa.refugiarse")).toBe(true);
    const extra = totalExtra(s);
    expect(extra.length).toBeGreaterThan(0);
    expect(extra.every((c) => c.recurso === "soporte_vital" && (c.delta ?? 0) < 0)).toBe(true);
    const esperado = MISION_JEZERO.dilemaPaso6.opciones.find((o) => o.id === "refugio_y_apagar_invernadero")!.extra!.retrasado.soporte_vital;
    expect(extra.reduce((a, c) => a + (c.delta ?? 0), 0)).toBe(esperado);
  });

  it("refugio SIN invernadero: solo el refugio, sin extra", () => {
    const s = elegirDilema(conModulos("panel_solar", "escudo"), "refugio_y_apagar_invernadero");
    expect(s.causas.some((c) => c.descripcionKey === "causa.refugiarse")).toBe(true);
    expect(totalExtra(s)).toEqual([]);
  });

  it("escudo y aguantar aplican solo su acción", () => {
    const base = conModulos("panel_solar", "invernadero");
    expect(elegirDilema(base, "subir_escudo").causas.some((c) => c.descripcionKey === "causa.subir_escudo")).toBe(true);
    expect(totalExtra(elegirDilema(base, "aguantar"))).toEqual([]);
  });

  it("opción desconocida no cambia nada", () => {
    const s = partidaDorada();
    expect(elegirDilema(s, "no-existe")).toBe(s);
  });

  it("el efecto extra llega con el retraso y es determinista", () => {
    const jugar = () => {
      let s = elegirDilema(conModulos("panel_solar", "invernadero"), "refugio_y_apagar_invernadero");
      for (let i = 0; i < 4; i++) s = avanzarTick(s);
      return s;
    };
    const s = jugar();
    expect(s.causas.some((c) => c.descripcionKey === "causa.apagar_invernadero" && (c.delta ?? 0) < 0)).toBe(true);
    expect(jugar()).toEqual(s);
  });
});
