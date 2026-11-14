import { describe, expect, it } from "vitest";
import en from "../i18n/en.json";
import es from "../i18n/es.json";
import { consejosSatelite, type VistaAgente } from "./index.js";

const orbita = { alturaKm: 300, franja: 0.5, bateriaPct: 72.4, senalPct: 55, escudoPct: 80 };
const vista = (o: Partial<typeof orbita> = {}, tormenta: VistaAgente["tormenta"] = null) => ({
  recursos: { energia: 60, soporte_vital: 70, blindaje: 50 },
  tripulacion: [],
  equipos: {},
  tormenta,
  orbita: { ...orbita, ...o },
});

describe("consejos en fase satélite", () => {
  it("sin órbita (fase base) no hay consejos de satélite", () => {
    expect(consejosSatelite({ ...vista(), orbita: null })).toEqual([]);
  });
  it("los 3 expertos leen la órbita del estado", () => {
    const [ing, met, doc] = consejosSatelite(vista());
    expect(ing?.lineas[0]).toEqual({ clave: "agentes.satelite.ingeniera.altura", vars: { bateria: 72 } });
    expect(met?.lineas[0]).toEqual({ clave: "agentes.satelite.meteorologa.senal", vars: { senal: 55 } });
    expect(doc?.lineas[0]?.clave).toBe("agentes.satelite.doctora.microgravedad");
  });
  it("batería baja es alerta", () => {
    const [ing] = consejosSatelite(vista({ bateriaPct: 12 }));
    expect(ing?.prioridad).toBe("alerta");
    expect(ing?.lineas[0]?.clave).toBe("agentes.satelite.ingeniera.bateriaBaja");
  });
  it("claves en en y es", () => {
    for (const d of consejosSatelite(vista({ bateriaPct: 5 }))) for (const l of d.lineas) {
      expect(en[l.clave as keyof typeof en], l.clave).toBeDefined();
      expect(es[l.clave as keyof typeof es], l.clave).toBeDefined();
    }
  });
});
