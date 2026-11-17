/** Partidas reales con las reglas disponibles; no certifican las mecánicas pendientes de #196.
 * Rutas extraídas del borrador recuperado de QA. Sin búsqueda ni recursos/resultados forzados.
 * Luna visible queda bloqueada por la definición del amanecer; Jezero tiene además ganable.test.ts.
 */
import { describe, expect, it } from "vitest";
import type { Equipment, GameState, Resource } from "@solar-shield/contracts";
import { RECURSOS_INICIALES, RETRASO_COMUNICACIONES, RETRASO_POR_DIFICULTAD } from "@solar-shield/design";
import { MISION_MARTE_POLO_NORTE, MISION_LUNA_POLO_SUR, MISION_OUTPOST_SORPRESA, type Mision } from "@solar-shield/missions";
import { aplicarAccion, aterrizar, avanzarTick, modulosColocados } from "./acciones.js";
import { elegirDilema } from "./dilema.js";
import { partidaDeMision, SEMILLA_DORADA, paso } from "./dorada.js";

const RECURSOS: readonly Resource[] = ["energia", "soporte_vital", "blindaje"];
interface Ruta { mision: Mision; sitio: string; envio: number; ganaEn: number; pierdeEn: number; envioPerdedor?: number }
const RUTAS: Ruta[] = [
  // Jezero sale de aquí en P0.3: gana con telemetría tras la tormenta y puede perder por radiación; lo cubre jezero-victoria.test.ts.
  { mision: MISION_MARTE_POLO_NORTE, sitio: "crater-louth", envio: 3, ganaEn: 5, pierdeEn: 10, envioPerdedor: 8 },
  { mision: MISION_LUNA_POLO_SUR, sitio: "nobile", envio: 3, ganaEn: 4, pierdeEn: 8 },
  { mision: MISION_OUTPOST_SORPRESA, sitio: "cabina", envio: 3, ganaEn: 6, pierdeEn: 8 },
];
function jugar({ mision: m, sitio }: Ruta, envio?: number): GameState {
  let s = aterrizar(partidaDeMision(m, SEMILLA_DORADA), sitio, m);
  while (s.resultado === "en_curso" && s.tick < m.fin.tickLimite) {
    if (s.tick === envio) s = aplicarAccion(s, { tipo: "enviar_telemetria" }, m);
    s = avanzarTick(s, m);
  }
  return s;
}

describe.each(RUTAS)("$mision.id: reglas integradas disponibles", (ruta) => {
  const m = ruta.mision;
  it("gana por telemetría con tres recursos positivos y respeta el retraso de comunicación", () => {
    const s = jugar(ruta, ruta.envio);
    expect(s.resultado).toBe("exito");
    expect(s.tick).toBe(ruta.ganaEn);
    expect(s.tick).toBe(ruta.envio + (m.retrasoComunicacionesTicks ?? RETRASO_COMUNICACIONES[m.sitio]));
    expect(RECURSOS.every(r => s.recursos[r] > 0)).toBe(true);
    expect(s.causas.some(c => c.tick === s.tick && c.descripcionKey === "causa.enviar_telemetria")).toBe(true);
  });
  it("pierde por agotamiento o plazo sin objetivo y conserva las causas", () => {
    const s = jugar(ruta, ruta.envioPerdedor);
    expect(s.resultado).toBe("fallo");
    expect(s.tick).toBe(ruta.pierdeEn);
    if (m.id === "jezero-dorada") {
      expect(s.tick).toBe(m.fin.tickLimite);
      expect(RECURSOS.every(r => s.recursos[r] > 0)).toBe(true);
    } else {
      expect(RECURSOS.some(r => s.recursos[r] === 0)).toBe(true);
      expect(s.causas.some(c => (c.delta ?? 0) < 0 && c.recurso && s.recursos[c.recurso] === 0)).toBe(true);
    }
    expect(avanzarTick(s, m)).toBe(s);
  });
  it("misma semilla y decisiones reproducen el estado completo en victoria y derrota", () => {
    for (const envio of [ruta.envio, ruta.envioPerdedor]) expect(jugar(ruta, envio)).toEqual(jugar(ruta, envio));
  });
  it("cobra cada sitio una sola vez y entrega sus beneficios con retraso", () => {
    for (const sitio of m.sitiosCandidatos) {
      const inicial = partidaDeMision(m);
      let s = aterrizar(inicial, sitio.id, m);
      for (const r of RECURSOS) expect(s.recursos[r]).toBe(RECURSOS_INICIALES[m.sitio][r] + (sitio.aterrizaje.inmediato[r] ?? 0));
      expect(aterrizar(s, sitio.id, m)).toBe(s);
      const otro = m.sitiosCandidatos.find(x => x.id !== sitio.id)!;
      expect(aterrizar(s, otro.id, m)).toBe(s);
      const pendientes = s.efectosPendientes.filter(e => e.descripcionKey === "causa.aterrizaje");
      expect(pendientes.map(e => e.recurso).sort()).toEqual(Object.keys(sitio.aterrizaje.retrasado).sort());
      const retraso = RETRASO_POR_DIFICULTAD[m.dificultad];
      for (const e of pendientes) {
        expect(e.aplicaEnTick).toBeGreaterThanOrEqual(retraso.min);
        expect(e.aplicaEnTick).toBeLessThanOrEqual(retraso.max);
        expect(s.causas.some(c => c.descripcionKey === e.descripcionKey && c.recurso === e.recurso && (c.delta ?? 0) > 0)).toBe(false);
      }
      for (let i = 0; i < retraso.max; i++) s = avanzarTick(s, m);
      for (const e of pendientes) expect(s.causas.filter(c => c.tick === e.aplicaEnTick && c.descripcionKey === e.descripcionKey && c.recurso === e.recurso && c.delta === e.delta)).toHaveLength(1);
    }
  });
  it("acepta solo los módulos de la misión, sin duplicados ni un tercero", () => {
    const [a, b, c] = m.modulosDisponibles as Equipment[];
    let s = aplicarAccion(partidaDeMision(m), { tipo: "colocar_modulo", modulo: a! }, m);
    expect(aplicarAccion(s, { tipo: "colocar_modulo", modulo: a! }, m)).toBe(s);
    s = aplicarAccion(s, { tipo: "colocar_modulo", modulo: b! }, m);
    expect(aplicarAccion(s, { tipo: "colocar_modulo", modulo: c! }, m)).toBe(s);
    expect(modulosColocados(s)).toHaveLength(m.modulosAColocar);
    const ajeno = (["panel_solar", "bateria", "reciclador_agua", "invernadero", "escudo", "antena"] as Equipment[]).find(e => !m.modulosDisponibles.includes(e));
    if (ajeno) {
      const inicial = partidaDeMision(m);
      expect(aplicarAccion(inicial, { tipo: "colocar_modulo", modulo: ajeno }, m)).toBe(inicial);
    }
  });
  it("paso aplica la acción y el tick de la misma misión", () => {
    const s = aterrizar(partidaDeMision(m), ruta.sitio, m);
    expect(paso(s, { tipo: "refugiarse" }, m)).toEqual(avanzarTick(aplicarAccion(s, { tipo: "refugiarse" }, m), m));
  });
  it("cada opción del dilema tiene costos visibles y consecuencias retrasadas reproducibles", () => {
    for (const opcion of m.dilemaPaso6.opciones) {
      const inicial = partidaDeMision(m);
      const s = elegirDilema(inicial, opcion.id, m);
      expect(s).not.toBe(inicial);
      expect(RECURSOS.some(r => s.recursos[r] < inicial.recursos[r])).toBe(true);
      expect(s.efectosPendientes.length).toBeGreaterThan(0);
      expect(s).toEqual(elegirDilema(inicial, opcion.id, m));
    }
  });
});
