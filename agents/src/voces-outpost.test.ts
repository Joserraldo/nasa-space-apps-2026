import { describe, expect, it } from "vitest";
import type { SourceCard } from "@solar-shield/contracts";
import { artemis, eventosCurados } from "@solar-shield/data";
import en from "../i18n/en.json";
import es from "../i18n/es.json";
import {
  consejosZonasNave,
  escenaTormentaOutpost,
  preguntaIris,
  responderPreguntaIris,
  sorpresaOutpost,
  TORMENTA_OUTPOST,
  type Dialogo,
  type MedicionCitada,
  type VistaAgente,
} from "./index.js";

const tormenta = eventosCurados.find((e) => e.id === TORMENTA_OUTPOST)!;
const vista: VistaAgente = { recursos: { energia: 48.2, soporte_vital: 55, blindaje: 40 }, tripulacion: [], tormenta, equipos: {} };
const fuenteCrater: SourceCard = { nombreKey: "fuente.crater", url: "https://visualization.osdr.nasa.gov/radlab/", idFuente: "crater-2024-05-10-gannon", consultadoEl: "2026-11-14" };
// Valores de luna.json de #95 para Gannon: factor 206,3 con fondo tranquilo.
const crater: MedicionCitada = { factor: 206.3, lugar: "orbita_luna", fuente: fuenteCrater, fondoTranquilo: true };

const claves = (ds: Dialogo[]) => ds.flatMap((d) => d.lineas.flatMap((l) => [l.clave, ...Object.entries(l.vars ?? {}).filter(([k]) => k.endsWith("Key")).map(([, v]) => String(v))]));
const existen = (ks: string[]) => {
  for (const k of ks.filter((k) => k.startsWith("agentes."))) {
    expect(en[k as keyof typeof en], k).toBeDefined();
    expect(es[k as keyof typeof es], k).toBeDefined();
  }
};

describe("voces del outpost sorpresa (#99)", () => {
  it("la sorpresa: sin fuente de Orion no se menciona Orion; con ella, va su tarjeta de RadLab", () => {
    expect(sorpresaOutpost()).toHaveLength(1);
    const fuenteOrion: SourceCard = { ...artemis.fuente, idFuente: artemis.instrumento };
    const [, orion] = sorpresaOutpost(fuenteOrion);
    expect(orion?.fuente?.url).toMatch(/HERA/);
    existen(claves(sorpresaOutpost(fuenteOrion)));
  });

  it("zonas de la nave: Doctora, Ingeniera e Iris defienden zonas distintas, sin cifras", () => {
    const ds = consejosZonasNave();
    expect(ds.map((d) => d.lineas[0]?.vars?.zonaKey)).toEqual(["agentes.outpost.zona.centro", "agentes.outpost.zona.cabina", "agentes.outpost.zona.fondo"]);
    existen(claves(ds));
  });

  it("tormenta Gannon: CRaTER ×206 'no fue en nuestra nave', Kp en la Tierra y partículas primero", () => {
    const e = escenaTormentaOutpost(vista, undefined, crater)!;
    const doctora = e.dialogos.find((d) => d.experto === "doctora")!;
    expect(doctora.lineas[0]).toEqual({ clave: "agentes.outpost.tormenta.doctora", vars: { factor: 206 } });
    expect(doctora.fuente).toEqual(fuenteCrater);
    expect(en["agentes.outpost.tormenta.doctora"]).toMatch(/not on our ship/);
    const met = claves(e.dialogos.filter((d) => d.experto === "meteorologa"));
    expect(met).toContain("agentes.escena6.meteorologa.kpTierra");
    expect(met).toContain("agentes.outpost.tormenta.particulas");
    existen(claves(e.dialogos));
  });

  it("si el fondo de CRaTER no era tranquilo, no hay factor", () => {
    const e = escenaTormentaOutpost(vista, undefined, { ...crater, fondoTranquilo: false })!;
    expect(e.dialogos.find((d) => d.experto === "doctora")?.lineas[0]).toEqual({ clave: "agentes.escena6.doctora.medidaOrbitaLunaSinFactor" });
  });

  it("Iris: 'viaje a Marte' solo se pregunta con fuente, y la explicación la lleva", () => {
    expect(preguntaIris("viaje_marte", "pistas")).toBeNull();
    const reitz: SourceCard = { nombreKey: "fuente.dosis.marte", url: "https://elib.dlr.de/106090/", idFuente: "marte-crucero", consultadoEl: "2026-11-14" };
    const p = preguntaIris("viaje_marte", "pistas", reitz)!;
    expect(en[p.opcionesKeys[p.correcta] as keyof typeof en]).toMatch(/On the way/);
    expect(responderPreguntaIris(p, 0).fuente).toEqual(reitz);
    existen([p.dialogo.lineas[0]!.clave, ...p.opcionesKeys, "agentes.iris.pregunta.viaje_marte.porque"]);
  });
});
