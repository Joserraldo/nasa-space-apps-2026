import { describe, expect, it } from "vitest";
import { ActionSchema, SpaceWeatherEventSchema, type SourceCard } from "@solar-shield/contracts";
import { regionPoloNorte, solMaxVerano } from "@solar-shield/data";
import en from "../i18n/en.json";
import es from "../i18n/es.json";
import {
  avisoNochePolar,
  consejosZonasPoloNorte,
  escenaEscarcha,
  escenaTormentaPoloNorte,
  LATITUD_ZONA_POLO_NORTE,
  preguntaIris,
  responderPreguntaIris,
  type Dialogo,
  type VistaAgente,
  type ZonaPoloNorte,
} from "./index.js";

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
const vista: VistaAgente = { recursos: { energia: 41.6, soporte_vital: 70, blindaje: 50 }, tripulacion: [], tormenta, equipos: { panel_solar: "ok" } };

const claves = (ds: Dialogo[]) => ds.flatMap((d) => d.lineas.flatMap((l) => [l.clave, ...Object.entries(l.vars ?? {}).filter(([k]) => k.endsWith("Key")).map(([, v]) => String(v))]));
const existen = (ks: string[]) => {
  for (const k of ks.filter((k) => k.startsWith("agentes."))) {
    expect(en[k as keyof typeof en], k).toBeDefined();
    expect(es[k as keyof typeof es], k).toBeDefined();
  }
};

describe("voces de Marte polo norte (#97)", () => {
  const region = regionPoloNorte();
  const fuente: SourceCard = { nombreKey: region.fuente.nombreKey, url: region.fuente.url, idFuente: "marsfact", consultadoEl: region.fuente.consultadoEl };
  const solMaxGrados = Object.fromEntries(
    (Object.keys(LATITUD_ZONA_POLO_NORTE) as ZonaPoloNorte[]).map((z) => [z, solMaxVerano(LATITUD_ZONA_POLO_NORTE[z])]),
  ) as Record<ZonaPoloNorte, number>;

  it("zonas: los grados salen del cálculo de data/ (45 y 33) y van con la fuente de NSSDC", () => {
    const [ingeniera, doctora, meteorologa] = consejosZonasPoloNorte({ solMaxGrados, fuente });
    expect(ingeniera?.lineas.map((l) => l.vars?.grados)).toEqual([45, 33]);
    expect(Math.round(region.solMaxVeranoGrados)).toBe(33);
    expect(ingeniera?.fuente).toEqual(fuente);
    expect([doctora?.experto, meteorologa?.experto]).toEqual(["doctora", "meteorologa"]);
    existen(claves([ingeniera!, doctora!, meteorologa!]));
  });

  it("zonas sin contexto: la Ingeniera no dice grados", () => {
    const [ingeniera] = consejosZonasPoloNorte();
    expect(ingeniera?.fuente).toBeUndefined();
    expect(ingeniera?.lineas.every((l) => l.vars?.grados === undefined)).toBe(true);
  });

  it("escarcha: misma decisión que el polvo, con sus frases", () => {
    const e = escenaEscarcha(vista)!;
    expect(e.opciones.every((a) => ActionSchema.safeParse(a).success)).toBe(true);
    expect(e.dialogos[0]?.lineas[0]).toEqual({ clave: "agentes.polo_norte.escarcha.alerta", vars: { energia: 42 } });
    expect(claves(e.dialogos).some((k) => k.startsWith("agentes.polvo.ingeniera"))).toBe(false);
    expect(escenaEscarcha({ ...vista, equipos: {} })).toBeNull();
    existen(claves(e.dialogos));
  });

  it("tormenta: la Doctora dice que se midió lejos, en Gale; nunca 'en el polo'", () => {
    const e = escenaTormentaPoloNorte(vista)!;
    const doctora = e.dialogos.find((d) => d.experto === "doctora")!;
    expect(doctora.lineas[0]).toEqual({ clave: "agentes.escena6.doctora.medidaGale", vars: { factor: 19 } });
    expect(doctora.fuente?.idFuente).toBe("2024-05-20T05:36:00-CME-001");
    expect(en["agentes.escena6.doctora.medidaGale"]).toMatch(/Gale/);
    expect(es["agentes.escena6.doctora.medidaGale"]).toMatch(/Gale/);
    for (const t of [en, es]) for (const k of claves(e.dialogos)) expect(String(t[k as keyof typeof t] ?? "")).not.toMatch(/\bpol[eo]\b.*×|here at the pole|aquí en el polo/i);
    expect(e.dialogos.find((d) => d.experto === "ingeniera")?.lineas[0]?.clave).toBe("agentes.polo_norte.dilema.ingeniera");
    existen(claves(e.dialogos));
  });

  it("noche polar: la Ingeniera cita la energía del estado e Iris dice que el tiempo va comprimido, con fuente", () => {
    const [ingeniera, iris] = avisoNochePolar(vista);
    expect(ingeniera?.lineas[0]?.vars).toEqual({ energia: 42 });
    expect(iris?.fuente?.url).toMatch(/nssdc/);
    existen(claves([ingeniera!, iris!]));
  });

  it("Iris pregunta por la noche polar: la correcta es la batería y siempre explica", () => {
    const p = preguntaIris("noche_polar", "pistas")!;
    expect(en[p.opcionesKeys[p.correcta] as keyof typeof en]).toMatch(/battery/);
    expect(responderPreguntaIris(p, null).lineas[1]?.clave).toBe("agentes.iris.pregunta.noche_polar.porque");
    existen([p.dialogo.lineas[0]!.clave, ...p.opcionesKeys]);
  });
});
