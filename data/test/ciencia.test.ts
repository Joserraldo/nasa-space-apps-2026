import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { radiacion, tarjetasCsa, tarjetasOsdr } from "../src";

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

  it("las tarjetas nuevas de OSDR solo dicen lo que dice su estudio", () => {
    const muestra: { Accession: string; "Study Description": string }[] = read("samples/osdr-search.json");
    const desc = (id: string) => muestra.find((m) => m.Accession === id)!["Study Description"];
    // Lechuga: segura y comestible (conclusión del estudio), nada de "la cultivaron los astronautas".
    expect(desc("OSD-269")).toContain("safe, edible, fresh food");
    expect(desc("OSD-269")).toContain("red romaine lettuce");
    // Gravedad de Marte + luz roja.
    expect(desc("OSD-314")).toContain("Mars partial gravity level");
    expect(desc("OSD-314")).toContain("only when red photostimulation is provided");
    // Músculo más liviano tras unas 4 semanas.
    expect(desc("OSD-326")).toContain("Wet weight of quadriceps were significantly reduced in FLT mice");
    expect(desc("OSD-326")).toContain("approximately four weeks");
    expect(en["datos.ciencia.OSD-326.texto"]).toMatch(/four weeks/);
    expect(es["datos.ciencia.OSD-326.texto"]).toMatch(/cuatro semanas/);
    // Timo que se encoge en el espacio.
    expect(desc("OSD-289")).toContain("The thymus undergoes atrophy during spaceflight");
  });

  it("tarjetas de la CSA: socia, no NASA, con crédito, cifras de su página y textos en/es", () => {
    expect(tarjetasCsa.dueno).toContain("no NASA");
    expect(tarjetasCsa.credito).toBe("© Canadian Space Agency");
    expect(en["fuente.csa"]).toContain("not NASA");
    expect(es["fuente.csa"]).toContain("no NASA");
    for (const t of tarjetasCsa.tarjetas)
      for (const k of [t.tituloKey, t.textoKey]) {
        expect(en[k], k).toBeTruthy();
        expect(es[k], k).toBeTruthy();
      }
    expect(en["datos.ciencia.csa-comer-en-la-estacion.texto"]).toMatch(/3 meals and 1 snack/);
    expect(en["datos.ciencia.csa-granja-espacial.texto"]).toMatch(/could make more than 700 kg/);
  });
});

describe("referenciaDosis (para agentes)", () => {
  it("devuelve mSv/día con una SourceCard válida del contrato real", async () => {
    const { referenciaDosis } = await import("../src");
    const { SourceCardSchema } = await import("../src/contrato");
    const m = referenciaDosis("marte-superficie");
    expect(m.valor).toBe(0.64);
    expect(m.unidad).toBe("mSv/día");
    expect(SourceCardSchema.safeParse(m.fuente).success).toBe(true);
    expect(es[m.fuente.nombreKey]).toBeTruthy();
    expect(en[m.fuente.nombreKey]).toBeTruthy();
    expect(referenciaDosis("luna-superficie").fuente.dueno).toContain("CNSA");
    expect(() => referenciaDosis("venus")).toThrow();
  });
});
