/**
 * Mide las tormentas curadas desde la Luna con CRaTER (LRO, NASA) vía OSDR RadLab. Sin clave.
 * Para cada tormenta de curated/config.json: baja CRaTER de t0−5 d a t0+3 d → data/raw/luna/<id>.json
 * y aplica la misma regla que RAD en Marte (src/medicion.ts). Escribe data/ciencia/luna.json.
 * Uso: npm run luna            (descarga y calcula)
 *      npm run luna -- --local (solo recalcula desde data/raw/luna, sin red)
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { fondoTranquilo, LunaSchema, type MedicionLuna } from "../src/luna";
import { medirAlrededor } from "../src/medicion";
import { leerConfig, RAIZ } from "./config";

const DIA_MS = 86_400_000;
const RADLAB = "https://visualization.osdr.nasa.gov/radlab/api/";
const Respuesta = z.object({
  columns: z.tuple([z.literal("timestamp"), z.literal("instrument_id"), z.literal("absorbed_dose_rate")]),
  data: z.array(z.tuple([z.string(), z.literal("CRaTER-D1D2"), z.number()])),
});
const iso = (t: number) => new Date(t).toISOString().slice(0, 16);

async function main() {
  const local = process.argv.includes("--local");
  const dir = join(RAIZ, "raw", "luna");
  if (!local) mkdirSync(dir, { recursive: true });
  const mediciones: MedicionLuna[] = [];
  const sinDatos: string[] = [];
  for (const t of leerConfig().tormentas) {
    const curada = JSON.parse(readFileSync(join(RAIZ, "curated", `${t.id}.json`), "utf-8"));
    const t0: string = curada.fases[0].hora;
    const ini = Date.parse(t0);
    const url = `${RADLAB}?instrument_id=CRaTER-D1D2&timestamp>=${iso(ini - 5 * DIA_MS)}&timestamp<${iso(ini + 3 * DIA_MS)}&absorbed_dose_rate>0&format=json`;
    const archivo = join(dir, `${t.id}.json`);
    if (!local) {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`${t.id}: HTTP ${r.status} en ${url}`);
      writeFileSync(archivo, JSON.stringify(Respuesta.parse(await r.json())) + "\n");
    }
    const datos = existsSync(archivo) ? Respuesta.parse(JSON.parse(readFileSync(archivo, "utf-8"))).data : [];
    const muestras = datos.map(([ts, , v]) => [ts, v] as const);
    const m = medirAlrededor(muestras, t0);
    if (!m) {
      sinDatos.push(t.id);
      console.log(`${t.id}: sin datos de CRaTER`);
      continue;
    }
    const porDia = new Map<string, number[]>();
    for (const [ts, v] of muestras) if (Date.parse(`${ts}Z`) < ini) porDia.set(ts.slice(0, 10), [...(porDia.get(ts.slice(0, 10)) ?? []), v]);
    const medias = [...porDia.values()].map((v) => v.reduce((s, x) => s + x, 0) / v.length);
    mediciones.push({ id: t.id, t0, instrumento: "CRaTER-D1D2", unidad: "µGy/h", ...m, fondoTranquilo: fondoTranquilo(medias), url });
    console.log(`${t.id}: fondo ${m.fondo} → pico ${m.pico} µGy/h el ${m.diaPico} (×${m.factor})`);
  }
  const salida = LunaSchema.parse({
    version: "0.1.0",
    consultadoEl: new Date().toISOString().slice(0, 10),
    lugar: "órbita lunar",
    mediciones,
    sinDatos,
  });
  writeFileSync(join(RAIZ, "ciencia", "luna.json"), JSON.stringify(salida, null, 2) + "\n");
}

main().catch((e) => {
  console.error(String(e.message ?? e));
  process.exit(1);
});
