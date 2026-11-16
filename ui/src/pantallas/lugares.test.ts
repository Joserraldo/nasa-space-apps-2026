import { describe, expect, it } from "vitest";
import { MISION_JEZERO } from "@solar-shield/missions";
import { puedeAplicar } from "@solar-shield/engine";
import { LUGARES } from "../escena/mundo.js";
import { traducir } from "../i18n.js";
import { inicial, reducir, type Juego } from "../juego/reductor.js";
import { averiaIrisRevelada, mundoBloqueado, objetivoDeLaBase, pasoDeLaBase, usoDelLugar } from "./lugares.js";

/** De la portada a la base viva (sitio y dos módulos), como la ruta dorada. */
function enBase(): Juego {
  let j = reducir(inicial(), { tipo: "fase", fase: "modulos" });
  j = reducir(j, { tipo: "modulo", modulo: MISION_JEZERO.modulosDisponibles[0]! });
  j = reducir(j, { tipo: "modulo", modulo: MISION_JEZERO.modulosDisponibles[1]! });
  return reducir(j, { tipo: "fase", fase: "base" });
}
/** Avanza el reloj hasta que llegue la tormenta. */
function conTormenta(): Juego {
  let j = enBase();
  for (let i = 0; i < 60 && j.fase !== "tormenta"; i++) j = reducir(reducir(j, { tipo: "pausa", pausado: false }), { tipo: "tick" });
  return j;
}

describe("usar un lugar de la base (ESCENAS §3.2)", () => {
  it("cada lugar con acción abre el plan de esa acción y no la aplica", () => {
    const { estado } = enBase();
    expect(usoDelLugar("escudo", estado).accion).toEqual({ tipo: "subir_escudo", nivel: 1 });
    expect(usoDelLugar("panel_solar", estado).accion).toEqual({ tipo: "salida_exterior", objetivo: "panel_solar" });
    expect(usoDelLugar("habitat", estado)).toMatchObject({ accion: { tipo: "refugiarse" }, consulta: { experto: "doctora" } });
    expect(usoDelLugar("sensor", estado)).toMatchObject({ accion: null, consulta: { experto: "meteorologa" } });
  });

  it("la mesa espera un turno sin tormenta y envía la telemetría con la tormenta encima", () => {
    expect(usoDelLugar("mesa", enBase().estado).accion).toEqual({ tipo: "esperar" });
    const j = conTormenta();
    expect(j.fase).toBe("tormenta");
    expect(usoDelLugar("mesa", j.estado).accion).toEqual({ tipo: "enviar_telemetria" });
  });

  it("el taller repara a Iris solo si está dañada; si no, consulta a la Ingeniera", () => {
    const { estado } = enBase();
    const danada = { ...estado, iaBase: "danada" as const };
    const sana = { ...estado, iaBase: "pistas" as const };
    expect(usoDelLugar("taller", danada)).toMatchObject({ accion: { tipo: "reparar", equipo: "ia_base" }, consulta: { experto: "ingeniera" } });
    expect(usoDelLugar("taller", sana)).toMatchObject({ accion: null, consulta: { experto: "ingeniera" } });
  });

  it("los lugares sin acción solo abren la consulta, y todas las etiquetas existen en los dos idiomas", () => {
    const { estado } = enBase();
    for (const l of LUGARES) {
      const uso = usoDelLugar(l.id, estado);
      expect(uso.accion !== null || uso.consulta !== null).toBe(true);
      for (const idioma of ["en", "es"] as const) {
        expect(traducir(idioma, uso.labelKey)).not.toBe(uso.labelKey);
        expect(traducir(idioma, `${uso.labelKey}.corto`)).not.toBe(`${uso.labelKey}.corto`);
      }
    }
    for (const l of ["reciclador_agua", "invernadero", "antena", "banco"] as const) {
      expect(usoDelLugar(l, estado)).toMatchObject({ accion: null, consulta: { experto: "ia_base" } });
    }
  });

  it("toda acción propuesta es una acción que el motor conoce (puedeAplicar responde)", () => {
    const { estado } = enBase();
    for (const l of LUGARES) {
      const a = usoDelLugar(l.id, estado).accion;
      if (a) expect(typeof puedeAplicar(estado, a).ok).toBe("boolean");
    }
  });
});

describe("bloqueo del mundo", () => {
  const nada = { dialogo: false, plan: false, registro: false, panel: false, novedad: false, campo: false };
  it("libre solo si no hay nada abierto ni un campo de texto activo", () => {
    expect(mundoBloqueado(nada)).toBe(false);
    for (const k of Object.keys(nada) as (keyof typeof nada)[]) expect(mundoBloqueado({ ...nada, [k]: true })).toBe(true);
  });
});

describe("objetivo de la base (guía de Iris)", () => {
  it("nombra un lugar real de la tabla y se traduce entero en los dos idiomas", () => {
    for (const j of [enBase(), conTormenta()]) {
      const o = objetivoDeLaBase(j.estado);
      if (o.lugar) expect(LUGARES.map((l) => l.id)).toContain(o.lugar);
      for (const idioma of ["en", "es"] as const) {
        const texto = traducir(idioma, o.labelKey, o.vars);
        expect(texto).not.toMatch(/[{}]|ui\.|agentes\./);
      }
    }
  });
  it("al entrar a la base (turno 0) el objetivo es el del paso 4 y Iris no pide reparación (#15 del plan)", () => {
    const { estado } = enBase();
    expect(estado.tick).toBe(0);
    expect(estado.iaBase).toBe("danada"); // avería guionada: arranca dañada, se revela en el paso 6
    expect(pasoDeLaBase(estado)).toBe(4);
    expect(averiaIrisRevelada(estado)).toBe(false);
    const o = objetivoDeLaBase(estado);
    expect(o.labelKey).toBe("ui.hud.objetivo.experto");
    expect(o.lugar).toBe("taller");
    expect(o.vars).toMatchObject({ expertoKey: "agentes.nombre.ingeniera" });
  });
  it("la avería de Iris se revela desde el paso de la misión, no antes", () => {
    const j = conTormenta();
    expect(pasoDeLaBase(j.estado)).toBeGreaterThanOrEqual(MISION_JEZERO.averiaIris.pasoRevelacion);
    expect(averiaIrisRevelada(j.estado)).toBe(true);
    expect(objetivoDeLaBase(j.estado)).toMatchObject({ labelKey: "ui.hud.objetivo.averia", lugar: "taller" });
  });
  it("sin Iris (offline) vuelve al objetivo general", () => {
    const o = objetivoDeLaBase({ ...enBase().estado, iaBase: "offline" });
    expect(o).toEqual({ labelKey: "ui.comun.hud.objetivo.base", lugar: null });
  });
});
