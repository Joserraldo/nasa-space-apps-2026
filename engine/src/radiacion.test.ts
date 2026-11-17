/**
 * P0.1: dosis de radiación aproximada de la tripulación (CrewMember.dosisMSv).
 * La partida dorada es Jezero con la tormenta real de mayo de 2024 (factor RAD 19,4)
 * y tormenta en curso en los ticks 3, 4 y 5.
 */
import { describe, expect, it } from "vitest";
import type { GameState } from "@solar-shield/contracts";
import { referenciaDosis } from "@solar-shield/data";
import {
  FACTOR_REFUGIO,
  FACTOR_TORMENTA_SIN_MEDICION,
  REDUCCION_MAX_BLINDAJE,
  REFERENCIA_FONDO_DOSIS,
  TICKS_POR_DIA,
} from "@solar-shield/design";
import { MISION_LUNA_VISIBLE } from "@solar-shield/missions";
import { aplicarAccion, avanzarTick } from "./acciones.js";
import { elegirDilema } from "./dilema.js";
import { partidaDeMision, partidaDorada } from "./dorada.js";
import { senalDeDano } from "./orbita.js";
import {
  acumularDosis,
  dosisDelTurno,
  dosisMaximaTripulacion,
  enRefugio,
  multiplicadorTormenta,
} from "./radiacion.js";
import { tormentaEnCurso } from "./tormenta.js";

const base = (tick: number, blindaje: number, causas: GameState["causas"] = []): GameState => ({
  ...partidaDorada(),
  tick,
  recursos: { ...partidaDorada().recursos, blindaje },
  causas,
});

const refugio = (tick: number): GameState["causas"][number] => ({
  tick,
  origen: "decision",
  descripcionKey: "causa.refugiarse",
  accion: { tipo: "refugiarse" },
});

const salida = (tick: number): GameState["causas"][number] => ({
  tick,
  origen: "decision",
  descripcionKey: "causa.salida_exterior",
  accion: { tipo: "salida_exterior", objetivo: "panel_solar" },
});

const fondoJezero = (): number => referenciaDosis(REFERENCIA_FONDO_DOSIS.marte_jezero).valor / TICKS_POR_DIA;

const ingeniera = (estado: GameState) => estado.tripulacion.find((t) => t.id === "ingeniera")!;

describe("P0.1 dosis de radiación", () => {
  it("sin tormenta el multiplicador es 1 y la dosis es el fondo protegido por el blindaje", () => {
    const estado = base(1, 60);
    expect(tormentaEnCurso(estado)).toBe(false);
    expect(multiplicadorTormenta(estado)).toBe(1);
    expect(dosisDelTurno(estado)).toBeCloseTo(fondoJezero() * (1 - REDUCCION_MAX_BLINDAJE * 0.6), 9);

    const sinEvento = { ...base(4, 60), tormenta: null };
    expect(multiplicadorTormenta(sinEvento)).toBe(1);
    expect(dosisDelTurno(sinEvento)).toBeCloseTo(fondoJezero() * (1 - REDUCCION_MAX_BLINDAJE * 0.6), 9);
  });

  it("con tormenta, más blindaje da menos dosis y Jezero usa el factor medido por RAD", () => {
    const con80 = base(4, 80);
    const con50 = base(4, 50);
    const factor = con80.tormenta!.medicionMarte!.factor;
    expect(factor).toBe(19.4);

    expect(multiplicadorTormenta(con80)).toBeCloseTo(factor, 9);
    expect(dosisDelTurno(con80)).toBeCloseTo(fondoJezero() * factor * (1 - REDUCCION_MAX_BLINDAJE * 0.8), 9);
    expect(dosisDelTurno(con80)).toBeLessThan(dosisDelTurno(con50));
  });

  it("el refugio multiplica la dosis por FACTOR_REFUGIO", () => {
    const conRefugio = base(4, 60, [refugio(3)]);
    const sinRefugio = base(4, 60);
    expect(enRefugio(conRefugio)).toBe(true);
    expect(dosisDelTurno(conRefugio)).toBeCloseTo(dosisDelTurno(sinRefugio) * FACTOR_REFUGIO, 9);
  });

  it("el refugio empieza el turno siguiente y dura dos turnos", () => {
    expect(enRefugio(base(3, 60, [refugio(3)]))).toBe(false);
    expect(enRefugio(base(4, 60, [refugio(3)]))).toBe(true);
    expect(enRefugio(base(5, 60, [refugio(3)]))).toBe(true);
    expect(enRefugio(base(6, 60, [refugio(3)]))).toBe(false);
  });

  it("una salida_exterior termina el refugio", () => {
    const estado = base(5, 60, [refugio(3), salida(4)]);
    expect(enRefugio(estado)).toBe(false);
  });

  it("volver a refugiarse reactiva el refugio", () => {
    const estado = base(5, 60, [refugio(2), salida(3), refugio(4)]);
    expect(enRefugio(estado)).toBe(true);
  });

  it("acumula dosis con el motor real sin bajar y con 3 decimales como mucho", () => {
    let s = partidaDorada();
    for (let i = 0; i < 5; i++) {
      const antes = ingeniera(s).dosisMSv;
      s = avanzarTick(s);
      const ahora = ingeniera(s).dosisMSv;
      expect(ahora).toBeGreaterThanOrEqual(antes);
      expect(ahora).toBe(Math.round(ahora * 1000) / 1000);
    }
    expect(ingeniera(s).dosisMSv).toBeGreaterThan(0);
  });

  it("simular no protege: no cuenta como refugiarse", () => {
    const estado = base(4, 60, [
      {
        tick: 3,
        origen: "decision",
        descripcionKey: "causa.simular",
        accion: { tipo: "simular", accion: { tipo: "refugiarse" } },
      },
    ]);
    expect(enRefugio(estado)).toBe(false);
  });

  it("el refugio del dilema cuenta desde el tick siguiente", () => {
    let estadoEnTick3 = partidaDorada();
    while (estadoEnTick3.tick < 3 && estadoEnTick3.resultado === "en_curso") estadoEnTick3 = avanzarTick(estadoEnTick3);
    expect(estadoEnTick3.tick).toBe(3);

    const resultado = elegirDilema(estadoEnTick3, "refugio_y_apagar_invernadero");
    expect(resultado).not.toBe(estadoEnTick3);
    expect(enRefugio({ ...resultado, tick: resultado.tick + 1 })).toBe(true);
  });

  it("los tripulantes no disponibles no acumulan dosis", () => {
    let s = partidaDorada();
    for (let i = 0; i < 5; i++) s = avanzarTick(s);
    for (const id of ["matematico", "control_mision"] as const) {
      expect(s.tripulacion.find((t) => t.id === id)!.dosisMSv).toBe(0);
    }
  });

  it("acumularDosis solo cambia la dosis de la tripulación", () => {
    const estado = base(4, 70, [refugio(3)]);
    const despues = acumularDosis(estado);
    expect(despues.recursos).toEqual(estado.recursos);
    expect(despues.causas).toEqual(estado.causas);
    expect(despues.efectosPendientes).toEqual(estado.efectosPendientes);
    expect(despues.rngEstado).toBe(estado.rngEstado);
    expect(despues.tick).toBe(estado.tick);
    expect(despues.resultado).toBe(estado.resultado);
    expect(despues.tripulacion).not.toEqual(estado.tripulacion);
  });

  it("es determinista: la misma secuencia da el mismo estado, dosis incluida", () => {
    const jugar = () => {
      let s = partidaDorada();
      s = aplicarAccion(s, { tipo: "colocar_modulo", modulo: "panel_solar" });
      s = avanzarTick(s);
      s = aplicarAccion(s, { tipo: "refugiarse" });
      s = avanzarTick(s);
      s = aplicarAccion(s, { tipo: "subir_escudo", nivel: 1 });
      for (let i = 0; i < 3; i++) s = avanzarTick(s);
      return s;
    };
    const primera = jugar();
    expect(primera).toEqual(jugar());
    expect(dosisMaximaTripulacion(primera)).toBeGreaterThan(0);
  });

  it("fuera de Marte el multiplicador es de juego aunque el evento tenga medición de RAD", () => {
    const estado = { ...partidaDeMision(MISION_LUNA_VISIBLE), tick: MISION_LUNA_VISIBLE.tickTormenta };
    expect(estado.tormenta?.medicionMarte).toBeDefined();
    expect(tormentaEnCurso(estado, MISION_LUNA_VISIBLE)).toBe(true);
    expect(multiplicadorTormenta(estado, MISION_LUNA_VISIBLE)).toBeCloseTo(
      1 + senalDeDano(estado) * (FACTOR_TORMENTA_SIN_MEDICION - 1),
      9,
    );
  });
});
