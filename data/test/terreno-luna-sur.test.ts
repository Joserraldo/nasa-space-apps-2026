import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
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


  it("blindaje queda pendiente (null), no inventado; luz = iluminación solar media del recuadro (PGDA)", () => {
    expect(t.fuente.pendientes).toEqual(["blindaje", "citaHielo"]);
    for (const s of t.sitios) {
      expect(s.puntajes.blindaje).toBeNull();
      expect(s.puntajes.luz).toBe(Math.round(s.iluminacion!.sol.media * 100) / 100);
    }
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

describe("hielo, sombra permanente y frío (Moon Trek)", () => {
  const por = Object.fromEntries(t.sitios.map((s) => [s.id, s.hieloSombra!]));
  it("los 6 sitios traen los tres bloques con capa, fecha y origen", () => {
    for (const s of t.sitios) {
      const h = s.hieloSombra!;
      expect(h, s.id).toBeDefined();
      expect([h.sombraPermanente.capa, h.senalHielo.capa]).toEqual(["PSR_SP", "SP_IceLoc_280m"]);
      expect(h.temperatura.capa).toContain("DIVINER");
      for (const b of [h.sombraPermanente, h.senalHielo, h.temperatura]) {
        expect(b.consultadoEl).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(b.url).toContain("trek.nasa.gov/moon/");
        expect(b.origen).toBe("derivado");
      }
      // instrumento no declarado por el servicio: null, no inventado
      expect(h.sombraPermanente.instrumento).toBeNull();
      expect(h.senalHielo.instrumento).toBeNull();
    }
  });
  it("resultados guardados (consultados el 2026-11-14)", () => {
    expect(Object.fromEntries(t.sitios.map((s) => [s.id, [s.hieloSombra!.sombraPermanente.regionesEnRecuadro, s.hieloSombra!.senalHielo.puntosEnRecuadro]]))).toEqual({
      shackleton: [1, 36], haworth: [0, 20], faustini: [1, 9], malapert: [0, 0], nobile: [0, 0], "de-gerlache": [1, 7],
    });
    expect(por["malapert"]!.temperatura.fraccionBajo110KVerano).toBe(0);
    expect(por["faustini"]!.temperatura.fraccionBajo110KVerano).toBe(1);
  });
  it("sombra permanente LOLA (Mazarico et al. 2011): fracción del recuadro, centro, capa, cita y fecha", () => {
    const f = (id: string) => por[id]!.sombraPermanenteLola!;
    for (const s of t.sitios) {
      const l = f(s.id);
      expect(l.capa).toBe("LRO_LOLA_Illumination_SPole65S_240m_EQ");
      expect(l.instrumento).toBe("LOLA (LRO)");
      expect(l.cita).toContain("Mazarico");
      expect(l.cita).toContain("10.1016/j.icarus.2010.10.030");
      expect(l.origen).toBe("derivado");
      expect(l.consultadoEl).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(l.fraccion).toBeGreaterThanOrEqual(0);
      expect(l.fraccion).toBeLessThanOrEqual(1);
    }
    expect(Object.fromEntries(t.sitios.map((s) => [s.id, [f(s.id).fraccion, f(s.id).centro]]))).toEqual({
      shackleton: [0.886, true], haworth: [0.867, true], faustini: [1, true], malapert: [0.009, false], nobile: [0.203, false], "de-gerlache": [0.684, true],
    });
    // sentido físico: Shackleton y Faustini casi todo en sombra, Malapert casi nada
    expect(f("shackleton").fraccion).toBeGreaterThan(0.5);
    expect(f("faustini").fraccion).toBeGreaterThan(0.5);
    expect(f("malapert").fraccion).toBeLessThan(0.05);
  });
  it("cada texto solo aparece si el dato lo respalda, y existe en es/en", () => {
    for (const s of t.sitios) {
      const h = s.hieloSombra!;
      expect(h.sombraPermanente.textoKey !== null, s.id + " sombra").toBe(h.sombraPermanenteLola!.fraccion > 0.01);
      // SP_IceLoc_280m no tiene cita verificada: el texto de hielo no se asigna a ningún sitio
      expect(h.senalHielo.citaVerificada, s.id).toBe(false);
      expect(h.senalHielo.textoKey, s.id + " hielo").toBeNull();
      expect(h.temperatura.textoKey !== null, s.id + " frío").toBe(h.temperatura.fraccionBajo110KVerano >= 0.01);
      for (const k of [h.sombraPermanente.textoKey, h.senalHielo.textoKey, h.temperatura.textoKey].filter((x): x is string => !!x)) {
        expect(es[k], k).toBeTruthy();
        expect(en[k], k).toBeTruthy();
        expect(en[k], k).not.toMatch(/drink/i);
      }
    }
  });
  it("temperaturas plausibles: mínimos > 0 K y todos < 110 K (la capa solo guarda eso)", () => {
    for (const s of t.sitios) {
      const T = s.hieloSombra!.temperatura;
      for (const m of [T.minimoMaxVeranoK, T.minimoMaxInviernoK]) if (m !== null) { expect(m, s.id).toBeGreaterThan(20); expect(m, s.id).toBeLessThan(110); }
      expect(T.fraccionBajo110KInvierno, s.id).toBeGreaterThanOrEqual(0);
      if (T.fraccionBajo110KVerano > 0) expect(T.minimoMaxVeranoK, s.id).not.toBeNull();
    }
  });
});

describe("DEM lunar guardado sin rellenos", () => {
  it("cada elevacion.bin está dentro del rango real de LOLA (−9126 a 10767 m)", () => {
    const raiz = join(__dirname, "..", "terreno");
    let archivos = 0;
    for (const d of ["luna-visible", "luna-polo-sur"])
      for (const s of readdirSync(join(raiz, d))) {
        const p = join(raiz, d, s, "elevacion.bin");
        if (!existsSync(p)) continue;
        const b = readFileSync(p);
        const a = new Int16Array(b.buffer, b.byteOffset, b.length / 2);
        expect(Math.min(...a), p).toBeGreaterThan(-9200);
        expect(Math.max(...a), p).toBeLessThan(10800);
        archivos++;
      }
    expect(archivos).toBe(9);
  });
});

describe("iluminación solar y visibilidad de la Tierra (NASA GSFC PGDA, LOLA)", () => {
  const por = Object.fromEntries(t.sitios.map((s) => [s.id, s.iluminacion!]));
  const luz = JSON.parse(readFileSync(join(dir, "luz.json"), "utf-8"));
  it("cita, capas, fecha, origen medido y rangos 0–1", () => {
    for (const s of t.sitios) {
      const l = por[s.id]!;
      expect(l.cita).toContain("Mazarico");
      expect(l.cita).toContain("10.1016/j.icarus.2010.10.030");
      expect(l.pagina).toBe("https://pgda.gsfc.nasa.gov/products/69");
      expect(l.capaSol).toBe("AVGVISIB_75S_120M_201608");
      expect(l.capaTierra).toBe("AVGVISIB_75S_120M_201608_EARTH");
      expect(l.urlSol).toMatch(/^http:\/\/imbrium\.mit\.edu\/EXTRAS\/ILLUMINATION\/IMG\/AVGVISIB_75S_120M_201608\.IMG$/);
      expect(l.origen).toBe("medido");
      expect(l.consultadoEl).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      for (const m of [l.sol, l.tierra]) {
        for (const v of [m.centro, m.media, m.maximo, m.minimo]) { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(1); }
        expect(m.minimo).toBeLessThanOrEqual(m.media);
        expect(m.media).toBeLessThanOrEqual(m.maximo);
      }
      expect(l.pctSol).toBe(Math.round(l.sol.media * 100));
    }
  });
  it("sentido físico: Malapert y Nobile mucho más luz que el fondo de Shackleton y Faustini", () => {
    expect(por.malapert!.sol.media).toBeGreaterThan(0.1);
    expect(por.nobile!.sol.media).toBeGreaterThan(0.1);
    expect(por.faustini!.sol.maximo).toBe(0);
    expect(por.shackleton!.sol.centro).toBe(0);
    expect(por.shackleton!.sol.media).toBeLessThan(0.05);
    expect(por.malapert!.sol.media).toBeGreaterThan(por.shackleton!.sol.media * 5);
    // el borde de Shackleton sí recibe luz: el máximo del recuadro supera con mucho al centro
    expect(por.shackleton!.sol.maximo).toBeGreaterThan(0.3);
  });
  it("verificación 240 m coincide con 120 m (media del recuadro, ±0,03)", () => {
    for (const s of luz.sitios) {
      expect(Math.abs(s.verificacion240m.sol.media - s.sol.media), s.id + " sol").toBeLessThan(0.03);
      expect(Math.abs(s.verificacion240m.tierra.media - s.tierra.media), s.id + " tierra").toBeLessThan(0.03);
    }
  });
  it("cada texto solo aparece si el dato lo respalda, y existe en es/en con {pct}", () => {
    for (const s of t.sitios) {
      const l = por[s.id]!;
      expect(l.textoSolKey !== null, s.id + " sol").toBe(l.sol.media >= 0.01);
      expect(l.textoTierraKey !== null, s.id + " tierra").toBe(l.tierra.media >= 0.05);
      for (const k of [l.textoSolKey, l.textoTierraKey].filter((x): x is string => !!x)) {
        expect(es[k], k).toContain("{pct}");
        expect(en[k], k).toContain("{pct}");
      }
    }
    expect(es["fuente.pgda"]).toContain("PGDA");
    expect(en["fuente.pgda"]).toContain("PGDA");
  });
});
