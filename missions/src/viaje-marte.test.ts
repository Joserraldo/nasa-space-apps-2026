import { describe, expect, it } from "vitest";
import { eventosCurados } from "@solar-shield/data";
import { MISION_VIAJE_MARTE as M } from "./viaje-marte.js";
import { TEXTOS_VIAJE_MARTE as T } from "./textos.js";

describe("viaje a Marte: datos", () => {
  it("usa una tormenta curada, el sitio de la nave y el crucero a Marte", () => {
    expect(eventosCurados.some((e) => e.id === M.tormentaId)).toBe(true);
    expect(M.sitio).toBe("outpost_sorpresa");
  });

  it("la intro ofrece solo refugio o escudo, y el dilema de la tormenta no repite esa pregunta", () => {
    expect(M.decisionInicial.opciones.map((o) => o.accion.tipo)).toEqual(["refugiarse", "subir_escudo"]);
    for (const o of M.dilemaPaso6.opciones) expect(["refugiarse", "subir_escudo"]).not.toContain(o.accion.tipo);
  });

  it("ningún texto menciona la Luna y todos tienen 12 palabras como máximo", () => {
    for (const idioma of ["en", "es"] as const)
      for (const [clave, texto] of Object.entries(T[idioma])) {
        expect(texto, clave).not.toMatch(/\bmoon\b|\bluna\b|artemis|crater/i);
        expect(texto.split(/\s+/).length, clave).toBeLessThanOrEqual(12);
      }
  });

  it("cada clave que usa la misión tiene texto en los dos idiomas", () => {
    const claves = JSON.stringify(M).match(/(mision|causa)\.viaje\.[a-z0-9_.]+/g)!;
    for (const idioma of ["en", "es"] as const) expect(claves.filter((k) => !T[idioma][k]), idioma).toEqual([]);
  });
});
