/**
 * data/terreno/luna-visible (Moon Trek) → luna-visible.json con 3 sitios Apolo. Sin red.
 * Elevación = medida (LOLA). Pendiente (radio 1,5 km, igual que Jezero), relieve y puntaje "plano" = DERIVADOS.
 * Luz: SIN fuente verificada → null (pendiente). Blindaje = cielo tapado por el relieve (derivado del DEM de entorno de 40 km, luna-blindaje.ts).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { LUNA_CUADRO, RADIO_LUNA_M, TerrenoLunaSchema, type SitioLuna, type TerrenoLuna } from "../src/terreno";
import { RAIZ } from "./config";
import { ENTORNO, cieloTapadoDe, leerEntorno } from "./luna-blindaje";
import { REGLAS } from "./jezero-curar";

const DIR = join(RAIZ, "terreno", "luna-visible");
const r1 = (x: number) => Math.round(x * 10) / 10;
const r2 = (x: number) => Math.round(x * 100) / 100;

export function curarLuna(): TerrenoLuna {
  const consulta = JSON.parse(readFileSync(join(DIR, "consulta.json"), "utf-8"));
  const n = LUNA_CUADRO.px;
  const entorno = JSON.parse(readFileSync(join(DIR, "entorno.json"), "utf-8"));
  const sitios: SitioLuna[] = consulta.sitios.map((s: any) => {
    const b = readFileSync(join(DIR, s.id, "elevacion.bin"));
    const h = new Int16Array(b.buffer, b.byteOffset, b.length / 2);
    const at = (c: number, f: number) => h[Math.min(n - 1, Math.max(0, f)) * n + Math.min(n - 1, Math.max(0, c))]!;
    const grados = (s.bbox.este - s.bbox.oeste) / n;
    const dy = RADIO_LUNA_M * grados * (Math.PI / 180);
    const dx = dy * Math.cos(s.lat * (Math.PI / 180));
    const pend = (c: number, f: number) => {
      const gx = (at(c + 1, f) - at(c - 1, f)) / (2 * dx);
      const gy = (at(c, f + 1) - at(c, f - 1)) / (2 * dy);
      return (Math.atan(Math.hypot(gx, gy)) * 180) / Math.PI;
    };
    const c0 = Math.floor((s.lon - s.bbox.oeste) / grados);
    const f0 = Math.floor((s.bbox.norte - s.lat) / grados);
    const rc = Math.round(REGLAS.radioPendienteM / dx), rf = Math.round(REGLAS.radioPendienteM / dy);
    let suma = 0, cuenta = 0;
    for (let f = f0 - rf; f <= f0 + rf; f++)
      for (let c = c0 - rc; c <= c0 + rc; c++)
        if (((c - c0) * dx) ** 2 + ((f - f0) * dy) ** 2 <= REGLAS.radioPendienteM ** 2) { suma += pend(c, f); cuenta++; }
    const pendiente = suma / cuenta;
    const es = entorno.sitios.find((x: any) => x.id === s.id);
    const ct = cieloTapadoDe(leerEntorno(DIR, s, { px: entorno.px, bbox: es.bbox }));
    const fraccion = r2(ct.cieloTapado);
    return {
      id: s.id,
      nombreKey: `datos.terreno.sitio.${s.id}.nombre`,
      descripcionKey: `datos.terreno.sitio.${s.id}.descripcion`,
      mision: s.mision,
      lon: s.lon,
      lat: s.lat,
      bbox: s.bbox,
      dem: { archivo: `${s.id}/elevacion.bin`, ancho: n, alto: n, metrosPorPixel: Math.round((dx + dy) / 2) },
      sombreado: `${s.id}/sombreado.jpg`,
      elevacionM: at(c0, f0),
      pendienteGrados: r1(pendiente),
      relieveM: Math.max(...h) - Math.min(...h),
      puntajes: { plano: r2(Math.min(1, Math.max(0, 1 - pendiente / REGLAS.pendienteMaxGrados))), luz: null, blindaje: fraccion },
      cieloTapado: {
        fraccion,
        omegaSr: Math.round(ct.omegaSr * 1e4) / 1e4,
        horizonteMaxGrados: r1(ct.horizonteMaxGrados),
        direcciones: ENTORNO.direcciones,
        radioKm: entorno.radioM / 1000,
        dem: { archivo: `${s.id}/entorno.bin`, ancho: entorno.px, alto: entorno.px, metrosPorPixel: Math.round((2 * entorno.radioM) / entorno.px) },
      },
    };
  });
  return TerrenoLunaSchema.parse({
    version: "0.1.0",
    id: "luna-visible",
    nombreKey: "datos.terreno.lunaVisible.nombre",
    sitios,
    fuente: {
      nombreKey: "fuente.moonTrek",
      dueno: "NASA Moon Trek (JPL); DEM LRO LOLA (NASA); positions: Moon Trek CombinedNomenclature layer (NSSDC)",
      urls: ["https://trek.nasa.gov/moon/"],
      consultadoEl: consulta.consultadoEl,
      estadoDato: "curado",
      derivadoKey: "datos.terreno.derivado",
      pendientes: ["luz"],
      blindajeFuente: {
        metodo: "cieloTapado = 1 − Ω/2π; Ω = Σ (2π/72)(1 − sin h) con h = elevación máxima del horizonte (≥ 0) cada 5° hasta 40 km, DEM LOLA con curvatura lunar",
        cita: "Definición como en NASA GSFC PGDA SKYV: Mazarico, E., et al. (2011), Icarus 211, 1066-1081, doi:10.1016/j.icarus.2010.10.030",
        capa: "LRO_LOLA_DEM_Global_128ppd_v04 (Moon Trek)",
        consultadoEl: entorno.consultadoEl,
      },
    },
  });
}

if (process.argv[1]?.endsWith("luna-curar.ts")) {
  const t = curarLuna();
  writeFileSync(join(DIR, "luna-visible.json"), JSON.stringify(t, null, 2) + "\n");
  for (const s of t.sitios) console.log(`${s.id}: ${s.elevacionM} m, pendiente ${s.pendienteGrados}°, relieve ${s.relieveM} m, plano ${s.puntajes.plano}, blindaje ${s.puntajes.blindaje}`);
}
