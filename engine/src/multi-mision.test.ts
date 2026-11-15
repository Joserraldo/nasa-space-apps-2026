/**
 * #152 (parte motor): el motor recibe la misión como último parámetro opcional (por defecto Jezero).
 * Aquí se prueba con una misión construida en el test, distinta de Jezero.
 */
import { describe, expect, it } from "vitest";
import { MISION_JEZERO, type Mision } from "@solar-shield/missions";
import { aplicarAccion, aterrizar, avanzarTick, puedeAplicar, puedeColocar } from "./acciones.js";
import { elegirDilema } from "./dilema.js";
import { partidaDeMision, partidaDorada, paso, tormentaActiva } from "./dorada.js";
import { tormentaEnCurso } from "./tormenta.js";

const OTRA: Mision = {
  ...MISION_JEZERO,
  id: "prueba-otra",
  sitio: "luna_polo_sur",
  objetivo: "cultivar",
  dificultad: "dificil",
  tormentaId: "2024-05-11-x58",
  averiaInicial: "antena",
  modulosDisponibles: ["reciclador_agua", "invernadero", "antena"],
  modulosAColocar: 1,
  tickTormenta: 6,
  sitiosCandidatos: [
    { id: "sitio-prueba", aterrizaje: { inmediato: { energia: -7 }, retrasado: { blindaje: 4 } }, porQueKey: "x" },
  ],
  dilemaPaso6: {
    ...MISION_JEZERO.dilemaPaso6,
    opciones: [{ id: "solo_refugio", accion: { tipo: "refugiarse" }, defiende: null, textoKey: "x" }],
  },
};

describe("motor multi-misión (#152)", () => {
  it("partidaDorada() es partidaDeMision(Jezero) sin cambios", () => {
    expect(partidaDorada()).toEqual(partidaDeMision(MISION_JEZERO));
  });

  it("partidaDeMision usa sitio, dificultad, avería, objetivo y tormenta de la misión", () => {
    const s = partidaDeMision(OTRA);
    expect(s.sitio).toBe("luna_polo_sur");
    expect(s.dificultad).toBe("dificil");
    expect(s.objetivo).toBe("cultivar");
    expect(s.equipos.antena).toBe("averiado");
    expect(s.tormenta?.id).toBe("2024-05-11-x58");
  });

  it("tormenta: respeta el tickTormenta recibido", () => {
    const s = partidaDeMision(OTRA);
    expect(tormentaActiva({ ...s, tick: 3 })).toBe(true); // Jezero (por defecto)
    expect(tormentaActiva({ ...s, tick: 3 }, OTRA)).toBe(false);
    expect(tormentaActiva({ ...s, tick: 6 }, OTRA)).toBe(true);
    expect(tormentaEnCurso({ ...s, tick: 3 })).toBe(true);
    expect(tormentaEnCurso({ ...s, tick: 3 }, OTRA)).toBe(false);
    expect(tormentaEnCurso({ ...s, tick: 6 }, OTRA)).toBe(true);
  });

  it("módulos: solo los de la misión y como máximo modulosAColocar", () => {
    let s = partidaDeMision(OTRA);
    expect(puedeColocar(s, "panel_solar", OTRA)).toBe(false);
    expect(puedeColocar(s, "panel_solar")).toBe(true);
    expect(puedeAplicar(s, { tipo: "colocar_modulo", modulo: "panel_solar" }, OTRA)).toEqual({ ok: false, motivo: "modulo_no_permitido" });
    expect(aplicarAccion(s, { tipo: "colocar_modulo", modulo: "panel_solar" }, OTRA)).toBe(s);
    s = aplicarAccion(s, { tipo: "colocar_modulo", modulo: "invernadero" }, OTRA);
    expect(s.equipos.invernadero).toBe("ok");
    expect(puedeColocar(s, "antena", OTRA)).toBe(false); // ya colocó 1 (el máximo)
  });

  it("aterrizar: solo sitios de la misión", () => {
    const s = partidaDeMision(OTRA);
    expect(aterrizar(s, "llanura-central", OTRA)).toBe(s);
    const a = aterrizar(s, "sitio-prueba", OTRA);
    expect(a.recursos.energia).toBe(s.recursos.energia - 7);
    expect(a.efectosPendientes.some((e) => e.descripcionKey === "causa.aterrizaje")).toBe(true);
  });

  it("dilema: usa las opciones de la misión", () => {
    const s = partidaDeMision(OTRA);
    expect(elegirDilema(s, "refugio_y_apagar_invernadero", OTRA)).toBe(s);
    expect(elegirDilema(s, "solo_refugio", OTRA)).not.toBe(s);
  });

  it("misma semilla y misma misión => misma partida", () => {
    const jugar = (semilla: string) => {
      let s = aterrizar(partidaDeMision(OTRA, semilla), "sitio-prueba", OTRA);
      s = paso(s, { tipo: "colocar_modulo", modulo: "reciclador_agua" }, OTRA);
      for (let i = 0; i < 8; i++) s = avanzarTick(s, OTRA);
      return s;
    };
    expect(jugar("abc")).toEqual(jugar("abc"));
    expect(partidaDeMision(OTRA, "abc")).toEqual(partidaDeMision(OTRA, "abc"));
    expect(partidaDeMision(OTRA, "abc").rngEstado).not.toBe(partidaDeMision(OTRA, "xyz").rngEstado);
  });

  it("tormenta fuera del catálogo curado: falla fuerte", () => {
    expect(() => partidaDeMision({ ...OTRA, tormentaId: "no-existe" })).toThrow(/catálogo curado/);
  });
});
