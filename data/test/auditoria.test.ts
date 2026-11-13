/**
 * Auditoría (puerta P4): todo dato visible tiene fuente, fecha de consulta, dueño y etiqueta,
 * todo texto existe en es y en, y no hay unidades mezcladas.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { eventosCurados, eventosMock, radiacion, tarjetasOsdr, terrenoJezero, tormentasCuradas } from "../src";

const es: Record<string, string> = JSON.parse(readFileSync(join(__dirname, "..", "i18n", "es.json"), "utf-8"));
const en: Record<string, string> = JSON.parse(readFileSync(join(__dirname, "..", "i18n", "en.json"), "utf-8"));
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

describe("auditoría de datos visibles", () => {
  it("es y en tienen exactamente las mismas claves", () => {
    expect(Object.keys(es).sort()).toEqual(Object.keys(en).sort());
  });

  it("las etiquetas obligatorias existen (curado, mock, aviso de no aval, derivados)", () => {
    for (const k of ["datos.etiqueta.curado", "datos.etiqueta.mock", "datos.aviso", "datos.terreno.derivado", "datos.usados.noEnVivo"]) {
      expect(es[k], k).toBeTruthy();
      expect(en[k], k).toBeTruthy();
    }
    expect(es["datos.etiqueta.curado"]).toMatch(/no en vivo/i);
    expect(en["datos.etiqueta.curado"]).toMatch(/not live/i);
  });

  it("cada evento curado: ID real, URL, dueño, fecha y estado curado", () => {
    for (const ev of eventosCurados) {
      expect(ev.fuente.estadoDato).toBe("curado");
      expect(ev.fuente.consultadoEl).toMatch(FECHA);
      expect(ev.fuente.url).toMatch(/^https:\/\/ccmc\.gsfc\.nasa\.gov\//);
      expect(ev.fuente.dueno).toBeTruthy();
    }
    for (const ev of eventosMock) expect(ev.fuente.estadoDato).toBe("mock");
  });

  it("ningún texto visible promete un efecto en Marte que no esté medido o modelado", () => {
    for (const t of tormentasCuradas) {
      const texto = `${es[t.queOcurrioKey]} ${en[t.queOcurrioKey]}`.toLowerCase();
      const diceMarte = /marte|mars/.test(texto);
      if (diceMarte) expect(["observado", "modelado"], t.id).toContain(t.marcoMarte);
      if (t.marcoMarte === "modelado") expect(texto, t.id).toMatch(/modelo|model/);
    }
  });

  it("terreno, dosis y tarjetas OSDR tienen fuente y fecha", () => {
    expect(terrenoJezero.fuente.consultadoEl).toMatch(FECHA);
    expect(terrenoJezero.fuente.urls.length).toBeGreaterThan(0);
    expect(radiacion.consultadoEl).toMatch(FECHA);
    expect(tarjetasOsdr.consultadoEl).toMatch(FECHA);
    for (const t of tarjetasOsdr.tarjetas) expect(t.url).toContain(t.id);
  });

  it("unidades: dosis de referencia en mSv/día y mediciones RAD en µGy/h, nunca mezcladas", () => {
    for (const r of radiacion.referencias) expect(r.unidad).toBe("mSv/día");
    for (const t of tormentasCuradas) if (t.medicionMarte) expect(t.medicionMarte.unidad).toBe("µGy/h");
  });

  it("ningún texto visible usa la palabra 'en vivo' para afirmar que los datos lo son", () => {
    for (const [k, v] of Object.entries(es)) if (/en vivo/i.test(v)) expect(v, k).toMatch(/no (son )?en vivo|pero no en vivo/i);
  });
});
