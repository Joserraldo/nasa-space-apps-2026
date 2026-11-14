import { describe, expect, it } from "vitest";
import { ActionSchema, SpaceWeatherEventSchema } from "@solar-shield/contracts";
import en from "../i18n/en.json";
import es from "../i18n/es.json";
import { escenaTormenta, type VistaAgente } from "./index.js";

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
const vista: VistaAgente = { recursos: { energia: 62.4, soporte_vital: 70, blindaje: 40 }, tripulacion: [], tormenta, equipos: {} };

describe("escena del paso 6: dos expertos se contradicen", () => {
  const escena = escenaTormenta(vista)!;

  it("sin tormenta no hay escena", () => {
    expect(escenaTormenta({ ...vista, tormenta: null })).toBeNull();
  });

  it("orden: Meteoróloga avisa, Doctora y Ingeniera discrepan, Iris deja decidir", () => {
    expect(escena.dialogos.map((d) => d.experto)).toEqual(["meteorologa", "doctora", "ingeniera", "ia_base"]);
    expect(escena.dialogos[0]?.prioridad).toBe("alerta");
  });

  it("los dos consejos son opuestos, válidos y ninguno se aplica solo", () => {
    const [refugio, escudo] = escena.opciones;
    expect(refugio).toEqual({ tipo: "refugiarse" });
    expect(escudo.tipo).toBe("redistribuir_energia");
    expect(escena.opciones.every((a) => ActionSchema.safeParse(a).success)).toBe(true);
    expect(escena.dialogos[1]?.accion).toEqual(refugio);
    expect(escena.dialogos[2]?.accion).toEqual(escudo);
  });

  it("cada uno cita su dato: medición real con fuente vs energía del estado", () => {
    expect(escena.dialogos[1]?.lineas[0]).toEqual({ clave: "agentes.escena6.doctora.medida", vars: { factor: 19 } });
    expect(escena.dialogos[1]?.fuente?.idFuente).toBe("2024-05-20T05:36:00-CME-001");
    expect(escena.dialogos[2]?.lineas[1]?.vars).toEqual({ energia: 62, gasto: 45 });
    expect(escena.dialogos[0]?.lineas[0]?.vars).toEqual({ fecha: "2024-05-20", nombreKey: "datos.tormenta.2024-05-20-marte.nombre" });
  });

  it("sin medición en Marte, la Doctora no inventa un factor", () => {
    const sin = escenaTormenta({ ...vista, tormenta: { ...tormenta, medicionMarte: undefined } as typeof tormenta })!;
    expect(sin.dialogos[1]?.lineas[0]).toEqual({ clave: "agentes.escena6.doctora.sinMedida" });
  });

  it("todas sus claves existen en en y es", () => {
    for (const d of escena.dialogos) for (const l of d.lineas) if (l.clave.startsWith("agentes.")) {
      expect(en[l.clave as keyof typeof en], l.clave).toBeDefined();
      expect(es[l.clave as keyof typeof es], l.clave).toBeDefined();
    }
  });
});

describe("cada cifra con su lugar (voces de las misiones de datos)", () => {
  const crater = { nombreKey: "fuente.crater", url: "https://crater-web.sr.unh.edu/", idFuente: "crater-2024-05-10", consultadoEl: "2026-11-14" };

  it("medición en órbita lunar: frase de órbita, su factor y su propia fuente", () => {
    const e = escenaTormenta(vista, undefined, { factor: 205.7, lugar: "orbita_luna", fuente: crater })!;
    expect(e.dialogos[1]?.lineas[0]).toEqual({ clave: "agentes.escena6.doctora.medidaOrbitaLuna", vars: { factor: 206 } });
    expect(e.dialogos[1]?.fuente).toEqual(crater);
    expect(en["agentes.escena6.doctora.medidaOrbitaLuna"]).toMatch(/orbit/);
  });

  it("Kp solo si DONKI lo midió en la Tierra, y la frase dice 'en la Tierra'", () => {
    const gst = { tipo: "GST" as const, idFuente: "2024-05-10T15:00:00-GST-001", offsetHoras: 20, magnitudTexto: "Kp 9", observadoEn: "Tierra" as const };
    const con = escenaTormenta({ ...vista, tormenta: { ...tormenta, fases: [gst] } })!;
    expect(con.dialogos[0]?.lineas.at(-1)).toEqual({ clave: "agentes.escena6.meteorologa.kpTierra", vars: { kp: "Kp 9" } });
    expect(en["agentes.escena6.meteorologa.kpTierra"]).toMatch(/on Earth/i);
    expect(es["agentes.escena6.meteorologa.kpTierra"]).toMatch(/en la Tierra/);
    const sinKp = escenaTormenta(vista)!;
    expect(sinKp.dialogos[0]?.lineas.some((l) => l.clave.endsWith("kpTierra"))).toBe(false);
  });
});
