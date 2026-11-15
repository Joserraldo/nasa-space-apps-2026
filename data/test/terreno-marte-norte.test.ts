import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { curarMarteNorte } from "../scripts/marte-norte-curar";
import { proyectarPolarNorte, terrenoMarteNorte as t } from "../src";

const dir = join(__dirname, "..", "terreno", "marte-norte");
const es = JSON.parse(readFileSync(join(__dirname, "..", "i18n", "es.json"), "utf-8"));
const en = JSON.parse(readFileSync(join(__dirname, "..", "i18n", "en.json"), "utf-8"));
const consulta = JSON.parse(readFileSync(join(dir, "consulta.json"), "utf-8"));

describe("terreno Marte polo norte", () => {
  it("se regenera idéntico desde los DEM", () => {
    expect(JSON.parse(readFileSync(join(dir, "marte-norte.json"), "utf-8"))).toEqual(curarMarteNorte());
  });

  it("proyección polar norte: lon 0 → +y negativo, 90° E → +x, y casi nada en el polo", () => {
    // Mismos signos que el servicio (identify en 4 cuadrantes coincidió con el DEM global el 2026-11-14)
    const a = proyectarPolarNorte(0, 70);
    expect(a.x).toBeCloseTo(0, 6);
    expect(a.y).toBeLessThan(0);
    expect(proyectarPolarNorte(90, 70).x).toBeGreaterThan(0);
    expect(proyectarPolarNorte(270, 70).x).toBeLessThan(0);
    expect(proyectarPolarNorte(180, 70).y).toBeGreaterThan(0);
    expect(Math.hypot(proyectarPolarNorte(33, 89.999).x, proyectarPolarNorte(33, 89.999).y)).toBeLessThan(100);
    // ρ a 70° N = 2R·tan(10°)
    expect(Math.hypot(a.x, a.y)).toBeCloseTo(2 * 3_396_190 * Math.tan((10 * Math.PI) / 180), 3);
  });

  it("4 sitios con DEM del tamaño declarado y cifras plausibles", () => {
    expect(t.sitios.map((s) => s.id).sort()).toEqual(["canon-chasma-boreale", "crater-escorial", "crater-louth", "dunas-olympia-undae"]);
    for (const s of t.sitios) {
      expect(statSync(join(dir, s.dem.archivo)).size, s.id).toBe(s.dem.ancho * s.dem.alto * 2);
      expect(s.lat, s.id).toBeGreaterThan(64.81); // todos con noche polar
      expect(s.pendienteGrados, s.id).toBeLessThan(10);
      expect(s.relieveM, s.id).toBeGreaterThan(50);
      expect(s.relieveM, s.id).toBeLessThan(3000);
      expect(s.elevacionM, s.id).toBeGreaterThan(-8000);
      expect(s.elevacionM, s.id).toBeLessThan(0);
      const q = proyectarPolarNorte(s.lon, s.lat); // lon/lat redondeados a 0,001° (~60 m)
      expect(Math.hypot(s.centroM.x - q.x, s.centroM.y - q.y), s.id).toBeLessThan(100);
    }
  });

  it("tamaño total de los DEM menor de 1 MB", () => {
    const total = t.sitios.reduce((n, s) => n + statSync(join(dir, s.dem.archivo)).size, 0);
    expect(total).toBeLessThan(1_000_000);
  });

  it("verificación independiente: identify polar vs DEM global y vs el DEM guardado", () => {
    const dif: Record<string, number> = {};
    for (const s of consulta.sitios) {
      const guardado = t.sitios.find((x) => x.id === s.id)!.elevacionM;
      expect(Math.abs(guardado - s.identifyPolarM), `${s.id} guardado vs identify polar`).toBeLessThanOrEqual(50);
      dif[s.id] = Math.abs(s.identifyPolarM - s.identifyGlobalM);
    }
    // Tres sitios coinciden con el DEM global (MOLA+HRSC) en ≤ 50 m; Chasma Boreale difiere ~69 m (otro producto, documentado)
    for (const id of ["crater-louth", "crater-escorial", "dunas-olympia-undae"]) expect(dif[id], id).toBeLessThanOrEqual(50);
    expect(dif["canon-chasma-boreale"]).toBeLessThan(100);
  });

  it("luz y blindaje quedan pendientes (null), no inventados", () => {
    expect(t.fuente.pendientes).toEqual(["luz", "blindaje"]);
    for (const s of t.sitios) expect([s.puntajes.luz, s.puntajes.blindaje]).toEqual([null, null]);
  });

  it("fuente y fecha presentes, y consulta.json guarda las URLs", () => {
    expect(t.fuente.urls[0]).toMatch(/^https:\/\/trek\.nasa\.gov\/mars\//);
    expect(t.fuente.consultadoEl).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    for (const s of consulta.sitios) {
      expect(s.urlPos).toContain("combinedNom_np");
      expect(s.urlDem).toContain("mola128_mola64_merge_90Nto90S_SimpleC_clon0_NP");
      expect(s.urlDem).not.toContain("bboxSR");
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
