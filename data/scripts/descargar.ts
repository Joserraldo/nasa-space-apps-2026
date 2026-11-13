/**
 * Descarga DONKI → data/raw/<grupo>/<ENDPOINT>.json (respaldo offline, no en vivo).
 * Uso: npm run descargar [-- <grupo>]
 * La clave sale de NASA_API_KEY (variable de entorno o ../.env). Nunca se imprime ni se guarda.
 * FLR va al servicio directo de CCMC porque api.nasa.gov/DONKI/FLR da 404 (ver samples/README.md).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { leerConfig, RAIZ } from "./config";

function clave(): string {
  if (process.env.NASA_API_KEY) return process.env.NASA_API_KEY;
  const env = join(RAIZ, "..", ".env");
  if (existsSync(env)) {
    const m = /^NASA_API_KEY=(.+)$/m.exec(readFileSync(env, "utf-8"));
    if (m) return m[1].trim().replace(/^"|"$/g, "");
  }
  throw new Error("Falta NASA_API_KEY (variable de entorno o .env en la raíz)");
}

const dias = (a: string, b: string) => (Date.parse(b) - Date.parse(a)) / 86_400_000;

function url(endpoint: string, ini: string, fin: string, key: string): { real: string; publica: string } {
  const q = `startDate=${ini}&endDate=${fin}`;
  if (endpoint === "FLR") {
    const u = `https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR?${q}`;
    return { real: u, publica: u };
  }
  const base = `https://api.nasa.gov/DONKI/${endpoint}?${q}`;
  return { real: `${base}&api_key=${key}`, publica: base };
}

async function main() {
  const solo = process.argv[2];
  const key = clave();
  for (const t of leerConfig().descargas) {
    if (solo && t.grupo !== solo) continue;
    const dir = join(RAIZ, "raw", t.grupo);
    mkdirSync(dir, { recursive: true });
    const consultas: Record<string, string> = {};
    for (const [endpoint, [ini, fin]] of Object.entries(t.ventanas)) {
      if (dias(ini, fin) > 30) throw new Error(`${t.grupo}/${endpoint}: ventana > 30 días`);
      const { real, publica } = url(endpoint, ini, fin, key);
      const r = await fetch(real);
      if (!r.ok) throw new Error(`${t.grupo}/${endpoint}: HTTP ${r.status} en ${publica}`);
      const texto = await r.text();
      const datos = texto.trim() ? JSON.parse(texto) : [];
      writeFileSync(join(dir, `${endpoint}.json`), JSON.stringify(datos) + "\n");
      consultas[endpoint] = publica;
      console.log(`${t.grupo}/${endpoint}: ${Array.isArray(datos) ? datos.length : "?"} registros`);
    }
    const hoy = new Date().toISOString().slice(0, 10);
    writeFileSync(join(dir, "consulta.json"), JSON.stringify({ consultadoEl: hoy, consultas }, null, 2) + "\n");
  }
}

main().catch((e) => {
  console.error(String(e.message ?? e).replaceAll(/api_key=[^&\s]+/g, "api_key=***"));
  process.exit(1);
});
