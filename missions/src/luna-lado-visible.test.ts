import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { EfectoOpcion, SitioCandidato } from "./jezero.js";
import { AVERIA_ANTENA_LUNA_VISIBLE, FUENTES_PENDIENTES_LUNA_VISIBLE, MISION_LUNA_VISIBLE } from "./luna-lado-visible.js";
import { TEXTOS_LUNA_VISIBLE } from "./textos.js";

const M = MISION_LUNA_VISIBLE;
const RECURSOS = ["energia", "soporte_vital", "blindaje"] as const;
// Vista ancha del tipo: `satisfies` deja la constante estrecha y aquí se indexa por recurso.
const sitios: SitioCandidato[] = M.sitiosCandidatos;
const leer = <T>(ruta: string): T => JSON.parse(readFileSync(fileURLToPath(new URL(ruta, import.meta.url)), "utf-8")) as T;

function neto(e: EfectoOpcion): Record<(typeof RECURSOS)[number], number> {
  return Object.fromEntries(RECURSOS.map((r) => [r, (e.inmediato[r] ?? 0) + (e.retrasado[r] ?? 0)])) as Record<
    (typeof RECURSOS)[number],
    number
  >;
}

describe("misión Luna lado visible", () => {
  it("la tormenta está curada en data/curated", () => {
    expect(existsSync(fileURLToPath(new URL(`../../data/curated/${M.tormentaId}.json`, import.meta.url)))).toBe(true);
  });

  it("cada sitio candidato existe en data/terreno", () => {
    const ids = leer<{ sitios: { id: string }[] }>(`../../data/terreno/${M.terrenoId}/${M.terrenoId}.json`).sitios.map((s) => s.id);
    expect(sitios.length).toBeGreaterThanOrEqual(3);
    for (const s of sitios) expect(ids).toContain(s.id);
  });

  it("ningún aterrizaje es gratis: mueve ≥ 2 medidores y algo baja ya", () => {
    for (const s of sitios) {
      const movidos = RECURSOS.filter((r) => (s.aterrizaje.inmediato[r] ?? 0) !== 0 || (s.aterrizaje.retrasado[r] ?? 0) !== 0);
      expect(movidos.length, s.id).toBeGreaterThanOrEqual(2);
      expect(Object.values(s.aterrizaje.inmediato).some((v) => v < 0), s.id).toBe(true);
    }
  });

  it("ningún sitio domina a otro en todos los medidores", () => {
    const sitiosNetos = sitios.map((s) => ({ id: s.id, n: neto(s.aterrizaje) }));
    for (const a of sitiosNetos)
      for (const b of sitiosNetos) {
        if (a.id === b.id) continue;
        const domina = RECURSOS.every((r) => a.n[r] >= b.n[r]) && RECURSOS.some((r) => a.n[r] > b.n[r]);
        expect(domina, `${a.id} domina a ${b.id}`).toBe(false);
      }
  });

  it("de noche ningún sitio devuelve energía con retraso", () => {
    for (const s of sitios) expect(s.aterrizaje.retrasado.energia ?? 0, s.id).toBeLessThanOrEqual(0);
  });

  it("la avería de Iris se revela después de la tormenta y el tope de ticks la deja llegar", () => {
    const pasoTormenta = M.pasos.find((p) => p.meta === "tormenta_llega")!.n;
    expect(M.pasos.map((p) => p.n)).toContain(M.averiaIris.pasoRevelacion);
    expect(M.averiaIris.pasoRevelacion).toBeGreaterThan(pasoTormenta);
    expect(M.averiaIris.equipo).toBe(M.averiaInicial);
    expect(M.fin.tickLimite).toBeGreaterThan(M.tickTormenta);
  });

  it("sin invernadero: sin luz durante la noche no hay fuente para plantas", () => {
    expect(M.modulosDisponibles).not.toContain("invernadero");
  });
});

describe("Luna lado visible: dilema y mala suerte", () => {
  it("el dilema tiene salidas válidas, distintas y dos expertos que se contradicen", async () => {
    const { ActionSchema } = await import("@solar-shield/contracts");
    const ops = M.dilemaPaso6.opciones;
    expect(ops.length).toBeGreaterThanOrEqual(3);
    expect(new Set(ops.map((o) => o.id)).size).toBe(ops.length);
    expect(new Set(ops.map((o) => o.accion.tipo)).size).toBe(ops.length);
    for (const o of ops) expect(ActionSchema.safeParse(o.accion).success, o.id).toBe(true);
    const defensores = ops.map((o) => o.defiende).filter((e) => e !== null);
    expect(new Set(defensores).size).toBeGreaterThanOrEqual(2);
  });

  it("las expertas siguen en lados opuestos y el escudo y la Tierra son neutrales (#196)", () => {
    const ops = M.dilemaPaso6.opciones;
    expect(ops.find((o) => o.id === "refugio")?.defiende).toBe("doctora");
    expect(ops.find((o) => o.id === "subir_escudo")?.defiende).toBeNull();
    expect(ops.find((o) => o.id === "ahorrar_bateria")?.defiende).toBe("ingeniera");
    expect(ops.find((o) => o.id === "preguntar_tierra")?.defiende).toBeNull();
  });

  it("en la Luna no se inventa un evento de polvo: la mala suerte es la antena", () => {
    expect("eventoPolvo" in M).toBe(false);
  });

  it("dificultad y tope de ticks son los aprobados provisionalmente en #196", () => {
    expect(M.dificultad).toBe("media");
    expect(M.fin.tickLimite).toBe(10);
  });

  it("la antena averiada no sale en la semilla dorada y se arregla con acciones válidas", async () => {
    const { ActionSchema } = await import("@solar-shield/contracts");
    const a = AVERIA_ANTENA_LUNA_VISIBLE;
    expect(a.enSemillaDorada).toBe(false);
    expect(M.modulosDisponibles).toContain(a.equipo);
    for (const x of a.arreglos) expect(ActionSchema.safeParse(x).success).toBe(true);
  });
});

describe("Luna lado visible: textos y fuentes", () => {
  const fuentesDatos = leer<Record<string, string>>("../../data/i18n/en.json");

  it("cada clave de texto existe en inglés y en español", () => {
    const p = M.preguntaFinal;
    const claves = [
      M.nombreKey,
      ...M.pasos.map((x) => x.tituloKey),
      ...M.sitiosCandidatos.map((s) => s.porQueKey),
      M.dilemaPaso6.preguntaKey,
      ...M.dilemaPaso6.opciones.map((o) => o.textoKey),
      AVERIA_ANTENA_LUNA_VISIBLE.textoKey,
      "mision.lunaVisible.tormenta.aviso",
      ...M.tarjetasCiencia.map((t) => t.textoKey),
      p.preguntaKey,
      ...p.opcionesKeys,
      p.explicacionKey,
    ];
    for (const k of claves) {
      expect(TEXTOS_LUNA_VISIBLE.en[k], `en:${k}`).toBeTruthy();
      expect(TEXTOS_LUNA_VISIBLE.es[k], `es:${k}`).toBeTruthy();
    }
  });

  it("una fuente citada existe en los textos de datos o está declarada como dependencia", () => {
    for (const t of M.tarjetasCiencia) {
      if (t.fuenteKey === null) continue;
      const ok = !!fuentesDatos[t.fuenteKey] || FUENTES_PENDIENTES_LUNA_VISIBLE.includes(t.fuenteKey);
      expect(ok, `${t.id}: ${t.fuenteKey}`).toBe(true);
    }
  });

  it("cada módulo de la misión tiene su tarjeta de ciencia", () => {
    const conTarjeta = new Set(M.tarjetasCiencia.map((t) => t.modulo).filter(Boolean));
    for (const m of M.modulosDisponibles) expect(conTarjeta.has(m), m).toBe(true);
  });

  it("CRaTER se dice en órbita, no en el suelo, y Kp siempre como medida de la Tierra", () => {
    for (const idioma of ["en", "es"] as const) {
      const t = TEXTOS_LUNA_VISIBLE[idioma];
      expect(t["mision.lunaVisible.tormenta.crater"]).toMatch(idioma === "en" ? /not on the ground/ : /no en el suelo/);
      expect(t["mision.lunaVisible.ciencia.tresLugares"]).toMatch(idioma === "en" ? /measured on Earth/ : /se mide en la Tierra/);
    }
  });
});
