/**
 * Visibilidad del cielo (NASA GSFC PGDA, LOLA; Mazarico et al. 2011) → data/terreno/luna-polo-sur/cielo.json (estático, no en vivo).
 * Producto SKYV_65S_240M (PDS3, imbrium.mit.edu; 6420×6420, 240 m/px, 65°S–90°S, int16 LSB sin cabecera).
 * Según su .LBL mide el ÁNGULO SÓLIDO del cielo visible desde cada punto, en estereorradianes:
 * ángulo sólido (sr) = DN × 0,0002 + 6,2832; 0 = cielo del todo tapado, 4π = sin obstáculos, 2π = media esfera (suelo llano).
 * Se leen solo las filas del recuadro con HTTP Range (1 petición por cráter, ~0,8 MB) y, para verificar por otro camino,
 * 3 peticiones de 3 píxeles (fila central) con otro recorte. Una petición cada ~2 s. Sin clave.
 * Uso: npm run luna-sur:cielo
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { RAIZ } from "./config";
import { colDe, filaDe } from "./luna-sur-luz";

const DIR = join(RAIZ, "terreno", "luna-polo-sur");
export const ARCHIVO = "SKYV_65S_240M";
export const URL_IMG = `http://imbrium.mit.edu/EXTRAS/ILLUMINATION/IMG/${ARCHIVO}.IMG`;
export const URL_LBL = URL_IMG.replace(".IMG", ".LBL");
const P = { n: 6420, res: 240 };
const FACTOR = 0.0002, OFFSET = 6.2832, DOS_PI = 2 * Math.PI;

/** Fracción del cielo tapada por el relieve respecto a un suelo llano (2π sr): 1 − min(Ω, 2π)/2π. Cimas (Ω > 2π) → 0. */
export const tapado = (omega: number) => 1 - Math.min(omega, DOS_PI) / DOS_PI;
const sr = (dn: number) => dn * FACTOR + OFFSET;

const pausa = () => new Promise((r) => setTimeout(r, 2000));
async function bytes(desde: number, hasta: number): Promise<Buffer> {
  const r = await fetch(URL_IMG, { headers: { Range: `bytes=${desde}-${hasta}` } });
  await pausa();
  if (r.status !== 206) throw new Error(`HTTP ${r.status} (se esperaba 206)`);
  const b = Buffer.from(await r.arrayBuffer());
  if (b.length !== hasta - desde + 1) throw new Error(`tamaño inesperado ${b.length}`);
  return b;
}

async function main() {
  const consulta = JSON.parse(readFileSync(join(DIR, "consulta.json"), "utf-8"));
  const r4 = (x: number) => Math.round(x * 1e4) / 1e4;
  const sitios = [];
  for (const s of consulta.sitios) {
    const b = s.bboxM, px = 64, d = (b.xmax - b.xmin) / px;
    const f0 = filaDe(b.ymax, P), f1 = filaDe(b.ymin, P);
    const buf = await bytes(f0 * P.n * 2, (f1 + 1) * P.n * 2 - 1);
    const a = new Int16Array(buf.buffer, buf.byteOffset, buf.length / 2);
    const dn = (x: number, y: number) => a[(filaDe(y, P) - f0) * P.n + colDe(x, P)]!;
    let sumaOmega = 0, sumaTapado = 0, min = Infinity, max = -Infinity;
    for (let j = 0; j < px; j++)
      for (let i = 0; i < px; i++) {
        const o = sr(dn(b.xmin + (i + 0.5) * d, b.ymax - (j + 0.5) * d));
        sumaOmega += o; sumaTapado += tapado(o); min = Math.min(min, o); max = Math.max(max, o);
      }
    const oc = sr(dn(s.x, s.y));
    // verificación por otro camino: lectura directa de 3 píxeles de la fila central (otro recorte, otra petición)
    const fc = filaDe(s.y, P), cc = colDe(s.x, P);
    const v = await bytes((fc * P.n + cc - 1) * 2, (fc * P.n + cc + 2) * 2 - 1);
    const vv = [0, 1, 2].map((k) => sr(v.readInt16LE(k * 2)));
    sitios.push({
      id: s.id,
      cieloVisibleSr: { centro: r4(oc), media: r4(sumaOmega / (px * px)), minimo: r4(min), maximo: r4(max), pixeles: px * px },
      cieloTapado: { centro: r4(tapado(oc)), media: r4(sumaTapado / (px * px)) },
      verificacion: { centroDirectoSr: r4(vv[1]!), vecinosFilaSr: vv.map(r4) },
    });
    console.log(`${s.id}: Ω centro ${r4(oc)} sr, media ${r4(sumaOmega / px / px)} | tapado centro ${r4(tapado(oc))}, media ${r4(sumaTapado / px / px)} | directo ${r4(vv[1]!)}`);
  }
  writeFileSync(join(DIR, "cielo.json"), JSON.stringify({
    consultadoEl: new Date().toISOString().slice(0, 10),
    cita: "Mazarico, E., et al. (2011), Illumination conditions of the lunar polar regions using LOLA topography, Icarus 211, 1066-1081, doi:10.1016/j.icarus.2010.10.030",
    pagina: "https://pgda.gsfc.nasa.gov/products/69",
    capa: { archivo: ARCHIVO, url: URL_IMG, etiqueta: URL_LBL },
    unidad: "steradian (ángulo sólido del cielo visible; 0 = tapado, 2π = suelo llano, 4π = sin obstáculos)",
    escala: FACTOR, offset: OFFSET, resolucionM: 240, sitios,
  }, null, 2) + "\n");
}
if (process.argv[1]?.endsWith("luna-sur-cielo.ts")) main().catch((e) => { console.error(e); process.exit(1); });
