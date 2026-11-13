// Uso: npx tsx agents/evals/correr.ts   (1 pasada por modelo; 60 llamadas reales)
// Lee BAI_API_KEY y BAI_BASE_URL del entorno o de la .env de la raíz. Nunca guarda claves ni cabeceras.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { clasificarConModelo } from "../src/clasificador.js";

const ENV_RAIZ = "D:/José Tellez/Documents/projects/nasa-space-apps-2026/.env";
const MODELOS = ["qwen3.8-flash", "deepseek-v4.1-flash"];

function leerEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  if (existsSync(ENV_RAIZ)) {
    for (const l of readFileSync(ENV_RAIZ, "utf8").split(/\r?\n/)) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(l);
      if (m) env[m[1]!] = m[2]!.replace(/^["']|["']$/g, "");
    }
  }
  for (const k of ["BAI_API_KEY", "BAI_BASE_URL"]) if (process.env[k]) env[k] = process.env[k]!;
  return env;
}

interface Frase { n: number; frase: string; experto: string; accion: string; parametros: Record<string, string> }
const pct = (a: number, b: number) => `${((100 * a) / b).toFixed(1)}%`;
const percentil = (xs: number[], p: number) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.ceil(p * s.length) - 1)]!;
};
const mismos = (a: Record<string, string>, b: Record<string, string>) => {
  const ka = Object.keys(a).sort(), kb = Object.keys(b).sort();
  return ka.length === kb.length && ka.every((k, i) => k === kb[i] && a[k] === b[k]);
};

const env = leerEnv();
if (!env.BAI_API_KEY || !env.BAI_BASE_URL) throw new Error("Falta BAI_API_KEY o BAI_BASE_URL");
const frases = JSON.parse(readFileSync(fileURLToPath(new URL("./frases.json", import.meta.url)), "utf8")) as Frase[];

const resumenes = [];
for (const model of MODELOS) {
  const filas = [];
  for (const f of frases) {
    const t0 = performance.now();
    const r = await clasificarConModelo(f.frase, {
      baseUrl: env.BAI_BASE_URL, apiKey: env.BAI_API_KEY, model, timeoutMs: 15000, // sin recortar: se mide la latencia real
      log: (m) => console.log("  [aviso]", m),
    });
    const ms = Math.round(performance.now() - t0);
    const s = r.salida;
    filas.push({
      n: f.n, frase: f.frase, ms, tokens: r.tokens, valido: r.valido, jsonObject: r.usoJsonObject, error: r.error ?? null,
      obtenido: { experto: s.experto, accion: s.accion, parametros: s.parametros },
      expertoOk: s.experto === f.experto, accionOk: s.accion === f.accion, paramsOk: mismos(s.parametros, f.parametros),
    });
    console.log(`${model} #${f.n} ${ms}ms ${r.valido ? "ok" : "FALLO " + r.error}`);
  }
  const n = filas.length;
  const tk = filas.map((x) => x.tokens).filter((x): x is number => x !== null);
  const fuera = filas.filter((x) => x.n === 18 || x.n === 19);
  resumenes.push({
    model,
    jsonValido: filas.filter((x) => x.valido).length,
    expertoOk: filas.filter((x) => x.expertoOk).length,
    accionOk: filas.filter((x) => x.accionOk).length,
    paramsOk: filas.filter((x) => x.paramsOk).length,
    fueraDeTemaOk: fuera.filter((x) => x.accionOk).length,
    p50ms: percentil(filas.map((x) => x.ms), 0.5),
    p95ms: percentil(filas.map((x) => x.ms), 0.95),
    tokensPromedio: tk.length ? Math.round(tk.reduce((a, b) => a + b, 0) / tk.length) : null,
    usoJsonObject: filas.some((x) => x.jsonObject),
    n, filas,
  });
}

console.log("\n| Modelo | JSON válido | experto | accion | parametros | 18-19 fuera_de_tema | p50 ms | p95 ms | tokens prom |");
console.log("|---|---|---|---|---|---|---|---|---|");
for (const r of resumenes) {
  console.log(`| ${r.model} | ${pct(r.jsonValido, r.n)} | ${pct(r.expertoOk, r.n)} | ${pct(r.accionOk, r.n)} | ${pct(r.paramsOk, r.n)} | ${r.fueraDeTemaOk}/2 | ${r.p50ms} | ${r.p95ms} | ${r.tokensPromedio} |`);
}
const fecha = new Date().toISOString().slice(0, 10);
const salida = fileURLToPath(new URL(`./resultados-${fecha}.json`, import.meta.url));
writeFileSync(salida, JSON.stringify({ fecha, pasadas: 1, resumenes }, null, 1));
console.log("Guardado", salida);
