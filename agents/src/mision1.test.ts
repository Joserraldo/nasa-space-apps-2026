import { describe, expect, it } from "vitest";
import { ActionSchema, SpaceWeatherEventSchema } from "@solar-shield/contracts";
import en from "../i18n/en.json";
import es from "../i18n/es.json";
import { escenaPolvo, escenaTormenta, preguntaIris, responderPreguntaIris, type Dialogo, type TemaPregunta, type VistaAgente } from "./index.js";

// Misión 1 (docs/ideas/mision-1-ares-mejorada.md): polvo 4b, dilema del refugio 6 y pregunta de Iris.
const vista: VistaAgente = { recursos: { energia: 48.6, soporte_vital: 70, blindaje: 40 }, tripulacion: [], tormenta: null, equipos: { panel_solar: "ok" } };
const insight = { nombreKey: "fuente.jpl", url: "https://www.jpl.nasa.gov/", idFuente: "insight-fin-2022", consultadoEl: "2026-11-14" };

function clavesExisten(ds: readonly Dialogo[]) {
  for (const d of ds) for (const l of d.lineas) {
    expect(en[l.clave as keyof typeof en], l.clave).toBeDefined();
    expect(es[l.clave as keyof typeof es], l.clave).toBeDefined();
  }
}

describe("paso 4b: polvo en los paneles", () => {
  it("sin panel solar no hay escena", () => {
    expect(escenaPolvo({ ...vista, equipos: {} })).toBeNull();
  });
  it("limpiar o aguantar: dos acciones válidas, ninguna se aplica sola", () => {
    const e = escenaPolvo(vista)!;
    expect(e.opciones).toEqual([{ tipo: "salida_exterior", objetivo: "panel_solar" }, { tipo: "esperar" }]);
    expect(e.opciones.every((a) => ActionSchema.safeParse(a).success)).toBe(true);
    expect(e.dialogos.map((d) => d.experto)).toEqual(["ingeniera", "doctora", "ia_base"]);
    expect(e.dialogos[0]?.lineas[0]?.vars).toEqual({ energia: 49 });
    clavesExisten(e.dialogos);
  });
  it("el caso real de InSight solo se cita con su fuente", () => {
    const sin = escenaPolvo(vista)!;
    expect(sin.dialogos.some((d) => d.lineas.some((l) => l.clave.endsWith(".insight")))).toBe(false);
    const con = escenaPolvo(vista, { insight })!;
    const real = con.dialogos.find((d) => d.lineas.some((l) => l.clave.endsWith(".insight")));
    expect(real?.fuente).toEqual(insight);
    clavesExisten(con.dialogos);
  });
});

describe("paso 6: dilema del refugio con invernadero", () => {
  const tormenta = SpaceWeatherEventSchema.parse({
    id: "2024-05-20-marte", tipo: "CME", inicio: "2024-05-20T05:36:00Z", duracionHoras: 24, intensidad: 0.74,
    fuente: { nombreKey: "fuente.donki", url: "https://ccmc.gsfc.nasa.gov/tools/DONKI/", idFuente: "x", consultadoEl: "2026-11-13" },
  });
  it("con invernadero sano, la Doctora nombra la comida de mañana", () => {
    const e = escenaTormenta({ ...vista, tormenta, equipos: { invernadero: "ok" } })!;
    expect(e.dialogos[1]?.lineas[1]?.clave).toBe("agentes.escena6.doctora.costoInvernadero");
    clavesExisten(e.dialogos);
  });
  it("sin invernadero, el costo general", () => {
    const e = escenaTormenta({ ...vista, tormenta })!;
    expect(e.dialogos[1]?.lineas[1]?.clave).toBe("agentes.escena6.doctora.costo");
  });
});

describe("pregunta de Iris (nivel 2, nunca bloquea)", () => {
  const temas: TemaPregunta[] = ["panel_solar", "reciclador_agua", "invernadero", "escudo", "tormenta"];
  it("solo en nivel pistas", () => {
    expect(preguntaIris("escudo", "tutorial")).toBeNull();
    expect(preguntaIris("escudo", "offline")).toBeNull();
  });
  it("cada tema: 3 opciones, saltable y siempre explica (bien, casi o saltada)", () => {
    const correctas = new Set<number>();
    for (const t of temas) {
      const p = preguntaIris(t, "pistas")!;
      expect(p.saltable).toBe(true);
      correctas.add(p.correcta);
      for (const k of p.opcionesKeys) expect(en[k as keyof typeof en], k).toBeDefined();
      const otra = ((p.correcta + 1) % 3) as 0 | 1 | 2;
      const rs = [responderPreguntaIris(p, p.correcta), responderPreguntaIris(p, otra), responderPreguntaIris(p, null)];
      expect(rs.map((r) => r.lineas[0]?.clave)).toEqual(["agentes.iris.pregunta.bien", "agentes.iris.pregunta.casi", "agentes.iris.pregunta.saltada"]);
      for (const r of rs) expect(r.lineas[1]?.clave).toBe(`agentes.iris.pregunta.${t}.porque`);
      clavesExisten([p.dialogo, ...rs]);
      for (const k of p.opcionesKeys) expect(es[k as keyof typeof es], k).toBeDefined();
    }
    // La respuesta correcta no está siempre en el mismo lugar.
    expect(correctas.size).toBeGreaterThan(1);
  });
});

describe("paso 6 con las opciones de la misión (missions/ #89)", () => {
  const tormenta = SpaceWeatherEventSchema.parse({
    id: "2024-05-20-marte", tipo: "CME", inicio: "2024-05-20T05:36:00Z", duracionHoras: 24, intensidad: 0.74,
    fuente: { nombreKey: "fuente.donki", url: "https://ccmc.gsfc.nasa.gov/tools/DONKI/", idFuente: "x", consultadoEl: "2026-11-13" },
  });
  // Misma forma que MISION_JEZERO.dilemaPaso6.opciones (mock hasta que #89 entre a develop).
  const dilema = [
    { accion: { tipo: "refugiarse" as const }, defiende: "doctora" as const },
    { accion: { tipo: "subir_escudo" as const, nivel: 2 }, defiende: "ingeniera" as const },
    { accion: { tipo: "esperar" as const }, defiende: null },
  ];
  const e = escenaTormenta({ ...vista, tormenta }, dilema)!;
  it("cada experto propone la acción que defiende en la misión y aguantar queda como tercera opción", () => {
    expect(e.opciones).toEqual(dilema.map((o) => o.accion));
    expect(e.dialogos[1]?.accion).toEqual({ tipo: "refugiarse" });
    expect(e.dialogos[2]?.accion).toEqual({ tipo: "subir_escudo", nivel: 2 });
    expect(e.dialogos[3]?.lineas[0]?.clave).toBe("agentes.escena6.aguantar");
  });
  it("sin cifra de gasto inventada para subir_escudo", () => {
    expect(e.dialogos[2]?.lineas[1]).toEqual({ clave: "agentes.escena6.ingeniera.costoSinCifra", vars: { energia: 49 } });
    clavesExisten(e.dialogos);
  });
});
