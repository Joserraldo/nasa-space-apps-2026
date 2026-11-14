/**
 * data/terreno/jezero (Mars Trek) → data/terreno/jezero/jezero.json con 4 sitios candidatos.
 * Sin red. Elevación = medida; pendiente, horizonte y puntajes = DERIVADOS (reglas fijas abajo,
 * explicadas para humanos en docs/science/terreno.md). Las constantes se fijaron antes de ver
 * los resultados y no se ajustan para que "salga bonito".
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { JEZERO, RADIO_MARTE_M, TerrenoSchema, type Sitio, type Terreno } from "../src/terreno";
import { RAIZ } from "./config";

const DIR = join(RAIZ, "terreno", "jezero");

/** Sitios elegidos por el equipo (diseño). Coordenadas en grados E/N. */
export const SITIOS = [
  { id: "llanura-central", lon: 77.7, lat: 18.4 },
  /** Centro del marcador "Perseverance Landing Site" de Mars Trek (bbox 77.3315–77.4597 E, 18.3936–18.5364 N). */
  { id: "cerca-de-perseverance", lon: 77.3956, lat: 18.465 },
  /** Pie de la pared sur: donde el DEM empieza a subir (entre 18,08 y 18,06° N) a 77,75° E. */
  { id: "pie-de-la-pared-sur", lon: 77.75, lat: 18.07 },
  /** Cresta del borde oeste: punto más alto del DEM a 18.45° N entre 77.05 y 77.45° E. */
  { id: "sobre-el-borde-oeste", lon: 77.268, lat: 18.45 },
] as const;

export const REGLAS = {
  radioPendienteM: 1500,
  alcanceHorizonteM: 15000,
  /** plano = 1 − pendiente / 10° */
  pendienteMaxGrados: 10,
  /** luz = 1 − horizonte / 10° (paredes que tapan el Sol al amanecer y al atardecer) */
  horizonteMaxGrados: 10,
  /** blindaje = 0,7 · profundidad relativa en el mapa (más aire encima) + 0,3 · horizonte / 10° (paredes tapan cielo) */
  pesoProfundidad: 0.7,
};

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const r2 = (x: number) => Math.round(x * 100) / 100;
const r1 = (x: number) => Math.round(x * 10) / 10;

export function cargarDem() {
  const b = readFileSync(join(DIR, "elevacion.bin"));
  const h = new Int16Array(b.buffer, b.byteOffset, b.length / 2);
  const { oeste, sur, este, norte, ancho, alto } = JEZERO;
  const gradX = (este - oeste) / ancho;
  const gradY = (norte - sur) / alto;
  const latMedia = ((norte + sur) / 2) * (Math.PI / 180);
  const dy = RADIO_MARTE_M * gradY * (Math.PI / 180);
  const dx = RADIO_MARTE_M * gradX * (Math.PI / 180) * Math.cos(latMedia);
  const at = (c: number, f: number): number => h[Math.min(alto - 1, Math.max(0, f)) * ancho + Math.min(ancho - 1, Math.max(0, c))]!;
  const celda = (lon: number, lat: number) => ({ c: Math.floor((lon - oeste) / gradX), f: Math.floor((norte - lat) / gradY) });
  return { h, at, celda, dx, dy, ancho, alto };
}
type Dem = ReturnType<typeof cargarDem>;

function pendienteCelda(d: Dem, c: number, f: number): number {
  const gx = (d.at(c + 1, f) - d.at(c - 1, f)) / (2 * d.dx);
  const gy = (d.at(c, f + 1) - d.at(c, f - 1)) / (2 * d.dy);
  return (Math.atan(Math.hypot(gx, gy)) * 180) / Math.PI;
}

function pendienteMedia(d: Dem, c0: number, f0: number): number {
  const rc = Math.round(REGLAS.radioPendienteM / d.dx);
  const rf = Math.round(REGLAS.radioPendienteM / d.dy);
  let suma = 0, n = 0;
  for (let f = f0 - rf; f <= f0 + rf; f++)
    for (let c = c0 - rc; c <= c0 + rc; c++)
      if (((c - c0) * d.dx) ** 2 + ((f - f0) * d.dy) ** 2 <= REGLAS.radioPendienteM ** 2) {
        suma += pendienteCelda(d, c, f);
        n++;
      }
  return suma / n;
}

function horizonteMedio(d: Dem, c0: number, f0: number): number {
  const h0 = d.at(c0, f0);
  const dirs: [number, number][] = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
  let suma = 0;
  for (const [sc, sf] of dirs) {
    let max = 0;
    for (let k = 1; ; k++) {
      const dist = Math.hypot(k * sc * d.dx, k * sf * d.dy);
      if (dist > REGLAS.alcanceHorizonteM) break;
      const c = c0 + k * sc, f = f0 + k * sf;
      if (c < 0 || f < 0 || c >= d.ancho || f >= d.alto) break;
      max = Math.max(max, (Math.atan((d.at(c, f) - h0) / dist) * 180) / Math.PI);
    }
    suma += max;
  }
  return suma / dirs.length;
}

export function curarJezero(): Terreno {
  const d = cargarDem();
  const consulta = JSON.parse(readFileSync(join(DIR, "consulta.json"), "utf-8"));
  let minM = Infinity, maxM = -Infinity;
  for (const v of d.h) { minM = Math.min(minM, v); maxM = Math.max(maxM, v); }
  const sitios: Sitio[] = SITIOS.map((s) => {
    const { c, f } = d.celda(s.lon, s.lat);
    const elevacionM = d.at(c, f);
    const pendiente = pendienteMedia(d, c, f);
    const horizonte = horizonteMedio(d, c, f);
    const profundidad = (maxM - elevacionM) / (maxM - minM);
    return {
      id: s.id,
      nombreKey: `datos.terreno.sitio.${s.id}.nombre`,
      descripcionKey: `datos.terreno.sitio.${s.id}.descripcion`,
      lon: s.lon,
      lat: s.lat,
      elevacionM,
      pendienteGrados: r1(pendiente),
      horizonteGrados: r1(horizonte),
      puntajes: {
        plano: r2(clamp01(1 - pendiente / REGLAS.pendienteMaxGrados)),
        luz: r2(clamp01(1 - horizonte / REGLAS.horizonteMaxGrados)),
        blindaje: r2(clamp01(REGLAS.pesoProfundidad * profundidad + (1 - REGLAS.pesoProfundidad) * clamp01(horizonte / REGLAS.horizonteMaxGrados))),
      },
    };
  });
  return TerrenoSchema.parse({
    version: "0.1.0",
    id: "jezero",
    nombreKey: "datos.terreno.jezero.nombre",
    bbox: { oeste: JEZERO.oeste, sur: JEZERO.sur, este: JEZERO.este, norte: JEZERO.norte },
    dem: { archivo: "elevacion.bin", ancho: d.ancho, alto: d.alto, metrosPorPixel: Math.round((d.dx + d.dy) / 2), minM, maxM },
    imagenes: { sombreado: "sombreado.jpg", ctx: consulta.ctx.teselas },
    sitios,
    fuente: {
      nombreKey: "fuente.marsTrek",
      dueno: "NASA Mars Trek (JPL); DEM MOLA (NASA) + HRSC (ESA/DLR); imagen CTX (NASA/JPL/MSSS)",
      urls: ["https://trek.nasa.gov/mars/"],
      consultadoEl: consulta.consultadoEl,
      estadoDato: "curado",
      derivadoKey: "datos.terreno.derivado",
    },
  });
}

if (process.argv[1]?.endsWith("jezero-curar.ts")) {
  const t = curarJezero();
  writeFileSync(join(DIR, "jezero.json"), JSON.stringify(t, null, 2) + "\n");
  console.log(`DEM ${t.dem.minM}..${t.dem.maxM} m, ${t.dem.metrosPorPixel} m/px`);
  for (const s of t.sitios)
    console.log(`${s.id}: ${s.elevacionM} m, pendiente ${s.pendienteGrados}°, horizonte ${s.horizonteGrados}° → plano ${s.puntajes.plano} luz ${s.puntajes.luz} blindaje ${s.puntajes.blindaje}`);
}
