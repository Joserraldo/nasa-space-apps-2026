/**
 * C1 "El viaje": balance con muchas estrategias (docs/PLAN-INTEGRACION-COLONIA.md §5.1).
 * Una estrategia es: zona × par de módulos × plan ante la tormenta (o ninguno) × qué sacrificar.
 * Orden de juego: aterrizar; un turno por módulo; al llegar la tormenta se aplica el plan; un turno;
 * dilema; un turno; telemetría; esperar al final. Solo usa la API pública del motor.
 */
import { describe, expect, it } from "vitest";
import type { Difficulty, GameState } from "@solar-shield/contracts";
import { MISION_VIAJE_MARTE as M } from "@solar-shield/missions";
import { aplicarAccion, aterrizar, avanzarTick, modulosColocados } from "./acciones.js";
import { elegirDilema, elegirPlan } from "./dilema.js";
import { partidaDeMision } from "./dorada.js";
import { dosisMaximaTripulacion } from "./radiacion.js";

const SEMILLAS = 30;
const PLANES = ["refugio", "escudo", "nada"] as const;
type Plan = (typeof PLANES)[number];

const PARES = M.modulosDisponibles.flatMap((a, i) => M.modulosDisponibles.slice(i + 1).map((b) => [a, b] as const));

interface Fila { contexto: string; plan: Plan; dilema: string; ganadas: number }

function hastaElDilema(dificultad: Difficulty, semilla: string, zona: string, par: readonly string[], plan: Plan): GameState {
  const m = { ...M, dificultad };
  let s = aterrizar(partidaDeMision(m, semilla), zona, m);
  for (const modulo of par) s = avanzarTick(aplicarAccion(s, { tipo: "colocar_modulo", modulo }, m), m);
  while (s.tick < m.tickTormenta && s.resultado === "en_curso") s = avanzarTick(s, m);
  if (plan !== "nada") s = elegirPlan(s, plan, m);
  return avanzarTick(s, m);
}

function terminar(dificultad: Difficulty, estado: GameState, dilema: string): GameState {
  const m = { ...M, dificultad };
  let s = avanzarTick(elegirDilema(estado, dilema, m), m);
  s = aplicarAccion(s, { tipo: "enviar_telemetria" }, m);
  while (s.resultado === "en_curso") s = avanzarTick(s, m);
  return s;
}

function simular(dificultad: Difficulty): Fila[] {
  const filas: Fila[] = [];
  for (const zona of M.sitiosCandidatos)
    for (const par of PARES)
      for (const plan of PLANES) {
        const inicios = Array.from({ length: SEMILLAS }, (_, i) => hastaElDilema(dificultad, `viaje-${i}`, zona.id, par, plan));
        for (const o of M.dilemaPaso6.opciones) {
          const ganadas = inicios.filter((s) => terminar(dificultad, s, o.id).resultado === "exito").length;
          filas.push({ contexto: `${zona.id}|${par.join("+")}|${plan}`, plan, dilema: o.id, ganadas });
        }
      }
  return filas;
}

const media = (filas: Fila[]) => filas.reduce((a, f) => a + f.ganadas, 0) / (filas.length * SEMILLAS);

describe.each(["facil", "media"] as const)("viaje a Marte: balance en %s", (dificultad) => {
  const filas = simular(dificultad);
  const con = (plan: Plan) => filas.filter((f) => f.plan === plan);

  it("sin plan ante la tormenta no se gana: no protegerse cuesta más", () => {
    expect(media(con("nada"))).toBeLessThan(0.02);
  });

  it("refugio y escudo se pueden ganar y ninguno domina al otro", () => {
    for (const plan of ["refugio", "escudo"] as const) {
      expect(media(con(plan)), plan).toBeGreaterThan(0.45);
      expect(Math.max(...con(plan).map((f) => f.ganadas)), plan).toBeGreaterThanOrEqual(SEMILLAS - 1);
    }
    expect(Math.abs(media(con("refugio")) - media(con("escudo")))).toBeLessThan(0.1);
  });

  it("ningún plan ni sacrificio gana siempre: depende de lo demás", () => {
    for (const plan of ["refugio", "escudo"] as const) expect(con(plan).some((f) => f.ganadas === 0), plan).toBe(true);
    for (const o of M.dilemaPaso6.opciones)
      expect(filas.some((f) => f.dilema === o.id && f.plan !== "nada" && f.ganadas === 0), o.id).toBe(true);
  });

  it("cada sacrificio es el mejor en alguna situación", () => {
    const porContexto = new Map<string, Fila[]>();
    for (const f of filas) if (f.plan !== "nada") porContexto.set(f.contexto, [...(porContexto.get(f.contexto) ?? []), f]);
    const unicos = new Set<string>();
    for (const grupo of porContexto.values()) {
      const max = Math.max(...grupo.map((f) => f.ganadas));
      const mejores = grupo.filter((f) => f.ganadas === max);
      if (mejores.length === 1) unicos.add(mejores[0]!.dilema);
    }
    expect([...unicos].sort()).toEqual(M.dilemaPaso6.opciones.map((o) => o.id).sort());
  });
});

describe("viaje a Marte: reglas", () => {
  it("las dificultades altas también se pueden ganar", () => {
    for (const dificultad of ["dificil", "hardcore"] as const) {
      const filas = simular(dificultad).filter((f) => f.plan !== "nada");
      expect(Math.max(...filas.map((f) => f.ganadas)), dificultad).toBeGreaterThan(SEMILLAS / 2);
    }
  });

  it("sin plan se pierde por el presupuesto de radiación", () => {
    const s = terminar("facil", hastaElDilema("facil", "viaje-0", "centro", ["panel_solar", "bateria"], "nada"), "guardar_energia");
    expect(s.resultado).toBe("fallo");
    expect(dosisMaximaTripulacion(s)).toBeGreaterThan(M.limiteDosisMSv);
  });

  it("el plan se cobra al elegirlo, queda en la cadena de causas y un id desconocido no hace nada", () => {
    const m = { ...M };
    const s = partidaDeMision(m, "viaje-0");
    expect(elegirPlan(s, "no-existe", m)).toBe(s);
    const conPlan = elegirPlan(s, "refugio", m);
    expect(conPlan.recursos.soporte_vital).toBeLessThan(s.recursos.soporte_vital);
    expect(conPlan.efectosPendientes.map((e) => e.descripcionKey)).toContain("causa.viaje.provisiones");
    expect(modulosColocados(conPlan)).toEqual([]);
  });

  it("ninguna opción es gratis: cada una baja algún medidor", () => {
    for (const o of [...M.decisionInicial.opciones, ...M.dilemaPaso6.opciones]) {
      const s = partidaDeMision(M, "viaje-0");
      const despues = (M.decisionInicial.opciones.includes(o as never) ? elegirPlan : elegirDilema)(s, o.id, M);
      const bajaYa = (["energia", "soporte_vital", "blindaje"] as const).some((r) => despues.recursos[r] < s.recursos[r]);
      expect(bajaYa, o.id).toBe(true);
    }
  });

  it("misma semilla y mismas decisiones, mismo estado", () => {
    const jugar = () => terminar("media", hastaElDilema("media", "viaje-7", "fondo", ["panel_solar", "escudo"], "escudo"), "energia_al_aire");
    expect(jugar()).toEqual(jugar());
  });
});
