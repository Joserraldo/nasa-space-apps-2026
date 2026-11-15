import { describe, expect, it } from "vitest";
import { MISION_JEZERO } from "@solar-shield/missions";
import { inicial, puedeColocar, reducir, type Juego } from "./reductor.js";

function enModulos(): Juego {
  return reducir(inicial(), { tipo: "fase", fase: "modulos" });
}

describe("reductor de la pantalla", () => {
  it("colocar un módulo cobra una sola vez aunque el evento llegue dos veces", () => {
    const uno = reducir(enModulos(), { tipo: "modulo", modulo: "panel_solar" });
    const dos = reducir(uno, { tipo: "modulo", modulo: "panel_solar" });
    expect(dos).toBe(uno);
    expect(dos.colocados).toEqual(["panel_solar"]);
    expect(dos.estado.recursos.energia).toBeLessThan(inicial().estado.recursos.energia);
  });

  it("respeta el límite y la lista de módulos de la misión", () => {
    let j = enModulos();
    j = reducir(j, { tipo: "modulo", modulo: "panel_solar" });
    j = reducir(j, { tipo: "modulo", modulo: "escudo" });
    expect(j.colocados).toHaveLength(MISION_JEZERO.modulosAColocar);
    const tercero = reducir(j, { tipo: "modulo", modulo: "invernadero" });
    expect(tercero).toBe(j);
    expect(puedeColocar(enModulos(), "bateria")).toBe(false);
    expect(puedeColocar(enModulos(), "ia_base")).toBe(false);
  });

  it("no coloca módulos fuera del paso 4", () => {
    const j = reducir(inicial(), { tipo: "modulo", modulo: "panel_solar" });
    expect(j.colocados).toEqual([]);
  });

  it("en pausa el reloj no avanza", () => {
    let j = reducir(enModulos(), { tipo: "fase", fase: "base" });
    j = reducir(j, { tipo: "pausa", pausado: true });
    expect(reducir(j, { tipo: "tick" })).toBe(j);
  });

  it("base -> tormenta -> decisión -> base, y la tormenta se anuncia una sola vez", () => {
    let j = reducir(enModulos(), { tipo: "fase", fase: "base" });
    let guardia = 0;
    while (j.fase === "base" && guardia++ < 20) {
      j = reducir(j, { tipo: "pausa", pausado: false });
      j = reducir(j, { tipo: "tick" });
    }
    expect(j.fase).toBe("tormenta");
    expect(j.estado.tick).toBe(MISION_JEZERO.tickTormenta);
    expect(j.estado.pausado).toBe(true);
    j = reducir(j, { tipo: "acciones", acciones: [{ tipo: "refugiarse" }] });
    expect(j.fase).toBe("base");
    expect(j.estado.pausado).toBe(false);
    j = reducir(j, { tipo: "tick" });
    expect(j.fase).not.toBe("tormenta");
  });

  it("cuando el motor termina la partida, pasa al final con ese resultado", () => {
    let j = reducir(enModulos(), { tipo: "fase", fase: "base" });
    let guardia = 0;
    while (j.fase !== "final" && guardia++ < 80) {
      if (j.fase === "tormenta") j = reducir(j, { tipo: "acciones", acciones: [{ tipo: "esperar" }] });
      j = reducir(j, { tipo: "pausa", pausado: false });
      j = reducir(j, { tipo: "tick" });
    }
    expect(j.fase).toBe("final");
    expect(j.estado.resultado).not.toBe("en_curso");
  });

  it("nueva partida limpia módulos y vuelve al inicio", () => {
    const j = reducir(reducir(enModulos(), { tipo: "modulo", modulo: "antena" }), { tipo: "nueva" });
    expect(j.fase).toBe("inicio");
    expect(j.colocados).toEqual([]);
    expect(j.estado.tick).toBe(0);
  });

  it("elegir sitio aplica aterrizar() una sola vez y deja 55/74/52 tras panel y escudo", () => {
    const sitio = {
      id: "llanura-central",
      nombreKey: "datos.terreno.sitio.llanura-central.nombre",
      porCriterio: { plano: 0.3, luz: 0.3, blindaje: 0.2 },
      rangoKey: "rango.bueno",
      total: 0.8,
    };
    expect(reducir(inicial(), { tipo: "sitio", sitio }).fase).toBe("inicio");
    let j = reducir(reducir(inicial(), { tipo: "fase", fase: "sitio" }), { tipo: "sitio", sitio });
    expect(j.fase).toBe("modulos");
    const trasAterrizar = j;
    j = reducir(j, { tipo: "sitio", sitio: { ...sitio, id: "otro" } });
    expect(j).toBe(trasAterrizar);
    j = reducir(j, { tipo: "modulo", modulo: "panel_solar" });
    j = reducir(j, { tipo: "modulo", modulo: "escudo" });
    expect(j.estado.recursos).toEqual({ energia: 55, soporte_vital: 74, blindaje: 52 });
    expect(j.colocados).toEqual(["panel_solar", "escudo"]);
  });

  it("rechaza colocar módulos si el motor indica recursos insuficientes", () => {
    const base = enModulos();
    const sinEnergia: Juego = {
      ...base,
      estado: { ...base.estado, recursos: { ...base.estado.recursos, energia: 4 } },
    };
    expect(puedeColocar(sinEnergia, "panel_solar")).toBe(false);
    expect(reducir(sinEnergia, { tipo: "modulo", modulo: "panel_solar" })).toBe(sinEnergia);
  });

  it("dilema del paso 6 usa elegirDilema(): refugio apaga el invernadero solo si se construyo", () => {
    let conInv = enModulos();
    conInv = reducir(conInv, { tipo: "modulo", modulo: "panel_solar" });
    conInv = reducir(conInv, { tipo: "modulo", modulo: "invernadero" });
    conInv = reducir(conInv, { tipo: "fase", fase: "tormenta" });
    const trasConInv = reducir(conInv, { tipo: "dilema", opcionId: "refugio_y_apagar_invernadero" });
    expect(trasConInv.fase).toBe("base");
    expect(trasConInv.estado.pausado).toBe(false);
    expect(trasConInv.estado.efectosPendientes.some((c) => c.descripcionKey === "causa.apagar_invernadero")).toBe(true);

    let sinInv = enModulos();
    sinInv = reducir(sinInv, { tipo: "modulo", modulo: "panel_solar" });
    sinInv = reducir(sinInv, { tipo: "modulo", modulo: "escudo" });
    sinInv = reducir(sinInv, { tipo: "fase", fase: "tormenta" });
    const trasSinInv = reducir(sinInv, { tipo: "dilema", opcionId: "refugio_y_apagar_invernadero" });
    expect(trasSinInv.estado.causas.some((c) => c.descripcionKey === "causa.refugiarse")).toBe(true);
    expect(trasSinInv.estado.efectosPendientes.some((c) => c.descripcionKey === "causa.apagar_invernadero")).toBe(false);
  });
});
