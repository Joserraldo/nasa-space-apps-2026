import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { curar } from "../scripts/curar";
import { eventoRutaDorada, eventosCurados, ID_RUTA_DORADA, SpaceWeatherEventSchema, tormentasCuradas } from "../src";

const root = join(__dirname, "..");
const read = (p: string) => JSON.parse(readFileSync(join(root, p), "utf-8"));
const es = read("i18n/es.json");
const en = read("i18n/en.json");

describe("tormentas curadas", () => {
  it("se regeneran idénticas desde data/raw (nadie editó una cifra a mano)", () => {
    for (const t of curar()) expect(read(`curated/${t.id}.json`), t.id).toEqual(t);
  });

  it("el índice coincide con los archivos y con lo exportado", () => {
    const idx = read("curated/index.json");
    const archivos = readdirSync(join(root, "curated")).filter((f) => !["index.json", "config.json"].includes(f));
    expect(archivos.map((f) => f.replace(/\.json$/, "")).sort()).toEqual([...idx.orden].sort());
    expect(tormentasCuradas.map((t) => t.id)).toEqual(idx.orden);
  });

  it("todo evento es válido, curado, con ID real, dueño y fecha de consulta", () => {
    for (const ev of eventosCurados) {
      expect(SpaceWeatherEventSchema.safeParse(ev).success).toBe(true);
      expect(ev.fuente.estadoDato).toBe("curado");
      expect(ev.fuente.idFuente).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}-(FLR|CME|SEP|GST)-\d{3}$/);
      expect(ev.fuente.dueno).toContain("NASA CCMC");
      expect(ev.fuente.consultadoEl).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("el Kp siempre se atribuye a NOAA y nunca se mide en Marte", () => {
    for (const t of tormentasCuradas) {
      const gst = t.fases.filter((f) => f.tipo === "GST");
      for (const f of gst) expect(f.observadoEn).toBe("Tierra");
      if (gst.length) expect(t.fuente.dueno).toContain("NOAA");
    }
  });

  it("textos es/en para cada tormenta y cada marco", () => {
    for (const t of tormentasCuradas)
      for (const k of [t.nombreKey, t.queOcurrioKey, t.fuente.nombreKey, `datos.marco.${t.marcoMarte}`, "datos.medicion.rad", "datos.medicion.sinAumento", "fuente.radlab"]) {
        expect(es[k], k).toBeTruthy();
        expect(en[k], k).toBeTruthy();
      }
  });

  it("la ruta dorada existe y se MIDIÓ en Marte (RAD)", () => {
    expect(eventoRutaDorada.id).toBe(ID_RUTA_DORADA);
    expect(eventoRutaDorada.marcoMarte).toBe("observado");
    expect(eventoRutaDorada.medicionMarte?.unidad).toBe("µGy/h");
    expect(eventoRutaDorada.medicionMarte!.factor).toBeGreaterThanOrEqual(1.5);
  });

  it("observado solo con medición ≥ 1,5× y unidades de dosis absorbida", () => {
    for (const t of tormentasCuradas) {
      if (t.marcoMarte === "observado") expect(t.medicionMarte!.factor).toBeGreaterThanOrEqual(1.5);
      if (t.medicionMarte) {
        expect(t.medicionMarte.unidad).toBe("µGy/h");
        expect(t.fuente.dueno).toContain("RadLab");
      }
    }
  });

  it("raw no contiene la clave de la API", () => {
    for (const g of readdirSync(join(root, "raw")))
      for (const f of readdirSync(join(root, "raw", g)))
        expect(readFileSync(join(root, "raw", g, f), "utf-8")).not.toMatch(/api_key=(?!\*)/i);
  });
});
