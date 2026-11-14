/** #90: consumo continuo de los módulos construidos, leído de una tabla de diseño. */
import { describe, expect, it } from "vitest";
import { CONSUMO_MODULO_POR_TICK } from "@solar-shield/design";
import { aplicarAccion, consumoDeModulos } from "./acciones.js";
import { partidaDorada } from "./dorada.js";

const TABLA = { invernadero: { energia: -3 }, escudo: { energia: -2, soporte_vital: -1 }, antena: { energia: -1 } };

describe("consumo por tick de los módulos (#90)", () => {
  it("suma solo los módulos que el jugador construyó", () => {
    let s = partidaDorada();
    expect(consumoDeModulos(s, TABLA)).toEqual({}); // nada construido: la antena de la tabla no cuenta
    s = aplicarAccion(s, { tipo: "colocar_modulo", modulo: "invernadero" });
    s = aplicarAccion(s, { tipo: "colocar_modulo", modulo: "escudo" });
    expect(consumoDeModulos(s, TABLA)).toEqual({ energia: -5, soporte_vital: -1 });
  });

  it("un módulo averiado no gasta", () => {
    let s = aplicarAccion(partidaDorada(), { tipo: "colocar_modulo", modulo: "invernadero" });
    s = { ...s, equipos: { ...s.equipos, invernadero: "averiado" } };
    expect(consumoDeModulos(s, TABLA)).toEqual({});
  });

  it("la tabla de diseño está vacía hoy: la ruta dorada no cambia", () => {
    expect(CONSUMO_MODULO_POR_TICK).toEqual({});
    const s = aplicarAccion(partidaDorada(), { tipo: "colocar_modulo", modulo: "invernadero" });
    expect(consumoDeModulos(s)).toEqual({});
  });
});
