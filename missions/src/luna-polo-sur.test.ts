import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { EfectoOpcion } from "./jezero.js";
import { MISION_LUNA_POLO_SUR as M } from "./luna-polo-sur.js";
import { TEXTOS_LUNA_POLO_SUR as T } from "./textos.js";

const RECURSOS = ["energia", "soporte_vital", "blindaje"] as const;
const raiz = (ruta: string): string => fileURLToPath(new URL(`../../${ruta}`, import.meta.url));

/** El terreno llega con el PR #126 (Moon Trek). Mientras no esté en develop, esa prueba se salta. */
const rutaTerreno = raiz(`data/terreno/${M.terrenoId}/${M.terrenoId}.json`);

function neto(e: EfectoOpcion): Record<(typeof RECURSOS)[number], number> {
  return Object.fromEntries(RECURSOS.map((r) => [r, (e.inmediato[r] ?? 0) + (e.retrasado[r] ?? 0)])) as Record<
    (typeof RECURSOS)[number],
    number
  >;
}

describe("misión Luna polo sur", () => {
  it("la tormenta existe en data/curated", () => {
    expect(existsSync(raiz(`data/curated/${M.tormentaId}.json`))).toBe(true);
  });

  it.skipIf(!existsSync(rutaTerreno))("cada sitio candidato existe en data/terreno (depende de #126)", () => {
    const ids = (JSON.parse(readFileSync(rutaTerreno, "utf-8")) as { sitios: { id: string }[] }).sitios.map((s) => s.id);
    for (const s of M.sitiosCandidatos) expect(ids).toContain(s.id);
  });

  it("hay al menos 3 sitios y ningún aterrizaje es gratis", () => {
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

  it("la avería de Iris se revela después de la tormenta y el tope de ticks deja llegarla", () => {
    const pasoTormenta = M.pasos.find((p) => p.meta === "tormenta_llega")!.n;
    expect(M.pasos.map((p) => p.n)).toContain(M.averiaIris.pasoRevelacion);
    expect(M.averiaIris.pasoRevelacion).toBeGreaterThan(pasoTormenta);
    expect(M.averiaIris.equipo).toBe(M.averiaInicial);
    expect(M.fin.tickLimite).toBeGreaterThan(M.tickTormenta);
  });

  it("no ofrece la antena (en la Luna el retraso es de ~1 s)", () => {
    expect(M.modulosDisponibles).not.toContain("antena");
    expect(M.modulosDisponibles.length).toBeGreaterThan(M.modulosAColocar);
  });
});

describe("Luna polo sur: mala suerte y dilema del hielo", () => {
  it("el micrometeorito baja el panel, no sale en la semilla dorada y repararlo es una acción válida", async () => {
    const { ActionSchema } = await import("@solar-shield/contracts");
    const p = M.eventoPolvo;
    expect(p.rendimientoPanel).toBeGreaterThan(0);
    expect(p.rendimientoPanel).toBeLessThan(1);
    expect(p.enSemillaDorada).toBe(false);
    expect(ActionSchema.safeParse(p.limpiar).success).toBe(true);
  });

  it("el dilema tiene 3 salidas válidas y distintas, con dos expertos que se contradicen", async () => {
    const { ActionSchema } = await import("@solar-shield/contracts");
    const ops = M.dilemaPaso6.opciones;
    expect(ops).toHaveLength(3);
    expect(new Set(ops.map((o) => o.id)).size).toBe(3);
    for (const o of ops) expect(ActionSchema.safeParse(o.accion).success, o.id).toBe(true);
    expect(new Set(ops.map((o) => o.defiende).filter((e) => e !== null)).size).toBeGreaterThanOrEqual(2);
  });

  it("terminar la expedición cambia energía por agua, sin regalar nada", () => {
    const exp = M.dilemaPaso6.opciones.find((o) => o.id === "terminar_expedicion")!;
    const n = neto(exp.extra!);
    expect(n.soporte_vital).toBeGreaterThan(0);
    expect(n.energia).toBeLessThan(0);
  });
});

describe("Luna polo sur: textos y fuentes", () => {
  const fuentesDatos = JSON.parse(readFileSync(raiz("data/i18n/en.json"), "utf-8")) as Record<string, string>;
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
  ];

  it("cada clave de texto existe en inglés y en español", () => {
    for (const idioma of ["en", "es"] as const)
      for (const k of claves) expect(T[idioma][k], `${idioma}:${k}`).toBeTruthy();
    expect(Object.keys(T.es).sort()).toEqual(Object.keys(T.en).sort());
  });

  it("una fuente citada existe de verdad en los textos de datos", () => {
    for (const t of M.tarjetasCiencia) if (t.fuenteKey !== null) expect(fuentesDatos[t.fuenteKey], t.id).toBeTruthy();
    expect(fuentesDatos[p.fuenteKey!]).toBeTruthy();
  });

  it("cada módulo de la misión tiene su tarjeta de ciencia", () => {
    const conTarjeta = new Set(M.tarjetasCiencia.map((t) => t.modulo).filter(Boolean));
    for (const m of M.modulosDisponibles) expect(conTarjeta.has(m), m).toBe(true);
  });

  it("la tarjeta de la tormenta dice que CRaTER mide en órbita, no en el suelo", () => {
    expect(T.en["mision.luna.ciencia.tormenta"]).toMatch(/not on the ground/);
    expect(T.es["mision.luna.ciencia.tormenta"]).toMatch(/no en el suelo/);
  });
});
