import { describe, expect, it } from "vitest";
import { partidaDorada } from "@solar-shield/engine";
import en from "../i18n/en.json";
import es from "../i18n/es.json";
import { avisosAntesDeModulos } from "./index.js";

// Aviso de tormenta ANTES de elegir módulos (paso 4): la partida dorada trae la tormenta curada
// 2024-05-20-marte en el estado desde el tick 0.
const s = partidaDorada();

describe("aviso de tormenta antes de elegir módulos", () => {
  it("sin tormenta no hay avisos", () => {
    expect(avisosAntesDeModulos({ tormenta: null })).toEqual([]);
  });

  it("con tormenta avisa la Meteoróloga, la Doctora y la Ingeniera, en ese orden", () => {
    const avisos = avisosAntesDeModulos(s);
    expect(avisos).toHaveLength(3);
    expect(avisos.map((a) => a.experto)).toEqual(["meteorologa", "doctora", "ingeniera"]);
  });

  it("el primer aviso es una alerta con la fuente de la tormenta", () => {
    const [primero] = avisosAntesDeModulos(s);
    expect(primero?.prioridad).toBe("alerta");
    expect(primero?.fuente).toEqual(s.tormenta!.fuente);
  });

  it("no usa la clave del texto que escribe otra persona", () => {
    const claves = avisosAntesDeModulos(s).flatMap((d) => d.lineas.map((l) => l.clave));
    expect(claves).not.toContain("agentes.meteorologa.pronostico.preparar");
  });

  it("todas las claves de todas las líneas existen en inglés y español", () => {
    for (const d of avisosAntesDeModulos(s)) {
      for (const l of d.lineas) {
        expect(en[l.clave as keyof typeof en], `en ${l.clave}`).toBeDefined();
        expect(es[l.clave as keyof typeof es], `es ${l.clave}`).toBeDefined();
      }
    }
  });
});
