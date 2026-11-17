/**
 * P0.3 + P0.6: Jezero ya no se gana sin jugar y proteger a la tripulación importa.
 * - La victoria pide telemetría enviada Y tormenta terminada (`telemetria_tras_tormenta`).
 * - El presupuesto de dosis (4 mSv) hace perder al pasivo; el escudo y el refugio lo evitan.
 * - El equilibrio (prueba 8) recorre todas las estrategias del dilema sin tocar recursos a mano.
 * Solo API pública del motor y la misión; valores calculados con el motor, no a mano.
 */
import { describe, expect, it } from "vitest";
import type { Equipment, GameState } from "@solar-shield/contracts";
import { DURACION_TORMENTA_TICKS, FACTOR_ESCUDO_POR_NIVEL } from "@solar-shield/design";
import { MISION_JEZERO } from "@solar-shield/missions";
import { aplicarAccion, aterrizar, avanzarTick } from "./acciones.js";
import { elegirDilema } from "./dilema.js";
import { partidaDorada, paso } from "./dorada.js";
import { dosisMaximaTripulacion, factorEscudo } from "./radiacion.js";

const FIN_TORMENTA = MISION_JEZERO.tickTormenta + DURACION_TORMENTA_TICKS;
const m = MISION_JEZERO;

const tieneCausaLimite = (s: GameState): boolean =>
  s.causas.some((c) => c.descripcionKey === "causa.limite_radiacion");

/** Aterriza, coloca dos módulos con un paso cada uno y llega a la tormenta (tick 3). */
function hastaLaTormenta(
  sitio = "cerca-de-perseverance",
  modulos: readonly [Equipment, Equipment] = ["panel_solar", "escudo"],
): GameState {
  let s = aterrizar(partidaDorada(), sitio, m);
  for (const modulo of modulos) s = paso(s, { tipo: "colocar_modulo", modulo }, m);
  while (s.tick < m.tickTormenta && s.resultado === "en_curso") s = avanzarTick(s, m);
  return s;
}

/** Ruta protegida de la prueba 3: dilema en el tick 3, avanzar, enviar y jugar hasta el final. */
function rutaProtegida(opcionDilema: string, sitio = "cerca-de-perseverance"): GameState {
  let s = elegirDilema(hastaLaTormenta(sitio), opcionDilema, m);
  s = avanzarTick(s, m);
  s = aplicarAccion(s, { tipo: "enviar_telemetria" }, m);
  while (s.resultado === "en_curso" && s.tick < m.fin.tickLimite) s = avanzarTick(s, m);
  return s;
}

describe("P0.3 Jezero: no se gana sin jugar", () => {
  it("telemetría en el tick 0 y nada más (sin aterrizar ni módulos) no gana", () => {
    let s = aplicarAccion(partidaDorada(), { tipo: "enviar_telemetria" }, m);
    while (s.resultado === "en_curso") s = avanzarTick(s, m);

    expect(s.resultado).toBe("fallo");
  });

  it("el jugador pasivo (solo avanzarTick) pierde", () => {
    let s = partidaDorada();
    while (s.resultado === "en_curso") s = avanzarTick(s, m);

    expect(s.resultado).toBe("fallo");
  });
});

describe("P0.6 Jezero: proteger a la tripulación importa", () => {
  it("la ruta protegida gana al terminar la tormenta, dentro del presupuesto de radiación", () => {
    const s = rutaProtegida("refugio_y_apagar_invernadero");

    expect(s.resultado).toBe("exito");
    expect(s.tick).toBeGreaterThanOrEqual(FIN_TORMENTA);
    expect(dosisMaximaTripulacion(s)).toBeLessThanOrEqual(m.limiteDosisMSv!);
  });

  it("la misma ruta con \"aguantar\" pierde por el límite de radiación", () => {
    const s = rutaProtegida("aguantar");

    expect(s.resultado).toBe("fallo");
    expect(tieneCausaLimite(s)).toBe(true);
  });

  it("la telemetría que llega antes de que acabe la tormenta no gana todavía", () => {
    // Misma preparación, pero la telemetría sale en el tick 3: llega en el 5, con la tormenta aún viva.
    let s = elegirDilema(hastaLaTormenta(), "refugio_y_apagar_invernadero", m);
    s = aplicarAccion(s, { tipo: "enviar_telemetria" }, m);
    const llegaEn = s.efectosPendientes.find((e) => e.descripcionKey === "causa.enviar_telemetria")!.aplicaEnTick;
    expect(llegaEn).toBeLessThan(FIN_TORMENTA);

    while (s.tick < llegaEn) s = avanzarTick(s, m);
    expect(s.tick).toBe(llegaEn);
    expect(s.resultado).toBe("en_curso");

    while (s.resultado === "en_curso" && s.tick < m.fin.tickLimite) s = avanzarTick(s, m);
    expect(s.resultado).toBe("exito");
    expect(s.tick).toBeGreaterThanOrEqual(FIN_TORMENTA);
  });

  it("factorEscudo: protege el turno siguiente y DURACION_ESCUDO_TICKS; simular no cuenta", () => {
    const causa = (tick: number, nivel: number): GameState["causas"][number] => ({
      tick,
      origen: "decision",
      descripcionKey: "causa.subir_escudo",
      accion: { tipo: "subir_escudo", nivel },
    });
    const conEscudo = (tick: number, causas: GameState["causas"]): GameState => ({
      ...partidaDorada(),
      tick,
      causas,
    });

    expect(factorEscudo(conEscudo(4, [causa(3, 2)]))).toBeCloseTo(1 - 2 * FACTOR_ESCUDO_POR_NIVEL, 9);
    expect(factorEscudo(conEscudo(5, [causa(3, 2)]))).toBeCloseTo(1 - 2 * FACTOR_ESCUDO_POR_NIVEL, 9);
    expect(factorEscudo(conEscudo(6, [causa(3, 2)]))).toBe(1);
    expect(factorEscudo(conEscudo(3, [causa(3, 2)]))).toBe(1);

    const simulado: GameState["causas"] = [
      {
        tick: 3,
        origen: "decision",
        descripcionKey: "causa.simular",
        accion: { tipo: "simular", accion: { tipo: "subir_escudo", nivel: 2 } },
      },
    ];
    expect(factorEscudo(conEscudo(4, simulado))).toBe(1);
  });

  it("sin tormenta en la partida, telemetria_tras_tormenta gana en cuanto llega la telemetría", () => {
    const sinTormenta: GameState = { ...partidaDorada(), tormenta: null };
    let s = aplicarAccion(sinTormenta, { tipo: "enviar_telemetria" }, m);
    const llegaEn = s.efectosPendientes.find((e) => e.descripcionKey === "causa.enviar_telemetria")!.aplicaEnTick;
    while (s.resultado === "en_curso" && s.tick < llegaEn) s = avanzarTick(s, m);

    expect(s.tick).toBe(llegaEn);
    expect(s.resultado).toBe("exito");
  });

  it("equilibrio: cada opción del dilema gana alguna vez y ninguna gana siempre", () => {
    const opciones = m.dilemaPaso6.opciones.map((o) => o.id);
    const victorias = new Map<string, number>(opciones.map((id) => [id, 0]));
    const paresDeModulos = (m.modulosDisponibles.length * (m.modulosDisponibles.length - 1)) / 2;
    const combinacionesPorOpcion = m.sitiosCandidatos.length * paresDeModulos;

    for (const sitio of m.sitiosCandidatos) {
      for (let i = 0; i < m.modulosDisponibles.length; i++) {
        for (let j = i + 1; j < m.modulosDisponibles.length; j++) {
          const modulos = [m.modulosDisponibles[i]!, m.modulosDisponibles[j]!] as const;
          for (const opcion of opciones) {
            // La misma secuencia que la prueba 3, variando sitio, módulos y opción del dilema.
            let s = aterrizar(partidaDorada(), sitio.id, m);
            for (const modulo of modulos) s = paso(s, { tipo: "colocar_modulo", modulo }, m);
            while (s.tick < m.tickTormenta && s.resultado === "en_curso") s = avanzarTick(s, m);
            s = elegirDilema(s, opcion, m);
            s = avanzarTick(s, m);
            s = aplicarAccion(s, { tipo: "enviar_telemetria" }, m);
            while (s.resultado === "en_curso" && s.tick < m.fin.tickLimite) s = avanzarTick(s, m);

            if (s.resultado === "exito") victorias.set(opcion, victorias.get(opcion)! + 1);
          }
        }
      }
    }

    for (const opcion of opciones) {
      const gana = victorias.get(opcion)!;
      expect(gana, `${opcion} debe ganar en alguna combinación`).toBeGreaterThan(0);
      expect(gana, `${opcion} no debe ganar en todas`).toBeLessThan(combinacionesPorOpcion);
    }
  });
});
