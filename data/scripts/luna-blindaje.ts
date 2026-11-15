/**
 * Blindaje natural DERIVADO de los 3 sitios Apolo = fracción del cielo tapada por el relieve (cálculo propio, sin red en la parte de cálculo).
 * Definición como en el polo sur (NASA GSFC PGDA SKYV; Mazarico et al. 2011): cieloTapado = 1 − Ω/2π, con Ω el ángulo sólido del cielo
 * visible sobre el horizonte local. Aquí Ω se calcula con el DEM LOLA (Moon Trek) de un entorno de ~40 km: horizonte cada 5° (72 direcciones).
 *  - Descarga: npm run luna:blindaje-descargar → <sitio>/entorno.bin (Int16 LE, m) + entorno.json. 1 petición cada ~2 s. Sin clave.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { RADIO_LUNA_M as R } from "../src/terreno";
import { RAIZ } from "./config";

export const ENTORNO = { radioM: 40_000, px: 160, direcciones: 72, pasoM: 250 } as const;
const ARCGIS = "https://trek.nasa.gov/moon/trekarcgis/rest/services";
const DEM = "LRO_LOLA_DEM_Global_128ppd_v04";
const RAD = Math.PI / 180;

export interface Entorno { lat: number; lon: number; bbox: { oeste: number; sur: number; este: number; norte: number }; px: number; h: Int16Array }

/** Cuadro del entorno: ±radio en metros (norte-sur) y el mismo ancho en este-oeste (ajustado por cos(lat)). */
export function cajaEntorno(lat: number, lon: number, radioM: number) {
  const dLat = radioM / (R * RAD), dLon = dLat / Math.cos(lat * RAD);
  return { oeste: lon - dLon, sur: lat - dLat, este: lon + dLon, norte: lat + dLat };
}

function bilineal(e: Entorno, lon: number, lat: number): number {
  const { bbox: b, px } = e;
  const x = ((lon - b.oeste) / (b.este - b.oeste)) * px - 0.5, y = ((b.norte - lat) / (b.norte - b.sur)) * px - 0.5;
  const x0 = Math.max(0, Math.min(px - 2, Math.floor(x))), y0 = Math.max(0, Math.min(px - 2, Math.floor(y)));
  const fx = Math.min(1, Math.max(0, x - x0)), fy = Math.min(1, Math.max(0, y - y0));
  const g = (c: number, f: number) => e.h[f * px + c]!;
  return (g(x0, y0) * (1 - fx) + g(x0 + 1, y0) * fx) * (1 - fy) + (g(x0, y0 + 1) * (1 - fx) + g(x0 + 1, y0 + 1) * fx) * fy;
}

/** Elevación máxima del horizonte (radianes) en el acimut dado, con la curvatura lunar exacta (el terreno cae ≈ d²/2R). */
export function horizonte(e: Entorno, acimutRad: number, radioM: number, pasoM: number): number {
  const h0 = bilineal(e, e.lon, e.lat);
  let max = -Infinity;
  for (let d = pasoM; d <= radioM; d += pasoM) {
    const lat = e.lat + ((d * Math.cos(acimutRad)) / R) / RAD;
    const lon = e.lon + ((d * Math.sin(acimutRad)) / (R * Math.cos(e.lat * RAD))) / RAD;
    const rr = R + bilineal(e, lon, lat), th = d / R;
    max = Math.max(max, Math.atan2(rr * Math.cos(th) - (R + h0), rr * Math.sin(th)));
  }
  return max;
}

/** Ω (sr) del cielo sobre el horizonte local: Σ (2π/N)(1 − sin h), con h < 0 contando 0. */
export function cieloTapadoDe(e: Entorno, direcciones = ENTORNO.direcciones, radioM: number = ENTORNO.radioM, pasoM: number = ENTORNO.pasoM) {
  let omega = 0, hMax = -Infinity, suma = 0;
  for (let k = 0; k < direcciones; k++) {
    const h = Math.max(0, horizonte(e, (2 * Math.PI * k) / direcciones, radioM, pasoM));
    omega += (2 * Math.PI / direcciones) * (1 - Math.sin(h));
    hMax = Math.max(hMax, h); suma += h;
  }
  return { omegaSr: omega, cieloTapado: 1 - omega / (2 * Math.PI), horizonteMaxGrados: hMax / RAD, horizonteMedioGrados: suma / direcciones / RAD };
}

export function leerEntorno(dir: string, s: { id: string; lat: number; lon: number }, meta: { px: number; bbox: Entorno["bbox"] }): Entorno {
  const b = readFileSync(join(dir, s.id, "entorno.bin"));
  return { lat: s.lat, lon: s.lon, bbox: meta.bbox, px: meta.px, h: new Int16Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)) };
}

const pausa = () => new Promise((r) => setTimeout(r, 2000));
export async function descargarEntorno(dirSalida: string, px: number, radioM: number) {
  const consulta = JSON.parse(readFileSync(join(RAIZ, "terreno", "luna-visible", "consulta.json"), "utf-8"));
  const sitios = [];
  for (const s of consulta.sitios) {
    const bbox = cajaEntorno(s.lat, s.lon, radioM);
    const url = `${ARCGIS}/${DEM}/ImageServer/exportImage?bbox=${bbox.oeste},${bbox.sur},${bbox.este},${bbox.norte}&bboxSR=104903&size=${px},${px}&format=bsq&pixelType=F32&interpolation=RSP_BilinearInterpolation&f=image`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`HTTP ${r.status} en ${url}`);
    const crudo = Buffer.from(await r.arrayBuffer());
    await pausa();
    if (crudo.length < px * px * 4) throw new Error(`DEM corto: ${crudo.length} bytes`);
    const m = new Int16Array(px * px);
    for (let i = 0; i < m.length; i++) {
      const v = crudo.readFloatLE(i * 4);
      if (!Number.isFinite(v)) throw new Error(`DEM con huecos en ${s.id}`);
      m[i] = Math.round(v);
    }
    mkdirSync(join(dirSalida, s.id), { recursive: true });
    writeFileSync(join(dirSalida, s.id, "entorno.bin"), Buffer.from(m.buffer));
    sitios.push({ id: s.id, bbox, url });
  }
  writeFileSync(join(dirSalida, "entorno.json"), JSON.stringify({ consultadoEl: new Date().toISOString().slice(0, 10), capa: DEM, radioM, px, unidad: "m", tipo: "Int16LE", sitios }, null, 2) + "\n");
}

if (process.argv[1]?.endsWith("luna-blindaje.ts")) {
  // argumentos opcionales para la verificación: <dirSalida> <px> <radioM>
  const [dir, px, radio] = process.argv.slice(2);
  descargarEntorno(dir ?? join(RAIZ, "terreno", "luna-visible"), Number(px ?? ENTORNO.px), Number(radio ?? ENTORNO.radioM)).then(() => console.log("entorno descargado"), (e) => { console.error(e); process.exit(1); });
}
