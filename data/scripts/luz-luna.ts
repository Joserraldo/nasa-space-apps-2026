/**
 * Luz de los sitios de luna-visible en 2024: tabla horaria de NASA SVS 5187 (punto subsolar) + fórmula esférica.
 *   sin(e) = sin(φ)·sin(φs) + cos(φ)·cos(φs)·cos(λ − λs)   (horizonte plano; sin montañas, sin disco solar)
 * La tabla es de NASA; la elevación y los amaneceres son DERIVADOS por el equipo. Sin red.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { LuzLunaSchema, type LuzLuna } from "../src/terreno";
import { RAIZ } from "./config";

const TABLA = join(RAIZ, "raw", "svs-5187", "mooninfo_2024.txt");
const MESES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const rad = (g: number) => (g * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
const MIN = 60_000;

export interface Fila { t: number; lat: number; lon: number }

export function leerTabla(texto: string): Fila[] {
  const filas: Fila[] = [];
  for (const l of texto.split("\n").slice(1)) {
    const m = l.match(/^(\d\d) (\w{3}) (\d{4}) (\d\d):(\d\d) UT\s+(.*)$/);
    if (!m) continue;
    const c = m[6]!.trim().split(/\s+/).map(Number);
    // columnas tras la hora: Phase Age Diam Dist RA Dec Slon Slat Elon Elat AxisA
    filas.push({ t: Date.UTC(+m[3]!, MESES.indexOf(m[2]!), +m[1]!, +m[4]!, +m[5]!), lon: c[6]!, lat: c[7]! });
  }
  return filas;
}

/** Interpolación lineal del punto subsolar entre filas horarias (la longitud, sin saltar en ±180°). */
export function subsolar(filas: Fila[], t: number): { lat: number; lon: number } {
  const i = Math.min(filas.length - 2, Math.max(0, Math.floor((t - filas[0]!.t) / (60 * MIN))));
  const a = filas[i]!, b = filas[i + 1]!;
  const f = (t - a.t) / (b.t - a.t);
  let dl = b.lon - a.lon;
  if (dl > 180) dl -= 360;
  if (dl < -180) dl += 360;
  let lon = a.lon + dl * f;
  if (lon > 180) lon -= 360;
  if (lon < -180) lon += 360;
  return { lat: a.lat + (b.lat - a.lat) * f, lon };
}

export function elevacion(lat: number, lon: number, s: { lat: number; lon: number }): number {
  const x = Math.sin(rad(lat)) * Math.sin(rad(s.lat)) + Math.cos(rad(lat)) * Math.cos(rad(s.lat)) * Math.cos(rad(lon - s.lon));
  return deg(Math.asin(Math.max(-1, Math.min(1, x))));
}

/** Instantes (ms) en que la elevación cruza 0° subiendo, entre t0 y t1: paso de 1 min y refinado lineal. */
export function amaneceres(filas: Fila[], lat: number, lon: number, t0: number, t1: number, primero = false): number[] {
  const out: number[] = [];
  let tp = t0, ep = elevacion(lat, lon, subsolar(filas, tp));
  for (let t = t0 + MIN; t <= t1; t += MIN) {
    const e = elevacion(lat, lon, subsolar(filas, t));
    if (ep <= 0 && e > 0) {
      out.push(Math.round(tp + (-ep / (e - ep)) * MIN));
      if (primero) return out;
    }
    tp = t;
    ep = e;
  }
  return out;
}

const iso = (t: number) => new Date(t).toISOString().slice(0, 16) + "Z";
const r2 = (x: number) => Math.round(x * 100) / 100;
const r3 = (x: number) => Math.round(x * 1000) / 1000;

export function curarLuz(): LuzLuna {
  const filas = leerTabla(readFileSync(TABLA, "utf-8"));
  const terreno = JSON.parse(readFileSync(join(RAIZ, "terreno", "luna-visible", "luna-visible.json"), "utf-8"));
  const sitios: { id: string; lat: number; lon: number }[] = terreno.sitios.map((s: any) => ({ id: s.id, lat: s.lat, lon: s.lon }));
  const dirCur = join(RAIZ, "curated");
  const orden: string[] = JSON.parse(readFileSync(join(dirCur, "index.json"), "utf-8")).orden;
  const fin = filas[filas.length - 1]!.t;
  const tormentas = orden
    .filter((id) => id.startsWith("2024-"))
    .sort()
    .map((id) => {
      const c = JSON.parse(readFileSync(join(dirCur, `${id}.json`), "utf-8"));
      const hora: string = c.fases[0].hora; // primera fase, "YYYY-MM-DDTHH:MMZ"
      const t = Date.parse(hora);
      const sub = subsolar(filas, t);
      return {
        id,
        horaUtc: hora,
        sitios: sitios.map((s) => {
          const e = elevacion(s.lat, s.lon, sub);
          const [prox] = amaneceres(filas, s.lat, s.lon, t, fin, true);
          return {
            sitioId: s.id,
            subsolar: { latGrados: r2(sub.lat), lonGrados: r2(sub.lon) },
            elevacionSolGrados: r2(e),
            dia: e > 0,
            proximoAmanecerUtc: prox === undefined ? null : iso(prox),
            horasHastaAmanecer: prox === undefined ? null : r2((prox - t) / (60 * MIN)),
          };
        }),
      };
    });
  const sitiosRes = sitios.map((s) => ({
    sitioId: s.id,
    fraccionConSol2024: r3(filas.filter((f) => elevacion(s.lat, s.lon, f) > 0).length / filas.length),
    amaneceres2024Utc: amaneceres(filas, s.lat, s.lon, filas[0]!.t, fin).map(iso),
  }));
  return LuzLunaSchema.parse({
    version: "0.1.0",
    id: "luz-luna-visible",
    metodo: "sin(e) = sin(lat)*sin(latSun) + cos(lat)*cos(latSun)*cos(lon - lonSun); flat horizon, point-like Sun, hourly table interpolated linearly",
    tabla: { archivo: "raw/svs-5187/mooninfo_2024.txt", filas: filas.length, desde: iso(filas[0]!.t), hasta: iso(fin), columnas: { latSolar: "Slat", lonSolar: "Slon" } },
    tormentas,
    sitios: sitiosRes,
    fuente: {
      nombreKey: "fuente.svs",
      dueno: "NASA Scientific Visualization Studio, SVS 5187 Moon Phase and Libration 2024 (Ernie Wright, NASA/GSFC)",
      urls: ["https://svs.gsfc.nasa.gov/5187/", "https://svs.gsfc.nasa.gov/vis/a000000/a005100/a005187/mooninfo_2024.txt"],
      consultadoEl: "2026-11-14",
      estadoDato: "curado",
      derivadoKey: "datos.luz.derivado",
    },
  });
}

if (process.argv[1]?.endsWith("luz-luna.ts")) {
  const l = curarLuz();
  writeFileSync(join(RAIZ, "terreno", "luna-visible", "luz-2024.json"), JSON.stringify(l, null, 2) + "\n");
  for (const t of l.tormentas)
    for (const s of t.sitios) console.log(`${t.id} ${t.horaUtc} ${s.sitioId}: ${s.dia ? "DIA" : "noche"} e=${s.elevacionSolGrados} prox=${s.proximoAmanecerUtc} (${s.horasHastaAmanecer} h)`);
  for (const s of l.sitios) console.log(s.sitioId, s.fraccionConSol2024, s.amaneceres2024Utc.length);
}
