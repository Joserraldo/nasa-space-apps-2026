/**
 * data/terreno/luna-polo-sur (Moon Trek) → luna-polo-sur.json. Sin red.
 * Elevación = medida (LOLA polar 30 m). Pendiente (radio 1,5 km, igual que Jezero y luna-visible), relieve y
 * puntaje "plano" = DERIVADOS. Luz: Moon Trek no tiene capa de iluminación media → null. Blindaje: sin fuente → null.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { LUNA_SUR_CUADRO, TerrenoLunaPoloSurSchema, type SitioLunaSur, type TerrenoLunaPoloSur } from "../src/terreno";
import { RAIZ } from "./config";
import { REGLAS } from "./jezero-curar";

const DIR = join(RAIZ, "terreno", "luna-polo-sur");
const r1 = (x: number) => Math.round(x * 10) / 10;
const r2 = (x: number) => Math.round(x * 100) / 100;

export function curarLunaSur(): TerrenoLunaPoloSur {
  const consulta = JSON.parse(readFileSync(join(DIR, "consulta.json"), "utf-8"));
  const n = LUNA_SUR_CUADRO.px;
  const paso = LUNA_SUR_CUADRO.ladoM / n; // m por píxel (plano en la proyección; escala 1 en el polo, error < 0,1 % a < 3° del polo)
  const sitios: SitioLunaSur[] = consulta.sitios.map((s: any) => {
    const b = readFileSync(join(DIR, s.id, "elevacion.bin"));
    const h = new Int16Array(b.buffer, b.byteOffset, b.length / 2);
    const at = (c: number, f: number) => h[Math.min(n - 1, Math.max(0, f)) * n + Math.min(n - 1, Math.max(0, c))]!;
    const pend = (c: number, f: number) => {
      const gx = (at(c + 1, f) - at(c - 1, f)) / (2 * paso);
      const gy = (at(c, f + 1) - at(c, f - 1)) / (2 * paso);
      return (Math.atan(Math.hypot(gx, gy)) * 180) / Math.PI;
    };
    const c0 = n / 2, f0 = n / 2; // el recuadro está centrado en el sitio
    const rp = Math.round(REGLAS.radioPendienteM / paso);
    let suma = 0, cuenta = 0;
    for (let f = f0 - rp; f <= f0 + rp; f++)
      for (let c = c0 - rp; c <= c0 + rp; c++)
        if (((c - c0) * paso) ** 2 + ((f - f0) * paso) ** 2 <= REGLAS.radioPendienteM ** 2) { suma += pend(c, f); cuenta++; }
    const pendiente = suma / cuenta;
    return {
      id: s.id,
      nombreKey: `datos.terreno.sitio.${s.id}.nombre`,
      descripcionKey: `datos.terreno.sitio.${s.id}.descripcion`,
      nombreIau: s.nombreIau,
      diametroKm: s.diametroKm,
      lon: s.lon,
      lat: s.lat,
      bboxM: s.bboxM,
      dem: { archivo: `${s.id}/elevacion.bin`, ancho: n, alto: n, metrosPorPixel: paso },
      elevacionM: at(c0, f0),
      pendienteGrados: r1(pendiente),
      relieveM: Math.max(...h) - Math.min(...h),
      puntajes: { plano: r2(Math.min(1, Math.max(0, 1 - pendiente / REGLAS.pendienteMaxGrados))), luz: null, blindaje: null },
    };
  });
  return TerrenoLunaPoloSurSchema.parse({
    version: "0.1.0",
    id: "luna-polo-sur",
    nombreKey: "datos.terreno.lunaPoloSur.nombre",
    sitios,
    fuente: {
      nombreKey: "fuente.moonTrek",
      dueno: "NASA Moon Trek (JPL); DEM LRO LOLA polar 30 m (LRO_LOLA_DEM_SPole75_30mp_v04); posiciones: capa CombinedNomenclature de Moon Trek (nomenclátor IAU)",
      urls: ["https://trek.nasa.gov/moon/"],
      consultadoEl: consulta.consultadoEl,
      estadoDato: "curado",
      derivadoKey: "datos.terreno.derivado",
      pendientes: ["luz", "blindaje"],
    },
  });
}

if (process.argv[1]?.endsWith("luna-sur-curar.ts")) {
  const t = curarLunaSur();
  writeFileSync(join(DIR, "luna-polo-sur.json"), JSON.stringify(t, null, 2) + "\n");
  for (const s of t.sitios) console.log(`${s.id}: ${s.elevacionM} m, pendiente ${s.pendienteGrados}°, relieve ${s.relieveM} m, plano ${s.puntajes.plano}`);
}
