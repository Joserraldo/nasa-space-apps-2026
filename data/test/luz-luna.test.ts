import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { amaneceres, curarLuz, elevacion, leerTabla, subsolar } from "../scripts/luz-luna";
import { luzLunaVisible as l, terrenoLunaVisible as terreno } from "../src";

const raiz = join(__dirname, "..");
const filas = leerTabla(readFileSync(join(raiz, "raw", "svs-5187", "mooninfo_2024.txt"), "utf-8"));
const es: Record<string, string> = JSON.parse(readFileSync(join(raiz, "i18n", "es.json"), "utf-8"));
const en: Record<string, string> = JSON.parse(readFileSync(join(raiz, "i18n", "en.json"), "utf-8"));

describe("luz de la Luna lado visible (SVS 5187, derivado)", () => {
  it("se regenera idéntico desde la tabla cruda", () => {
    expect(JSON.parse(readFileSync(join(raiz, "terreno", "luna-visible", "luz-2024.json"), "utf-8"))).toEqual(curarLuz());
  });

  it("la tabla cubre 2024 hora a hora (8785 filas, hasta 2025-01-01 00:00)", () => {
    expect(filas).toHaveLength(8785);
    expect(l.tabla.filas).toBe(8785);
    for (let i = 1; i < filas.length; i++) expect(filas[i]!.t - filas[i - 1]!.t).toBe(3_600_000);
  });

  it("forma y rangos: 6 tormentas de 2024 x 3 sitios", () => {
    expect(l.tormentas).toHaveLength(6);
    for (const t of l.tormentas) {
      expect(t.id.startsWith("2024-")).toBe(true);
      expect(t.sitios.map((s) => s.sitioId).sort()).toEqual(terreno.sitios.map((s) => s.id).sort());
      for (const s of t.sitios) {
        expect(Math.abs(s.elevacionSolGrados)).toBeLessThanOrEqual(90);
        expect(s.dia).toBe(s.elevacionSolGrados > 0);
        expect(s.proximoAmanecerUtc).toMatch(/^2024-\d\d-\d\dT\d\d:\d\dZ$/);
        expect(Date.parse(s.proximoAmanecerUtc!)).toBeGreaterThan(Date.parse(t.horaUtc));
      }
    }
  });

  it("caso a mano: Apolo 11, 2024-05-10 15:00 UT, fila cruda Slon 153.133 Slat 0.927 -> -39,64°", () => {
    const f = filas.find((x) => x.t === Date.UTC(2024, 4, 10, 15))!;
    expect([f.lon, f.lat]).toEqual([153.133, 0.927]);
    expect(elevacion(0.67416, 23.47314, f)).toBeCloseTo(-39.636, 2); // calculado aparte con Python
  });

  it("la elevación cambia ~0,5°/hora como máximo", () => {
    for (const s of terreno.sitios) {
      let max = 0;
      for (let i = 1; i < filas.length; i++) max = Math.max(max, Math.abs(elevacion(s.lat, s.lon, filas[i]!) - elevacion(s.lat, s.lon, filas[i - 1]!)));
      expect(max, s.id).toBeLessThan(0.62);
    }
  });

  it("los amaneceres caen cada ~29,5 días y la fracción con sol es ~0,5", () => {
    for (const s of l.sitios) {
      const a = s.amaneceres2024Utc.map(Date.parse);
      expect(a.length).toBeGreaterThanOrEqual(12);
      for (let i = 1; i < a.length; i++) expect((a[i]! - a[i - 1]!) / 86_400_000, s.sitioId).toBeGreaterThan(29.2);
      for (let i = 1; i < a.length; i++) expect((a[i]! - a[i - 1]!) / 86_400_000, s.sitioId).toBeLessThan(29.9);
      expect(s.fraccionConSol2024).toBeGreaterThan(0.45);
      expect(s.fraccionConSol2024).toBeLessThan(0.55);
    }
  });

  it("subsolar y amaneceres son coherentes: elevación ~0 en el amanecer", () => {
    const s = terreno.sitios[0]!;
    const [a] = amaneceres(filas, s.lat, s.lon, filas[0]!.t, filas[filas.length - 1]!.t, true);
    expect(Math.abs(elevacion(s.lat, s.lon, subsolar(filas, a!)))).toBeLessThan(0.02);
  });

  it("fuente SVS con URL, fecha y marca de derivado; textos en en y es; luz sigue null", () => {
    expect(l.fuente.urls[0]).toBe("https://svs.gsfc.nasa.gov/5187/");
    expect(l.fuente.consultadoEl).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    for (const k of [l.fuente.nombreKey, l.fuente.derivadoKey, "datos.luz.noche", "datos.luz.dia"]) {
      expect(en[k], k).toBeTruthy();
      expect(es[k], k).toBeTruthy();
    }
    expect(en["fuente.svs"]).toBe("NASA Scientific Visualization Studio (Moon phase and libration 2024)");
    for (const s of terreno.sitios) expect(s.puntajes.luz).toBeNull();
  });
});
