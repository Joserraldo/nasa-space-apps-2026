import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { EfectoOpcion } from "./jezero.js";
import { MISION_MARTE_POLO_NORTE as M, ZONA_DE_SITIO } from "./marte-polo-norte.js";
import { TEXTOS_MARTE_POLO_NORTE as T } from "./textos.js";

const RECURSOS = ["energia", "soporte_vital", "blindaje"] as const;

const rutaTerreno = fileURLToPath(new URL(`../../data/terreno/${M.terrenoId}/${M.terrenoId}.json`, import.meta.url));

function neto(e: EfectoOpcion): Record<(typeof RECURSOS)[number], number> {
  return Object.fromEntries(RECURSOS.map((r) => [r, (e.inmediato[r] ?? 0) + (e.retrasado[r] ?? 0)])) as Record<
    (typeof RECURSOS)[number],
    number
  >;
}

describe("misión Marte polo norte", () => {
  it("tiene los 8 pasos en orden, con la tormenta antes del dilema y la telemetría", () => {
    expect(M.pasos.map((p) => p.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    const n = (meta: string) => M.pasos.find((p) => p.meta === meta)!.n;
    expect(n("tormenta_llega")).toBeLessThan(n("consejo_opuesto"));
    expect(n("consejo_opuesto")).toBeLessThan(n("telemetria_enviada"));
    expect(M.pasos.at(-1)!.meta).toBe("fin");
    expect(M.sitio).toBe("marte_polo_norte");
  });

  // Depende del PR #148 (data/terreno/marte-norte). Mientras no esté en develop, se salta.
  it.skipIf(!existsSync(rutaTerreno))("cada sitio candidato existe en data/terreno (MOLA polar, #148)", () => {
    const ids = (JSON.parse(readFileSync(rutaTerreno, "utf-8")) as { sitios: { id: string }[] }).sitios.map((s) => s.id);
    for (const s of M.sitiosCandidatos) expect(ids).toContain(s.id);
  });

  it("cada sitio tiene su zona de la propuesta (la que usan las voces de agentes)", () => {
    expect(M.sitiosCandidatos.map((s) => s.id).sort()).toEqual(Object.keys(ZONA_DE_SITIO).sort());
  });

  it("ningún aterrizaje es gratis: mueve ≥ 2 medidores y algo baja ya", () => {
    expect(M.sitiosCandidatos.length).toBeGreaterThanOrEqual(3);
    for (const s of M.sitiosCandidatos) {
      const movidos = RECURSOS.filter((r) => (s.aterrizaje.inmediato[r] ?? 0) !== 0 || (s.aterrizaje.retrasado[r] ?? 0) !== 0);
      expect(movidos.length, s.id).toBeGreaterThanOrEqual(2);
      expect(Object.values(s.aterrizaje.inmediato).some((v) => v < 0), s.id).toBe(true);
    }
  });

  it("ningún sitio domina a otro en todos los medidores", () => {
    const sitios = M.sitiosCandidatos.map((s) => ({ id: s.id, n: neto(s.aterrizaje) }));
    for (const a of sitios)
      for (const b of sitios) {
        if (a.id === b.id) continue;
        const domina = RECURSOS.every((r) => a.n[r] >= b.n[r]) && RECURSOS.some((r) => a.n[r] > b.n[r]);
        expect(domina, `${a.id} domina a ${b.id}`).toBe(false);
      }
  });

  it("Iris lee mal la energía, se revela después de la tormenta y la arregla la Ingeniera", () => {
    const pasoTormenta = M.pasos.find((p) => p.meta === "tormenta_llega")!.n;
    expect(M.averiaIris.recursoMalLeido).toBe("energia");
    expect(M.averiaIris.pasoRevelacion).toBeGreaterThan(pasoTormenta);
    expect(M.averiaIris.equipo).toBe(M.averiaInicial);
    expect(M.fin.tickLimite).toBeGreaterThan(M.tickTormenta);
  });

  it("la batería es un módulo de la misión y cada módulo tiene su tarjeta", () => {
    expect(M.modulosDisponibles).toContain("bateria");
    const conTarjeta = new Set(M.tarjetasCiencia.map((t) => t.modulo).filter(Boolean));
    for (const m of M.modulosDisponibles) expect(conTarjeta.has(m), m).toBe(true);
  });

  it("el dilema tiene 3 salidas válidas, distintas y con dos expertos que se contradicen", async () => {
    const { ActionSchema } = await import("@solar-shield/contracts");
    const ops = M.dilemaPaso6.opciones;
    expect(ops).toHaveLength(3);
    expect(new Set(ops.map((o) => o.id)).size).toBe(3);
    for (const o of ops) expect(ActionSchema.safeParse(o.accion).success, o.id).toBe(true);
    expect(new Set(ops.map((o) => o.defiende).filter((e) => e !== null)).size).toBeGreaterThanOrEqual(2);
    expect(ActionSchema.safeParse(M.eventoPolvo.limpiar).success).toBe(true);
    expect(M.eventoPolvo.enSemillaDorada).toBe(false);
  });

  it("cada fuente citada existe en los textos de datos; sin fuente solo lo marcado POR VERIFICAR", () => {
    const fuentes = JSON.parse(
      readFileSync(fileURLToPath(new URL("../../data/i18n/en.json", import.meta.url)), "utf-8"),
    ) as Record<string, string>;
    for (const t of M.tarjetasCiencia) if (t.fuenteKey !== null) expect(fuentes[t.fuenteKey], t.id).toBeTruthy();
    // La tormenta se cita siempre (y dice que se midió en Gale).
    expect(M.tarjetasCiencia.find((t) => t.id === "tormenta_en_gale")!.fuenteKey).toBe("fuente.radlab");
    const ocultas = M.tarjetasCiencia.filter((t) => t.fuenteKey === null).map((t) => t.id).sort();
    expect(ocultas).toEqual(["guardar_energia", "hielo_de_agua", "sol_bajo"]);
  });

  it("ningún texto dice que la tormenta se midió en el polo", () => {
    expect(T.en["mision.polo_norte.tormenta.donde"]).toMatch(/Gale/);
    expect(T.es["mision.polo_norte.tormenta.donde"]).toMatch(/Gale/);
  });

  it("cada clave de texto de la misión existe en en y es", () => {
    const p = M.preguntaFinal;
    const claves = [
      M.nombreKey,
      ...M.pasos.map((x) => x.tituloKey),
      ...M.sitiosCandidatos.map((s) => s.porQueKey),
      M.eventoPolvo.textoKey,
      M.dilemaPaso6.preguntaKey,
      ...M.dilemaPaso6.opciones.map((o) => o.textoKey),
      ...M.tarjetasCiencia.map((t) => t.textoKey),
      p.preguntaKey,
      ...p.opcionesKeys,
      p.explicacionKey,
      "mision.polo_norte.noche",
    ];
    for (const idioma of ["en", "es"] as const) for (const k of claves) expect(T[idioma][k], `${idioma}:${k}`).toBeTruthy();
    expect(Object.keys(T.es).sort()).toEqual(Object.keys(T.en).sort());
  });
});
