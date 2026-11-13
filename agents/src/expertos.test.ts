import { describe, expect, it } from "vitest";
import { SpaceWeatherEventSchema, type ClassifierOutput } from "@solar-shield/contracts";
import en from "../i18n/en.json";
import es from "../i18n/es.json";
import { clasificarConAtajos, responder, type Dialogo, type VistaAgente } from "./index.js";

// Copia mínima del evento curado 2024-05-20-marte (data/curated); la integración usará el real.
const tormenta = SpaceWeatherEventSchema.parse({
  id: "2024-05-20-marte",
  tipo: "CME",
  inicio: "2024-05-20T05:36:00Z",
  duracionHoras: 24,
  intensidad: 0.74,
  fuente: { nombreKey: "fuente.donki", url: "https://ccmc.gsfc.nasa.gov/tools/DONKI/", idFuente: "2024-05-20T05:36:00-CME-001", consultadoEl: "2026-11-13" },
  marcoMarte: "observado",
  medicionMarte: { unidad: "µGy/h", fondo: 4.1, pico: 79.7, factor: 19.4, offsetHorasPico: 10 },
});

const vista = (cambios: Partial<VistaAgente> = {}): VistaAgente => ({
  recursos: { energia: 60, soporte_vital: 70, blindaje: 50 },
  tripulacion: [{ id: "doctora", disponible: true, sesgo: 0, dosisMSv: 1.234 }],
  tormenta: null,
  equipos: { panel_solar: "ok", antena: "averiado" },
  ...cambios,
});

const dosisMarte = { valor: 0.64, unidad: "mSv/día" as const, fuente: { nombreKey: "datos.radiacion.marte-superficie.lugar", url: "https://elib.dlr.de/106090/", idFuente: "marte-superficie", consultadoEl: "2026-11-13" } };

const decir = (frase: string, v = vista()) => responder(clasificarConAtajos(frase)!, v, { dosisMarte });
const claves = (d: Dialogo) => d.lineas.map((x) => x.clave);

describe("Ingeniera", () => {
  it("lee los recursos del estado, no inventa cifras", () => {
    const d = decir("cuanta bateria queda");
    expect(d.lineas[0]).toEqual({ clave: "agentes.ingeniera.energia.ok", vars: { energia: 60, blindaje: 50, soporte: 70 } });
    expect(d.fuente).toBeUndefined();
  });
  it("propone la acción para que el jugador la confirme", () => {
    expect(decir("sube el escudo ya!!!").accion).toEqual({ tipo: "redistribuir_energia", hacia: "blindaje", cantidad: 45 });
  });
  it("no repara lo que está sano; sí lo averiado", () => {
    expect(claves(decir("arregla el panel"))).toEqual(["agentes.ingeniera.reparar.sano"]);
    expect(decir("fix the antenna please").accion).toEqual({ tipo: "reparar", equipo: "antena" });
  });
});

describe("Doctora", () => {
  it("nunca atribuye síntomas a la radiación y cita la dosis del estado", () => {
    const d = decir("me duele la cabeza al astronauta");
    expect(d.lineas[0]).toEqual({ clave: "agentes.doctora.salud.estado", vars: { dosis: 1.23 } });
    expect(claves(d)).toContain("agentes.doctora.salud.noSeSiente");
  });
  it("la cifra de Marte sale de data/ con su fuente", () => {
    const d = decir("que es eso de la dosis");
    expect(d.lineas[1]).toEqual({ clave: "agentes.doctora.dosis.marte", vars: { valor: 0.64 } });
    expect(d.fuente?.url).toBe("https://elib.dlr.de/106090/");
  });
});

describe("Meteoróloga", () => {
  it("sin tormenta no inventa una", () => {
    expect(claves(decir("viene una tormenta?"))[0]).toBe("agentes.meteorologa.pronostico.calma");
  });
  it("con la tormenta dorada: fecha real, marco 'observado', factor medido y tarjeta de fuente", () => {
    const d = decir("is a storm coming", vista({ tormenta }));
    expect(d.prioridad).toBe("alerta");
    expect(d.lineas[0]?.vars).toEqual({ fecha: "2024-05-20", nombreKey: "datos.tormenta.2024-05-20-marte.nombre" });
    expect(claves(d)).toContain("datos.marco.observado");
    expect(d.lineas.find((x) => x.clave.endsWith("medida"))?.vars).toEqual({ factor: 19 });
    expect(d.fuente?.idFuente).toBe("2024-05-20T05:36:00-CME-001");
  });
});

describe("Iris y aclaraciones", () => {
  it("nivel 1: recomienda a la Meteoróloga si hay tormenta", () => {
    expect(decir("ayuda", vista({ tormenta })).lineas[0]?.vars).toEqual({ expertoKey: "agentes.nombre.meteorologa" });
  });
  it("confianza baja → el experto pregunta", () => {
    const s: ClassifierOutput = { version: "0", experto: "ingeniera", accion: "ayuda", parametros: {}, confianza: 0.5, fuente: "regex" };
    expect(claves(responder(s, vista()))).toEqual(["agentes.aclarar.ingeniera"]);
  });
});

describe("i18n en/es", () => {
  const vars = (t: string) => [...t.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
  it("mismas claves y mismas variables en los dos idiomas", () => {
    expect(Object.keys(es).sort()).toEqual(Object.keys(en).sort());
    for (const [k, t] of Object.entries(en)) expect(vars(es[k as keyof typeof es]), k).toEqual(vars(t));
  });
  it("toda clave agentes.* que sale de responder existe, con las variables que usa", () => {
    const frases = ["cuanta bateria queda", "sube el escudo", "arregla el panel", "fix the antenna", "arregla", "doctora estamos bien", "todos al refugio", "que es la dosis", "viene una tormenta", "q fue esa luz", "y si nos escondemos", "ayuda", "hola", "otra vez", "ingeniera blabla"];
    for (const v of [vista(), vista({ tormenta, recursos: { energia: 10, soporte_vital: 10, blindaje: 10 } })]) {
      for (const f of frases) {
        for (const linea of decir(f, v).lineas.filter((x) => x.clave.startsWith("agentes."))) {
          const texto = en[linea.clave as keyof typeof en];
          expect(texto, linea.clave).toBeDefined();
          expect(vars(texto), linea.clave).toEqual(Object.keys(linea.vars ?? {}).sort());
          for (const [n, val] of Object.entries(linea.vars ?? {})) if (n.endsWith("Key") && String(val).startsWith("agentes.")) expect(en[val as keyof typeof en], String(val)).toBeDefined();
        }
      }
    }
  });
});
