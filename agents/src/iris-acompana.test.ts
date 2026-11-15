import { describe, expect, it } from "vitest";
import en from "../i18n/en.json";
import es from "../i18n/es.json";
import { briefingIris, guiaIrisLugar, type Dialogo, type GuiaLugar, type VistaAgente } from "./index.js";

const vista = (r: Partial<VistaAgente["recursos"]> = {}, iaBase?: VistaAgente["iaBase"], tormenta: VistaAgente["tormenta"] = null): VistaAgente => ({
  recursos: { energia: 60, soporte_vital: 70, blindaje: 50, ...r },
  tripulacion: [],
  equipos: {},
  tormenta,
  ...(iaBase ? { iaBase } : {}),
});
const tormenta = { kp: 7 } as unknown as NonNullable<VistaAgente["tormenta"]>;
const claves = (d: Dialogo) => d.lineas.flatMap((l) => [l.clave, ...Object.entries(l.vars ?? {}).filter(([k]) => k.endsWith("Key")).map(([, v]) => String(v))]);
const texto = (t: Record<string, string>, k: string) => t[k];
const g = (v: VistaAgente, paso: number, averiaRevelada = false) => guiaIrisLugar(v, paso, { averiaRevelada })!;

const ESPERADO: [number, GuiaLugar["destino"], GuiaLugar["experto"]][] = [
  [1, "mesa", undefined],
  [2, "mesa", undefined],
  [3, "mesa", undefined],
  [4, "taller", "ingeniera"],
  [5, "sensor", "meteorologa"],
  [6, "habitat", "doctora"],
  [7, "mesa", undefined],
  [8, "mesa", undefined],
];

describe("Iris compañera v8: destino", () => {
  for (const [paso, destino, experto] of ESPERADO) {
    it(`paso ${paso} → ${destino}`, () => {
      const r = g(vista(), paso);
      expect(r.destino).toBe(destino);
      expect(r.experto).toBe(experto);
      expect(r.ruta).toBe(true);
      expect(r.dialogo.experto).toBe("ia_base");
      expect(r.dialogo.lineas[0]?.vars?.lugarKey).toBe(`agentes.iris.lugar.${destino}`);
      expect(r.dialogo.lineas[0]?.vars?.expertoKey).toBe(experto ? `agentes.nombre.${experto}` : undefined);
    });
  }
  it("paso fuera de 1..8 → mesa", () => {
    for (const p of [0, 9, -1]) expect(g(vista(), p)).toMatchObject({ destino: "mesa", ruta: true });
  });
  it("la urgencia gana al paso fuera de tormenta", () => {
    expect(g(vista({ energia: 10 }), 1)).toMatchObject({ destino: "taller", experto: "ingeniera" });
    expect(g(vista({ blindaje: 10 }), 4)).toMatchObject({ destino: "habitat", experto: "doctora" });
    expect(g(vista({ soporte_vital: 10 }), 7)).toMatchObject({ destino: "habitat", experto: "doctora" });
    expect(g(vista({ energia: 30 }), 1).destino).toBe("mesa");
  });
  it("en tormenta manda el paso", () => {
    expect(g(vista({ energia: 10 }, undefined, tormenta), 5)).toMatchObject({ destino: "sensor", experto: "meteorologa" });
    expect(g(vista({ energia: 10 }, undefined, tormenta), 6)).toMatchObject({ destino: "habitat", experto: "doctora" });
  });
  it("la avería revelada gana a todo", () => {
    expect(g(vista({ energia: 10 }, undefined, tormenta), 5, true)).toMatchObject({ destino: "taller", experto: "ingeniera" });
  });
  it("pistas: sin ruta y sin nombrar lugar ni experta", () => {
    for (let p = 1; p <= 8; p++) {
      const r = g(vista({}, "pistas"), p);
      expect(r.ruta).toBe(false);
      expect(r.dialogo.lineas.every((l) => l.vars === undefined)).toBe(true);
    }
  });
  it("offline → null", () => {
    expect(guiaIrisLugar(vista({}, "offline"), 4)).toBeNull();
  });
  it("danada guía igual que tutorial", () => {
    for (let p = 1; p <= 8; p++) expect(g(vista({}, "danada"), p)).toEqual(g(vista({}, "tutorial"), p));
    expect(g(vista(), 4)).toEqual(g(vista({}, "tutorial"), 4));
  });
});

describe("Iris compañera v8: gesto y cara", () => {
  it("avería revelada → pedir_reparacion y cara de error (también en pistas)", () => {
    expect(g(vista(), 3, true)).toMatchObject({ gesto: "pedir_reparacion", cara: "error" });
    expect(g(vista({}, "pistas"), 3, true)).toMatchObject({ gesto: "pedir_reparacion", cara: "error" });
  });
  it("tutorial con ruta → senalar", () => {
    expect(g(vista(), 4)).toMatchObject({ ruta: true, gesto: "senalar" });
  });
  it("pistas → mirar", () => {
    expect(g(vista({}, "pistas"), 4)).toMatchObject({ ruta: false, gesto: "mirar" });
  });
  it("sin avería la cara es normal", () => {
    for (const n of ["tutorial", "pistas", "danada"] as const) for (let p = 1; p <= 8; p++) expect(g(vista({ energia: 5 }, n), p).cara).toBe("normal");
  });
  it("briefing: explicar con cara normal", () => {
    const b = briefingIris();
    expect(b.gesto).toBe("explicar");
    expect(b.cara).toBe("normal");
    expect(b.dialogo).toMatchObject({ experto: "ia_base", prioridad: "charla" });
    expect(b.dialogo.lineas).toHaveLength(3);
  });
});

describe("Iris compañera v8: textos", () => {
  const todos: Dialogo[] = [briefingIris().dialogo];
  for (const n of ["tutorial", "pistas"] as const)
    for (const r of [{}, { energia: 5 }, { blindaje: 5 }, { soporte_vital: 5 }])
      for (let p = 0; p <= 9; p++) for (const a of [false, true]) todos.push(g(vista(r, n), p, a).dialogo);
  const usadas = [...new Set(todos.flatMap(claves))];
  const lugares = ["mesa", "taller", "sensor", "habitat", "panel_solar", "escudo", "reciclador_agua", "invernadero", "antena", "banco"].map((d) => `agentes.iris.lugar.${d}`);

  it("todas las claves usadas (y los 10 lugares) existen en en y es", () => {
    for (const k of [...usadas, ...lugares]) {
      expect(texto(en, k), `en ${k}`).toBeDefined();
      expect(texto(es, k), `es ${k}`).toBeDefined();
    }
  });
  it("ninguna línea tiene cifras", () => {
    for (const k of usadas) {
      expect(texto(en, k), k).not.toMatch(/\d/);
      expect(texto(es, k), k).not.toMatch(/\d/);
    }
  });

  it("es: el lugar nunca va tras 'a' o 'de' (evita 'a el taller', 'de el hábitat')", () => {
    for (const [k, t] of Object.entries(es)) {
      if (k.startsWith("agentes.iris.acompana.")) expect(t, k).not.toMatch(/(?<![\p{L}])(a|de) \{lugarKey\}/iu);
    }
  });
});
