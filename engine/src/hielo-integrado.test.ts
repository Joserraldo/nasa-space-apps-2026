import { describe, expect, it } from "vitest";
import { COSTOS_ACCION, RETRASO_POR_DIFICULTAD } from "@solar-shield/design";
import { MISION_JEZERO, MISION_LUNA_POLO_SUR as LUNA, type Mision } from "@solar-shield/missions";
import { aplicarAccion, aplicarEfecto, avanzarTick } from "./acciones.js";
import { elegirDilema } from "./dilema.js";
import { partidaDeMision, partidaDorada } from "./dorada.js";

const opcion = LUNA.dilemaPaso6.opciones.find(o => o.id === "terminar_expedicion")!;
function expedicion(semilla: string) {
  let s = elegirDilema(partidaDeMision(LUNA, semilla), opcion.id, LUNA);
  for (let i = 0; i < RETRASO_POR_DIFICULTAD[LUNA.dificultad].max; i++) s = avanzarTick(s, LUNA);
  return s;
}

describe("expedición al hielo con el motor integrado", () => {
  it.each(["hielo", "jezero-2024-05-20", "luna-sur-integrada"])("no agenda ni entrega energía transitoria: %s", semilla => {
    const inicial = partidaDeMision(LUNA, semilla), copia = structuredClone(inicial);
    let s = elegirDilema(inicial, opcion.id, LUNA);
    expect(inicial).toEqual(copia);
    expect(s.recursos.energia).toBe(inicial.recursos.energia);
    expect(s.recursos.blindaje).toBe(inicial.recursos.blindaje + COSTOS_ACCION.salida_exterior.inmediato.blindaje!);
    expect(s.recursos.soporte_vital).toBe(inicial.recursos.soporte_vital + COSTOS_ACCION.salida_exterior.inmediato.soporte_vital!);
    expect(s.efectosPendientes).toHaveLength(1);
    expect(s.efectosPendientes[0]).toMatchObject({ recurso: "soporte_vital", delta: opcion.extra!.retrasado.soporte_vital, descripcionKey: "causa.salida_exterior" });
    for (let i = 0; i < RETRASO_POR_DIFICULTAD[LUNA.dificultad].max; i++) {
      const energia = s.recursos.energia;
      s = avanzarTick(s, LUNA);
      expect(s.recursos.energia).toBeLessThanOrEqual(energia);
    }
    expect(s.causas.some(c => c.descripcionKey === "causa.salida_exterior" && c.recurso === "soporte_vital" && c.delta === opcion.extra!.retrasado.soporte_vital)).toBe(true);
    expect([...s.causas, ...s.efectosPendientes].some(c => c.descripcionKey === "causa.apagar_invernadero")).toBe(false);
    expect(s.efectosPendientes).toEqual([]);
    expect(s).toEqual(expedicion(semilla));
  });

  it("rechaza el costo inmediato combinado antes de cambiar estado o RNG", () => {
    const inicial = partidaDeMision(LUNA, "hielo");
    const m: Mision = { ...LUNA, dilemaPaso6: { ...LUNA.dilemaPaso6, opciones: [{
      ...opcion, extra: { ...opcion.extra!, inmediato: { energia: -inicial.recursos.energia } },
    }] } };
    expect(elegirDilema(inicial, opcion.id, m)).toBe(inicial);
  });

  it("valida la suma inmediata, no un costo parcial compensado", () => {
    const inicial = { ...partidaDeMision(LUNA, "hielo"), recursos: { energia: 65, soporte_vital: 75, blindaje: 1 } };
    const m: Mision = { ...LUNA, dilemaPaso6: { ...LUNA.dilemaPaso6, opciones: [{
      ...opcion, extra: { ...opcion.extra!, inmediato: { blindaje: -COSTOS_ACCION.salida_exterior.inmediato.blindaje! } },
    }] } };
    const s = elegirDilema(inicial, opcion.id, m);
    expect(s).not.toBe(inicial);
    expect(s.recursos.blindaje).toBe(inicial.recursos.blindaje);
  });

  it("conserva exactamente el camino y el RNG del extra disjunto de Jezero", () => {
    let inicial = aplicarAccion(partidaDorada(), { tipo: "colocar_modulo", modulo: "panel_solar" });
    inicial = aplicarAccion(inicial, { tipo: "colocar_modulo", modulo: "invernadero" });
    const refugio = MISION_JEZERO.dilemaPaso6.opciones.find(o => o.id === "refugio_y_apagar_invernadero")!;
    const previo = aplicarEfecto(aplicarAccion(inicial, refugio.accion), refugio.extra!, "causa.apagar_invernadero", `dilema-${refugio.id}`);
    expect(elegirDilema(inicial, refugio.id)).toEqual(previo);
  });
});
