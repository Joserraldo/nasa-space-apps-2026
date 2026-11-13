/**
 * Artemis I (NASA, nave Orion, 16 nov – 11 dic 2022): dosis absorbida medida por el instrumento
 * HERA (Artemis-I-HERA-HSU1), vía OSDR RadLab. Sin clave.
 * Escribe data/ciencia/artemis.json con un resumen calculado por código (medianas diarias, pico).
 * Uso: npm run artemis
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { RAIZ } from "./config";

const URL_RADLAB =
  "https://visualization.osdr.nasa.gov/radlab/api/?instrument_id=Artemis-I-HERA-HSU1&absorbed_dose_rate>0&format=json";

const mediana = (v: number[]): number => {
  const s = [...v].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
};
const r2 = (x: number) => Math.round(x * 100) / 100;

export function resumir(data: [string, string, number][], consultadoEl: string) {
  const porDia = new Map<string, number[]>();
  for (const [ts, , v] of data) porDia.set(ts.slice(0, 10), [...(porDia.get(ts.slice(0, 10)) ?? []), v]);
  const dias = [...porDia.keys()].sort();
  // "Viaje normal": todos los días salvo el primero y los dos últimos (despegue y regreso).
  const crucero = dias.slice(1, -2).flatMap((d) => porDia.get(d)!);
  const pico = data.reduce((a, b) => (b[2] > a[2] ? b : a));
  const medianaCrucero = r2(mediana(crucero));
  return {
    version: "0.1.0" as const,
    mision: "Artemis I",
    instrumento: "Artemis-I-HERA-HSU1",
    unidad: "µGy/h" as const,
    magnitud: "dosis absorbida" as const,
    desde: data[0]![0],
    hasta: data[data.length - 1]![0],
    muestras: data.length,
    medianaCrucero,
    pico: { valor: r2(pico[2]), hora: pico[0] },
    vecesPicoSobreCrucero: Math.round(pico[2] / medianaCrucero),
    diario: dias.map((d) => ({ dia: d, mediana: r2(mediana(porDia.get(d)!)), maximo: r2(Math.max(...porDia.get(d)!)) })),
    fuente: {
      nombreKey: "fuente.radlab",
      dueno: "Misión Artemis I (NASA); datos vía NASA OSDR RadLab",
      url: URL_RADLAB,
      consultadoEl,
    },
  };
}

async function main() {
  const r = await fetch(URL_RADLAB);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const d = (await r.json()) as { data: [string, string, number][] };
  const res = resumir(d.data, new Date().toISOString().slice(0, 10));
  writeFileSync(join(RAIZ, "ciencia", "artemis.json"), JSON.stringify(res, null, 2) + "\n");
  console.log(`${res.muestras} muestras, crucero ${res.medianaCrucero} µGy/h, pico ${res.pico.valor} (${res.pico.hora}), ×${res.vecesPicoSobreCrucero}`);
}

if (process.argv[1]?.endsWith("artemis.ts")) main().catch((e) => { console.error(e); process.exit(1); });
