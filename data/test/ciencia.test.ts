import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { radiacion, tarjetasOsdr } from "../src";

const read = (p: string) => JSON.parse(readFileSync(join(__dirname, "..", p), "utf-8"));
const es = read("i18n/es.json");
const en = read("i18n/en.json");

describe("ciencia", () => {
  it("dosis: solo mSv/día de dosis equivalente, con cita y dueño", () => {
    for (const r of radiacion.referencias) {
      expect(r.unidad).toBe("mSv/día");
      expect(r.cita.length).toBeGreaterThan(20);
      expect(es[r.lugarKey]).toBeTruthy();
      expect(en[r.lugarKey]).toBeTruthy();
    }
  });

  it("la dosis lunar es de CNSA, no de NASA", () => {
    const luna = radiacion.referencias.find((r) => r.id === "luna-superficie")!;
    expect(luna.esNasa).toBe(false);
    expect(luna.dueno).toContain("CNSA");
  });

  it("cada tarjeta OSDR tiene un estudio que existe en la muestra guardada y textos es/en", () => {
    const muestra: { Accession: string }[] = read("samples/osdr-search.json");
    for (const t of tarjetasOsdr.tarjetas) {
      expect(muestra.some((m) => m.Accession === t.id), t.id).toBe(true);
      for (const k of [t.tituloKey, t.textoKey]) {
        expect(es[k], k).toBeTruthy();
        expect(en[k], k).toBeTruthy();
      }
    }
  });

  it("las cifras de las tarjetas coinciden con la descripción de cada estudio", () => {
    const muestra: { Accession: string; "Study Description": string }[] = read("samples/osdr-search.json");
    const desc = (id: string) => muestra.find((m) => m.Accession === id)!["Study Description"];
    expect(desc("OSD-772")).toContain("137 days");
    expect(desc("OSD-772")).toContain("26 pepper");
    expect(es["datos.ciencia.OSD-772.texto"]).toMatch(/137.*26/);
    expect(desc("OSD-546")).toContain("about 50% inflight");
    expect(desc("OSD-546")).toContain("approx. 2 weeks");
  });
});
