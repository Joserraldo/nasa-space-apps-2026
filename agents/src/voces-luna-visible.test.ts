import { describe, expect, it } from "vitest";
import { ActionSchema, type SourceCard } from "@solar-shield/contracts";
import { eventosCurados } from "@solar-shield/data";
import en from "../i18n/en.json";
import es from "../i18n/es.json";
import {
  escenaAntena,
  escenaTormentaLunaVisible,
  preguntaIris,
  tresLugares,
  TORMENTA_LUNA_VISIBLE,
  type Dialogo,
  type MedicionCitada,
  type VistaAgente,
} from "./index.js";

const tormenta = eventosCurados.find((e) => e.id === TORMENTA_LUNA_VISIBLE)!;
const vista: VistaAgente = { recursos: { energia: 63, soporte_vital: 60, blindaje: 45 }, tripulacion: [], tormenta, equipos: { bateria: "ok" } };
const fuenteCrater: SourceCard = { nombreKey: "fuente.crater", url: "https://visualization.osdr.nasa.gov/radlab/", idFuente: "crater-2024-05-10-gannon", consultadoEl: "2026-11-14" };
// luna.json de #95 para Gannon: ×206,3 con fondo tranquilo.
const crater: MedicionCitada = { factor: 206.3, lugar: "orbita_luna", fuente: fuenteCrater, fondoTranquilo: true };

const claves = (ds: Dialogo[]) => ds.flatMap((d) => d.lineas.map((l) => l.clave));
const existen = (ks: string[]) => {
  for (const k of ks.filter((k) => k.startsWith("agentes."))) {
    expect(en[k as keyof typeof en], k).toBeDefined();
    expect(es[k as keyof typeof es], k).toBeDefined();
  }
};

describe("voces de Luna lado visible (#100)", () => {
  it("tormenta: Doctora 'en órbita, no en el suelo' ×206 con fuente de CRaTER; Kp en la Tierra; es de noche", () => {
    const e = escenaTormentaLunaVisible(vista, undefined, crater)!;
    const doctora = e.dialogos.find((d) => d.experto === "doctora")!;
    expect(doctora.lineas[0]).toEqual({ clave: "agentes.luna_visible.tormenta.doctora", vars: { factor: 206 } });
    expect(doctora.fuente).toEqual(fuenteCrater);
    expect(en["agentes.luna_visible.tormenta.doctora"]).toMatch(/not on the ground/);
    expect(es["agentes.luna_visible.tormenta.doctora"]).toMatch(/no en el suelo/);
    const met = claves(e.dialogos.filter((d) => d.experto === "meteorologa"));
    expect(met).toContain("agentes.escena6.meteorologa.kpTierra");
    expect(met).toContain("agentes.luna_visible.tormenta.noche");
    expect(e.dialogos.find((d) => d.experto === "ingeniera")?.lineas[0]?.clave).toBe("agentes.luna_visible.dilema.ingeniera");
    existen(claves(e.dialogos));
  });

  it("sin CRaTER: la Doctora no da cifra (RAD en Marte no subió con Gannon)", () => {
    const doctora = escenaTormentaLunaVisible(vista)!.dialogos.find((d) => d.experto === "doctora")!;
    expect(doctora.lineas[0]?.clave).toBe("agentes.escena6.doctora.sinMedida");
  });

  it("antena averiada: reparar o seguir, y es mala suerte", () => {
    expect(escenaAntena(vista)).toBeNull();
    const e = escenaAntena({ ...vista, equipos: { antena: "averiado" } })!;
    expect(e.opciones).toEqual([{ tipo: "reparar", equipo: "antena" }, { tipo: "esperar" }]);
    expect(e.opciones.every((a) => ActionSchema.safeParse(a).success)).toBe(true);
    existen(claves(e.dialogos));
  });

  it("tres lugares: Kp 9 en la Tierra, Marte casi nada (×1,0 de RAD), Luna ×206 en órbita", () => {
    const [met, doc, iris] = tresLugares(vista, crater);
    expect(met?.lineas).toEqual([{ clave: "agentes.luna_visible.tres.tierra", vars: { kp: "Kp 9" } }, { clave: "agentes.luna_visible.tres.marteNada" }]);
    expect(met?.fuente).toEqual(tormenta.fuente);
    expect(doc?.lineas[0]?.vars).toEqual({ factor: 206 });
    expect(doc?.fuente).toEqual(fuenteCrater);
    expect(iris?.experto).toBe("ia_base");
    existen(claves([met!, doc!, iris!]));
    expect(tresLugares(vista).some((d) => d.experto === "doctora")).toBe(false);
  });

  it("Iris: Luna vs Marte, la correcta es 'mucho más cerca' y la explicación no da cifras", () => {
    const p = preguntaIris("luna_vs_marte", "pistas")!;
    expect(en[p.opcionesKeys[p.correcta] as keyof typeof en]).toMatch(/closer/);
    expect(en["agentes.iris.pregunta.luna_vs_marte.porque"]).not.toMatch(/\d/);
    existen([p.dialogo.lineas[0]!.clave, ...p.opcionesKeys, "agentes.iris.pregunta.luna_vs_marte.porque"]);
  });
});
