import { describe, expect, it } from "vitest";
import { ActionSchema, type SourceCard } from "@solar-shield/contracts";
import { eventosCurados } from "@solar-shield/data";
import en from "../i18n/en.json";
import es from "../i18n/es.json";
import {
  avisoControlLuna,
  escenaMicrometeorito,
  escenaTormenta,
  escenaTormentaLunaSur,
  preguntaIris,
  TORMENTA_LUNA_POLO_SUR,
  type Dialogo,
  type MedicionCitada,
  type VistaAgente,
} from "./index.js";

const tormenta = eventosCurados.find((e) => e.id === TORMENTA_LUNA_POLO_SUR)!;
const vista: VistaAgente = { recursos: { energia: 57.4, soporte_vital: 60, blindaje: 45 }, tripulacion: [], tormenta, equipos: { panel_solar: "ok" } };
// Forma que arma ui con medicionLuna + fuenteCrater (#95): X8.2 en CRaTER tiene fondo NO tranquilo.
const fuenteCrater: SourceCard = { nombreKey: "fuente.crater", url: "https://visualization.osdr.nasa.gov/radlab/", idFuente: "crater-2017-09-10-x82", consultadoEl: "2026-11-14" };
const crater: MedicionCitada = { factor: 27, lugar: "orbita_luna", fuente: fuenteCrater, fondoTranquilo: false };

const claves = (ds: Dialogo[]) => ds.flatMap((d) => d.lineas.map((l) => l.clave));
const existen = (ks: string[]) => {
  for (const k of ks.filter((k) => k.startsWith("agentes."))) {
    expect(en[k as keyof typeof en], k).toBeDefined();
    expect(es[k as keyof typeof es], k).toBeDefined();
  }
};

describe("MedicionCitada respeta fondoTranquilo", () => {
  it("fondo no tranquilo: la Doctora dice 'en órbita' sin factor", () => {
    const e = escenaTormenta(vista, undefined, crater)!;
    expect(e.dialogos[1]?.lineas[0]).toEqual({ clave: "agentes.escena6.doctora.medidaOrbitaLunaSinFactor" });
    expect(en["agentes.escena6.doctora.medidaOrbitaLunaSinFactor"]).toMatch(/in orbit/);
  });
  it("fondo tranquilo (Gannon ×206): sí dice el factor", () => {
    const e = escenaTormenta(vista, undefined, { ...crater, factor: 206.3, fondoTranquilo: true })!;
    expect(e.dialogos[1]?.lineas[0]?.vars).toEqual({ factor: 206 });
  });
});

describe("voces de Luna polo sur (#98)", () => {
  it("la tormenta curada es X8.2 de 2017, sin Kp (no hay GST)", () => {
    expect(tormenta).toBeDefined();
    expect(tormenta.fases?.some((f) => f.tipo === "GST")).toBe(false);
  });

  it("tormenta: Doctora en órbita sin cifra y con la fuente de CRaTER; Meteoróloga cita Marte con su lugar (×2)", () => {
    const e = escenaTormentaLunaSur(vista, undefined, crater)!;
    const doctora = e.dialogos.find((d) => d.experto === "doctora")!;
    expect(doctora.lineas.map((l) => l.clave)).toEqual(["agentes.luna_sur.tormenta.doctora", "agentes.luna_sur.tormenta.sinAire"]);
    expect(doctora.lineas.every((l) => l.vars === undefined)).toBe(true);
    expect(doctora.fuente).toEqual(fuenteCrater);
    expect(en["agentes.luna_sur.tormenta.doctora"]).toMatch(/in orbit/);
    expect(es["agentes.luna_sur.tormenta.doctora"]).toMatch(/en órbita/);
    const meteorologa = e.dialogos.find((d) => d.experto === "meteorologa")!;
    expect(meteorologa.lineas.at(-1)).toEqual({ clave: "agentes.luna_sur.tormenta.marte", vars: { factor: 2 } });
    expect(claves(e.dialogos).some((k) => k.includes("kp"))).toBe(false);
    expect(e.dialogos.find((d) => d.experto === "ingeniera")?.lineas[0]?.clave).toBe("agentes.luna_sur.dilema.ingeniera");
    existen(claves(e.dialogos));
  });

  it("sin CRaTER, la Doctora no inventa nada", () => {
    const doctora = escenaTormentaLunaSur(vista)!.dialogos.find((d) => d.experto === "doctora")!;
    expect(doctora.lineas[0]?.clave).toBe("agentes.escena6.doctora.sinMedida");
  });

  it("micrometeorito: solo con el panel averiado; reparar o aguantar, y es mala suerte", () => {
    expect(escenaMicrometeorito(vista)).toBeNull();
    const e = escenaMicrometeorito({ ...vista, equipos: { panel_solar: "averiado" } })!;
    expect(e.opciones).toEqual([{ tipo: "reparar", equipo: "panel_solar" }, { tipo: "esperar" }]);
    expect(e.opciones.every((a) => ActionSchema.safeParse(a).success)).toBe(true);
    expect(e.dialogos[0]?.lineas[0]?.vars).toEqual({ energia: 57 });
    existen(claves(e.dialogos));
  });

  it("Control de Misión: casi al instante, con fuente NSSDC y la acción que cuesta energía", () => {
    const d = avisoControlLuna();
    expect(d.fuente?.url).toMatch(/moonfact/);
    expect(d.accion).toEqual({ tipo: "enviar_telemetria" });
    existen(claves([d]));
  });

  it("Iris: la pregunta del mensaje a la Tierra tiene la correcta en '1 segundo'", () => {
    const p = preguntaIris("mensaje_luna", "pistas")!;
    expect(en[p.opcionesKeys[p.correcta] as keyof typeof en]).toMatch(/1 second/);
    existen([p.dialogo.lineas[0]!.clave, ...p.opcionesKeys, "agentes.iris.pregunta.mensaje_luna.porque"]);
  });
});
