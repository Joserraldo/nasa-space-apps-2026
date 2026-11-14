import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { curarLuna } from "../scripts/luna-curar";
import { terrenoLunaVisible as t } from "../src";

const dir = join(__dirname, "..", "terreno", "luna-visible");
const es = JSON.parse(readFileSync(join(__dirname, "..", "i18n", "es.json"), "utf-8"));
const en = JSON.parse(readFileSync(join(__dirname, "..", "i18n", "en.json"), "utf-8"));

describe("terreno Luna lado visible", () => {
  it("se regenera idéntico desde los DEM", () => {
    expect(JSON.parse(readFileSync(join(dir, "luna-visible.json"), "utf-8"))).toEqual(curarLuna());
  });

  it("3 sitios con DEM del tamaño declarado y cifras plausibles", () => {
    expect(t.sitios.map((s) => s.id).sort()).toEqual(["borde-rima-hadley", "llanura-tranquilidad", "tierras-altas-descartes"]);
    for (const s of t.sitios) {
      expect(statSync(join(dir, s.dem.archivo)).size, s.id).toBe(s.dem.ancho * s.dem.alto * 2);
      expect(statSync(join(dir, s.sombreado)).size, s.id).toBeGreaterThan(1_000);
      expect(s.pendienteGrados, s.id).toBeLessThan(15);
      expect(s.relieveM, s.id).toBeGreaterThan(50);
      expect(s.relieveM, s.id).toBeLessThan(5000);
      expect(s.elevacionM, s.id).toBeGreaterThan(-9126); // mínimo del DEM global
      expect(s.elevacionM, s.id).toBeLessThan(10767); // máximo del DEM global
      expect(s.puntajes.plano).toBeGreaterThanOrEqual(0);
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
      expect(s.urlDem).toContain("LRO_LOLA_DEM_Global_128ppd_v04");
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
