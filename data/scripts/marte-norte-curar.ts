/**
 * data/terreno/marte-norte (Mars Trek) → marte-norte.json con 4 sitios del nomenclátor. Sin red.
 * Elevación = medida (MOLA). Pendiente (radio 1,5 km, mismo método que Jezero), relieve y puntaje "plano" = DERIVADOS.
 * La rejilla está en metros (estereográfica polar), así que no se corrige por la latitud.
 * Luz y blindaje: SIN fuente verificada → null (pendiente). No se inventan valores.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { MARTE_NORTE_CUADRO, TerrenoMarteNorteSchema, type SitioMarteNorte, type TerrenoMarteNorte } from "../src/terreno";
import { RAIZ } from "./config";
import { REGLAS } from "./jezero-curar";

const DIR = join(RAIZ, "terreno", "marte-norte");
const r1 = (x: number) => Math.round(x * 10) / 10;
const r2 = (x: number) => Math.round(x * 100) / 100;

export function curarMarteNorte(): TerrenoMarteNorte {
  const consulta = JSON.parse(readFileSync(join(DIR, "consulta.json"), "utf-8"));
  const n = MARTE_NORTE_CUADRO.px;
  const paso = (2 * MARTE_NORTE_CUADRO.medioM) / n;
  const sitios: SitioMarteNorte[] = consulta.sitios.map((s: any) => {
    const b = readFileSync(join(DIR, s.id, "elevacion.bin"));
    const h = new Int16Array(b.buffer, b.byteOffset, b.length / 2);
    const at = (c: number, f: number) => h[Math.min(n - 1, Math.max(0, f)) * n + Math.min(n - 1, Math.max(0, c))]!;
    const pend = (c: number, f: number) => {
      const gx = (at(c + 1, f) - at(c - 1, f)) / (2 * paso);
      const gy = (at(c, f + 1) - at(c, f - 1)) / (2 * paso);
      return (Math.atan(Math.hypot(gx, gy)) * 180) / Math.PI;
    };
    const c0 = Math.floor((s.x - s.bboxM.xmin) / paso);
    const f0 = Math.floor((s.bboxM.ymax - s.y) / paso);
    const rad = Math.round(REGLAS.radioPendienteM / paso);
    let suma = 0, cuenta = 0;
    for (let f = f0 - rad; f <= f0 + rad; f++)
      for (let c = c0 - rad; c <= c0 + rad; c++)
        if (((c - c0) * paso) ** 2 + ((f - f0) * paso) ** 2 <= REGLAS.radioPendienteM ** 2) { suma += pend(c, f); cuenta++; }
    const pendiente = suma / cuenta;
    return {
      id: s.id,
      nombreKey: `datos.terreno.sitio.${s.id}.nombre`,
      descripcionKey: `datos.terreno.sitio.${s.id}.descripcion`,
      nomenclatura: { nombre: s.nombre, tipo: s.tipo, diametroKm: Math.round(s.diametroKm * 10) / 10 },
      lon: Math.round(s.lon * 1000) / 1000,
      lat: Math.round(s.lat * 1000) / 1000,
      centroM: { x: Math.round(s.x), y: Math.round(s.y) },
      bboxM: { xmin: Math.round(s.bboxM.xmin), ymin: Math.round(s.bboxM.ymin), xmax: Math.round(s.bboxM.xmax), ymax: Math.round(s.bboxM.ymax) },
      dem: { archivo: `${s.id}/elevacion.bin`, ancho: n, alto: n, metrosPorPixel: paso },
      elevacionM: at(c0, f0),
      pendienteGrados: r1(pendiente),
      relieveM: Math.max(...h) - Math.min(...h),
      puntajes: { plano: r2(Math.min(1, Math.max(0, 1 - pendiente / REGLAS.pendienteMaxGrados))), luz: null, blindaje: null },
    };
  });
  return TerrenoMarteNorteSchema.parse({
    version: "0.1.0",
    id: "marte-polo-norte",
    nombreKey: "datos.terreno.marteNorte.nombre",
    sitios,
    fuente: {
      nombreKey: "fuente.marsTrek",
      dueno: "NASA Mars Trek (JPL); DEM MOLA (NASA); names and positions: IAU nomenclature, Mars Trek combinedNom_np layer",
      urls: ["https://trek.nasa.gov/mars/"],
      consultadoEl: consulta.consultadoEl,
      estadoDato: "curado",
      derivadoKey: "datos.terreno.derivado",
      pendientes: ["luz", "blindaje"],
    },
  });
}

if (process.argv[1]?.endsWith("marte-norte-curar.ts")) {
  const t = curarMarteNorte();
  writeFileSync(join(DIR, "marte-norte.json"), JSON.stringify(t, null, 2) + "\n");
  for (const s of t.sitios) console.log(`${s.id}: ${s.elevacionM} m, pendiente ${s.pendienteGrados}°, relieve ${s.relieveM} m, plano ${s.puntajes.plano}`);
}
