import { describe, expect, it } from "vitest";
import { aplicarAccion, partidaDorada } from "@solar-shield/engine";
import en from "../i18n/en.json";
import es from "../i18n/es.json";
import { avisoUsos, compararOpciones, conAvisoUsos, queSiMatematico, sinUsosMatematico } from "./index.js";

describe("Matemático ¿Y si…?", () => {
  it("lee la diferencia que calcula el motor y deja la decisión al jugador", () => {
    const s = partidaDorada();
    const accion = { tipo: "redistribuir_energia", hacia: "blindaje", cantidad: 25 } as const;
    const despues = aplicarAccion(s, accion);
    const d = queSiMatematico(accion, s.recursos, despues.recursos);
    expect(d.experto).toBe("matematico");
    expect(d.accion).toEqual(accion);
    const baja = d.lineas.find((x) => x.clave === "agentes.matematico.baja" && x.vars?.["recursoKey"] === "agentes.recurso.energia");
    expect(baja?.vars).toMatchObject({ desde: Math.round(s.recursos.energia), hasta: Math.round(despues.recursos.energia) });
    expect(d.lineas.at(-1)?.clave).toBe("agentes.matematico.decides");
  });
  it("si nada cambia lo dice, sin inventar cifras", () => {
    const r = partidaDorada().recursos;
    const d = queSiMatematico({ tipo: "refugiarse" }, r, r);
    expect(d.lineas.map((x) => x.clave)).toEqual(["agentes.matematico.calculo", "agentes.matematico.igual", "agentes.matematico.decides"]);
  });
});

describe("Matemático compara las opciones de una escena", () => {
  const s = partidaDorada();
  const opciones = [{ tipo: "refugiarse" }, { tipo: "subir_escudo", nivel: 2 }, { tipo: "esperar" }] as const;
  const d = compararOpciones(s, opciones.map((accion) => ({ accion, despues: aplicarAccion(s, accion) })));
  const claves = d.lineas.map((l) => l.clave);

  it("una cabecera por opción, en orden, y no elige por el jugador", () => {
    expect(d.lineas.filter((l) => l.clave === "agentes.matematico.opcion").map((l) => l.vars)).toEqual([
      { n: 1, accionKey: "agentes.accion.refugiarse" },
      { n: 2, accionKey: "agentes.accion.subir_escudo" },
      { n: 3, accionKey: "agentes.accion.esperar" },
    ]);
    expect(d.accion).toBeUndefined();
    expect(claves.at(-1)).toBe("agentes.matematico.decides");
  });

  it("separa lo que cambia ya de lo que el motor dejó para después", () => {
    const luego = d.lineas.filter((l) => l.clave.startsWith("agentes.matematico.luego"));
    expect(luego.length).toBeGreaterThan(0);
    for (const l of luego) expect(Number(l.vars?.["ticks"])).toBeGreaterThan(0);
    expect(claves).toContain("agentes.matematico.baja");
  });

  it("todas las claves existen en en y es", () => {
    for (const l of d.lineas) {
      expect(en[l.clave as keyof typeof en], l.clave).toBeDefined();
      expect(es[l.clave as keyof typeof es], l.clave).toBeDefined();
      const k = l.vars?.["accionKey"];
      if (typeof k === "string") expect(en[k as keyof typeof en] && es[k as keyof typeof es], k).toBeTruthy();
    }
  });
});

describe("Matemático: usos limitados (el contador lo lleva ui)", () => {
  const r = partidaDorada().recursos;
  const base = queSiMatematico({ tipo: "refugiarse" }, r, r);
  it("ilimitado o con muchos usos no avisa", () => {
    expect(avisoUsos(null)).toBeNull();
    expect(avisoUsos(5)).toBeNull();
    expect(conAvisoUsos(base, null)).toBe(base);
  });
  it("con pocos avisa cuántos quedan; con 0 dice que fue el último", () => {
    expect(avisoUsos(2)).toEqual({ clave: "agentes.matematico.usos.pocos", vars: { n: 2 } });
    expect(avisoUsos(1)?.vars).toEqual({ n: 1 });
    expect(avisoUsos(0)?.clave).toBe("agentes.matematico.usos.ultimo");
  });
  it("el aviso va antes del cierre 'tú decides' y las claves existen", () => {
    const d = conAvisoUsos(base, 0);
    expect(d.lineas.slice(-2).map((l) => l.clave)).toEqual(["agentes.matematico.usos.ultimo", "agentes.matematico.decides"]);
    for (const l of [...d.lineas, ...sinUsosMatematico().lineas]) {
      expect(en[l.clave as keyof typeof en], l.clave).toBeDefined();
      expect(es[l.clave as keyof typeof es], l.clave).toBeDefined();
    }
  });
});
