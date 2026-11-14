import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { curarLunaSur } from "../scripts/luna-sur-curar";
import { terrenoLunaPoloSur as t } from "../src";
import { aPolarSur } from "../src/terreno";

const dir = join(__dirname, "..", "terreno", "luna-polo-sur");
const es = JSON.parse(readFileSync(join(__dirname, "..", "i18n", "es.json"), "utf-8"));
const en = JSON.parse(readFileSync(join(__dirname, "..", "i18n", "en.json"), "utf-8"));

describe("terreno Luna polo sur", () => {
  it("se regenera idéntico desde los DEM", () => {
    expect(JSON.parse(readFileSync(join(dir, "luna-polo-sur.json"), "utf-8"))).toEqual(curarLunaSur());
  });

  it("6 sitios con DEM del tamaño declarado y cifras plausibles", () => {
    expect(t.sitios.map((s) => s.id).sort()).toEqual(["de-gerlache", "faustini", "haworth", "malapert", "nobile", "shackleton"]);
    for (const s of t.sitios) {
      expect(statSync(join(dir, s.dem.archivo)).size, s.id).toBe(s.dem.ancho * s.dem.alto * 2);
      expect(s.lat, s.id).toBeLessThan(-84);
      expect(s.pendienteGrados, s.id).toBeLessThan(30);
      expect(s.relieveM, s.id).toBeGreaterThan(50);
      expect(s.elevacionM, s.id).toBeGreaterThan(-7762); // mínimo del DEM polar
      expect(s.elevacionM, s.id).toBeLessThan(7027); // máximo del DEM polar
    }
  });

  it("el recuadro en metros está centrado en la posición del sitio (proyección polar)", () => {
    for (const s of t.sitios) {
      const { x, y } = aPolarSur(s.lat, s.lon);
      expect((s.bboxM.xmin + s.bboxM.xmax) / 2, s.id).toBeCloseTo(x, -1);
      expect((s.bboxM.ymin + s.bboxM.ymax) / 2, s.id).toBeCloseTo(y, -1);
    }
  });


  it("luz y blindaje quedan pendientes (null), no inventados", () => {
    expect(t.fuente.pendientes).toEqual(["luz", "blindaje"]);
    for (const s of t.sitios) expect([s.puntajes.luz, s.puntajes.blindaje]).toEqual([null, null]);
  });

  it("fuente y fecha presentes, y consulta.json guarda las URLs", () => {
    expect(t.fuente.urls[0]).toMatch(/^https:\/\/trek\.nasa\.gov\/moon\//);
    expect(t.fuente.consultadoEl).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const c = JSON.parse(readFileSync(join(dir, "consulta.json"), "utf-8"));
    for (const s of c.sitios) {
      expect(s.urlPos).toContain("CombinedNomenclature");
      expect(s.urlDem).toContain("LRO_LOLA_DEM_SPole75_30mp_v04");
    }
  });

  it("textos es/en para el mapa, cada sitio y la fuente", () => {
    const claves = [t.nombreKey, t.fuente.nombreKey, t.fuente.derivadoKey];
    for (const s of t.sitios) claves.push(s.nombreKey, s.descripcionKey);
    for (const k of claves) {
      expect(es[k], k).toBeTruthy();
      expect(en[k], k).toBeTruthy();
    }
  });
});
