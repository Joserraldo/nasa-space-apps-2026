import { describe, expect, it } from "vitest";
import { MISION_JEZERO } from "@solar-shield/missions";
import { aplicarAccion, aterrizar, partidaDorada } from "./index.js";

const ids = (s: ReturnType<typeof partidaDorada>) => s.efectosPendientes.map((e) => e.id);

describe("ids de efectos pendientes", () => {
  it("dos módulos que dan el mismo recurso en el mismo tick no repiten id", () => {
    let s = partidaDorada();
    s = aplicarAccion(s, { tipo: "colocar_modulo", modulo: "panel_solar" });
    s = aplicarAccion(s, { tipo: "colocar_modulo", modulo: "invernadero" });
    s = aplicarAccion(s, { tipo: "colocar_modulo", modulo: "reciclador_agua" });
    expect(s.efectosPendientes.length).toBeGreaterThan(1);
    expect(new Set(ids(s)).size).toBe(ids(s).length);
  });

  it("el primer id conserva su forma de siempre y el repetido lleva sufijo", () => {
    let s = partidaDorada();
    s = aplicarAccion(s, { tipo: "colocar_modulo", modulo: "panel_solar" });
    const primero = ids(s);
    s = aplicarAccion(s, { tipo: "colocar_modulo", modulo: "invernadero" });
    expect(ids(s).slice(0, primero.length)).toEqual(primero);
    expect(ids(s).some((id) => /-2$/.test(id))).toBe(true);
  });

  it("es determinista: la misma secuencia da los mismos ids", () => {
    const jugar = () => {
      let s = aterrizar(partidaDorada(), MISION_JEZERO.sitiosCandidatos[0]!.id);
      s = aplicarAccion(s, { tipo: "colocar_modulo", modulo: "panel_solar" });
      return ids(aplicarAccion(s, { tipo: "colocar_modulo", modulo: "invernadero" }));
    };
    expect(jugar()).toEqual(jugar());
  });
});
