/**
 * Iluminación solar media y visibilidad media de la Tierra (NASA GSFC PGDA "Lunar Polar Illumination", LOLA; Mazarico et al. 2011)
 * → data/terreno/luna-polo-sur/luz.json (estático, no en vivo). Sin clave. Una petición cada ~2 s.
 * Productos PDS3 de imbrium.mit.edu (IMG int16 LSB, sin cabecera: el .LBL los describe): AVGVISIB_75S_120M_201608[_EARTH].IMG
 * (7624×7624, 120 m/px) y, para verificar por otro camino, AVGVISIB_65S_240M_201608[_EARTH].IMG (6420×6420, 240 m/px).
 * Valor = DN × 0,00004 (DN 25000 = 1): fracción de los pasos de 1 h (~18,6 años) con Sol (o Tierra) visible; 0 = sombra permanente.
 * Estereográfica polar sur, esfera de 1737,4 km, escala 1 en el polo, x hacia lon 90 E, y hacia lon 0: el píxel 0-based que contiene
 * (x, y) es columna = floor(x/res + N/2), fila = floor(N/2 − y/res). Se leen solo las filas del recuadro con HTTP Range.
 * Uso: npm run luna-sur:luz
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { RAIZ } from "./config";

const DIR = join(RAIZ, "terreno", "luna-polo-sur");
export const BASE_IMG = "http://imbrium.mit.edu/EXTRAS/ILLUMINATION/IMG";
export const ESCALA = 0.00004;
export const PRODUCTOS = {
  "120m": { sol: "AVGVISIB_75S_120M_201608", tierra: "AVGVISIB_75S_120M_201608_EARTH", n: 7624, res: 120 },
  "240m": { sol: "AVGVISIB_65S_240M_201608", tierra: "AVGVISIB_65S_240M_201608_EARTH", n: 6420, res: 240 },
} as const;
type Prod = (typeof PRODUCTOS)[keyof typeof PRODUCTOS];

export const colDe = (x: number, p: { n: number; res: number }) => Math.floor(x / p.res + p.n / 2);
export const filaDe = (y: number, p: { n: number; res: number }) => Math.floor(p.n / 2 - y / p.res);

const pausa = () => new Promise((r) => setTimeout(r, 2000));
/** Lee las filas [f0, f1] completas (int16 LSB) con una petición Range. */
async function filas(archivo: string, n: number, f0: number, f1: number): Promise<Int16Array> {
  const bytes = n * 2;
  const r = await fetch(`${BASE_IMG}/${archivo}.IMG`, { headers: { Range: `bytes=${f0 * bytes}-${(f1 + 1) * bytes - 1}` } });
  await pausa();
  if (r.status !== 206) throw new Error(`HTTP ${r.status} (se esperaba 206) en ${archivo}`);
  const b = Buffer.from(await r.arrayBuffer());
  if (b.length !== (f1 - f0 + 1) * bytes) throw new Error(`tamaño inesperado ${b.length}`);
  return new Int16Array(b.buffer, b.byteOffset, b.length / 2);
}

export interface Medida { centro: number; media: number; maximo: number; minimo: number; pixeles: number }
export async function medir(archivo: string, p: Prod, s: { x: number; y: number; bboxM: { xmin: number; ymin: number; xmax: number; ymax: number } }, px = 128): Promise<Medida> {
  const b = s.bboxM, d = (b.xmax - b.xmin) / px;
  const f0 = filaDe(b.ymax, p), f1 = filaDe(b.ymin, p);
  const datos = await filas(archivo, p.n, f0, f1);
  const v = (x: number, y: number) => {
    const f = filaDe(y, p), c = colDe(x, p);
    return datos[(f - f0) * p.n + c]! * ESCALA;
  };
  let suma = 0, max = 0, min = 1;
  for (let j = 0; j < px; j++)
    for (let i = 0; i < px; i++) {
      const t = v(b.xmin + (i + 0.5) * d, b.ymax - (j + 0.5) * d);
      suma += t; max = Math.max(max, t); min = Math.min(min, t);
    }
  const r4 = (x: number) => Math.round(x * 1e4) / 1e4;
  return { centro: r4(v(s.x, s.y)), media: r4(suma / (px * px)), maximo: r4(max), minimo: r4(min), pixeles: px * px };
}

async function main() {
  const consulta = JSON.parse(readFileSync(join(DIR, "consulta.json"), "utf-8"));
  const sitios = [];
  for (const s of consulta.sitios) {
    const sol = await medir(PRODUCTOS["120m"].sol, PRODUCTOS["120m"], s);
    const tierra = await medir(PRODUCTOS["120m"].tierra, PRODUCTOS["120m"], s);
    const sol240 = await medir(PRODUCTOS["240m"].sol, PRODUCTOS["240m"], s);
    const tierra240 = await medir(PRODUCTOS["240m"].tierra, PRODUCTOS["240m"], s);
    sitios.push({ id: s.id, sol, tierra, verificacion240m: { sol: sol240, tierra: tierra240 } });
    console.log(`${s.id}: Sol centro ${sol.centro} media ${sol.media} máx ${sol.maximo} | Tierra centro ${tierra.centro} media ${tierra.media} | 240 m: Sol ${sol240.centro}/${sol240.media}, Tierra ${tierra240.centro}/${tierra240.media}`);
  }
  const url = (f: string) => `${BASE_IMG}/${f}.IMG`;
  writeFileSync(join(DIR, "luz.json"), JSON.stringify({
    consultadoEl: new Date().toISOString().slice(0, 10),
    cita: "Mazarico, E., et al. (2011), Illumination conditions of the lunar polar regions using LOLA topography, Icarus 211, 1066-1081, doi:10.1016/j.icarus.2010.10.030",
    pagina: "https://pgda.gsfc.nasa.gov/products/69",
    capaSol: { archivo: PRODUCTOS["120m"].sol, url: url(PRODUCTOS["120m"].sol), etiqueta: url(PRODUCTOS["120m"].sol).replace(".IMG", ".LBL") },
    capaTierra: { archivo: PRODUCTOS["120m"].tierra, url: url(PRODUCTOS["120m"].tierra), etiqueta: url(PRODUCTOS["120m"].tierra).replace(".IMG", ".LBL") },
    capaVerificacion: { sol: PRODUCTOS["240m"].sol, tierra: PRODUCTOS["240m"].tierra },
    escala: ESCALA, resolucionM: 120, sitios,
  }, null, 2) + "\n");
}
if (process.argv[1]?.endsWith("luna-sur-luz.ts")) main().catch((e) => { console.error(e); process.exit(1); });
